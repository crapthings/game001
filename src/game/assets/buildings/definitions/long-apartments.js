// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'long-apartments', assetId: 'building.long-apartments', name: '板式公寓', category: 'residential', style: 'apartments',
  width: 24, depth: 12, floors: 3, floorHeight: 3.1, roof: 'flat',
  modelSeed: 'building-v2:long-apartments', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 26, depth: 15 }, entrance: [0,0,8],
  sockets: [{ id: 'entry', position: [0,0,8], facing: [0,0,1] }],
  zones: ['city'], tags: ['residential'],
}
