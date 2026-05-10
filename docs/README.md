# Mapa del proyecto

## Carpetas principales

- `src/`: codigo fuente de la aplicacion.
- `config/`: configuraciones tecnicas de build, test, estilos y TypeScript.
- `docs/`: documentacion de arquitectura y planificacion.
- `scripts/`: scripts auxiliares para tareas manuales.
- `public/`: archivos estaticos.
- `supabase/`: funciones edge, migraciones y scripts SQL.

## Configuracion tecnica

- `config/vite.config.ts`: configuracion de Vite.
- `config/vitest.config.ts`: configuracion de pruebas con Vitest.
- `config/tailwind.config.ts`: tokens y utilidades Tailwind.
- `config/styles/postcss.config.js`: pipeline de PostCSS.
- `config/typescript/`: configuracion base de TypeScript.
- Raiz del repo: solo entrypoints minimos (`postcss.config.js`, `tsconfig.json`, `tsconfig.node.json`) para compatibilidad con herramientas.

## Dentro de src

- `src/paginas/`: pantallas de la app (publicas y administracion).
- `src/componentes/`: componentes de UI y bloques reutilizables.
- `src/ganchos/`: hooks de logica de negocio.
- `src/servicios/`: integraciones API/HTTP.
- `src/biblioteca/`: utilidades compartidas y cliente de base de datos.
- `src/tipos/`: tipos e interfaces TypeScript.
- `src/pruebas/`: tests unitarios/integracion.

## Convenciones

- Componentes: `PascalCase` en espanol (`PaginaDetalleOrden.tsx`).
- Hooks: prefijo `use` + nombre en espanol (`useOrdenes.ts`).
- Utilidades: `camelCase` en espanol.
- Carpetas: nombres descriptivos en espanol.
