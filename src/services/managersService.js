import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

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

  /* ============================
   * API PRINCIPALE
   * ============================ */

  async getManagers() {
    const cached = this.getCachedManagers();

    if (cached && cached.length > 0) {
      console.log('[managersService] Retour cache immédiat');

      // Refresh silencieux en arrière-plan
      this.fetchManagers()
        .then(() =>
          console.log('[managersService] Cache mis à jour depuis GitHub'),
        )
        .catch(() =>
          console.log('[managersService] Refresh silencieux échoué'),
        );

      return cached;
    }

    // Premier lancement → fetch obligatoire
    console.log('[managersService] Cache vide → fetch initial');
    try {
      return await this.fetchManagers();
    } catch {
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
