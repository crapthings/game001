import { useWorldTimeStore } from '../stores/useWorldTimeStore.js'

export default function WorldTimeHud() {
  const { time, period, daylight } = useWorldTimeStore()
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  return (
    <aside aria-label="世界时间" className="pointer-events-none absolute left-4 top-4 w-32 rounded-xl border border-stone-400/20 bg-stone-950/80 px-3 py-2 shadow-xl sm:left-5 sm:top-5">
      <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-stone-400">
        <span>{period}</span>
        <span aria-hidden="true" className={daylight > 0.45 ? 'text-amber-300' : 'text-sky-300'}>{daylight > 0.45 ? '●' : '◐'}</span>
      </div>
      <p className="mt-1 font-mono text-lg tabular-nums text-stone-100">{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</p>
    </aside>
  )
}
