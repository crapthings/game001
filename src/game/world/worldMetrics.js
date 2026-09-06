// 唯一米制基准。Babylon 坐标、规划坐标和模型尺寸均按 1 unit = 1 meter。
export const METERS_PER_UNIT = 1

export const HUMAN_SCALE = Object.freeze({
  referenceHeight: 1.8,
  playerModelScale: 0.843,
  collisionRadius: 0.38,
  walkSpeed: 2.2,
  runSpeed: 5.5,
  doorWidth: 0.95,
  doorHeight: 2.1,
  seatHeight: 0.45,
})

export const STREET_SCALE = Object.freeze({
  villageRoadWidth: 7,
  cityStreetWidth: 7,
  cityMainRoadWidth: 11,
  cityRingRoadWidth: 8,
  regionalRoadWidth: 6,
  sidewalkWidth: 2,
})
