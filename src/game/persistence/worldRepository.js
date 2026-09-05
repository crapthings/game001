import { generateWorld, normalizeSeed, appendNewRegions } from '../world/generation/generateWorld.js'
import { createProgress } from '../world/progress.js'
import { createTownPlan } from '../world/settlements/createTownPlan.js'
import { validFog } from '../map/fog.js'

const SCHEMA_VERSION = 1
const PREFIX = 'game001:world:'
const ACTIVE_KEY = 'game001:active-seed'

function validateDocument(document, seed) {
  if (document?.schemaVersion !== SCHEMA_VERSION) throw new Error('存档版本不兼容，已保留原始数据。')
  const world = document.world, progress = document.progress
  if (world?.seed !== seed || world.generatorVersion !== 1 || world.planVersion !== 1 || !Array.isArray(world.regions) || world.regions.length === 0 || !Number.isInteger(document.revision)) throw new Error('世界存档无效，已保留原始数据。')
  const ids = new Set()
  for (const region of world.regions) {
    if (typeof region.id !== 'string' || ids.has(region.id) || typeof region.name !== 'string' || typeof region.color !== 'string' || !Array.isArray(region.tags) || !region.tags.every((tag) => typeof tag === 'string') || !Array.isArray(region.center) || region.center.length !== 2 || !region.center.every(Number.isFinite) || !Number.isFinite(region.radius) || region.radius <= 0 || !Array.isArray(region.placements)) throw new Error('区域存档无效，已保留原始数据。')
    ids.add(region.id)
    const objectIds = new Set()
    for (const item of region.placements) {
      if (typeof item.id !== 'string' || objectIds.has(item.id) || typeof item.assetId !== 'string' || !Array.isArray(item.position) || item.position.length !== 3 || !item.position.every(Number.isFinite) || !Number.isFinite(item.rotation) || !Number.isFinite(item.scale) || item.scale <= 0) throw new Error('对象存档无效，已保留原始数据。')
      objectIds.add(item.id)
    }
  }
  if (!progress || !Array.isArray(progress.discoveredRegionIds) || !progress.discoveredRegionIds.every((id) => ids.has(id)) || !progress.annotations || typeof progress.annotations !== 'object' || Array.isArray(progress.annotations) || !Object.entries(progress.annotations).every(([id, text]) => ids.has(id) && typeof text === 'string' && text.length <= 160) || (progress.lastRegionId !== null && !ids.has(progress.lastRegionId))) throw new Error('进度存档无效，已保留原始数据。')
  if (progress.playerPosition != null && (!Array.isArray(progress.playerPosition) || progress.playerPosition.length !== 2 || !progress.playerPosition.every(Number.isFinite))) throw new Error('角色位置存档无效。')
  if (progress.exploredFog !== undefined && !validFog(progress.exploredFog)) throw new Error('探索迷雾存档无效，已保留原始数据。')
  if (world.settlements !== undefined) {
    if (!Array.isArray(world.settlements)) throw new Error('城镇存档无效。')
    for (const town of world.settlements) {
      if (town.revision !== 1 || town.catalogVersion !== 1 || typeof town.id !== 'string' || !Number.isFinite(town.elevation) || !town.bounds || !['minX', 'maxX', 'minZ', 'maxZ'].every((key) => Number.isFinite(town.bounds[key])) || !Array.isArray(town.placements) || !Array.isArray(town.roads)) throw new Error('城镇规划版本或范围无效。')
      if (town.bounds.minX >= town.bounds.maxX || town.bounds.minZ >= town.bounds.maxZ) throw new Error('城镇范围无效。')
      for (const placement of town.placements) {
        if (typeof placement.id !== 'string' || typeof placement.assetId !== 'string' || !Array.isArray(placement.position) || placement.position.length !== 3 || !placement.position.every(Number.isFinite) || !Number.isFinite(placement.rotation) || !Number.isFinite(placement.scale) || placement.scale <= 0 || !Number.isFinite(placement.footprint?.width) || !Number.isFinite(placement.footprint?.depth) || placement.footprint.width <= 0 || placement.footprint.depth <= 0) throw new Error('建筑地块存档无效。')
      }
      for (const road of town.roads) {
        if (!Array.isArray(road.from) || road.from.length !== 2 || !road.from.every(Number.isFinite) || !Array.isArray(road.to) || road.to.length !== 2 || !road.to.every(Number.isFinite) || !Number.isFinite(road.width) || road.width <= 0 || road.from[1] !== road.to[1]) throw new Error('道路规划存档无效。')
      }
    }
  }
  return document
}

// 存储可注入；当前小型区域规划使用 localStorage，后续实现 IndexedDB adapter。
export function createWorldRepository(storage) {
  const keyFor = (seed) => PREFIX + encodeURIComponent(normalizeSeed(seed))
  return {
    getActiveSeed: () => storage.getItem(ACTIVE_KEY) || 'first-light',
    open(seed) {
      seed = normalizeSeed(seed)
      const raw = storage.getItem(keyFor(seed))
      let document
      if (raw !== null) {
        try { document = validateDocument(JSON.parse(raw), seed) }
        catch (error) { throw new Error(`无法读取世界：${error.message}`) }
      } else {
        document = { schemaVersion: SCHEMA_VERSION, revision: 0, world: generateWorld(seed), progress: createProgress() }
        storage.setItem(keyFor(seed), JSON.stringify(document))
      }
      // 给旧版原型追加城镇内容快照，已有区域与玩家进度完整保留。
      if (document.world.settlements === undefined) {
        document = { ...document, revision: document.revision + 1, world: { ...document.world, settlements: [createTownPlan(seed)] } }
        validateDocument(document, seed)
        storage.setItem(keyFor(seed), JSON.stringify(document))
      }
      storage.setItem(ACTIVE_KEY, seed)
      return document
    },
    extend(document, definitions) {
      const world = appendNewRegions(document.world, definitions)
      if (world === document.world) return document
      return this.save({ ...document, world }, document.progress)
    },
    save(document, progress) {
      const key = keyFor(document.world.seed)
      const raw = storage.getItem(key)
      const current = raw === null ? null : validateDocument(JSON.parse(raw), document.world.seed)
      if (!current || current.revision !== document.revision) throw new Error('存档已在其他页面更新，请返回菜单重新进入该种子。')
      const next = { ...document, revision: document.revision + 1, progress }
      validateDocument(next, document.world.seed)
      storage.setItem(key, JSON.stringify(next))
      return next
    },
  }
}
