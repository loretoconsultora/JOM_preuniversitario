-- Las preguntas interactivas no tenían dónde poner instrucciones
-- generales del test (ej. "no hay respuestas correctas, elige lo que más
-- te identifique"). "resultado" no sirve para esto en modo interactivo:
-- ese campo se queda null hasta que Paula evalúa las respuestas del
-- alumno, y llenarlo antes marcaría el test como "evaluado" de entrada.

alter table public.orientacion_tests
  add column instrucciones text;
