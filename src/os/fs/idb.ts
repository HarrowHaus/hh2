// Minimal IndexedDB key/value store implementing zustand's StateStorage, so the
// virtual file system persists to IndexedDB (docs/02 #7, #10) rather than the
// 5MB localStorage bucket. One object store, string values.

const DB_NAME = 'hmd'
const STORE = 'kv'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export const idbStorage = {
  getItem: (name: string): Promise<string | null> =>
    tx('readonly', (s) => s.get(name)).then((v) => (v == null ? null : (v as string))),
  setItem: (name: string, value: string): Promise<void> =>
    tx('readwrite', (s) => s.put(value, name)).then(() => undefined),
  removeItem: (name: string): Promise<void> =>
    tx('readwrite', (s) => s.delete(name)).then(() => undefined),
}
