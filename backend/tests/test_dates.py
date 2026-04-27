from datetime import datetime, timedelta

def to_business_date(utc_date_str, offset_hours=-6, shift_offset=4):
    if not utc_date_str: return ""
    if len(utc_date_str) >= 19:
        try:
            dt = datetime.strptime(utc_date_str[:19], "%Y-%m-%d %H:%M:%S")
            dt += timedelta(hours=offset_hours)
            dt -= timedelta(hours=shift_offset)
            return dt.strftime("%Y-%m-%d")
        except:
            pass
    return utc_date_str[:10]

print("01:47 UTC =", to_business_date("2026-04-02 01:47:00"))
print("06:50 UTC =", to_business_date("2026-04-02 06:50:00"))
print("09:59 UTC =", to_business_date("2026-04-02 09:59:00"))
print("10:01 UTC =", to_business_date("2026-04-02 10:01:00"))
