from config import settings
from core.odoo_client import OdooClient
from reports.reporte_ventas import generate_report
import pprint

odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

data = generate_report(odoo, "2026-04-06", "2026-04-07")
print("METODOS:", data["metodos"])
if len(data["data"]) > 0:
    for day in data["data"]:
        print(f"FECHA: {day['fecha']} - Total Pagado: {day['total_pagado']}")
