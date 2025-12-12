import { create } from 'zustand';
import { storage } from '../utils/storage';

const initialUrl = ''

export const useBrowserStore = create(set => ({
  visible: false,
  url: initialUrl,
  user: {},
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
  setUser: (user) => set({ user }),
  setUrl: (url) => {
    //storage.set('managerUrl', url);
    set({ url });
  },
}));

export const browserManager = {
  show: () => useBrowserStore.getState().show(),
  hide: () => useBrowserStore.getState().hide(),
  setUser: (user) => useBrowserStore.getState().setUser(user),
  getUser: () => useBrowserStore.getState().user,
  setUrl: (url) => useBrowserStore.getState().setUrl(url),
};
