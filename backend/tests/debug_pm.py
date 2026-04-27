from config import settings
from core.odoo_client import OdooClient
import pprint

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

orders = odoo.search("pos.order", [("date_order", ">", "2026-04-06")], ["id", "user_id"])
print("\nMuestra de pos.order:")
if orders:
    pprint.pprint(orders[0])

payments = odoo.search("pos.payment", [("payment_date", ">", "2026-04-06")], ["id", "payment_method_id"])
print("Muestra de pos.payment:")
if payments:
    pprint.pprint(payments[0])

