// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'deep-workshop', assetId: 'building.deep-workshop', name: '纵深维修仓', category: 'industrial', style: 'warehouse',
  width: 8, depth: 24, floors: 1, floorHeight: 4.6, roof: 'gable',
  modelSeed: 'building-v2:deep-workshop', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 10, depth: 27 }, entrance: [0,0,14],
  sockets: [{ id: 'entry', position: [0,0,14], facing: [0,0,1] }],
  zones: ['city','industrial'], tags: ['industrial'],
}
