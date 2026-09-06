import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.sandbags', name: '沙袋掩体',
  zones: ["city","roadside","village"], tags: ["defense","cover"],
  footprint: { width: 2.5, depth: 0.75 },
}, {
  weathered: () => [
 ...Array.from({length:3},(_,row)=>Array.from({length:4},(_,i)=>[
   sphere([0.65,0.3,0.64],[(i-1.5)*0.58+(row%2)*0.08,0.15+row*0.25,0],row%2?'#858064':'#969075'),
   box([0.025,0.22,0.58],[(i-1.5)*0.58+(row%2)*0.08,0.15+row*0.25,0],'#655f49'),
 ]).flat()).flat()
  ],
})
