import logging
from config import settings
from core.odoo_client import OdooClient

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

orders = odoo.search("pos.order", [], ["id", "session_id"])
if orders:
    print("ORDER 0 session_id type:", type(orders[0].get("session_id")))
    print("ORDER 0 session_id val:", orders[0].get("session_id"))

