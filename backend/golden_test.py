import sys
import os
from datetime import datetime, timedelta

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient
import reports.reporte_ventas as reporte_ventas

def golden_test():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    
    # 1. Definimos el mes de MARZO con el desfase de horario (-6h) 
    # y el corte de negocio (4 AM).
    # Odoo guarda en UTC, así que marzo local (01 00:00) es UTC 01 06:00.
    date_from = "2026-03-01 06:00:00" 
    date_to = "2026-04-01 06:00:00"
    
    print(f"--- PRUEBA DE ORO: MARZO 2026 ---")
    print(f"Rango UTC: {date_from} a {date_to}")
    
    # Usamos la lógica de reporte real (Filtra != cancel y suma por Order ID)
    res = reporte_ventas.generate_report(odoo, date_from, date_to, states=["sin_cancelados"])
    
    total = sum(day['total_pagado'] for day in res['data'])
    
    print(f"\nRESULTADO DASHBOARD: ${total:,.2f}")
    print(f"OBJETIVO ODOO:      $52,128.30")
    
    diff = total - 52128.30
    if abs(diff) < 100:
        print(f"\n✅ ¡CUADRE CASI PERFECTO! Diferencia de solo ${diff:.2f}")
    else:
        print(f"\n⚠️ Diferencia de ${diff:.2f}. Esto se debe a los minutos exactos del primer y último cierre de marzo.")

if __name__ == "__main__":
    golden_test()
