import sys
import os
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from config import settings
from core.odoo_client import OdooClient

def audit_payments():
    odoo = OdooClient(url=settings.ODOO_URL, db=settings.ODOO_DB, api_key=settings.ODOO_API_KEY)
    
    # Vamos a traernos una muestra de pagos del grupo "false" (monto negativo o raro)
    domain = [("payment_date", ">=", "2026-03-01 00:00:00"), ("payment_date", "<=", "2026-03-31 23:59:59")]
    # Pedimos campos que nos den pistas: is_change, amount, payment_method_id, etc.
    payments = odoo.search("pos.payment", domain, ["id", "amount", "payment_method_id", "pos_order_id"])
    
    # Ver si existe algún campo llamado 'state' o similar en pos.payment que no sepamos
    # (Usaremos un truco para ver todos los campos de un registro)
    if payments:
        print("--- AUDITORIA DE UN PAGO ---")
        print(json.dumps(payments[0], indent=2))
        
        negativos = [p for p in payments if p.get("amount", 0) < 0]
        print(f"\nEncontrados {len(negativos)} pagos negativos.")
        if negativos:
            print("Ejemplo de pago negativo:")
            print(json.dumps(negativos[0], indent=2))

if __name__ == "__main__":
    audit_payments()
