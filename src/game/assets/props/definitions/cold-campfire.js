import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.cold-campfire', name: '熄灭篝火',
  zones: ["forest","wilderness","village"], tags: ["camp","debris"],
  footprint: { width: 1.2, depth: 1.2 },
}, {
  weathered: () => [
 cylinder([0.95,0.025,0.95],[0,0.013,0],'#403e37'),
 ...Array.from({length:10},(_,i)=>sphere([0.24,0.18,0.22],[Math.cos(i*Math.PI/5)*0.48,0.09,Math.sin(i*Math.PI/5)*0.48],C.concrete)),
 ...[-0.55,0.55].map(angle=>box([0.12,0.12,0.75],[0,0.09,0],'#302b24',[0,angle,0])),
 box([0.09,0.06,0.58],[0.05,0.18,0],'#555047',[0,1.4,0])
  ],
})
