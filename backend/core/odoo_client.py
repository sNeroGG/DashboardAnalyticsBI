import requests
import json
import time

class OdooClient:

    def __init__(self, url, db, api_key, timeout=120, verify_ssl=False):
        self.url = url.rstrip("/")
        self.db = db
        self.api_key = api_key
        self.timeout = timeout
        self.verify_ssl = verify_ssl
        self._session = requests.Session() # Reuse session for connection pooling

    def search(self, model, domain, fields):
        headers = {
            "api_key": self.api_key,
            "db": self.db,
            "Content-Type": "application/json"
        }

        # User mentioned optimization. Retries might be good, or just clean session usage.
        # We will keep it simple but sturdy.
        
        try:
            r = self._session.get(
                f"{self.url}/{model}/search",
                headers=headers,
                params={
                    "domain": json.dumps(domain),
                    "fields": json.dumps(fields)
                },
                verify=self.verify_ssl,
                timeout=self.timeout
            )
            r.raise_for_status()
            data = r.json()
            if "data" not in data and "error" in data:
                 raise Exception(f"Odoo API Error: {data['error']}")
            return data.get("data", [])
            
        except requests.RequestException as e:
            # Simple retry logic could go here, or just logging
            print(f"Odoo Request Error: {e}")
            raise

