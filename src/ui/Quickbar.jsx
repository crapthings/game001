import { useCombatStore } from '../stores/useCombatStore.js'
import { useDebugStore } from '../stores/useDebugStore.js'
import { weapons } from '../game/combat/weapons.js'
import WeaponIcon from './WeaponIcon.jsx'
import { useEffect, useRef, useState } from 'react'
import { useWorldStore } from '../stores/useWorldStore.js'
import { useGameStore } from '../stores/useGameStore.js'
import { createInventory } from '../game/inventory/inventory.js'
import { itemCatalog } from '../game/inventory/items.js'

const initial = createInventory()
const weaponIds=['pistol','shotgun','rifle','machinegun']
export default function Quickbar() {
  const combat=useCombatStore()
  const infiniteAmmo=useDebugStore(state=>state.infiniteAmmo)
  const infiniteGrenades=useDebugStore(state=>state.infiniteGrenades)
  const bag = useWorldStore(state => state.document?.progress.inventory) ?? initial
  const [selected,setSelected] = useState(null)
  const [message,setMessage] = useState('')
  const busy = useRef(false)
  const useSlot = async (index) => {
    if (useGameStore.getState().phase !== 'playing' || busy.current) return
    setSelected(index)
    const current = useWorldStore.getState().document?.progress.inventory ?? initial
    const stack = current.slots[index]
    if (!stack) { setMessage('空快捷格 · 在背包前 6 格放入物品'); return }
    if (!itemCatalog[stack.itemId].effects) { setMessage('该物品暂时无法使用'); return }
    busy.current = true
    try {
      const saved = await useWorldStore.getState().dispatch({ type: 'consume', index })
      setMessage(saved ? `已使用${itemCatalog[stack.itemId].name}` : useWorldStore.getState().error || '使用失败')
    } finally { busy.current = false }
  }
  useEffect(() => {
    const onKey = event => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target?.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return
      if (!/^Digit[0-9]$/.test(event.code) || useGameStore.getState().phase !== 'playing') return
      event.preventDefault()
      const digit = Number(event.code.at(-1))
      if(digit>=1 && digit<=4) { useCombatStore.getState().select(weaponIds[digit-1]);setSelected(null);setMessage('');return }
      useSlot(digit === 0 ? 5 : digit-5)
    }
    window.addEventListener('keydown',onKey)
    return () => window.removeEventListener('keydown',onKey)
  }, [])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''),3000)
    return () => clearTimeout(timer)
  }, [message])
  return <aside aria-label="快捷栏" className="absolute bottom-4 left-1/2 z-10 w-[calc(100%_-_24px)] max-w-[560px] -translate-x-1/2">
    <p role="status" className="mb-2 min-h-4 text-center text-[10px] text-stone-200">{message || (combat.reloading && !infiniteAmmo ? '换弹中…' : combat.result || '')}</p>
    <div className="flex items-center gap-2">
      <div title="G：向准星投掷手雷" aria-label={`手雷，G 投掷，${infiniteGrenades ? '无限' : combat.grenades ?? 3}`} className="pointer-events-none relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-stone-950/85 p-2 text-emerald-200">
        <span className="absolute left-1 top-0.5 text-[9px] text-stone-400">G</span>
        <WeaponIcon kind="grenade"/>
        <span className="absolute bottom-0.5 right-1 text-[9px]">{infiniteGrenades ? '∞' : combat.grenades ?? 3}</span>
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-10 gap-1 rounded-xl border border-white/15 bg-stone-950/85 p-1.5 shadow-xl">
        {weaponIds.map((id,index)=><button type="button" key={id} title={`${index+1}：${weapons[id].name}`} aria-label={`${index+1}：${weapons[id].name}`} aria-pressed={combat.selected===id} onClick={()=>{combat.select(id);setSelected(null);setMessage('')}} className={`relative flex h-12 min-w-0 items-center justify-center rounded-md border px-1 text-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-300 ${combat.selected===id?'border-emerald-300 bg-emerald-950':'border-white/10 bg-white/5 hover:bg-white/10'}`}>
          <span className="absolute left-1 top-0.5 text-[9px] text-stone-400">{index+1}</span>
          <WeaponIcon kind={id}/>
          {combat.selected===id && <span className="absolute bottom-0.5 right-1 text-[9px]">{infiniteAmmo?'∞':combat.reloading?'…':combat.loaded}</span>}
        </button>)}
        {bag.slots.slice(0,6).map((stack,index)=>{
          const item=stack && itemCatalog[stack.itemId],key=(index+5)%10
          return <button type="button" key={index} aria-label={`${key}：${item ? `${item.name} ${stack.count} 件，使用` : '空格'}`} onClick={()=>useSlot(index)} className={`relative flex h-12 min-w-0 items-center justify-center rounded-md border text-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-300 ${selected===index?'border-emerald-300 bg-emerald-950':'border-white/10 bg-white/5 hover:bg-white/10'}`}>
            <span className="absolute left-1 top-0.5 text-[9px] text-stone-500">{key}</span>
            <span className="text-sm">{item?.symbol}</span>
            {stack && <span className="absolute bottom-0.5 right-1 text-[9px] text-stone-300">{stack.count}</span>}
          </button>
        })}
      </div>
    </div>
    <p className="mt-1 min-h-3 text-center text-[10px] text-stone-400">{weapons[combat.selected].name} · {infiniteAmmo ? '∞' : `${combat.loaded} / ${combat.reserve}`} {!infiniteAmmo && ' · R 换弹'}</p>
  </aside>
}
