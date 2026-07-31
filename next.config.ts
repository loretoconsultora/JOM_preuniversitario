import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Permite adjuntar archivos/imágenes a las tareas (PDFs, fotos, etc.).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
