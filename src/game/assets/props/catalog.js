import prop0 from './definitions/abandoned-car.js'
import prop1 from './definitions/sandbags.js'
import prop2 from './definitions/barbed-wire.js'
import prop3 from './definitions/sheet-barricade.js'
import prop4 from './definitions/traffic-cone.js'
import prop5 from './definitions/tent.js'
import prop6 from './definitions/sleeping-bag.js'
import prop7 from './definitions/cold-campfire.js'
import prop8 from './definitions/medical-case.js'
import prop9 from './definitions/suitcase.js'
import prop10 from './definitions/brick-rubble.js'
import prop11 from './definitions/garbage-bags.js'
import plasticChair from './definitions/plastic-chair.js'
import foldingTable from './definitions/folding-table.js'
import mattress from './definitions/mattress.js'
import shoppingCart from './definitions/shopping-cart.js'
import acUnit from './definitions/ac-unit.js'
import drainpipe from './definitions/drainpipe.js'
import electricalCabinet from './definitions/electrical-cabinet.js'
import fireHydrant from './definitions/fire-hydrant.js'
import toolbox from './definitions/toolbox.js'
import waterCan from './definitions/water-can.js'
import storageShelf from './definitions/storage-shelf.js'
import woodPallet from './definitions/wood-pallet.js'

export const propDefinitions = [
  prop0, prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8, prop9, prop10, prop11,
  plasticChair, foldingTable, mattress, shoppingCart, acUnit, drainpipe, electricalCabinet, fireHydrant, toolbox, waterCan, storageShelf, woodPallet,
]

// 默认版本沿用基础 ID；新增变体自动登记，避免覆盖既有存档外观。
export const propCatalog = Object.fromEntries(propDefinitions.flatMap((definition) =>
  Object.entries(definition.variants).map(([variant, createParts]) => {
    const assetId = variant === definition.defaultVariant ? definition.assetId : `${definition.assetId}:${variant}`
    return [assetId, {
      ...definition, assetId, variant,
      name: variant === definition.defaultVariant ? definition.name : `${definition.name} · ${variant}`,
      parts: variant === definition.defaultVariant ? definition.parts : createParts(),
    }]
  }),
))
