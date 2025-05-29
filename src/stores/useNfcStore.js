import { create } from 'zustand';
import { storage } from '../utils/storage';

export const useNfcStore = create((set, get) => ({
  establishments: storage.getString('establishments')
    ? JSON.parse(storage.getString('establishments'))
    : [],

  setEstablishments: (newList) => {
    storage.set('establishments', JSON.stringify(newList));
    set({ establishments: newList });
  },

  addEstablishment: (newEst) => {
    const current = get().establishments;
    const exists = current.some(est => est.url === newEst.url);
    if (!exists) {
      const updated = [...current, newEst];
      storage.set('establishments', JSON.stringify(updated));
      set({ establishments: updated });
    }
  },

  removeEstablishment: (url) => {
    const filtered = get().establishments.filter(est => est.url !== url);
    storage.set('establishments', JSON.stringify(filtered));
    set({ establishments: filtered });
  },

  reset: () => {
    storage.delete('establishments');
    set({ establishments: [] });
  }
}));
