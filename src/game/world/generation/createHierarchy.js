import { createRandom } from './random.js'

const palettes = {
  forest: ['woodland', 'woodland', 'meadow', 'scrubland'],
  lowland: ['wetland', 'wetland', 'meadow', 'woodland'],
  rural: ['farmland', 'farmland', 'meadow', 'woodland'],
  upland: ['scrubland', 'woodland', 'quarry', 'meadow'],
}

// 管理网格只定义归属；生态采样跨越网格，城市可覆盖多个细分单元。
export function createHierarchy(seed, regions) {
  const random = createRandom(seed, 'hierarchy-v1')
  const themes = Object.keys(palettes)
  for (let i = themes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[themes[i], themes[j]] = [themes[j], themes[i]]
  }
  const macros = themes.map((theme, index) => {
    const x = index % 2, z = Math.floor(index / 2)
    return { id: `macro-${z}-${x}`, theme, bounds: { minX: -1024 + x * 1024, maxX: x * 1024, minZ: -1024 + z * 1024, maxZ: z * 1024 } }
  })
  const cells = []
  for (let z = 0; z < 8; z++) for (let x = 0; x < 8; x++) {
    const macro = macros[Math.floor(z / 4) * 2 + Math.floor(x / 4)]
    const region = regions[Math.floor(z / 2) * 4 + Math.floor(x / 2)]
    const rng = createRandom(seed, 'detail-cell-v1', x, z)
    const pool = palettes[macro.theme]
    cells.push({ id: `cell-${z}-${x}`, parentId: region.id, macroId: macro.id,
      biome: pool[Math.floor(rng() * pool.length)],
      center: [-896 + x * 256 + (rng() - 0.5) * 100, -896 + z * 256 + (rng() - 0.5) * 100],
      bounds: { minX: -1024 + x * 256, maxX: -768 + x * 256, minZ: -1024 + z * 256, maxZ: -768 + z * 256 },
    })
  }
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i], x = i % 4, z = Math.floor(i / 4)
    region.parentId = macros[Math.floor(z / 2) * 2 + Math.floor(x / 2)].id
    region.cellIds = cells.filter(cell => cell.parentId === region.id).map(cell => cell.id)
  }
  return { version: 1, macros, cells, warpPhase: [random() * Math.PI * 2, random() * Math.PI * 2] }
}

export function ecologyWeights(hierarchy, x, z) {
  const [a, b] = hierarchy.warpPhase
  const wx = x + Math.sin(z / 190 + a) * 65 + Math.sin(x / 83 + b) * 18
  const wz = z + Math.sin(x / 210 + b) * 65 + Math.sin(z / 97 + a) * 18
  const weights = new Map()
  const column = Math.max(0, Math.min(7, Math.floor((wx + 1024) / 256)))
  const row = Math.max(0, Math.min(7, Math.floor((wz + 1024) / 256)))
  for (let iz = Math.max(0, row - 1); iz <= Math.min(7, row + 1); iz++) {
    for (let ix = Math.max(0, column - 1); ix <= Math.min(7, column + 1); ix++) {
      const cell = hierarchy.cells[iz * 8 + ix]
      const distance = Math.hypot(wx - cell.center[0], wz - cell.center[1])
      const weight = Math.max(0, 1 - distance / 300) ** 3
      weights.set(cell.biome, (weights.get(cell.biome) || 0) + weight)
    }
  }
  return weights
}
