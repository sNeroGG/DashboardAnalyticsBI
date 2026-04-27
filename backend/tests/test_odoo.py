import sys
import json
from config import settings
from core.odoo_client import OdooClient

def main():
    print("="*50)
    print(" Verificando conexión a Odoo (La Herradura) ")
    print("="*50)
    print(f"-> URL:     {settings.ODOO_URL}")
    print(f"-> BD:      {settings.ODOO_DB}")
    print(f"-> API KEY: '{settings.ODOO_API_KEY[:5]}...' (Oculto)")
    print("-" * 50)
    
    try:
        odoo = OdooClient(
            url=settings.ODOO_URL,
            db=settings.ODOO_DB,
            api_key=settings.ODOO_API_KEY
        )
        
        # Intentamos obtener 1 solo registro de la tabla pos.order (recibos)
        print("Enviando petición de prueba (Extrayendo 1 ticket)...")
        # Probaremos traernos los últimos 3 tickets con más información para depurar estado y usuarios
        domain = [] # Sin restricciones para traer lo ultimo
        fields = ["id", "name", "date_order", "amount_total", "state", "user_id", "session_id"]
        
        # Si la API rest espera una busqueda normal
        orders = odoo.search("pos.order", domain, fields)
        
        if orders:
            print("\n✔️ ¡CONEXIÓN EXITOSA!")
            print(f"Me traje los tickets. Aquí hay una muestra de sus campos internos:")
            # Mostrar hasta 3 para comparar
            for o in orders[:1]:
                print(json.dumps(o, indent=2))
                if o.get("session_id"):
                    session_id = o["session_id"][0] if isinstance(o["session_id"], list) else o["session_id"]
                    sess = odoo.search("pos.session", [("id", "=", session_id)], [])
                    print("\nSesion:")
                    print(json.dumps(sess[0], indent=2) if sess else "No encontrada")

        else:
            print("\n✔️ CONEXIÓN EXITOSA!")
            print("El servidor respondió sin errores, pero la base de datos 'pos.order' retornado 0 tickets históricos. (Puede que sea una BD vacía o el usuario de tu API Key no tenga permisos para leer pos.order).")
            
    except Exception as e:
        print("\n❌ ERROR DE CONEXIÓN ODOO:")
        print(str(e))
        print("\nPosibles causas:")
        print("1. La URL no expone esa API (¿Seguro que Odoo tiene instalado el módulo /api/search?).")
        print("2. Tu API_KEY fue denegada o no existe.")
        print("3. La Base de Datos se llama diferente o te bloqueó por CORS.")

if __name__ == "__main__":
    main()
