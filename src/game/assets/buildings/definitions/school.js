// 本体尺寸，非实例拉伸；未来变体在本文件扩展。
export default {
  id: 'school', assetId: 'building.school', name: '社区学校', category: 'civic', style: 'school',
  width: 30, depth: 10, floors: 2, floorHeight: 3.1, roof: 'flat',
  modelSeed: 'building-v2:school', revision: 1, palette: '#92988b', accent: '#637268',
  footprint: { width: 32, depth: 13 }, entrance: [0,0,7],
  sockets: [{ id: 'entry', position: [0,0,7], facing: [0,0,1] }],
  zones: ['city'], tags: ['civic', 'landmark'],
}
