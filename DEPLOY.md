# Guía Maestra de Despliegue con Docker

Esta guía ha sido optimizada para asegurar despliegues instantáneos, estables y sin choques de caché tanto en desarrollo local como en el servidor de Odoo (vía Caddy).

## 1. Preparación Local y Sincronización
Para asegurar que tu subida al servidor tarde solo un par de segundos y no horas, debes excluir manualmente las carpetas de recursos pesados antes de hacer la transferencia.

**❌ Omitir siempre estas carpetas (¡No las subas!):**
- `frontend/node_modules/`
- `frontend/.next/`
- `backend/__pycache__/`
- `backend/venv/` (si existe localmente)

1. Abre tu cliente (MobaXterm / FileZilla).
2. Arrastra y suelta tu carpeta `dashboard/` hacia tu servidor (ej. `~/bi-dashboard`), recordando **excluir** las carpetas de arriba. Si por error arrastras alguna, el archivo invisible `.dockerignore` la bloqueará automáticamente para proteger al sistema.

## 2. Compilación Segura en el Servidor
Una vez transferidos los archivos, abre la consola SSH del servidor y dirígete al proyecto:

```bash
cd /ruta/a/tu/dashboard
```

Si estás realizando una actualización visual o de código, siempre apaga el sistema viejo para liberar recursos y evitar retenciones:
```bash
docker compose down
```

Para compilar forzando compatibilidad segura y recargando todo el código nuevo, ejecuta:

```bash
docker compose build --no-cache
```

## 3. Encendido Limpio (Producción)
Tras la compilación limpia, arranca el sistema. Como el archivo `docker-compose.yml` localiza ahora el puerto `3001`, este empatará de forma invisible con la ruta original de tu Caddyfile, sin tirar errores de puertos ocupados.

```bash
docker compose up -d
```

¡Listo! Ingresa a la IP/Dominio de tu servidor en el puerto correcto (ej. `http://tu-dominio.com/dashboard` o `http://192.168.1.100:3001`) y todo estará fluyendo a la perfección.

---

## 4. Actualizaciones Parciales Rápidas (Un solo archivo)
Si en el futuro cambias un solo archivo de tu código (por ejemplo, corregir un texto, un margen o una gráfica) y deseas mandarlo al servidor de producción **sin apagar nada ni generar errores**:

1. Manda por MobaXterm únicamente el archivo o carpeta que cambiaste.
2. Si el cambio fue en la parte visual (React), dile a Docker que repinte exclusivamente el código del frontend (esto toma sólo unos segundos):
```bash
docker compose build frontend
docker compose up -d frontend
```
*(Si modificaste algo del lado de Python, cambias la palabra `frontend` por `backend` en esos dos comandos).*

---

### Solución a Problemas Rápidos
- **El Docker Compose explota o crashea:** Significa que algo interrumpió el apagado y un contenedor híbrido sigue vivo. Bórralo con `docker compose down` o explícitamente `docker rm -f dashboard-frontend dashboard-backend`.
- **Los diseños cargan sin colores (CSS en blanco):** Indica que Docker corrompió el `.next`. Asegúrate que el `.dockerignore` existe dentro de la carpeta `frontend/` y vuelve a ejecutar la recompilación.
- **Port already in use 0.0.0.0:3000:** Significa que Caddy (o el dashboard viejo) no ha soltado el puerto. Recuerda que este Compose usa internamente el `3001:3000` para frontend y el `5000:5000` para backend. Si persiste, usa `docker compose down`.
