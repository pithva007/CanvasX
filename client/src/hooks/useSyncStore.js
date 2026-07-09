import { useEffect, useMemo, useState } from 'react'
import {
  createTLStore,
  defaultShapeUtils,
  defaultBindingUtils,
  loadSnapshot,
  atom,
  react,
  createPresenceStateDerivation,
  InstancePresenceRecordType,
} from 'tldraw'

const PRESENCE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA94D',
  '#9775FA', '#38D9A9', '#F783AC', '#748FFC',
]

function colorForId(id = '') {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]
}

/** Apply a tldraw store diff (added/updated/removed maps) to the store. */
function applyChanges(store, changes) {
  if (!changes) return
  const toPut = []
  const toRemove = []
  if (changes.added) for (const rec of Object.values(changes.added)) toPut.push(rec)
  if (changes.updated) {
    for (const pair of Object.values(changes.updated)) {
      toPut.push(Array.isArray(pair) ? pair[1] : pair)
    }
  }
  if (changes.removed) for (const rec of Object.values(changes.removed)) toRemove.push(rec.id)
  store.mergeRemoteChanges(() => {
    if (toPut.length) store.put(toPut)
    if (toRemove.length) store.remove(toRemove)
  })
}

const isEmptyDiff = (d) =>
  !d ||
  ((!d.added || !Object.keys(d.added).length) &&
    (!d.updated || !Object.keys(d.updated).length) &&
    (!d.removed || !Object.keys(d.removed).length))

/**
 * Real-time collaborative tldraw store synced over Socket.IO.
 *
 * Returns a TLStoreWithStatus: `{ status: 'loading' }` until the initial
 * document state is established, then `{ status: 'synced-remote', store }`.
 */
export function useSyncStore({ socket, connected, roomId, userId, userName, seeding }) {
  const store = useMemo(
    () => createTLStore({ shapeUtils: defaultShapeUtils, bindingUtils: defaultBindingUtils }),
    []
  )
  const [status, setStatus] = useState({ status: 'loading' })

  useEffect(() => {
    if (!socket || !connected || !roomId || !seeding || !userId) return

    let disposed = false
    const cleanups = []
    let ready = false
    const pendingRemote = [] // remote diffs that arrive before base state is loaded

    const startSyncing = () => {
      if (disposed || ready) return

      // Flush any diffs buffered while the base state was loading.
      for (const changes of pendingRemote) applyChanges(store, changes)
      pendingRemote.length = 0

      // Attach the local (source: 'user') document listener AFTER the base
      // state is in place, so seeding/loading is never rebroadcast as edits.
      // tldraw already coalesces changes per transaction, so we emit directly:
      // no rAF batching (which Chrome pauses in background tabs, silently
      // stranding a backgrounded user's edits) and nothing is dropped.
      const unlistenDoc = store.listen(
        (update) => {
          if (!isEmptyDiff(update.changes)) {
            socket.emit('store:update', { changes: update.changes })
          }
        },
        { source: 'user', scope: 'document' }
      )
      cleanups.push(unlistenDoc)

      // --- Presence (cursors): last-write-wins throttle is fine to drop. ---
      const presenceId = InstancePresenceRecordType.createId(userId)
      const userPrefs = atom('presenceUser', {
        id: userId,
        color: colorForId(userId),
        name: userName || `User-${userId.substring(0, 5)}`,
      })
      const presence$ = createPresenceStateDerivation(userPrefs, presenceId)(store)

      let lastPresenceAt = 0
      let presenceTimer = null
      const emitPresence = () => {
        const presence = presence$.get()
        if (presence) socket.emit('presence:update', { presence })
      }
      const stopPresence = react('emitPresence', () => {
        const presence = presence$.get() // subscribe
        if (!presence) return
        const now = Date.now()
        const elapsed = now - lastPresenceAt
        if (elapsed >= 60) {
          lastPresenceAt = now
          emitPresence()
        } else if (!presenceTimer) {
          presenceTimer = setTimeout(() => {
            presenceTimer = null
            lastPresenceAt = Date.now()
            emitPresence()
          }, 60 - elapsed)
        }
      })
      cleanups.push(() => {
        stopPresence()
        if (presenceTimer) clearTimeout(presenceTimer)
      })

      ready = true
      setStatus({ status: 'synced-remote', connectionStatus: 'online', store })
    }

    // --- Establish the initial document state (seeding handshake). ---
    if (seeding.needsInit) {
      // We are the initializer: seed the room from our fresh store.
      socket.emit('store:init', { snapshot: store.getStoreSnapshot() })
      startSyncing()
    } else if (seeding.snapshot) {
      // Room already seeded: adopt its document (and its shared page ids).
      loadSnapshot(store, seeding.snapshot)
      startSyncing()
    } else {
      // Waiting for the room to be seeded. Pull the *current* snapshot once it
      // exists; also react to a promotion if the initializer disconnects.
      const requestSnapshot = () => {
        socket.emit('store:request-snapshot', {}, (resp) => {
          if (disposed || ready) return
          if (resp && resp.snapshot) {
            loadSnapshot(store, resp.snapshot)
            startSyncing()
          }
        })
      }
      const onSeeded = () => requestSnapshot()
      const onPleaseInit = () => {
        if (disposed || ready) return
        socket.emit('store:init', { snapshot: store.getStoreSnapshot() })
        startSyncing()
      }
      socket.on('store:seeded', onSeeded)
      socket.on('store:please-init', onPleaseInit)
      cleanups.push(() => {
        socket.off('store:seeded', onSeeded)
        socket.off('store:please-init', onPleaseInit)
      })
      requestSnapshot() // in case the room was seeded before we started listening
    }

    // --- Incoming document diffs (buffered until base state is ready). ---
    const onStoreUpdate = ({ changes }) => {
      if (ready) applyChanges(store, changes)
      else pendingRemote.push(changes)
    }
    // --- Incoming presence. ---
    const onPresenceUpdate = ({ presence }) => {
      if (presence) store.mergeRemoteChanges(() => store.put([presence]))
    }
    const onPresenceLeave = ({ userId: leftId }) => {
      const pid = InstancePresenceRecordType.createId(leftId)
      store.mergeRemoteChanges(() => store.remove([pid]))
    }
    socket.on('store:update', onStoreUpdate)
    socket.on('presence:update', onPresenceUpdate)
    socket.on('presence:leave', onPresenceLeave)

    return () => {
      disposed = true
      socket.off('store:update', onStoreUpdate)
      socket.off('presence:update', onPresenceUpdate)
      socket.off('presence:leave', onPresenceLeave)
      cleanups.forEach((fn) => fn())
    }
  }, [socket, connected, roomId, userId, userName, seeding, store])

  return status
}
