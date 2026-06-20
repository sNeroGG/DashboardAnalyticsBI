# Dashboard Analytics & BI - Odoo

Este proyecto es un ecosistema de Inteligencia de Negocios (BI) diseñado para extraer, procesar y visualizar métricas críticas de ventas desde Odoo ERP en tiempo real. Está optimizado para ser implementado como una solución adaptada a restaurantes y puntos de venta (POS).

---

## 🚀 Funcionalidades Principales

1. **Dashboard General**: Métricas de ventas, transacciones, desgloses por categoría (alimentos/bebidas), propinas y métodos de pago de un periodo filtrable.
2. **Sesión Activa**: Vista detallada en tiempo real de las sesiones abiertas en Odoo. Permite filtrar sesiones de prueba, ver resúmenes financieros por estado y descargar PDFs formateados para impresión de las sesiones seleccionadas.
3. **Ventas por Vendedor**: Gráficas y tablas de rendimiento por usuario.
4. **Analítica Avanzada & Comparativa**: Análisis acumulados y comparación de periodos (mes contra mes).

---

## 📁 Estructura del Proyecto

- `backend/`: API REST en Python (Flask) con lógica de conexión a Odoo.
- `frontend/`: Interfaz gráfica moderna en Next.js con Tailwind CSS y componentes de Shadcn UI.
- `docker-compose.yml`: Orquestador principal de servicios.
- `DEPLOY.md`: Guía de despliegue y actualización en servidores de producción.

---

## 🛠️ Ejecución con Docker (Flujo Recomendado)

Toda la aplicación está contenedorizada con Docker, por lo que no es necesario instalar dependencias de Python o Node locales.

### 1. Preparar las Variables de Entorno
Dirígete a la carpeta `backend/` y crea el archivo `.env` a partir de la plantilla:
```bash
cp backend/.env.example backend/.env
```
Abre el archivo `backend/.env` y configúralo con las credenciales de Odoo:
- `ODOO_URL`: URL del servidor Odoo (ej. `https://tu-dominio.com/api` o `http://tu-ip:8069`)
- `ODOO_DB`: Nombre de la base de datos de Odoo.
- `ODOO_API_KEY`: API Key de conexión.
- `DEV_MODE`: Establécelo en `True` si estás en desarrollo local para bypass de inicio de sesión.

### 2. Iniciar la Aplicación (Local o Servidor)
Desde la raíz del proyecto, ejecuta:
```bash
docker compose up -d --build
```
Este comando descargará/compilará las imágenes y levantará los servicios en segundo plano:
- **Frontend**: Acceso en `http://localhost:3001`
- **Backend (API)**: Acceso en `http://localhost:5000`

Para ver los logs de los contenedores en tiempo real:
```bash
docker compose logs -f
```

---

## 🔄 Flujo de Actualización (Git Pull)

Cuando el código sufra actualizaciones o realices un `git pull` en tu servidor, actualiza de la siguiente forma para aplicar los cambios de manera limpia:

1. **Obtener los últimos cambios:**
   ```bash
   git pull origin main
   ```
2. **Recompilar e iniciar servicios actualizados:**
   ```bash
   docker compose up -d --build
   ```

---

## 📦 Sincronización Manual de Catálogos (Masters)

Los catálogos (nombres de vendedores, métodos de pago, etc.) se descargan de Odoo y se guardan en caché. Esto ocurre automáticamente al arrancar la aplicación o al dar clic en **"Sincronizar"** en el panel web. Si deseas forzar la sincronización de manera manual desde la terminal, puedes correr:

```bash
docker compose exec backend python masters_loader.py
```

---

*Para instrucciones avanzadas sobre producción, proxies inversos (Caddy/Nginx) y resolución de problemas, consulta el archivo [DEPLOY.md](file:///n:/Archivos/Proyectos%20DEV/DashboardAnalyticsBI/DEPLOY.md).*
