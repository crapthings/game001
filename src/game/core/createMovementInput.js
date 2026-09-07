import { screenDirection } from './screenDirection.js'
const sprintKeys = new Set(['ShiftLeft', 'ShiftRight'])
const controls = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

export function createMovementInput(isPlaying) {
  const keys = new Set()
  const clear = () => { keys.clear() }
  const onDown = (event) => {
    if (!isPlaying() || (!controls.has(event.code) && !sprintKeys.has(event.code)) || event.ctrlKey || event.metaKey || event.altKey || event.target?.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return
    event.preventDefault()
    keys.add(event.code)
  }
  const onUp = (event) => keys.delete(event.code)
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', clear)
  return {
    clear,
    wantsSprint: () => keys.has('ShiftLeft') || keys.has('ShiftRight'),
    direction(beta) {
      const horizontal = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'))
      const vertical = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'))
      if (horizontal || vertical) {
        return screenDirection(horizontal,vertical,beta)
      }
      return { x: 0, z: 0 }
    },
    dispose() {
      clear()
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', clear)
    },
  }
}
