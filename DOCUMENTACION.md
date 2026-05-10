# 📋 SuColor — Documentación Completa del Sistema

> Guía completa del Portal Cliente SuColor: arquitectura, archivos, flujo de datos y cómo conectar todo.

---

## 🎯 ¿Qué es este sistema?

El **Portal Cliente de SuColor** es una aplicación web que permite a los clientes del taller automotriz rastrear su orden de reparación en tiempo real, ingresando a una URL personalizada con código y token.

**URL de seguimiento:**
```
http://localhost:5173/track/SC-0001?token=b3db9aa9cadba691626fdf74b7235ec548de0f8268aa9ad2
```

---

## 🏗️ Arquitectura General

```
CLIENTE (Browser)
    │
    ▼
React + Vite (Frontend)          ← Este proyecto
    │
    │  GET ?codigo=SC-0001&token=...
    ▼
Supabase Edge Function           ← Ya implementada en el backend
/functions/v1/track-order
    │
    ├── Valida codigo + token
    ├── Consulta tablas: ordenes, clientes, vehiculos, timeline, media
    ├── Genera signed_urls del bucket privado "autos"
    └── Devuelve JSON al frontend
```

---

## 🗂️ Estructura de Archivos Completa

```
SuColor/
│
├── .env                          ← 🔑 TU CONFIGURACIÓN (no subir a Git)
├── .env.example                  ← Plantilla para otros devs
├── package.json                  ← Dependencias del proyecto
├── vite.config.ts                ← Configuración de Vite (alias @/ → src/)
├── tailwind.config.ts            ← Tema visual: colores, animaciones
├── tsconfig.json                 ← TypeScript
├── postcss.config.js             ← Requerido por Tailwind
├── index.html                    ← HTML base con fuentes Inter + Sora
├── README.md                     ← Instrucciones rápidas
│
├── public/
│   └── favicon.svg               ← Ícono naranja del taller
│
└── src/
    ├── main.tsx                  ← Punto de entrada de la app
    ├── App.tsx                   ← Rutas: /track/:codigo y 404
    ├── index.css                 ← Estilos globales y tema dark
    │
    ├── types/
    │   └── index.ts              ← Tipos TypeScript de toda la API
    │
    ├── lib/
    │   └── constants.ts          ← Configuración de estados, colores, fechas
    │
    ├── api/
    │   └── trackOrder.ts         ← Llama a la Edge Function de Supabase
    │
    ├── hooks/
    │   └── useTrackOrder.ts      ← Hook: maneja loading / error / data
    │
    ├── pages/
    │   └── TrackPage.tsx         ← Página principal /track/:codigo
    │
    └── components/
        ├── LoadingSkeleton.tsx   ← Skeleton animado mientras carga
        ├── ErrorState.tsx        ← Pantalla de error amigable
        ├── OrderHeader.tsx       ← Cabecera: código, badge de estado, vehículo
        ├── OrderProgress.tsx     ← Barra de progreso con 5 pasos
        ├── MediaGallery.tsx      ← Galería con tabs ANTES/PROCESO/DESPUÉS
        ├── Timeline.tsx          ← Historial de actividad
        └── PublicNotes.tsx       ← Notas del taller
```

---

## 🔌 Cómo se conectan los archivos

### 1. El usuario entra a la URL
```
/track/SC-0001?token=b3db9aa9...
```
→ React Router lo dirige a **`TrackPage.tsx`**

### 2. TrackPage extrae los parámetros
```typescript
// src/pages/TrackPage.tsx
const { codigo } = useParams();           // "SC-0001"
const token = searchParams.get('token');   // "b3db9aa9..."
```

### 3. El hook `useTrackOrder` llama a la API
```typescript
// src/hooks/useTrackOrder.ts
const { data, loading, error, refetch } = useTrackOrder({ codigo, token });
```

### 4. La función `fetchTrackOrder` hace el fetch real
```typescript
// src/api/trackOrder.ts
GET https://jqcjemhabtmfasuilbcd.supabase.co/functions/v1/track-order
    ?codigo=SC-0001
    &token=b3db9aa9cadba691626fdf74b7235ec548de0f8268aa9ad2
```

### 5. Supabase devuelve este JSON
```json
{
  "ok": true,
  "order": {
    "codigo": "SC-0001",
    "estado": "RECIBIDO",
    "prioridad": "NORMAL",
    "fecha_ingreso": "2026-03-03",
    "fecha_estimada": null,
    "notas_publicas": "Tu auto ya está en proceso ✅",
    "cliente": "Cliente Demo",
    "vehiculo": {
      "anio": 2015,
      "color": "Rojo",
      "marca": "Toyota",
      "placa": "ABC-1234",
      "modelo": "Corolla"
    }
  },
  "timeline": [],
  "media": [
    {
      "tipo": "FOTO",
      "categoria": "ANTES",
      "signed_url": "https://jqcjemhabtmfasuilbcd.supabase.co/storage/v1/..."
    }
  ]
}
```

### 6. TrackPage renderiza los componentes
```
data.order      → OrderHeader + OrderProgress
data.media      → MediaGallery (usa signed_url para cargar las fotos)
data.timeline   → Timeline
data.order.notas_publicas → PublicNotes
```

---

## 🎨 Sistema de Diseño

### Colores principales (definidos en `tailwind.config.ts`)
| Token Tailwind | Valor | Uso |
|---|---|---|
| `brand-orange` | `#FF6B1A` | Botones, badges, acentos |
| `brand-orange-light` | `#FF8C42` | Hover de botones |
| `brand-black` | `#0A0A0A` | Fondo principal |
| `brand-dark-2` | `#161616` | Cards |
| `brand-white` | `#F5F5F5` | Texto principal |
| `brand-gray-lighter` | `#9A9A9A` | Texto secundario |

### Clases utilitarias (definidas en `src/index.css`)
| Clase | Descripción |
|---|---|
| `.glass-card` | Card con fondo glassmorphism y blur |
| `.glass-card-hover` | Glass card con efecto hover naranja |
| `.btn-primary` | Botón naranja con glow |
| `.text-gradient-orange` | Texto con gradiente naranja |
| `.skeleton` | Bloque skeleton con shimmer animado |
| `.divider` | Línea divisoria sutil |

### Colores de estados (`src/lib/constants.ts`)
| Estado | Color | Paso |
|---|---|---|
| `RECIBIDO` | Azul (#60A5FA) | 0 |
| `DIAGNOSTICO` | Violeta (#A78BFA) | 1 |
| `EN_PROCESO` | Naranja (#FF6B1A) | 2 |
| `CONTROL_CALIDAD` | Amarillo (#FBBF24) | 3 |
| `LISTO` | Verde (#34D399) | 4 |
| `ENTREGADO` | Gris (#9CA3AF) | 4 |

---

## 📦 Dependencias instaladas

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `react` | 18.x | Framework UI |
| `react-dom` | 18.x | Renderizado en browser |
| `react-router-dom` | 6.x | Rutas `/track/:codigo` |
| `axios` | 1.x | Llamadas HTTP a la Edge Function |
| `framer-motion` | 11.x | Animaciones: skeleton, badges, lightbox |
| `lucide-react` | 0.378 | Íconos (Calendar, ZoomIn, RefreshCw...) |
| `tailwindcss` | 3.x | Estilos utilitarios |
| `typescript` | 5.x | Tipado estático |
| `vite` | 5.x | Servidor de desarrollo + build |

---

## ⚙️ Variables de Entorno

El archivo `.env` (ya creado en la raíz) contiene:

```bash
VITE_SUPABASE_URL=https://jqcjemhabtmfasuilbcd.supabase.co
```

> ⚠️ **Importante:** En Vite, solo las variables que empiezan con `VITE_` son accesibles en el frontend. Nunca pongas aquí `service_role` ni claves privadas.

---

## 🚀 Comandos para correr el proyecto

### Primera vez (instalar dependencias)
```bash
# Si node está en el PATH:
npm install

# Si node no está en el PATH (Windows, PowerShell):
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm install
```

### Correr en desarrollo
```bash
npm run dev
# → http://localhost:5173
```

### Construir para producción
```bash
npm run build
# Los archivos quedan en /dist/
```

---

## 🌐 Flujo de Producción (para cuando despliegues)

Cuando quieras poner el portal en internet (ej: Vercel, Netlify):

1. **Build:** `npm run build` genera la carpeta `/dist/`
2. **Variable de entorno:** Configura `VITE_SUPABASE_URL` en tu plataforma
3. **Redirecciones:** Configura redirect de todas las rutas a `index.html`
   ```
   /* → /index.html   (para que React Router funcione)
   ```
4. **URL personalizada:** Los clientes acceden con:
   ```
   https://tudominio.com/track/SC-0001?token=...
   ```

---

## 🔐 Seguridad — Lo que NUNCA debes poner en el Frontend

| ❌ NO poner en .env del frontend | ✅ Sí está bien |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `VITE_SUPABASE_URL` |
| Contraseñas de base de datos | URLs públicas |
| Claves de admin | Tokens anon (si los usaras) |

El frontend **solo** llama a la Edge Function pública, que a su vez valida el token internamente antes de devolver datos.

---

## 🔧 Cómo agregar nuevos estados de orden

Edita `src/lib/constants.ts` y agrega el nuevo estado al objeto `STATUS_CONFIG`:

```typescript
NUEVO_ESTADO: {
  label: 'Mi Nuevo Estado',
  color: '#MiColor',
  bgColor: 'rgba(R, G, B, 0.12)',
  borderColor: 'rgba(R, G, B, 0.3)',
  glowColor: 'rgba(R, G, B, 0.2)',
  dotColor: '#MiColor',
  step: 2, // 0–4, indica dónde está en la barra de progreso
},
```

Y si es un nuevo paso visible en el progress bar, agrégalo también a `PROGRESS_STEPS`.

---

## 📸 Cómo funcionan las fotos (signed_urls)

Las fotos en Supabase están en el **bucket privado "autos"** — nadie puede acceder directamente. El flujo es:

1. El frontend llama a la Edge Function
2. La Edge Function (con `service_role` que solo ella tiene) genera `signed_url` temporales
3. El frontend recibe esas URLs ya firmadas y las usa en `<img src={signed_url} />`
4. Las URLs expiran (configurable en Supabase, típicamente 1 hora)

Por eso el componente `MediaGallery` usa `loading="lazy"` — si la URL expira y el usuario recarga, el hook `refetch` genera nuevas URLs.

---

## 🐛 Errores Comunes y Soluciones

| Error | Causa | Solución |
|---|---|---|
| `Token inválido` | Token incorrecto o expirado | Verificar el token en la tabla `ordenes` |
| `Orden no encontrada` | Código incorrecto | Verificar que el `codigo` existe en la BD |
| Foto no carga | `signed_url` expirada | Usar botón "Actualizar" en el portal |
| Puerto 5173 ocupado | Otro proceso usando el puerto | `npm run dev -- --port 3000` |
| `VITE_SUPABASE_URL undefined` | Falta el archivo `.env` | Crear `.env` con la URL |

---

## 🗺️ Roadmap — Próximas funcionalidades

El sistema está preparado para escalar:

- [ ] **Admin Dashboard** — panel para el taller (crear órdenes, subir fotos, cambiar estados)
- [ ] **Notificaciones WhatsApp/Email** — cuando cambia el estado
- [ ] **PWA** — instalar como app en el celular del cliente
- [ ] **Múltiples idiomas** — internacionalización (i18n)
- [ ] **Dark/Light mode toggle** — switch de tema

---

## 📞 Referencia Rápida

| Qué | Dónde |
|---|---|
| URL del portal | `http://localhost:5173/track/{codigo}?token={token}` |
| Supabase Project | `https://jqcjemhabtmfasuilbcd.supabase.co` |
| Edge Function | `https://jqcjemhabtmfasuilbcd.supabase.co/functions/v1/track-order` |
| Tablas en uso | `clientes`, `vehiculos`, `ordenes`, `media`, `timeline` |
| Bucket de fotos | `autos` (privado, acceso solo vía signed_url) |
| Archivo de config | `.env` en la raíz del proyecto |
| Agregar colores/estados | `src/lib/constants.ts` |
| Agregar componentes | `src/components/` |
