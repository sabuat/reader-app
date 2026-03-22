# 📚 Apapacho Reader App (v2.0)

Aplicación móvil oficial de **Editorial Apapacho**. Diseñada para ofrecer una experiencia de lectura inmersiva, minimalista y premium. 

Este proyecto está construido con arquitectura web moderna empaquetada de forma nativa para Android.

## 🛠 Stack Tecnológico
- **Framework Web:** Next.js 14 (React)
- **Estilos y UI:** Tailwind CSS + Framer Motion
- **Base de Datos & Auth:** Supabase
- **Contenedor Móvil:** Capacitor (v8)
- **Monetización:** Google AdMob

---

## ⚙️ Requisitos Previos
Para correr o compilar este proyecto en tu entorno local, necesitas tener instalado:
- **Node.js** (v18 o superior)
- **Android Studio** (Para generar las firmas y probar emuladores)
- **Java JDK 21**

---

## 🚀 Instalación y Configuración Local

**1. Instalar dependencias**
Debido a conflictos de versiones entre dependencias de Capacitor y plugins de Google Auth, es obligatorio usar la bandera de dependencias heredadas:
```bash
npm install --legacy-peer-deps