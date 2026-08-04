import "server-only";
import mammoth from "mammoth";
import ExcelJS from "exceljs";

export type ArchivoExtraido = { tipo: "pdf"; base64: string } | { tipo: "texto"; texto: string };

const LIMITE_TEXTO = 100_000;

export async function extraerContenidoArchivo(file: File): Promise<ArchivoExtraido> {
  const nombre = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || nombre.endsWith(".pdf")) {
    return { tipo: "pdf", base64: buffer.toString("base64") };
  }

  if (nombre.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return { tipo: "texto", texto: value.slice(0, LIMITE_TEXTO) };
  }

  if (nombre.endsWith(".xlsx")) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const partes: string[] = [];
    workbook.eachSheet((hoja) => {
      const filas: string[] = [];
      hoja.eachRow((row) => {
        const valores = (row.values as (string | number | null)[]).slice(1);
        filas.push(valores.map((v) => (v ?? "").toString()).join(", "));
      });
      partes.push(`Hoja "${hoja.name}":\n${filas.join("\n")}`);
    });
    return { tipo: "texto", texto: partes.join("\n\n").slice(0, LIMITE_TEXTO) };
  }

  // .csv y cualquier otro caso: tratar como texto plano.
  return { tipo: "texto", texto: buffer.toString("utf-8").slice(0, LIMITE_TEXTO) };
}
