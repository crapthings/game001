import { useFlashlightStore } from '../stores/useFlashlightStore.js'
import { useGameStore } from '../stores/useGameStore.js'

export default function FlashlightHud() {
  const { battery, enabled, toggle } = useFlashlightStore()
  const playing = useGameStore(state => state.phase === 'playing')
  return <button type="button" disabled={!playing || battery === 0} onClick={toggle} aria-pressed={enabled} aria-label={`手电${enabled?'开启':'关闭'}，电量 ${battery}%`} className="pointer-events-auto mt-3 block min-h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-default disabled:hover:bg-white/5">
    <span className={`flex justify-between text-[10px] ${battery <= 15 ? 'text-amber-300' : 'text-stone-300'}`}><span>手电 · F {enabled?'开':'关'}</span><span>{battery}%</span></span>
    <span className="mt-1.5 block h-1 overflow-hidden rounded bg-white/10"><span className={`block h-full ${battery<=15?'bg-amber-400':'bg-emerald-300'}`} style={{width:`${battery}%`}}/></span>
  </button>
}
