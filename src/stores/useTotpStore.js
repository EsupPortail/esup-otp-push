import { create } from 'zustand';
import { storage } from '../utils/storage';

const initialTotpObjects = storage.getString('totpObjects')
  ? JSON.parse(storage.getString('totpObjects'))
  : {};

export const useTotpStore = create((set, get) => ({
  totpObjects: initialTotpObjects,

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

    if (!current[key]) return;

    const updated = { ...current };
    delete updated[key];
    storage.set('totpObjects', JSON.stringify(updated));
    set({ totpObjects: updated });
    console.log(`[removeTotp] TOTP supprimé : ${key}`);
  },

  total: () => Object.keys(get().totpObjects).length,
}));
