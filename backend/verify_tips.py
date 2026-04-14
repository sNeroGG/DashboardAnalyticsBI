import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient

def verify_tips():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    domain = [("date_order", ">=", "2026-03-01 00:00:00"), ("date_order", "<=", "2026-03-31 23:59:59"), ("state", "in", ["done", "invoiced"])]
    orders = odoo.search("pos.order", domain, ["tip_amount", "amount_total"])
    
    total_ventas = sum(o.get("amount_total", 0) for o in orders)
    total_tips = sum(o.get("tip_amount", 0) for o in orders)
    
    print(f"Total Amount (con propina): ${total_ventas:,.2f}")
    print(f"Total Propinas:              ${total_tips:,.2f}")
    print(f"Diferencia (Venta Neta):      ${total_ventas - total_tips:,.2f}")

if __name__ == "__main__":
    verify_tips()
