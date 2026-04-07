import json
import hashlib


def m2o_id(value):
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, list) and value:
        return m2o_id(value[0])
    if isinstance(value, dict):
        return m2o_id(value.get("id"))
    return None


def report_cache_key(payload: dict) -> str:
    safe = {
        "date_from": payload.get("date_from"),
        "date_to": payload.get("date_to"),
        "users": payload.get("users", []),
        "payment_methods": payload.get("payment_methods", []),
        "product_groups": payload.get("product_groups", [])
    }
    raw = json.dumps(safe, sort_keys=True)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()
