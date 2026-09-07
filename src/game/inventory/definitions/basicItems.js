// Stable IDs are referenced by saved inventories. See docs/item-definitions.md.
export const basicItems = {
  water: {
    categoryId: 'water', name: '瓶装饮用水', symbol: '水', status: 'ready', weight: 0.55, maxStack: 4,
    description: '瓶身写着“源自纯净山泉”。山泉还在不在不知道，至少瓶盖没人拧过。',
    purpose: '饮用恢复 35 点水分。', uses: ['consume'], effects: { water: 35 }, sources: ['民居', '商店', '营地'],
  },
  cannedFood: {
    categoryId: 'food', name: '罐头食品', symbol: '粮', status: 'ready', weight: 0.4, maxStack: 4,
    description: '曾经被你嫌弃的午餐，如今是主厨推荐。主厨是你，推荐也只有这一道。',
    purpose: '食用恢复 30 点饱食度。', uses: ['consume'], effects: { food: 30 }, sources: ['民居', '商店', '营地'],
  },
  bandage: {
    categoryId: 'medical', name: '干净绷带', symbol: '医', status: 'planned', weight: 0.05, maxStack: 8,
    description: '包装完好，说明书还在。终于有一种东西，不建议你先用火烤一下。',
    purpose: '包扎伤口、止血。', uses: ['heal'], sources: ['诊所', '急救箱', '医护感染者'],
  },
  scrap: {
    categoryId: 'material', name: '金属零件', symbol: '铁', status: 'planned', weight: 0.2, maxStack: 10,
    description: '文明散架以后留下的小零件。你暂时拼不回文明，但也许能修好一扇门。',
    purpose: '制作工具，维修工具与金属设施。', uses: ['craft', 'repair'], sources: ['修理厂', '废料堆', '工人感染者'],
  },
  branch: {
    categoryId: 'material', name: '树枝', symbol: '枝', status: 'planned', weight: 0.15, maxStack: 12,
    description: '树免费提供的入门装备。不包邮，需要弯腰自取。',
    purpose: '制作简易工具柄，作为篝火引火材料。', uses: ['craft'], sources: ['林地地面', '枯木'],
  },
  stone: {
    categoryId: 'material', name: '石料', symbol: '石', status: 'planned', weight: 0.5, maxStack: 10,
    description: '比人类文明资历老，工作态度稳定。除了重，暂时没有投诉。',
    purpose: '制作简易石制工具，建造篝火石圈。', uses: ['craft', 'build'], sources: ['地面散石', '岩石采集'],
  },
  fiber: {
    categoryId: 'material', name: '植物纤维', symbol: '纤', status: 'planned', weight: 0.03, maxStack: 20,
    description: '以前走路挂裤腿的东西，现在负责把你的工具头绑住。双方关系有所改善。',
    purpose: '制作绑绳，固定简易工具。', uses: ['craft'], sources: ['纤维植物'],
  },
  wood: {
    categoryId: 'material', name: '木料', symbol: '木', status: 'planned', weight: 1, maxStack: 8,
    description: '这棵树退休得有点突然。接下来可能成为你的床，也可能继续发光发热。',
    purpose: '建造储物箱、床与木围栏，也可作为营火燃料。', uses: ['build', 'craft'], sources: ['砍伐树木', '拆解木制品'],
  },
  cloth: {
    categoryId: 'material', name: '布料', symbol: '布', status: 'planned', weight: 0.05, maxStack: 12,
    description: '看不出原来是哪件衣服。好消息是，末日已经取消了着装要求。',
    purpose: '制作床铺与工具包扎；未经处理不能当干净绷带。', uses: ['craft', 'build'], sources: ['民居衣柜', '普通感染者'],
  },
  stoneAxe: {
    categoryId: 'tool', name: '简易石斧', symbol: '斧', status: 'planned', weight: 1.2, maxStack: 1,
    description: '科技树往回点了几千年。没有售后，但树应该不会介意。',
    purpose: '砍树获取木料；由树枝、石料和植物纤维制作。', uses: ['harvest'], sources: ['基础制作'],
  },
  stonePickaxe: {
    categoryId: 'tool', name: '简易石镐', symbol: '镐', status: 'planned', weight: 1.5, maxStack: 1,
    description: '用石头说服另一块石头。沟通效率一般，但观点足够坚硬。',
    purpose: '开采普通岩石；由树枝、石料和植物纤维制作。', uses: ['harvest'], sources: ['基础制作'],
  },
}
