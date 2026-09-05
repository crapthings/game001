import { useGameStore } from '../../stores/useGameStore.js'
import { useWorldStore } from '../../stores/useWorldStore.js'
import { useNavigationStore } from '../../stores/useNavigationStore.js'
import MapCanvas from './MapCanvas.jsx'

export default function RadarHud() {
  const navigation = useNavigationStore()
  const plan = useWorldStore((state) => state.document?.world)
  const openMap = useGameStore((state) => state.openMap)
  if (!plan) return null
  const { position } = navigation
  return (
    <aside aria-label="导航雷达" className="absolute right-3 top-3 w-36 rounded-2xl border border-stone-400/20 bg-stone-950/85 p-2 shadow-xl sm:right-5 sm:top-5 sm:w-44">
      <button type="button" onClick={openMap} title="打开地图（M）" className="block aspect-square w-full overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-emerald-300" aria-label="打开地图（M）">
        <MapCanvas center={{ x: position.x, z: position.z }} span={112} navigation={navigation} plan={plan} radar />
      </button>
      <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-emerald-100/90">
        <span>X {position.x.toFixed(1)}</span><span>Z {position.z.toFixed(1)}</span>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-stone-400"><span>高度 {position.y.toFixed(1)} m</span><span>M 地图</span></div>
    </aside>
  )
}
