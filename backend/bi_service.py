from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
from config import settings
from core.odoo_client import OdooClient
from core.utils import report_cache_key
from core.security import authenticate_odoo_user, check_dashboard_permission
from reports import reporte_ventas

app = Flask(__name__)

# Config setup
app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(settings._config["security"]["jwt_expires_minutes"]))

jwt = JWTManager(app)

# Enable CORS for all origins in production
# If supports_credentials is True, origins cannot be "*"
CORS(app, 
     origins=["*"],
     supports_credentials=False, # Shared sessions/cookies not needed for JWT
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# === CONFIGURACION DE ENTORNO ===
# Usar variable de entorno si existe, por defecto False para producción
DEV_MODE = os.environ.get("DEV_MODE", "True").lower() == "true"

# Global Odoo Client
odoo = OdooClient(
    url=settings.ODOO_URL,
    db=settings.ODOO_DB,
    api_key=settings.ODOO_API_KEY
)

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        print(f"Login attempt received: {data.get('username') if data else 'No data'}")
        
        if not data:
            return jsonify({"msg": "Missing JSON in request"}), 400
            
        username = data.get("username", None)
        password = data.get("password", None)
        
        if not username or not password:
            return jsonify({"msg": "Missing username or password"}), 400
        
        # MODO DESARROLLO: Bypass authentication
        if DEV_MODE:
            print(f"[DEV MODE] Login bypass for user: {username}")
            access_token = create_access_token(identity=username)
            return jsonify(access_token=access_token)
            
        # PRODUCCIÓN: Autenticación real
        uid, error = authenticate_odoo_user(username, password)
        if not uid:
            return jsonify({"msg": f"Authentication failed: {error}"}), 401
            
        allowed = check_dashboard_permission(uid, odoo)
        if not allowed:
            return jsonify({"msg": "Access denied: Missing dashboard permission"}), 403
            
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"msg": f"Internal server error: {str(e)}"}), 500

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
def get_sales_report():
    try:
        payload = request.get_json()
        date_from = payload.get("date_from")
        date_to = payload.get("date_to")
        users = payload.get("users", [])
        payments = payload.get("payments", [])
        groups = payload.get("groups", [])
        states = payload.get("states", [])
        force_refresh = payload.get("force_refresh", False)
        
        if not date_from or not date_to:
            return jsonify({"error": "Faltan fechas"}), 400
        
        # Ajuste Turno 4 AM (UTC-6) -> 10 AM UTC (o similar según lógica de dates)
        # El frontend suele mandar YYYY-MM-DD
        date_from_dt = datetime.strptime(date_from if len(date_from) == 10 else date_from[:10], "%Y-%m-%d")
        date_to_dt = datetime.strptime(date_to if len(date_to) == 10 else date_to[:10], "%Y-%m-%d") + timedelta(days=1)
        
        # Odoo usa UTC. Turno 4am El Salvador = 10am UTC.
        # Todo lo que pase desde las 10am de Hoy hasta las 10am de Mañana es el día de Hoy.
        odoo_from = (date_from_dt + timedelta(hours=10)).strftime("%Y-%m-%d %H:%M:%S")
        odoo_to = (date_to_dt + timedelta(hours=10)).strftime("%Y-%m-%d %H:%M:%S")

        # Cache
        cache_payload = {**payload, "date_from": odoo_from, "date_to": odoo_to}
        cache_key = report_cache_key(cache_payload)
        cache_dir = settings.get_reports_cache_dir()
        cache_file = os.path.join(cache_dir, f"{cache_key}.json")
        
        if not force_refresh and os.path.exists(cache_file):
            with open(cache_file, "r", encoding="utf-8") as f:
                return jsonify({**json.load(f), "cached": True})
        
        # Generar Reporte
        report_data = reporte_ventas.generate_report(
            odoo, odoo_from, odoo_to,
            users=users, payments=payments, groups=groups, states=states
        )
        
        os.makedirs(cache_dir, exist_ok=True)
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        
        return jsonify({**report_data, "cached": False})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "="*60)
    if DEV_MODE:
        print("  MODO DESARROLLO ACTIVADO (Login bypass)")
    else:
        print("  MODO PRODUCCION (Autenticacion Odoo)")
    print("="*60 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
