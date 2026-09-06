import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { CHUNK_SIZE } from '../chunks/terrain.js'
import { createRandom } from '../generation/random.js'

import { ROAD_RESOLUTION } from '../chunks/generateRoadPixels.js'

const RESOLUTION = ROAD_RESOLUTION

export function createStreetSection(scene, parent, chunk, data, seed) {
  const pixels = data.roadPixels
  if (!pixels) return
  const x0 = chunk.x * CHUNK_SIZE, z0 = chunk.z * CHUNK_SIZE, pixelSize = CHUNK_SIZE / RESOLUTION
  const texture = new DynamicTexture(`road:${chunk.key}`, { width: RESOLUTION, height: RESOLUTION }, scene, true, Texture.TRILINEAR_SAMPLINGMODE)
  texture.hasAlpha = true
  texture.wrapU = Texture.CLAMP_ADDRESSMODE; texture.wrapV = Texture.CLAMP_ADDRESSMODE
  const ctx = texture.getContext(), image = ctx.createImageData(RESOLUTION, RESOLUTION)
  image.data.set(pixels); ctx.putImageData(image, 0, 0)
  // 裂缝以世界 8m 单元为种子，跨区块重复绘制同一条曲线后裁切。
  ctx.globalCompositeOperation = 'source-atop'
  const screen = (x, z) => [(x - x0) / pixelSize, (z - z0) / pixelSize]
  for (let gz = Math.floor(z0 / 8) - 1; gz <= Math.floor((z0 + CHUNK_SIZE) / 8) + 1; gz += 1) {
    for (let gx = Math.floor(x0 / 8) - 1; gx <= Math.floor((x0 + CHUNK_SIZE) / 8) + 1; gx += 1) {
      const random = createRandom(seed, 'road-wear-v2', gx, gz)
      let x = gx * 8 + random() * 8, z = gz * 8 + random() * 8
      const points = [[x, z]], angle = random() * Math.PI * 2
      for (let step = 0; step < 5; step += 1) {
        x += Math.cos(angle + (random() - 0.5)) * 0.65
        z += Math.sin(angle + (random() - 0.5)) * 0.65
        points.push([x, z])
      }
      for (const [color, width] of [['rgba(130,117,85,0.45)', 0.17], ['rgba(18,29,24,0.75)', 0.065]]) {
        ctx.strokeStyle = color; ctx.lineWidth = width / pixelSize
        ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...screen(...p)) : ctx.moveTo(...screen(...p))); ctx.stroke()
      }
      if (random() < 0.4) {
        ctx.fillStyle = 'rgba(19,29,24,0.55)'
        ctx.beginPath(); ctx.ellipse(...screen(x, z), (0.25 + random() * 0.5) / pixelSize, 0.25 / pixelSize, angle, 0, Math.PI * 2); ctx.fill()
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over'
  texture.update(false)
  const material = new StandardMaterial(`road:${chunk.key}`, scene)
  material.diffuseTexture = texture; material.useAlphaFromDiffuseTexture = true
  material.transparencyMode = 2
  material.diffuseColor = Color3.White(); material.specularColor = Color3.Black()
  material.zOffset = -1
  const mesh = new Mesh(`road:${chunk.key}`, scene), vertices = new VertexData()
  vertices.positions = data.positions.map((value, index) => index % 3 === 1 ? value + 0.025 : value)
  vertices.indices = data.indices
  vertices.uvs = []; vertices.normals = []
  for (let index = 0; index < data.positions.length; index += 3) {
    vertices.uvs.push((data.positions[index] - x0) / CHUNK_SIZE, (data.positions[index + 2] - z0) / CHUNK_SIZE)
    vertices.normals.push(0, 1, 0)
  }
  vertices.applyToMesh(mesh)
  mesh.material = material; mesh.parent = parent; mesh.isPickable = false; mesh.receiveShadows = true
  parent.onDisposeObservable.add(() => { material.dispose(); texture.dispose() })
}
