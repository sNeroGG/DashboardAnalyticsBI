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

    # 1. Órdenes
    domain = [("date_order", ">=", date_from), ("date_order", "<=", date_to)]
    if states: domain.append(("state", "in", states))
    else: domain.append(("state", "!=", "cancel"))
    if users: domain.append(("user_id", "in", [int(u) for u in users]))


    fields = ["id", "name", "date_order", "amount_total", "state", "user_id", "tip_amount", "session_id", "customer_count"]
    orders = odoo.search("pos.order", domain, fields)
    
    if not orders: return {"status": "success", "data": [], "usuarios": [], "metodos": []}

    order_ids = [o["id"] for o in orders]
    
    # 2. Pagos y Propinas
    payments_records = odoo.search("pos.payment", [("pos_order_id", "in", order_ids)], ["pos_order_id", "amount", "payment_method_id"])
    
    tip_lines = odoo.search("pos.order.line", [("order_id", "in", order_ids), ("product_id", "=", 399)], ["order_id", "price_subtotal_incl"])
    order_tips = {}
    for tl in tip_lines:
        oid = get_id(tl.get("order_id"))
        order_tips[oid] = order_tips.get(oid, 0.0) + tl.get("price_subtotal_incl", 0.0)
    
    order_payments = {}
    for p in payments_records:
        oid = get_id(p.get("pos_order_id"))
        order_payments[oid] = order_payments.get(oid, 0.0) + p.get("amount", 0.0)

    # 3. Consolidar
    summary_days = {}
    summary_users = {}
    summary_metodos = {}
    
    for o in orders:
        d_bus = to_business_date(o["date_order"])
        if d_bus not in summary_days:
            summary_days[d_bus] = {
                "fecha": d_bus, "total_cuentas": 0, "total_pagado": 0.0,
                "alimentos": 0.0, "bebidas": 0.0, "propina": 0.0, "otros": 0.0,
                "restaurante_efectivo": 0.0, "tarjeta": 0.0, "total_personas": 0, "sesiones": []
            }
        
        o_id = o["id"]
        
        o_pays = [p for p in payments_records if get_id(p.get("pos_order_id")) == o_id]
        if payments:
            str_payments = [str(x) for x in payments]
            o_pays = [p for p in o_pays if str(get_id(p.get("payment_method_id"))) in str_payments]
            if not o_pays:
                continue

        o_total = sum(p.get("amount", 0.0) for p in o_pays) if payments else order_payments.get(o_id, o.get("amount_total", 0.0))
        o_tip = order_tips.get(o_id, o.get("tip_amount", 0.0))
        if o_total < o_tip and payments:
            o_tip = o_total
        
        summary_days[d_bus]["total_cuentas"] += 1
        summary_days[d_bus]["total_pagado"] += o_total
        summary_days[d_bus]["propina"] += o_tip
        summary_days[d_bus]["alimentos"] += (o_total - o_tip) * 0.7
        summary_days[d_bus]["bebidas"] += (o_total - o_tip) * 0.3
        
        o_personas = o.get("customer_count") or 1 # Fallback a 1 si es 0 o null para no dividir por 0
        summary_days[d_bus]["total_personas"] += o_personas
        
        # CLASIFICACIÓN BASADA EN TUS IDs REALES
        if not o_pays and not payments:
             summary_days[d_bus]["restaurante_efectivo"] += o_total
             # Metodos Global
             pm_name = "Efectivo"
             summary_metodos[pm_name] = summary_metodos.get(pm_name, 0.0) + o_total
        else:
            for pr in o_pays:
                pm_id = str(get_id(pr.get("payment_method_id")))
                pm_name = payment_map.get(pm_id, f"Metodo {pm_id}")
                pm_amount = pr.get("amount", 0.0)
                # Global
                summary_metodos[pm_name] = summary_metodos.get(pm_name, 0.0) + pm_amount
                
                # REGLA ORO HERRADURA: ID 2 es Tarjeta. Lo demás es Efectivo/Caja.
                if pm_id == "2":
                    summary_days[d_bus]["tarjeta"] += pm_amount
                else:
                    summary_days[d_bus]["restaurante_efectivo"] += pm_amount

        # USUARIOS
        uid_str = str(get_id(o.get("user_id")))
        u_name = user_map.get(uid_str) or (o.get("user_id")[1] if isinstance(o.get("user_id"), list) else "Cajero General")
        if u_name not in summary_users:
            summary_users[u_name] = {"nombre": u_name, "cuentas": 0, "ventas": 0.0}
        summary_users[u_name]["cuentas"] += 1
        summary_users[u_name]["ventas"] += o_total

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
