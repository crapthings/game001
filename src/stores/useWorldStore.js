import { create } from 'zustand'
import { createWorldRepository } from '../game/persistence/worldRepository.js'
import { applyProgress } from '../game/world/progress.js'

const repository = () => createWorldRepository(window.localStorage)

export const useWorldStore = create((set, get) => ({
  document: null,
  error: null,
  seed: 'first-light',
  initialize: () => {
    if (get().document) return
    try { get().openWorld(repository().getActiveSeed()) }
    catch (error) { set({ error: error.message }) }
  },
  openWorld: (seed) => {
    try {
      const document = repository().open(seed)
      set({ document, seed: document.world.seed, error: null })
      return true
    } catch (error) {
      set({ error: `保存或读取失败：${error.message}` })
      return false
    }
  },
  addNewRegions: () => {
    try {
      const document = get().document
      if (!document) return false
      set({ document: repository().extend(document), error: null })
      return true
    } catch (error) {
      set({ error: `区域扩展失败：${error.message}` })
      return false
    }
  },
  dispatch: (event) => {
    try {
      const document = get().document
      if (!document) return false
      const progress = applyProgress(document.world, document.progress, event)
      if (progress === document.progress) return true
      const next = repository().save(document, progress)
      set({ document: next, error: null })
      return true
    } catch (error) {
      set({ error: `进度未保存：${error.message}` })
      return false
    }
  },
}))
