# Guía Maestra de Despliegue con Docker

Esta guía describe el flujo recomendado para actualizar el proyecto utilizando Git, compilar los contenedores mediante Docker Compose y asegurar un arranque estable del sistema tanto en desarrollo local como en el servidor de producción.

---

## 1. 🔄 Flujo de Actualización Rápida (Git Pull)

Cuando realices cambios en tu repositorio local y quieras desplegarlos en el servidor, sigue este flujo ordenado:

1. **Entrar al directorio del proyecto en el servidor:**
   ```bash
   cd /ruta/a/tu/dashboard
   ```

2. **Descargar los últimos cambios desde Git:**
   ```bash
   git pull origin main
   ```

3. **Recompilar y levantar los contenedores actualizados:**
   Docker Compose detectará qué archivos han cambiado (ej. dependencias en `package.json` o `requirements.txt`) y reconstruirá solo las partes necesarias:
   ```bash
   docker compose up -d --build
   ```

4. **Verificar el estado de los contenedores:**
   ```bash
   docker compose ps
   ```

---

## 2. 🚀 Configuración Inicial y Arranque desde Cero

Si es la primera vez que levantas el proyecto en el servidor o si deseas realizar una limpieza total para liberar recursos:

1. **Configurar las Variables de Entorno (`.env`):**
   Asegúrate de tener el archivo `.env` configurado en la carpeta `backend/`. Si no existe, créalo copiando el ejemplo:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *Edita las credenciales de Odoo en `backend/.env` antes de levantar los contenedores.*

2. **Apagar contenedores anteriores (limpieza completa):**
   ```bash
   docker compose down
   ```

3. **Compilar y levantar en segundo plano (arranque limpio):**
   ```bash
   docker compose up -d --build --force-recreate
   ```
   - El backend estará disponible en el puerto `5000`.
   - El frontend (Next.js) estará disponible en el puerto `3001` (para enlazarse con Caddy/Nginx en producción).

---

## 📦 3. Sincronización Manual de Catálogos (Masters)

El sistema ahora cuenta con un mecanismo de auto-carga en segundo plano al arrancar y sincronización automática al hacer clic en **"Sincronizar"** en la interfaz. Si por algún motivo necesitas forzar la descarga de catálogos (usuarios, métodos de pago, categorías de producto) de Odoo desde la terminal, puedes ejecutar el siguiente comando dentro del contenedor de backend:

```bash
docker compose exec backend python masters_loader.py
```

---

## 🛠️ 4. Solución a Problemas Frecuentes

- **Puerto ocupado (Port 3001 already in use):**
  Significa que un contenedor o servicio anterior no ha liberado el puerto. Detén todo con:
  ```bash
  docker compose down
  ```
  Si el problema persiste, fuerza la eliminación de contenedores huérfanos:
  ```bash
  docker rm -f dashboard-frontend dashboard-backend
  ```

- **Cambios visuales no se reflejan (Caché de Next.js):**
  Next.js compila el sitio durante el build. Si los cambios no se ven en el navegador, fuerza una recompilación limpia del frontend sin usar la caché de Docker:
  ```bash
  docker compose build --no-cache frontend
  docker compose up -d frontend
  ```

- **Diseños sin colores (CSS roto):**
  Asegúrate de que no se hayan subido las carpetas `.next` o `node_modules` locales al servidor, ya que pueden corromper la compilación dentro del contenedor. El archivo `.dockerignore` en `frontend/` y `backend/` protege contra esto automáticamente en el flujo de Docker.
