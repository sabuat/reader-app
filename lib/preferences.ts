// Nombre único de la "caja" donde guardaremos todo
const PREFS_KEY = 'apapacho_v2_prefs';

// Definimos estrictamente qué datos existen en nuestras preferencias
export interface AppPreferences {
  fontSize: string;
  nightMode: boolean | null;
  language: string;
  lastRoute: string;
}

// Los valores por defecto si el usuario es nuevo
const defaultPrefs: AppPreferences = {
  fontSize: 'text-lg',
  nightMode: null, // null permite detectar luego si debemos usar el tema del sistema
  language: 'es',
  lastRoute: '/home',
};

// Función para LEER las preferencias
export const getPrefs = (): AppPreferences => {
  if (typeof window === 'undefined') return defaultPrefs;
  
  try {
    const stored = window.localStorage.getItem(PREFS_KEY);
    if (!stored) return defaultPrefs;
    
    // Mezclamos los defaults con lo guardado por si agregamos nuevas opciones en el futuro
    return { ...defaultPrefs, ...JSON.parse(stored) };
  } catch (error) {
    console.warn('[Prefs] Preferencias corruptas. Restaurando valores por defecto.');
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

// Función para BORRAR todo (Ideal para cuando se hace Sign Out)
export const clearPrefs = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(PREFS_KEY);
  }
};