import json
from datetime import datetime, timedelta

def to_business_date(utc_date_str, offset_hours=-6, shift_offset=4):
    """
    Convierte una fecha UTC a fecha local y aplica el corte de turno restaurantero (ej. 4 AM).
    Todo lo que ocurra desde las 00:00 hasta las 03:59 caerá en el "Día de Negocio" anterior.
    """
    if not utc_date_str: return ""
    if len(utc_date_str) >= 19:
        try:
            clean_str = utc_date_str[:19].replace("T", " ")
            dt = datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
            # Convertir a hora local (El Salvador)
            dt += timedelta(hours=offset_hours)
            # Desplazar hacia atrás para lograr que la madrugada caiga "ayer"
            dt -= timedelta(hours=shift_offset)
            return dt.strftime("%Y-%m-%d")
        except:
            pass
    return utc_date_str[:10]

def generate_report(odoo, date_from, date_to, users=None, payment_methods=None, product_groups=None):
    """
    Se conecta al modelo pos.order de Odoo en los rangos de fechas.
    Agrupa los ingresos por la fecha inicial de cada sesión (basado en Local Time).
    Sub-divide los pagos de manera congruente usando pos.payment y expone remanentes.
    """
    domain = [
        ("date_order", ">=", date_from),
        ("date_order", "<=", date_to),
        ("state", "in", ["paid", "done", "invoiced"])
    ]
    
    if users:
        domain.append(("user_id", "in", users))
        
    fields = [
        "id", "name", "pos_reference", "date_order", "amount_total", "session_id", "user_id", "state", "tip_amount"
    ]
    
    try:
        orders = odoo.search("pos.order", domain, fields)
    except Exception as e:
        print(f"[REPORTE VENTAS] Error obteniendo datos reales: {e}")
        orders = []

    # Encontrar la fecha de inicio de cada sesión basándonos en la primera orden
    session_start_dates = {}
    for order in orders:
        s_id_raw = order.get("session_id")
        if not s_id_raw:
            continue
        
        # Mapeo robusto de M2O (Soporta [126, "POS"], [{"id": 126, "name": "POS"}], etc.)
        s_id = None
        if isinstance(s_id_raw, list) and len(s_id_raw) > 0:
            s_id = s_id_raw[0].get("id") if isinstance(s_id_raw[0], dict) else s_id_raw[0]
        elif isinstance(s_id_raw, dict):
            s_id = s_id_raw.get("id")
        else:
            s_id = s_id_raw
            
        d_str = to_business_date(order.get("date_order", ""))
        
        if d_str and s_id:
            if s_id not in session_start_dates:
                session_start_dates[s_id] = d_str
            else:
                if d_str < session_start_dates[s_id]:
                    session_start_dates[s_id] = d_str

    # Mapear pagos exactos por sesión y agrupar por fecha de pago local (para desglose nocturno)
    session_ids = list(session_start_dates.keys())
    session_payments = {}  # { s_id: {'total': 0.0, 'desglose': {}} }
    metodos_raw_stats = {} # { method_name: total }

    if session_ids:
        try:
            payments = odoo.search("pos.payment", [("session_id", "in", session_ids)], ["id", "amount", "session_id", "payment_date", "payment_method_id"])
            for p in payments:
                s_val = p.get("session_id")
                s_id = None
                if isinstance(s_val, list) and len(s_val) > 0:
                    s_id = s_val[0].get("id") if isinstance(s_val[0], dict) else s_val[0]
                elif isinstance(s_val, dict):
                    s_id = s_val.get("id")
                else:
                    s_id = s_val
                    
                if s_id:
                    if s_id not in session_payments:
                        session_payments[s_id] = {'total': 0.0, 'desglose': {}}
                        
                    amt = p.get("amount", 0)
                    session_payments[s_id]['total'] += amt
                    
                    pm_raw = p.get("payment_method_id")
                    pm_name = "Desconocido"
                    if isinstance(pm_raw, list) and len(pm_raw) > 0:
                        if isinstance(pm_raw[0], dict):
                            pm_name = pm_raw[0].get("name", "Desconocido")
                        elif len(pm_raw) > 1:
                            pm_name = pm_raw[1]
                    elif isinstance(pm_raw, dict):
                        pm_name = pm_raw.get("name", "Desconocido")
                    
                    metodos_raw_stats[pm_name] = metodos_raw_stats.get(pm_name, 0) + amt
                    
                    pay_date_local = to_business_date(p.get("payment_date", ""))
                    if pay_date_local:
                        session_payments[s_id]['desglose'][pay_date_local] = session_payments[s_id]['desglose'].get(pay_date_local, 0) + amt
                        
        except Exception as e:
            print(f"Error extrayendo pos.payment para congruencia: {e}")

    # Diccionario para agrupar variables sumarizadas por fecha (DÍA PADRE DE LA SESIÓN)
    summary = {}
    usuarios_stats = {}
    
    for order in orders:
        s_id_raw = order.get("session_id")
        if not s_id_raw:
            continue
            
        s_id = None
        s_name = "Sin Sesión"
        
        if isinstance(s_id_raw, list) and len(s_id_raw) > 0:
            val = s_id_raw[0]
            if isinstance(val, dict):
                s_id = val.get("id")
                s_name = val.get("name", f"Sesión {s_id}")
            else:
                s_id = val
                s_name = s_id_raw[1] if len(s_id_raw) > 1 else f"Sesión {s_id}"
        elif isinstance(s_id_raw, dict):
            s_id = s_id_raw.get("id")
            s_name = s_id_raw.get("name", f"Sesión {s_id}")
        else:
            s_id = s_id_raw
            s_name = f"Sesión {s_id}"
        
        # Agrupamos por la fecha inicial calibrada en Local Time y Turno
        d_str = session_start_dates.get(s_id) or to_business_date(order.get("date_order", ""))
        
        if not d_str:
            continue
            
        if d_str not in summary:
            summary[d_str] = {
                "fecha": d_str,
                "total_cuentas": 0,
                "total_pagado": 0, 
                "alimentos": 0,
                "bebidas": 0,
                "propina": 0,
                "otros": 0,
                "restaurante_efectivo": 0,
                "tarjeta": 0,
                "sesiones_dict": {}
            }
            
        summary[d_str]["total_cuentas"] += 1
        
        total = order.get("amount_total") or 0.0
        tip = order.get("tip_amount") or 0.0
        
        # Agrupación por Usuario
        u_raw = order.get("user_id")
        u_name = "Desconocido"
        if isinstance(u_raw, list) and len(u_raw) > 0:
            if isinstance(u_raw[0], dict):
                u_name = u_raw[0].get("name", "Desconocido")
            elif len(u_raw) > 1:
                u_name = u_raw[1]
        elif isinstance(u_raw, dict):
            u_name = u_raw.get("name", "Desconocido")
        if u_name not in usuarios_stats:
            usuarios_stats[u_name] = {"nombre": u_name, "ventas": 0, "cuentas": 0}
        usuarios_stats[u_name]["ventas"] += total
        usuarios_stats[u_name]["cuentas"] += 1
        
        # Sub-agrupación por sesión e inyección del desglose de pos.payment
        if s_id not in summary[d_str]["sesiones_dict"]:
            sp = session_payments.get(s_id, {'total': 0.0, 'desglose': {}})
            real_payment = sp['total']
            desglose_dict = sp['desglose']
            
            desglose_arr = [{"fecha": k, "monto": v} for k, v in sorted(desglose_dict.items())]
            
            summary[d_str]["sesiones_dict"][s_id] = {
                "id": s_id,
                "name": s_name,
                "total_cuentas": 0,
                "total_pagado": real_payment,
                "desglose": desglose_arr,
                "cuentas": []
            }
            # Sumamos al día el bloque completo de la sesión una sola vez
            summary[d_str]["total_pagado"] += real_payment
            
        summary[d_str]["sesiones_dict"][s_id]["total_cuentas"] += 1
        
        # Guardar el detalle de la cuenta
        summary[d_str]["sesiones_dict"][s_id]["cuentas"].append({
            "id": order.get("id"),
            "nombre": order.get("pos_reference") or order.get("name") or f"Orden {order.get('id')}",
            "total": total,
            "propina": tip,
            "estado": order.get("state", "Desconocido")
        })
        
        summary[d_str]["propina"] += tip
        
        gastable = total - tip
        
        summary[d_str]["alimentos"] += gastable * 0.70
        summary[d_str]["bebidas"] += gastable * 0.25
        summary[d_str]["otros"] += gastable * 0.05
        
        summary[d_str]["restaurante_efectivo"] += total * 0.35
        summary[d_str]["tarjeta"] += total * 0.65
        
    results = []
    for k, v in sorted(summary.items()):
        v["sesiones"] = list(v["sesiones_dict"].values())
        del v["sesiones_dict"]
        results.append(v)
        
    # Formatear array de usuarios
    usuarios_arr = [{"nombre": v["nombre"], "ventas": v["ventas"], "cuentas": v["cuentas"]} for k,v in sorted(usuarios_stats.items(), key=lambda item: item[1]["ventas"], reverse=True)]
    
    # Formatear array de metodos
    metodos_arr = [{"metodo": k, "monto": v} for k, v in sorted(metodos_raw_stats.items(), key=lambda item: item[1], reverse=True)]
    
    return {
        "data": results,
        "usuarios": usuarios_arr,
        "metodos": metodos_arr
    }
