-- Permite que un perfil tenga más de un rol (ej. alguien que es docente Y
-- terapeuta a la vez), sin reemplazar el modelo actual de un "role"
-- primario. roles[] son los roles EXTRA además de role. Todas las policies
-- existentes ya pasan por estas funciones SECURITY DEFINER en vez de
-- comparar role directamente, así que basta con actualizar su definición
-- para que el modelo nuevo aplique en todas partes sin tocar cada policy.

alter table public.profiles add column roles text[] not null default '{}';

create or replace function public.is_docente()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'docente' or 'docente' = any(roles))
  );
$$;

create or replace function public.is_terapeuta()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'terapeuta' or 'terapeuta' = any(roles))
  );
$$;

create or replace function public.is_directora()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'directora' or 'directora' = any(roles))
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role in ('docente', 'directora') or roles && array['docente', 'directora'])
  );
$$;

-- El self-update de profiles (profiles_update_own) permite a cualquiera
-- editar su propia fila; el trigger de abajo ya evitaba que se
-- autoasignara "role". Se extiende para que tampoco pueda autoasignarse
-- "roles" (si no, cualquiera podría auto-otorgarse permisos de docente).
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
  if not public.is_docente() and new.roles is distinct from old.roles then
    new.roles := old.roles;
  end if;
  return new;
end;
$$;

-- Ezequiel Lugano: además de docente (ya asignado a sus 2 materias), pasa
-- a tener también acceso de terapeuta.
alter table public.profiles disable trigger profiles_prevent_self_role_change;
update public.profiles set roles = array['terapeuta']
where id = (select id from auth.users where email = 'ezeluganopsicologia@gmail.com');
alter table public.profiles enable trigger profiles_prevent_self_role_change;
