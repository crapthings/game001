import { basicItems } from './definitions/basicItems.js'
import { categoryDefinitions } from './definitions/categories.js'

export const ITEM_SCHEMA_VERSION = 2


function defineItem(item) {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(item.id) || !Object.hasOwn(categoryDefinitions, item.categoryId)
    || !['ready', 'planned'].includes(item.status)
    || !['name', 'description', 'symbol', 'purpose'].every(key => typeof item[key] === 'string' && item[key].trim())
    || !Number.isFinite(item.weight) || item.weight <= 0 || !Number.isInteger(item.maxStack) || item.maxStack < 1
    || !Array.isArray(item.uses) || !item.uses.length || item.uses.some(use => !['consume', 'heal', 'craft', 'build', 'repair', 'harvest'].includes(use))
    || !Array.isArray(item.sources) || !item.sources.length || item.sources.some(source => typeof source !== 'string' || !source.trim())) {
    throw new Error(`道具配置无效：${item.id}`)
  }
  if (item.effects && (item.status !== 'ready' || !item.uses.includes('consume')
    || !Object.keys(item.effects).length || Object.entries(item.effects).some(([key, value]) => !['food', 'water'].includes(key) || !Number.isFinite(value) || value <= 0))) {
    throw new Error(`道具效果无效：${item.id}`)
  }
  return Object.freeze({ ...item, category: categoryDefinitions[item.categoryId].name, uses: Object.freeze([...item.uses]), sources: Object.freeze([...item.sources]), ...(item.effects ? { effects: Object.freeze({ ...item.effects }) } : {}) })
}

// Register each pack separately so overlapping IDs cannot silently overwrite one another.
const registered = Object.create(null)
const categoryMembers = Object.fromEntries(Object.keys(categoryDefinitions).map(id => [id, []]))
for (const pack of [basicItems]) {
  for (const [id, definition] of Object.entries(pack)) {
    if (Object.hasOwn(registered, id)) throw new Error(`道具 ID 重复：${id}`)
    if (Object.hasOwn(definition, 'id')) throw new Error(`道具 ID 只填写在对象键上：${id}`)
    const item = defineItem({ ...definition, id })
    registered[id] = item
    categoryMembers[item.categoryId].push(id)
  }
}
export const itemCatalog = Object.freeze(registered)
export const itemIds = Object.freeze(Object.keys(itemCatalog))
export const itemCategories = Object.freeze(Object.fromEntries(Object.entries(categoryDefinitions).map(([id, definition]) => [id,
  Object.freeze({ ...definition, id, itemIds: Object.freeze(categoryMembers[id]) }),
])))
// UI iteration only; gameplay calculations use itemCatalog[itemId].
export const itemDefinitions = Object.freeze(Object.values(itemCatalog))
