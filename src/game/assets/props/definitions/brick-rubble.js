import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.brick-rubble', name: '碎砖堆',
  zones: ["city","village","industrial"], tags: ["debris","ruin"],
  footprint: { width: 1.8, depth: 1.4 },
}, {
  weathered: () => [
 ...Array.from({length:18},(_,i)=>box([0.3+(i%3)*0.04,0.12,0.17],[
   Math.sin(i*2.4)*(0.25+(i%4)*0.15),0.1+Math.floor(i/6)*0.09,Math.cos(i*2.4)*(0.2+(i%3)*0.17)
 ],i%3===0?C.concrete:'#88604a',[0.12*(i%2),i*1.3,0.13*(i%3)])),
 box([0.8,0.08,0.36],[0.15,0.1,0.28],C.concrete,[0.12,0.6,0.1])
  ],
})
