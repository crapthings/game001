// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'hospital', assetId: 'building.hospital', name: '区域医院', category: 'civic', style: 'hospital',
  width: 30, depth: 15, floors: 3, floorHeight: 3.1, roof: 'flat',
  modelSeed: 'building-v2:hospital', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 32, depth: 18 }, entrance: [0,0,9.5],
  sockets: [{ id: 'entry', position: [0,0,9.5], facing: [0,0,1] }],
  zones: ['city'], tags: ['civic', 'landmark'],
}
