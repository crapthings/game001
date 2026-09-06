// 数值均为米；退让从道路边缘开始计算，不再固定建筑中心距道路的距离。
export function frontageProfile(category, village = false) {
  if (category === 'industrial' || category === 'utility') return { verge: village ? 1 : 2, setback: 6, pathWidth: 4 }
  if (category === 'commercial' || category === 'civic') return { verge: village ? 1.2 : 2, setback: village ? 2 : 1.5, pathWidth: 2.4 }
  return { verge: village ? 1.2 : 2, setback: village ? 2.8 : 3, pathWidth: 1.8 }
}

export function addFrontage(surfaces, placement, model, profile) {
  const forward = [Math.sin(placement.rotation), Math.cos(placement.rotation)]
  const wall = [placement.position[0]+forward[0]*model.depth/2, placement.position[2]+forward[1]*model.depth/2]
  const length = profile.verge + profile.setback
  surfaces.push({ ownerId: placement.id, kind: 'yard', x: wall[0]+forward[0]*length/2, z: wall[1]+forward[1]*length/2, width: model.width+2, depth: length, rotation: placement.rotation })
  surfaces.push({ ownerId: placement.id, kind: profile.pathWidth >= 4 ? 'apron' : 'path', x: wall[0]+forward[0]*length/2, z: wall[1]+forward[1]*length/2, width: profile.pathWidth, depth: length+0.5, rotation: placement.rotation })
}

export function surfaceAt(surfaces, x, z) {
  let result
  for (const surface of surfaces || []) {
    const dx=x-surface.x,dz=z-surface.z,c=Math.cos(surface.rotation),s=Math.sin(surface.rotation)
    if (Math.abs(dx*c-dz*s)<=surface.width/2 && Math.abs(dx*s+dz*c)<=surface.depth/2) result=surface.kind
  }
  return result
}

export function placementBounds(item) {
  const c=Math.abs(Math.cos(item.rotation)),s=Math.abs(Math.sin(item.rotation))
  return { x:item.position[0], z:item.position[2], hx:(item.footprint.width*c+item.footprint.depth*s)/2, hz:(item.footprint.width*s+item.footprint.depth*c)/2 }
}
export function overlapsPlacement(item, other, gap=1) {
  const a=placementBounds(item), b=placementBounds(other)
  return Math.abs(a.x-b.x)<a.hx+b.hx+gap && Math.abs(a.z-b.z)<a.hz+b.hz+gap
}

// 将路段转入建筑局部坐标，裁剪到扩张后的占地矩形，避免宽建筑贴路后误穿路口。
export function blocksRoad(item, segments, margin=0.5) {
  const c=Math.cos(item.rotation),s=Math.sin(item.rotation)
  const local=(x,z)=>[(x-item.position[0])*c-(z-item.position[2])*s,(x-item.position[0])*s+(z-item.position[2])*c]
  return segments.some(segment => {
    const a=local(segment.ax,segment.az),b=local(segment.bx,segment.bz)
    const half=[item.footprint.width/2+segment.width/2+margin,item.footprint.depth/2+segment.width/2+margin]
    let lo=0,hi=1
    for(let axis=0;axis<2;axis+=1){
      const d=b[axis]-a[axis]
      if(Math.abs(d)<1e-8){ if(Math.abs(a[axis])>half[axis]) return false }
      else { const t0=(-half[axis]-a[axis])/d,t1=(half[axis]-a[axis])/d; lo=Math.max(lo,Math.min(t0,t1)); hi=Math.min(hi,Math.max(t0,t1)); if(lo>hi)return false }
    }
    return true
  })
}
