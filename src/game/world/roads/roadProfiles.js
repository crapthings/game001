import { STREET_SCALE } from '../worldMetrics.js'

export const roadProfiles = {
  arterial: { name: '城市干道', width: STREET_SCALE.cityMainRoadWidth, markings: true },
  street: { name: '双向支路', width: STREET_SCALE.cityStreetWidth, markings: true },
  ring: { name: '外围环路', width: STREET_SCALE.cityRingRoadWidth, markings: true },
  regional: { name: '区域公路', width: STREET_SCALE.regionalRoadWidth, markings: true },
  service: { name: '后巷服务路', width: 4, markings: false },
}

export function defineRoad(id, points, type = 'street', options = {}) {
  const profile = roadProfiles[type]
  return { id, type, points, from: points[0], to: points.at(-1), width: profile.width, markings: profile.markings, ...options }
}
