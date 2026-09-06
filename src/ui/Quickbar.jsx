import { useEffect, useRef, useState } from 'react'
import { useWorldStore } from '../stores/useWorldStore.js'
import { useGameStore } from '../stores/useGameStore.js'
import { createInventory } from '../game/inventory/inventory.js'
import { itemCatalog } from '../game/inventory/items.js'

const initial = createInventory()
export default function Quickbar() {
  const bag = useWorldStore(state => state.document?.progress.inventory) ?? initial
  const [selected,setSelected] = useState(null)
  const [message,setMessage] = useState('')
  const busy = useRef(false)
  const useSlot = async (index) => {
    if (useGameStore.getState().phase !== 'playing' || busy.current) return
    setSelected(index)
    const current = useWorldStore.getState().document?.progress.inventory ?? initial
    const stack = current.slots[index]
    if (!stack) { setMessage('空快捷格 · 在背包前 10 格放入物品'); return }
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
      useSlot(digit === 0 ? 9 : digit-1)
    }
    window.addEventListener('keydown',onKey)
    return () => window.removeEventListener('keydown',onKey)
  }, [])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''),3000)
    return () => clearTimeout(timer)
  }, [message])
  return <aside aria-label="快捷栏" className="absolute bottom-4 left-1/2 z-10 w-[calc(100%_-_24px)] max-w-[460px] -translate-x-1/2">
    <p role="status" className="mb-2 min-h-4 text-center text-[10px] text-stone-200">{message}</p>
    <div className="grid grid-cols-10 gap-1 rounded-xl border border-white/15 bg-stone-950/85 p-1.5 shadow-xl">
      {bag.slots.slice(0,10).map((stack,index) => {
        const item = stack && itemCatalog[stack.itemId]
        return <button type="button" key={index} aria-label={`${(index+1)%10}：${item ? `${item.name} ${stack.count} 件，使用` : '空格'}`} onClick={() => useSlot(index)} className={`relative flex h-12 min-w-0 items-center justify-center rounded-md border text-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-300 ${selected === index ? 'border-emerald-300 bg-emerald-950' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
          <span className="absolute left-1 top-0.5 text-[9px] text-stone-500">{(index+1)%10}</span>
          <span className="text-sm">{item?.symbol}</span>
          {stack && <span className="absolute bottom-0.5 right-1 text-[9px] text-stone-300">{stack.count}</span>}
        </button>
      })}
    </div>
  </aside>
}
