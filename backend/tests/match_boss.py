import sys
import os
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient

def match_boss_number():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    
    # Filtro ultra-estricto: Solo marzo, solo lo que Odoo considera "finalizado"
    domain = [
        ("date_order", ">=", "2026-03-01 00:00:00"), 
        ("date_order", "<=", "2026-03-31 23:59:59"),
        ("state", "in", ["done", "invoiced"]) # Ignoramos 'paid' si no está 'done', y por supuesto cancelados
    ]
    
    orders = odoo.search("pos.order", domain, ["id", "amount_total"])
    order_ids = [o["id"] for o in orders]
    
    if not order_ids:
        print("No se encontraron órdenes con esos criterios.")
        return

    # Ahora buscamos los pagos asociados a esas órdenes exactas
    payments = odoo.search("pos.payment", [("pos_order_id", "in", order_ids)], ["amount"])
    
    total_pagos = sum(p.get("amount", 0) for p in payments)
    print(f"TOTAL RESULTANTE: ${total_pagos:,.2f}")
    print(f"ÓRDENES PROCESADAS: {len(orders)}")

if __name__ == "__main__":
    match_boss_number()
