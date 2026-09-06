import { create } from 'zustand'
import { STAMINA } from '../game/entities/createStamina.js'

export const usePlayerStatusStore = create((set) => ({
  current: STAMINA.max, max: STAMINA.max, mode: 'idle',
  publish: (status) => set((state) => state.current === status.current && state.mode === status.mode ? state : status),
}))
