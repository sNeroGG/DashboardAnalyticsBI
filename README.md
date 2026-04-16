# Dashboard BI Analytics - Herradura Odoo Integration

Este proyecto es un robusto ecosistema de Inteligencia de Negocios (BI) diseñado para extraer, procesar y visualizar métricas críticas de ventas desde Odoo ERP en tiempo real. Está optimizado para el control operativo de restaurantes y puntos de venta (POS).

## 🚀 Innovaciones y Funcionalidades Recientes

### 1. Navegación Inteligente y Pestañas de Análisis
El dashboard ahora cuenta con un sistema de navegación dual que separa la operación diaria del análisis estratégico:
- **Dashboard General**: Una vista limpia y minimalista filtrada por fechas para observar el rendimiento global del negocio.
- **Análisis Avanzado**: Un entorno de filtros matemáticos profundos donde los usuarios pueden segmentar por **Cajeros/Vendedores**, **Métodos de Pago** y **Estado de Venta**.

### 2. Filtros Matemáticos Reales (Backend Driven)
A diferencia de otros dashboards, los filtros aquí no son solo visuales. El backend en Python procesa cada selección para recalcular:
- **Filtrado de Usuarios**: Exclusión total de montos y transacciones de usuarios no seleccionados en el `domain` de búsqueda.
- **Filtrado de Pagos**: Desglose exacto de pagos mixtos (Efectivo vs. Tarjeta) en el cálculo de totales cuando se aplican filtros de método de pago. Si eliges "Solo Efectivo", el reporte restará automáticamente lo cobrado por terminal.

### 3. Motor de Propinas de Alta Precisión
Se implementó un motor de búsqueda profunda en las líneas de pedido de Odoo para identificar el producto **"Propina" (ID 399)**. Esto soluciona la falta de datos en el campo estándar de Odoo, devolviendo sumatorias exactas de propina captada por sesión, por día y por cuenta individual.

### 4. Jerarquía de Datos: Jornadas y Sesiones
El reporte agrupa la información siguiendo la lógica de negocio real:
- **Jornada Laboral (Turno 4AM - 4AM)**: Agrupación administrativa por día contable para cuadrar con el cierre de restaurante.
- **Sesiones de Odoo**: Identificación de cada apertura y cierre de caja (`pos.session`) dentro de un día.
- **Desglose de Cuentas**: Acceso granular a cada ticket individual (`pos.order`), su estado (Pagado/Facturado) y la propina específica generada en ese servicio.

## 🛠️ Arquitectura Técnica

### Backend (Python / Flask)
API REST encargada de la lógica pesada y conectividad segura:
- **`bi_service.py`**: Servidor Flask con seguridad JWT.
- **`reports/reporte_ventas.py`**: El cerebro del sistema. Realiza consultas optimizadas a Odoo y consolida la jerarquía Días -> Sesiones -> Pedidos. Incorpora lógica de nombres dinámicos: *SESION "Nombre_de_Sesion"*.
- **`cache/`**: Sistema de almacenamiento local para respuestas rápidas y reducción de carga en el servidor Odoo.

### Frontend (Next.js / Tailwind CSS / Lucide)
Interfaz premium con enfoque en UX:
- **Diseño Moderno**: Uso de tarjetas de métricas con iconos dinámicos y estados de color (Efectivo en azul, Tarjeta en púrpura, Propina en ámbar).
- **Componentes React**:
  - `StatsCards`: Resumen ejecutivo de 5 métricas clave, incluyendo Propina como métrica primaria.
  - `DataTable`: Visualización jerárquica con filas expandibles para sesiones y cuentas con desglose de propinas.
  - `FiltersSection`: Selector inteligente de Mes, Año o día exacto.

## 📊 Variables Críticas del Reporte

| Variable | Descripción |
| :--- | :--- |
| `total_pagado` | Ingreso neto total procesado en el periodo. |
| `propina` | Calculada mediante la sumatoria del Producto ID 399 en `pos.order.line`. |
| `total_cuentas` | Conteo de tickets de venta generados (excluyendo cancelaciones). |
| `restaurante_efectivo` | Suma de montos captados en efectivo (Excluye método de pago ID 2). |
| `tarjeta` | Suma de montos captados mediante terminales bancarias (Método de pago ID 2). |

## ⚙️ Ejecución del Proyecto para Nuevos Usuarios

Esta plataforma está configurada para garantizar un ambiente seguro, limpio y libre de conflictos gracias a la adopción del estándar *Docker Compose v2*. Para instrucciones de producción (Servidores en Vivo y Proxies Caddy), lee obligatoriamente el archivo maestro **`DEPLOY.md`**.

### 1. Requisitos Previos
- Instalar **Docker** y el plugin moderno de **Docker Compose** (versión V2+). No utilices el comando antiguo con guion (`docker-compose`).
- Mapeo de puertos configurado por defecto: 
  - Frontend (NextJS): `3001`
  - Backend (Flask/Python): `5000`

### 2. Variables de Entorno (.env)
Antes de iniciar, debes preparar las llaves del castillo:
1. Dirígete a la carpeta `/backend/` e identifica el archivo `.env.example`.
2. Duplícalo y renómbralo a `.env`.
3. Rellena las credenciales de tu base de datos Odoo objetivo.
*(Activa `DEV_MODE=True` si necesitas evitar el login de seguridad durante las pruebas locales)*.

### 3. Levantar el Entorno Inmediato
Gracias a que hemos configurado archivos `.dockerignore` estrictos, todo es automático. No necesitas instalar dependencias de Node o de Python de forma nativa ni preocuparte por cachés bloqueados.

Vuela a la raíz del proyecto y enciende los motores:

```bash
# Empacar y crear los contenedores desde cero
docker compose build

# Levantar silenciosa y eficientemente
docker compose up -d
```

Si necesitas deshacer, destruir o reiniciar el sistema entero para recuperar el control sin dejar rastros de recursos en el servidor:
```bash
docker compose down
```

---
*Este proyecto transforma el caos de datos crudos de tu ERP Odoo en decisiones estratégicas inteligentes, eficientes y seguras.*
