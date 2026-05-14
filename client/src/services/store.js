import { create } from 'zustand'

/**
 * Alternative store if needed - using Zustand for state management
 * Currently using React Context, but Zustand can be added later
 */
export const useAppStore = create((set) => ({
  // App state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Theme
  isDarkMode: true,
  setIsDarkMode: (isDark) => set({ isDarkMode: isDark }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
