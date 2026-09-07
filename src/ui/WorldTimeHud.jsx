import { useWorldTimeStore } from '../stores/useWorldTimeStore.js'

export default function WorldTimeHud() {
  const { time, period } = useWorldTimeStore()
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  const clock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  const night = period === '夜晚' || period === '深夜'
  const twilight = period === '黎明' || period === '黄昏'
  const accent = night ? '#a5c9ec' : twilight ? '#e7b38a' : '#e4ce96'

  return (
    <aside aria-label={`世界时间 ${clock}，${period}`} className="pointer-events-none absolute left-1/2 top-4 w-52 -translate-x-1/2 select-none sm:top-5 sm:w-60" style={{ color: accent }}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101916]/85 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center gap-4 px-5 py-3">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="h-6 w-6 shrink-0">
            {night ? <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" /> : twilight ? <><path d="M3 16h18M5 20h14M7 16a5 5 0 0 1 10 0M12 3v3M4 8l2 2M20 8l-2 2" /></> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>}
          </svg>
          <time className="font-mono text-2xl leading-none tracking-wider text-stone-100 tabular-nums" dateTime={clock}>{clock}</time>
          <span className="border-l border-white/15 pl-3 text-xs tracking-widest">{period}</span>
        </div>
        <div aria-hidden="true" className="relative mx-4 mb-3 h-1 rounded-full bg-[linear-gradient(to_right,#344760_0%,#344760_20%,#b89572_29%,#c4b784_50%,#b89572_71%,#344760_80%,#344760_100%)] opacity-80">
          {[0, 25, 50, 75, 100].map(position => <span key={position} className="absolute top-0 h-1 w-px bg-black/40" style={{ left: `${position}%` }} />)}
          <span className="absolute -top-0.5 h-2 w-2 -translate-x-1/2 rounded-full border border-[#101916] bg-current shadow-[0_0_6px_currentColor]" style={{ left: `${time / 24 * 100}%` }} />
        </div>
      </div>
    </aside>
  )
}
