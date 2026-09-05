import { create } from 'zustand'
import { revealFog } from '../game/map/fog.js'

// 雷达约 10Hz 更新；探索只有新增格子时产生新对象，存档仍由检查点低频写入。
export const useNavigationStore = create((set) => ({
  position: { x: 0, y: 0, z: 0 },
  heading: 0,
  fog: {},
  reset: (position, fog) => set({ position, heading: 0, fog: fog || {} }),
  update: (position, heading) => set((state) => {
    const fog = revealFog(state.fog, position.x, position.z)
    if (fog === state.fog && heading === state.heading && position.x === state.position.x && position.y === state.position.y && position.z === state.position.z) return state
    return { position, heading, fog }
  }),
}))
