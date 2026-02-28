import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <-- ESTO ES LO QUE CREA LA CARPETA 'out'
  images: {
    unoptimized: true, // Requisito para exportar apps móviles
  },
};

export default nextConfig;