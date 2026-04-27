import sys
import os
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient

def breakdown():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    domain = [("date_order", ">=", "2026-03-01 00:00:00"), ("date_order", "<=", "2026-03-31 23:59:59")]
    orders = odoo.search("pos.order", domain, ["state", "amount_total"])
    
    stats = {}
    for o in orders:
        st = o.get("state", "unknown")
        amt = o.get("amount_total", 0)
        if st not in stats:
            stats[st] = {"count": 0, "total": 0}
        stats[st]["count"] += 1
        stats[st]["total"] += amt
    
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    breakdown()
