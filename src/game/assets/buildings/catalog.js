import { createRandom } from '../../world/generation/random.js'
import { extendedBuildingCatalog } from './extendedCatalog.js'

// 10 个可重复使用的逻辑资产。modelSeed 固定外观，世界 seed 只决定它们如何布置。
const recipes = [
  ['house', '独栋住宅', 'residential', 9, 10, 1, 'gable'],
  ['townhouse', '联排住宅', 'residential', 10, 9, 2, 'flat'],
  ['apartments', '公寓楼', 'residential', 12, 11, 3, 'flat'],
  ['corner-store', '便利店', 'commercial', 11, 9, 1, 'flat'],
  ['diner', '路边餐馆', 'commercial', 12, 9, 1, 'flat'],
  ['clinic', '社区诊所', 'civic', 11, 11, 2, 'flat'],
  ['police', '警务站', 'civic', 11, 10, 2, 'flat'],
  ['workshop', '汽车修理厂', 'industrial', 12, 12, 1, 'gable'],
  ['warehouse', '物流仓库', 'industrial', 13, 13, 1, 'gable'],
  ['gas-station', '加油站', 'commercial', 13, 15, 1, 'canopy'],
]
const palettes = ['#88857a', '#aaa594', '#8a9292', '#9b8a78', '#999a8c']
export const BUILDING_CATALOG_VERSION = 1
export const buildingCatalog = recipes.map(([id, name, category, width, depth, floors, roof], index) => {
  const modelSeed = `outbreak-building-v1:${id}`
  const random = createRandom(modelSeed)
  return {
    id, assetId: `building.${id}`, name, category, modelSeed, revision: 1,
    width, depth, floors, roof,
    floorHeight: category === 'industrial' ? 4.6 : 3.1,
    palette: palettes[Math.floor(random() * palettes.length)],
    accent: ['#625f4d', '#6c665c', '#6d7577', '#566652', '#97594b', '#6f8982', '#4d6174', '#876b45', '#696f70', '#8b4d43'][index],
    // 模型坐标：Y 向上，门朝 +Z，底部原点贴地。整栋实体碰撞，暂不进入室内。
    footprint: { width: width + 2, depth: depth + 3 },
    entrance: [0, 0, depth / 2 + 2],
    sockets: [{ id: 'entry', position: [0, 0, depth / 2 + 2], facing: [0, 0, 1] }],
  }
})
buildingCatalog.push(...extendedBuildingCatalog)
const byId = new Map(buildingCatalog.map((entry) => [entry.assetId, entry]))
export const getBuildingDefinition = (assetId) => byId.get(assetId)
