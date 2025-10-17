import { connect } from 'rxjs';
import { create } from 'zustand';

export const useBrowserStore = create(set => ({
  visible: false,
  url: 'https://esup-otp-manager-test.univ-paris1.fr/',
  user: {},
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
  setUser: (user) => set({ user }),
}));

export const browserManager = {
  show: () => useBrowserStore.getState().show(),
  hide: () => useBrowserStore.getState().hide(),
  setUser: (user) => useBrowserStore.getState().setUser(user),
  getUser: () => useBrowserStore.getState().user,
};
