import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import '@babylonjs/core/Meshes/instancedMesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { getBuildingDefinition } from './buildings/catalog.js'
import { createBuildingModel } from './buildings/createBuildingModel.js'
import { getVillageBuildingDefinition } from './village/catalog.js'
import { createVillageBuildingModel } from './village/createVillageBuildingModel.js'
import { environmentCatalog } from './environment/catalog.js'
import { createEnvironmentModel } from './environment/createEnvironmentModel.js'

// 外观仅由 assetId 解析。未来替换工厂或 glTF 模型，不改变布局、对象 ID、进度。
export function createAssetRegistry(scene) {
  const templates = new Map()
  const materials = new Map()
  function material(color) {
    if (!materials.has(color)) {
      const result = new StandardMaterial(`asset:${color}`, scene)
      result.diffuseColor = Color3.FromHexString(color)
      result.specularColor = Color3.Black()
      materials.set(color, result)
    }
    return materials.get(color)
  }
  function template(assetId) {
    if (templates.has(assetId)) return templates.get(assetId)
    let mesh
    const building = getBuildingDefinition(assetId)
    const village = getVillageBuildingDefinition(assetId)
    if (village) {
      mesh = createVillageBuildingModel(scene, village, material)
    } else if (building) {
      mesh = createBuildingModel(scene, building, material)
    } else if (environmentCatalog[assetId]) {
      mesh = createEnvironmentModel(scene, assetId, environmentCatalog[assetId], material)
    } else if (assetId === 'nature.tree') {
      const trunk = MeshBuilder.CreateCylinder('trunk', { height: 3, diameter: 0.6, tessellation: 5 }, scene)
      trunk.position.y = 1.5
      trunk.material = material('#826448')
      const crown = MeshBuilder.CreateCylinder('crown', { height: 5, diameterBottom: 3.2, diameterTop: 0, tessellation: 6 }, scene)
      crown.position.y = 4
      crown.material = material('#315a48')
      mesh = Mesh.MergeMeshes([trunk, crown], true, true, undefined, false, true)
    } else if (assetId === 'nature.rock') {
      mesh = MeshBuilder.CreateSphere(assetId, { diameter: 2, segments: 2 }, scene)
      mesh.scaling.set(1.2, 0.7, 0.9)
      mesh.position.y = 0.5
      mesh.bakeCurrentTransformIntoVertices()
      mesh.material = material('#b5b2a0')
    } else {
      // 地标当前均为规划代理，颜色区分逻辑资产，未知资产也有可见占位。
      const colors = { 'landmark.camp': '#e5bd73', 'landmark.ruins': '#a0b8b7', 'landmark.lookout': '#df9268' }
      mesh = MeshBuilder.CreateCylinder(assetId, { height: 4, diameterBottom: 3, diameterTop: 1.8, tessellation: 6 }, scene)
      mesh.position.y = 2
      mesh.bakeCurrentTransformIntoVertices()
      mesh.material = material(colors[assetId] || '#e37dd2')
    }
    mesh.name = `template:${assetId}`
    mesh.isVisible = false
    mesh.isPickable = false
    templates.set(assetId, mesh)
    return mesh
  }
  return {
    prepare: (assetId) => template(assetId),
    create(placement, parent, regionId) {
      const instance = template(placement.assetId).createInstance(placement.id)
      instance.isVisible = true
      instance.isPickable = false
      instance.parent = parent
      instance.position.set(...placement.position)
      instance.rotation.y = placement.rotation
      instance.scaling.setAll(placement.scale)
      instance.metadata = { objectId: placement.id, regionId, assetId: placement.assetId }
      return instance
    },
    dispose() {
      for (const mesh of templates.values()) {
        if (mesh.material?.subMaterials) mesh.material.dispose()
        mesh.dispose()
      }
      for (const entry of materials.values()) entry.dispose()
      templates.clear()
      materials.clear()
    },
  }
}
