import { generateWorld } from '../world/generation/generateWorld.js'

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ plan: generateWorld(data.seed) })
  } catch (error) {
    self.postMessage({ error: error.message || '规划生成失败' })
  }
}
