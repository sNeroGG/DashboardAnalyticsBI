from config import settings
from core.odoo_client import OdooClient
import pprint

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

orders = odoo.search("pos.order", [], ["id", "name", "lines"])
if orders:
    order_id = orders[0]["id"]
    lines = odoo.search("pos.order.line", [("order_id", "=", order_id)], [])
    if lines:
        print("Campos de pos.order.line:")
        pprint.pprint(list(lines[0].keys()))
        
        product_id = lines[0].get("product_id")
        if product_id:
            p_id = product_id[0] if isinstance(product_id, list) else product_id
            products = odoo.search("product.product", [("id", "=", p_id)], [])
            if products:
                print("\nCampos de product.product:")
                pprint.pprint(list(products[0].keys()))
