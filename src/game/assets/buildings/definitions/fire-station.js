// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'fire-station', assetId: 'building.fire-station', name: '消防站', category: 'civic', style: 'fire-station',
  width: 18, depth: 12, floors: 1, floorHeight: 4.8, roof: 'flat',
  modelSeed: 'building-v2:fire-station', revision: 1, palette: '#92988b', accent: '#895346',
  footprint: { width: 20, depth: 15 }, entrance: [0,0,8],
  sockets: [{ id: 'entry', position: [0,0,8], facing: [0,0,1] }],
  zones: ['city'], tags: ['civic', 'landmark'],
}
