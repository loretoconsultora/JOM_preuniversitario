const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function esNuevoPaciente(fechaAlta: string, ahora: Date) {
  const alta = new Date(`${fechaAlta}T00:00:00`);
  return alta.getFullYear() === ahora.getFullYear() && alta.getMonth() === ahora.getMonth();
}

export function pacienteDesdeLabel(fechaAlta: string, ahora: Date) {
  if (esNuevoPaciente(fechaAlta, ahora)) return "Nuevo paciente";
  const alta = new Date(`${fechaAlta}T00:00:00`);
  return `Paciente desde ${MESES[alta.getMonth()]} ${alta.getFullYear()}`;
}
