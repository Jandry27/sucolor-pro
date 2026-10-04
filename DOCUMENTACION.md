# 📖 DOCUMENTACIÓN COMPLETA — SuColor Portal

> Documento técnico y funcional de todo el proyecto. Cubre arquitectura, rutas, páginas, componentes, hooks, servicios, tipos, base de datos, estilos y mucho más.

---

## 📑 Tabla de Contenidos

1. [¿Qué es SuColor?](#-qué-es-sucolor)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura de Carpetas](#-estructura-de-carpetas)
4. [Rutas de la Aplicación](#-rutas-de-la-aplicación)
5. [Páginas Públicas](#-páginas-públicas)
6. [Páginas de Administración](#-páginas-de-administración)
7. [Componentes Compartidos](#-componentes-compartidos-público)
8. [Componentes de Administración](#-componentes-de-administración)
9. [Componentes de Reportes](#-componentes-de-reportes)
10. [Hooks (Ganchos)](#-hooks-ganchos)
11. [Servicios](#-servicios)
12. [Biblioteca / Utilidades](#-biblioteca--utilidades)
13. [Tipos TypeScript](#-tipos-typescript)
14. [Base de Datos (Supabase)](#-base-de-datos-supabase)
15. [Sistema de Estilos CSS](#-sistema-de-estilos-css)
16. [Sistema de Sonidos](#-sistema-de-sonidos)
17. [Configuración del Proyecto](#-configuración-del-proyecto)
18. [Flujo Completo de una Orden](#-flujo-completo-de-una-orden)
19. [Facturación Electrónica SRI](#-facturación-electrónica-sri)

---
## 🎨 ¿Qué es SuColor?

**SuColor** es una aplicación web para un **taller automotriz** especializado en latonería, pintura y restauración de vehículos, ubicado en **Loja, Ecuador** (Machala y Jaramijo).

La aplicación tiene **dos grandes áreas**:

| Área | Acceso | Descripción |
|------|--------|-------------|
| **Portal Público** | Cualquier cliente | Seguimiento de órdenes con código de placa/nombre |
| **Panel Administrativo** | Solo empleados autenticados | Gestión completa del taller |

### ¿Qué puede hacer cada usuario?

**Cliente (público):**
- Buscar su vehículo por placa o nombre
- Ver el estado actual de la reparación (8 estados posibles)
- Ver la barra de progreso visual
- Ver fotos del proceso (Antes, Proceso, Después)
- Ver la línea de tiempo de actividades
- Ver notas públicas del taller
- Ver gastos visibles (si están habilitados)

**Administrador:**
- Iniciar sesión con email/contraseña (Supabase Auth)
- Dashboard con Kanban de órdenes activas
- Crear y gestionar órdenes completas
- Gestionar clientes y vehículos
- Registrar pagos, abonos y gastos
- Subir fotos/videos por categoría
- Compartir enlace público con token seguro
- Ver historial completo de un vehículo
- Generar reportes (ganancias, historial, taller, rentabilidad, garantías)
- Emitir facturas electrónicas SRI (Ecuador)
- Gestionar inventario de pinturas sobrantes
- Configurar datos fiscales de la empresa

---

## 🛠 Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 18.3.1 | Framework UI |
| **TypeScript** | 5.4.5 | Tipado estático |
| **Vite** | 5.2.11 | Bundler y dev server |
| **React Router DOM** | 6.23.1 | Enrutamiento (HashRouter) |
| **Supabase JS** | 2.105.4 | BaaS: DB + Auth + Storage |
| **Framer Motion** | 11.1.7 | Animaciones fluidas |
| **Lucide React** | 0.378.0 | Iconografía |
| **OGL** | 1.0.11 | WebGL para CromoLiquido |
| **ec-sri-invoice-signer** | 1.7.0 | Firma electrónica SRI |
| **Axios** | 1.6.8 | Peticiones HTTP |
| **TailwindCSS** | 3.4.3 | Clases de utilidad CSS |
| **Vercel Speed Insights** | 2.0.0 | Métricas de rendimiento |
| **Vitest** | 1.6.0 | Testing |

### Comandos NPM disponibles

```bash
npm run dev        # Servidor de desarrollo (Vite)
npm run build      # Build de producción
npm run preview    # Preview del build
npm run lint       # Linting con ESLint
npm run lint:fix   # Arreglar lint automáticamente
npm run format     # Formatear con Prettier
npm run test       # Tests con Vitest (modo watch)
npm run test:run   # Tests en una sola pasada
npm run coverage   # Cobertura de tests
npm run deploy     # Deploy a GitHub Pages (gh-pages)
```

---

## 📁 Estructura de Carpetas

```
SuColor/
├── config/                   # Configuración de Vite y Vitest
├── public/                   # Assets estáticos (logo.png, favicon...)
├── scripts/                  # Scripts auxiliares
├── supabase/                 # Migraciones y funciones SQL
│   ├── migrations/           # Migraciones de base de datos
│   ├── functions/            # Edge Functions de Supabase
│   ├── sql/                  # Scripts SQL adicionales
│   ├── setup_admin_profile.sql
│   ├── setup_sri_invoicing.sql
│   ├── admin_rls_policies.sql
│   ├── fix_media_rls.sql
│   ├── fix_rls_recursion.sql
│   └── add_payment_columns.sql
├── src/
│   ├── App.tsx               # Componente raíz + rutas
│   ├── main.tsx              # Entry point React
│   ├── index.css             # Design system + estilos globales
│   ├── vite-env.d.ts         # Tipos de variables de entorno
│   │
│   ├── paginas/              # Páginas / vistas completas
│   │   ├── PaginaInicio.tsx       # Landing pública (531 líneas)
│   │   ├── PaginaSeguimiento.tsx  # Portal de seguimiento cliente (186 líneas)
│   │   └── administracion/        # Páginas del panel admin
│   │       ├── PaginaInicioSesion.tsx
│   │       ├── PaginaPanel.tsx          # Dashboard (143 líneas)
│   │       ├── PaginaListaOrdenes.tsx
│   │       ├── PaginaNuevaOrden.tsx     # Wizard 3 pasos (1275 líneas)
│   │       ├── PaginaDetalleOrden.tsx
│   │       ├── PaginaClientes.tsx       # ~30KB
│   │       ├── PaginaVehiculos.tsx      # ~19KB
│   │       ├── PaginaPinturas.tsx       # ~22KB
│   │       ├── PaginaReportes.tsx       # Hub de reportes (188 líneas)
│   │       └── PaginaConfiguracion.tsx  # Config SRI (431 líneas)
│   │
│   ├── componentes/          # Componentes reutilizables
│   │   ├── CromoLiquido.tsx       # Efecto WebGL (hero de landing)
│   │   ├── CromoLiquido.css
│   │   ├── EncabezadoOrden.tsx    # Header de seguimiento (~9KB)
│   │   ├── EsqueletoCarga.tsx     # Loading skeleton (~3.5KB)
│   │   ├── EstadoError.tsx        # Pantalla de error (~1.7KB)
│   │   ├── FormularioBusqueda.tsx # Buscador público (~3KB)
│   │   ├── GaleriaMedia.tsx       # Galería fotos/videos (~13KB)
│   │   ├── InterruptorTema.tsx    # Toggle dark/light mode (~1.7KB)
│   │   ├── LineaTiempo.tsx        # Timeline de eventos (~5.7KB)
│   │   ├── NotasPublicas.tsx      # Notas visibles al cliente (~3KB)
│   │   ├── PanelGastosPublico.tsx # Gastos visibles al cliente (~8KB)
│   │   ├── ProgresoOrden.tsx      # Barra de progreso 8 pasos (~6KB)
│   │   ├── ProveedorTema.tsx      # Context Provider de tema (~1KB)
│   │   └── administracion/        # Componentes del panel admin
│   │       ├── DisenoAdministracion.tsx    # Layout sidebar (~6.5KB)
│   │       ├── RutaProtegida.tsx           # HOC autenticación (~731B)
│   │       ├── TableroKanban.tsx           # Vista Kanban (~3.7KB)
│   │       ├── TarjetaOrden.tsx            # Tarjeta de orden (~5KB)
│   │       ├── ModalFactura.tsx            # Modal SRI (~50KB, 989 líneas)
│   │       ├── PanelPagos.tsx              # Gestión pagos/abonos (~27KB)
│   │       ├── PanelGastos.tsx             # Gestión de gastos (~19KB)
│   │       ├── PanelSubidaFotos.tsx        # Upload de media (~13KB)
│   │       ├── HistorialVehiculoLateral.tsx # Sidebar historial (~15KB)
│   │       ├── DetalleOrden/               # Sub-componentes del detalle
│   │       │   ├── EncabezadoDetalleOrden.tsx      (~4KB)
│   │       │   ├── FormularioEdicionDetalleOrden.tsx (~6KB)
│   │       │   ├── TarjetaEstadoDetalleOrden.tsx   (~6.8KB)
│   │       │   └── TarjetaNotasDetalleOrden.tsx    (~6KB)
│   │       └── reportes/                   # Componentes de reportes
│   │           ├── EncabezadoImpresion.tsx          (~4KB)
│   │           ├── ReporteGanancias.tsx             (~15KB)
│   │           ├── ReporteHistorialVehiculo.tsx     (~34KB — el mayor)
│   │           ├── ReporteGarantiasRetrabajos.tsx   (~23KB)
│   │           ├── ReporteRentabilidadMarca.tsx     (~21KB)
│   │           └── ReporteVehiculosTaller.tsx       (~17KB)
│   │
│   ├── ganchos/              # Custom Hooks de React
│   │   ├── useAutenticacion.ts        (~1.7KB)
│   │   ├── useBusquedaOrden.ts        (~1.1KB)
│   │   ├── useOrdenAdministracion.ts  (~13KB, 333 líneas)
│   │   ├── useOrdenes.ts              (~7.4KB, 171 líneas)
│   │   ├── usePinturas.ts             (~3.5KB, 102 líneas)
│   │   └── useSeguimientoOrden.ts     (~3.7KB)
│   │
│   ├── servicios/            # Llamadas a API/Supabase directas
│   │   ├── buscarOrden.ts    (~1.8KB)
│   │   └── seguirOrden.ts    (~3KB)
│   │
│   ├── biblioteca/           # Utilidades, constantes y helpers
│   │   ├── auditoria.ts          (~524B)
│   │   ├── clienteSupabase.ts    (~703B)
│   │   ├── constantes.ts         (~4.8KB, 148 líneas)
│   │   ├── sanitizar.ts          (~716B)
│   │   ├── sonidos.ts            (~15.7KB, 249 líneas)
│   │   └── utilidadesReporte.ts  (~3.4KB)
│   │
│   ├── tipos/                # Interfaces y tipos TypeScript
│   │   ├── index.ts          # Todos los tipos (~5.7KB, 202 líneas)
│   │   └── supabase.ts       # Tipos del cliente Supabase
│   │
│   └── pruebas/              # Tests (Vitest)
│
├── .env                      # Variables de entorno (gitignored)
├── .env.example              # Plantilla de variables
├── index.html                # HTML raíz con meta tags SEO
├── package.json
├── tsconfig.json
├── vercel.json               # Config de deploy Vercel
└── DOCUMENTACION.md          # Este archivo
```

---
## 🗺 Rutas de la Aplicación

La app usa **HashRouter** (rutas con `#`) para compatibilidad con hosting estático (Vercel / GitHub Pages).

```
#/                                    → PaginaInicio (landing pública)
#/track/:codigo?token=xxx             → PaginaSeguimiento (seguimiento cliente)

#/administracion/login                → PaginaInicioSesion
#/administracion/dashboard            → PaginaPanel [PROTEGIDA]
#/administracion/orders               → PaginaListaOrdenes [PROTEGIDA]
#/administracion/orders/nueva         → PaginaNuevaOrden [PROTEGIDA]
#/administracion/orders/:id           → PaginaDetalleOrden [PROTEGIDA]
#/administracion/clientes             → PaginaClientes [PROTEGIDA]
#/administracion/vehiculos            → PaginaVehiculos [PROTEGIDA]
#/administracion/pinturas             → PaginaPinturas [PROTEGIDA]
#/administracion/reportes             → PaginaReportes [PROTEGIDA]
#/administracion/configuracion        → PaginaConfiguracion [PROTEGIDA]

#/admin                               → Redirect legacy a /administracion/orders
#/*                                   → Página 404 personalizada
```

> **Rutas Protegidas**: El componente `RutaProtegida` verifica sesión activa en Supabase. Si no hay usuario, redirige a `/administracion/login`.

---

## 🌐 Páginas Públicas

### `PaginaInicio.tsx`
**Ruta:** `#/`  
**Archivo:** `src/paginas/PaginaInicio.tsx` (531 líneas)

Landing page con múltiples secciones animadas:

| Sección | Contenido |
|---------|-----------|
| **Hero** | CromoLiquido WebGL + formulario de búsqueda + tagline |
| **Cómo funciona** | 3 pasos: Buscar → Acceso instantáneo → Seguir progreso |
| **Beneficios** | Lista de 6 características del sistema |
| **Stats** | 4 métricas: 500+ vehículos, 98% satisfacción, 15+ años, 24h |
| **CTA** | Banner naranja invitando a buscar |
| **Footer** | Datos del taller, horario, contacto, WhatsApp |

**Componente interno `FadeIn`:** Wrapper con animación scroll-triggered via `useInView` de Framer Motion. El `margin: '-120px 0px'` dispara la animación antes de entrar al viewport, evitando pantallas en blanco en iPad.

---

### `PaginaSeguimiento.tsx`
**Ruta:** `#/track/:codigo?token=xxx`  
**Archivo:** `src/paginas/PaginaSeguimiento.tsx` (186 líneas)

Portal de seguimiento para el cliente final.

```
┌─────────────────────────────────────────┐
│  HEADER STICKY (negro + borde naranja)   │
│  Logo | "Portal de seguimiento" | Refresh│
├─────────────────────────────────────────┤
│  ENCABEZADO ORDEN                        │
│  Foto cover + Info vehículo + Fechas     │
├─────────────┬───────────────────────────┤
│ PROGRESO    │  NOTAS PÚBLICAS           │
│ Barra 8     │  Notas del taller         │
│ estados     │  (bitácora de actividad)  │
├─────────────┴───────────────────────────┤
│  GALERÍA DE MEDIA                        │
│  Tabs: Antes | Proceso | Después         │
│  Grid de fotos y videos + lightbox       │
├─────────────────────────────────────────┤
│  PANEL GASTOS (solo si tiene gastos)     │
├─────────────────────────────────────────┤
│  FOOTER negro + naranja                  │
│  Logo | Ubicación | Horario | Contacto   │
└─────────────────────────────────────────┘
```

**Estados de carga:**
- Loading → `EsqueletoCarga` (skeleton shimmer)
- Error / no autorizado → `EstadoError` con botón de reintento

---

## 🔐 Páginas de Administración

### Layout: `DisenoAdministracion.tsx`

Layout envolvente de TODAS las páginas admin.

**Sidebar Desktop (224px de ancho):**
- Logo del taller (`/logo.png`)
- Navegación con 8 ítems (Link de React Router)
- Indicador naranja activo: borde vertical izquierdo `#F97316`
- Email del usuario autenticado
- Botón "Cerrar sesión" con ícono y hover rojo

**Topbar Mobile:**
- Botón hamburguesa (Menu icon) → abre sidebar en overlay
- Logo del taller centrado
- Overlay negro semitransparente al abrir sidebar

**Navegación del sidebar (en orden):**

| Ícono Lucide | Label | Ruta |
|--------------|-------|------|
| LayoutDashboard | Dashboard | `/administracion/dashboard` |
| ClipboardList | Órdenes | `/administracion/orders` |
| PlusCircle | Nueva Orden | `/administracion/orders/nueva` |
| Users | Clientes | `/administracion/clientes` |
| Car | Vehículos | `/administracion/vehiculos` |
| Palette | Inventario Pinturas | `/administracion/pinturas` |
| FileBarChart | Reportes | `/administracion/reportes` |
| Settings | Configuración | `/administracion/configuracion` |

---

### `PaginaInicioSesion.tsx`
**Ruta:** `#/administracion/login`

Formulario de login con email y contraseña. Usa `useAutenticacion` para hacer sign-in con Supabase Auth. Al autenticarse exitosamente redirige al dashboard.

---

### `PaginaPanel.tsx` — Dashboard
**Ruta:** `#/administracion/dashboard`  
**Archivo:** `src/paginas/administracion/PaginaPanel.tsx` (143 líneas)

**Funcionalidades:**
- **4 KPI cards** con animación: Total Activas / En Proceso / Listos / Recibidos
- **Panel de ingresos del mes**: suma de `precio_total` de órdenes ENTREGADO en el mes actual
- **Tablero Kanban** con todas las órdenes activas (no ENTREGADO)
- Órdenes ENTREGADO desaparecen del Kanban después de **5 minutos** (filtro `updatedAt - now <= 5 min`)
- Alerta de órdenes URGENTES: contador en rojo con ícono `AlertTriangle`

---

### `PaginaListaOrdenes.tsx`
**Ruta:** `#/administracion/orders`

- Lista completa de TODAS las órdenes con filtros por estado
- Búsqueda por cliente, placa, código de orden
- Cada orden muestra foto de portada si existe
- Acceso directo al detalle de cada orden

---

### `PaginaNuevaOrden.tsx` — Wizard multi-paso
**Ruta:** `#/administracion/orders/nueva`  
**Archivo:** `src/paginas/administracion/PaginaNuevaOrden.tsx` (1275 líneas — el más grande del proyecto)

Formulario en **3 pasos secuenciales** con barra de progreso animada:

#### Paso 1 — Cliente (`step: 'cliente'`)
- Búsqueda en tiempo real de clientes existentes (por nombre/cédula)
- Resultados desplegables con selección
- Si no existe: formulario de creación con campos: nombres, teléfono, email, cédula, dirección
- Al seleccionar cliente existente: muestra historial de sus vehículos

#### Paso 2 — Vehículo (`step: 'vehiculo'`)
- Muestra vehículos del cliente seleccionado para reutilizar
- Si no existe: formulario de creación: placa (mayúsculas auto), marca, modelo, año, color
- Muestra historial de órdenes previas del vehículo seleccionado

#### Paso 3 — Orden (`step: 'orden'`)
- Descripción del trabajo
- Prioridad: NORMAL / URGENTE
- Fecha estimada de entrega (opcional)
- Upload de fotos iniciales (categoría `ANTES`)
  - Drag & Drop o click
  - Previsualizaciones antes de subir
  - Múltiples archivos simultáneos

**Lógica de guardado (en orden):**
1. Crea/reutiliza cliente en `clientes`
2. Crea/reutiliza vehículo en `vehiculos`
3. Crea la orden en `ordenes` (estado inicial: `RECIBIDO`)
4. Sube fotos al storage y crea registros en `media`
5. Reproduce `sonidoOrdenCreada()`
6. Redirige a detalle: `#/administracion/orders/:id`

> **Protección anti-doble-envío:** `useRef(false)` bloquea re-submits mientras guarda.

---

### `PaginaDetalleOrden.tsx`
**Ruta:** `#/administracion/orders/:id`

Página central del workflow del taller. Orquesta todos los sub-componentes usando `useOrdenAdministracion(id)`:

```
┌──────────────────────────────────────────────┐
│ EncabezadoDetalleOrden                        │
│ Código, cliente, vehículo, acciones           │
├─────────────────┬────────────────────────────┤
│ TarjetaEstado   │ FormularioEdicion           │
│ 8 botones color │ Editar cliente/vehículo     │
│ Toggle compartir│                             │
├─────────────────┴────────────────────────────┤
│ TarjetaNotas                                  │
│ Notas públicas + modo bitácora con fecha auto │
├──────────────────┬───────────────────────────┤
│ PanelGastos      │ PanelPagos                │
│ Gastos/recibos   │ Abonos, precio, saldo     │
├──────────────────┴───────────────────────────┤
│ PanelSubidaFotos                              │
│ Tabs: ANTES | PROCESO | DESPUÉS               │
│ Grid fotos/videos con lightbox y delete       │
└──────────────────────────────────────────────┘
```

**Acciones del encabezado:**
- **Compartir / Dejar de Compartir** → genera/revoca token público (`share_token`)
- **Generar Factura** → abre `ModalFactura`
- **Ver Historial Vehículo** → abre `HistorialVehiculoLateral` desde la derecha
- **Eliminar Orden** → confirmación + borrado + `sonidoOrdenEliminada()`

---

### `PaginaClientes.tsx`
**Ruta:** `#/administracion/clientes`  

- Lista completa de clientes con búsqueda en tiempo real
- Edición inline de datos (nombre, teléfono, email, cédula, dirección)
- Ver vehículos asociados a cada cliente
- Ver historial de órdenes por cliente
- Crear nuevos clientes

---

### `PaginaVehiculos.tsx`
**Ruta:** `#/administracion/vehiculos`

- Lista de todos los vehículos registrados
- Búsqueda por placa, marca, modelo, color
- Ver historial completo de órdenes por vehículo
- Editar datos del vehículo

---

### `PaginaPinturas.tsx`
**Ruta:** `#/administracion/pinturas`

Inventario de **pinturas sobrantes** del taller (pintura que sobra de un trabajo y puede reutilizarse):
- Búsqueda en tiempo real por placa, color o código de color (filtro `ilike`)
- Agregar nueva entrada: placa + color + código de color
- Editar o eliminar registros
- Usa `usePinturas(busqueda)` hook

---

### `PaginaReportes.tsx`
**Ruta:** `#/administracion/reportes`  
**Archivo:** `src/paginas/administracion/PaginaReportes.tsx` (188 líneas)

Hub de reportes con **5 pestañas** animadas:

| Pestaña | Color | Descripción |
|---------|-------|-------------|
| Ganancias | Verde `#16A34A` | Ingresos mensuales por trabajos entregados |
| Historial Vehículo | Naranja `#F97316` | Historial de servicios por placa |
| En Taller | Índigo `#6366F1` | Vehículos actualmente en instalaciones |
| Rentabilidad | Amarillo `#EAB308` | Ingresos agrupados por marca |
| Garantías | Rojo `#EF4444` | Detección de posibles retrabajos |

**Print mode:** CSS `@media print` oculta sidebar, nav y botones. El `EncabezadoImpresion` aparece solo al imprimir con datos del taller.

---

### `PaginaConfiguracion.tsx`
**Ruta:** `#/administracion/configuracion`

Configuración fiscal para facturación electrónica SRI:

| Campo | Descripción |
|-------|-------------|
| RUC | Registro Único de Contribuyente |
| Razón Social | Nombre legal |
| Nombre Comercial | Nombre del taller |
| Dirección Matriz | Dirección fiscal |
| Obligado Contabilidad | Toggle boolean |
| RIMPE | Régimen RIMPE |
| Contribuyente Especial | Número si aplica |
| Agente de Retención | Número si aplica |
| Establecimiento | 3 dígitos (ej: `001`) |
| Punto de Emisión | 3 dígitos (ej: `001`) |
| Secuencial Factura | 8 dígitos (ej: `00000001`) |
| Certificado P12 | Upload del certificado digital firmante |
| Contraseña P12 | Contraseña del certificado |

---
## 🧩 Componentes Compartidos (Público)

### `CromoLiquido.tsx`
Efecto visual **WebGL** usando la librería **OGL**. Crea un fondo animado metálico/líquido que se usa como hero en la página de inicio. No depende de imágenes, todo es síntesis matemática GLSL.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `baseColor` | `[r, g, b]` | `[0.1, 0.1, 0.1]` | Color base RGB (0–1) |
| `speed` | `number` | `0.2` | Velocidad de animación |
| `amplitude` | `number` | `0.3` | Amplitud de las ondas |
| `frequencyX` | `number` | `3` | Frecuencia horizontal |
| `frequencyY` | `number` | `3` | Frecuencia vertical |
| `interactive` | `boolean` | `true` | Reacciona al movimiento del mouse |

El canvas se ajusta automáticamente al contenedor con `ResizeObserver`. Limpia correctamente el contexto WebGL y los event listeners en el cleanup del `useEffect`.

---

### `FormularioBusqueda.tsx`
Buscador de la landing. El usuario escribe placa o nombre. Llama a `useBusquedaOrden` que consulta Supabase. Si encuentra la orden, redirige a `#/track/:codigo?token=xxx`.

---

### `EncabezadoOrden.tsx`
Sección de la página de seguimiento. Muestra:
- Foto de portada (primera foto de categoría `ANTES`)
- Código de la orden
- Datos del vehículo: marca, modelo, placa, color, año
- Nombre del cliente
- Fecha de ingreso y fecha estimada (formateadas en español)
- Badge de estado con colores de `STATUS_CONFIG`
- Badge de prioridad URGENTE (si aplica)

---

### `ProgresoOrden.tsx`
Barra de progreso visual con los **8 estados** de una orden en orden:

```
RECIBIDO → LATONERIA → PREPARACION → PINTURA → SECADO → PULIDO_DETALLES → TERMINADO → ENTREGADO
  Azul        Violeta      Azul        Naranja  Naranja     Rosa           Verde        Gris
```

El estado activo tiene animación de pulso naranja (`pulseOrange`). Los estados completados están rellenos, los futuros están vacíos.

---

### `GaleriaMedia.tsx`
Galería con tabs por categoría: **ANTES | PROCESO | DESPUÉS**

- Grid responsive de fotos y videos
- Lightbox al hacer clic (fondo negro, X para cerrar, flechas de navegación)
- Soporte para videos (`<video controls>`)
- Lazy loading de imágenes
- Contador de elementos por categoría en el tab

---

### `LineaTiempo.tsx`
Timeline vertical de eventos de la orden. Cada evento tiene:
- Tipo de evento (cambio de estado, nota, subida de foto, etc.)
- Descripción detallada
- Fecha y hora en formato español Ecuador (`es-EC`)

---

### `NotasPublicas.tsx`
Muestra las `notas_publicas` de la orden. Si hay múltiples líneas (separadas por `\n`), cada una se renderiza como ítem de la bitácora. El formato de bitácora es:

```
• [15 oct] Trabajo de latonería completado
• [16 oct] Iniciando preparación de superficie
```

---

### `PanelGastosPublico.tsx`
Panel visible para el cliente con lista de gastos (repuestos, materiales). Solo se muestra si `gastos.length > 0`. Muestra descripción, monto individual y total acumulado.

---

### `EsqueletoCarga.tsx`
Skeleton loader con animación shimmer. Simula la estructura completa de la `PaginaSeguimiento` mientras carga. Usa la clase CSS `.skeleton`.

---

### `EstadoError.tsx`
Pantalla de error con: ícono de advertencia, mensaje descriptivo y botón "Reintentar" que llama a `onRetry()`.

---

### `InterruptorTema.tsx`
Toggle de modo oscuro/claro. Modifica la clase `dark` en `<html>` vía el `ProveedorTema` context.

---

### `ProveedorTema.tsx`
React Context Provider que:
1. Lee el tema desde `localStorage` (key: `tema`)
2. Aplica/quita clase `dark` al `<html>`
3. Persiste cambios en `localStorage`
4. Provee `tema` y `setTema` a todos los hijos via Context

---

## ⚙️ Componentes de Administración

### `RutaProtegida.tsx`
HOC (Higher-Order Component). Envuelve todas las rutas admin. Si no hay sesión de Supabase, redirige a `/administracion/login`.

---

### `TableroKanban.tsx`
Vista Kanban que agrupa las órdenes activas por estado. Cada columna tiene su color y muestra múltiples `TarjetaOrden`. Permite eliminar órdenes directamente.

---

### `TarjetaOrden.tsx`
Tarjeta de orden en el Kanban:
- Thumbnail de portada (si existe)
- Código de orden
- Cliente y placa del vehículo
- Badge de estado con color dinámico
- Badge URGENTE (si aplica)
- Link al detalle de la orden

---

### `PanelPagos.tsx`
**Archivo:** 497 líneas

Panel completo de gestión financiera de una orden:

**Secciones:**
1. **Precio total**: input editable, guardado en Supabase con `precio_total`
2. **Lista de abonos**: abonos con fecha, monto, método y comprobante
3. **Formulario de abono**: agregar pago parcial (Efectivo / Transferencia)
4. **Resumen**: precio total, total pagado, saldo pendiente con color rojo/verde

**Almacenamiento de abonos:**
Los abonos se serializan como JSON y se guardan en el campo `notas_internas` de la orden, separados del resto del texto por el marcador `---ABONOS---`:

```
Notas internas del técnico...
---ABONOS---
[{"id":"uuid","fecha":"2025-01-15","monto":150,"nota":"Anticipo","metodo":"Efectivo"}]
```

**Interfaz de un abono:**
```typescript
interface Abono {
  id: string;
  fecha: string;
  monto: number;
  nota: string;
  metodo?: 'Efectivo' | 'Transferencia';
  comprobante?: string;  // URL del comprobante de pago
}
```

**Sonidos:** `sonidoPagoRegistrado` / `sonidoPagoEliminado` / `sonidoPagoCompleto`

---

### `PanelGastos.tsx`
**Archivo:** 395 líneas

Panel de gastos e insumos de una orden:
- Lista de gastos con descripción y monto
- Formulario: descripción + monto + foto de factura
- Upload de foto de factura a Supabase Storage
- Lightbox para ver las facturas en grande
- Eliminar gastos con confirmación
- Datos guardados en tabla `orden_gastos`

**Sonidos:** `sonidoGastoAgregado` / `sonidoGastoEliminado`

---

### `PanelSubidaFotos.tsx`
Panel para subir y gestionar fotos/videos de la orden organizado en tres tabs: **ANTES | PROCESO | DESPUÉS**

- Drag & Drop o clic para seleccionar
- Soporte imágenes (jpg, png, webp) y videos (mp4, mov)
- Vista previa antes de subir
- Upload a Supabase Storage o Cloudinary
- Grid de media con opción de eliminar
- Lightbox para previsualizar en tamaño completo

---

### `ModalFactura.tsx`
**Archivo:** 989 líneas — el componente más complejo del proyecto

Modal para emitir **facturas electrónicas SRI Ecuador**:

**Flujo completo:**
1. Carga datos de la empresa desde `company_settings`
2. Pre-rellena datos del comprador desde el cliente de la orden
3. Admin agrega ítems de la factura (descripción, cant, precio, IVA)
4. Sistema calcula subtotales, IVA 15%, total automáticamente
5. Al confirmar: genera XML según estándar SRI
6. Firma el XML con certificado P12 (`ec-sri-invoice-signer`)
7. Envía al web service del SRI
8. Hace polling hasta recibir autorización
9. Si AUTORIZADA: genera RIDE HTML imprimible
10. Guarda en tabla `facturas` con `clave_acceso` y `numero_autorizacion`

---

### `HistorialVehiculoLateral.tsx`
Panel deslizante desde la derecha con el historial de un vehículo:
- Datos completos del vehículo
- Lista de todas las órdenes ordenadas por fecha descendente
- Por orden: código, estado (con color), fechas, precio, notas
- Botón para navegar al detalle de cualquier orden histórica

---

### `DetalleOrden/EncabezadoDetalleOrden.tsx`
Encabezado de la página de detalle admin. Muestra: código de orden, nombre del cliente, placa/marca del vehículo, estado actual con badge de color, y los botones de acción principales.

### `DetalleOrden/FormularioEdicionDetalleOrden.tsx`
Formulario inline (edición en la misma página) para modificar:
- Cliente: nombre completo, teléfono
- Vehículo: placa, marca, modelo

Llama a `useOrdenAdministracion.updateDetails()` que sanitiza los datos antes de guardar.

### `DetalleOrden/TarjetaEstadoDetalleOrden.tsx`
Grid de 8 botones, uno por estado, con el color correspondiente. Al hacer clic llama a `updateEstado()` y reproduce `sonidoEstadoCambiado()`. También contiene el toggle "Compartir" que activa/desactiva el enlace público.

### `DetalleOrden/TarjetaNotasDetalleOrden.tsx`
Editor de notas públicas con dos modos:
- **Modo libre**: `textarea` para editar todo el texto de las notas
- **Modo bitácora**: input para agregar una sola línea nueva con prefijo de fecha automático `• [DD Mes]` prepended al inicio

---

## 📊 Componentes de Reportes

Todos los reportes incluyen `EncabezadoImpresion` que solo aparece al imprimir.

### `EncabezadoImpresion.tsx`
Encabezado profesional de impresión. Invisible en pantalla (`hidden print:block`). Carga automáticamente datos de `company_settings` de Supabase y muestra:
- Logo + nombre del taller + RUC + dirección
- Título del reporte en naranja `#F97316`
- Subtítulo, información extra y fecha de generación

**Props:**
```typescript
{ titulo: string; subtitulo?: string; infoExtra?: string[] }
```

### `ReporteGanancias.tsx`
- Gráfico de barras por mes generado con **SVG puro** (sin librerías de charts)
- Tabla con desglose mensual de órdenes entregadas y sus montos
- Filtro por rango de meses
- Total acumulado del período seleccionado

### `ReporteHistorialVehiculo.tsx` (~34KB)
- Buscador de vehículo por placa
- Timeline completo de todas las órdenes del vehículo
- Detalle de cada orden: estado, fechas, precio, notas, gastos
- Total histórico invertido en el vehículo

### `ReporteVehiculosTaller.tsx`
- Lista de órdenes en estado activo (cualquier estado excepto ENTREGADO)
- Días transcurridos desde el ingreso con semáforo de tiempo
- Estado actual, prioridad y fecha estimada
- Alerta visual para vehículos que superaron su fecha estimada

### `ReporteRentabilidadMarca.tsx`
- Ranking de marcas por ingresos totales
- Número de órdenes y promedio de ingreso por marca
- Gráfico de barras horizontal comparativo (SVG puro)

### `ReporteGarantiasRetrabajos.tsx`
- Detección de vehículos con múltiples visitas en período corto
- Análisis de posibles trabajos con garantía o retrabajos
- Filtro por rango de fechas

---
## 🪝 Hooks (Ganchos)

### `useAutenticacion.ts`
Manejo de sesión con Supabase Auth.

| Campo / Método | Tipo | Descripción |
|---------------|------|-------------|
| `user` | `{id, email} \| null` | Usuario autenticado |
| `loading` | `boolean` | Verificando sesión |
| `error` | `string \| null` | Error de auth |
| `login(email, password)` | `Promise<void>` | Sign in |
| `logout()` | `Promise<void>` | Sign out |

---

### `useBusquedaOrden.ts`
Hook del buscador de la landing.

| Campo / Método | Tipo | Descripción |
|---------------|------|-------------|
| `result` | `BusquedaOrdenResponse \| null` | Resultado |
| `loading` | `boolean` | Buscando |
| `error` | `string \| null` | Error |
| `buscar(query)` | `Promise<void>` | Ejecutar búsqueda |

---

### `useSeguimientoOrden.ts`
Hook de la página de seguimiento pública.

**Parámetros:** `{ codigo: string; token: string }`

| Campo / Método | Tipo | Descripción |
|---------------|------|-------------|
| `data` | `SeguimientoOrdenResponse \| null` | Orden + gastos + media |
| `loading` | `boolean` | Cargando |
| `error` | `string \| null` | Error |
| `refetch()` | `() => void` | Recargar |

---

### `useOrdenes.ts`
**Archivo:** 171 líneas. Hook principal de la lista de órdenes admin.

**Parámetros:** `filterEstado?: OrderStatus` (opcional, filtra por estado)

**Proceso de carga (4 fases):**
1. Fetch de órdenes desde `ordenes`
2. Fetch batch de `clientes` y `vehiculos` relacionados (en paralelo)
3. Fetch de fotos de portada (categoría `ANTES`) para órdenes activas
   - Chunking de IDs en lotes de 100 (evita URLs muy largas)
   - Soporta Cloudinary (campo `url`) y Supabase Storage (`storage_path`)
4. Merge de todos los datos en objetos `AdminOrder[]`

| Campo / Método | Tipo | Descripción |
|---------------|------|-------------|
| `orders` | `AdminOrder[]` | Órdenes completas con cliente/vehículo |
| `loading / error` | estados | Carga y errores |
| `refetch()` | función | Recargar lista |
| `updateEstado(id, estado)` | `Promise<boolean>` | Cambiar estado |
| `toggleShare(id, enabled)` | `Promise<boolean>` | Toggle compartir |
| `deleteOrder(id)` | `Promise<boolean>` | Eliminar orden |

---

### `useOrdenAdministracion.ts`
**Archivo:** 333 líneas. Hook del detalle de una sola orden.

**Parámetros:** `id: string | undefined`

**Proceso de carga:**
1. Fetch de la orden por `id` (campos específicos)
2. Fetch paralelo de `clientes` y `vehiculos` por FK
3. Inicializa `precioTotal` y `montoPagado`

| Método | Descripción |
|--------|-------------|
| `updateEstado(estado)` | Cambia estado + `sonidoEstadoCambiado()` |
| `toggleShare()` | Activa/desactiva link público + `sonidoToggle()` |
| `deleteOrder()` | Elimina + `sonidoOrdenEliminada()`, retorna `boolean` |
| `updateDetails(updates)` | Edita cliente/vehículo con sanitización |
| `updateNotes(notas)` | Reemplaza notas públicas completas |
| `addNoteEntry(entry)` | Prepend de `• [DD Mes] texto` a las notas |
| `updatePaymentFields(fields)` | Actualiza estado LOCAL de pagos (sin DB) |

> Cada acción exitosa reproduce un sonido diferente. Cada error reproduce `sonidoError()`.

---

### `usePinturas.ts`
**Archivo:** 102 líneas. Hook del inventario de pinturas sobrantes.

**Parámetros:** `busqueda: string`

| Método | Descripción |
|--------|-------------|
| `pinturas` | Lista de `PinturaSobrante[]` |
| `loading / error` | Estado |
| `refetch()` | Recargar |
| `addPintura(data)` | Crear → `inventario_pinturas` |
| `updatePintura(id, data)` | Actualizar |
| `deletePintura(id)` | Eliminar |

Búsqueda con `ilike` por placa, color y código de color.

---

## 🔌 Servicios

### `buscarOrden.ts`
Servicio de búsqueda pública. Busca órdenes por placa o nombre de cliente en Supabase. Retorna `codigo` y `token` de compartir si encuentra la orden activa.

### `seguirOrden.ts`
Servicio de carga de orden pública. Valida que `share_enabled = true` y que el `share_token` coincida. Retorna la orden completa + gastos + media con URLs firmadas o directas.

---

## 📚 Biblioteca / Utilidades

### `clienteSupabase.ts`
Singleton del cliente Supabase. Toma `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del entorno. Si no están configuradas usa placeholders para evitar crash en desarrollo.

```typescript
export const supabase = createClient(url, key);
```

---

### `constantes.ts`
**Archivo:** 148 líneas. Constantes centrales del proyecto.

**`STATUS_CONFIG`** — Configuración visual de cada estado de orden:

| Estado | Color principal | Step |
|--------|----------------|------|
| RECIBIDO | `#60A5FA` (azul) | 0 |
| LATONERIA | `#A78BFA` (violeta) | 1 |
| PREPARACION | `#60A5FA` (azul) | 2 |
| PINTURA | `#FF6B1A` (naranja fuerte) | 3 |
| SECADO | `#FB923C` (naranja) | 4 |
| PULIDO_DETALLES | `#EC4899` (rosa) | 5 |
| TERMINADO | `#34D399` (verde) | 6 |
| ENTREGADO | `#9CA3AF` (gris) | 7 |

Cada estado también tiene: `bgColor`, `borderColor`, `glowColor`, `dotColor` para usar inline en componentes.

**`PROGRESS_STEPS`** — Pasos con íconos Lucide:
```
ClipboardList → Hammer → Layers → Paintbrush → Wind → Sparkles → CheckCircle2
```

**`MEDIA_CATEGORIES`:**
```
ANTES (Camera) | PROCESO (Wrench) | DESPUÉS (Sparkles)
```

**Funciones de formato:**
- `formatDate(str)` → `"15 de octubre de 2025"` (español largo)
- `formatDateTime(str)` → `"15 oct. 2025, 14:30"` (con hora)

---

### `sanitizar.ts`
Funciones de sanitización de entradas del usuario antes de guardar en DB:

| Función | Qué hace |
|---------|----------|
| `sanitizarTexto(str)` | Trim y normalización básica de texto |
| `sanitizarPlaca(str)` | Convierte a mayúsculas + trim |
| `sanitizarTelefono(str)` | Solo mantiene dígitos y `+` |

---

### `auditoria.ts`
Función `registrarAccion()` para escribir en `audit_log`. Solo registra si hay usuario autenticado. Guarda: `user_id`, `action`, `table_name`, `record_id`, `details` (JSONB).

---

### `sonidos.ts`
**Archivo:** 249 líneas. Ver sección [Sistema de Sonidos](#-sistema-de-sonidos).

---

### `utilidadesReporte.ts`
Helpers para reportes: formateo de monedas en USD, cálculo de rangos de fechas, agrupación de datos por mes/marca.

---

## 🏷 Tipos TypeScript

**Archivo:** `src/tipos/index.ts` (202 líneas)

### Estados de Orden
```typescript
type OrderStatus =
  | 'RECIBIDO' | 'LATONERIA' | 'PREPARACION' | 'PINTURA'
  | 'SECADO' | 'PULIDO_DETALLES' | 'TERMINADO' | 'ENTREGADO';
```

### Tipos básicos
```typescript
type MediaTipo = 'FOTO' | 'VIDEO';
type MediaCategoria = 'ANTES' | 'PROCESO' | 'DESPUES';
type Prioridad = 'NORMAL' | 'URGENTE';
```

### Interfaces principales

**`Vehiculo`**: `anio, color, marca, placa, modelo`

**`Order`** (vista pública): `codigo, estado, prioridad, fecha_ingreso, fecha_estimada, notas_publicas, cliente: string, vehiculo: Vehiculo`

**`AdminOrder`** (vista admin): `id, codigo, estado, prioridad, fechas, notas_publicas, notas_internas, share_enabled, share_token, precio_total, monto_pagado, updated_at, cliente_id, vehiculo_id, cliente: Cliente, vehiculo: Vehiculo`

**`Cliente`**: `id, nombres, telefono?, email?, cedula?, direccion?, tipo_identificacion?, notas?, created_at`

**`OrdenGasto`**: `id, orden_id, descripcion, monto, factura_url?, created_at`

**`MediaItem`**: `id?, tipo, categoria, signed_url, descripcion?, created_at?`

**`LineaTiempoEvent`**: `id, tipo, descripcion, created_at, metadata?: Record<string, unknown>`

### Tipos de Facturación SRI

**`CompanySettings`**: todos los datos fiscales (RUC, razón social, establecimiento, secuencial, certificado P12...)

**`Invoice`**: `id, orden_id, secuencial?, clave_acceso?, estado, ambiente, fecha_emision, subtotales, iva, importe_total, xml_generado?, autorizacion_fecha?`

**Estado de factura:**
```typescript
estado: 'CREADA' | 'FIRMADA' | 'RECIBIDA' | 'AUTORIZADA' | 'RECHAZADA'
```

**`InvoiceItem`**: `id, invoice_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, codigo_porcentaje_iva, tarifa_iva, valor_iva`

### Pinturas Sobrantes
```typescript
interface PinturaSobrante {
  id: string;
  placa: string;
  color: string;
  codigo_color: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 🗄 Base de Datos (Supabase)

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `clientes` | Clientes del taller |
| `vehiculos` | Vehículos registrados |
| `ordenes` | Órdenes de trabajo (core del sistema) |
| `media` | Fotos y videos por orden |
| `orden_gastos` | Gastos e insumos por orden |
| `company_settings` | Configuración fiscal del taller |
| `facturas` | Facturas electrónicas SRI |
| `invoice_items` | Ítems de cada factura |
| `inventario_pinturas` | Pinturas sobrantes |
| `audit_log` | Log de auditoría de acciones admin |

### Tabla `ordenes` — campos completos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Clave primaria |
| `codigo` | TEXT | Código legible único (ej: `SC-2024-001`) |
| `estado` | ENUM | Estado actual (8 posibles valores) |
| `prioridad` | ENUM | `NORMAL` / `URGENTE` |
| `fecha_ingreso` | DATE | Cuándo ingresó el vehículo |
| `fecha_estimada` | DATE | Estimado de entrega (nullable) |
| `notas_publicas` | TEXT | Visibles al cliente (nullable) |
| `notas_internas` | TEXT | Solo admin, también contiene abonos JSON |
| `share_enabled` | BOOLEAN | Si el enlace público está activo |
| `share_token` | TEXT | Token único para el enlace público |
| `precio_total` | NUMERIC | Precio del trabajo (nullable) |
| `monto_pagado` | NUMERIC | Total pagado calculado de abonos |
| `cliente_id` | UUID | FK a `clientes` |
| `vehiculo_id` | UUID | FK a `vehiculos` |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

### Tabla `media` — campos

| Campo | Descripción |
|-------|-------------|
| `orden_id` | FK a `ordenes` |
| `tipo` | `FOTO` / `VIDEO` |
| `categoria` | `ANTES` / `PROCESO` / `DESPUES` |
| `storage_bucket` | Bucket Supabase Storage (legacy) |
| `storage_path` | Ruta en el bucket (legacy) |
| `url` | URL pública de Cloudinary (nuevo) |
| `descripcion` | Texto descriptivo opcional |

> **Doble modo de storage**: Si existe `url` usa Cloudinary; si existe `storage_path` usa Supabase Storage. El código lo detecta automáticamente.

### Seguridad RLS (Row Level Security)

| Archivo | Propósito |
|---------|-----------|
| `admin_rls_policies.sql` | Acceso solo para admins autenticados |
| `fix_media_rls.sql` | Política para media pública (sin auth) |
| `fix_rls_recursion.sql` | Corrección de recursión en políticas |

### Edge Functions
En `supabase/functions/` para operaciones que requieren el service role key del servidor.

---

## 🎨 Sistema de Estilos CSS

**Archivo:** `src/index.css` (615 líneas)

Base: **TailwindCSS** + componentes personalizados en `@layer components`.

### Paleta de colores principal

| Token | Valor | Uso |
|-------|-------|-----|
| Naranja marca | `#F97316` | CTAs, acentos, íconos activos |
| Naranja hover | `#EA6C0A` | Hover de botones primarios |
| Naranja activo | `#C2550D` | Click de botones primarios |
| Fondo light | `#FFFFFF` | Background modo claro |
| Fondo dark | `#0F172A` | Background modo oscuro (Slate 900) |
| Texto light | `#0F172A` | Texto en modo claro |
| Texto dark | `#F8FAFC` | Texto en modo oscuro (Slate 50) |
| Texto muted | `rgba(11,18,32,0.6)` | Textos secundarios |

### Gradiente de fondo (modo claro)
```css
radial-gradient(at 0% 0%,   rgba(249, 115, 22, 0.05) 0px, transparent 50%),
radial-gradient(at 100% 100%, rgba(249, 115, 22, 0.08) 0px, transparent 50%)
```

### Clases de Tarjetas (Cards)

| Clase | Descripción |
|-------|-------------|
| `.card` | Glassmorphism: `blur(20px)`, `rgba(255,255,255,0.65)`, border 1px, shadow, border-radius 24px, padding 32px |
| `.dark .card` | Versión dark: `rgba(15,23,42,0.65)` |
| `.card-sm` | Versión pequeña: border-radius 16px, padding 20px |
| `.card-hover` | `.card` + hover: `translateY(-2px)` + glow naranja |
| `.glass-card` | Alias de `.card` |
| `.glass-surface` | Para modales: `opacity: 0.85`, blur fuerte |

### Clases de Botones

| Clase | Descripción |
|-------|-------------|
| `.btn-primary` | Naranja `#F97316`, peso 600, sombra. Hover: eleva -2px + escala 1.02 |
| `.btn-secondary` | Glassmorphism. Dark mode adaptado |
| `.btn-ghost` | Transparente, texto gris. Hover: fondo sutilísimo |

### Badges y Chips

| Clase | Color | Uso típico |
|-------|-------|------------|
| `.chip-orange` | Naranja 10% opacity | Tags de prioridad URGENTE |
| `.badge-success` | Verde `#16A34A` | Estado positivo |
| `.badge-warning` | Ámbar `#D97706` | Estado de alerta |
| `.badge-error` | Rojo `#EF4444` | Error |
| `.badge-orange` | Naranja `#F97316` | Marca SuColor |
| `.badge-neutral` | Gris | Estados neutros |

Todos los badges tienen `backdrop-filter: blur(8px)` y border sutil.

### Formularios

| Clase | Descripción |
|-------|-------------|
| `.input-field` | Input blanco, borde sutil. Focus: borde naranja + glow `0 0 0 4px rgba(249,115,22,0.12)` |
| `.form-label` | Uppercase, 0.75rem, tracking 0.05em, gris |
| `.segmented-control` | Contenedor de tabs: fondo gris muy claro, border-radius 10px |
| `.seg-btn` | Botón de segmento. Active: fondo blanco + shadow |

### Utilidades visuales

| Clase | Descripción |
|-------|-------------|
| `.skeleton` | Gradiente animado shimmer para placeholders de carga |
| `.status-dot` | Circulo 8x8px para indicadores de estado |
| `.text-gradient-orange` | Texto con gradiente `#F97316 → #FB923C` |
| `.font-mono-code` | JetBrains Mono, 0.8rem |
| `.divider` | Línea horizontal 1px sutil |
| `.section-title` | Título de sección: uppercase, 0.6875rem, tracking 0.08em |

### Keyframes y animaciones

| Keyframe | Descripción |
|----------|-------------|
| `shimmer` | Barrido horizontal 200% para skeletons (1.6s infinito) |
| `fadeIn` | Opacidad 0→1 |
| `fadeUp` | Opacidad 0→1 + `translateY(12px→0)` |
| `scaleIn` | Opacidad 0→1 + `scale(0.96→1)` |
| `pulseOrange` | Box-shadow naranja 0→10px→0 (bucle) |
| `progressFill` | Relleno de barra: `width: 0% → var(--progress-width)` |

**Clases utilitarias de animación:**
```css
.animate-fade-in  → fadeIn 0.2s ease-out
.animate-fade-up  → fadeUp 0.3s ease-out
.animate-scale-in → scaleIn 0.2s ease-out
```

### Fix Safari mobile
```css
@media (max-width: 1023px) {
  .admin-layout input, select, textarea {
    font-size: 16px; /* Evita zoom automático en iOS */
  }
}
```

---

## 🔊 Sistema de Sonidos

**Archivo:** `src/biblioteca/sonidos.ts` (249 líneas)

Sistema de síntesis de audio con **Web Audio API**. **Sin archivos de audio** — todo generado matemáticamente en tiempo real. Estilo iOS: sonidos minimalistas, cristalinos y elegantes.

### Arquitectura de síntesis

```
Oscillator(freq, type, detune)
    → LowPass Filter(filterFreq)
    → GainNode(volume, con envelope ADSR simple)
    → AudioContext.destination
```

Múltiples osciladores superpuestos crean tonos complejos y cálidos.

### Parámetros de un tono
```typescript
interface ToneConfig {
  freq: number;          // Frecuencia en Hz
  type?: OscillatorType; // sine | square | sawtooth | triangle
  detune?: number;       // Cents (desafinación sutil para calidez)
  start?: number;        // Offset en segundos (para arpegios)
  duration?: number;     // Duración en segundos
  volume?: number;       // Volumen relativo 0-1 (default: 0.08)
  filterFreq?: number;   // Corte low-pass (default: 4000 Hz)
}
```

### Catálogo completo de sonidos

| Función | Cuándo se usa | Descripción del sonido |
|---------|-------------|------------------------|
| `sonidoEstadoCambiado()` | Cambiar estado de orden | Dos tonos ascendentes tipo confirmación |
| `sonidoDetallesGuardados()` | Guardar edición de datos | Tono suave de confirmación |
| `sonidoToggle()` | Activar/desactivar compartir | Click suave |
| `sonidoOrdenEliminada()` | Eliminar una orden | Tono descendente (negativo) |
| `sonidoBitacoraEntrada()` | Agregar nota de bitácora | Tic ligero |
| `sonidoBitacoraGuardada()` | Guardar notas completas | Confirmación doble |
| `sonidoError()` | Cualquier error | Tono grave, bajo |
| `sonidoPagoRegistrado()` | Registrar abono | Tono de moneda/caja |
| `sonidoPagoEliminado()` | Eliminar abono | Tono negativo |
| `sonidoPagoCompleto()` | Pago al 100% | Fanfarria de éxito múltiple |
| `sonidoGastoAgregado()` | Agregar gasto | Tic neutro |
| `sonidoGastoEliminado()` | Eliminar gasto | Tono ligero |
| `sonidoOrdenCreada()` | Crear nueva orden | Melodía de bienvenida (la más elaborada) |

**Vibración haptica en móvil:** Algunas acciones activan `navigator.vibrate([pattern])` para feedback táctil en dispositivos que lo soporten.

**Singleton del AudioContext:** La variable `_ctx` se reutiliza entre llamadas para evitar el límite de contextos del navegador. Si el contexto está `suspended`, se llama a `.resume()` automáticamente.

---

## ⚙️ Configuración del Proyecto

### Variables de entorno
```env
# .env (no se sube al repo)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `tsconfig.json`
Incluye el path alias `@/` apuntando a `./src/`:
```json
{ "paths": { "@/*": ["./src/*"] } }
```

### `vercel.json`
Configuración de deploy en Vercel, reescrituras de rutas para SPA con HashRouter.

### `.eslintrc.json`
ESLint con plugins para React Hooks (`eslint-plugin-react-hooks`) y React Refresh (`eslint-plugin-react-refresh`).

### `.prettierrc`
Formateo consistente: comillas simples, sin punto y coma (o según configuración del equipo).

---

## 🔄 Flujo Completo de una Orden

```
1. RECEPCIÓN DEL VEHÍCULO
   └─ Admin abre: PaginaNuevaOrden
      ├─ Paso 1: Busca o crea Cliente
      ├─ Paso 2: Busca o crea Vehículo
      └─ Paso 3: Datos de la orden + fotos iniciales
         → Estado inicial: RECIBIDO
         → Sonido: sonidoOrdenCreada()

2. TRABAJO DE LATONERÍA
   └─ Admin abre PaginaDetalleOrden
   └─ Cambia estado → LATONERIA
      → Sonido: sonidoEstadoCambiado()
   └─ Sube fotos de proceso (categoría PROCESO)
   └─ Agrega notas a la bitácora pública

3. PREPARACIÓN
   └─ Estado → PREPARACION

4. PINTURA
   └─ Estado → PINTURA
   └─ Admin registra gastos de pinturas → PanelGastos

5. SECADO
   └─ Estado → SECADO

6. PULIDO Y DETALLES
   └─ Estado → PULIDO_DETALLES
   └─ Admin sube fotos DESPUÉS (resultado final)

7. TERMINADO — Listo para entregar
   └─ Estado → TERMINADO
   └─ Admin activa "Compartir":
      - Se genera share_token único en DB
      - Enlace: #/track/SC-XXXX?token=xxxxxxxx
      - Admin envía enlace al cliente por WhatsApp/SMS

   CLIENTE: Abre el enlace en su teléfono
   └─ Ve: Progreso, fotos, notas, gastos

8. ENTREGA
   └─ Admin registra pago completo → PanelPagos
      → Sonido: sonidoPagoCompleto()
   └─ Admin emite factura electrónica → ModalFactura
      - XML firmado con P12
      - Enviado y autorizado por el SRI
      - RIDE generado para imprimir
   └─ Estado → ENTREGADO
   └─ La orden desaparece del Dashboard en 5 minutos
```

---

## 📄 Facturación Electrónica SRI

El módulo cumple con los requisitos del **Servicio de Rentas Internas de Ecuador**.

### Ambientes
| Código | Descripción |
|--------|-------------|
| `1` | Pruebas (certificación, no tiene valor fiscal) |
| `2` | Producción (facturas reales, con valor legal) |

### Ciclo de vida de una factura

```
CREADA → FIRMADA → RECIBIDA → AUTORIZADA
                             → RECHAZADA
```

### Flujo técnico detallado

1. **Abrir `ModalFactura`** desde el botón en `PaginaDetalleOrden`
2. **Carga automática**: datos del taller (`company_settings`) + datos del cliente de la orden
3. **Formulario de ítems**: descripción, cantidad, precio unitario, descuento, tipo de IVA
4. **Cálculos automáticos**:
   - `subtotal_0`: ítems con IVA 0%
   - `subtotal_15`: ítems con IVA 15% (tasa actual Ecuador)
   - `total_descuento`: suma de descuentos
   - `valor_iva`: IVA 15% sobre `subtotal_15`
   - `importe_total`: todo sumado
5. **Generación XML**: formato estándar SRI con todos los campos requeridos
6. **Firma electrónica**: usando `ec-sri-invoice-signer` con el certificado `.p12` del taller
7. **Envío al SRI**: POST al web service del SRI (pruebas o producción)
8. **Polling de autorización**: consulta periódica hasta recibir respuesta
9. **Autorizada**: genera RIDE HTML imprimible con logo, datos, tabla de ítems y código de autorización
10. **Guardado en DB**: registro en tabla `facturas` con `clave_acceso` (49 dígitos) y `numero_autorizacion`

### Función generadora del RIDE HTML
La función `generateRideHtml()` dentro de `ModalFactura.tsx` genera el documento de representación impresa oficial en HTML puro con:
- Datos de la empresa (encabezado oficial)
- Datos del comprador
- Tabla de ítems con precios
- Sección de totales (subtotales, IVA, propina, importe total)
- Código de autorización y fecha
- Ambiente (PRUEBAS / PRODUCCIÓN)

---

*Documentación técnica de SuColor Portal v0.1.0*  
*Generada el 1 de octubre de 2026*
