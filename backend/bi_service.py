from flask import Flask, jsonify, request, send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import json
import os
from config import settings
from core.odoo_client import OdooClient
from core.utils import report_cache_key
from core.security import authenticate_odoo_user, check_dashboard_permission

from reports import reporte_ventas

app = Flask(__name__)

# Enable CORS for Next.js frontend with proper preflight support
CORS(app, 
     origins=["http://localhost:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Config setup
app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = int(settings._config["security"]["jwt_expires_minutes"]) * 60

jwt = JWTManager(app)

# Global Odoo Client (Optimized: Single instance, reuses session)
odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

# === MODO DESARROLLO ===
# Cambiar a False para activar autenticación real
DEV_MODE = True

@app.route("/api/bi/health")
def health():
    """Public endpoint for health checking."""
    return jsonify({"status": "ok"})

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/api/auth/login", methods=["POST"])
def login():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400
    
    # MODO DESARROLLO: Bypass authentication
    if DEV_MODE:
        print(f"[DEV MODE] Login bypass for user: {username}")
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token)
        
    # PRODUCCIÓN: Autenticación real
    # 1. Authenticate against Odoo (User/Pass)
    uid, error = authenticate_odoo_user(username, password)
    if not uid:
        return jsonify({"msg": f"Authentication failed: {error}"}), 401
        
    # 2. Check Permission via Service API (Currently bypassed in security.py but called here)
    allowed = check_dashboard_permission(uid, odoo)
    if not allowed:
        return jsonify({"msg": "Access denied: Missing dashboard permission"}), 403
        
    # 3. Generate Token
    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

@app.route("/api/bi/masters")
@jwt_required()
def get_masters():
    """Return cached masters (users, payment methods, etc.)"""
    try:
        cache = settings.get_master_cache_path()
        if not os.path.exists(cache):
            return jsonify({"error": "Masters cache not found. Run masters_loader.py first."}), 404
            
        with open(cache, "r", encoding="utf-8") as f:
            masters = json.load(f)
            
        return jsonify(masters)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/bi/report/ventas", methods=["POST"])
@jwt_required()
def report_ventas():
    """
    POST /api/bi/report/ventas
    Body: { date_from, date_to, users[], payment_methods[], force_refresh }
    """
    print("[FLASK] Generando reporte de ventas...")
    try:
        payload = request.get_json()
        
        date_from = payload.get("date_from")
        date_to = payload.get("date_to")
        users = payload.get("users", [])
        payment_methods = payload.get("payment_methods", [])
        product_groups = payload.get("product_groups", [])
        force_refresh = payload.get("force_refresh", False)
        
        if not date_from or not date_to:
            return jsonify({"error": "date_from and date_to are required"}), 400
        
        # Generate cache key
        cache_key_str = report_cache_key(payload)
        cache_dir = settings.get_reports_cache_dir()
        cache_file = os.path.join(cache_dir, f"{cache_key_str}.json")
        
        # Check cache
        if not force_refresh and os.path.exists(cache_file):
            with open(cache_file, "r", encoding="utf-8") as f:
                cached = json.load(f)
            return jsonify({**cached, "cached": True})
        
        # Generate report
        report_data = reporte_ventas.generate_report(
            odoo,
            date_from,
            date_to,
            users,
            payment_methods,
            product_groups
        )
        
        # Save to cache
        os.makedirs(cache_dir, exist_ok=True)
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        
        return jsonify({**report_data, "cached": False})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "="*60)
    if DEV_MODE:
        print("  MODO DESARROLLO ACTIVADO")
        print("  La autenticacion esta deshabilitada")
        print("  Cualquier usuario/password funcionara")
    else:
        print("  MODO PRODUCCION")
        print("  Autenticacion Odoo requerida")
    print("="*60 + "\n")
    
    app.run(host="127.0.0.1", port=5005, debug=True)
