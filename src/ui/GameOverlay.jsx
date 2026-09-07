import OpeningOverlay from './OpeningOverlay.jsx'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/useGameStore.js'
import { useWorldStore } from '../stores/useWorldStore.js'
import RadarHud from './map/RadarHud.jsx'
import WorldMap from './map/WorldMap.jsx'
import PlayerStatusHud from './PlayerStatusHud.jsx'
import WorldTimeHud from './WorldTimeHud.jsx'
import InventoryPanel from './InventoryPanel.jsx'
import Quickbar from './Quickbar.jsx'
import DebugMenu from './DebugMenu.jsx'
import { useDebugStore } from '../stores/useDebugStore.js'

const buttonClass = 'rounded-xl border border-white/15 bg-slate-800 px-5 py-3 text-sm font-medium transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300'

export default function GameOverlay() {
  const navigate = useNavigate()
  const phase = useGameStore((state) => state.phase)
  const pauseReturnPhase = useGameStore(state => state.pauseReturnPhase)
  const resumeGame = useGameStore((state) => state.resumeGame)
  const returnToMenu = useGameStore((state) => state.returnToMenu)
  const error = useWorldStore((state) => state.error)
  const debugActive = useDebugStore(state => state.infiniteGrenades || state.infiniteAmmo || state.revealMap || state.infiniteSprint || state.sprintMultiplier !== 1 || state.pauseSpawning || state.showSpawns)
  const errorMessage = error && <p role="alert" className="rounded-xl bg-red-950 p-3 text-sm text-red-100">{error}</p>

  if (phase === 'loading') return null
  if (phase === 'cinematic') return <OpeningOverlay />
  if (phase === 'debug') return <DebugMenu />
  if (phase === 'playing' || phase === 'map' || phase === 'inventory') {
    return (
      <>
        <RadarHud />
        <PlayerStatusHud />
        <WorldTimeHud />
        {phase === 'playing' && <button type="button" aria-label={`打开开发调试（F2）${debugActive ? '，调试已启用' : ''}`} title="开发调试 · F2" onClick={() => useGameStore.getState().openDebug()} className={`absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border bg-[radial-gradient(circle_at_35%_25%,#34483e,#101916_75%)] font-mono text-xs font-semibold shadow-lg transition hover:brightness-125 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 ${debugActive ? 'border-amber-200/50 text-amber-200' : 'border-white/20 text-emerald-100'}`}><span>F2</span>{debugActive && <span aria-hidden="true" className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border border-[#101916] bg-amber-300" />}</button>}
        {phase === 'map' && <WorldMap />}
        {phase === 'inventory' && <InventoryPanel />}
        {phase === 'playing' && <Quickbar />}

        {error && <div className="absolute bottom-4 right-4 z-30 max-w-sm">{errorMessage}</div>}
      </>
    )
  }

  return (
    <section className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-6 backdrop-blur-sm" aria-label="暂停菜单">
      <div className="my-auto w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
        <p className="text-xs font-semibold tracking-widest text-emerald-300">GAME001</p>
        <h1 className="mt-3 text-3xl font-semibold">游戏已暂停</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">旅途暂歇。继续探索，或返回菜单切换世界。</p>
        <div className="mt-6 flex flex-col gap-3">
          {errorMessage}
          <button type="button" className={buttonClass} onClick={resumeGame}>继续游戏</button>
          {pauseReturnPhase !== 'cinematic' && <button type="button" className={buttonClass} onClick={() => useGameStore.getState().openDebug()}>开发调试 · F2</button>}
          <button type="button" className={buttonClass} onClick={() => { returnToMenu(); navigate('/', { replace: true }) }}>返回主菜单</button>
        </div>
      </div>
    </section>
  )
}
