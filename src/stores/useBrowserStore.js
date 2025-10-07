import { create } from 'zustand';

export const useBrowserStore = create(set => ({
  visible: false,
  url: 'https://otpmanager-test.univ-paris1.fr',
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));

export const browserManager = {
  show: () => useBrowserStore.getState().show(),
  hide: () => useBrowserStore.getState().hide(),
};
