import { create } from 'zustand';
import { storage } from '../utils/storage';

export const useTotpStore = create((set, get) => ({
  totpObjects: storage.getString('totpObjects')
    ? JSON.parse(storage.getString('totpObjects'))
    : {},

  setTotpObjects: (newTotp) => {
    storage.set('totpObjects', JSON.stringify(newTotp));
    set({ totpObjects: newTotp });
  },

  updateTotp: (key, data) => {
    const current = get().totpObjects;
    const updated = { ...current, [key]: data };
    storage.set('totpObjects', JSON.stringify(updated));
    set({ totpObjects: updated });
  },

  removeTotp: (key) => {
    const current = get().totpObjects;
    const updated = { ...current };
    delete updated[key];
    storage.set('totpObjects', JSON.stringify(updated));
    set({ totpObjects: updated });
  },

  total: () => Object.keys(get().totpObjects).length,
}));
