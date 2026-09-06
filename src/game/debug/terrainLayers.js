export const terrainLayers = {
  ecology: { label: '连续生态', legend: '32 m 采样 · 混合生态颜色' },
  regions: { label: '区域用途', legend: '管理区域用途，与自然地形边界独立' },
  height: { label: '原始高度', legend: '深蓝 −10 m → 绿 10 m → 棕 30 m → 白 45 m' },
  slope: { label: '原始坡度', legend: '绿 0° → 黄 6° → 红 12°及以上' },
  moisture: { label: '湿度', legend: '沙色 0 → 蓝色 1；不表示实际水面' },
  suitability: { label: '建设适宜度', legend: '红 0 → 黄 0.5 → 绿 1；单点指标，聚落另检查连通面积与高差' },
}
const ramps = {
  height: [[-10, [38, 65, 92]], [10, [102, 135, 91]], [30, [159, 132, 96]], [45, [226, 223, 205]]],
  slope: [[0, [63, 133, 91]], [6, [215, 181, 87]], [12, [182, 70, 59]]],
  moisture: [[0, [167, 143, 97]], [1, [49, 111, 156]]],
  suitability: [[0, [157, 68, 59]], [0.5, [208, 173, 85]], [1, [64, 148, 106]]],
}
export function terrainColor(layer, sample) {
  const stops = ramps[layer], value = sample[layer]
  let color = stops.at(-1)[1]
  if (value <= stops[0][0]) color = stops[0][1]
  else for (let i = 1; i < stops.length; i++) {
    if (value > stops[i][0]) continue
    const [low, a] = stops[i - 1], [high, b] = stops[i], t = (value - low) / (high - low)
    color = a.map((channel, index) => Math.round(channel + (b[index] - channel) * t))
    break
  }
  return `rgb(${color.join(',')})`
}
