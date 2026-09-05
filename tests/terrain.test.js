import test from 'node:test'
import assert from 'node:assert/strict'
import { createTerrain, generateChunk, chunkAt, requiredChunks, CHUNK_SEGMENTS } from '../src/game/world/chunks/terrain.js'
import { createProgress, applyProgress } from '../src/game/world/progress.js'
import { generateWorld } from '../src/game/world/generation/generateWorld.js'

test('区块可在卸载后按同 seed 重建，生成顺序不会改变内容', () => {
  const terrain = createTerrain('stream-world')
  const first = generateChunk(terrain, -2, 3)
  generateChunk(terrain, 80, -15)
  assert.deepEqual(first, generateChunk(createTerrain('stream-world'), -2, 3))
  assert.notDeepEqual(first.positions, generateChunk(createTerrain('other'), -2, 3).positions)
})

test('东西及南北区块共边顶点和颜色完全一致，包括负坐标', () => {
  const terrain = createTerrain('seams')
  const a = generateChunk(terrain, -1, -1), east = generateChunk(terrain, 0, -1), south = generateChunk(terrain, -1, 0)
  const width = CHUNK_SEGMENTS + 1
  for (let index = 0; index < width; index += 1) {
    for (const field of ['positions', 'colors']) {
      const count = field === 'positions' ? 3 : 4
      assert.deepEqual(a[field].slice((index * width + width - 1) * count, (index * width + width) * count), east[field].slice(index * width * count, (index * width + 1) * count))
      assert.deepEqual(a[field].slice(((width - 1) * width + index) * count, ((width - 1) * width + index + 1) * count), south[field].slice(index * count, (index + 1) * count))
    }
  }
})

test('分块支持负坐标、固定邻域数量并优先生成脚下', () => {
  assert.deepEqual(chunkAt(-0.1, -32.1), { x: -1, z: -2 })
  for (const x of [-10000, -1, 0, 50, 10000]) {
    const needed = requiredChunks({ x, z: x })
    assert.equal(needed.length, 25)
    assert.equal(needed[0].key, `${x},${x}`)
  }
})

test('位置检查点不改变世界或探索记录，拒绝无效坐标', () => {
  const world = generateWorld('position')
  const original = createProgress()
  const progress = applyProgress(world, original, { type: 'checkpoint', position: [-35, 108] })
  assert.deepEqual(progress.playerPosition, [-35, 108])
  assert.deepEqual(progress.discoveredRegionIds, original.discoveredRegionIds)
  assert.equal(original.playerPosition, null)
  assert.throws(() => applyProgress(world, original, { type: 'checkpoint', position: [NaN, 0] }))
})

test('地面三角形朝向遵循 Babylon 左手坐标系，角色采样与三角面一致', () => {
  const terrain = createTerrain('walk-surface')
  const chunk = generateChunk(terrain, 0, 0)
  const [ai, bi, ci] = chunk.indices
  const point = (index) => chunk.positions.slice(index * 3, index * 3 + 3)
  const [a, b, c] = [ai, bi, ci].map(point)
  const crossY = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2])
  assert.ok(crossY < 0)
  assert.equal(terrain.surfaceHeight(0, 0), terrain.height(0, 0))
  assert.ok(Math.abs(terrain.surfaceHeight(1, 1) - (a[1] * 0.5 + b[1] * 0.25 + c[1] * 0.25)) < 1e-10)
})
