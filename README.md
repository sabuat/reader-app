# 📚 Apapacho Reader App

Aplicación híbrida de lectura digital diseñada para ofrecer una experiencia editorial premium, fluida y accesible. Construida con tecnologías web modernas y empaquetada para dispositivos móviles.

## 🚀 Tech Stack Actualizado

- **Framework:** Next.js (App Router) / React
- **Estilos & UI:** Tailwind CSS, Framer Motion, Lucide Icons
- **Tipografía:** Literata (Optimizada para lectura prolongada)
- **Backend & Auth:** Supabase (Auth, Database, Storage)
- **Móvil (Híbrido):** Capacitor 8 (Android/iOS) + AdMob
- **Lenguaje:** TypeScript Estricto

## 🏗 Arquitectura del Proyecto

El proyecto sigue una separación clara de responsabilidades (Domain-Driven Design ligero):

- `/app` -> Vistas de UI y enrutamiento (Pages, Layouts).
- `/components` -> Componentes de interfaz reutilizables (Cards, Modals, Sheets).
- `/services` -> Lógica de negocio y data fetching (Ej: `AuthService`, `BookService`). **Ningún componente de UI consulta a la DB directamente.**
- `/lib` -> Utilidades core:
  - `types.ts`: Contratos de datos estrictos (`Book`, `Chapter`, `Profile`).
  - `supabase.ts`: Cliente de BD.
  - `preferences.ts`: Gestor centralizado de caché y preferencias de usuario.
- `/hooks` -> Lógica de estado global (Ej: `useLanguage` con detección automática de OS).

## 💾 Política de Caché y Sesión (Storage)

Para evitar condiciones de carrera y comportamientos "fantasma", la aplicación utiliza dos espacios de almacenamiento local estrictamente separados:

1. **Sesión (Supabase):** Gestionado por el cliente de Supabase (prefijo `sb-`). Al hacer *Sign Out*, solo se eliminan estas claves.
2. **Preferencias de UI:** Gestionado en `apapacho_v2_prefs`. Guarda de forma persistente:
   - `language` (es, en, pt)
   - `nightMode` (boolean | null para fallback al OS)
   - `fontSize`
   - `lastRoute` (para rehidratación de navegación)

## ⚙️ Instalación y Desarrollo Local

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
(Nota: Ya no es necesario usar --legacy-peer-deps en el entorno actual).

Configura tus variables de entorno en un archivo .env.local:

Fragmento de código

NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
Inicia el servidor de desarrollo web:

Bash

npm run dev
📱 Build para Producción y Android (Capacitor)
La aplicación utiliza output: 'export' en la configuración de Next.js para generar archivos estáticos compatibles con Capacitor.

Bash

# 1. Compilar el proyecto Next.js
npm run build

# 2. Sincronizar los archivos estáticos con los proyectos nativos
npx cap sync

# 3. Abrir Android Studio para compilar el .AAB / .APK final
npx cap open android
🌍 Internacionalización (i18n)
La aplicación soporta Español, Inglés y Portugués de forma nativa.

Detección Automática: Si el usuario no tiene una preferencia guardada, la app lee el idioma del Sistema Operativo (window.navigator.language) y aplica las reglas de negocio base.

Diccionarios: Toda la traducción visual vive en lib/i18n/dictionaries.ts.