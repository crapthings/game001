// 尸群共享反向广度搜索，不为每只敌人重复搜索。每帧有限扩展。
export function createHordeNavigation(world) {
  const size=2, radius=32, directions=[[1,0],[-1,0],[0,1],[0,-1]]
  let field=null, age=Infinity
  const key=(x,z)=>`${x},${z}`
  const clear=(x,z)=>world.isLoaded(x,z)&&world.canMove(x,z,.45)
  const segment=(ax,az,bx,bz)=>{
    const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.35))
    for(let i=1;i<=steps;i++) if(!clear(ax+(bx-ax)*i/steps,az+(bz-az)*i/steps)) return false
    return true
  }
  function start(position) {
    const gx=Math.floor(position.x/size),gz=Math.floor(position.z/size)
    const next={gx,gz,dist:new Map(),queue:[],cursor:0,cells:new Map()}
    // 玩家可站在细窄位置，从附近确实能连到玩家的网格点开始。
    for(let z=gz-1;z<=gz+1;z++) for(let x=gx-1;x<=gx+1;x++) {
      const wx=(x+.5)*size,wz=(z+.5)*size
      if(clear(wx,wz)&&segment(position.x,position.z,wx,wz)) {
        next.dist.set(key(x,z),0);next.queue.push([x,z])
      }
    }
    field=next;age=0
  }
  return {
    dispose() { field=null },
    update(dt,position) {
      age+=dt
      const gx=Math.floor(position.x/size),gz=Math.floor(position.z/size)
      if(!field || (age>.5 && (gx!==field.gx || gz!==field.gz)) || (age>2 && field.cursor>=field.queue.length)) start(position)
      let budget=160
      while(field.cursor<field.queue.length && budget-->0) {
        const [x,z]=field.queue[field.cursor++],distance=field.dist.get(key(x,z))
        for(const [dx,dz] of directions) {
          const nx=x+dx,nz=z+dz,k=key(nx,nz)
          if(Math.abs(nx-field.gx)>radius || Math.abs(nz-field.gz)>radius || field.dist.has(k)) continue
          const wx=(nx+.5)*size,wz=(nz+.5)*size
          if(!field.cells.has(k)) field.cells.set(k,clear(wx,wz))
          if(!field.cells.get(k)) continue
          // 检查边的中点，不能跨过窄围栏或墙体。
          if(!clear((x+nx+1)*size/2,(z+nz+1)*size/2)) continue
          field.dist.set(k,distance+1);field.queue.push([nx,nz])
        }
      }
    },
    direction(x,z,target,bias=0) {
      const dx=target.x-x,dz=target.z-z,length=Math.hypot(dx,dz)
      if(length<.01) return {x:0,z:0}
      if(length<=6 && segment(x,z,target.x,target.z)) return {x:dx/length,z:dz/length}
      if(!field) return null
      const gx=Math.floor(x/size),gz=Math.floor(z/size)
      const candidates=[]
      for(let iz=gz-1;iz<=gz+1;iz++) for(let ix=gx-1;ix<=gx+1;ix++) {
        const distance=field.dist.get(key(ix,iz))
        if(distance===undefined) continue
        const wx=(ix+.5)*size,wz=(iz+.5)*size,d=Math.hypot(wx-x,wz-z)
        if(d<.15) continue
        const score=distance*size+d+bias*Math.sin(ix*1.7+iz*2.3)*.15
        candidates.push({x:(wx-x)/d,z:(wz-z)/d,wx,wz,score})
      }
      return candidates.sort((a,b)=>a.score-b.score).find(candidate=>segment(x,z,candidate.wx,candidate.wz)) || null
    },
  }
}
