// Next.js oculta en producción el mensaje de cualquier error que se *lance*
// (throw) desde una Server Action: al cliente solo le llega un mensaje
// genérico ("An error occurred in the Server Components render...") con un
// "digest", sin importar cuál haya sido el error real (validación,
// permisos, Supabase, un proveedor externo, etc.). Ver detalle en
// node_modules/next/dist/server/app-render/action-handler.js.
//
// Por eso las Server Actions de esta app no lanzan errores "esperables"
// (de validación o de negocio): los devuelven como dato con este tipo, y
// cada componente cliente revisa `result.ok` antes de seguir. Cualquier
// excepción inesperada debe atraparse también (try/catch) y convertirse en
// un ActionResult de error, para que nunca se escape un throw sin querer.
export type ActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

export function actionError(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export function actionOk<T extends object>(data: T): { ok: true } & T {
  return { ok: true, ...data };
}

// Mensaje de reserva para cuando cae un throw inesperado (bug real, falla de
// red, etc.) y no queremos mostrar el texto crudo de la excepción.
export const ERROR_INESPERADO = "Ocurrió un error inesperado. Intenta de nuevo.";
