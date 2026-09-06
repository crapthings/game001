export const itemCatalog = {
  water: { name: '瓶装饮用水', category: '补给', symbol: '水', weight: 0.55, maxStack: 4, effects: { water: 35 }, description: '半升饮用水，使用后恢复 35 点水分。' },
  cannedFood: { name: '罐头食品', category: '补给', symbol: '粮', weight: 0.4, maxStack: 4, effects: { food: 30 }, description: '应急罐头，使用后恢复 30 点饱食度。' },
  bandage: { name: '干净绷带', category: '医疗', symbol: '医', weight: 0.05, maxStack: 8, description: '单独包装的绷带，适合后续伤口处理。' },
  scrap: { name: '金属零件', category: '材料', symbol: '材', weight: 0.2, maxStack: 10, description: '回收的小型金属零件，可供后续制作与维修。' },
}
