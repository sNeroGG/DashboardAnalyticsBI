# Guía de Despliegue con Docker

Esta guía te ayudará a subir y levantar el Dashboard en tu servidor sin afectar otros servicios, aislando todo en una carpeta dedicada.

## 1. Requisitos previos en el Servidor
Asegúrate de que el servidor tenga instalado:
- **Docker**: `docker --version`
- **Docker Compose**: `docker-compose --version`

## 2. Preparación (En tu PC local)
Antes de subir los archivos por MobaXterm:
1. Revisa tu archivo `backend/.env` y asegúrate de que las credenciales sean las correctas para el servidor.
2. En `docker-compose.yml`, verifica el puerto del frontend (configurado en `3000:3000`).

## 3. Transferencia (MobaXterm)
1. Abre MobaXterm y conéctate a tu servidor por SSH.
2. Crea una carpeta dedicada para el proyecto, por ejemplo: `mkdir ~/bi-dashboard`.
3. Arrastra y suelta **todo el contenido** de tu carpeta local `dashboard/` a la carpeta `~/bi-dashboard` en el servidor (puedes excluir `node_modules` y `__pycache__` para que sea más rápido).

## 4. Despliegue
Dentro de la terminal del servidor (dentro de la carpeta del proyecto):

```bash
# Entrar a la carpeta
cd ~/bi-dashboard

# Levantar los contenedores (esto descargará imágenes y construirá el app)
docker-compose up -d --build
```

## 5. Verificar estado
```bash
# Ver si los contenedores están corriendo
docker-compose ps

# Ver logs en tiempo real si algo falla
docker-compose logs -f

# 6. Cargar datos maestros (IMPORTANTE)
# La primera vez, debes cargar los datos de Odoo ejecutando esto dentro del contenedor del backend:
docker exec -it dashboard-backend python masters_loader.py
```

## Solución de Problemas Comunes

### Error de CORS (Acceso Denegado)
Si accedes al dashboard desde una IP externa (no localhost), es posible que el navegador bloquee las peticiones al backend.
- En `backend/bi_service.py`, localiza la sección de `CORS`.
- Cambia `origins=["http://localhost:3000"]` por `origins=["*"]` para permitir cualquier origen (o pon la IP de tu servidor).

### Cambiar la IP del Backend en el Frontend
Si el frontend no logra conectar con el backend:
1. Edita el archivo `docker-compose.yml`.
2. Cambia `NEXT_PUBLIC_API_URL=http://localhost:5000` por `NEXT_PUBLIC_API_URL=http://TU_IP_SERVIDOR:5000`.
3. Reinicia con `docker-compose up -d`.

## Ventajas de este método:
- **Aislamiento total**: No tocas el Python del servidor ni instalas nada globalmente.
- **Portabilidad**: Si cambias de servidor, solo mueves la carpeta y vuelves a ejecutar `docker-compose up`.
- **Persistencia**: Los reportes y el cache se guardan en carpetas locales vinculadas al contenedor.

---
**Nota sobre el API URL**: Si vas a acceder desde fuera del servidor por su IP pública, asegúrate de cambiar `NEXT_PUBLIC_API_URL` en el `docker-compose.yml` por la IP de tu servidor: `http://123.123.123.123:5000`.
