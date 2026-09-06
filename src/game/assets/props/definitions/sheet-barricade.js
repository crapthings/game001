import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.sheet-barricade', name: '铁皮围挡',
  zones: ["city","industrial","village"], tags: ["defense","barrier","modular"],
  footprint: { width: 2.5, depth: 0.6 },
}, {
  weathered: () => [
 ...[-1.05,1.05].map(x=>box([0.12,2.1,0.14],[x,1.05,0],C.wood)),
 ...Array.from({length:12},(_,i)=>box([0.22,1.8,0.06],[-1.1+i*0.2,1.05,(i%2)*0.04],i%3===0?C.rust:C.metal)),
 ...[0.55,1.5].map(y=>box([2.4,0.12,0.1],[0,y,-0.09],C.wood)),
 ...[-1.05,1.05].map(x=>box([0.18,0.12,0.6],[x,0.06,0],C.wood))
  ],
})
