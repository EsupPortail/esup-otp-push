import { create } from 'zustand';
import { storage } from '../utils/storage';

const initialOtpServers = storage.getString('otpServers')
  ? JSON.parse(storage.getString('otpServers'))
  : {};

export const useOtpServersStore = create((set, get) => ({
  otpServers: initialOtpServers,

  setOtpServers: (newOtp) => {
    storage.set('otpServers', JSON.stringify(newOtp));
    set({ otpServers: newOtp });
  },

  updateOtpServer: (key, data) => {
    const current = get().otpServers;
    const updated = { ...current, [key]: data };
    storage.set('otpServers', JSON.stringify(updated));
    set({ otpServers: updated });
  },

  removeOtpServer: (key) => {
    const updated = { ...get().otpServers };
    delete updated[key];
    storage.set('otpServers', JSON.stringify(updated));
    set({ otpServers: updated });
  },

  total: () => Object.keys(get().otpServers).length,
}));
