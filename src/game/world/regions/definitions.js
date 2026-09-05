// 区域是人工规划的连续空间，seed 仅控制区域内部布置。ID 发布后不可改名复用。
export const regionDefinitions = [
  {
    id: 'arrival-meadow', revision: 1, name: '初见草甸', biome: 'meadow',
    center: [0, 0], radius: 20, color: '#658b69',
    description: '安全抵达区，预留营地与新手交互。',
    tags: ['起点', '营地'], connections: ['whisper-woods', 'sunstone-ridge'],
    landmarks: [{ id: 'camp', label: '营地预留点', offset: [0, 0], assetId: 'landmark.camp' }],
    scatter: [{ id: 'stones', assetId: 'nature.rock', count: 8 }],
  },
  {
    id: 'whisper-woods', revision: 1, name: '低语林地', biome: 'forest',
    center: [-46, 22], radius: 22, color: '#426f61',
    description: '林间探索区，预留采集与林中遗迹。',
    tags: ['森林', '采集'], connections: ['arrival-meadow'],
    landmarks: [{ id: 'ruins', label: '遗迹预留点', offset: [0, 0], assetId: 'landmark.ruins' }],
    scatter: [{ id: 'trees', assetId: 'nature.tree', count: 28 }, { id: 'stones', assetId: 'nature.rock', count: 8 }],
  },
  {
    id: 'sunstone-ridge', revision: 1, name: '日石高地', biome: 'highland',
    center: [44, 24], radius: 20, color: '#a18d65',
    description: '高地规划区，预留观景点与资源带。',
    tags: ['高地', '观景'], connections: ['arrival-meadow'],
    landmarks: [{ id: 'lookout', label: '观景预留点', offset: [0, 0], assetId: 'landmark.lookout' }],
    scatter: [{ id: 'stones', assetId: 'nature.rock', count: 20 }],
  },
]
