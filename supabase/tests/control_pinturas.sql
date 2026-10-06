begin;
select set_config('request.jwt.claim.sub', (select user_id::text from public.user_roles where role='admin' limit 1), true);
set local role authenticated;
do $$
declare proveedor uuid; solicitud uuid; saldo integer; filas integer;
begin
    if not public.is_admin() then raise exception 'Se requiere administrador para la prueba'; end if;
    insert into public.proveedores_pintura(nombre) values ('Verificacion ' || gen_random_uuid()) returning id into proveedor;
    insert into public.solicitudes_pintura(proveedor_id,placa,color,fecha_solicitud,muestras_dejadas)
    values(proveedor,'TEST-001','Color de prueba',current_date,3) returning id into solicitud;
    select muestras_pendientes into saldo from public.resumen_proveedores_pintura where id=proveedor;
    if saldo <> 3 then raise exception 'Saldo inicial incorrecto'; end if;
    update public.solicitudes_pintura set muestras_retiradas=1 where id=solicitud and version=1;
    select muestras_pendientes into saldo from public.resumen_proveedores_pintura where id=proveedor;
    if saldo <> 2 then raise exception 'Retiro parcial incorrecto'; end if;
    update public.solicitudes_pintura set muestras_retiradas=3 where id=solicitud and version=1;
    get diagnostics filas = row_count;
    if filas <> 0 then raise exception 'Se permitió edición obsoleta'; end if;
    begin
        update public.solicitudes_pintura set muestras_retiradas=4 where id=solicitud;
        raise exception 'Se permitió retirar más muestras';
    exception when check_violation then null; end;
    begin
        update public.solicitudes_pintura set valor=-1 where id=solicitud;
        raise exception 'Se permitió valor negativo';
    exception when check_violation then null; end;
    update public.solicitudes_pintura set muestras_retiradas=3, valor=22.50 where id=solicitud and version=2;
    if not exists (select 1 from public.resumen_proveedores_pintura where id=proveedor and muestras_pendientes=0 and valores_pendientes=0 and valor_conocido=22.50) then raise exception 'Resumen final incorrecto'; end if;
    begin
        delete from public.solicitudes_pintura where id=solicitud;
        raise exception 'Se permitió borrar historial';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
set local role authenticated;
do $$
begin
    if exists (select 1 from public.proveedores_pintura) or exists (select 1 from public.solicitudes_pintura) or exists (select 1 from public.resumen_proveedores_pintura) then raise exception 'Usuario sin rol puede leer'; end if;
    begin
        insert into public.proveedores_pintura(nombre) values ('No permitido');
        raise exception 'Usuario sin rol puede escribir';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$
begin
    begin
        perform 1 from public.resumen_proveedores_pintura;
        raise exception 'Acceso anónimo permitido';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'OK: saldos, retiro parcial y total, valor pendiente, concurrencia, restricciones, RLS y acceso anonimo' as resultado;
rollback;
