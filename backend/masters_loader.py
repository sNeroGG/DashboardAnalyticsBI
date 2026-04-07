import os
import json
from config import settings
from core.odoo_client import OdooClient

def load_masters():
    print("Conectando a Odoo para descargar catálogos (Masters)...")
    
    odoo = OdooClient(
        url=settings.ODOO_URL,
        db=settings.ODOO_DB,
        api_key=settings.ODOO_API_KEY
    )
    
    masters_structure = settings.get_masters_config()
    results = {}
    
    for model, fields in masters_structure.items():
        print(f"Descargando {model} ...")
        try:
            # Domain vacio para traer todos los activos
            domain = []
            
            data = odoo.search(model, domain, fields)
            
            # Formateamos los usuarios para inyectar su 'name' desde el 'partner_id' diferido
            if model == "res.users":
                for item in data:
                    if "name" not in item and "partner_id" in item:
                        pid = item["partner_id"]
                        if isinstance(pid, list) and len(pid) > 0 and isinstance(pid[0], dict) and "name" in pid[0]:
                            item["name"] = pid[0]["name"]  # API REST format [{id, name}]
                        elif isinstance(pid, list) and len(pid) > 1 and isinstance(pid[1], str):
                            item["name"] = pid[1]          # Standard format [id, "name"]
                        elif isinstance(pid, dict) and "name" in pid:
                            item["name"] = pid["name"]     # Clean Dict format {id, name}
                        else:
                            item["name"] = f"Usuario {item.get('id', '?')}"
                    elif "name" not in item:
                        item["name"] = f"Usuario {item.get('id', '?')}"
                        
            results[model] = data
            print(f" -> {len(data)} registros obtenidos.")
        except Exception as e:
            print(f" -> Error obteniendo {model}: {e}")
            results[model] = []

    # Guardar en cache
    cache_path = settings.get_master_cache_path()
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\n¡Éxito! Todos los catálogos se han guardado en {cache_path}")

if __name__ == "__main__":
    load_masters()
