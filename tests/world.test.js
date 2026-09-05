import test from 'node:test'
import assert from 'node:assert/strict'
import { generateWorld, appendNewRegions } from '../src/game/world/generation/generateWorld.js'
import { regionDefinitions } from '../src/game/world/regions/definitions.js'
import { createProgress, applyProgress } from '../src/game/world/progress.js'
import { createWorldRepository } from '../src/game/persistence/worldRepository.js'

function storage() {
  const data = new Map()
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}
const extraRegion = {
  id: 'eastern-coast', revision: 1, name: '东海岸', biome: 'coast', center: [105, 0], radius: 18,
  color: '#77aabb', description: '海岸预留区', tags: ['海岸'], connections: ['sunstone-ridge'],
  landmarks: [], scatter: [{ id: 'rocks', assetId: 'nature.rock', count: 5 }],
}

test('相同 seed 与版本产生相同规划，定义顺序无关，不同 seed 改变内部布局', () => {
  const first = generateWorld('alpha')
  assert.deepEqual(first, generateWorld(' alpha '))
  assert.deepEqual(first, generateWorld('alpha', [...regionDefinitions].reverse()))
  assert.notDeepEqual(first.regions[0].placements, generateWorld('beta').regions[0].placements)
  assert.deepEqual(first.regions.map((r) => r.center), generateWorld('beta').regions.map((r) => r.center))
  assert.throws(() => generateWorld('  '))
})

test('区域内对象 ID 唯一、在边界内并避开地标，增添区域不扰动已有规划', () => {
  const plan = generateWorld('geometry')
  const extended = generateWorld('geometry', [...regionDefinitions, extraRegion])
  for (const region of plan.regions) {
    assert.deepEqual(region, extended.regions.find((r) => r.id === region.id))
    assert.equal(new Set(region.placements.map((p) => p.id)).size, region.placements.length)
    for (const item of region.placements) {
      assert.ok(Math.hypot(item.position[0] - region.center[0], item.position[2] - region.center[1]) <= region.radius)
      if (!item.label) for (const landmark of region.placements.filter((p) => p.label)) {
        assert.ok(Math.hypot(item.position[0] - landmark.position[0], item.position[2] - landmark.position[2]) >= 6)
      }
    }
  }
  assert.throws(() => generateWorld('x', [...regionDefinitions, regionDefinitions[0]]))
  assert.throws(() => generateWorld('x', [...regionDefinitions, { ...extraRegion, center: [0, 0] }]))
})

test('显式扩展保存旧区域快照，即便当前定义发生变化', () => {
  const old = generateWorld('old-world')
  const definitions = structuredClone([...regionDefinitions, extraRegion])
  definitions[0].scatter[0].count = 40
  const expanded = appendNewRegions(old, definitions)
  assert.deepEqual(expanded.regions.slice(0, old.regions.length), old.regions)
  assert.equal(expanded.regions.at(-1).id, extraRegion.id)
  assert.equal(appendNewRegions(expanded, definitions), expanded)
})

test('进度独立、探索幂等、备注可移除，无效区域事件被拒绝', () => {
  const world = generateWorld('progress')
  const snapshot = JSON.stringify(world)
  let progress = applyProgress(world, createProgress(), { type: 'discover', regionId: 'arrival-meadow' })
  assert.equal(applyProgress(world, progress, { type: 'discover', regionId: 'arrival-meadow' }), progress)
  progress = applyProgress(world, progress, { type: 'annotate', regionId: 'arrival-meadow', text: '建桥' })
  assert.equal(progress.annotations['arrival-meadow'], '建桥')
  progress = applyProgress(world, progress, { type: 'annotate', regionId: 'arrival-meadow', text: '' })
  assert.equal(progress.annotations['arrival-meadow'], undefined)
  assert.throws(() => applyProgress(world, progress, { type: 'discover', regionId: 'missing' }))
  assert.equal(JSON.stringify(world), snapshot)
})

test('重新打开恢复 seed、规划和进度，各世界隔离，防止过期页面覆盖', () => {
  const memory = storage(), repo = createWorldRepository(memory)
  const first = repo.open('one')
  const stale = repo.open('one')
  const progress = applyProgress(first.world, first.progress, { type: 'annotate', regionId: 'arrival-meadow', text: '保存测试' })
  const saved = repo.save(first, progress)
  assert.deepEqual(repo.open('one'), saved)
  assert.equal(repo.open('two').progress.annotations['arrival-meadow'], undefined)
  assert.equal(repo.getActiveSeed(), 'two')
  assert.deepEqual(repo.open('one').progress, progress)
  assert.throws(() => repo.save(stale, stale.progress), /其他页面/)
  const extended = repo.extend(saved, [...regionDefinitions, extraRegion])
  assert.deepEqual(extended.progress, progress)
  assert.equal(repo.open('one').world.regions.length, 4)
})

test('损坏与未来版本存档不覆盖，存储写入失败可见', () => {
  const memory = storage(), repo = createWorldRepository(memory)
  memory.setItem('game001:world:broken', '{broken')
  assert.throws(() => repo.open('broken'))
  assert.equal(memory.getItem('game001:world:broken'), '{broken')
  const future = JSON.stringify({ schemaVersion: 999 })
  memory.setItem('game001:world:future', future)
  assert.throws(() => repo.open('future'), /不兼容/)
  assert.equal(memory.getItem('game001:world:future'), future)
  const brokenStorage = { getItem: () => null, setItem: () => { throw new Error('quota exceeded') } }
  assert.throws(() => createWorldRepository(brokenStorage).open('new'), /quota/)
})
