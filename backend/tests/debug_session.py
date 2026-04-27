from config import settings
from core.odoo_client import OdooClient

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

sessions = odoo.search("pos.session", [("name", "=", "POS/00122")], ["id"])
if sessions:
    s_id = sessions[0]["id"]
    payments = odoo.search("pos.payment", [("session_id", "=", s_id)], ["id", "amount", "payment_date"])
    for p in payments:
        if p.get("payment_date", "").startswith("2026-04-02"):
            print(p.get("payment_date"), p.get("amount"))
