// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'market-hall', assetId: 'building.market-hall', name: '沿街商铺排屋', category: 'commercial', style: 'corner-store',
  width: 24, depth: 8, floors: 1, floorHeight: 3.1, roof: 'flat',
  modelSeed: 'building-v2:market-hall', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 26, depth: 11 }, entrance: [0,0,6],
  sockets: [{ id: 'entry', position: [0,0,6], facing: [0,0,1] }],
  zones: ['city'], tags: ['commercial'],
}
