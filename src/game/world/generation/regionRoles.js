import { createRandom } from './random.js'

// 4×4 管理区内做分层分配：三个宏区各一城一村，第四个宏区三个村。
// 每个宏区至少留一个完整野外区；聚落区内未建设的土地仍为自然生态。
export function createRegionRoles(seed) {
  const random = createRandom(seed, 'region-balance-v1')
  const shuffle = values => {
    const result = [...values]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
  const roles = Array(16).fill(null)
  const ruralMacro = Math.floor(random() * 4)
  for (let macro = 0; macro < 4; macro++) {
    const origin = Math.floor(macro / 2) * 8 + (macro % 2) * 2
    const corners = [origin, origin + 1, origin + 4, origin + 5]
    const first = Math.floor(random() * 4)
    roles[corners[first]] = macro === ruralMacro ? 'village' : 'city'
    // 对角分布，避免同一宏区的两处聚落挤在一起。
    roles[corners[3 - first]] = 'village'
    if (macro === ruralMacro) {
      const remaining = corners.filter(index => !roles[index])
      roles[remaining[Math.floor(random() * remaining.length)]] = 'village'
    }
  }
  const wilderness = shuffle(['woodland', 'woodland', 'meadow', 'farmland', 'wetland', 'quarry', 'scrubland'])
  return roles.map(role => role || wilderness.pop())
}
