-- La placa identifica la ficha en el ámbito administrativo de este proyecto.
create function public.normalizar_placa(p_placa text)
returns text
language sql immutable strict parallel safe
set search_path = ''
as $$
    select upper(regexp_replace(p_placa, '[[:space:]-]', '', 'g'));
$$;

create unique index vehiculos_placa_normalizada_uidx
    on public.vehiculos (public.normalizar_placa(placa));

create function public.buscar_vehiculo_por_placa(p_placa text)
returns setof public.vehiculos
language sql stable security invoker
set search_path = ''
as $$
    select v.*
    from public.vehiculos v
    where public.normalizar_placa(v.placa) = public.normalizar_placa(p_placa);
$$;

create function public.crear_orden_con_vehiculo(
    p_vehiculo jsonb,
    p_orden jsonb,
    p_vehiculo_editado uuid default null,
    p_ediciones jsonb default '{}'::jsonb
)
returns table (id uuid, codigo text)
language plpgsql security invoker
set search_path = ''
as $$
declare
    v_vehiculo public.vehiculos := jsonb_populate_record(null::public.vehiculos, p_vehiculo);
    v_orden public.ordenes := jsonb_populate_record(null::public.ordenes, p_orden);
    v_placa text := public.normalizar_placa(v_vehiculo.placa);
    v_id uuid;
begin
    if not coalesce(public.is_admin(), false) then
        raise exception 'Acceso denegado.' using errcode = '42501';
    end if;

    if v_placa is null or v_placa !~ '^[A-Z0-9]{2,10}$'
       or nullif(btrim(v_vehiculo.marca), '') is null then
        raise exception 'Ingresa una placa y una marca válidas.' using errcode = '22023';
    end if;

    select v.id into v_id from public.buscar_vehiculo_por_placa(v_placa) v;

    if p_vehiculo_editado is not null and v_id is distinct from p_vehiculo_editado then
        raise exception 'La ficha del vehículo cambió. Vuelve a buscar la placa.' using errcode = '22023';
    end if;

    if v_id is null then
        insert into public.vehiculos as v (placa, marca, modelo, anio, color, cliente_id)
        values (v_placa, v_vehiculo.marca, v_vehiculo.modelo, v_vehiculo.anio,
                v_vehiculo.color, v_orden.cliente_id)
        on conflict (public.normalizar_placa(placa)) do nothing
        returning v.id into v_id;

        -- Otra recepción puede haber registrado primero la misma placa.
        if v_id is null then
            select v.id into strict v_id from public.buscar_vehiculo_por_placa(v_placa) v;
        end if;
    elsif v_id = p_vehiculo_editado and p_ediciones <> '{}'::jsonb then
        update public.vehiculos v set
            marca = case when p_ediciones ? 'marca' then v_vehiculo.marca else v.marca end,
            modelo = case when p_ediciones ? 'modelo' then v_vehiculo.modelo else v.modelo end,
            anio = case when p_ediciones ? 'anio' then v_vehiculo.anio else v.anio end,
            color = case when p_ediciones ? 'color' then v_vehiculo.color else v.color end
        where v.id = v_id;
    end if;

    insert into public.ordenes as o (
        cliente_id, vehiculo_id, prioridad, fecha_estimada, notas_publicas,
        notas_internas, precio_total, monto_entrada, monto_pagado
    )
    values (
        v_orden.cliente_id, v_id, v_orden.prioridad, v_orden.fecha_estimada,
        v_orden.notas_publicas, v_orden.notas_internas, v_orden.precio_total,
        v_orden.monto_entrada, v_orden.monto_pagado
    )
    returning o.id, o.codigo into id, codigo;
    return next;
end;
$$;

revoke execute on function public.buscar_vehiculo_por_placa(text) from public, anon;
grant execute on function public.buscar_vehiculo_por_placa(text) to authenticated;

revoke execute on function public.crear_orden_con_vehiculo(jsonb, jsonb, uuid, jsonb) from public, anon;
grant execute on function public.crear_orden_con_vehiculo(jsonb, jsonb, uuid, jsonb) to authenticated;
