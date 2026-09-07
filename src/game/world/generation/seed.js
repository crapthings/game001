export const ACTIVE_SEED_KEY = 'game001:active-seed:edge'

export function normalizeSeed(seed) {
  const normalized = String(seed).normalize('NFC').trim()
  if (!normalized || normalized.length > 80) throw new Error('世界种子需为 1–80 个字符。')
  return normalized
}

// 12 位纯数字，首位非零；始终作为字符串保存，不引入额外依赖。
export function createWorldSeed(previous = '') {
  let seed
  do {
    seed = ''
    while (seed.length < 12) {
      const bytes = crypto.getRandomValues(new Uint8Array(24))
      for (const byte of bytes) {
        if (byte >= 250) continue
        const digit = byte % 10
        if (!seed && digit === 0) continue
        seed += digit
        if (seed.length === 12) break
      }
    }
  } while (seed === previous)
  return seed
}
