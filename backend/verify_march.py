import sys
import os
import json

# Ajustar path para importar módulos locales
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from config import settings
    from core.odoo_client import OdooClient
    import reports.reporte_ventas as reporte_ventas
except ImportError as e:
    print(f"Error de importación: {e}")
    sys.exit(1)

def run_test():
    try:
        odoo = OdooClient(
            url=settings.ODOO_URL,
            db=settings.ODOO_DB,
            api_key=settings.ODOO_API_KEY
        )
        
        date_from = "2026-03-01 00:00:00"
        date_to = "2026-04-01 04:00:00" # Un poco más para cubrir el cierre de turno
        
        print(f"--- PRUEBA REAL ODOO: MARZO 2026 ---")
        
        # 1. Sin filtrar cancelados (TODO)
        res_all = reporte_ventas.generate_report(odoo, "2026-03-01 00:00:00", "2026-03-31 23:59:59", states=["todo"])
        total_all = sum(day['total_pagado'] for day in res_all['data'])
        print(f"-> CON CANCELADOS: ${total_all:,.2f}")
        
        # 2. Filtrando cancelados (SIN CANCELADOS)
        res_clean = reporte_ventas.generate_report(odoo, "2026-03-01 00:00:00", "2026-03-31 23:59:59", states=["sin_cancelados"])
        total_clean = sum(day['total_pagado'] for day in res_clean['data'])
        print(f"-> SIN CANCELADOS (state != 'cancel'): ${total_clean:,.2f}")
        
    except Exception as e:
        print(f"Error durante la prueba: {e}")

if __name__ == "__main__":
    run_test()
