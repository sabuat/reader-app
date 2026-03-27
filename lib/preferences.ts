import { StorageService, STORAGE_KEYS } from './storage';

export type SupportedLanguage = 'es' | 'pt' | 'en';
export type FontSizePreference = 'text-base' | 'text-lg' | 'text-xl';

export interface AppPreferences {
  schemaVersion: number;
  nightMode: boolean | null; // null = deferir a preferencia del OS
  fontSize: FontSizePreference;
}

const PREFERENCES_SCHEMA_VERSION = 1;

const DEFAULT_PREFS: AppPreferences = {
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
  nightMode: null,
  fontSize: 'text-lg',
};

function migratePreferences(
  stored: Partial<AppPreferences> | null
): AppPreferences {
  if (!stored) return DEFAULT_PREFS;

  return {
    ...DEFAULT_PREFS,
    ...stored,
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

  getLanguage(): SupportedLanguage | null {
    const lang = StorageService.getRaw(STORAGE_KEYS.LANGUAGE);
    if (lang === 'es' || lang === 'pt' || lang === 'en') return lang;
    return null;
  },

  setLanguage(lang: SupportedLanguage): void {
    StorageService.setRaw(STORAGE_KEYS.LANGUAGE, lang);
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
    StorageService.remove(STORAGE_KEYS.LANGUAGE);
    this.clearEphemeralState();
  },
};