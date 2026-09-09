import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Permite adjuntar archivos/imágenes a las tareas (PDFs, fotos, etc.) y
      // subir documentos de hasta 15 MB en "Importar temario con IA". Se deja
      // algo de margen sobre ese límite de 15 MB por el overhead del propio
      // multipart/form-data (si este valor queda por debajo del límite que
      // valida cada acción, la petición falla en el framework antes de llegar
      // al código y el usuario ve un error genérico sin explicación).
      bodySizeLimit: "17mb",
    },
  },
};

export default nextConfig;
