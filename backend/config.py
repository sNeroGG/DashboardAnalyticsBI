import os
import json
from pathlib import Path
from dotenv import load_dotenv
# Se cambio el config.json para utilizar el .env
BASE_DIR = Path(__file__).parent.resolve()
load_dotenv(BASE_DIR / ".env")
CONFIG_PATH = BASE_DIR / "config.json"

# Default config structure
DEFAULT_CONFIG = {
    "odoo": {
        "url": "http://localhost:8069",
        "db": "odoo",
        "api_key": ""
    },
    "paths": {
        "masters_cache": "cache/masters.json",
        "reports_cache": "cache/reports.json"
    },
    "security": {
        "jwt_secret": "change-me-in-production",
        "jwt_expires_minutes": 60
    }
}

import copy # Add import

class Config:
    def __init__(self):
        self._config = copy.deepcopy(DEFAULT_CONFIG) # Use deepcopy
        self.load_from_file()
        self.load_from_env()

        # Normalize paths
        self.MASTERS_PATH = self._resolve_path(self._config["paths"]["masters_cache"])
        self.REPORTS_CACHE_PATH = self._resolve_path(self._config.get("paths", {}).get("reports_cache", "cache/reports.json"))
        
        # Odoo
        self.ODOO_URL = self._config["odoo"]["url"]
        self.ODOO_DB = self._config["odoo"]["db"]
        self.ODOO_API_KEY = self._config["odoo"]["api_key"]
        
        # Security
        self.JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-default-dev-key") # Override in prod

    def load_from_file(self):
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                file_config = json.load(f)
                # Deep merge simple (only 1 level for now)
                for k, v in file_config.items():
                    if isinstance(v, dict) and k in self._config:
                        self._config[k].update(v)
                    else:
                        self._config[k] = v

    def load_from_env(self):
        # Allow env vars to override
        if os.getenv("ODOO_URL"): self._config["odoo"]["url"] = os.getenv("ODOO_URL")
        if os.getenv("ODOO_DB"): self._config["odoo"]["db"] = os.getenv("ODOO_DB")
        if os.getenv("ODOO_API_KEY"): self._config["odoo"]["api_key"] = os.getenv("ODOO_API_KEY")

    def _resolve_path(self, path_str):
        # Fix mixed slashes and absolute paths if they start with c:// or similar logic
        # If it looks absolute, keep it, otherwise make relative to BASE_DIR
        path = Path(path_str)
        if path.is_absolute():
             return path
        # Handle the specific case in initial config having "c://..." which might be interpreted weirdly
        if "://" in path_str and not path_str.startswith("http"):
             # Cleanup specific windows weirdness if present in legacy config
             clean = path_str.replace("c://", "c:/")
             return Path(clean)
             
        return BASE_DIR / path_str

    def get_master_cache_path(self):
        return str(self.MASTERS_PATH)

    def get_reports_cache_dir(self):
        return str(Path(self.REPORTS_CACHE_PATH).parent)

    def get_masters_config(self):
        return self._config.get("masters", {})

# Global instance
settings = Config()
