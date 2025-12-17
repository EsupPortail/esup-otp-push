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
    storage.set(STORAGE_KEYS.MANAGERS, JSON.stringify(list));
  },

  async fetchManagers() {
    const res = await fetch(GITHUB_MANAGERS_URL);
    if (!res.ok) throw new Error('Fetch failed');

    const data = await res.json();
    console.log('[managersService] fetched managers:', data);
    this.setCachedManagers(data);
    return data;
  },

  async getManagers() {
    const cached = this.getCachedManagers();

    if (cached && cached.length > 0) {
      console.log('[managersService] Retour cache immédiat');

      // Refresh silencieux en arrière-plan
      this.fetchManagers()
        .then(() => console.log('[managersService] Cache mis à jour'))
        .catch(() => console.log('[managersService] Refresh silencieux échoué'));

      return cached;
    }

    // Premier lancement → fetch obligatoire
    console.log('[managersService] Cache vide → fetch initial');
    try {
      return await this.fetchManagers();
    } catch {
      return [];
    }
  }
};
