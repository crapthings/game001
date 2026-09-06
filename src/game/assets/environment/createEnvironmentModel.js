import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'

export function createEnvironmentModel(scene, id, definition, material) {
  const groups = new Map()
  definition.parts.forEach((part, index) => {
    const name = `${id}/${index}`
    let mesh
    if (part.shape === 'cylinder') mesh = MeshBuilder.CreateCylinder(name, { diameterBottom: part.size[0], height: part.size[1], diameterTop: part.size[2], tessellation: 6 }, scene)
    else if (part.shape === 'sphere') {
      mesh = MeshBuilder.CreateSphere(name, { diameter: 1, segments: 2 }, scene)
      mesh.scaling.set(...part.size)
    } else mesh = MeshBuilder.CreateBox(name, { width: part.size[0], height: part.size[1], depth: part.size[2] }, scene)
    mesh.position.set(...part.position)
    if (part.rotation) mesh.rotation.set(...part.rotation)
    mesh.material = material(part.color)
    if (!groups.has(mesh.material)) groups.set(mesh.material, [])
    groups.get(mesh.material).push(mesh)
  })
  const merged = [...groups.values()].map((parts) => Mesh.MergeMeshes(parts, true, true))
  return Mesh.MergeMeshes(merged, true, true, undefined, false, true)
}
