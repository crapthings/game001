export const createSurvival = () => ({ food: 100, water: 100 })
export const validSurvival = (value) => value && ['food','water'].every(key => Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 100)
// 现实游戏时间：静止约 60 分钟耗尽饱食、40 分钟耗尽水分。
export const SURVIVAL = { foodPerSecond: 100 / 3600, waterPerSecond: 100 / 2400 }
