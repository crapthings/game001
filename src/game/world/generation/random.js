// 稳定算法：更改此函数须增加 generatorVersion，旧存档使用已保存的规划。
export function createRandom(...parts) {
  const text = JSON.stringify(parts)
  let state = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    state = Math.imul(state ^ text.charCodeAt(index), 16777619) >>> 0
  }
  return () => {
    state += 0x6d2b79f5
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
