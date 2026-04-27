import requests

def test_remote():
    url = "http://164.92.125.29:5000/api/bi/report/ventas"
    payload = {
        "date_from": "2026-03-01",
        "date_to": "2026-03-31",
        "states": ["sin_cancelados"]
    }
    try:
        print(f"Conectando a {url}...")
        # Probamos sin token primero para ver si el endpoint existe
        r = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {r.status_code}")
        print(f"Respuesta: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_remote()
