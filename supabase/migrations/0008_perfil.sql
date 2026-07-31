-- Perfil de usuario: nombre editable y foto de avatar, para que el navbar
-- muestre el nombre real de la persona (y su foto) en vez de datos genéricos.

alter table public.profiles add column avatar_url text;

-- Cada quien puede actualizar su propia fila (nombre, avatar). El rol NO se
-- puede autoasignar: el trigger de abajo lo revierte salvo que quien hace el
-- cambio sea docente (así se sigue controlando el rol solo desde Alumnos).
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_docente() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

-- ============================================================
-- Storage: bucket público para fotos de perfil. Cada usuario solo puede
-- subir/editar/borrar dentro de su propia carpeta (su user id).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "avatares_select_public"
on storage.objects for select
using (bucket_id = 'avatares');

create policy "avatares_insert_own"
on storage.objects for insert
with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatares_update_own"
on storage.objects for update
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatares_delete_own"
on storage.objects for delete
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
