// 有限色板组合，既增加外观变化，也继续复用共享材质。
const styles=[
  {tint:[1,1,1],skin:1,lean:0},
  {tint:[.82,.87,.9],skin:.92,lean:.035},
  {tint:[1.1,.94,.82],skin:1.04,lean:-.025},
  {tint:[.9,1.04,.86],skin:.96,lean:.02},
  {tint:[.77,.78,.74],skin:1.07,lean:-.015},
  {tint:[1.1,1.06,.97],skin:.9,lean:.045},
]
const cache=new WeakMap()
const tint=(hex,factors)=>'#'+[0,1,2].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(hex.slice(1+i*2,3+i*2),16)*factors[i]))).toString(16).padStart(2,'0')).join('')
export const ZOMBIE_APPEARANCE_COUNT=styles.length
export function zombieAppearance(definition,index=0) {
  let variants=cache.get(definition)
  if(!variants) {variants=new Map();cache.set(definition,variants)}
  const key=((index%styles.length)+styles.length)%styles.length
  if(!variants.has(key)) {
    const style=styles[key]
    variants.set(key,{...definition,cloth:tint(definition.cloth,style.tint),pants:tint(definition.pants,style.tint),skin:tint(definition.skin,[style.skin,style.skin,style.skin]),lean:definition.lean+style.lean})
  }
  return variants.get(key)
}
