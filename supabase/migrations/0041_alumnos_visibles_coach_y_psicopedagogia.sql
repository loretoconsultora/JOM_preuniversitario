-- El coach vocacional y la profesional de psicopedagogía necesitan ver el
-- roster de alumnos para vincular opcionalmente un caso a una cuenta
-- existente al crearlo (igual que ya puede el terapeuta, migración 0011).
-- Sin esto, "Vincular a alumno existente" en el formulario de "Nuevo caso"
-- siempre sale vacío porque profiles_select_own_or_staff bloquea la lectura
-- (is_staff() solo incluye docente/directora).

create policy "profiles_select_alumnos_for_coach_vocacional"
on public.profiles for select
using (role = 'alumno' and public.is_coach_vocacional());

create policy "profiles_select_alumnos_for_psicopedagogia"
on public.profiles for select
using (role = 'alumno' and public.is_psicopedagogia());
