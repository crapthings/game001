import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.garbage-bags', name: '垃圾袋堆',
  zones: ["city","village","industrial"], tags: ["debris","waste"],
  footprint: { width: 1.2, depth: 0.9 },
}, {
  weathered: () => [
 ...[[-0.3,0.26,0],[0.3,0.3,0.08],[0,0.22,-0.28]].flatMap(([x,y,z],i)=>[
   sphere([0.55,y*2,0.52],[x,y,z],i===1?'#454b43':'#303833'),
   cylinder([0.1,0.12,0.025],[x,y*2,z],'#51584a'),
 ]),
 box([0.36,0.04,0.26],[0.2,0.03,0.36],'#9b8a67',[0,0.25,0])
  ],
})
