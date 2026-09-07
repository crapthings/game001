import { cylinder, defineProp as defineNature } from '../../props/primitives.js'

export default defineNature({
  assetId: 'nature.young-pine', name: '幼松', zones: ['forest', 'wilderness'], tags: ['tree'], radius: .12,
}, {
  default: () => [
    cylinder([.15, 2.5, .06], [0, 1.25, 0], '#77654f'),
    ...[0, 1, 2, 3].map(i => cylinder(
      [1.5 - i * .32, 1.05 - i * .08, .025],
      [Math.sin(i * 2.4) * .075, .95 + i * .49, Math.cos(i * 2.4) * .055],
      ['#354e40', '#405d46', '#506c4e', '#657c57'][i], [0, i * .65, .035 * Math.sin(i)],
    )),
  ],
})
