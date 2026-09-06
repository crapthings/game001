import { defineRoad, roadProfiles } from '../../world/roads/roadProfiles.js'
import { roundRoadPath } from '../../world/roads/roadGeometry.js'

const through = { fadeStart: false, fadeEnd: false }
const road = (id, points, type = 'street', options = through) => defineRoad(id, points, type, options)
const circle = Array.from({ length: 49 }, (_,i) => [Math.cos(i*Math.PI/24)*11, Math.sin(i*Math.PI/24)*11])
const definitions = [
  ...Object.entries(roadProfiles).map(([type,profile]) => ({
    id: type, name: `${profile.name} · ${profile.width}m`,
    roads: [road(type,[[-24,0],[24,0]],type)],
  })),
  { id: 'cross', name: '十字路口', roads: [road('ew',[[-24,0],[24,0]],'arterial'),road('ns',[[0,-24],[0,24]])] },
  { id: 'tee', name: 'T 字路口', roads: [road('ew',[[-24,0],[24,0]]),road('branch',[[0,-24],[0,0]])] },
  { id: 'curve', name: '圆角弯道', roads: [road('curve',roundRoadPath([[-24,-16],[16,-16],[16,24]],16))] },
  { id: 'roundabout', name: '小型环岛', roads: [
    road('circle',circle,'street',{ closed: true }),
    road('west',[[-26,0],[-11,0]]),road('east',[[11,0],[26,0]]),
    road('south',[[0,-26],[0,-11]]),road('north',[[0,11],[0,26]]),
  ] },
  { id: 'fade-end', name: '自然渐隐末端', roads: [road('end',[[-24,0],[24,0]],'service',{ fadeStart: false, fadeEnd: true })] },
]

export const roadAssetCatalog = definitions.map(({ id,name,roads }) => ({
  assetId: `road.${id}`, name, category: 'road', zones: ['city','roadside'], tags: ['road',id],
  size: { width: 60, depth: 60, height: 0.03 }, roads,
}))
