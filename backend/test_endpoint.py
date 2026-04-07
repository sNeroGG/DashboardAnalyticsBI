import requests
import json
import datetime

def test():
    print("Loggeando...")
    # Login
    r = requests.post("http://127.0.0.1:5005/api/auth/login", json={"username": "dev", "password": "dev"})
    if r.status_code != 200:
        print("Login failed!", r.text)
        return
    token = r.json().get("access_token")
    
    print("Consultando reporte...")
    today = datetime.date.today().strftime("%Y-%m-%d")
    payload = {
        "date_from": "2023-01-01",
        "date_to": today,
        "force_refresh": True
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    r2 = requests.post("http://127.0.0.1:5005/api/bi/report/ventas", json=payload, headers=headers)
    print("Status:", r2.status_code)
    try:
        data = r2.json()
        print("Datos devueltos:", len(data.get("data", [])))
        print(json.dumps(data, indent=2)[:500] + "...")
    except Exception as e:
        print("Error parsing response:", e)
        print("Text:", r2.text)

if __name__ == "__main__":
    test()
