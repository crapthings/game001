// Draft balance only. Each entry rolls independently once per completed interaction.
export const lootTableDefinitions = {
  tree: { wood: { chance: 1, min: 3, max: 5 }, branch: { chance: 0.6, min: 1, max: 2 } },
  fallenWood: { wood: { chance: 1, min: 2, max: 3 }, branch: { chance: 1, min: 1, max: 2 } },
  rock: { stone: { chance: 1, min: 3, max: 5 } },
  reeds: { fiber: { chance: 1, min: 2, max: 4 } },
  resident: { cloth: { chance: 0.25, min: 1, max: 2 } },
  worker: { scrap: { chance: 0.35, min: 1, max: 2 }, cloth: { chance: 0.15, min: 1, max: 1 } },
  medic: { bandage: { chance: 0.3, min: 1, max: 1 } },
  pantry: { water: { chance: 0.45, min: 1, max: 2 }, cannedFood: { chance: 0.4, min: 1, max: 2 } },
}

// Asset bindings and semantic loot profiles are distinct: appearance never assigns an enemy identity.
export const interactionDefinitions = {
  birch: { name: '白桦树', assetId: 'nature.birch', action: 'chop', toolId: 'stoneAxe', lootTableId: 'tree', depletedState: 'stump' },
  pine: { name: '幼松', assetId: 'nature.young-pine', action: 'chop', toolId: 'stoneAxe', lootTableId: 'tree', depletedState: 'stump' },
  fallenTrunk: { name: '倒伏树干', assetId: 'nature.fallen-trunk', action: 'chop', toolId: 'stoneAxe', lootTableId: 'fallenWood', depletedState: 'depleted' },
  mossyRock: { name: '覆苔巨石', assetId: 'nature.mossy-boulder', action: 'mine', toolId: 'stonePickaxe', lootTableId: 'rock', depletedState: 'depleted' },
  cattails: { name: '香蒲丛', assetId: 'nature.cattails', action: 'gather', toolId: null, lootTableId: 'reeds', depletedState: 'depleted' },
  residentCorpse: { name: '普通感染者遗留物', profileId: 'resident', action: 'search', toolId: null, lootTableId: 'resident', depletedState: 'searched' },
  workerCorpse: { name: '工人感染者遗留物', profileId: 'worker', action: 'search', toolId: null, lootTableId: 'worker', depletedState: 'searched' },
  medicCorpse: { name: '医护感染者遗留物', profileId: 'medic', action: 'search', toolId: null, lootTableId: 'medic', depletedState: 'searched' },
  pantry: { name: '民居食品柜', profileId: 'pantry', action: 'search', toolId: null, lootTableId: 'pantry', depletedState: 'searched' },
}
