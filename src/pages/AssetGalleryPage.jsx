import { useState } from 'react'
import { Link } from 'react-router-dom'
import AssetPreview from '../components/AssetPreview.jsx'
import { assetCount, assetTabs, assetZoneLabels } from '../game/assets/assetManifest.js'

export default function AssetGalleryPage() {
  const [tabId, setTabId] = useState(assetTabs[0].id)
  const [zoneId, setZoneId] = useState('all')
  const tab = assetTabs.find((item) => item.id === tabId) || assetTabs[0]
  const availableZones = Object.keys(assetZoneLabels).filter((zone) => tab.assets.some((item) => item.zones.includes(zone)))
  const visibleAssets = zoneId === 'all' ? tab.assets : tab.assets.filter((item) => item.zones.includes(zoneId))
  const [selections, setSelections] = useState(() => Object.fromEntries(assetTabs.map((item) => [item.id, item.assets[0].assetId])))
  const selectedId = selections[tab.id]
  const asset = visibleAssets.find((item) => item.assetId === selectedId) || visibleAssets[0]
  const chooseTab = (next) => { setTabId(next.id); setZoneId('all') }
  return (
    <main className="flex h-dvh min-h-96 flex-col overflow-hidden bg-slate-950 text-stone-100">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0b1110] px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><span className="hidden h-7 w-1 rounded-full bg-emerald-300 sm:block" /><div className="min-w-0"><p className="truncate text-sm font-semibold sm:text-base">程序化资产目录</p><p className="text-[9px] tracking-[0.22em] text-emerald-300/70">DEVELOPER TOOLS</p></div></div>
        <div className="flex shrink-0 items-center gap-2"><span className="hidden font-mono text-[10px] text-stone-500 sm:inline">{assetCount} ASSETS</span><Link to="/" className="rounded-md border border-white/10 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 hover:border-white/20 hover:bg-stone-800">返回菜单</Link></div>
      </header>
      <nav role="tablist" aria-label="资产分类" className="flex h-11 shrink-0 items-stretch gap-0 overflow-x-auto border-b border-white/10 bg-[#0e1514] px-2 sm:px-4">
        {assetTabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={item.id === tab.id} onClick={() => chooseTab(item)} className={`relative shrink-0 px-3 text-xs transition sm:px-4 ${item.id === tab.id ? 'text-emerald-200 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-emerald-300' : 'text-stone-500 hover:text-stone-200'}`}>{item.label}<span className="ml-1.5 font-mono text-[9px] opacity-50">{item.assets.length}</span></button>)}
      </nav>
      <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 bg-[#0b1211] px-3 sm:px-5" aria-label="区域标签筛选">
        <span className="mr-1 shrink-0 text-[9px] tracking-wider text-stone-600">区域</span>
        {[['all', '全部'], ...availableZones.map((zone) => [zone, assetZoneLabels[zone]])].map(([id, label]) => <button key={id} type="button" aria-pressed={zoneId === id} onClick={() => setZoneId(id)} className={`shrink-0 rounded px-2 py-1 text-[10px] transition ${zoneId === id ? 'bg-emerald-900/70 text-emerald-200' : 'text-stone-500 hover:bg-white/5 hover:text-stone-300'}`}>{label}</button>)}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[170px_minmax(0,1fr)] md:grid-cols-[238px_minmax(0,1fr)] md:grid-rows-1">
        <aside className="min-h-0 overflow-y-auto border-b border-white/10 bg-[#0d1413] p-2 md:border-b-0 md:border-r" aria-label={`${tab.label}资产列表`}>
          <div className="sticky top-0 z-10 mb-1 flex items-center justify-between bg-[#0d1413]/95 px-2 py-1.5 text-[10px] text-stone-600 backdrop-blur"><span>{tab.label}</span><span className="font-mono">{visibleAssets.length}/{tab.assets.length}</span></div>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {visibleAssets.map((item) => <button key={item.assetId} type="button" onClick={() => setSelections((current) => ({ ...current, [tab.id]: item.assetId }))} className={`min-w-0 rounded-md border px-2.5 py-2 text-left transition ${item.assetId === asset.assetId ? 'border-emerald-300/30 bg-emerald-950/50' : 'border-transparent hover:bg-white/5'}`}><span className={`block truncate text-xs ${item.assetId === asset.assetId ? 'text-emerald-100' : 'text-stone-300'}`}>{item.name}</span><span className="mt-0.5 block truncate font-mono text-[9px] text-stone-600">{item.zones.map((zone) => assetZoneLabels[zone]).join(' · ')}</span></button>)}
          </div>
        </aside>
        <section className="relative min-h-0 overflow-hidden bg-[#0e1514]">
          <AssetPreview asset={asset} />
          <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%_-_8rem)] rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 shadow-xl backdrop-blur-md sm:bottom-4 sm:left-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-sm font-semibold text-stone-100">{asset.name}</h2><p className="font-mono text-[9px] text-emerald-300/70">{asset.assetId}</p></div>
            <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] text-stone-400"><div><dt className="inline text-stone-600">W </dt><dd className="inline">{asset.size.width.toFixed(1)}m</dd></div><div><dt className="inline text-stone-600">H </dt><dd className="inline">{asset.size.height.toFixed(1)}m</dd></div><div><dt className="inline text-stone-600">D </dt><dd className="inline">{asset.size.depth.toFixed(1)}m</dd></div><div><dt className="inline text-stone-600">TYPE </dt><dd className="inline">{asset.category}</dd></div><div><dt className="inline text-stone-600">区域 </dt><dd className="inline">{asset.zones.map((zone) => assetZoneLabels[zone]).join(' / ')}</dd></div></dl>
          </div>
        </section>
      </div>
    </main>
  )
}
