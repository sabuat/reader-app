import { StorageService, STORAGE_KEYS } from './storage';

export type SupportedLanguage = 'es' | 'pt' | 'en';
export type FontSizePreference = 'text-base' | 'text-lg' | 'text-xl';

export interface AppPreferences {
  schemaVersion: number;
  nightMode: boolean | null; // null = deferir a preferencia del OS
  fontSize: FontSizePreference;
  language: SupportedLanguage | null; // 🌟 AHORA EL IDIOMA VIVE AQUÍ (API Unificada)
}

// 🌟 Subimos a la v2 para forzar la migración del idioma legacy
const PREFERENCES_SCHEMA_VERSION = 2;

const DEFAULT_PREFS: AppPreferences = {
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
  nightMode: null,
  fontSize: 'text-lg',
  language: null,
};

function migratePreferences(
  stored: Partial<AppPreferences> | null
): AppPreferences {
  if (!stored) return DEFAULT_PREFS;

  // Migración Legacy: Si venimos de la v1, rescatamos el idioma que estaba suelto
  let migratedLanguage = stored.language;
  if (!migratedLanguage && stored.schemaVersion === 1) {
    const legacyLang = StorageService.getRaw(STORAGE_KEYS.LANGUAGE) as SupportedLanguage;
    if (legacyLang === 'es' || legacyLang === 'pt' || legacyLang === 'en') {
      migratedLanguage = legacyLang;
    }
  }

  return {
    ...DEFAULT_PREFS,
    ...stored,
    language: migratedLanguage || null,
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
  };
}

export const PreferencesService = {
  getPrefs(): AppPreferences {
    const stored = StorageService.get<Partial<AppPreferences>>(STORAGE_KEYS.PREFERENCES);
    const migrated = migratePreferences(stored);

    StorageService.set(STORAGE_KEYS.PREFERENCES, migrated);
    return migrated;
  },

  updatePrefs(newPrefs: Partial<Omit<AppPreferences, 'schemaVersion'>>): void {
    const current = this.getPrefs();
    const updated: AppPreferences = {
      ...current,
      ...newPrefs,
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
    };

    StorageService.set(STORAGE_KEYS.PREFERENCES, updated);
  },

  // 🌟 Mantenemos los métodos de conveniencia para no romper los hooks, 
  // pero ahora apuntan directamente a la API centralizada.
  getLanguage(): SupportedLanguage | null {
    return this.getPrefs().language;
  },

  setLanguage(lang: SupportedLanguage): void {
    this.updatePrefs({ language: lang });
    // Limpieza de deuda técnica (borramos la llave legacy si aún existe)
    StorageService.remove(STORAGE_KEYS.LANGUAGE);
  },

  getLastRoute(): string | null {
    return StorageService.getRaw(STORAGE_KEYS.LAST_ROUTE);
  },

  setLastRoute(route: string): void {
    StorageService.setRaw(STORAGE_KEYS.LAST_ROUTE, route);
  },

  clearEphemeralState(): void {
    StorageService.clearEphemeralStorage();
  },

  resetAllPreferences(): void {
    StorageService.remove(STORAGE_KEYS.PREFERENCES);
    StorageService.remove(STORAGE_KEYS.LANGUAGE); // Por si quedó algún rastro
    this.clearEphemeralState();
  },
};