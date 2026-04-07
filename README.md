# Dashboard BI Analytics

Este proyecto es un dashboard interactivo diseñado para mostrar inteligencia de negocios (BI). Está dividido en dos partes principales: un **backend** en Python y un **frontend** desarrollado con React y Next.js.

## Arquitectura del Proyecto

Tras la reestructuración, la arquitectura del proyecto quedó dividida en dos módulos lógicos para mejorar la mantenibilidad y organización:

### 1. `backend/` (Flask API)
El backend es una API REST responsable de autenticar usuarios contra un sistema ERP (Odoo), autorizaciones (comprobar el acceso a Dashboard) y recopilar y devolver los reportes.
- **`bi_service.py`**: El punto de entrada de la aplicación Flask. Configura JWT (JSON Web Tokens) para las sesiones y expone las rutas REST `/api/auth/login`, `/api/bi/masters` y `/api/bi/report/ventas`.
- **`config.py` y `config.json`**: Sistema de configuraciones, usado para mantener las credenciales y rutas.
- **`core/`**: Carpeta para lógicas compartidas:
  - `odoo_client.py`: Contiene la clase `OdooClient` que abstrae las peticiones hacia el Odoo externo.
  - `security.py`: Capa de seguridad, que revisa el permiso de acceso.
  - `utils.py`: Herramientas de cifrado MD5 limitadas y dependencias simples.
- **`cache/`**: Archivos estáticos `.json` donde se guardan temporalmente los resultados de los reportes.
- *(Nota)* Ocasionalmente se buscarán librerías externas o conectas de reportes (como `reporte_ventas`).

### 2. `frontend/` (Next.js Application)
El frontend proporciona la interfaz de usuario interactiva y fluída.
- **`app/`**: Sistema de routing o 'App Router'.
  - `app/login/`: Iniciar sesión.
  - `app/dashboard/`: Tablero interactivo; el componente invocado y visualizado final reside en `page.tsx`.
- **`components/ui/`**: Componentes básicos y primitivos en Tailwind (botones, contenedores Card, inputs).
- **`components/dashboard/`**: Las piezas del lienzo: `charts-section`, `data-table`, `filters-section`, y `stats-cards`.
- **`lib/`**: Archivos núcleo para solicitudes.
  - `api.ts`: Controlador con Axios.
  - `types.ts`: TypeScript que describe las bases de datos.

---

## Las Variables en el Dashboard (Ejemplo)

Una de las características más importantes de este dashboard es que su formato de retorno al frontend es estricto en su tipado, permitiendo que la interfaz de usuario siempre sepa qué datos le corresponden a qué sección.  
En el código fuente de Typescript (`frontend/lib/types.ts`) se definen las siguientes variables críticas que componen una fila de reporte y que verás desplegadas en la pantalla:

| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `fecha` | `string` | La fecha correspondiente al corte actual del reporte. |
| `total_cuentas` | `number` | La cantidad de comandas, recibos o cuentas finalizadas. |
| `total_pagado` | `number` | Es el gran ingreso total sumado de la fecha respectiva. |
| `alimentos` | `number` | El sub-total de venta en productos clasificados como comida. |
| `bebidas` | `number` | El sub-total de ingresos procedentes de ventas líquidas ("bebidas"). |
| `propina` | `number` | Excedente o aportaciones libres captadas en propinas. |
| `otros` | `number` | Variables monetarias ajenas a propinas o alimenticios. |
| `restaurante_efectivo` | `number` | Método de pago en dinero físico reportado para la caja registradora. |
| `tarjeta` | `number` | Método de pago virtual o por TPV (Terminal Punto de Venta). |

En cuanto tu servidor compila la vista, herramientas como la interfaz de `charts-section.tsx` mapean estas variables contra un plano cartesiano (eje de tiempo para **fecha**, eje Y para métricas como **total\_pagado**) y las dibujan a color de forma automatizada sobre la tabla.

## Cómo Ejecutar el Proyecto
Para mantener la autonomía, aquí te decimos cómo levantar ambos entes por separado.

**Para el Backend:**
```bash
cd backend
python bi_service.py
```
*(El servidor escuchará por defecto en el puerto `5005` y provee tokens JWT y un modo de desarrollo)*

**Para el Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*(Estará disponible en http://localhost:3000)*
