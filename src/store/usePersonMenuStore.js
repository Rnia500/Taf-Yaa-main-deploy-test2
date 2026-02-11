// src/store/usePersonMenuStore.js
import { create } from 'zustand';

const usePersonMenuStore = create((set) => ({
  isOpen: false,
  position: { x: 0, y: 0 },
  targetNodeId: null,
  targetNodeName: null,
  targetPerson: null, 

  actions: {
    openMenu: (nodeId, nodeName, position, person) =>
  set(() => {
        const next = {
          isOpen: true,
          targetNodeId: nodeId,
          targetNodeName: nodeName,
          position,
          targetPerson: person,
        };
        if (typeof window !== 'undefined') {
          console.log('DBG:usePersonMenuStore.openMenu -> targetPerson:', person);
          window.__PERSON_MENU__ = next;
        }
        return next;
      }),
    closeMenu: () =>
      set({
        isOpen: false,
        targetNodeId: null,
        targetNodeName: null,
        targetPerson: null,
      }),
  },
}));

export default usePersonMenuStore;
