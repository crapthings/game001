import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { compileRoadNetwork, sampleRoad } from '../../world/roads/roadGeometry.js'
import { generateRoadPixels } from '../../world/chunks/generateRoadPixels.js'
import { createStreetSection } from '../../world/settlements/createStreetSection.js'
import { CHUNK_SIZE } from '../../world/chunks/terrain.js'

// 与游戏复用覆盖采样、标线、破损纹理和路面工厂，仅预览地形为平面。
export function createRoadPreview(scene, definition) {
  const root = new TransformNode(`preview:${definition.assetId}`,scene)
  const network = compileRoadNetwork(definition.roads)
  const terrain = { hasRoads: () => true, nearbyRoad: (x,z) => sampleRoad(network,x,z) }
  for (const x of [-1,0]) for (const z of [-1,0]) {
    const chunk = { x,z,key: `preview:${x}:${z}` }
    const x0=x*CHUNK_SIZE,z0=z*CHUNK_SIZE
    createStreetSection(scene,root,chunk,{
      roadPixels: generateRoadPixels(chunk,terrain),
      positions: [x0,0,z0, x0+CHUNK_SIZE,0,z0, x0+CHUNK_SIZE,0,z0+CHUNK_SIZE, x0,0,z0+CHUNK_SIZE],
      // 与 terrain.js 的地面绕序一致，保证 Babylon 默认背面剔除下从上方可见。
      indices: [0,1,3,1,2,3],
    },'road-preview-v3')
  }
  return root
}
