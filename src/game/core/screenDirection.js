// 固定斜俯视相机的屏幕方向转换；补偿地面纵向投影压缩。
export function screenDirection(horizontal, up, beta=Math.PI/4) {
  const vertical=up/Math.max(.1,Math.cos(beta))
  const x=horizontal-vertical,z=horizontal+vertical,length=Math.hypot(x,z)
  return length ? {x:x/length,z:z/length} : {x:0,z:0}
}
