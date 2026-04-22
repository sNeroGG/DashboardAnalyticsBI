from datetime import datetime
import calendar

def calculate_advanced_analytics(daily_data, date_from_str, date_to_str):
    """
    Calculates advanced analytics from the daily sales data.
    """
    if not daily_data:
        return {
            "proyeccion_mes": {
                "venta_acumulada": 0,
                "venta_proyectada": 0,
                "dias_transcurridos": 0,
                "dias_totales_mes": 0,
                "promedio_diario": 0
            },
            "analisis_semanal": []
        }

    # Proyección (Asume que date_from y date_to abarcan el mes o el periodo consultado)
    try:
        # Usamos la primera fecha de la data si date_from no es muy útil o si viene en otro formato
        # Para ser precisos, parseamos el primer dia de la data para el mes
        first_day = datetime.strptime(daily_data[0]["fecha"], "%Y-%m-%d")
        year = first_day.year
        month = first_day.month
        _, total_days_in_month = calendar.monthrange(year, month)
        
        # Días transcurridos en el rango o en la data real
        # Podría ser simplemente la cantidad de dias devueltos en la data si es mes en curso
        dias_transcurridos = len(daily_data)
        
        venta_acumulada = sum(d["total_pagado"] for d in daily_data)
        promedio_diario = venta_acumulada / dias_transcurridos if dias_transcurridos > 0 else 0
        
        venta_proyectada = promedio_diario * total_days_in_month

        proyeccion = {
            "venta_acumulada": venta_acumulada,
            "venta_proyectada": venta_proyectada,
            "dias_transcurridos": dias_transcurridos,
            "dias_totales_mes": total_days_in_month,
            "promedio_diario": promedio_diario
        }
    except Exception as e:
        proyeccion = {"error": str(e)}

    # Análisis Semanal
    # 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    weekly_stats = {i: {"count": 0, "total_pagado": 0, "total_cuentas": 0, "total_personas": 0} for i in range(7)}

    for d in daily_data:
        try:
            dt = datetime.strptime(d["fecha"], "%Y-%m-%d")
            wd = dt.weekday()
            weekly_stats[wd]["count"] += 1
            weekly_stats[wd]["total_pagado"] += d.get("total_pagado", 0)
            weekly_stats[wd]["total_cuentas"] += d.get("total_cuentas", 0)
            weekly_stats[wd]["total_personas"] += d.get("total_personas", 0)
        except:
            pass

    analisis_semanal = []
    for i in range(7):
        st = weekly_stats[i]
        count = st["count"]
        if count > 0:
            avg_tickets = st["total_cuentas"] / count
            avg_monto = st["total_pagado"] / count
            promedio_persona = st["total_pagado"] / st["total_personas"] if st["total_personas"] > 0 else 0
        else:
            avg_tickets = 0
            avg_monto = 0
            promedio_persona = 0
            
        analisis_semanal.append({
            "dia_id": i,
            "dia": day_names[i],
            "promedio_tickets": avg_tickets,
            "promedio_monto": avg_monto,
            "ticket_promedio_persona": promedio_persona,
            "dias_contados": count
        })

    return {
        "proyeccion_mes": proyeccion,
        "analisis_semanal": analisis_semanal
    }
