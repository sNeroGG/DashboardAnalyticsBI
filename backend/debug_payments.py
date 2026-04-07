from config import settings
from core.odoo_client import OdooClient
import pprint

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

try:
    payments = odoo.search("pos.payment", [("id", "=", 8463)], ["id", "amount", "session_id", "payment_date", "payment_method_id"])
    print("Muestra de pos.payment:")
    pprint.pprint(payments)
except Exception as e:
    print(f"EXCEPTION: {e}")
