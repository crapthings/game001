import { useEffect } from 'react'
import GameCanvas from './components/GameCanvas.jsx'
import GameOverlay from './ui/GameOverlay.jsx'
import { useGameStore } from './stores/useGameStore.js'
import { useWorldStore } from './stores/useWorldStore.js'

export default function App() {
  useEffect(() => {
    useWorldStore.getState().initialize()
    const onKeyDown = (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName) || event.target?.isContentEditable) return
      const state = useGameStore.getState()
      if (event.code === 'KeyM') {
        if (state.phase === 'playing' || state.phase === 'map') {
          event.preventDefault()
          if (state.phase === 'map') state.closeMap()
          else state.openMap()
        }
      } else if (event.code === 'Escape') {
        event.preventDefault()
        if (state.phase === 'map') state.closeMap()
        else if (state.phase === 'playing') state.pauseGame()
        else if (state.phase === 'paused') state.resumeGame()
      }
    }
    const onVisibilityChange = () => {
      if (document.hidden) useGameStore.getState().pauseGame()
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <main className="relative h-dvh min-h-96 overflow-hidden">
      <GameCanvas />
      <GameOverlay />
    </main>
  )
}
