import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'

// 开场脚本车辆：局部 +Z 为车头；最终车型可替换此模型，保留根节点接口。
export function createOpeningVehicle(scene) {
  const root = new TransformNode('opening-vehicle', scene)
  const materials = []
  const material = (name, color) => {
    const value = new StandardMaterial(`vehicle-${name}`, scene)
    value.diffuseColor = Color3.FromHexString(color)
    value.specularColor = Color3.Black()
    materials.push(value)
    return value
  }
  const paint = material('paint', '#687967'), rubber = material('rubber', '#202626')
  const glass = material('glass', '#354d56'), steel = material('steel', '#8b9189')
  const lamps = material('lamps', '#dfd6a6')
  function box(name, size, position, mat) {
    const mesh = MeshBuilder.CreateBox(`vehicle-${name}`, { width: size[0], height: size[1], depth: size[2] }, scene)
    mesh.parent = root; mesh.position.set(...position); mesh.material = mat; mesh.isPickable = false
    return mesh
  }
  box('body', [1.9, 0.65, 4.2], [0, 0.9, 0], paint)
  box('cabin', [1.7, 0.8, 2], [0, 1.6, -0.1], glass)
  box('roof', [1.85, 0.12, 2.1], [0, 2.03, -0.1], paint)
  box('hood', [1.85, 0.15, 1.1], [0, 1.3, 1.48], paint)
  for (const side of [-1, 1]) {
    box(`door-${side}`, [0.08, 0.55, 1.8], [side * 0.88, 1.35, -0.1], paint)
    box(`lamp-${side}`, [0.43, 0.21, 0.08], [side * 0.63, 1, 2.13], lamps)
  }
  box('bumper', [2, 0.2, 0.12], [0, 0.65, 2.14], steel)
  const wheels = []
  for (const side of [-1, 1]) for (const z of [-1.35, 1.35]) {
    const wheel = MeshBuilder.CreateCylinder('vehicle-wheel', { diameter: 0.8, height: 0.28, tessellation: 12 }, scene)
    wheel.parent = root; wheel.position.set(side * 0.97, 0.4, z); wheel.rotation.z = Math.PI / 2
    wheel.material = rubber; wheel.isPickable = false; wheels.push(wheel)
  }
  return { root, roll: distance => wheels.forEach(wheel => { wheel.rotation.x += distance / 0.4 }),
    dispose() { root.dispose(); materials.forEach(value => value.dispose()) },
  }
}
