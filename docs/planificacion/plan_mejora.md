# 📋 PLAN DE ACCIÓN - RECOMENDACIONES DE MEJORA

**Generado**: 9 de mayo de 2026  
**Prioridad General**: Seguridad → Testing → Calidad de Código

---

## FASE 1: SEGURIDAD (1-2 semanas) 🔴 CRÍTICO

### 1.1 Fortalecer Row Level Security (RLS)

**Problema Actual**:
```sql
CREATE POLICY "Admin lee ordenes" ON ordenes FOR SELECT TO authenticated USING (true);
-- ❌ Cualquier usuario autenticado puede ver TODO
```

**Solución Propuesta**:

```sql
-- 1. Crear tabla de roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer', 'client')),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 2. Crear función is_admin segura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Crear políticas seguras
DROP POLICY IF EXISTS "Admin lee ordenes" ON ordenes;
DROP POLICY IF EXISTS "Admin actualiza ordenes" ON ordenes;
DROP POLICY IF EXISTS "Admin crea ordenes" ON ordenes;

CREATE POLICY "Admin lee ordenes" ON ordenes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin actualiza ordenes" ON ordenes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin crea ordenes" ON ordenes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 4. Aplicar similar a otras tablas (clientes, vehiculos, media)
-- ...

-- 5. Insertar admin inicial
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@sucolor.com'
ON CONFLICT DO NOTHING;
```

**Tiempo Estimado**: 2-3 horas  
**Impacto**: 🚨 CRÍTICO - Evita acceso no autorizado

---

### 1.2 Validación Server-Side en Edge Functions

**Problema**: Las Edge Functions no validan datos exhaustivamente

**Ejemplo - track-order/index.ts**:

```typescript
// ❌ ACTUAL (confianza en cliente)
const codigo = url.searchParams.get("codigo")?.trim();
const token = url.searchParams.get("token")?.trim();

if (!codigo || !token) {
  return new Response(JSON.stringify({ ok: false, error: "Faltan parámetros" }), 
    { status: 400 });
}

// ✅ MEJORADO
import { z } from "zod";

const ParamsSchema = z.object({
  codigo: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  token: z.string().min(32).max(255),
});

try {
  const params = ParamsSchema.parse({ codigo, token });
} catch (err) {
  return new Response(
    JSON.stringify({ ok: false, error: "Parámetros inválidos" }),
    { status: 400 }
  );
}
```

**Archivos a Mejorar**:
- [ ] `supabase/functions/search-order/index.ts`
- [ ] `supabase/functions/track-order/index.ts`
- [ ] `supabase/functions/sri-invoice/index.ts`

**Tiempo Estimado**: 4-6 horas  
**Impacto**: Evita inyecciones y datos corruptos

---

### 1.3 Rate Limiting en Edge Functions

**Implementar** (usando headers o tabla de logs):

```typescript
// Edge Function wrapper
async function withRateLimit(req: Request, handler: Function) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const key = `rate_limit:${ip}`;
  
  // Usar Deno KV o caché Redis
  // Máximo 100 requests/hora por IP
  
  const count = await getFromCache(key);
  if (count > 100) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429 }
    );
  }
  
  await incrementCache(key);
  return handler(req);
}
```

**Tiempo Estimado**: 2-3 horas  
**Impacto**: Evita DDoS y abuso

---

## FASE 2: TESTING & LINTING (2-3 semanas) 🟡 IMPORTANTE

### 2.1 Configurar ESLint + Prettier

```bash
# 1. Instalar dependencias
npm install --save-dev \
  eslint \
  prettier \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser

# 2. Crear .eslintrc.json
cat > .eslintrc.json << 'EOF'
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": { "jsx": true },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks",
    "@typescript-eslint"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
EOF

# 3. Crear .prettierrc
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
EOF

# 4. Agregar scripts en package.json
"scripts": {
  "lint": "eslint src --ext .ts,.tsx",
  "lint:fix": "eslint src --ext .ts,.tsx --fix",
  "format": "prettier --write 'src/**/*.{ts,tsx,css}'"
}

# 5. Ejecutar
npm run lint:fix
npm run format
```

**Tiempo Estimado**: 3-4 horas  
**Impacto**: Consistencia de código

---

### 2.2 Configurar Vitest + Testing Library

```bash
# 1. Instalar
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom

# 2. Crear vitest.config.ts
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/pruebas/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
EOF

# 3. Crear src/pruebas/setup.ts
mkdir -p src/test
cat > src/pruebas/setup.ts << 'EOF'
import '@testing-library/jest-dom';
EOF

# 4. Agregar script
"test": "vitest"
"test:ui": "vitest --ui"
"coverage": "vitest --coverage"
```

**Tiempo Estimado**: 2-3 horas  
**Impacto**: Cobertura de testing

---

### 2.3 Tests Unitarios Prioritarios

**Prioridad Alta (Escribir primero)**:

1. **useSeguimientoOrden.ts**
   ```typescript
   describe('useSeguimientoOrden', () => {
     it('should fetch and set data on success', async () => { ... });
     it('should handle error state', async () => { ... });
     it('should return refetch function', () => { ... });
   });
   ```

2. **useAutenticacion.ts**
   ```typescript
   describe('useAutenticacion', () => {
     it('should check session on mount', () => { ... });
     it('should login with valid credentials', async () => { ... });
     it('should handle login error', async () => { ... });
   });
   ```

3. **FormularioBusqueda.tsx**
   ```typescript
   describe('FormularioBusqueda', () => {
     it('should render input field', () => { ... });
     it('should validate input (max 10 chars)', () => { ... });
     it('should uppercase input', () => { ... });
   });
   ```

4. **ProgresoOrden.tsx**
   ```typescript
   describe('ProgresoOrden', () => {
     it('should render correct percentage for each status', () => { ... });
     it('should animate progress bar', () => { ... });
   });
   ```

**Objetivo**: 50%+ cobertura  
**Tiempo Estimado**: 1-2 semanas

---

## FASE 3: REFACTORING (1-2 semanas) 🟡

### 3.1 Dividir PaginaDetalleOrden.tsx

**Problema**: 600+ líneas en un archivo

**Solución**: Crear sub-componentes

```typescript
// src/paginas/administracion/PaginaDetalleOrden.tsx - reducido a 100 líneas
import EncabezadoDetalleOrden from '@/componentes/administracion/OrderDetail/Header';
import OrderDetailEdit from '@/componentes/administracion/OrderDetail/EditForm';
import OrderDetailMedia from '@/componentes/administracion/OrderDetail/Media';
import OrderDetailGastos from '@/componentes/administracion/OrderDetail/Gastos';

export function PaginaDetalleOrden() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // ... cargar orden

  return (
    <DisenoAdministracion>
      <EncabezadoDetalleOrden order={order} onSave={handleSave} />
      <OrderDetailEdit order={order} onChange={setOrder} />
      <OrderDetailMedia orderId={order?.id} />
      <OrderDetailGastos orderId={order?.id} />
    </DisenoAdministracion>
  );
}
```

**Nuevos Archivos**:
- `components/administracion/OrderDetail/Header.tsx`
- `components/administracion/OrderDetail/EditForm.tsx`
- `components/administracion/OrderDetail/Media.tsx`
- `components/administracion/OrderDetail/Gastos.tsx`

**Tiempo Estimado**: 6-8 horas  
**Impacto**: Mantenibilidad ✅

---

### 3.2 Crear Custom Hook para Manejo de Órdenes Admin

```typescript
// src/ganchos/useOrdenAdministracion.ts
export function useOrdenAdministracion(id: string) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => { ... }, [id]);
  
  const updateOrder = useCallback(async (updates: Partial<AdminOrder>) => {
    setSaving(true);
    try {
      await supabase.from('ordenes').update(updates).eq('id', id);
      setOrder(prev => prev ? { ...prev, ...updates } : prev);
    } catch (err) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [id]);

  const updateEstado = useCallback((estado: OrderStatus) => 
    updateOrder({ estado }), [updateOrder]);
  
  const toggleShare = useCallback(() => 
    updateOrder({ share_enabled: !order?.share_enabled }), [order?.share_enabled, updateOrder]);

  useEffect(() => {
    loadOrder();
  }, [id, loadOrder]);

  return { order, loading, saving, error, updateOrder, updateEstado, toggleShare };
}
```

**Tiempo Estimado**: 3-4 horas  
**Impacto**: Código más limpio y reutilizable

---

## FASE 4: OPTIMIZACIONES (1 semana) 🟢

### 4.1 Implementar Caché en useSeguimientoOrden

```typescript
// src/ganchos/useSeguimientoOrden.ts - con caché
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useSeguimientoOrden({ codigo, token }: UseSeguimientoOrdenOptions) {
  const cacheKeyRef = useRef(`track:${codigo}:${token}`);
  
  const fetchData = useCallback(async () => {
    // Revisar caché
    const cached = sessionStorage.getItem(cacheKeyRef.current);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        setState({ data, loading: false, error: null });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchSeguimientoOrden(codigo, token);
      sessionStorage.setItem(cacheKeyRef.current, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
      setState({ data, loading: false, error: null });
    } catch (err) { ... }
  }, [codigo, token]);

  // ...
}
```

**Tiempo Estimado**: 2-3 horas  
**Impacto**: Mejor performance

---

### 4.2 Optimizar GaleriaMedia (Lazy Loading)

```typescript
// Antes: carga todas las imágenes
<img src={item.signed_url} alt={item.categoria} />

// Después: lazy load
<img 
  src={item.signed_url} 
  alt={item.categoria} 
  loading="lazy"
  decoding="async"
/>
```

**Tiempo Estimado**: 1-2 horas

---

### 4.3 Agregar Sentry para Error Tracking

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});

export default Sentry.withProfiler(App);
```

**Tiempo Estimado**: 2-3 horas

---

## FASE 5: DOCUMENTACIÓN (3-4 días) 📚

### 5.1 Documentación de API

```markdown
# SuColor API Documentation

## Edge Functions

### GET /functions/v1/track-order

**Descripción**: Obtener orden completa para portal público

**Parámetros**:
- `codigo` (string, obligatorio): Código de orden ej "SC-0001"
- `token` (string, obligatorio): Token compartido

**Response Success**:
\`\`\`json
{
  "ok": true,
  "order": { ... },
  "gastos": [ ... ],
  "media": [ ... ]
}
\`\`\`

**Response Errors**:
- 400: Faltan parámetros
- 404: Orden no encontrada
- 403: Compartición deshabilitada
- 401: Token inválido
\`\`\`
```

### 5.2 Documentación de Componentes (Storybook)

```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
npx sb init --type react
```

```typescript
// src/componentes/ProgresoOrden.stories.tsx
import { ProgresoOrden } from './ProgresoOrden';
import type { OrderStatus } from '@/tipos';

export default {
  component: ProgresoOrden,
  title: 'Components/ProgresoOrden',
};

export const Recibido = () => <ProgresoOrden estado="RECIBIDO" />;
export const Pintura = () => <ProgresoOrden estado="PINTURA" />;
export const Terminado = () => <ProgresoOrden estado="TERMINADO" />;
```

**Tiempo Estimado**: 1-2 semanas

---

## CRONOGRAMA SUGERIDO

```timeline
Semana 1-2    | FASE 1: Seguridad (RLS, validación, rate limiting)
Semana 3      | FASE 2: ESLint + Prettier + setup Vitest
Semana 4-5    | FASE 2: Escribir tests prioritarios (50% cobertura)
Semana 6-7    | FASE 3: Refactoring + hooks custom
Semana 8      | FASE 4: Optimizaciones + Sentry
Semana 9      | FASE 5: Documentación final
```

**Total Estimado**: 8-9 semanas (1-2 meses)

---

## CHECKLIST DE VALIDACIÓN

### Pre-Producción

- [ ] RLS policies renovadas y testeadas
- [ ] Edge Functions validan inputs
- [ ] Rate limiting implementado
- [ ] ESLint + Prettier en CI
- [ ] Tests en 50%+ del código
- [ ] No hay `any` types en nuevos código
- [ ] Sentry configurado
- [ ] Caché implementado en hooks
- [ ] Dark mode funciona
- [ ] Accesibilidad: WCAG AA mínimo
- [ ] Lighthouse score >80
- [ ] Security audit realizado
- [ ] Documentación actualizada

### Post-Deploy

- [ ] Monitor Sentry 24h
- [ ] Verificar RLS en producción
- [ ] Load testing (100 concurrent users)
- [ ] Mobile testing (iOS + Android)
- [ ] Backup y disaster recovery tested

---

## REFERENCIAS ÚTILES

**Seguridad Supabase**:
- https://clienteSupabase.com/docs/guides/auth/row-level-security
- https://clienteSupabase.com/docs/guides/auth/managing-user-data

**Testing**:
- https://vitest.dev/
- https://testing-library.com/docs/react-testing-library/intro/

**Code Quality**:
- https://eslint.org/docs/rules/
- https://prettier.io/docs/en/index.html

**Performance**:
- https://web.dev/vitals/
- https://developers.google.com/web/tools/lighthouse

---

## CONTACTO & SOPORTE

Para preguntas sobre este plan:
- Revisar docs/arquitectura/analisis_proyecto.md para contexto
- Ejecutar tests: `npm test`
- Revisar logs: `npm run lint`
