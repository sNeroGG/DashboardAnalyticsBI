# Dashboard Leads Odoo

Este proyecto es un robusto ecosistema de Inteligencia de Negocios (BI) diseñado para extraer, procesar y visualizar métricas críticas de ventas desde Odoo ERP en tiempo real. Está optimizado para ser implementado como una solución "marca blanca" en diversos clientes, facilitando el control operativo de restaurantes y puntos de venta (POS).

## 🚀 Innovaciones y Funcionalidades Principales

### 1. Navegación Inteligente y Pestañas de Análisis
El dashboard cuenta con un sistema de navegación dual que separa la operación diaria del análisis estratégico:
- **Dashboard General**: Una vista limpia y minimalista filtrada por fechas para observar el rendimiento global del negocio.
- **Análisis Avanzado**: Un entorno de filtros matemáticos profundos donde los usuarios pueden segmentar por **Cajeros/Vendedores**, **Métodos de Pago** y **Estado de Venta**.

### 2. Filtros Matemáticos Reales (Backend Driven)
A diferencia de otros dashboards, los filtros aquí no son solo visuales. El backend en Python procesa cada selección para recalcular:
- **Filtrado de Usuarios**: Exclusión total de montos y transacciones de usuarios no seleccionados en el `domain` de búsqueda.
- **Filtrado de Pagos**: Desglose exacto de pagos mixtos (Efectivo vs. Tarjeta) en el cálculo de totales cuando se aplican filtros.

### 3. Jerarquía de Datos: Jornadas y Sesiones
El reporte agrupa la información siguiendo la lógica de negocio real:
- **Jornada Laboral**: Agrupación administrativa por día contable para cuadrar con el cierre operativo. *(Nota: Por defecto está calibrado para considerar turnos con desfase horario, ajustable en el backend).*
- **Sesiones de Odoo**: Identificación de cada apertura y cierre de caja (`pos.session`) dentro de un día.
- **Desglose de Cuentas**: Acceso granular a cada ticket individual (`pos.order`), su estado (Pagado/Facturado) y otros detalles específicos del servicio.

## 📂 Estructura del Proyecto e Implementación

El proyecto se divide en dos bloques principales (Frontend y Backend) orquestados mediante Docker.

```text
dashboard/
├── docker-compose.yml       # Orquestador principal de servicios
├── DEPLOY.md                # Instrucciones de despliegue en producción
├── README.md                # Este archivo
├── backend/                 # API REST (Python / Flask)
│   ├── bi_service.py        # Archivo principal del servidor Flask y rutas
│   ├── config.py            # Manejo de variables de entorno y configuración
│   ├── masters_loader.py    # Script de carga inicial de catálogos desde Odoo
│   ├── tests/               # Scripts de validación y depuración (No afecta prod)
│   ├── core/                # Funciones base (conexión a Odoo, utilidades, seguridad)
│   └── reports/             # Lógica de extracción de datos
│       ├── reporte_ventas.py         # 🧠 Cerebro del sistema: Lógica de extracción Odoo
│       └── advanced_analytics.py     # Lógica matemática de los filtros avanzados
└── frontend/                # Interfaz Gráfica (Next.js / Tailwind CSS)
    ├── package.json
    ├── next.config.js       # Configuración del servidor React
    ├── app/                 # Sistema de enrutamiento (Pages)
    │   ├── dashboard/       # Vista principal del Dashboard
    │   └── login/           # Pantalla de Autenticación
    ├── components/          # Componentes Visuales Reutilizables
    │   ├── ui/              # Componentes base (Botones, inputs, tarjetas)
    │   └── dashboard/       # Componentes lógicos del dashboard
    │       ├── data-table.tsx       # Tabla principal de datos
    │       ├── filters-section.tsx  # 🎛️ Controles: Filtros de fecha, usuarios y pagos
    │       ├── stats-cards.tsx      # Tarjetas de resumen métrico superior
    │       └── advanced-analytics.tsx # Pestaña de análisis en profundidad
    └── lib/                 # Utilidades del frontend
        ├── api.ts           # Cliente Axios para conectar con el Backend
        └── types.ts         # Tipado estricto de TypeScript
```

### ⚙️ ¿Dónde modificar parámetros clave para nuevos clientes?

- **Configuración de Variables de Odoo**: En el archivo `backend/.env` (Crea uno a partir de `backend/.env.example`).
- **Lógica de Filtros y Casillas de Verificación**: 
  - *Frontend:* `frontend/components/dashboard/filters-section.tsx` (Aquí se renderizan los checkboxes y selectores de fecha).
  - *Backend:* `backend/reports/reporte_ventas.py` (Aquí se aplican las reglas de negocio sobre lo que seleccionó el usuario).
- **Ajuste de Horarios de Turnos**: En `backend/bi_service.py` (Ruta `/api/bi/report/ventas`), ajusta el `timedelta(hours=X)` según la zona horaria y horario de cierre del cliente.
- **Tipos de Pago (Efectivo/Tarjeta)**: Para cambiar cómo se nombran o mapean, revisa `backend/reports/reporte_ventas.py` y `frontend/lib/types.ts`.
- **Productos Especiales (ej. Propinas)**: La lógica de productos fijos (como un ID específico de propina) se procesa en el ciclo iterativo dentro de `backend/reports/reporte_ventas.py`.

## 🛠️ Ejecución del Proyecto para Nuevos Usuarios

Esta plataforma está configurada para garantizar un ambiente seguro, limpio y libre de conflictos gracias a la adopción del estándar *Docker Compose v2*. Para instrucciones de producción (Servidores en Vivo y Proxies Caddy), lee obligatoriamente el archivo maestro **`DEPLOY.md`**.

### 1. Requisitos Previos
- Instalar **Docker** y el plugin moderno de **Docker Compose** (versión V2+).
- Mapeo de puertos configurado por defecto: 
  - Frontend (NextJS): `3001`
  - Backend (Flask/Python): `5000`

### 2. Variables de Entorno (.env)
Antes de iniciar, configura las credenciales de la base de datos objetivo:
1. Dirígete a la carpeta `/backend/` e identifica el archivo `.env.example`.
2. Duplícalo y renómbralo a `.env`.
3. Rellena las credenciales de Odoo (URL, Base de Datos, Usuario/API Key).
*(Activa `DEV_MODE=True` en el `.env` si necesitas evitar el login de seguridad durante las pruebas locales).*

### 3. Levantar el Entorno Inmediato
Gracias a que hemos configurado archivos `.dockerignore` estrictos, todo es automático. No necesitas instalar dependencias de Node o de Python de forma nativa ni preocuparte por cachés bloqueados.

Desde la raíz del proyecto:

```bash
# Empacar y crear los contenedores desde cero
docker compose build

# Levantar silenciosa y eficientemente
docker compose up -d
```

Si necesitas deshacer, destruir o reiniciar el sistema entero:
```bash
docker compose down
```

---
*Dashboard Leads Odoo: Transforma el caos de datos crudos de tu ERP en decisiones estratégicas inteligentes, eficientes y seguras, adaptable a cualquier negocio.*
