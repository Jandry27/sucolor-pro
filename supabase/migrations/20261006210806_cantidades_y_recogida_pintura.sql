-- No inferir cantidades, pagos ni recogidas de los pedidos anteriores.
alter table public.solicitudes_pintura
    add column fraccion_galon text check (fraccion_galon in ('1/32','1/16','1/8','1/4','1/2','1')),
    add column unidades integer not null default 1 check (unidades between 1 and 100),
    add column fecha_recogida_prevista date,
    add column hora_recogida_prevista text check (hora_recogida_prevista ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    add column estado_pedido text check (estado_pedido in ('en_preparacion','recogida')),
    add column pagado boolean,
    add constraint pintura_hora_con_fecha check (hora_recogida_prevista is null or fecha_recogida_prevista is not null),
    add constraint pintura_pago_con_valor check (pagado is distinct from true or valor is not null),
    add constraint pintura_fecha_recogida check (fecha_recogida_prevista is null or fecha_recogida_prevista >= fecha_solicitud);
create index solicitudes_pintura_recogida on public.solicitudes_pintura (estado_pedido, fecha_recogida_prevista);

create or replace view public.resumen_proveedores_pintura with (security_invoker = true) as
select p.id, p.nombre, count(s.id)::integer as solicitudes,
       coalesce(sum(s.muestras_pendientes), 0)::integer as muestras_pendientes,
       count(s.id) filter (where s.muestras_pendientes > 0)::integer as solicitudes_pendientes,
       count(s.id) filter (where s.valor is null)::integer as valores_pendientes,
       coalesce(sum(s.valor), 0) as valor_conocido,
       count(s.id) filter (where s.estado_pedido = 'en_preparacion')::integer as pedidos_por_recoger
from public.proveedores_pintura p left join public.solicitudes_pintura s on s.proveedor_id = p.id
group by p.id, p.nombre;
