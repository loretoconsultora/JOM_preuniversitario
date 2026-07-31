-- Portada "Mis materias" en Temario: banner personalizable por materia.

alter table public.materias add column banner_url text;

create policy "materias_update_docente"
on public.materias for update
using (public.is_docente())
with check (public.is_docente());

-- ============================================================
-- Storage: bucket público para los banners de cada materia.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('materia-banners', 'materia-banners', true)
on conflict (id) do nothing;

create policy "materia_banners_select_public"
on storage.objects for select
using (bucket_id = 'materia-banners');

create policy "materia_banners_insert_docente"
on storage.objects for insert
with check (bucket_id = 'materia-banners' and public.is_docente());

create policy "materia_banners_update_docente"
on storage.objects for update
using (bucket_id = 'materia-banners' and public.is_docente());

create policy "materia_banners_delete_docente"
on storage.objects for delete
using (bucket_id = 'materia-banners' and public.is_docente());
