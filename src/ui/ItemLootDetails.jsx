import { itemCatalog } from '../game/inventory/items.js'
import { itemLootSources, lootInteractions, interactionActions } from '../game/loot/catalog.js'

export default function ItemLootDetails({ itemId }) {
  const sources = itemLootSources[itemId]
  return <section className="mt-6 border-t border-white/10 pt-5" aria-label="交互掉落规则">
    <h4 className="text-sm text-emerald-200">交互与掉落</h4>
    <p className="mt-2 text-xs leading-5 text-stone-500">初始调参值 · 尚未接入玩法。概率按一次完整交互计算，各道具独立判定。</p>
    <div className="mt-3 space-y-2">{sources.map(source => {
      const rule = lootInteractions[source.interactionId]
      return <div key={rule.id} className="rounded-lg border border-white/10 bg-black/15 p-3">
        <div className="flex justify-between gap-3 text-sm"><span>{rule.name}</span><span className="shrink-0 text-emerald-200">{source.chance === 1 ? '必得' : `${Math.round(source.chance * 100)}%`} · {source.min === source.max ? source.min : `${source.min}–${source.max}`} 件</span></div>
        <p className="mt-2 text-xs text-stone-400">{interactionActions[rule.action]} · {rule.toolId ? `需要${itemCatalog[rule.toolId].name}` : '徒手'} · 每个实体仅结算一次</p>
        <p className="mt-1 break-all font-mono text-[10px] text-stone-600">{rule.assetId ?? `profile:${rule.profileId}`} → {rule.lootTableId}</p>
      </div>
    })}</div>
    {!sources.length && <p className="mt-3 text-xs leading-5 text-stone-400">尚未配置直接掉落；制作产物通过配方获取，其他来源待补充。</p>}
  </section>
}
