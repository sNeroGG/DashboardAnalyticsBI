import sys
import os
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient

def test_payments():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    
    # Filtramos por fecha de pago en marzo
    domain = [("payment_date", ">=", "2026-03-01 00:00:00"), ("payment_date", "<=", "2026-03-31 23:59:59")]
    payments = odoo.search("pos.payment", domain, ["amount"])
    
    total = sum(p.get("amount", 0) for p in payments)
    print(f"TOTAL REAL EN PAGOS (Caja): ${total:,.2f}")

if __name__ == "__main__":
    test_payments()
