import requests
import json
from config import settings
from core.odoo_client import OdooClient

def authenticate_odoo_user(username, password):
    """
    Authenticates against Odoo using /web/session/authenticate.
    Returns (user_id, error_message)
    """
    # We ensure we hit the base Odoo login, stripping /api if it was added for the REST client
    base_url = settings.ODOO_URL.rstrip('/')
    if base_url.endswith('/api'):
        base_url = base_url[:-4]
    
    url = f"{base_url}/web/session/authenticate"
    payload = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "db": settings.ODOO_DB,
            "login": username,
            "password": password
        }
    }
    
    try:
        # We assume standard Odoo JSON-RPC
        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        data = resp.json()
        
        if data.get("error"):
            return None, data["error"].get("message", "Authentication Failed")
            
        result = data.get("result")
        if result and result.get("uid"):
            return result["uid"], None
        
        return None, "Invalid credentials"
        
    except Exception as e:
        return None, str(e)

def check_dashboard_permission(user_id, odoo_client: OdooClient):
    """
    Checks if the user has 'bi_dashboard_make_acces' set to True.
    Uses the service OdooClient (admin/api_key) to query the user record.
    """
    try:
        # Search for the user by ID
        users = odoo_client.search(
            model="res.users",
            domain=[("id", "=", user_id)],
            fields=["id", "login", "bi_dashboard_make_acces"] 
        )
        
        if not users:
            return False
            
        user = users[0]
        # Check the field (if it doesn't exist, we fallback to True for backward compatibility until Odoo is updated, but log it)
        if "bi_dashboard_make_acces" in user:
            return bool(user.get("bi_dashboard_make_acces"))
            
        print("Warning: Field bi_dashboard_make_acces not found on user. Allowing access by default.")
        return True 
        
    except Exception as e:
        print(f"Permission check error: {e}")
        return False # Fail closed for security
