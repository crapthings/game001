export function validOpeningProgress(value, world) {
  return Boolean(world.opening && value && value.version === 1 && value.id === world.opening.id && ['parked', 'complete'].includes(value.status))
}

export function applyOpeningProgress(world, progress, event) {
  const opening = { version: 1, id: event.id, status: event.status }
  if (!validOpeningProgress(opening, world)) throw new Error('开场进度无效。')
  if (progress.opening?.status === 'complete') return progress
  return { ...progress, opening, playerPosition: [...world.opening.playerExit] }
}
