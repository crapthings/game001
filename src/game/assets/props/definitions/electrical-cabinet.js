import { box, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.electrical-cabinet', name: '配电柜',
  zones: ["city","industrial","roadside"], tags: ["utility","electrical"],
  footprint: { width: 0.9, depth: 0.55 },
}, {
  weathered: () => [
    box([0.85,0.12,0.52],[0,0.06,0],C.concrete),
    box([0.75,1.3,0.42],[0,0.77,0],'#70786d'),
    box([0.7,1.2,0.025],[0,0.77,0.225],'#818778'),
    box([0.045,0.16,0.035],[0.24,0.81,0.25],C.dark),
    box([0.2,0.18,0.01],[0,1.12,0.245],'#baaa61'),
    box([0.026,0.105,0.014],[0,1.12,0.255],C.dark,[0,0,-0.35]),
    ...Array.from({length:5},(_,i)=>box([0.42,0.016,0.014],[0,0.31+i*0.045,0.25],C.dark)),
    box([0.79,0.045,0.47],[0,1.435,0],C.rust)
  ],
})
