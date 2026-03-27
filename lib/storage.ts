const STORAGE_VERSION = 2;
const PREFIX = `apapacho_v${STORAGE_VERSION}_`;

export const STORAGE_KEYS = {
  SCHEMA_VERSION: 'apapacho_storage_version',
  PREFERENCES: `${PREFIX}prefs`,
  LANGUAGE: `${PREFIX}lang`,
  LAST_ROUTE: `${PREFIX}last_route`,
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS] | string;

export const StorageService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  },

  // ==========================================
  // MÉTODOS TIPADOS (Solo JSON)
  // ==========================================
  get<T>(key: StorageKey, defaultValue: T | null = null): T | null {
    if (!this.isSupported()) return defaultValue;
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    
    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[Storage] Invalid JSON for key "${key}". Returning default.`);
      return defaultValue;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    if (!this.isSupported()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Error setting key "${key}".`, error);
    }
  },

  // ==========================================
  // MÉTODOS RAW (Strings planos)
  // ==========================================
  getRaw(key: StorageKey, defaultValue: string | null = null): string | null {
    if (!this.isSupported()) return defaultValue;
    const item = window.localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  },

  setRaw(key: StorageKey, value: string): void {
    if (!this.isSupported()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error(`[Storage] Error setting raw key "${key}".`, error);
    }
  },

  // ==========================================
  // UTILIDADES
  // ==========================================
  has(key: StorageKey): boolean {
    if (!this.isSupported()) return false;
    return window.localStorage.getItem(key) !== null;
  },

  remove(key: StorageKey): void {
    if (!this.isSupported()) return;
    window.localStorage.removeItem(key);
  },

  clearNamespace(namespacePrefix: string): void {
    if (!this.isSupported()) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(namespacePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => this.remove(key));
  },

  clearAppStorage(): void {
    // Limpia todo lo relacionado a la app (útil para hard resets)
    this.clearNamespace('apapacho_');
  },

  clearEphemeralStorage(): void {
    // Limpia solo estados volátiles de navegación/UI
    this.remove(STORAGE_KEYS.LAST_ROUTE);
  },

  // ==========================================
  // INICIALIZACIÓN Y MIGRACIÓN
  // ==========================================
  migrateStorageIfNeeded(): void {
    if (!this.isSupported()) return;
    
    const storedVersionStr = this.getRaw(STORAGE_KEYS.SCHEMA_VERSION);
    const parsedVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 0;

    if (parsedVersion < STORAGE_VERSION) {
      console.log(`[Storage] Migrating storage to v${STORAGE_VERSION}.`);
      // Lógica futura de migración de datos iría aquí
      this.setRaw(STORAGE_KEYS.SCHEMA_VERSION, STORAGE_VERSION.toString());
    }
  },

  initialize(): void {
    this.migrateStorageIfNeeded();
  }
};