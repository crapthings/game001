import { create } from 'zustand'

export const useGameStore = create((set) => ({
  phase: 'menu',
  openMap: () => set((state) => state.phase === 'playing' ? { phase: 'map' } : state),
  closeMap: () => set((state) => state.phase === 'map' ? { phase: 'playing' } : state),
  startGame: () => set({ phase: 'playing' }),
  pauseGame: () => set((state) => state.phase === 'playing' ? { phase: 'paused' } : state),
  resumeGame: () => set((state) => state.phase === 'paused' ? { phase: 'playing' } : state),
  returnToMenu: () => set({ phase: 'menu' }),
}))
