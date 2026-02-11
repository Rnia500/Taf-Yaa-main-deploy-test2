import { create } from 'zustand';

const useToastStore = create((set, get) => ({
  toasts: [],
  
  addToast: (messageOrContent, type = 'info') => {
    const id = Date.now() + Math.random();

    const isCustom = type === 'blank'; 
    const newToast = {
      id,
      type,
      message: isCustom ? null : messageOrContent,
      content: isCustom ? messageOrContent : null,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  }
}));

export default useToastStore;
