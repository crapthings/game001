import { create } from 'zustand'

const initial = { stage: 'idle', fade: 0, line: null, busy: false, error: null, advance: null, skip: null }
export const useOpeningStore = create(set => ({ ...initial,
  publish: value => set(value),
  reset: () => set(initial),
}))
