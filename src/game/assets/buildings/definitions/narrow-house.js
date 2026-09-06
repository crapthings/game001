// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'narrow-house', assetId: 'building.narrow-house', name: '窄面深进住宅', category: 'residential', style: 'house',
  width: 6, depth: 18, floors: 2, floorHeight: 3.1, roof: 'gable',
  modelSeed: 'building-v2:narrow-house', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 8, depth: 21 }, entrance: [0,0,11],
  sockets: [{ id: 'entry', position: [0,0,11], facing: [0,0,1] }],
  zones: ['city','village'], tags: ['residential'],
}
