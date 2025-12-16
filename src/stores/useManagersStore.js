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
}));
