// 旧开场快照没有路障锚点时，按停车点派生；不修改已保存的世界布局。
export function openingRoadblock(opening) {
  return opening.roadblock || {
    position: [opening.parking.position[0] + Math.sin(opening.yaw) * 12, opening.parking.position[1] + Math.cos(opening.yaw) * 12],
    yaw: opening.yaw, width: 9, depth: 1.2,
  }
}
