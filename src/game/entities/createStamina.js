import { HUMAN_SCALE } from '../world/worldMetrics.js'

// 探索节奏：满体力可跑 12.5 秒，耗尽后含冷却约 6.2 秒回满。
export const STAMINA = Object.freeze({ max: 100, walkSpeed: HUMAN_SCALE.walkSpeed, runSpeed: HUMAN_SCALE.runSpeed, drain: 8, recovery: 20, recoveryDelay: 1.2, resumeAt: 25 })

export function validStamina(value) {
  return value && Number.isFinite(value.current) && value.current >= 0 && value.current <= STAMINA.max && typeof value.exhausted === 'boolean' && Number.isFinite(value.delay) && value.delay >= 0 && value.delay <= STAMINA.recoveryDelay
}

// 逐帧数值留在运行时；HUD 低频读取，检查点保存恢复冷却与力竭状态。
export function createStamina(saved) {
  let current = saved?.current ?? STAMINA.max
  let exhausted = saved?.exhausted ?? false
  let delay = saved?.delay ?? 0
  let mode = 'idle'
  return {
    speed(wantsSprint) { return wantsSprint && !exhausted && current > 0 ? STAMINA.runSpeed : STAMINA.walkSpeed },
    update(dt, moving, wantsSprint) {
      const running = moving && wantsSprint && !exhausted && current > 0
      if (running) {
        current = Math.max(0, current - STAMINA.drain * dt)
        delay = STAMINA.recoveryDelay
        if (current === 0) exhausted = true
      } else {
        const recoveryTime = Math.max(0, dt - delay)
        delay = Math.max(0, delay - dt)
        current = Math.min(STAMINA.max, current + STAMINA.recovery * recoveryTime)
        if (exhausted && current >= STAMINA.resumeAt) exhausted = false
      }
      mode = exhausted ? 'exhausted' : running ? 'running' : current < STAMINA.max && delay === 0 ? 'recovering' : moving ? 'walking' : 'idle'
      return running
    },
    snapshot: () => ({ current, exhausted, delay }),
    hud: () => ({ current: Math.round(current), max: STAMINA.max, mode }),
  }
}
