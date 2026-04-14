import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient

def final_match():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    
    # El reporte del jefe parece estar basado estrictamente en la tabla de pagos (pos.payment)
    # y usa fechas de pago que cruzan la medianoche
    domain = [
        ("payment_date", ">=", "2026-03-01 11:24:37"), 
        ("payment_date", "<=", "2026-04-01 03:00:28")
    ]
    
    payments = odoo.search("pos.payment", domain, ["amount", "payment_method_id"])
    
    total = sum(p.get("amount", 0) for p in payments)
    print(f"Total en Pagos (con sus filtros): ${total:,.2f}")
    print(f"Número de pagos: {len(payments)}")

if __name__ == "__main__":
    final_match()
