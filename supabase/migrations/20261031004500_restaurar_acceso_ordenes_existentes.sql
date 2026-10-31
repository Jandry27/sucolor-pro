-- Sustituye la antigua política FOR ALL por permisos administrativos explícitos.
-- INSERT conserva además la validación de la vigencia de SuColor.
begin;

drop policy if exists "Admin todo ordenes" on public.ordenes;
drop policy if exists "Solo admin lee ordenes" on public.ordenes;
drop policy if exists "Solo admin actualiza ordenes" on public.ordenes;
drop policy if exists "Solo admin borra ordenes" on public.ordenes;

create policy "Solo admin lee ordenes"
    on public.ordenes for select to authenticated
    using ((select public.is_admin()));
create policy "Solo admin actualiza ordenes"
    on public.ordenes for update to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));
create policy "Solo admin borra ordenes"
    on public.ordenes for delete to authenticated
    using ((select public.is_admin()));

commit;
