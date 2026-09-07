import { useOpeningStore } from '../stores/useOpeningStore.js'
import { useGameStore } from '../stores/useGameStore.js'

const button = 'rounded-lg border border-white/20 bg-stone-900/90 px-5 py-2.5 text-sm text-stone-100 hover:bg-stone-800 disabled:opacity-40'

export default function OpeningOverlay() {
  const { stage, fade, line, busy, error, advance, skip } = useOpeningStore()
  const canAdvance = Boolean(line) && !busy && !error
  const advanceFromScreen = () => { if (canAdvance) advance?.() }
  return <section className={`absolute inset-0 z-30 ${canAdvance ? 'cursor-pointer' : ''}`} aria-label="公路抛锚" onClick={advanceFromScreen}>
    <button type="button" aria-label="点击画面继续独白" className="absolute inset-0 h-full w-full cursor-inherit border-0 bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-300" disabled={!canAdvance}/>
    <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: fade }}/>
    <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-black/80"/>
    <div className="absolute right-5 top-4 flex gap-2" onClick={event => event.stopPropagation()}>
      <button className={button} onClick={() => useGameStore.getState().pauseGame()}>暂停</button>
      <button className={button} onClick={skip} disabled={busy || Boolean(error)}>跳过开场</button>
    </div>
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-6 pb-8 pt-16">
      <div className="mx-auto max-w-2xl" aria-live="polite">
        {error ? <><p role="alert" className="mb-4 text-sm text-amber-200">{error}</p><button className={button} onClick={advance}>重试保存</button></> : line ? <>
          <p className="mb-3 text-xs tracking-widest text-emerald-300">{line.speaker}</p>
          <p className="text-lg leading-8 text-stone-100">{line.text}</p>
          <p className="mt-5 text-right text-xs text-stone-500">点击画面继续</p>
        </> : <p className="text-sm tracking-widest text-stone-300">{busy ? '正在准备…' : stage === 'arriving' ? '无人公路 · 滑行停车' : '旅途即将开始'}</p>}
      </div>
    </div>
  </section>
}
