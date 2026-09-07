export const weapons = {
  pistol: { name: '手枪', damage: 34, pellets: 1, range: 32, spread: .015, interval: .28, magazine: 12, reload: 1.4, accuracy: .9, headshot: .16, length: .32 },
  shotgun: { name: '霰弹枪', damage: 18, pellets: 8, range: 19, spread: .18, interval: .85, magazine: 6, reload: 2.4, accuracy: .8, headshot: .08, length: .75 },
  rifle: { name: '步枪', penetration: 3, penetrationDecay: .75, damage: 28, pellets: 1, range: 48, spread: .035, interval: .12, magazine: 30, reload: 2, accuracy: .86, headshot: .14, length: .7 },
  machinegun: { name: '机枪', damage: 24, pellets: 1, range: 44, spread: .075, interval: .08, magazine: 80, reload: 3.8, accuracy: .73, headshot: .1, length: .95 },
}
export const createCombatState = () => ({ selected: 'pistol', grenades: 3, ammo: Object.fromEntries(Object.entries(weapons).map(([id, w]) => [id, { loaded: w.magazine, reserve: w.magazine * 3 }])) })
export const validCombat = state => Boolean(state && (state.grenades === undefined || (Number.isInteger(state.grenades) && state.grenades >= 0 && state.grenades <= 999)) && weapons[state.selected] && Object.entries(weapons).every(([id,w]) => Number.isInteger(state.ammo?.[id]?.loaded) && state.ammo[id].loaded >= 0 && state.ammo[id].loaded <= w.magazine && Number.isInteger(state.ammo[id].reserve) && state.ammo[id].reserve >= 0 && state.ammo[id].reserve <= 10000))
