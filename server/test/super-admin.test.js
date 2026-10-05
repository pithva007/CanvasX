import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { RoomManager } from '../src/rooms/RoomManager.js'
import { setupSocketHandlers } from '../src/socket/handlers.js'
import {
  verifyAdminPassword,
  createAdminSession,
  validateAdminToken,
  revokeAdminSession,
  getAdminSecretKey,
} from '../src/admin/adminAuth.js'

const clientPath = new URL('../../client/node_modules/socket.io-client/build/esm/index.js', import.meta.url).href
const { io: Client } = await import(clientPath)

test('Admin Auth: password verification and token lifecycle', () => {
  const secret = getAdminSecretKey()
  assert.ok(secret, 'Admin secret key should be defined')
  assert.equal(verifyAdminPassword(secret), true, 'Correct password must verify')
  assert.equal(verifyAdminPassword('wrong-password'), false, 'Wrong password must fail')
  assert.equal(verifyAdminPassword(''), false, 'Empty password must fail')
  assert.equal(verifyAdminPassword(null), false, 'Null password must fail')

  const token = createAdminSession()
  assert.ok(token && token.length === 64, 'Token should be a 64-char hex string')
  assert.equal(validateAdminToken(token), true, 'Valid token should validate')
  assert.equal(validateAdminToken('fake-token'), false, 'Fake token should not validate')

  revokeAdminSession(token)
  assert.equal(validateAdminToken(token), false, 'Revoked token must no longer validate')
})

test('RoomManager: activity logs and global stats tracking', () => {
  const rm = new RoomManager()

  const statsInitial = rm.getGlobalStats()
  assert.equal(statsInitial.activeRooms, 0)
  assert.equal(statsInitial.activeUsers, 0)
  assert.equal(statsInitial.totalShapes, 0)

  const room = rm.createRoom('TEST-ADMIN-1')
  rm.addUserToRoom(room.roomCode, { id: 'u1', name: 'Alice', color: '#ff0000' })

  rm.logActivity({
    type: 'draw',
    roomCode: room.roomCode,
    userId: 'u1',
    userName: 'Alice',
    details: 'Drew a star shape',
  })

  const logs = rm.getActivityLogs(10)
  assert.ok(logs.length >= 1)
  assert.equal(logs[0].type, 'draw')
  assert.equal(logs[0].roomCode, 'TEST-ADMIN-1')
  assert.equal(logs[0].userName, 'Alice')

  const statsAfter = rm.getGlobalStats()
  assert.equal(statsAfter.activeRooms, 1)
  assert.equal(statsAfter.activeUsers, 1)

  rm.deleteRoom(room.sessionId)
  assert.equal(rm.getGlobalStats().activeRooms, 0)
})

test('Socket.IO: Super Admin authentication, monitoring, and controls', async () => {
  const httpServer = createServer()
  const io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket'],
  })
  const roomManager = new RoomManager(10, 1000)
  setupSocketHandlers(io, roomManager)

  await new Promise((resolve) => httpServer.listen(0, resolve))
  const port = httpServer.address().port
  const serverUrl = `http://localhost:${port}`

  const adminClient = Client(serverUrl, { transports: ['websocket'] })
  const userClient = Client(serverUrl, { transports: ['websocket'] })

  await Promise.all([
    new Promise((resolve) => adminClient.once('connect', resolve)),
    new Promise((resolve) => userClient.once('connect', resolve)),
  ])

  try {
    // 1. Unauthenticated admin call should fail
    const unauthRes = await new Promise((resolve) => {
      adminClient.emit('admin:get_overview', resolve)
    })
    assert.equal(unauthRes.success, false)

    // 2. Wrong password should fail
    const wrongAuthRes = await new Promise((resolve) => {
      adminClient.emit('admin:auth', { password: 'bad-password' }, resolve)
    })
    assert.equal(wrongAuthRes.success, false)

    // 3. Correct password should authenticate
    const authRes = await new Promise((resolve) => {
      adminClient.emit('admin:auth', { password: getAdminSecretKey() }, resolve)
    })
    assert.equal(authRes.success, true)
    assert.ok(authRes.token)
    assert.ok(Array.isArray(authRes.rooms))
    assert.ok(authRes.stats)

    // 4. Regular user creates a room -> admin receives activity
    const activityPromise = new Promise((resolve) => {
      adminClient.on('admin:activity', (entry) => {
        if (entry.type === 'room_create') resolve(entry)
      })
    })

    const createRes = await new Promise((resolve) => {
      userClient.emit('room:create', { name: 'Bob' }, resolve)
    })
    assert.equal(createRes.success, true)
    const roomCode = createRes.roomCode

    const capturedActivity = await activityPromise
    assert.equal(capturedActivity.roomCode, roomCode)
    assert.equal(capturedActivity.userName, 'Bob')

    // 5. Admin broadcasts announcement -> userClient receives it
    const announcementPromise = new Promise((resolve) => {
      userClient.on('system:announcement', (ann) => resolve(ann))
    })

    const broadcastRes = await new Promise((resolve) => {
      adminClient.emit('admin:broadcast_announcement', {
        message: 'System upgrade in 10 minutes!',
        level: 'warning',
      }, resolve)
    })
    assert.equal(broadcastRes.success, true)

    const ann = await announcementPromise
    assert.equal(ann.message, 'System upgrade in 10 minutes!')
    assert.equal(ann.level, 'warning')

    // 6. Admin force-discards room -> userClient receives room:discarded
    const discardedPromise = new Promise((resolve) => {
      userClient.on('room:discarded', (data) => resolve(data))
    })

    const forceDiscardRes = await new Promise((resolve) => {
      adminClient.emit('admin:force_discard_room', {
        roomCode,
        reason: 'Super Admin manual purge',
      }, resolve)
    })
    assert.equal(forceDiscardRes.success, true)

    const discardEvent = await discardedPromise
    assert.equal(discardEvent.roomCode, roomCode)
    assert.ok(discardEvent.message.includes('Super Admin manual purge'))

    // 7. Force-kick test: create another room with 2 users, admin kicks one
    const userClient2 = Client(serverUrl, { transports: ['websocket'] })
    await new Promise((resolve) => userClient2.once('connect', resolve))

    const createRes2 = await new Promise((resolve) => {
      userClient.emit('room:create', { name: 'HostAlice' }, resolve)
    })
    const roomCode2 = createRes2.roomCode

    const joinRes = await new Promise((resolve) => {
      userClient2.emit('room:join', { roomCode: roomCode2, name: 'GuestCharlie' }, resolve)
    })
    assert.equal(joinRes.success, true)
    const kickedUserId = joinRes.userId

    const kickedPromise = new Promise((resolve) => {
      userClient2.on('room:kicked', (kicked) => resolve(kicked))
    })

    const kickRes = await new Promise((resolve) => {
      adminClient.emit('admin:force_kick_user', {
        roomCode: roomCode2,
        userId: kickedUserId,
        reason: 'Violated platform rules',
      }, resolve)
    })
    assert.equal(kickRes.success, true)

    const kickedData = await kickedPromise
    assert.equal(kickedData.roomCode, roomCode2)
    assert.ok(kickedData.message.includes('Violated platform rules'))

    // 8. Inspect room test
    const inspectRes = await new Promise((resolve) => {
      adminClient.emit('admin:inspect_room', { roomCode: roomCode2 }, resolve)
    })
    assert.equal(inspectRes.success, true)
    assert.equal(inspectRes.room.roomCode, roomCode2)
    assert.ok(inspectRes.snapshotMeta)

    userClient2.disconnect()
  } finally {
    adminClient.disconnect()
    userClient.disconnect()
    await new Promise((resolve) => io.close(resolve))
    await new Promise((resolve) => httpServer.close(resolve))
  }
})
