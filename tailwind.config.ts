import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apapacho: {
          primary: "#F5B041",    // Dorado/Amarillo de la editorial
          secondary: "#1A1A1A",  // Negro para contraste
          accent: "#E67E22",     // Naranja para detalles
          light: "#FEF9E7",      // Fondo crema para lectura
          dark: "#2C3E50",       // Gris profundo
          fond: "#f5d0e1",       // Gris profundo
        },
      },
    },
  },
  plugins: [],
};
export default config;