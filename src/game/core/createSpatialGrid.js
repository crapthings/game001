// 保守包围盒覆盖所有相交格；精确碰撞仍由调用方判断。
export function createSpatialGrid(size) {
  const cells=new Map(), memberships=new Map()
  function* keys(minX,minZ,maxX,maxZ) {
    for(let z=Math.floor(minZ/size);z<=Math.floor(maxZ/size);z++)
      for(let x=Math.floor(minX/size);x<=Math.floor(maxX/size);x++) yield `${x},${z}`
  }
  const remove=value=>{
    for(const key of memberships.get(value)||[]) {
      const cell=cells.get(key);cell.delete(value)
      if(!cell.size) cells.delete(key)
    }
    memberships.delete(value)
  }
  return {
    add(value,minX,minZ,maxX=minX,maxZ=minZ) {
      remove(value)
      const occupied=[...keys(minX,minZ,maxX,maxZ)]
      for(const key of occupied) {
        if(!cells.has(key)) cells.set(key,new Set())
        cells.get(key).add(value)
      }
      memberships.set(value,occupied)
    },
    remove,
    *query(minX,minZ,maxX,maxZ) {
      const seen=new Set()
      for(const key of keys(minX,minZ,maxX,maxZ)) for(const value of cells.get(key)||[]) {
        if(seen.has(value)) continue
        seen.add(value);yield value
      }
    },
    clear() { cells.clear();memberships.clear() },
  }
}
