// src/store/useSidebarStore.js
import { create } from 'zustand';

const useSidebarStore = create((set) => ({
  isSidebarOpen: false,

  activeProfileId: null,
  activeInvite: null,


  openSidebar: (personId) => set({ isSidebarOpen: true, activeProfileId: personId }),
  openInviteSidebar: (invite) => set({ isSidebarOpen: true, activeInvite: invite }),

  closeSidebar: () => set({ isSidebarOpen: false, activeProfileId: null, activeInvite: null }),
}));

export default useSidebarStore;