import requests
import json

def test_backend():
    url = "http://localhost:5000/api/bi/report/ventas"
    payload = {
        "date_from": "2026-03-01",
        "date_to": "2026-03-31",
        "states": ["sin_cancelados"]
    }
    # Nota: Como quitamos JWT temporalmente para pruebas, esto deberia dar 401 o el error real
    try:
        print(f"Conectando a {url}...")
        r = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {r.status_code}")
        print(f"Respuesta: {r.text}")
    except Exception as e:
        print(f"Error de conexion: {e}")

if __name__ == "__main__":
    test_backend()
