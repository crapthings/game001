import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.js'
import { useWorldStore } from '../stores/useWorldStore.js'
import { itemCatalog } from '../game/inventory/items.js'
import { INVENTORY, createInventory, inventoryWeight } from '../game/inventory/inventory.js'

const buttonClass = 'rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/10 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-emerald-300'

export default function InventoryPanel() {
  const saved = useWorldStore(state => state.document?.progress.inventory)
  const dispatch = useWorldStore(state => state.dispatch)
  const close = useGameStore(state => state.closeInventory)
  const initial = useRef(null)
  if (!initial.current) initial.current = createInventory()
  const bag = saved ?? initial.current
  const [selected, setSelected] = useState(0)
  const [moving, setMoving] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const busy = useRef(false)
  const dialog = useRef(null)
  const closeButton = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    closeButton.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [])
  const stack = bag.slots[selected], item = stack && itemCatalog[stack.itemId]
  const weight = inventoryWeight(bag), used = bag.slots.filter(Boolean).length
  const act = async (action) => {
    if (busy.current) return
    busy.current = true; setPending(true); setMessage('正在保存…')
    try {
      const success = await dispatch({ type: 'inventory', ...action })
      setMessage(success ? '背包已保存' : '保存失败，物品保持原状，请重试。')
      if (success) setMoving(false)
    } finally { busy.current = false; setPending(false) }
  }
  const trapFocus = (event) => {
    if (event.key !== 'Tab') return
    const buttons = [...dialog.current.querySelectorAll('button:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement)
    event.preventDefault()
    buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
  }
  return <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="inventory-title" onKeyDown={trapFocus} className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-8">
    <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-stone-500/30 bg-[#111815] text-stone-200 shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div><p className="text-[10px] tracking-[0.24em] text-emerald-300/60">SURVIVOR EQUIPMENT</p><h1 id="inventory-title" className="mt-1 text-xl font-semibold">随身背包</h1></div>
        <button ref={closeButton} className={buttonClass} onClick={close}>关闭 · B / Esc</button>
      </header>
      <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4 text-xs"><span className="text-stone-400">格子 {used} / {INVENTORY.slots}</span><span className={weight >= 16 ? 'text-amber-300' : 'text-emerald-200'}>负重 {weight.toFixed(2)} / {INVENTORY.maxWeight} kg</span><button disabled={pending} className={buttonClass} onClick={() => act({ action: 'sort' })}>整理堆叠</button></div>
        <div className="mb-5 h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-emerald-400/70" style={{ width: `${weight / INVENTORY.maxWeight * 100}%` }} /></div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="mb-2 min-h-4 text-xs text-amber-200/80">{moving ? '选择目标格子：空格移动，同类合并，异类交换。' : '选择物品查看详情'}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {bag.slots.map((entry,index) => {
                const definition = entry && itemCatalog[entry.itemId]
                return <button key={index} type="button" disabled={pending} aria-pressed={selected === index} aria-label={`格子 ${index+1}：${definition ? `${definition.name}，${entry.count} 件` : '空'}${moving ? '，放置到此处' : ''}`} onClick={() => {
                  if (moving) act({ action: 'move', from: selected, to: index })
                  else setSelected(index)
                }} className={`relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border p-1 focus-visible:outline-2 focus-visible:outline-emerald-300 ${selected === index ? 'border-emerald-300/70 bg-emerald-900/35' : 'border-white/10 bg-black/20 hover:border-white/30'}`}>
                  <span className="absolute left-1.5 top-1 text-[9px] text-stone-600">{String(index+1).padStart(2,'0')}</span>
                  {definition && <><span className="text-xl text-emerald-200/80">{definition.symbol}</span><span className="mt-1 max-w-full truncate text-[9px] text-stone-400">{definition.name}</span><span className="absolute bottom-1 right-1.5 text-[10px] text-stone-200">{entry.count}</span></>}
                </button>
              })}
            </div>
          </div>
          <aside className="rounded-xl border border-white/10 bg-black/20 p-4">
            {item ? <><p className="text-[10px] tracking-widest text-emerald-300/60">{item.category}</p><h2 className="mt-2 text-lg">{item.name}</h2><p className="mt-3 text-xs leading-6 text-stone-400">{item.description}</p><dl className="mt-4 space-y-2 text-xs text-stone-400"><div>数量 {stack.count} / {item.maxStack}</div><div>单件 {item.weight.toFixed(2)} kg</div><div>合计 {(item.weight * stack.count).toFixed(2)} kg</div></dl>
              <div className="mt-5 flex flex-wrap gap-2"><button disabled={pending} className={buttonClass} onClick={() => setMoving(value => !value)}>{moving ? '取消移动' : '移动 / 合并'}</button><button disabled={pending || stack.count < 2 || !bag.slots.includes(null)} className={buttonClass} onClick={() => act({ action:'split', index:selected })}>拆分一半</button></div>
              {item.effects && <button disabled={pending} className={`${buttonClass} mt-3`} onClick={() => act({ type: 'consume', index: selected })}>使用一份</button>}
              <p className="mt-4 text-[10px] leading-5 text-stone-500">前 10 格对应快捷栏 1–9、0。食物和饮水可直接使用，医疗功能尚未开放。</p>
            </> : <p className="text-sm text-stone-500">空格 · 可存放搜集的物品</p>}
          </aside>
        </div>
      </div>
      <footer className="flex justify-between gap-3 border-t border-white/10 px-5 py-3 text-[10px] text-stone-500"><span role="status">{message || '随世界保存 · 整理自动合并同类物品'}</span><span>世界已暂停</span></footer>
    </div>
  </section>
}
