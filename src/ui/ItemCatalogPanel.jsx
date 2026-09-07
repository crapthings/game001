import ItemLootDetails from './ItemLootDetails.jsx'
import { useState } from 'react'
import { itemCatalog, itemCategories, itemIds } from '../game/inventory/items.js'

const categories = [['all', '全部道具'], ...Object.values(itemCategories).map(category => [category.id, category.name])]
const focus = 'focus-visible:outline-2 focus-visible:outline-emerald-300'

export default function ItemCatalogPanel() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(itemIds[0])
  const search = query.trim().toLocaleLowerCase()
  const matchingIds = new Set(itemIds.filter(id => {
    const item = itemCatalog[id]
    return (status === 'all' || item.status === status)
      && [item.id, item.name, item.description, item.purpose, ...item.sources].join(' ').toLocaleLowerCase().includes(search)
  }))
  const visibleIds = (type === 'all' ? itemIds : itemCategories[type].itemIds).filter(id => matchingIds.has(id))
  const visibleIdSet = new Set(visibleIds)
  const items = visibleIds.map(id => itemCatalog[id])
  const active = itemCatalog[visibleIdSet.has(selectedId) ? selectedId : visibleIds[0]]
  const control = `min-w-0 rounded-lg border border-white/15 bg-[#23342c] px-3 py-2.5 text-sm ${focus}`
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
      <input aria-label="搜索道具" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索名称、ID、用途或来源" className={`${control} flex-1 basis-56`} />
      <select aria-label="用途接入状态" className={control} value={status} onChange={event => setStatus(event.target.value)}><option value="all">所有状态</option><option value="ready">用途已接入</option><option value="planned">用途待接入</option></select>
    </div>
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-[140px_230px_minmax(0,1fr)] md:overflow-hidden lg:grid-cols-[160px_260px_minmax(0,1fr)]">
      <nav aria-label="道具分类" className="rounded-xl border border-white/10 bg-black/15 p-2 md:overflow-y-auto">
        <p className="px-3 py-2 text-xs text-stone-500">分类</p>
        <div className="flex flex-wrap gap-1 md:flex-col">{categories.map(([id, label]) => {
          const count = id === 'all' ? matchingIds.size : itemCategories[id].itemIds.filter(itemId => matchingIds.has(itemId)).length
          return <button key={id} aria-pressed={type === id} onClick={() => { setType(id); setSelectedId(null) }} className={`flex items-center justify-between gap-4 rounded-lg px-3 py-3 text-sm ${focus} ${type === id ? 'bg-emerald-900/45 text-emerald-200' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'}`}><span>{label}</span><span className="text-xs opacity-60">{count}</span></button>
        })}</div>
      </nav>
      <section aria-label="道具列表" className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/15">
        <div className="flex shrink-0 justify-between border-b border-white/10 px-4 py-3 text-xs text-stone-400"><span>{type === 'all' ? '全部道具' : itemCategories[type].name}</span><span>{items.length} 种</span></div>
        <div className="max-h-64 space-y-1 overflow-y-auto p-2 md:max-h-none md:flex-1">
          {items.map(item => <button key={item.id} aria-pressed={active?.id === item.id} aria-controls="item-card-detail" onClick={() => setSelectedId(item.id)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${focus} ${active?.id === item.id ? 'border-emerald-300/40 bg-emerald-900/30' : 'border-transparent hover:bg-white/5'}`}>
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg text-emerald-200">{item.symbol}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.name}</span><span className="mt-1 block truncate text-[11px] text-stone-500">{item.id}</span></span>
            <span aria-label={item.status === 'ready' ? '用途已接入' : '用途待接入'} className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.status === 'ready' ? 'bg-emerald-300' : 'bg-amber-200/70'}`} />
          </button>)}
          {!items.length && <p role="status" className="px-3 py-8 text-sm leading-6 text-stone-500">没有符合条件的道具，试试其他分类或关键词。</p>}
        </div>
      </section>
      <section id="item-card-detail" aria-label="选中道具详情" className="min-w-0 overflow-y-auto rounded-xl border border-white/10 bg-[#17251e]">
        {active ? <article key={active.id} className="p-5 lg:p-7">
          <div className="flex items-center justify-between gap-3 text-xs"><span className="text-emerald-200/70">{active.category}</span><span className={`rounded-full border px-3 py-1 ${active.status === 'ready' ? 'border-emerald-300/20 text-emerald-300' : 'border-amber-200/20 text-amber-200/80'}`}>{active.status === 'ready' ? '用途已接入' : '用途待接入'}</span></div>
          <div aria-hidden="true" className="my-6 flex h-32 items-center justify-center rounded-xl border border-white/5 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.12),transparent_70%)]"><span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-emerald-200/15 bg-black/15 text-5xl text-emerald-100 shadow-lg">{active.symbol}</span></div>
          <h3 className="text-2xl font-semibold tracking-wide">{active.name}</h3>
          <p className="mt-2 font-mono text-xs text-stone-500">{active.id}</p>
          <p className="mt-5 border-l-2 border-emerald-300/25 pl-4 text-sm leading-7 text-stone-300">{active.description}</p>
          <div className="mt-6 rounded-lg bg-black/20 p-4"><h4 className="text-xs text-emerald-300/70">用途</h4><p className="mt-2 text-sm leading-6 text-emerald-50/90">{active.purpose}</p></div>
          <dl className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-stone-500">单件重量</dt><dd className="mt-2 text-lg">{active.weight.toFixed(2)} <span className="text-xs text-stone-400">kg</span></dd></div><div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-stone-500">每格上限</dt><dd className="mt-2 text-lg">{active.maxStack} <span className="text-xs text-stone-400">件</span></dd></div></dl>
          <h4 className="mt-6 text-xs text-stone-500">规划来源</h4><div className="mt-3 flex flex-wrap gap-2">{active.sources.map(source => <span key={source} className="rounded border border-white/10 px-2.5 py-1.5 text-xs text-stone-300">{source}</span>)}</div>
          <ItemLootDetails itemId={active.id} />
          {active.status === 'planned' && <p className="mt-5 text-xs leading-6 text-amber-200/60">用途已规划，相关玩法尚未接入。</p>}
        </article> : <div className="flex min-h-48 h-full items-center justify-center p-6 text-sm text-stone-500">暂无可展示的道具</div>}
      </section>
    </div>
    <p className="mt-3 shrink-0 text-[11px] leading-5 text-stone-500">共 {itemIds.length} 种基础道具 · 图鉴只读预览，规划来源不代表已经开放掉落。</p>
  </div>
}
