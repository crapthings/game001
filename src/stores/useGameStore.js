import { create } from 'zustand'

export const useGameStore = create((set) => ({
  phase: 'menu',
  sessionAuthorized: false,
  debugReturnPhase: 'playing',
  pauseReturnPhase: 'playing',
  beginCinematic: () => set({ phase: 'cinematic' }),
  finishCinematic: () => set(state => state.phase === 'cinematic' ? { phase: 'playing' } : state),
  openDebug: () => set(state => (state.phase === 'playing' || (state.phase === 'paused' && state.pauseReturnPhase === 'playing')) ? { phase: 'debug', debugReturnPhase: state.phase } : state),
  closeDebug: () => set(state => state.phase === 'debug' ? { phase: state.debugReturnPhase } : state),
  openInventory: () => set((state) => state.phase === 'playing' ? { phase: 'inventory' } : state),
  closeInventory: () => set((state) => state.phase === 'inventory' ? { phase: 'playing' } : state),
  beginLoading: () => set({ phase: 'loading', sessionAuthorized: true }),
  openMap: () => set((state) => state.phase === 'playing' ? { phase: 'map' } : state),
  closeMap: () => set((state) => state.phase === 'map' ? { phase: 'playing' } : state),
  startGame: () => set((state) => state.phase === 'loading' ? { phase: 'playing' } : state),
  pauseGame: () => set((state) => ['playing', 'cinematic'].includes(state.phase) ? { phase: 'paused', pauseReturnPhase: state.phase } : state),
  resumeGame: () => set((state) => state.phase === 'paused' ? { phase: state.pauseReturnPhase } : state),
  returnToMenu: () => set({ phase: 'menu', sessionAuthorized: false }),
}))
