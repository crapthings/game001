import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'

export function createOpeningRoadblock(scene, block, height) {
  const root = new TransformNode('opening-roadblock', scene)
  root.position.set(block.position[0], height, block.position[1])
  root.rotation.y = block.yaw
  const concrete = new StandardMaterial('roadblock-concrete', scene)
  concrete.diffuseColor = Color3.FromHexString('#77796d')
  concrete.specularColor = Color3.Black()
  const stripe = new StandardMaterial('roadblock-faded-marking', scene)
  stripe.diffuseColor = Color3.FromHexString('#b4a267')
  stripe.specularColor = Color3.Black()
  for (let index = 0; index < 3; index++) {
    const x = (index - 1) * block.width / 3
    const base = MeshBuilder.CreateBox('abandoned-concrete-barrier', { width: block.width / 3 - 0.08, height: 1.15, depth: block.depth }, scene)
    base.parent = root; base.position.set(x, 0.575, 0); base.material = concrete; base.isPickable = false
    const marking = MeshBuilder.CreateBox('weathered-barrier-stripe', { width: block.width / 3 - 0.2, height: 0.14, depth: 0.025 }, scene)
    marking.parent = root; marking.position.set(x, 0.85, -block.depth / 2 - 0.015); marking.material = stripe; marking.isPickable = false
  }
  return { root, dispose() { root.dispose(); concrete.dispose(); stripe.dispose() } }
}
