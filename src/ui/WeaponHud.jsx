import { useDebugStore } from '../stores/useDebugStore.js'
import { useCombatStore } from '../stores/useCombatStore.js'
import { weapons } from '../game/combat/weapons.js'
export default function WeaponHud() {
  const state = useCombatStore()
  const infiniteAmmo = useDebugStore(state => state.infiniteAmmo)
  return <section className="absolute bottom-24 right-4 rounded-xl border border-white/15 bg-black/75 p-3 text-xs text-stone-200">
    <div className="mb-2 flex gap-2">{Object.entries(weapons).map(([id,w]) => <button key={id} onClick={() => state.select(id)} className={`rounded px-2 py-1 ${state.selected === id ? 'bg-emerald-800 text-white' : 'bg-white/10'}`}>{w.name}</button>)}</div>
    <p>{infiniteAmmo ? `${weapons[state.selected].name} · ∞ 无限子弹` : state.reloading ? '换弹中…' : `${weapons[state.selected].name} · ${state.loaded} / ${state.reserve}`}</p>
    <p className="mt-2 text-stone-400">WASD 移动 · 鼠标转向 · 前方目标自动射击</p>
    <p className="mt-1 text-stone-400">{infiniteAmmo ? '无需换弹' : '空弹匣自动换弹 · R 提前换弹'}</p>
    <p className="mt-1 text-amber-200">{state.accuracy != null ? `上次射击精度 ${state.accuracy}%` : '移动和远距离会降低精度'}{state.result ? ` · ${state.result}` : ''}</p>
  </section>
}
