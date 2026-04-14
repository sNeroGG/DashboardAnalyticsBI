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

## ⚙️ Ejecución del Proyecto

### Desarrollo Local
1.  **Backend**: `cd backend && python bi_service.py` (Puerto 5000).
2.  **Frontend**: `cd frontend && npm run dev` (Puerto 3000).

*Nota: Asegúrate de tener configurado el archivo `.env` en la carpeta `backend` con las credenciales de Odoo y `DEV_MODE=True` para omitir login en pruebas.*

### Producción (Docker)
Levanta todo el stack con un solo comando:
```bash
docker-compose up -d --build
```

---
*Este proyecto transforma datos crudos de Odoo en decisiones estratégicas inteligentes.*
