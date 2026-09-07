const clamp = n => Math.max(0, Math.min(1, n))
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t) }
const bump = (value, center, width) => { const t = Math.max(0, 1 - Math.abs(value - center) / width); return t * t * (3 - 2 * t) }

export const ENVIRONMENT_ASSETS = [
  'nature.birch', 'nature.young-pine', 'nature.broadleaf', 'nature.dead-tree',
  'nature.thorn-bush', 'nature.mossy-boulder', 'nature.fern-clump', 'nature.dry-grass',
  'nature.gravel-patch', 'nature.gravel-patch:sparse', 'nature.gravel-patch:trail',
  'nature.gravel-patch:broken', 'nature.gravel-patch:compact', 'nature.gravel-patch:scattered',
  'nature.reeds', 'nature.flowers',
]

// 与区块归属无关的群落场：80m 决定树林/空地，23m 决定林内斑块。
function groveAt(terrain, x, z) {
  let grove = clamp(0.5 + terrain.noise(x, z, 80, 'groves-v2') * 0.7 + terrain.noise(x, z, 23, 'patches-v2') * 0.22)
  let roadsideGrove = 0
  const opening = terrain.plan?.opening
  if (opening?.clearanceVersion === 2) {
    const dx = x - opening.origin[0], dz = z - opening.origin[1]
    const u = dx * Math.cos(opening.yaw) - dz * Math.sin(opening.yaw)
    const v = dx * Math.sin(opening.yaw) + dz * Math.cos(opening.yaw)
    // 路两侧的疏林岛形成近景；平滑权重不会沿预留区边界截断。
    roadsideGrove = Math.max(
      Math.exp(-((u + 29) ** 2 / 220 + (v - 30) ** 2 / 700)),
      Math.exp(-((u - 30) ** 2 / 220 + (v - 76) ** 2 / 700)),
    )
    grove = Math.max(grove, roadsideGrove * 0.95)
  }
  return { grove, roadsideGrove }
}

export function sampleEnvironment(terrain, x, z, road = terrain.nearbyRoad(x, z)) {
  const ecology = terrain.ecology(x, z)
  const { grove, roadsideGrove } = groveAt(terrain, x, z)
  const edge = road.distance - road.width / 2
  const forest = Math.max(roadsideGrove * 0.9, ecology.biome === 'woodland' ? 1 : ecology.biome === 'wetland' ? 0.5 : ecology.biome === 'farmland' ? 0.16 : 0.35)
  const treeDensity = smooth((grove - 0.28) / 0.55) * forest * smooth((edge - 3) / 9)
  const coverDensity = clamp(0.22 + grove * 0.6 + bump(edge, 3.5, 3) * 0.25)
  return { grove, treeDensity, coverDensity, edge, biome: ecology.biome }
}

// 仅改变路缘之外的地面，开场整平与聚落整平在后续阶段覆盖它。
export function roadsideRelief(road) {
  if (!road.fade || road.junction || road.segment?.sidewalk) return 0
  const edge = road.distance - road.width / 2
  return road.fade * (-0.32 * bump(edge, 3.8, 2.1) + 0.45 * bump(edge, 8, 4))
}

export function environmentColor(terrain, x, z, natural, road) {
  const { grove } = groveAt(terrain, x, z)
  const edge = road.distance - road.width / 2
  const shade = 1 - grove * 0.13
  const shoulder = bump(edge, 1.6, 2) * road.fade
  const damp = bump(edge, 3.8, 2) * road.fade
  const dirt = [0.39, 0.36, 0.27], ditch = [0.22, 0.27, 0.19]
  return natural.map((value, i) => (value * shade * (1 - shoulder * 0.65) + dirt[i] * shoulder * 0.65) * (1 - damp * 0.45) + ditch[i] * damp * 0.45)
}
