// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'garden-house', assetId: 'building.garden-house', name: '横向庭院住宅', category: 'residential', style: 'house',
  width: 18, depth: 9, floors: 1, floorHeight: 3.1, roof: 'gable',
  modelSeed: 'building-v2:garden-house', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 20, depth: 12 }, entrance: [0,0,6.5],
  sockets: [{ id: 'entry', position: [0,0,6.5], facing: [0,0,1] }],
  zones: ['city','village'], tags: ['residential'],
}
