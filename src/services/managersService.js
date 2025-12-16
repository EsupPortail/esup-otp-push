import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const GITHUB_MANAGERS_URL =
  'https://raw.githubusercontent.com/EsupPortail/esup-otp-push/refs/heads/main/src/data/managers.json';

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

export const managersService = {
  getCachedManagers() {
    const raw = storage.getString(STORAGE_KEYS.MANAGERS);
    return raw ? JSON.parse(raw) : [];
  },

  setCachedManagers(list) {
    storage.set(STORAGE_KEYS.MANAGERS, JSON.stringify(list));
    storage.set(STORAGE_KEYS.MANAGERS_UPDATED_AT, Date.now());
  },

  shouldRefresh() {
    const last = storage.getNumber(STORAGE_KEYS.MANAGERS_UPDATED_AT);
    if (!last) return true;
    return Date.now() - last > CACHE_TTL;
  },

  async fetchManagers() {
    try {
      const res = await fetch(GITHUB_MANAGERS_URL);
      if (!res.ok) throw new Error('Fetch failed');

      const data = await res.json();
      console.log('[managersService] fetched managers:', data);
      this.setCachedManagers(data);
      return data;
    } catch (e) {
      console.warn('[managersService] fetch failed, fallback cache');
      return this.getCachedManagers();
    }
  },

  async getManagers() {
    const cached = this.getCachedManagers();

    // Premier lancement / cache vide
    if (!cached || cached.length === 0) {
      console.log('[managersService] Cache vide → fetch immédiat');
      return this.fetchManagers();
    }

    // Cache expiré
    if (this.shouldRefresh()) {
      console.log('[managersService] Cache expiré → refresh');
      return this.fetchManagers();
    }

    return cached;
  },
};
