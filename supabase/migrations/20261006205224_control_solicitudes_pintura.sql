-- Las solicitudes son independientes del inventario de sobrantes ya existente.
create table public.proveedores_pintura (
    id uuid primary key default gen_random_uuid(),
    nombre text not null check (length(btrim(nombre)) between 1 and 80)
);
create unique index proveedores_pintura_nombre on public.proveedores_pintura (lower(btrim(nombre)));

create table public.solicitudes_pintura (
    id uuid primary key default gen_random_uuid(),
    proveedor_id uuid not null references public.proveedores_pintura(id) on delete restrict,
    placa text not null check (length(btrim(placa)) between 3 and 20),
    color text not null check (length(btrim(color)) between 1 and 300),
    codigo_color text not null default '' check (length(codigo_color) <= 80),
    fecha_solicitud date not null,
    valor numeric(12,2) check (valor >= 0),
    muestras_dejadas integer not null default 0 check (muestras_dejadas between 0 and 1000),
    muestras_retiradas integer not null default 0,
    muestras_pendientes integer generated always as (muestras_dejadas - muestras_retiradas) stored,
    observaciones text not null default '' check (length(observaciones) <= 2000),
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (muestras_retiradas between 0 and muestras_dejadas)
);
create index solicitudes_pintura_fecha on public.solicitudes_pintura (fecha_solicitud desc, id);
create index solicitudes_pintura_proveedor on public.solicitudes_pintura (proveedor_id, fecha_solicitud desc);
create index solicitudes_pintura_pendientes on public.solicitudes_pintura (proveedor_id) where muestras_pendientes > 0;

create function public.versionar_solicitud_pintura() returns trigger
language plpgsql set search_path = '' as $$
begin
    new.version := old.version + 1;
    new.updated_at := now();
    return new;
end;
$$;
revoke all on function public.versionar_solicitud_pintura() from public;
create trigger version_solicitud_pintura before update on public.solicitudes_pintura
for each row execute function public.versionar_solicitud_pintura();

alter table public.proveedores_pintura enable row level security;
alter table public.solicitudes_pintura enable row level security;
revoke all on public.proveedores_pintura, public.solicitudes_pintura from anon, authenticated;
grant select, insert, update on public.proveedores_pintura, public.solicitudes_pintura to authenticated;
create policy proveedores_pintura_admin on public.proveedores_pintura to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy solicitudes_pintura_admin on public.solicitudes_pintura to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- El resumen abarca todo el historial, independientemente de la página o filtros.
create view public.resumen_proveedores_pintura with (security_invoker = true) as
select p.id, p.nombre, count(s.id)::integer as solicitudes,
       coalesce(sum(s.muestras_pendientes), 0)::integer as muestras_pendientes,
       count(s.id) filter (where s.muestras_pendientes > 0)::integer as solicitudes_pendientes,
       count(s.id) filter (where s.valor is null)::integer as valores_pendientes,
       coalesce(sum(s.valor), 0) as valor_conocido
from public.proveedores_pintura p left join public.solicitudes_pintura s on s.proveedor_id = p.id
group by p.id, p.nombre;
revoke all on public.resumen_proveedores_pintura from anon, authenticated;
grant select on public.resumen_proveedores_pintura to authenticated;

insert into public.proveedores_pintura (nombre) values ('Pepe'), ('German');
