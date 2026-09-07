import { create } from 'zustand'
export const useCombatStore = create(set => ({ selected: 'pistol', loaded: 12, reserve: 36, reloading: false, request: null,
  select: id => set({ request: id }), publish: state => set(state),
}))
