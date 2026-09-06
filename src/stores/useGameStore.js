import { create } from 'zustand'

export const useGameStore = create((set) => ({
  phase: 'menu',
  sessionAuthorized: false,
  openInventory: () => set((state) => state.phase === 'playing' ? { phase: 'inventory' } : state),
  closeInventory: () => set((state) => state.phase === 'inventory' ? { phase: 'playing' } : state),
  beginLoading: () => set({ phase: 'loading', sessionAuthorized: true }),
  openMap: () => set((state) => state.phase === 'playing' ? { phase: 'map' } : state),
  closeMap: () => set((state) => state.phase === 'map' ? { phase: 'playing' } : state),
  startGame: () => set((state) => state.phase === 'loading' ? { phase: 'playing' } : state),
  pauseGame: () => set((state) => state.phase === 'playing' ? { phase: 'paused' } : state),
  resumeGame: () => set((state) => state.phase === 'paused' ? { phase: 'playing' } : state),
  returnToMenu: () => set({ phase: 'menu', sessionAuthorized: false }),
}))
