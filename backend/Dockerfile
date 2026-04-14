FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema si fueran necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Instalar gunicorn para producción
RUN pip install gunicorn

# Copiar el resto del código
COPY . .

# Crear carpetas de cache y reportes si no existen
RUN mkdir -p cache reports

EXPOSE 5000

# Comando para ejecutar con Gunicorn (más estable para producción)
# Si prefieres el modo normal, usa: CMD ["python", "bi_service.py"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "bi_service:app"]
