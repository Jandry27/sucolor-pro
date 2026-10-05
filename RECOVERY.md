# SuColor — Recuperación y Backups

Este documento define cómo recuperar SuColor ante un fallo de código, despliegue o base de datos.

## Estado estable de referencia

- Dominio de producción: `https://sucolor.autos`
- Proyecto Supabase: `jqcjemhabtmfasuilbcd`
- Rama estable creada: `recovery/production-2026-10-04`
- Deployment estable de Vercel al crear este plan: `dpl_u3VZZTTY4H2rg5Dj6oJ2dWbhrvrW`

La rama de recuperación es un punto conocido de código funcional. No debe usarse para trabajo diario.

## 1. Backup de base de datos

El proyecto Supabase está actualmente en plan Free. Para este plan se deben mantener copias externas periódicas de la base de datos.

Antes de ejecutar el backup por primera vez:

```bash
supabase login
supabase link --project-ref jqcjemhabtmfasuilbcd
```

Luego ejecutar:

```bash
bash scripts/backup-supabase.sh
```

El script genera `roles.sql`, `schema.sql`, `data.sql`, `SHA256SUMS` y un archivo comprimido `.tar.gz`.

Los respaldos quedan en `.backups/`, que está excluido de Git.

### Frecuencia recomendada

- Un backup diario mientras SuColor esté en uso.
- Un backup adicional inmediatamente antes de una migración, cambio masivo o eliminación de datos.
- Conservar al menos 7 copias diarias y 4 copias semanales fuera del equipo principal.

Guardar una copia en un medio separado y cifrado. Un backup únicamente en la misma Mac no se considera una copia externa.

## 2. Qué NO cubre el backup de PostgreSQL

El dump de Supabase protege los datos de PostgreSQL: órdenes, clientes, vehículos, configuración y metadatos.

No descarga los archivos reales alojados en Cloudinary. Las fotos y videos deben conservarse también en Cloudinary o exportarse por separado.

Nunca guardar backups de producción dentro del repositorio Git porque contienen información de clientes.

## 3. Rollback de Vercel

Si un cambio de frontend rompe producción pero la base de datos está bien, la primera acción es hacer rollback del deployment, no tocar la base de datos.

En Vercel:

1. Abrir el proyecto `sucolor`.
2. Ir a Deployments.
3. Seleccionar el último deployment conocido como estable.
4. Usar Rollback.

Vercel vuelve a apuntar los aliases de producción al deployment seleccionado.

## 4. Recuperación desde Git

La rama `recovery/production-2026-10-04` contiene el punto estable creado durante esta configuración.

Para recuperar código, crear una rama nueva desde ese punto en vez de hacer un `force push` destructivo sobre `main`.

```bash
git fetch origin
git checkout -b recovery-fix origin/recovery/production-2026-10-04
```

Después se revisa, se prueba y se integra nuevamente a `main`.

## 5. Recuperación de base de datos

Una recuperación de base de datos es una operación de mayor riesgo que un rollback de Vercel.

Reglas:

- No ejecutar `supabase db reset --linked` contra producción.
- No restaurar un dump directamente encima de producción sin haber probado primero la restauración.
- Ante un error de migración pequeño, preferir una migración correctiva.
- Ante pérdida o corrupción de datos, restaurar primero el backup en una base de datos de prueba o nueva, validar la información y recién entonces planificar la recuperación de producción.

## 6. Orden de respuesta ante incidentes

1. Detener nuevos cambios y despliegues.
2. Identificar si el fallo es frontend, Edge Function o base de datos.
3. Si es frontend: rollback en Vercel.
4. Si es Edge Function: redeploy de la última versión estable desde Git.
5. Si es base de datos: no ejecutar operaciones destructivas; tomar un backup del estado actual antes de intentar reparar.
6. Probar cualquier restauración en un entorno separado.
7. Validar login admin, búsqueda por placa, seguimiento, órdenes, clientes, multimedia y facturación antes de volver a producción.

## 7. Antes de cambios de alto riesgo

Antes de una migración destructiva, borrado masivo o cambio de facturación:

```bash
bash scripts/backup-supabase.sh
```

Comprobar que el archivo `.tar.gz` exista y tenga tamaño mayor que cero.

Después del cambio verificar:

- Inicio de sesión administrativo.
- Consulta pública por placa.
- Acceso al seguimiento.
- Creación y edición de órdenes.
- Clientes y vehículos.
- Fotos y videos.
- Facturación SRI.
- Edge Functions.
- `https://sucolor.autos`.

## Política de recuperación

- Código: GitHub + rama de recuperación + historial de commits.
- Frontend: deployments inmutables de Vercel y rollback.
- Base de datos: dumps externos frecuentes porque el proyecto está en Supabase Free.
- Archivos multimedia: respaldo independiente de Cloudinary.
