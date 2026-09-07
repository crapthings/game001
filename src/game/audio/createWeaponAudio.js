import reloadUrl from '../assets/audio/weapons/reload.mp3?url'

// 射击使用合成缓存，换弹使用本地 MP3；音频解码后复用。
const profiles = {
  explosion: { duration: .65, pitch: 55, noise: 1, decay: 8, lowpass: .13, volume: .42 },
  pistol: { duration: .19, pitch: 170, noise: .7, decay: 30, lowpass: .55, volume: .3 },
  shotgun: { duration: .42, pitch: 85, noise: .9, decay: 14, lowpass: .2, volume: .38 },
  rifle: { duration: .16, pitch: 135, noise: .85, decay: 36, lowpass: .65, volume: .26 },
  machinegun: { duration: .2, pitch: 100, noise: .8, decay: 28, lowpass: .35, volume: .25 },
}

export function createWeaponAudio() {
  let context=null, master=null, disposed=false
  const buffers=new Map(), voices=new Set()
  const loadController=new AbortController()
  const reloadData=fetch(reloadUrl,{signal:loadController.signal}).then(response=>{
    if(!response.ok) throw new Error('换弹音效读取失败')
    return response.arrayBuffer()
  }).catch(()=>null)
  let sampledReload=false
  function synth(profile, variant=0) {
    const rate=context.sampleRate, buffer=context.createBuffer(1,Math.ceil(profile.duration*rate),rate)
    const data=buffer.getChannelData(0)
    let filtered=0, phase=0
    for(let i=0;i<data.length;i++) {
      const t=i/rate, attack=Math.min(1,t/.0015)
      filtered+=((Math.random()*2-1)-filtered)*profile.lowpass
      phase+=Math.PI*2*profile.pitch*(1+variant*.035)*Math.exp(-t*12)/rate
      const crack=(Math.random()*2-1)*Math.exp(-t*160)*.35
      const body=filtered*profile.noise+Math.sin(phase)*.42
      data[i]=Math.tanh((body+crack)*attack*Math.exp(-t*profile.decay))
    }
    return buffer
  }
  const unlock=()=>{
    if(disposed) return
    try {
      if(!context) {
        const Audio=window.AudioContext || window.webkitAudioContext
        if(!Audio) return
        context=new Audio()
        master=context.createGain();master.gain.value=.65
        const compressor=context.createDynamicsCompressor()
        compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=4
        master.connect(compressor);compressor.connect(context.destination)
        for(const [id,profile] of Object.entries(profiles)) buffers.set(id,[-1,0,1].map(variant=>synth(profile,variant)))
        buffers.set('reload-out',[synth({duration:.1,pitch:520,noise:.4,decay:55,lowpass:.8})])
        buffers.set('reload-in',[synth({duration:.14,pitch:340,noise:.55,decay:38,lowpass:.7})])
        reloadData.then(data=>{
          if(!data || disposed) return null
          return context.decodeAudioData(data)
        }).then(buffer=>{
          if(!buffer || disposed) return
          buffers.set('reload-out',[buffer]);sampledReload=true
        }).catch(()=>{})
      }
      if(context.state==='suspended') context.resume().catch(()=>{})
    } catch { /* 音频不可用不阻断游戏。 */ }
  }
  window.addEventListener('pointerdown',unlock,true)
  window.addEventListener('keydown',unlock,true)
  const stop=()=>{
    for(const source of voices) { source.stop();source.disconnect() }
    voices.clear()
  }
  return {
    play(id,{duration}={}) {
      if(disposed || context?.state!=='running') return
      if(id==='reload-in' && sampledReload) return
      const choices=buffers.get(id)
      if(!choices) return
      if(voices.size>=12) { const oldest=voices.values().next().value;oldest.stop();voices.delete(oldest) }
      const source=context.createBufferSource(), gain=context.createGain()
      source.buffer=choices[Math.floor(Math.random()*choices.length)]
      if(id==='reload-out' && sampledReload && duration>0) source.playbackRate.value=source.buffer.duration/duration
      gain.gain.value=profiles[id]?.volume ?? (sampledReload ? .5 : .19)
      source.connect(gain);gain.connect(master);voices.add(source)
      source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect()}
      source.start()
    },
    stop,
    dispose() {
      disposed=true;loadController.abort();stop();buffers.clear()
      window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true)
      context?.close().catch(()=>{})
    },
  }
}
