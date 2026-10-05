import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'http'
import { Server } from 'socket.io'
import { RoomManager } from '../src/rooms/RoomManager.js'
import { setupSocketHandlers } from '../src/socket/handlers.js'

test('Socket.IO room kick integration flow', async (t) => {
  const clientPath = new URL('../../client/node_modules/socket.io-client/build/esm/index.js', import.meta.url).href
  const { io: Client } = await import(clientPath)

  const httpServer = http.createServer()
  const ioServer = new Server(httpServer, {
    cors: { origin: '*' },
  })
  const roomManager = new RoomManager(10, 1000)
  setupSocketHandlers(ioServer, roomManager)

  await new Promise((resolve) => httpServer.listen(0, resolve))
  const port = httpServer.address().port

  t.after(async () => {
    ioServer.close()
    await new Promise((resolve) => httpServer.close(resolve))
  })

  // 1. Admin creates room
  const adminSocket = Client(`http://localhost:${port}`)
  await new Promise((resolve) => adminSocket.on('connect', resolve))

  const createRes = await new Promise((resolve) => {
    adminSocket.emit('room:create', { name: 'AdminAlice' }, resolve)
  })
  const roomCode = createRes.roomCode
  assert.equal(createRes.success, true)
  assert.equal(createRes.isAdmin, true)

  // 2. Bob and Charlie join
  const bobSocket = Client(`http://localhost:${port}`)
  await new Promise((resolve) => bobSocket.on('connect', resolve))
  const bobJoinRes = await new Promise((resolve) => {
    bobSocket.emit('room:join', { roomCode, name: 'Bob' }, resolve)
  })
  assert.equal(bobJoinRes.success, true)

  const charlieSocket = Client(`http://localhost:${port}`)
  await new Promise((resolve) => charlieSocket.on('connect', resolve))
  const charlieJoinRes = await new Promise((resolve) => {
    charlieSocket.emit('room:join', { roomCode, name: 'Charlie' }, resolve)
  })
  assert.equal(charlieJoinRes.success, true)

  // 3. Bob (non-admin) tries to kick Charlie -> rejected
  const unauthorizedKick = await new Promise((resolve) => {
    bobSocket.emit('room:kick', { targetUserId: charlieSocket.id }, resolve)
  })
  assert.equal(unauthorizedKick.success, false)
  assert.equal(unauthorizedKick.message, 'Only the room host can kick participants')

  // 4. Admin tries to kick themselves -> rejected
  const selfKick = await new Promise((resolve) => {
    adminSocket.emit('room:kick', { targetUserId: adminSocket.id }, resolve)
  })
  assert.equal(selfKick.success, false)
  assert.equal(selfKick.message, 'You cannot kick yourself')

  // 5. Admin kicks Bob
  const bobKickedPromise = new Promise((resolve) => {
    bobSocket.on('room:kicked', (data) => resolve(data))
  })
  const adminUserLeftPromise = new Promise((resolve) => {
    adminSocket.on('room:user-left', (data) => resolve(data))
  })
  const charlieUserLeftPromise = new Promise((resolve) => {
    charlieSocket.on('room:user-left', (data) => resolve(data))
  })

  const kickRes = await new Promise((resolve) => {
    adminSocket.emit('room:kick', { targetUserId: bobSocket.id }, resolve)
  })
  assert.equal(kickRes.success, true)
  assert.equal(kickRes.kickedUserName, 'Bob')

  // Bob receives kicked notification
  const bobKickedData = await bobKickedPromise
  assert.equal(bobKickedData.roomCode, roomCode)
  assert.match(bobKickedData.message, /removed from the room by the host/i)

  // Admin and Charlie receive room:user-left with Bob removed
  const adminUserLeft = await adminUserLeftPromise
  assert.equal(adminUserLeft.userId, bobSocket.id)
  assert.equal(adminUserLeft.users.length, 2)
  assert.equal(adminUserLeft.users.some((u) => u.id === bobSocket.id), false)

  const charlieUserLeft = await charlieUserLeftPromise
  assert.equal(charlieUserLeft.userId, bobSocket.id)
  assert.equal(charlieUserLeft.users.length, 2)

  // 6. Bob tries to send drawing diffs -> ignored because Bob was kicked
  bobSocket.emit('store:update', { changes: { added: { test: { id: 'test' } } } })
  // Charlie should NOT receive anything
  let charlieGotUpdate = false
  charlieSocket.on('store:update', () => { charlieGotUpdate = true })
  await new Promise((r) => setTimeout(r, 50))
  assert.equal(charlieGotUpdate, false)

  // 7. Bob tries to rejoin using roomCode -> rejected by server
  const rejoinRes = await new Promise((resolve) => {
    bobSocket.emit('room:join', { roomCode, name: 'Bob' }, resolve)
  })
  assert.equal(rejoinRes.success, false)
  assert.match(rejoinRes.message, /removed from this room by the host/i)

  // 8. Admin kicks Charlie: room drops down to 1 user -> 5-min timer starts
  const timerStartedPromise = new Promise((resolve) => {
    adminSocket.on('room:timer-started', (data) => resolve(data))
  })
  const kickCharlieRes = await new Promise((resolve) => {
    adminSocket.emit('room:kick', { targetUserId: charlieSocket.id }, resolve)
  })
  assert.equal(kickCharlieRes.success, true)

  const timerData = await timerStartedPromise
  assert.ok(timerData.discardAt > Date.now())

  adminSocket.disconnect()
  bobSocket.disconnect()
  charlieSocket.disconnect()
})
