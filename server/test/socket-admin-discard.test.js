import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'http'
import { Server } from 'socket.io'
import { RoomManager } from '../src/rooms/RoomManager.js'
import { setupSocketHandlers } from '../src/socket/handlers.js'

test('Socket.IO room admin and discard integration flow', async (t) => {
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

  // 1. Admin connects and creates room
  const adminSocket = Client(`http://localhost:${port}`)
  await new Promise((resolve) => adminSocket.on('connect', resolve))

  const createRes = await new Promise((resolve) => {
    adminSocket.emit('room:create', { name: 'AdminAlice' }, resolve)
  })

  assert.equal(createRes.success, true)
  assert.equal(createRes.isAdmin, true)
  assert.equal(createRes.adminId, adminSocket.id)
  assert.equal(createRes.users.length, 1)
  assert.equal(createRes.users[0].isAdmin, true)

  const roomCode = createRes.roomCode

  // 2. Collaborator joins
  const userSocket = Client(`http://localhost:${port}`)
  await new Promise((resolve) => userSocket.on('connect', resolve))

  const joinRes = await new Promise((resolve) => {
    userSocket.emit('room:join', { roomCode, name: 'Bob' }, resolve)
  })

  assert.equal(joinRes.success, true)
  assert.equal(joinRes.isAdmin, false)
  assert.equal(joinRes.adminId, adminSocket.id)
  assert.equal(joinRes.users.length, 2)

  // 3. Non-admin tries to discard room -> REJECTED
  const unauthorizedDiscard = await new Promise((resolve) => {
    userSocket.emit('room:discard', resolve)
  })
  assert.equal(unauthorizedDiscard.success, false)
  assert.equal(unauthorizedDiscard.message, 'Only the room admin can discard this room')

  // 4. Admin discards room -> BOTH receive room:discarded event
  const adminDiscardPromise = new Promise((resolve) => {
    adminSocket.on('room:discarded', (data) => resolve(data))
  })
  const userDiscardPromise = new Promise((resolve) => {
    userSocket.on('room:discarded', (data) => resolve(data))
  })

  const adminDiscardRes = await new Promise((resolve) => {
    adminSocket.emit('room:discard', resolve)
  })
  assert.equal(adminDiscardRes.success, true)

  const [adminDiscardEvent, userDiscardEvent] = await Promise.all([
    adminDiscardPromise,
    userDiscardPromise,
  ])

  assert.equal(adminDiscardEvent.roomCode, roomCode)
  assert.equal(userDiscardEvent.roomCode, roomCode)
  assert.match(userDiscardEvent.message, /discarded/i)

  // Room should be gone from roomManager
  assert.equal(roomManager.getRoomByCode(roomCode), undefined)

  adminSocket.disconnect()
  userSocket.disconnect()
})

test('Socket.IO admin transfer when admin leaves and successor discards room', async (t) => {
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

  // 2. Collaborator joins
  const userSocket = Client(`http://localhost:${port}`)
  await new Promise((resolve) => userSocket.on('connect', resolve))

  const joinRes = await new Promise((resolve) => {
    userSocket.emit('room:join', { roomCode, name: 'Bob' }, resolve)
  })
  assert.equal(joinRes.isAdmin, false)

  // 3. Admin leaves -> userSocket should receive room:admin-changed
  const adminChangedPromise = new Promise((resolve) => {
    userSocket.on('room:admin-changed', (data) => resolve(data))
  })

  adminSocket.emit('room:leave')

  const adminChangedData = await adminChangedPromise
  assert.equal(adminChangedData.adminId, userSocket.id)
  assert.equal(adminChangedData.users.find((u) => u.id === userSocket.id).isAdmin, true)

  // 4. Now the promoted user can discard the room!
  const discardRes = await new Promise((resolve) => {
    userSocket.emit('room:discard', resolve)
  })
  assert.equal(discardRes.success, true)
  assert.equal(roomManager.getRoomByCode(roomCode), undefined)

  adminSocket.disconnect()
  userSocket.disconnect()
})
