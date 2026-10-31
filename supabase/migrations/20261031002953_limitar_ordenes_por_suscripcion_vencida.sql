-- El taller conserva acceso de lectura y puede terminar órdenes abiertas.
-- Solo se impide INSERT de órdenes cuando el último estado válido ya venció.
begin;

create table public.estado_suscripcion_sucolor (
    unico boolean primary key default true check (unico),
    fecha_inicio date not null,
    fecha_fin date not null check (fecha_fin >= fecha_inicio),
    consultado_en timestamptz not null,
    actualizado_en timestamptz not null default now()
);
alter table public.estado_suscripcion_sucolor enable row level security;
revoke all on public.estado_suscripcion_sucolor from public, anon, authenticated;
grant select, insert, update, delete on public.estado_suscripcion_sucolor to service_role;

create or replace function public.suscripcion_permite_nueva_orden()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce((
        select estado.fecha_inicio <= (now() at time zone 'America/Guayaquil')::date
           and estado.fecha_fin >= (now() at time zone 'America/Guayaquil')::date
        from public.estado_suscripcion_sucolor estado
        where estado.unico
    ), true);
$$;
revoke all on function public.suscripcion_permite_nueva_orden() from public, anon;
grant execute on function public.suscripcion_permite_nueva_orden() to authenticated;

-- Reemplaza cualquier regla previa de inserción; las reglas permisivas de RLS
-- se combinan con OR, por eso no basta con añadir una política restrictiva.
drop policy if exists "Admin crea ordenes" on public.ordenes;
drop policy if exists "Solo admin crea ordenes" on public.ordenes;
-- El snapshot histórico también pudo instalar una política FOR ALL; RLS
-- combina políticas permisivas, así que debe retirarse para que no eluda INSERT.
drop policy if exists "Admin todo ordenes" on public.ordenes;
create policy "Solo admin crea ordenes"
    on public.ordenes for insert to authenticated
    with check (
        (select public.is_admin())
        and (select public.suscripcion_permite_nueva_orden())
    );

commit;
