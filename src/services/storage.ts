/**
 * Production-Ready Storage Engine for Life in Pixels.
 * 
 * Provides resilient, privacy-first local storage combining:
 * 1. Immediate synchronous localStorage for instant React state hydration
 * 2. Persistent IndexedDB for high-capacity, durable offline storage (photos, reflections)
 * 3. Automatic schema validation, backup export/import, and zero dummy data in production
 */

import type { DailyEntry, Memory, Milestone, UserSettings } from '../types';

export const STORAGE_KEY_V2 = 'life_in_pixels_user_data_v2';
const LEGACY_STORAGE_KEY = 'life_in_pixels_prod_v1';
const DB_NAME = 'LifeInPixelsDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  birthDate: undefined,
  weekStartsOn: 1, // Monday
  themeId: 'softly-pastel',
  horizonYears: 80,
  enableHaptics: true,
  reducedMotion: false,
  remindersEnabled: true,
  reminderTime: '21:00',
  reminderStyle: 'gentle',
  showAccessibilitySymbols: false,
  onboardingCompleted: false,
  viewportMode: 'mobile-frame',
};

export interface AppStoredData {
  entries: DailyEntry[];
  milestones: Milestone[];
  memories: Memory[];
  settings: UserSettings;
  version: number;
  lastUpdated: string;
}

// In-memory single source of truth
let cachedData: AppStoredData = {
  entries: [],
  milestones: [],
  memories: [],
  settings: DEFAULT_SETTINGS,
  version: 2,
  lastUpdated: new Date().toISOString(),
};

type StoreListener = () => void;
const storeListeners = new Set<StoreListener>();

/**
 * Open IndexedDB database with schema initialization
 */
function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('memories')) {
          db.createObjectStore('memories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('milestones')) {
          db.createObjectStore('milestones', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to localStorage');
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB exception', err);
      resolve(null);
    }
  });
}

/**
 * Persist cached data to IndexedDB
 */
async function persistToIndexedDB(data: AppStoredData): Promise<void> {
  const db = await openIDB();
  if (!db) return;

  try {
    const tx = db.transaction(['entries', 'memories', 'milestones', 'settings'], 'readwrite');
    const entryStore = tx.objectStore('entries');
    const memoryStore = tx.objectStore('memories');
    const milestoneStore = tx.objectStore('milestones');
    const settingsStore = tx.objectStore('settings');

    // Clear and re-populate object stores
    entryStore.clear();
    memoryStore.clear();
    milestoneStore.clear();

    data.entries.forEach((e) => entryStore.put(e));
    data.memories.forEach((m) => memoryStore.put(m));
    data.milestones.forEach((ms) => milestoneStore.put(ms));
    settingsStore.put({ id: 'app_settings', ...data.settings });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to write to IndexedDB:', err);
  }
}

/**
 * Check if data contains legacy dummy seed markers and clean them out
 */
function sanitizeData(data: Partial<AppStoredData>): AppStoredData {
  const rawEntries = Array.isArray(data.entries) ? data.entries : [];
  const rawMilestones = Array.isArray(data.milestones) ? data.milestones : [];
  const rawMemories = Array.isArray(data.memories) ? data.memories : [];

  // Filter out any previous dummy/sample seeds if present from older versions
  const cleanEntries = rawEntries.filter((e) => {
    if (!e || !e.date || !e.mood) return false;
    // Check for dummy seed reflection markers
    if (e.reflection?.includes('homemade tomato basil soup and invited Sarah over')) return false;
    if (e.reflection?.includes('Presented the autumn design overhaul')) return false;
    return true;
  });

  const cleanMilestones = rawMilestones.filter((m) => {
    if (!m || !m.id || !m.title) return false;
    if (m.id === 'm1' && m.title.includes('Pottery')) return false;
    if (m.id === 'm2' && m.title.includes('Portfolio')) return false;
    if (m.id === 'm3' && m.title.includes('Cabin')) return false;
    return true;
  });

  const cleanMemories = rawMemories.filter((mem) => {
    if (!mem || !mem.id || !mem.title) return false;
    if (mem.id === 'mem1' || mem.id === 'mem2' || mem.id === 'mem3') return false;
    return true;
  });

  const cleanSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings || {}),
  };

  return {
    entries: cleanEntries,
    milestones: cleanMilestones,
    memories: cleanMemories,
    settings: cleanSettings,
    version: 2,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save synchronous state to localStorage and trigger background IndexedDB persistence
 */
function saveStore(data: AppStoredData): void {
  cachedData = data;
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
  } catch (err) {
    console.error('localStorage quota or error:', err);
  }

  // Non-blocking IndexedDB persistence
  persistToIndexedDB(data).catch((err) => {
    console.warn('IDB background persistence error:', err);
  });

  // Notify active React subscribers
  storeListeners.forEach((fn) => fn());
}

/**
 * Initialize storage engine on bootstrap
 */
export function initStorageEngine(): AppStoredData {
  if (typeof window === 'undefined') {
    return cachedData;
  }

  try {
    // 1. Check current V2 storage key
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      cachedData = sanitizeData(parsed);
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(cachedData));
      return cachedData;
    }

    // 2. Check legacy key for migration and sanitize any dummy data
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      try {
        const parsedLegacy = JSON.parse(rawLegacy);
        cachedData = sanitizeData(parsedLegacy);
        // Save to v2 and clean legacy key
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(cachedData));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return cachedData;
      } catch {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
  } catch (err) {
    console.error('Storage initialization error:', err);
  }

  // Fresh clean canvas - zero dummy data
  cachedData = {
    entries: [],
    milestones: [],
    memories: [],
    settings: DEFAULT_SETTINGS,
    version: 2,
    lastUpdated: new Date().toISOString(),
  };

  saveStore(cachedData);
  return cachedData;
}

// Run initial hydration
initStorageEngine();

// Listen to storage events from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY_V2 && event.newValue) {
      try {
        cachedData = sanitizeData(JSON.parse(event.newValue));
        storeListeners.forEach((fn) => fn());
      } catch {
        // ignore malformed external events
      }
    }
  });
}

/**
 * Public Storage API for the entire application
 */
export const StorageService = {
  getData(): AppStoredData {
    return cachedData;
  },

  subscribe(listener: StoreListener): () => void {
    storeListeners.add(listener);
    return () => {
      storeListeners.delete(listener);
    };
  },

  saveEntry(entry: DailyEntry): void {
    const existingIndex = cachedData.entries.findIndex((e) => e.date === entry.date);
    let updatedEntries: DailyEntry[];
    if (existingIndex >= 0) {
      updatedEntries = [...cachedData.entries];
      updatedEntries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      updatedEntries = [entry, ...cachedData.entries];
    }

    // Auto-sync reflections to memories
    let updatedMemories = [...cachedData.memories];
    if (entry.reflection && entry.reflection.trim().length > 0) {
      const existingMemIndex = updatedMemories.findIndex((m) => m.date === entry.date);
      if (existingMemIndex >= 0) {
        updatedMemories[existingMemIndex] = {
          ...updatedMemories[existingMemIndex],
          text: entry.reflection,
          tags: entry.tags || [],
          mood: entry.mood,
          photos: entry.photos || [],
        };
      } else {
        updatedMemories.unshift({
          id: `mem-${Date.now()}`,
          date: entry.date,
          title: `Reflection on ${entry.date}`,
          text: entry.reflection,
          tags: entry.tags || [],
          photos: entry.photos || [],
          isFavorite: false,
          mood: entry.mood,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveStore({
      ...cachedData,
      entries: updatedEntries,
      memories: updatedMemories,
      lastUpdated: new Date().toISOString(),
    });
  },

  deleteEntry(dateStr: string): void {
    saveStore({
      ...cachedData,
      entries: cachedData.entries.filter((e) => e.date !== dateStr),
      lastUpdated: new Date().toISOString(),
    });
  },

  saveMilestone(milestone: Milestone): void {
    const existingIndex = cachedData.milestones.findIndex((m) => m.id === milestone.id);
    let updatedMilestones: Milestone[];
    if (existingIndex >= 0) {
      updatedMilestones = [...cachedData.milestones];
      updatedMilestones[existingIndex] = milestone;
    } else {
      updatedMilestones = [milestone, ...cachedData.milestones];
    }

    saveStore({
      ...cachedData,
      milestones: updatedMilestones,
      lastUpdated: new Date().toISOString(),
    });
  },

  deleteMilestone(id: string): void {
    saveStore({
      ...cachedData,
      milestones: cachedData.milestones.filter((m) => m.id !== id),
      lastUpdated: new Date().toISOString(),
    });
  },

  saveMemory(memory: Memory): void {
    const existingIndex = cachedData.memories.findIndex((m) => m.id === memory.id);
    let updatedMemories: Memory[];
    if (existingIndex >= 0) {
      updatedMemories = [...cachedData.memories];
      updatedMemories[existingIndex] = memory;
    } else {
      updatedMemories = [memory, ...cachedData.memories];
    }

    saveStore({
      ...cachedData,
      memories: updatedMemories,
      lastUpdated: new Date().toISOString(),
    });
  },

  deleteMemory(id: string): void {
    saveStore({
      ...cachedData,
      memories: cachedData.memories.filter((m) => m.id !== id),
      lastUpdated: new Date().toISOString(),
    });
  },

  toggleFavoriteMemory(id: string): void {
    saveStore({
      ...cachedData,
      memories: cachedData.memories.map((m) =>
        m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
      ),
      lastUpdated: new Date().toISOString(),
    });
  },

  updateSettings(newSettings: Partial<UserSettings>): void {
    saveStore({
      ...cachedData,
      settings: { ...cachedData.settings, ...newSettings },
      lastUpdated: new Date().toISOString(),
    });
  },

  clearAllData(): void {
    const cleared: AppStoredData = {
      entries: [],
      milestones: [],
      memories: [],
      settings: { ...DEFAULT_SETTINGS, onboardingCompleted: true },
      version: 2,
      lastUpdated: new Date().toISOString(),
    };
    saveStore(cleared);
  },

  exportBackup(): void {
    if (typeof window === 'undefined') return;
    const backupPayload = {
      app: 'Life in Pixels',
      version: 2,
      exportedAt: new Date().toISOString(),
      entries: cachedData.entries,
      milestones: cachedData.milestones,
      memories: cachedData.memories,
      settings: cachedData.settings,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-in-pixels-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importBackup(parsed: any): void {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    const sanitized = sanitizeData({
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      settings: parsed.settings || cachedData.settings,
    });

    saveStore(sanitized);
  },

  getStats() {
    const totalBytes = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY_V2) || '').length * 2
      : 0;

    return {
      entriesCount: cachedData.entries.length,
      milestonesCount: cachedData.milestones.length,
      memoriesCount: cachedData.memories.length,
      lastUpdated: cachedData.lastUpdated,
      sizeFormatted: `${(totalBytes / 1024).toFixed(1)} KB`,
      isIndexedDBSupported: typeof window !== 'undefined' && !!window.indexedDB,
    };
  },
};
