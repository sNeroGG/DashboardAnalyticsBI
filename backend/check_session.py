import sys
import os
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient
import reports.reporte_ventas as reporte_ventas

def check_session_split():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    
    # Buscamos la sesión específica POS/00087
    sessions = odoo.search("pos.session", [("name", "=", "POS/00087")], ["id", "name", "start_at", "stop_at"])
    if not sessions:
        print("Sesión no encontrada")
        return
        
    s_id = sessions[0]["id"]
    print(f"--- ANALIZANDO SESIÓN: {sessions[0]['name']} ---")
    
    # Traemos todas las órdenes de esa sesión
    orders = odoo.search("pos.order", [("session_id", "=", s_id)], ["date_order", "amount_total", "state"])
    print(f"Total órdenes encontradas: {len(orders)}")
    
    # Clasificamos por Día de Negocio (Corte 4 AM)
    days = {}
    for o in orders:
        if o["state"] == "cancel": continue
        d_bus = reporte_ventas.to_business_date(o["date_order"])
        if d_bus not in days: days[d_bus] = {"count": 0, "total": 0}
        days[d_bus]["count"] += 1
        days[d_bus]["total"] += o["amount_total"]
        
    for d, data in days.items():
        print(f"Día {d}: {data['count']} órdenes - Subtotal: ${data['total']:,.2f}")

if __name__ == "__main__":
    check_session_split()
