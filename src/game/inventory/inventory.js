import { itemCatalog } from './items.js'

export const INVENTORY = Object.freeze({ slots: 24, maxWeight: 20 })
export const inventoryWeight = (bag) => bag.slots.reduce((sum, stack) => sum + (stack ? itemCatalog[stack.itemId].weight * stack.count : 0), 0)
export function createInventory() {
  const slots = Array(INVENTORY.slots).fill(null)
  return { version: 1, slots }
}
export function validInventory(bag) {
  return bag?.version === 1 && Array.isArray(bag.slots) && bag.slots.length === INVENTORY.slots
    && bag.slots.every(stack => stack === null || (stack && Object.hasOwn(itemCatalog, stack.itemId) && Number.isInteger(stack.count) && stack.count > 0 && stack.count <= itemCatalog[stack.itemId].maxStack))
    && inventoryWeight(bag) <= INVENTORY.maxWeight + 0.00001
}
export function updateInventory(current, event) {
  if (!validInventory(current)) throw new Error('背包数据无效。')
  const slots = current.slots.map(stack => stack ? { ...stack } : null)
  const indexValid = index => Number.isInteger(index) && index >= 0 && index < slots.length
  if (event.action === 'sort') {
    const counts = new Map()
    slots.filter(Boolean).forEach(stack => counts.set(stack.itemId, (counts.get(stack.itemId) || 0) + stack.count))
    slots.fill(null)
    let index = 0
    for (const itemId of [...counts.keys()].sort()) {
      let count = counts.get(itemId)
      while (count > 0) {
        const amount = Math.min(count, itemCatalog[itemId].maxStack)
        slots[index++] = { itemId, count: amount }; count -= amount
      }
    }
  } else if (event.action === 'split') {
    if (!indexValid(event.index) || !slots[event.index] || slots[event.index].count < 2) throw new Error('该物品无法拆分。')
    const empty = slots.indexOf(null)
    if (empty < 0) throw new Error('背包没有空格。')
    const source = slots[event.index], count = Math.floor(source.count / 2)
    source.count -= count; slots[empty] = { itemId: source.itemId, count }
  } else if (event.action === 'move') {
    if (!indexValid(event.from) || !indexValid(event.to)) throw new Error('背包格子无效。')
    if (event.from === event.to || !slots[event.from]) return current
    const source = slots[event.from], target = slots[event.to]
    if (target?.itemId === source.itemId) {
      const count = Math.min(source.count, itemCatalog[source.itemId].maxStack - target.count)
      target.count += count; source.count -= count
      if (source.count === 0) slots[event.from] = null
    } else { slots[event.to] = source; slots[event.from] = target }
  } else if (event.action === 'add') {
    if (!Object.hasOwn(itemCatalog,event.itemId) || !Number.isInteger(event.count) || event.count <= 0) throw new Error('物品无效。')
    if (inventoryWeight(current) + itemCatalog[event.itemId].weight * event.count > INVENTORY.maxWeight + 0.00001) throw new Error('背包负重已满。')
    let count = event.count
    for (let index = 0; index < slots.length && count; index += 1) {
      const stack = slots[index]
      if (stack?.itemId !== event.itemId) continue
      const amount = Math.min(count, itemCatalog[event.itemId].maxStack-stack.count)
      stack.count += amount; count -= amount
    }
    for (let index = 0; index < slots.length && count; index += 1) {
      if (slots[index]) continue
      const amount = Math.min(count,itemCatalog[event.itemId].maxStack)
      slots[index] = { itemId:event.itemId,count:amount }; count-=amount
    }
    if (count) throw new Error('背包没有足够空格。')
  } else throw new Error('未知背包操作。')
  const next = { version: 1, slots }
  if (!validInventory(next)) throw new Error('背包操作无效。')
  return next
}
