import { useEffect, useRef, useState } from 'react'
import { Engine } from '@babylonjs/core/Engines/engine'
import { createWorldScene } from '../game/scenes/createWorldScene.js'

export default function GameCanvas() {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let engine
    let resizeObserver

    try {
      const canvas = canvasRef.current
      engine = new Engine(canvas, true)
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2))
      const scene = createWorldScene(engine, canvas)
      engine.runRenderLoop(() => scene.render())
      resizeObserver = new ResizeObserver(() => engine.resize())
      resizeObserver.observe(canvas)
    } catch (cause) {
      console.error('Unable to initialize Babylon scene:', cause)
      setError('3D 场景启动失败，请使用支持 WebGL 的浏览器并开启硬件加速。')
      resizeObserver?.disconnect()
      engine?.dispose()
      return
    }

    return () => {
      resizeObserver?.disconnect()
      engine.dispose()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="block h-full w-full outline-none" aria-label="45 度俯视游戏场景，使用 WASD 或点击地面移动" />
      {error && <p role="alert" className="absolute inset-x-6 top-1/2 rounded-xl bg-red-950 p-4 text-red-100">{error}</p>}
    </>
  )
}
