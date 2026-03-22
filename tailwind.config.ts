import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'h1': ['1.875rem', { lineHeight: '2.25rem' }],
        'h2': ['1.5rem', { lineHeight: '2rem' }], 
        'h3': ['1.25rem', { lineHeight: '1.75rem' }], 
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'body': ['0.875rem', { lineHeight: '1.25rem' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem' }],
        //Botones y etiquetas
        'label': ['0.625rem', { lineHeight: '1rem' }],
        'button': ['0.6875rem', { lineHeight: '1rem' }],
        'button-lg': ['0.75rem', { lineHeight: '1rem' }],
      },
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