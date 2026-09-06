export const WORLD_SIZE = 2048
import { METERS_PER_UNIT } from './worldMetrics.js'

export const WORLD_UNIT = METERS_PER_UNIT
export const WORLD_BOUNDS = Object.freeze({ minX: -1024, maxX: 1024, minZ: -1024, maxZ: 1024 })
export const insideWorld = (bounds, x, z, margin = 0) => x >= bounds.minX + margin && x < bounds.maxX - margin && z >= bounds.minZ + margin && z < bounds.maxZ - margin
export const insideRegion = (region, x, z) => region.bounds
  ? insideWorld(region.bounds, x, z)
  : Math.hypot(x - region.center[0], z - region.center[1]) <= region.radius
