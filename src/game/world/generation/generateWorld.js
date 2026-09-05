import { createRandom } from './random.js'
import { regionDefinitions } from '../regions/definitions.js'
import { createTownPlan } from '../settlements/createTownPlan.js'

export const GENERATOR_VERSION = 1
export const PLAN_VERSION = 1

export function normalizeSeed(seed) {
  const normalized = String(seed).normalize('NFC').trim()
  if (!normalized || normalized.length > 80) throw new Error('世界种子需为 1–80 个字符。')
  return normalized
}

export function validateDefinitions(definitions) {
  const ids = new Set()
  for (const region of definitions) {
    if (!/^[a-z0-9-]+$/.test(region.id) || ids.has(region.id)) throw new Error('区域 ID 不合法或重复。')
    ids.add(region.id)
    if (!Number.isInteger(region.revision) || region.revision < 1 || !Array.isArray(region.center) || region.center.length !== 2 || !region.center.every(Number.isFinite) || !Number.isFinite(region.radius) || region.radius < 10) throw new Error(`区域 ${region.id} 的范围无效。`)
    const localIds = new Set()
    for (const item of [...region.landmarks, ...region.scatter]) {
      if (!/^[a-z0-9-]+$/.test(item.id) || localIds.has(item.id) || !item.assetId) throw new Error(`区域 ${region.id} 的内容 ID 无效。`)
      localIds.add(item.id)
    }
    for (const item of region.landmarks) {
      if (!Array.isArray(item.offset) || item.offset.length !== 2 || !item.offset.every(Number.isFinite) || Math.hypot(...item.offset) > region.radius - 5) throw new Error(`区域 ${region.id} 的地标超出预留范围。`)
    }
    for (const item of region.scatter) {
      if (!Number.isInteger(item.count) || item.count < 0 || item.count > 500) throw new Error(`区域 ${region.id} 的散布数量无效。`)
    }
  }
  for (const region of definitions) {
    if (region.connections.some((id) => !ids.has(id) || id === region.id)) throw new Error(`区域 ${region.id} 的连接无效。`)
  }
  for (let a = 0; a < definitions.length; a += 1) {
    for (let b = a + 1; b < definitions.length; b += 1) {
      const first = definitions[a], second = definitions[b]
      if (Math.hypot(first.center[0] - second.center[0], first.center[1] - second.center[1]) < first.radius + second.radius) throw new Error(`区域 ${first.id} 与 ${second.id} 重叠。`)
    }
  }
}

export function generateWorld(seed, definitions = regionDefinitions) {
  seed = normalizeSeed(seed)
  validateDefinitions(definitions)
  const regions = [...definitions].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map((definition) => {
    const region = structuredClone(definition)
    const placements = region.landmarks.map((item) => ({
      id: `${region.id}/landmark/${item.id}`, assetId: item.assetId,
      position: [region.center[0] + item.offset[0], 0, region.center[1] + item.offset[1]],
      rotation: 0, scale: 1, label: item.label,
    }))
    for (const layer of region.scatter) {
      for (let index = 0; index < layer.count; index += 1) {
        // 每个对象独立随机流：新增区域、层或对象不会消耗其他对象的随机序列。
        const random = createRandom(seed, GENERATOR_VERSION, region.id, region.revision, layer.id, index)
        for (let attempt = 0; attempt < 40; attempt += 1) {
          const angle = random() * Math.PI * 2
          const radius = Math.sqrt(random()) * (region.radius - 3)
          const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius
          // 中心保留通道；地标周围留白，后续正式素材可替换代理模型。
          if (Math.abs(z) < 2.5 || region.landmarks.some((item) => Math.hypot(x - item.offset[0], z - item.offset[1]) < 6)) continue
          const position = [region.center[0] + x, 0, region.center[1] + z]
          if (placements.some((item) => Math.hypot(position[0] - item.position[0], position[2] - item.position[2]) < 2.5)) continue
          placements.push({ id: `${region.id}/${layer.id}/${index}`, assetId: layer.assetId, position, rotation: random() * Math.PI * 2, scale: 0.8 + random() * 0.4 })
          break
        }
      }
    }
    return { ...region, placements }
  })
  return { seed, generatorVersion: GENERATOR_VERSION, planVersion: PLAN_VERSION, regions, settlements: [createTownPlan(seed)] }
}

// 显式扩展旧世界：仅追加未出现的区域 ID，既有区域和对象快照不重算。
export function appendNewRegions(plan, definitions = regionDefinitions) {
  if (plan.generatorVersion !== GENERATOR_VERSION) throw new Error('需要先迁移生成器版本。')
  const existingIds = new Set(plan.regions.map((region) => region.id))
  const additions = definitions.filter((region) => !existingIds.has(region.id))
  if (additions.length === 0) return plan
  const combined = [...plan.regions, ...additions]
  validateDefinitions(combined)
  const generated = generateWorld(plan.seed, combined)
  return { ...plan, regions: [...plan.regions, ...generated.regions.filter((region) => !existingIds.has(region.id))] }
}
