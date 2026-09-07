import { overlapsBounds } from '../opening/openingGeometry.js'

export const PLANNING_LEVELS = [2, 4, 8, 16, 32]

export function planningCell(level, column, row) {
  const size = 2048 / level
  return { id: `grid-${level}/${row}/${column}`, parentId: level === 2 ? null : `grid-${level / 2}/${Math.floor(row / 2)}/${Math.floor(column / 2)}`,
    bounds: { minX: -1024 + column * size, maxX: -1024 + (column + 1) * size, minZ: -1024 + row * size, maxZ: -1024 + (row + 1) * size } }
}

export function createPlanningGrid(opening) {
  const cells = []
  for (const level of PLANNING_LEVELS) {
    const size = 2048 / level, b = opening.bounds
    for (let row = Math.max(0, Math.floor((b.minZ + 1024) / size)); row < Math.min(level, Math.ceil((b.maxZ + 1024) / size)); row++) {
      for (let column = Math.max(0, Math.floor((b.minX + 1024) / size)); column < Math.min(level, Math.ceil((b.maxX + 1024) / size)); column++) {
        const cell = planningCell(level, column, row)
        if (overlapsBounds(cell.bounds, b)) cells.push({ ...cell, level, sceneIds: [opening.id] })
      }
    }
  }
  return { version: 1, levels: [...PLANNING_LEVELS], cells }
}
