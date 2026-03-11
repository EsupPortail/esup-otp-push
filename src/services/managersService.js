import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import axios from 'axios';

const GITHUB_MANAGERS_URL =
  'https://raw.githubusercontent.com/EsupPortail/esup-otp-push/refs/heads/main/src/data/managers.json';

export const managersService = {

  getCachedManagers() {
    const raw = storage.getString(STORAGE_KEYS.MANAGERS);
    return raw ? JSON.parse(raw) : [];
  },

  setCachedManagers(list) {
    const old = this.getCachedManagers();

    const merged = [
      ...old,
      ...list.filter(m => !old.some(o => o.url === m.url)),
    ];

    storage.set(STORAGE_KEYS.MANAGERS, JSON.stringify(merged));
    return merged;
  },

  async fetchManagers() {
    try {
      const { data } = await axios.get(GITHUB_MANAGERS_URL, { timeout: 5000 });
      console.log('[managersService] fetched managers:', data);

      return this.setCachedManagers(data);
    } catch (e) {
      console.warn('[managersService] fetch failed (timeout or error), fallback cache');
      return this.getCachedManagers();
    }
  },

  /* ============================
   * API PRINCIPALE
   * ============================ */

  async getManagers() {
    const cached = this.getCachedManagers();

    console.log('[managersService] Cache vide → fetch initial');
    try {
      const raw = await this.fetchManagers();
      console.log('[managersService] Managers récupérés:', raw);
      return raw;
    } catch {
      if (cached && cached.length > 0) {
        console.log('[managersService] Retour cache immédiat');
        return cached;
      }
      return [];
    }
  },

  async addManager(manager) {
    console.log('[managersService] addManager', manager);

    const managers = this.getCachedManagers();

    if (managers.some(m => m.url === manager.url)) {
      console.log('[managersService] Manager déjà existant');
      return managers;
    }

    const updated = [...managers, manager];

    storage.set(STORAGE_KEYS.MANAGERS, JSON.stringify(updated));
    return updated;
  },

  async deleteManager(url) {
    console.log('[managersService] deleteManager', url);

    const managers = this.getCachedManagers();
    const updated = managers.filter(m => m.url !== url);

    storage.set(STORAGE_KEYS.MANAGERS, JSON.stringify(updated));
    return updated;
  },
};
