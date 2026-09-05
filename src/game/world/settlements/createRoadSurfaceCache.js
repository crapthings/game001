import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { createRandom } from '../generation/random.js'

export const ROAD_SEGMENT_LENGTH = 32
const TEXTURE_WIDTH = 512
const TEXTURE_HEIGHT = 256
const SURFACE_VERSION = 1

// 纯 Canvas 过程纹理：裂缝、坑洞、补丁和标线共用一张贴图，不为每条裂缝增加网格。
function paintSurface(ctx, seed, town, road, segment) {
  const random = createRandom(seed, town.id, road.id, segment, 'road-surface', SURFACE_VERSION)
  const width = TEXTURE_WIDTH, height = TEXTURE_HEIGHT
  const shoulder = 2, totalWidth = road.width + shoulder * 2
  const sx = width / ROAD_SEGMENT_LENGTH, sy = height / totalWidth
  const top = shoulder * sy, bottom = (shoulder + road.width) * sy
  const segmentStart = segment * ROAD_SEGMENT_LENGTH
  ctx.fillStyle = '#696b60'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#363d3c'
  ctx.fillRect(0, top, width, bottom - top)
  // 骨料颗粒与人行道斑驳；透明度保持低，避免远景高频闪烁。
  for (let index = 0; index < 9500; index += 1) {
    const x = random() * width, y = random() * height
    ctx.fillStyle = random() > 0.5 ? 'rgba(180,179,157,0.10)' : 'rgba(5,15,14,0.16)'
    ctx.fillRect(x, y, 0.6 + random() * 1.5, 0.6 + random() * 1.5)
  }
  ctx.save()
  ctx.beginPath(); ctx.rect(0, top + 1, width, bottom - top - 2); ctx.clip()
  // 老化补丁与油污轮廓。
  for (let index = 0; index < 9; index += 1) {
    const x = 15 + random() * (width - 30), y = top + 12 + random() * (bottom - top - 24)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((random() - 0.5) * 0.2)
    ctx.fillStyle = index % 3 ? 'rgba(24,31,30,0.3)' : 'rgba(108,108,87,0.18)'
    ctx.fillRect(-12, -8, 18 + random() * 45, 8 + random() * 24)
    ctx.restore()
  }
  // 同一条标线的随机缺口由全局 dash ID 决定，跨纹理段也能保持一致。
  const line = (worldX, length, y, dashId, edge = false) => {
    const rng = createRandom(seed, town.id, road.id, 'paint', dashId, y)
    const start = (worldX - segmentStart) * sx
    ctx.fillStyle = edge ? '#92917a' : '#b1a574'
    ctx.globalAlpha = 0.3 + rng() * 0.35
    ctx.fillRect(start, y - 1.2, length * sx, 2.4)
    ctx.globalAlpha = 1
    for (let chip = 0; chip < 12; chip += 1) {
      ctx.fillStyle = 'rgba(46,54,51,0.75)'
      ctx.fillRect(start + rng() * length * sx, y - 1.5, 0.6 + rng() * 3, 1 + rng() * 2)
    }
  }
  for (let x = Math.floor(segmentStart / 7) * 7; x < segmentStart + ROAD_SEGMENT_LENGTH; x += 7) line(x, 3, height / 2, x / 7)
  for (const y of [top + 0.35 * sy, bottom - 0.35 * sy]) {
    for (let x = Math.floor(segmentStart / 4) * 4; x < segmentStart + ROAD_SEGMENT_LENGTH; x += 4) line(x, 3.6, y, x / 4, true)
  }
  const crack = (points, thickness) => {
    for (const [color, extra] of [['rgba(137,127,99,0.42)', 1.7], ['#202a27', 0]]) {
      ctx.strokeStyle = color
      ctx.lineWidth = thickness + extra
      ctx.lineJoin = 'round'
      ctx.beginPath()
      points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
      ctx.stroke()
    }
  }
  for (let index = 0; index < 12; index += 1) {
    let x = 12 + random() * (width - 24), y = top + 10 + random() * (bottom - top - 20)
    const points = [[x, y]]
    const direction = random() * Math.PI * 2
    for (let step = 0; step < 5; step += 1) {
      const angle = direction + (random() - 0.5) * 1.4
      x = Math.max(4, Math.min(width - 4, x + Math.cos(angle) * (5 + random() * 12)))
      y += Math.sin(angle) * (5 + random() * 12)
      points.push([x, y])
    }
    crack(points, 0.7 + random() * 0.7)
    const fork = points[2]
    crack([fork, [fork[0] - 8, fork[1] + 8], [fork[0] - 16, fork[1] + 5]], 0.6)
  }
  // 不规则坑洞，亮破口和深色坑底提供俯视下的深度暗示。
  for (let index = 0; index < 3; index += 1) {
    const x = 24 + random() * (width - 48), y = top + 22 + random() * (bottom - top - 44)
    const rx = 8 + random() * 13, ry = 5 + random() * 9
    const outline = Array.from({ length: 9 }, (_, point) => {
      const angle = point / 9 * Math.PI * 2, r = 0.65 + random() * 0.35
      return [Math.cos(angle) * rx * r, Math.sin(angle) * ry * r]
    })
    for (const [factor, color, offset] of [[1.2, '#79745e', 0], [1, '#252b28', 0], [0.74, '#171f1e', 1]]) {
      ctx.fillStyle = color
      ctx.beginPath()
      outline.forEach(([px, py], point) => point ? ctx.lineTo(x + px * factor, y + py * factor + offset) : ctx.moveTo(x + px * factor, y + py * factor + offset))
      ctx.closePath(); ctx.fill()
    }
  }
  ctx.restore()
  // 人行道接缝按世界坐标对齐；路缘积土与苔藓。
  for (let worldX = Math.floor(segmentStart / 3) * 3; worldX < segmentStart + ROAD_SEGMENT_LENGTH; worldX += 3) {
    const x = (worldX - segmentStart) * sx
    ctx.strokeStyle = 'rgba(31,40,32,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, top); ctx.moveTo(x, bottom); ctx.lineTo(x, height); ctx.stroke()
  }
  for (const y of [top, bottom]) {
    ctx.fillStyle = '#444d3c'; ctx.fillRect(0, y - 1.2, width, 2.4)
    for (let index = 0; index < 150; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(90,101,57,0.5)' : 'rgba(72,66,44,0.4)'
      ctx.fillRect(random() * width, y + (random() - 0.5) * 9, random() * 6 + 1, random() * 3 + 1)
    }
  }
}

export function createRoadSurfaceCache(scene, seed) {
  const entries = new Map()
  return {
    acquire(town, road, segment) {
      const key = `${town.id}/${road.id}/${segment}`
      if (!entries.has(key)) {
        const texture = new DynamicTexture(`road-texture:${key}`, { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT }, scene, true, Texture.TRILINEAR_SAMPLINGMODE)
        texture.wrapU = Texture.CLAMP_ADDRESSMODE
        texture.wrapV = Texture.CLAMP_ADDRESSMODE
        texture.anisotropicFilteringLevel = 4
        paintSurface(texture.getContext(), seed, town, road, segment)
        texture.update()
        const material = new StandardMaterial(`road-material:${key}`, scene)
        material.diffuseTexture = texture
        material.diffuseColor = Color3.White()
        material.specularColor = Color3.Black()
        entries.set(key, { material, texture, references: 0 })
      }
      const entry = entries.get(key)
      entry.references += 1
      let released = false
      return {
        material: entry.material,
        release() {
          if (released) return
          released = true
          entry.references -= 1
          if (entry.references === 0 && entries.get(key) === entry) {
            entry.material.dispose()
            entry.texture.dispose()
            entries.delete(key)
          }
        },
      }
    },
    dispose() {
      for (const entry of entries.values()) { entry.material.dispose(); entry.texture.dispose() }
      entries.clear()
    },
  }
}
