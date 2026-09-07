import { itemCatalog, itemIds } from '../inventory/items.js'
import { interactionDefinitions, lootTableDefinitions } from './definitions.js'

export const LOOT_SCHEMA_VERSION = 1
export const interactionActions = Object.freeze({ chop: '砍伐', mine: '开采', gather: '采集', search: '搜刮' })
export const lootTables = Object.freeze(Object.fromEntries(Object.entries(lootTableDefinitions).map(([id, entries]) => {
  const registered = Object.fromEntries(Object.entries(entries).map(([itemId, entry]) => {
    if (!Object.hasOwn(itemCatalog, itemId) || !Number.isFinite(entry.chance) || entry.chance < 0 || entry.chance > 1
      || !Number.isInteger(entry.min) || !Number.isInteger(entry.max) || entry.min < 1 || entry.max < entry.min) throw new Error(`掉落配置无效：${id}/${itemId}`)
    return [itemId, Object.freeze({ ...entry, itemId })]
  }))
  return [id, Object.freeze({ id, mode: 'independent', entries: Object.freeze(registered) })]
})))

const byAsset = Object.create(null)
const byProfile = Object.create(null)
const byItem = Object.fromEntries(itemIds.map(id => [id, []]))
export const lootInteractions = Object.freeze(Object.fromEntries(Object.entries(interactionDefinitions).map(([id, rule]) => {
  if (!Object.hasOwn(lootTables, rule.lootTableId) || !Object.hasOwn(interactionActions, rule.action)
    || (rule.toolId !== null && itemCatalog[rule.toolId]?.categoryId !== 'tool')
    || !['stump', 'depleted', 'searched'].includes(rule.depletedState)
    || typeof rule.name !== 'string' || !rule.name.trim()
    || Boolean(rule.assetId) === Boolean(rule.profileId)) throw new Error(`交互配置无效：${id}`)
  const index = rule.assetId ? byAsset : byProfile
  const key = rule.assetId ?? rule.profileId
  if (Object.hasOwn(index, key)) throw new Error(`交互绑定重复：${key}`)
  const registered = Object.freeze({ ...rule, id, status: 'planned', maxCompletions: 1 })
  index[key] = registered
  for (const entry of Object.values(lootTables[rule.lootTableId].entries)) {
    byItem[entry.itemId].push(Object.freeze({ interactionId: id, ...entry }))
  }
  return [id, registered]
})))
export const assetLootIndex = Object.freeze(byAsset)
export const profileLootIndex = Object.freeze(byProfile)
export const itemLootSources = Object.freeze(Object.fromEntries(Object.entries(byItem).map(([id, sources]) => [id, Object.freeze(sources)])))

// Variants share a base asset rule. This lookup does not enable harvesting on decorative instances.
export function getAssetLootInteraction(assetId) {
  return assetLootIndex[assetId] ?? assetLootIndex[assetId.split(':')[0]] ?? null
}
