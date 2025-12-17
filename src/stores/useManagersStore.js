import { create } from 'zustand';
import { managersService } from '../services/managersService';

export const useManagersStore = create((set) => ({
  managers: [],
  loading: false,

  loadManagers: async () => {
    console.log('[useManagersStore] loadManagers');
    set({ loading: true });
    const managers = await managersService.getManagers();
    set({ managers, loading: false });
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
