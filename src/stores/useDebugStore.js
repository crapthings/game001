import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaults = { revealMap: false, infiniteSprint: false, infiniteAmmo: false, sprintMultiplier: 1, pauseSpawning:false, showSpawns:false }
// 全局调试偏好，与世界种子和游戏进度分开保存。
const pickPreferences = (state) => Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [
  key,
  key === 'sprintMultiplier'
    ? ([1, 2, 3, 4].includes(state?.[key]) ? state[key] : fallback)
    : (typeof state?.[key] === 'boolean' ? state[key] : fallback),
]))

export const useDebugStore = create(persist(set => ({
  ...defaults,
  setPauseSpawning: value => set({pauseSpawning:Boolean(value)}),
  setShowSpawns: value => set({showSpawns:Boolean(value)}),
  setRevealMap: value => set({ revealMap: Boolean(value) }),
  setInfiniteAmmo: value => set({ infiniteAmmo: Boolean(value) }),
  setInfiniteSprint: value => set({ infiniteSprint: Boolean(value) }),
  setSprintMultiplier: value => set({ sprintMultiplier: [1, 2, 3, 4].includes(Number(value)) ? Number(value) : 1 }),
  reset: () => set(defaults),
}), {
  name: 'game001:debug-preferences',
  version: 1,
  partialize: pickPreferences,
  merge: (saved, current) => ({ ...current, ...pickPreferences(saved) }),
}))
