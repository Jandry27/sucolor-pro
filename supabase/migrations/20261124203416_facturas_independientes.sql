alter table public.invoices
    add column solicitud_id uuid,
    add column comprador jsonb,
    add column vehiculo jsonb;

create unique index invoices_solicitud_uidx on public.invoices (solicitud_id);
create unique index invoices_numero_uidx on public.invoices (ambiente, secuencial);

-- Solo la función autenticada de facturación reserva números, antes de enviar al SRI.
create function public.reservar_factura_sri(
    p_solicitud uuid,
    p_orden uuid,
    p_comprador jsonb,
    p_vehiculo jsonb,
    p_totales jsonb,
    p_guardar_vehiculo boolean default false
)
returns public.invoices
language plpgsql security invoker
set search_path = ''
as $$
declare
    configuracion public.company_settings;
    factura public.invoices;
    siguiente bigint;
    numero text;
begin
    if p_solicitud is null then raise exception 'Falta identificar la solicitud.'; end if;
    select * into configuracion from public.company_settings limit 1 for update;
    if not found then raise exception 'Completa la configuración de empresa.'; end if;

    select * into factura from public.invoices where solicitud_id=p_solicitud;
    if found then return factura; end if;

    if p_orden is not null and exists (
        select 1 from public.invoices where orden_id=p_orden
        and estado in ('CREADA','FIRMADA','RECIBIDA','AUTORIZADA')
    ) then
        raise exception 'Esta orden ya tiene una factura en proceso o autorizada. Revisa el historial.';
    end if;

    siguiente := greatest(1, coalesce(nullif(configuracion.secuencial_factura,''),'1')::bigint);
    loop
        if siguiente > 999999999 then raise exception 'Se agotó el secuencial de facturación.'; end if;
        numero := lpad(configuracion.establecimiento,3,'0') || '-' ||
            lpad(configuracion.punto_emision,3,'0') || '-' || lpad(siguiente::text,9,'0');
        exit when not exists(select 1 from public.invoices where ambiente=2 and secuencial=numero);
        siguiente := siguiente+1;
    end loop;

    if p_guardar_vehiculo and p_vehiculo is not null then
        insert into public.vehiculos(placa,marca,modelo,anio,color)
        values (
            public.normalizar_placa(p_vehiculo->>'placa'),p_vehiculo->>'marca',
            nullif(p_vehiculo->>'modelo',''),nullif(p_vehiculo->>'anio','')::integer,
            nullif(p_vehiculo->>'color','')
        )
        on conflict (public.normalizar_placa(placa)) do nothing;
    end if;

    if p_orden is null and not exists (
        select 1 from public.clientes where cedula=p_comprador->>'identificacion'
    ) then
        insert into public.clientes(cedula,tipo_identificacion,nombres,direccion,email,telefono)
        values (p_comprador->>'identificacion',p_comprador->>'tipo_identificacion',
            p_comprador->>'razon_social',p_comprador->>'direccion',
            p_comprador->>'email',nullif(p_comprador->>'telefono',''));
    end if;

    insert into public.invoices(
        solicitud_id,orden_id,comprador,vehiculo,secuencial,estado,ambiente,
        subtotal_0,subtotal_15,valor_iva,importe_total
    ) values (
        p_solicitud,p_orden,p_comprador,p_vehiculo,numero,'CREADA',2,
        (p_totales->>'subtotal0')::numeric,(p_totales->>'subtotal15')::numeric,
        (p_totales->>'iva')::numeric,(p_totales->>'total')::numeric
    ) returning * into factura;

    update public.company_settings set secuencial_factura=(siguiente+1)::text,
        updated_at=now() where id=configuracion.id;
    return factura;
end;
$$;
revoke all on function public.reservar_factura_sri(uuid,uuid,jsonb,jsonb,jsonb,boolean)
    from public,anon,authenticated;
grant execute on function public.reservar_factura_sri(uuid,uuid,jsonb,jsonb,jsonb,boolean)
    to service_role;
