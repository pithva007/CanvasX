import test from 'node:test'
import assert from 'node:assert/strict'
import { Room, RoomManager } from '../src/rooms/RoomManager.js'

test('Room admin assignment and transfer', () => {
  const room = new Room('TEST-1234', 'sess-1')
  assert.equal(room.adminId, null)

  // First user joins and becomes admin
  const user1 = { id: 'u1', name: 'Alice', color: '#ff0000' }
  room.addUser(user1)
  assert.equal(room.adminId, 'u1')

  // Second user joins, admin stays user1
  const user2 = { id: 'u2', name: 'Bob', color: '#00ff00' }
  room.addUser(user2)
  assert.equal(room.adminId, 'u1')

  // Third user joins
  const user3 = { id: 'u3', name: 'Charlie', color: '#0000ff' }
  room.addUser(user3)
  assert.equal(room.adminId, 'u1')

  const users = room.getUsers()
  assert.equal(users.length, 3)
  assert.equal(users.find((u) => u.id === 'u1').isAdmin, true)
  assert.equal(users.find((u) => u.id === 'u2').isAdmin, false)
  assert.equal(users.find((u) => u.id === 'u3').isAdmin, false)

  // Non-admin leaves: admin remains user1
  room.removeUser('u3')
  assert.equal(room.adminId, 'u1')

  // Admin user1 leaves: admin transfers to user2
  room.removeUser('u1')
  assert.equal(room.adminId, 'u2')
  const remainingUsers = room.getUsers()
  assert.equal(remainingUsers.length, 1)
  assert.equal(remainingUsers[0].isAdmin, true)

  // Last user leaves: admin becomes null
  room.removeUser('u2')
  assert.equal(room.adminId, null)
})

test('RoomManager handles room creation, admin tracking, and discardRoom', () => {
  const manager = new RoomManager(50, 1000)
  const room = manager.createRoom('TEST-CODE')

  let discardCalled = false
  let discardReason = ''
  manager.setOnRoomDiscard((r, reason) => {
    discardCalled = true
    discardReason = reason
  })

  const user1 = { id: 'user-admin', name: 'Admin', color: '#ff0000' }
  const user2 = { id: 'user-collaborator', name: 'Collaborator', color: '#00ff00' }

  manager.addUserToRoom(room.roomCode, user1)
  manager.addUserToRoom(room.roomCode, user2)

  assert.equal(room.adminId, 'user-admin')

  // Non-admin leaves
  const res1 = manager.removeUserFromRoom('user-collaborator')
  assert.equal(res1.adminChanged, false)
  assert.equal(room.adminId, 'user-admin')

  // Re-add user2
  manager.addUserToRoom(room.roomCode, user2)

  // Admin leaves -> admin transfers to user2
  const res2 = manager.removeUserFromRoom('user-admin')
  assert.equal(res2.adminChanged, true)
  assert.equal(res2.newAdminId, 'user-collaborator')
  assert.equal(room.adminId, 'user-collaborator')

  // Discard room
  const discarded = manager.discardRoom(room.sessionId, 'Manual admin discard')
  assert.equal(discarded, true)
  assert.equal(discardCalled, true)
  assert.equal(discardReason, 'Manual admin discard')
  assert.equal(manager.getRoomByCode('TEST-CODE'), undefined)
  assert.equal(manager.getRoomBySessionId(room.sessionId), undefined)
})
