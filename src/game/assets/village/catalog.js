// 村庄建筑独立命名；稳定 ID 可直接换成正式美术模型。
const recipes = [
  ['brick-home', '红砖自建房', 'residential', 9, 9, 1, '#886b57', '#625c53', 'porch'],
  ['plaster-home', '旧灰墙平房', 'residential', 10, 8, 1, '#a29c87', '#64675d', 'cistern'],
  ['farmhouse', '农家庭院主屋', 'residential', 11, 10, 1, '#91846b', '#6e6550', 'farm'],
  ['balcony-home', '两层阳台民居', 'residential', 10, 9, 2, '#96978a', '#59645f', 'balcony'],
  ['provision-store', '乡村杂货铺', 'commercial', 10, 8, 1, '#8d927b', '#667c70', 'store'],
  ['health-post', '村卫生室', 'civic', 9, 9, 1, '#b0ac97', '#708581', 'clinic'],
  ['pump-house', '供水泵房', 'utility', 8, 8, 1, '#7f8a86', '#6b7372', 'water'],
  ['machine-shop', '农机维修站', 'industrial', 12, 11, 1, '#8e8878', '#805d48', 'repair'],
  ['grain-depot', '粮食收购仓', 'industrial', 13, 12, 1, '#9a8b70', '#6b6051', 'grain'],
  ['relay-office', '村务广播站', 'civic', 10, 9, 1, '#929788', '#68796b', 'radio'],
]
export const villageBuildingCatalog = recipes.map(([id, name, category, width, depth, floors, palette, accent, feature]) => ({
  id: `village.${id}`, assetId: `building.village.${id}`, name, category,
  modelSeed: `village-building-v1:${id}`, revision: 1, width, depth, floors,
  floorHeight: category === 'industrial' ? 4 : 3, palette, accent, feature,
  footprint: { width: width + 2, depth: depth + 4 },
  entrance: [0, 0, depth / 2 + 2],
  sockets: [{ id: 'entry', position: [0, 0, depth / 2 + 2], facing: [0, 0, 1] }, { id: 'yard', position: [0, 0, -depth / 2 - 2], facing: [0, 0, -1] }],
}))
const byId = new Map(villageBuildingCatalog.map((entry) => [entry.assetId, entry]))
export const getVillageBuildingDefinition = (assetId) => byId.get(assetId)
