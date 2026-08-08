// Muestra texto plano (ej. la respuesta de un alumno) convirtiendo
// cualquier URL suelta en un link clicable — útil para tareas donde se
// les pide pegar el link de su proyecto en la respuesta de texto en vez
// de agregar un campo nuevo a la base de datos.
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function TextoConLinks({ texto }: { texto: string }) {
  const partes = texto.split(URL_REGEX);
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={parte}
            target="_blank"
            rel="noopener noreferrer"
            className="text-jom-pink underline underline-offset-2 hover:opacity-80"
          >
            {parte}
          </a>
        ) : (
          parte
        )
      )}
    </>
  );
}
