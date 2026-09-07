import { createPlanningGrid } from '../generation/planningGrid.js'

const point = value => Array.isArray(value) && value.length === 2 && value.every(n => Number.isFinite(n) && Math.abs(n) < 1024)
const bounds = b => b && ['minX', 'maxX', 'minZ', 'maxZ'].every(key => Number.isFinite(b[key])) && b.minX < b.maxX && b.minZ < b.maxZ && b.minX >= -1024 && b.maxX <= 1024 && b.minZ >= -1024 && b.maxZ <= 1024
const contains = (b, p) => point(p) && p[0] >= b.minX && p[0] <= b.maxX && p[1] >= b.minZ && p[1] <= b.maxZ

export function validateOpening(world) {
  const o = world.opening
  if (!o || o.version !== 1 || o.templateId !== 'roadside-arrival' || ![1, 2].includes(o.templateVersion) || !/^opening\/(north|east|south|west)\/[0-7]$/.test(o.id) || !['north', 'east', 'south', 'west'].includes(o.edge) || !Number.isFinite(o.yaw) || !point(o.origin) || !bounds(o.bounds)) throw new Error('开场场景版本或边界无效。')
  if (![o.entry, o.playerExit, o.connectionPortal, o.parking?.position].every(p => contains(o.bounds, p)) || !bounds(o.parking?.bounds) || !Number.isFinite(o.parking?.yaw) || !Array.isArray(o.approachPath) || o.approachPath.length !== 3 || !o.approachPath.every(p => contains(o.bounds, p))) throw new Error('开场锚点或路径无效。')
  if (o.templateVersion === 1 && !contains(o.bounds, o.npcAnchor)) throw new Error('旧版开场锚点无效。')
  if (o.templateVersion === 2 && (o.story !== 'out-of-fuel' || !contains(o.bounds, o.roadblock?.position) || o.roadblock.width !== 9 || o.roadblock.depth !== 1.2 || o.roadblock.yaw !== o.yaw)) throw new Error('开场路障无效。')
  const g = o.grading
  if (!bounds(g?.core) || !Number.isFinite(g?.elevation) || g.blend !== 8 || g.core.minX - g.blend < o.bounds.minX || g.core.maxX + g.blend > o.bounds.maxX || g.core.minZ - g.blend < o.bounds.minZ || g.core.maxZ + g.blend > o.bounds.maxZ) throw new Error('开场整地范围无效。')
  if (!bounds(o.preloadBounds) || !Array.isArray(o.reservations) || o.reservations.length !== 1 || !o.reservations.every(r => bounds(r.bounds) && Array.isArray(r.purposes) && ['placement', 'infected', 'camera'].every(p => r.purposes.includes(p)))) throw new Error('开场预留范围无效。')
  if (!Array.isArray(o.shots) || o.shots.length !== 2 || !['arrival', 'dialogue'].every(id => o.shots.some(s => s.id === id)) || !o.shots.every(s => typeof s.id === 'string' && Array.isArray(s.position) && s.position.length === 3 && s.position.every(Number.isFinite) && ['parking', 'npcAnchor', 'playerExit'].includes(s.target))) throw new Error('开场镜头锚点无效。')
  if (!point(world.spawn) || world.spawn.some((n, i) => n !== o.playerExit[i]) || !world.roads?.some(r => r.id === o.connection?.roadId) || !world.settlements?.some(t => t.id === o.connection?.settlementId) || o.connection?.vehicleValidated !== false) throw new Error('开场连接或出生点无效。')
  if (o.validation?.version !== 1 || o.validation.status !== 'passed' || !Number.isFinite(o.validation.maxGrade) || o.validation.maxGrade < 0 || o.validation.maxGrade > 0.02 || o.validation.scope !== (o.templateVersion === 2 ? 'arrival-only' : 'approach-only') || !Number.isFinite(o.validation.parkingGrade) || o.validation.parkingGrade < 0 || o.validation.parkingGrade > 0.02) throw new Error('开场路面检查记录无效。')
  if (!Number.isInteger(o.selection?.attempts) || o.selection.attempts < 1 || o.selection.attempts > 4 || o.selection.candidateCount !== 32) throw new Error('开场候选记录无效。')
  if (JSON.stringify(world.planningGrid) !== JSON.stringify(createPlanningGrid(o))) throw new Error('开场分层引用无效。')
}
