import { ACTIVE_SEED_KEY } from '../world/generation/seed.js'
import { validateDocument } from './worldRepository.js'
import { generateWorld, normalizeSeed } from '../world/generation/generateWorld.js'
import { createProgress } from '../world/progress.js'

let connection
function database() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('game001-worlds', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('worlds')
      request.result.createObjectStore('progress')
    }
    request.onerror = () => { connection = null; reject(request.error) }
    request.onblocked = () => { connection = null; reject(new Error('请关闭其他旧版游戏标签页后重新进入。')) }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => { db.close(); connection = null }
      resolve(db)
    }
  })
  return connection
}

export const asyncWorldRepository = {
  async open(value) {
    const seed = normalizeSeed(value), db = await database()
    let document = await new Promise((resolve, reject) => {
      const tx = db.transaction(['worlds', 'progress'], 'readonly')
      const world = tx.objectStore('worlds').get([3, seed]), progress = tx.objectStore('progress').get([3, seed])
      tx.oncomplete = () => {
        if (!world.result && !progress.result) { resolve(null); return }
        if (!world.result || !progress.result) { reject(new Error('存档数据不完整，已保留原始记录。')); return }
        resolve({ ...world.result, ...progress.result })
      }
      tx.onabort = () => reject(tx.error || new Error('读取存档失败。'))
    })
    if (!document) {
      document = { schemaVersion: 2, revision: 0, world: generateWorld(seed), progress: createProgress() }
      validateDocument(document, seed)
      await new Promise((resolve, reject) => {
        const tx = db.transaction(['worlds', 'progress'], 'readwrite')
        tx.objectStore('worlds').add({ schemaVersion: document.schemaVersion, world: document.world }, [3, seed])
        tx.objectStore('progress').add({ revision: document.revision, progress: document.progress }, [3, seed])
        tx.oncomplete = resolve
        tx.onabort = () => reject(tx.error || new Error('创建世界失败，请重新进入。'))
      })
    } else validateDocument(document, seed)
    localStorage.setItem(ACTIVE_SEED_KEY, seed)
    return document
  },
  async save(document, progress) {
    const db = await database()
    const next = { ...document, revision: document.revision + 1, progress }
    await new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite'), store = tx.objectStore('progress')
      let conflict = false
      const key = [3, document.world.seed]
      const request = store.get(key)
      request.onsuccess = () => {
        if (request.result?.revision !== document.revision) { conflict = true; tx.abort(); return }
        // 只写进度；世界规划不再每两秒被解析、校验和序列化。
        store.put({ revision: next.revision, progress }, key)
      }
      tx.oncomplete = resolve
      tx.onabort = () => reject(conflict ? new Error('存档已在其他页面更新，请返回菜单重新进入该种子。') : tx.error || new Error('进度保存失败。'))
    })
    return next
  },
}
