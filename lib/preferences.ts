// Nombre único de la "caja" donde guardaremos todo (versionado para evitar conflictos con cachés viejas)
const PREFS_KEY = 'apapacho_v2_prefs';

// Definimos estrictamente qué datos existen en nuestras preferencias
export interface AppPreferences {
  fontSize: string;
  nightMode: boolean | null;
  language: string | null; // Cambiado a null para permitir detección del OS
  lastRoute: string;
}

// Los valores por defecto si el usuario es nuevo
const defaultPrefs: AppPreferences = {
  fontSize: 'text-lg',
  nightMode: null, // null permite detectar luego si debemos usar el tema del sistema
  language: null,  // null permite que useLanguage aplique el idioma del OS
  lastRoute: '/home',
};

// Función para LEER las preferencias de forma segura
export const getPrefs = (): AppPreferences => {
  if (typeof window === 'undefined') return defaultPrefs;
  
  try {
    const stored = window.localStorage.getItem(PREFS_KEY);
    if (!stored) return defaultPrefs;
    
    const parsed = JSON.parse(stored);
    
    // Mezclamos los defaults con lo guardado asegurando que si falta una clave no se rompa la app
    return { ...defaultPrefs, ...parsed };
  } catch (error) {
    console.warn('[Prefs] Preferencias corruptas. Restaurando valores por defecto de forma segura.');
    // Si el JSON está irremediablemente roto, limpiamos solo esta clave, no todo el storage
    window.localStorage.removeItem(PREFS_KEY);
    return defaultPrefs;
  }
};

// Función para ACTUALIZAR una o varias preferencias
export const updatePrefs = (newPrefs: Partial<AppPreferences>) => {
  if (typeof window === 'undefined') return;
  
  const current = getPrefs();
  const updated = { ...current, ...newPrefs };
  
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
};

// Función para BORRAR exclusivamente las preferencias de esta app (Ideal para cuando se hace Sign Out)
export const clearPrefs = () => {
  if (typeof window !== 'undefined') {
    // Eliminamos estrictamente nuestro namespace, sin usar .clear() global
    window.localStorage.removeItem(PREFS_KEY);
  }
};