import { openingRoadblock } from '../game/world/opening/openingStory.js'
import { planningCell } from '../game/world/generation/planningGrid.js'

export function PlanningGridOverlay({ level, line }) {
  const size = 2048 / level
  return <g stroke={level === 16 ? '#b8c5e8' : '#c8dfb2'} strokeOpacity="0.3" strokeWidth={line * 0.5}>
    {Array.from({ length: level - 1 }, (_, index) => {
      const at = -1024 + (index + 1) * size
      return <path key={index} d={`M ${at} -1024 V 1024 M -1024 ${at} H 1024`}/>
    })}
  </g>
}

export default function OpeningPlanOverlay({ opening, grid, line }) {
  if (!opening) return null
  const rect = (b, props) => <rect x={b.minX} y={-b.maxZ} width={b.maxX - b.minX} height={b.maxZ - b.minZ} {...props}/>
  const block = openingRoadblock(opening)
  const anchors = [['入口', opening.entry], ['下车', opening.playerExit], ['路障', block.position], ['接路口', opening.connectionPortal]]
  return <g>
    {grid?.cells.filter(cell => cell.level === 32).map(cell => {
      const [, row, column] = cell.id.split('/')
      return <g key={cell.id}>{rect(planningCell(32, Number(column), Number(row)).bounds, { fill: '#b5dcad', fillOpacity: 0.07, stroke: '#b5dcad', strokeWidth: line * 0.5 })}</g>
    })}
    {rect(opening.bounds, { fill: '#8ce5d0', fillOpacity: 0.08, stroke: '#8ce5d0', strokeWidth: line, strokeDasharray: `${line * 4} ${line * 3}` })}
    {rect(opening.grading.core, { fill: 'none', stroke: '#bdb79b', strokeWidth: line * 0.7 })}
    <rect x={-block.width / 2} y={-block.depth / 2} width={block.width} height={block.depth} transform={`translate(${block.position[0]} ${-block.position[1]}) rotate(${block.yaw * 180 / Math.PI})`} fill="#c78b67"/>
    {rect(opening.parking.bounds, { fill: '#d5c48d', fillOpacity: 0.45, stroke: '#ffdc85', strokeWidth: line })}
    <polyline points={opening.approachPath.map(([x, z]) => `${x},${-z}`).join(' ')} fill="none" stroke="#7ef6b6" strokeWidth={Math.max(1, line * 1.8)}/>
    {anchors.map(([label, p]) => <g key={label}><circle cx={p[0]} cy={-p[1]} r={line * 2.4} fill="#fff1b5"/><text x={p[0] + line * 4} y={-p[1] - line * 3} fill="#fff1b5" fontSize={line * 9}>{label}</text></g>)}
    {opening.shots.map(shot => <g key={shot.id}><circle cx={shot.position[0]} cy={-shot.position[2]} r={line * 2} fill="#bca8ff"/><text x={shot.position[0] + line * 4} y={-shot.position[2]} fill="#c9baff" fontSize={line * 8}>镜头 {shot.id}</text></g>)}
  </g>
}
