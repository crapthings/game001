import { propCatalog } from '../props/catalog.js'
import { natureCatalog } from '../nature/catalog.js'

// 简单部件配方：尺寸、位置、材质；同一模块可被预制组合和生态散布重复引用。
const box = (size, position, color, rotation = [0, 0, 0]) => ({ shape: 'box', size, position, color, rotation })
const cylinder = (size, position, color, rotation = [0, 0, 0]) => ({ shape: 'cylinder', size, position, color, rotation })
const sphere = (size, position, color) => ({ shape: 'sphere', size, position, color })
const C = { wood: '#78654a', rust: '#79563e', metal: '#646f6c', dark: '#303b38', leaf: '#4c6241', concrete: '#929084' }

export const environmentCatalog = {
  ...propCatalog,
  ...natureCatalog,
  'nature.broadleaf': { radius: 0.55, parts: [cylinder([0.55, 3.4, 0.4], [0, 1.7, 0], C.wood), sphere([3.8, 3, 3.4], [0, 4.1, 0], C.leaf), sphere([2.4, 2.3, 2.4], [1.2, 3.5, 0.4], '#63784b')] },
  'nature.dead-tree': { radius: 0.4, parts: [cylinder([0.5, 4.5, 0.15], [0, 2.25, 0], '#6d6856'), cylinder([0.18, 1.8, 0.04], [0.6, 3.2, 0], C.wood, [0, 0, -0.7]), cylinder([0.16, 1.4, 0.03], [-0.5, 2.7, 0.15], C.wood, [0, 0, 0.7])] },
  'nature.bush': { radius: 0, parts: [sphere([1.4, 0.9, 1.2], [0, 0.45, 0], C.leaf), sphere([0.8, 0.7, 0.9], [0.6, 0.35, 0.3], '#6a754b')] },
  'nature.reeds': { radius: 0, parts: Array.from({ length: 7 }, (_, i) => cylinder([0.06, 0.9 + i * 0.12, 0.025], [(i % 3 - 1) * 0.22, (0.9 + i * 0.12) / 2, (Math.floor(i / 3) - 1) * 0.2], '#7e8858')) },
  'nature.flowers': { radius: 0, parts: Array.from({ length: 4 }, (_, i) => sphere([0.16, 0.12, 0.16], [(i % 2) * 0.4, 0.25, Math.floor(i / 2) * 0.35], '#b7ae73')) },
  'nature.log-pile': { footprint: { width: 2.4, depth: 1.2 }, parts: [cylinder([0.4, 2.2, 0.4], [0, 0.25, -0.25], C.wood, [0, 0, Math.PI / 2]), cylinder([0.4, 2.2, 0.4], [0, 0.25, 0.25], C.wood, [0, 0, Math.PI / 2]), cylinder([0.4, 2.2, 0.4], [0, 0.6, 0], C.wood, [0, 0, Math.PI / 2])] },
  'rural.fence': { footprint: { width: 4.1, depth: 0.25 }, sockets: [[-2, 0, 0], [2, 0, 0]], parts: [box([0.16, 1.3, 0.18], [-2, 0.65, 0], C.wood), box([0.16, 1.3, 0.18], [2, 0.65, 0], C.wood), box([4, 0.14, 0.12], [0, 0.5, 0], C.wood), box([4, 0.14, 0.12], [0, 1, 0], C.wood)] },
  'rural.hay-bale': { radius: 0.7, parts: [cylinder([1.35, 1.4, 1.35], [0, 0.68, 0], '#a18d53', [Math.PI / 2, 0, 0]), box([0.05, 1.2, 1.45], [0, 0.68, 0], '#655b3a')] },
  'rural.crop-bed': { radius: 0, parts: [box([3, 0.08, 4], [0, 0.04, 0], '#5e513b'), ...Array.from({ length: 5 }, (_, i) => box([0.2, 0.24, 3.7], [-1.2 + i * 0.6, 0.17, 0], '#747746'))] },
  'urban.lamp': { radius: 0.2, parts: [cylinder([0.2, 5, 0.12], [0, 2.5, 0], C.metal), box([1.3, 0.12, 0.14], [0.55, 5, 0], C.metal), box([0.65, 0.18, 0.35], [1, 4.95, 0], '#b7b491')] },
  'urban.bench': { footprint: { width: 2.1, depth: 0.7 }, parts: [box([2, 0.1, 0.55], [0, 0.4, 0], C.wood), box([2, 0.46, 0.1], [0, 0.68, -0.23], C.wood), box([0.1, 0.37, 0.46], [-0.8, 0.185, 0], C.metal), box([0.1, 0.37, 0.46], [0.8, 0.185, 0], C.metal)] },
  'urban.dumpster': { footprint: { width: 1.7, depth: 1.2 }, parts: [box([1.6, 1.2, 1.1], [0, 0.7, 0], '#57634f'), box([1.7, 0.12, 1.2], [0, 1.36, 0], C.dark), box([0.22, 0.2, 0.22], [-0.6, 0.1, 0.4], C.dark), box([0.22, 0.2, 0.22], [0.6, 0.1, 0.4], C.dark)] },
  'urban.barrier': { footprint: { width: 2.8, depth: 0.75 }, parts: [box([2.8, 0.25, 0.75], [0, 0.125, 0], C.concrete), box([2.8, 0.65, 0.35], [0, 0.55, 0], C.concrete), box([1, 0.18, 0.37], [0, 0.7, 0], '#9e8a54')] },
  'industry.crate': { footprint: { width: 1.2, depth: 1.2 }, parts: [box([1.2, 1.2, 1.2], [0, 0.6, 0], C.wood), box([0.12, 1.25, 1.24], [-0.4, 0.6, 0], '#4e483a'), box([0.12, 1.25, 1.24], [0.4, 0.6, 0], '#4e483a')] },
  'industry.barrel': { radius: 0.4, parts: [cylinder([0.7, 1, 0.7], [0, 0.5, 0], C.rust), cylinder([0.73, 0.08, 0.73], [0, 0.2, 0], C.metal), cylinder([0.73, 0.08, 0.73], [0, 0.8, 0], C.metal)] },
  'industry.container': { footprint: { width: 6, depth: 2.5 }, parts: [box([6, 2.5, 2.5], [0, 1.25, 0], '#687678'), ...Array.from({ length: 12 }, (_, i) => box([0.07, 2.4, 2.55], [-2.8 + i * 0.5, 1.25, 0], '#515c5d')), box([5.8, 0.12, 2.65], [0, 2.5, 0], C.rust)] },
  'industry.generator': { footprint: { width: 1.8, depth: 1 }, parts: [box([1.8, 0.15, 1], [0, 0.15, 0], C.dark), box([1.4, 0.9, 0.85], [0, 0.68, 0], '#96844f'), cylinder([0.09, 0.65, 0.09], [0.5, 1.35, -0.25], C.rust), ...Array.from({ length: 5 }, (_, i) => box([0.07, 0.5, 0.88], [-0.5 + i * 0.16, 0.65, 0], C.dark))] },
  'industry.water-tank': { radius: 1.4, parts: [cylinder([2.7, 3.3, 2.7], [0, 1.85, 0], C.metal), cylinder([2.85, 0.12, 2.85], [0, 3.5, 0], C.dark), cylinder([0.2, 1, 0.2], [0.7, 3.9, 0], C.rust)] },
  'industry.scrap': { radius: 0.6, parts: [box([1.7, 0.2, 0.7], [0, 0.2, 0], C.rust, [0.1, 0.3, 0.1]), box([0.7, 0.7, 0.8], [0.4, 0.45, 0.1], C.metal, [0, 0.4, 0.2])] },
}
// 组合只引用已有模块，放置与碰撞均展开为稳定的子对象 ID。
export const environmentAssemblies = {
  'yard.worksite': [
    { assetId: 'industry.generator', offset: [-2, 0, 0] },
    { assetId: 'industry.crate', offset: [1, 0, -1] },
    { assetId: 'industry.barrel', offset: [2, 0, 1] },
  ],
  'yard.farm': [
    { assetId: 'rural.hay-bale', offset: [-2, 0, 0] },
    { assetId: 'rural.fence', offset: [0, 0, -3] },
    { assetId: 'rural.crop-bed', offset: [2, 0, 1] },
  ],
  'yard.rest-stop': [
    { assetId: 'urban.bench', offset: [0, 0, 0] },
    { assetId: 'urban.lamp', offset: [-2, 0, 0] },
    { assetId: 'urban.dumpster', offset: [2, 0, -1] },
  ],
}
export function expandAssembly(id, assemblyId, position, rotation = 0) {
  return environmentAssemblies[assemblyId].map((part, index) => ({
    id: `${id}/${index}`, assetId: part.assetId,
    position: [Math.round(position[0] + part.offset[0] * Math.cos(rotation) + part.offset[2] * Math.sin(rotation)), position[1] + part.offset[1], Math.round(position[2] - part.offset[0] * Math.sin(rotation) + part.offset[2] * Math.cos(rotation))],
    rotation, scale: 1,
  }))
}
