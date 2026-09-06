import { create } from 'zustand'
import { START_TIME } from '../game/world/createDayNightCycle.js'

export const useWorldTimeStore = create((set) => ({
  time: START_TIME,
  period: '白天',
  daylight: 1,
  publish: (next) => set((state) => state.time === next.time && state.period === next.period ? state : next),
}))
