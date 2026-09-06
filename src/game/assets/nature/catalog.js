import item0 from './definitions/birch.js'
import item1 from './definitions/young-pine.js'
import item2 from './definitions/burnt-tree.js'
import item3 from './definitions/tree-stump.js'
import item4 from './definitions/fallen-trunk.js'
import item5 from './definitions/fern-clump.js'
import item6 from './definitions/dry-grass.js'
import item7 from './definitions/cattails.js'
import item8 from './definitions/thorn-bush.js'
import item9 from './definitions/mossy-boulder.js'
import item10 from './definitions/gravel-patch.js'
import item11 from './definitions/mushroom-cluster.js'

const definitions = [item0, item1, item2, item3, item4, item5, item6, item7, item8, item9, item10, item11]
export const natureCatalog = Object.fromEntries(definitions.flatMap((definition) =>
  Object.entries(definition.variants).map(([variant, createParts]) => {
    const assetId = variant === definition.defaultVariant ? definition.assetId : `${definition.assetId}:${variant}`
    return [assetId, { ...definition, assetId, variant,
      name: variant === definition.defaultVariant ? definition.name : `${definition.name} · ${variant}`,
      parts: variant === definition.defaultVariant ? definition.parts : createParts(),
    }]
  }),
))
