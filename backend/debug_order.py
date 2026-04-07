from config import settings
from core.odoo_client import OdooClient
import pprint

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

orders = odoo.search("pos.order", [], [])
if orders:
    print("Campos de pos.order:")
    pprint.pprint(list(orders[0].keys()))

payments = odoo.search("pos.payment", [], [])
if payments:
    print("\nCampos de pos.payment:")
    pprint.pprint(list(payments[0].keys()))
