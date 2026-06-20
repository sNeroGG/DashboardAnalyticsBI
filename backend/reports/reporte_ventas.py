from datetime import datetime, timedelta
import json
import os

def to_business_date(date_str):
    date_str = date_str.replace("T", " ")[:19]
    dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
    dt_local = dt - timedelta(hours=6)
    if dt_local.hour < 4:
        dt_local = dt_local - timedelta(days=1)
    return dt_local.strftime("%Y-%m-%d")

def get_id(val):
    if not val: return None
    if isinstance(val, (list, tuple)) and len(val) > 0:
        return get_id(val[0])
    if isinstance(val, dict):
        return val.get("id") or val.get("ID")
    return val

def generate_report(odoo, date_from, date_to, users=None, payments=None, groups=None, states=None):
    # CARGA DE MAESTROS - LOCALIZACIÓN ULTRA-ROBUSTA
    masters = {}
    master_locations = ["cache/masters.json", "/app/cache/masters.json", "backend/cache/masters.json"]
    for loc in master_locations:
        if os.path.exists(loc):
            with open(loc, "r", encoding="utf-8") as f:
                masters = json.load(f)
            break
            
    # Mapeo de IDs (tus IDs reales sacados de masters.json)
    user_map = {str(u["id"]): u["name"] for u in masters.get("res.users", [])}
    payment_map = {str(p["id"]): p["name"] for p in masters.get("pos.payment.method", [])}

    # Detección dinámica de campos en pos.order
    base_fields = ["id", "name", "date_order", "amount_total", "state", "user_id", "tip_amount", "session_id", "customer_count"]
    order_creator_fields = []
    try:
        odoo.search("pos.order", [("id", "=", 0)], ["order_creator_id", "order_creator_name"])
        order_creator_fields = ["order_creator_id", "order_creator_name"]
    except Exception:
        try:
            odoo.search("pos.order", [("id", "=", 0)], ["order_creator_id"])
            order_creator_fields = ["order_creator_id"]
        except Exception:
            try:
                odoo.search("pos.order", [("id", "=", 0)], ["order_creator_name"])
                order_creator_fields = ["order_creator_name"]
            except Exception:
                pass
    order_fields = base_fields + order_creator_fields

    # Detección dinámica de product_group en pos.category
    has_product_group = False
    try:
        odoo.search("pos.category", [("id", "=", 0)], ["product_group"])
        has_product_group = True
    except Exception:
        pass

    # Detección dinámica del campo de categoría de producto (pos_categ_ids en Odoo 17+ o pos_categ_id en anteriores)
    product_category_field = "pos_categ_id"
    try:
        odoo.search("product.product", [("id", "=", 0)], ["pos_categ_ids"])
        product_category_field = "pos_categ_ids"
    except Exception:
        pass

    # Carga de categorías de punto de venta (pos.category)
    categories = []
    try:
        if has_product_group:
            categories = odoo.search("pos.category", [], ["id", "name", "product_group"])
        else:
            categories = odoo.search("pos.category", [], ["id", "name"])
    except Exception as e:
        print(f"Error querying pos.category: {e}")

    category_groups = {}
    for c in categories:
        group = c.get("product_group") if has_product_group else None
        if isinstance(group, list) and len(group) > 1:
            group = group[1]
        category_groups[c["id"]] = group or c.get("name") or "Otros"

    # 1. Órdenes
    domain = [("date_order", ">=", date_from), ("date_order", "<=", date_to)]
    if states: domain.append(("state", "in", states))
    else: domain.append(("state", "!=", "cancel"))
    
    if users:
        if "order_creator_id" in order_creator_fields:
            domain.append(("order_creator_id", "in", [int(u) for u in users]))
        else:
            domain.append(("user_id", "in", [int(u) for u in users]))

    orders = odoo.search("pos.order", domain, order_fields)
    
    if not orders: return {"status": "success", "data": [], "usuarios": [], "metodos": []}

    order_ids = [o["id"] for o in orders]
    
    # 2. Pagos y Líneas de Venta (para propinas y categorías reales)
    payments_records = odoo.search("pos.payment", [("pos_order_id", "in", order_ids)], ["pos_order_id", "amount", "payment_method_id"])
    
    lines_records = []
    product_to_category = {}
    try:
        lines_records = odoo.search("pos.order.line", [("order_id", "in", order_ids)], ["order_id", "product_id", "price_subtotal_incl"])
        product_ids = list(set(get_id(line.get("product_id")) for line in lines_records if line.get("product_id")))
        if product_ids:
            rpc_user = os.environ.get("ODOO_RPC_USER")
            rpc_key = os.environ.get("ODOO_RPC_KEY")
            
            queried_via_rpc = False
            if rpc_user and rpc_key:
                try:
                    import xmlrpc.client
                    base_url = odoo.url
                    if base_url.endswith("/api"):
                        base_url = base_url[:-4]
                    
                    common = xmlrpc.client.ServerProxy(f"{base_url}/xmlrpc/2/common")
                    uid = common.authenticate(odoo.db, rpc_user, rpc_key, {})
                    if uid:
                        models = xmlrpc.client.ServerProxy(f"{base_url}/xmlrpc/2/object")
                        products_data = models.execute_kw(
                            odoo.db, uid, rpc_key, 
                            "product.product", "search_read", 
                            [[("id", "in", product_ids)]], 
                            {"fields": ["id", "pos_categ_ids"]}
                        )
                        for p in products_data:
                            product_to_category[p["id"]] = get_id(p.get("pos_categ_ids"))
                        queried_via_rpc = True
                except Exception as rpc_err:
                    print(f"Error querying product categories via XML-RPC: {rpc_err}")
            
            if not queried_via_rpc:
                products = odoo.search("product.product", [("id", "in", product_ids)], ["id", product_category_field])
                for p in products:
                    product_to_category[p["id"]] = get_id(p.get(product_category_field))
    except Exception as e:
        print(f"Error loading lines/product categories: {e}")

    # Agrupar propinas (producto 399) y pagos
    order_tips = {}
    for l in lines_records:
        pid = get_id(l.get("product_id"))
        if pid == 399:
            oid = get_id(l.get("order_id"))
            order_tips[oid] = order_tips.get(oid, 0.0) + l.get("price_subtotal_incl", 0.0)
            
    order_payments = {}
    for p in payments_records:
        oid = get_id(p.get("pos_order_id"))
        order_payments[oid] = order_payments.get(oid, 0.0) + p.get("amount", 0.0)

    # Agrupar líneas por orden
    order_lines_map = {}
    for l in lines_records:
        oid = get_id(l.get("order_id"))
        if oid not in order_lines_map:
            order_lines_map[oid] = []
        order_lines_map[oid].append(l)

    # Mapeo de grupos de productos del filtro
    has_group_filter = bool(groups and len(groups) > 0)
    groups_set = set(groups) if has_group_filter else set()

    # 3. Consolidar
    summary_days = {}
    summary_users = {}
    summary_metodos = {}
    
    for o in orders:
        o_id = o["id"]
        o_lines = order_lines_map.get(o_id, [])

        # Si hay filtro de grupos de producto, filtrar líneas y omitir orden si no tiene coincidencias
        if has_group_filter:
            o_lines = [
                l for l in o_lines 
                if category_groups.get(product_to_category.get(get_id(l.get("product_id")))) in groups_set
            ]
            if not o_lines:
                continue

        d_bus = to_business_date(o["date_order"])
        if d_bus not in summary_days:
            summary_days[d_bus] = {
                "fecha": d_bus, "total_cuentas": 0, "total_pagado": 0.0,
                "alimentos": 0.0, "bebidas": 0.0, "propina": 0.0, "otros": 0.0,
                "restaurante_efectivo": 0.0, "tarjeta": 0.0, "total_personas": 0, "sesiones": []
            }
        
        o_pays = [p for p in payments_records if get_id(p.get("pos_order_id")) == o_id]
        if payments:
            str_payments = [str(x) for x in payments]
            o_pays = [p for p in o_pays if str(get_id(p.get("payment_method_id"))) in str_payments]
            if not o_pays:
                continue

        # Si el filtro de grupos de categoría está activo, el total facturado del ticket es la suma de las líneas coincidentes
        if has_group_filter:
            o_total = sum(l.get("price_subtotal_incl", 0.0) for l in o_lines)
            o_tip = 0.0
        else:
            o_total = sum(p.get("amount", 0.0) for p in o_pays) if payments else order_payments.get(o_id, o.get("amount_total", 0.0))
            o_tip = order_tips.get(o_id, o.get("tip_amount", 0.0))
            if o_total < o_tip and payments:
                o_tip = o_total
        
        # Desglose real de alimentos, bebidas y otros
        o_alimentos = 0.0
        o_bebidas = 0.0
        o_otros = 0.0
        
        for l in o_lines:
            pid = get_id(l.get("product_id"))
            if pid == 399: # Omitir propina
                continue
            amount = l.get("price_subtotal_incl", 0.0)
            cat_id = product_to_category.get(pid)
            group = category_groups.get(cat_id, "Otros") if cat_id else "Otros"
            
            group_lower = str(group).lower()
            if group_lower == "food" or "alimento" in group_lower or "comida" in group_lower:
                o_alimentos += amount
            elif group_lower == "drink" or "bebida" in group_lower or "trago" in group_lower:
                o_bebidas += amount
            else:
                o_otros += amount

        # Respaldo si no hay líneas (ej. error de Odoo)
        if not o_lines:
            o_alimentos = (o_total - o_tip) * 0.7
            o_bebidas = (o_total - o_tip) * 0.3
            o_otros = 0.0

        summary_days[d_bus]["total_cuentas"] += 1
        summary_days[d_bus]["total_pagado"] += o_total
        summary_days[d_bus]["propina"] += o_tip
        summary_days[d_bus]["alimentos"] += o_alimentos
        summary_days[d_bus]["bebidas"] += o_bebidas
        summary_days[d_bus]["otros"] += o_otros
        
        o_personas = o.get("customer_count") or 1
        summary_days[d_bus]["total_personas"] += o_personas
        
        if not o_pays and not payments:
             summary_days[d_bus]["restaurante_efectivo"] += o_total
             pm_name = "Efectivo"
             summary_metodos[pm_name] = summary_metodos.get(pm_name, 0.0) + o_total
        else:
            for pr in o_pays:
                pm_id = str(get_id(pr.get("payment_method_id")))
                pm_name = payment_map.get(pm_id, f"Metodo {pm_id}")
                pm_amount = pr.get("amount", 0.0)
                summary_metodos[pm_name] = summary_metodos.get(pm_name, 0.0) + pm_amount
                if pm_id == "2":
                    summary_days[d_bus]["tarjeta"] += pm_amount
                else:
                    summary_days[d_bus]["restaurante_efectivo"] += pm_amount

        # VENDEDOR (order_creator_name o order_creator_id con fallback a user_id)
        vendedor_name = None
        if "order_creator_name" in order_creator_fields:
            vendedor_name = o.get("order_creator_name")
            
        if not vendedor_name and "order_creator_id" in order_creator_fields:
            creator_id_val = o.get("order_creator_id")
            if creator_id_val:
                if isinstance(creator_id_val, list) and len(creator_id_val) > 1:
                    vendedor_name = creator_id_val[1]
                else:
                    cid_str = str(get_id(creator_id_val))
                    vendedor_name = user_map.get(cid_str) or f"Vendedor {cid_str}"
                    
        if not vendedor_name:
            uid_str = str(get_id(o.get("user_id")))
            vendedor_name = user_map.get(uid_str) or (o.get("user_id")[1] if isinstance(o.get("user_id"), list) else "Cajero General")

        if vendedor_name not in summary_users:
            summary_users[vendedor_name] = {"nombre": vendedor_name, "cuentas": 0, "ventas": 0.0}
        summary_users[vendedor_name]["cuentas"] += 1
        summary_users[vendedor_name]["ventas"] += o_total

        # SESIONES
        s_val = o.get("session_id")
        s_id = get_id(s_val) or 0
        raw_name = s_val[1] if isinstance(s_val, list) and len(s_val) > 1 else str(s_id)
        s_name = f'SESION "{raw_name}"'
        
        session_idx = next((i for i, s in enumerate(summary_days[d_bus]["sesiones"]) if s["id"] == s_id), -1)
        if session_idx == -1:
            summary_days[d_bus]["sesiones"].append({
                "id": s_id,
                "name": s_name,
                "total_cuentas": 0,
                "total_pagado": 0.0,
                "propina": 0.0,
                "desglose": [],
                "cuentas": []
            })
            session_idx = len(summary_days[d_bus]["sesiones"]) - 1
            
        summary_days[d_bus]["sesiones"][session_idx]["total_cuentas"] += 1
        summary_days[d_bus]["sesiones"][session_idx]["total_pagado"] += o_total
        summary_days[d_bus]["sesiones"][session_idx]["propina"] += o_tip
        summary_days[d_bus]["sesiones"][session_idx]["cuentas"].append({
            "id": o_id,
            "nombre": o["name"],
            "propina": o_tip,
            "total": o_total,
            "personas": o_personas,
            "ticket_promedio_persona": o_total / o_personas if o_personas > 0 else o_total,
            "estado": o.get("state")
        })

    # Formatear respuesta
    report_list = sorted(list(summary_days.values()), key=lambda x: x["fecha"])
    
    # Calcular promedio por persona por día
    for day in report_list:
        if day["total_personas"] > 0:
            day["ticket_promedio_persona"] = day["total_pagado"] / day["total_personas"]
        else:
            day["ticket_promedio_persona"] = 0.0

    usuarios_list = sorted(list(summary_users.values()), key=lambda x: x["ventas"], reverse=True)
    
    return {
        "status": "success",
        "data": report_list,
        "usuarios": usuarios_list,
        "metodos": [{"metodo": k, "monto": v} for k, v in summary_metodos.items()]
    }

def generate_active_sessions_report(odoo):
    # 1. CARGA DE MAESTROS - LOCALIZACIÓN ULTRA-ROBUSTA
    masters = {}
    master_locations = ["cache/masters.json", "/app/cache/masters.json", "backend/cache/masters.json"]
    for loc in master_locations:
        if os.path.exists(loc):
            with open(loc, "r", encoding="utf-8") as f:
                masters = json.load(f)
            break
            
    # Mapeo de IDs (tus IDs reales sacados de masters.json)
    user_map = {str(u["id"]): u["name"] for u in masters.get("res.users", [])}
    payment_map = {str(p["id"]): p["name"] for p in masters.get("pos.payment.method", [])}

    # Detección dinámica de campos en pos.order
    base_fields = ["id", "name", "date_order", "amount_total", "state", "user_id", "tip_amount", "session_id", "customer_count"]
    order_creator_fields = []
    try:
        odoo.search("pos.order", [("id", "=", 0)], ["order_creator_id", "order_creator_name"])
        order_creator_fields = ["order_creator_id", "order_creator_name"]
    except Exception:
        try:
            odoo.search("pos.order", [("id", "=", 0)], ["order_creator_id"])
            order_creator_fields = ["order_creator_id"]
        except Exception:
            try:
                odoo.search("pos.order", [("id", "=", 0)], ["order_creator_name"])
                order_creator_fields = ["order_creator_name"]
            except Exception:
                pass
    order_fields = base_fields + order_creator_fields

    # Detección dinámica de product_group en pos.category
    has_product_group = False
    try:
        odoo.search("pos.category", [("id", "=", 0)], ["product_group"])
        has_product_group = True
    except Exception:
        pass

    # Detección dinámica del campo de categoría de producto (pos_categ_ids en Odoo 17+ o pos_categ_id en anteriores)
    product_category_field = "pos_categ_id"
    try:
        odoo.search("product.product", [("id", "=", 0)], ["pos_categ_ids"])
        product_category_field = "pos_categ_ids"
    except Exception:
        pass

    # Carga de categorías de punto de venta (pos.category)
    categories = []
    try:
        if has_product_group:
            categories = odoo.search("pos.category", [], ["id", "name", "product_group"])
        else:
            categories = odoo.search("pos.category", [], ["id", "name"])
    except Exception as e:
        print(f"Error querying pos.category: {e}")

    category_groups = {}
    for c in categories:
        group = c.get("product_group") if has_product_group else None
        if isinstance(group, list) and len(group) > 1:
            group = group[1]
        category_groups[c["id"]] = group or c.get("name") or "Otros"

    # Buscar sesiones abiertas
    sessions = odoo.search("pos.session", [("state", "=", "opened")], ["id", "name", "start_at", "user_id"])
    if not sessions:
        return {"status": "success", "sessions": []}

    # Cargar nombres de usuarios en tiempo real para evitar "Cajero Desconocido"
    user_ids = []
    for s in sessions:
        uid = get_id(s.get("user_id"))
        if uid:
            user_ids.append(uid)
            
    real_users = {}
    if user_ids:
        try:
            users_data = odoo.search("res.users", [("id", "in", list(set(user_ids)))], ["id", "login", "name", "partner_id"])
            for u in users_data:
                u_id = u["id"]
                u_name = u.get("login") or u.get("name")
                if not u_name and "partner_id" in u:
                    pid = u["partner_id"]
                    if isinstance(pid, list) and len(pid) > 1:
                        u_name = pid[1]
                    elif isinstance(pid, dict) and "name" in pid:
                        u_name = pid["name"]
                real_users[str(u_id)] = u_name or f"Usuario {u_id}"
        except Exception as e:
            print(f"Error querying active sessions user names: {e}")

    session_ids = [s["id"] for s in sessions]
    
    # Buscar órdenes de estas sesiones
    orders = odoo.search("pos.order", [("session_id", "in", session_ids), ("state", "!=", "cancel")], order_fields)
    
    order_ids = [o["id"] for o in orders]
    
    payments_records = []
    lines_records = []
    product_to_category = {}
    if order_ids:
        payments_records = odoo.search("pos.payment", [("pos_order_id", "in", order_ids)], ["pos_order_id", "amount", "payment_method_id"])
        
        try:
            lines_records = odoo.search("pos.order.line", [("order_id", "in", order_ids)], ["order_id", "product_id", "price_subtotal_incl"])
            product_ids = list(set(get_id(line.get("product_id")) for line in lines_records if line.get("product_id")))
            if product_ids:
                rpc_user = os.environ.get("ODOO_RPC_USER")
                rpc_key = os.environ.get("ODOO_RPC_KEY")
                
                queried_via_rpc = False
                if rpc_user and rpc_key:
                    try:
                        import xmlrpc.client
                        base_url = odoo.url
                        if base_url.endswith("/api"):
                            base_url = base_url[:-4]
                        
                        common = xmlrpc.client.ServerProxy(f"{base_url}/xmlrpc/2/common")
                        uid = common.authenticate(odoo.db, rpc_user, rpc_key, {})
                        if uid:
                            models = xmlrpc.client.ServerProxy(f"{base_url}/xmlrpc/2/object")
                            products_data = models.execute_kw(
                                odoo.db, uid, rpc_key, 
                                "product.product", "search_read", 
                                [[("id", "in", product_ids)]], 
                                {"fields": ["id", "pos_categ_ids"]}
                            )
                            for p in products_data:
                                product_to_category[p["id"]] = get_id(p.get("pos_categ_ids"))
                            queried_via_rpc = True
                    except Exception as rpc_err:
                        print(f"Error querying categories via XML-RPC in active sessions: {rpc_err}")
                
                if not queried_via_rpc:
                    products = odoo.search("product.product", [("id", "in", product_ids)], ["id", product_category_field])
                    for p in products:
                        product_to_category[p["id"]] = get_id(p.get(product_category_field))
        except Exception as e:
            print(f"Error loading lines/product categories in active sessions: {e}")

    # Agrupar propinas (producto 399) y pagos
    order_tips = {}
    for l in lines_records:
        pid = get_id(l.get("product_id"))
        if pid == 399:
            oid = get_id(l.get("order_id"))
            order_tips[oid] = order_tips.get(oid, 0.0) + l.get("price_subtotal_incl", 0.0)
            
    order_payments = {}
    for p in payments_records:
        oid = get_id(p.get("pos_order_id"))
        order_payments[oid] = order_payments.get(oid, 0.0) + p.get("amount", 0.0)

    # Agrupar líneas por orden
    order_lines_map = {}
    for l in lines_records:
        oid = get_id(l.get("order_id"))
        if oid not in order_lines_map:
            order_lines_map[oid] = []
        order_lines_map[oid].append(l)

    # Inicializar reporte de cada sesión activa
    session_reports = {}
    for s in sessions:
        s_id = s["id"]
        s_user = s.get("user_id")
        
        # Extracción súper-robusta de nombre de usuario del cajero (priorizando login/username real de la base de datos)
        cashier_name = None
        uid = get_id(s_user)
        if uid:
            cashier_name = real_users.get(str(uid)) or user_map.get(str(uid))
            
        if not cashier_name and s_user:
            if isinstance(s_user, (list, tuple)) and len(s_user) > 1 and isinstance(s_user[1], str):
                cashier_name = s_user[1]
                
        if not cashier_name and uid:
            cashier_name = f"Usuario {uid}"
            
        if not cashier_name:
            cashier_name = "Cajero Desconocido"
        
        session_reports[s_id] = {
            "id": s_id,
            "name": f'SESION "{s["name"]}"',
            "cashier": cashier_name,
            "start_at": s.get("start_at"),
            "total_cuentas": 0,
            "total_pagado": 0.0,
            "alimentos": 0.0,
            "bebidas": 0.0,
            "propina": 0.0,
            "otros": 0.0,
            "restaurante_efectivo": 0.0,
            "tarjeta": 0.0,
            "cuentas": []
        }

    # Procesar órdenes
    for o in orders:
        o_id = o["id"]
        s_val = o.get("session_id")
        s_id = get_id(s_val) or 0
        
        if s_id not in session_reports:
            continue
            
        o_lines = order_lines_map.get(o_id, [])
        o_total = order_payments.get(o_id, o.get("amount_total", 0.0))
        o_tip = order_tips.get(o_id, o.get("tip_amount", 0.0))
        if o_total < o_tip:
            o_tip = o_total
            
        o_alimentos = 0.0
        o_bebidas = 0.0
        o_otros = 0.0
        
        for l in o_lines:
            pid = get_id(l.get("product_id"))
            if pid == 399:
                continue
            amount = l.get("price_subtotal_incl", 0.0)
            cat_id = product_to_category.get(pid)
            group = category_groups.get(cat_id, "Otros") if cat_id else "Otros"
            group_lower = str(group).lower()
            
            if group_lower == "food" or "alimento" in group_lower or "comida" in group_lower:
                o_alimentos += amount
            elif group_lower == "drink" or "bebida" in group_lower or "trago" in group_lower:
                o_bebidas += amount
            else:
                o_otros += amount
                
        if not o_lines:
            o_alimentos = (o_total - o_tip) * 0.7
            o_bebidas = (o_total - o_tip) * 0.3
            o_otros = 0.0

        o_personas = o.get("customer_count") or 1
        
        session_reports[s_id]["total_cuentas"] += 1
        session_reports[s_id]["total_pagado"] += o_total
        session_reports[s_id]["propina"] += o_tip
        session_reports[s_id]["alimentos"] += o_alimentos
        session_reports[s_id]["bebidas"] += o_bebidas
        session_reports[s_id]["otros"] += o_otros
        
        o_pays = [p for p in payments_records if get_id(p.get("pos_order_id")) == o_id]
        if not o_pays:
            session_reports[s_id]["restaurante_efectivo"] += o_total
        else:
            for pr in o_pays:
                pm_id = str(get_id(pr.get("payment_method_id")))
                pm_amount = pr.get("amount", 0.0)
                if pm_id == "2":
                    session_reports[s_id]["tarjeta"] += pm_amount
                else:
                    session_reports[s_id]["restaurante_efectivo"] += pm_amount
                    
        session_reports[s_id]["cuentas"].append({
            "id": o_id,
            "nombre": o["name"],
            "propina": o_tip,
            "total": o_total,
            "personas": o_personas,
            "ticket_promedio_persona": o_total / o_personas if o_personas > 0 else o_total,
            "estado": o.get("state")
        })

    return {
        "status": "success",
        "sessions": list(session_reports.values())
    }

