import { useEffect, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.js'
import { useWorldStore } from '../stores/useWorldStore.js'
import RadarHud from './map/RadarHud.jsx'
import WorldMap from './map/WorldMap.jsx'

const buttonClass = 'rounded-xl border border-white/15 bg-slate-800 px-5 py-3 text-sm font-medium transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300'

export default function GameOverlay() {
  const phase = useGameStore((state) => state.phase)
  const startGame = useGameStore((state) => state.startGame)
  const pauseGame = useGameStore((state) => state.pauseGame)
  const resumeGame = useGameStore((state) => state.resumeGame)
  const returnToMenu = useGameStore((state) => state.returnToMenu)
  const seed = useWorldStore((state) => state.seed)
  const error = useWorldStore((state) => state.error)
  const openWorld = useWorldStore((state) => state.openWorld)
  const [seedInput, setSeedInput] = useState(seed)
  useEffect(() => { setSeedInput(seed) }, [seed])
  const errorMessage = error && <p role="alert" className="rounded-xl bg-red-950 p-3 text-sm text-red-100">{error}</p>

  if (phase === 'playing' || phase === 'map') {
    return (
      <>
        <button type="button" className={`absolute left-4 top-4 ${buttonClass}`} onClick={pauseGame}>暂停</button>
        <RadarHud />
        {phase === 'map' && <WorldMap />}
        <p className="pointer-events-none absolute bottom-5 inset-x-4 text-center text-xs tracking-wide text-stone-200/60">WASD / 方向键移动 · 点击地面前往 · M 地图 · Esc 暂停</p>
        {error && <div className="absolute bottom-4 right-4 z-30 max-w-sm">{errorMessage}</div>}
      </>
    )
  }

  const isMenu = phase === 'menu'
  return (
    <section className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-6 backdrop-blur-sm" aria-label={isMenu ? '开始菜单' : '暂停菜单'}>
      <div className="my-auto w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
        <p className="text-xs font-semibold tracking-widest text-emerald-300">GAME001</p>
        <h1 className="mt-3 text-3xl font-semibold">{isMenu ? '灰桥镇 · 余生' : '游戏已暂停'}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">{isMenu ? '城镇已经沉寂。沿街寻找庇护，探索这片被遗弃的地方。' : '旅途暂歇。继续探索，或返回菜单切换世界。'}</p>
        <form className="mt-6 flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); if (isMenu) { if (openWorld(seedInput)) startGame() } else resumeGame() }}>
          {isMenu && <>
            <label htmlFor="world-seed" className="text-sm text-slate-300">世界种子</label>
            <input id="world-seed" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} maxLength={80} required className="rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" autoComplete="off" />
            <p className="text-xs leading-5 text-slate-500">新种子创建独立世界；已有种子继续原进度，不会覆盖其他世界。</p>
          </>}
          {errorMessage}
          <button type="submit" className={buttonClass}>{isMenu ? '进入世界' : '继续游戏'}</button>
          {!isMenu && <button type="button" className={buttonClass} onClick={returnToMenu}>返回主菜单</button>}
        </form>
      </div>
    </section>
  )
}
