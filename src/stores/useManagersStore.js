import { create } from 'zustand';
import { managersService } from '../services/managersService';

export const useManagersStore = create((set) => ({
  managers: [],
  loading: false,

  loadManagers: async () => {
    console.log('[useManagersStore] loadManagers');
    // Chargement immédiat du cache
    const cached = managersService.getCachedManagers();
    if (cached.length > 0) {
      set({ managers: cached, loading: false });
    } else {
      set({ loading: true });
    }

    // Refresh silencieux en arrière-plan
    managersService.fetchManagers().then((updatedManagers) => {
      set({ managers: updatedManagers, loading: false });
    });
  },
  addManager: async (manager) => {
    try {
      const managers = await managersService.addManager(manager);
      set({ managers });
    } catch (error) {
      console.error('[useManagersStore] addManager', error);
    }
  },
  deleteManager: async (url) => {
    const managers = await managersService.deleteManager(url);
    set({ managers });
  }
}));
