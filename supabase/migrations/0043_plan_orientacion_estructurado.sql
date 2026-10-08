-- Plan de orientación: "carreras de interés" y "universidades de interés"
-- pasaban de párrafo libre a listas de etiquetas; "próximos pasos" pasa de
-- párrafo libre a una lista de pasos con fecha y estado de completado
-- (para poder ordenarlos y marcarlos con un check). Si ya había texto
-- cargado, se conserva como una única etiqueta/paso en vez de perderse.

alter table public.orientacion_plan
  alter column carreras_interes drop default,
  alter column carreras_interes type text[]
    using case
      when carreras_interes is null or trim(carreras_interes) = '' then '{}'::text[]
      else array[carreras_interes]
    end,
  alter column carreras_interes set default '{}';

alter table public.orientacion_plan
  alter column universidades_interes drop default,
  alter column universidades_interes type text[]
    using case
      when universidades_interes is null or trim(universidades_interes) = '' then '{}'::text[]
      else array[universidades_interes]
    end,
  alter column universidades_interes set default '{}';

alter table public.orientacion_plan
  alter column proximos_pasos drop default,
  alter column proximos_pasos type jsonb
    using case
      when proximos_pasos is null or trim(proximos_pasos) = '' then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid()::text, 'texto', proximos_pasos, 'fecha', null, 'completado', false)
      )
    end,
  alter column proximos_pasos set default '[]';
