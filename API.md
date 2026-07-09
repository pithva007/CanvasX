# API Documentation

## REST Endpoints

### Health Check
```
GET /health
```

Returns the server health status and statistics.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "activeRooms": 5,
  "activeUsers": 10
}
```

### Statistics
```
GET /api/stats
```

Returns current server statistics.

**Response:**
```json
{
  "rooms": 5,
  "users": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Socket.IO Events

### Connection

#### Client Events
- `connect` - Initial connection (automatic)
- `disconnect` - Disconnection (automatic)

#### Server Events
- `connect` - Connection established (automatic)
- `error` - Connection error (automatic)

### Room Management

#### `room:join`
Join or create a room with a password.

**Emit (Client → Server):**
```javascript
socket.emit('room:join', {
  password: 'room123',        // Required: password to join/create room
  roomId: 'session-uuid'      // Optional: existing room session ID
}, (response) => {
  // callback
})
```

**Response:**
```javascript
{
  success: true,                    // true if joined successfully
  roomId: 'session-uuid',          // Unique session ID for the room
  userId: 'socket-id',             // User's unique ID
  roomState: {
    roomId: 'room-password',
    sessionId: ' ',
    users: [                        // Array of users in room
      {
        id: 'user-id',
        socketId: 'socket-id',
        name: 'User-abc123',
        connectedAt: '2024-01-01T00:00:00.000Z',
        cursor: { x: 0, y: 0 }
      }
    ],
    drawing: {},                    // Canvas state
    userCount: 1,
    maxUsers: 2
  }
}
```

#### `room:leave`
Leave the current room.

**Emit (Client → Server):**
```javascript
socket.emit('room:leave', { roomId: 'session-uuid' })
```

#### `room:user-joined`
Broadcasted when a user joins the room.

**Listen (Server → Client):**
```javascript
socket.on('room:user-joined', (data) => {
  console.log(data.user)      // Joined user info
  console.log(data.userCount) // Total users now in room
})
```

#### `room:user-left`
Broadcasted when a user leaves the room.

**Listen (Server → Client):**
```javascript
socket.on('room:user-left', (data) => {
  console.log(data.userId)    // User ID who left
  console.log(data.userCount) // Total users remaining
})
```

#### `room:full`
Sent when attempting to join a full room.

**Listen (Server → Client):**
```javascript
socket.on('room:full', (data) => {
  console.log('Room is full')
})
```

#### `room:get-state`
Get the current room state.

**Emit (Client → Server):**
```javascript
socket.emit('room:get-state', {}, (roomState) => {
  // Current room state
})
```

### Drawing

#### `draw:update`
Send drawing update to other users.

**Emit (Client → Server):**
```javascript
socket.emit('draw:update', {
  type: 'stroke',              // Type of drawing
  points: [[0, 0], [10, 20]],  // Points or data
  color: '#000000',
  width: 2,
  timestamp: Date.now()
})
```

**Listen (Server → Client):**
```javascript
socket.on('draw:update', (data) => {
  console.log(data.userId)     // User who drew
  console.log(data)            // Drawing data
})
```

#### `draw:clear`
Clear the canvas.

**Emit (Client → Server):**
```javascript
socket.emit('draw:clear', {})
```

**Listen (Server → Client):**
```javascript
socket.on('draw:clear', (data) => {
  console.log('Canvas cleared by', data.userId)
})
```

### Canvas Control

#### `canvas:zoom`
Update zoom level.

**Emit (Client → Server):**
```javascript
socket.emit('canvas:zoom', {
  zoom: 1.5  // Zoom level (0.2 to 5)
})
```

**Listen (Server → Client):**
```javascript
socket.on('canvas:zoom', (data) => {
  console.log('Zoom:', data.zoom)
})
```

#### `canvas:pan`
Update pan offset.

**Emit (Client → Server):**
```javascript
socket.emit('canvas:pan', {
  pan: { x: 100, y: 200 }  // Pan offset
})
```

**Listen (Server → Client):**
```javascript
socket.on('canvas:pan', (data) => {
  console.log('Pan:', data.pan)
})
```

### Interaction

#### `cursor:move`
Update cursor position (for live cursor tracking).

**Emit (Client → Server):**
```javascript
socket.emit('cursor:move', {
  position: { x: 300, y: 400 }  // Cursor position
})
```

**Listen (Server → Client):**
```javascript
socket.on('cursor:move', (data) => {
  console.log(`User ${data.userId} cursor at:`, data.position)
})
```

#### `file:upload`
Upload an image to canvas.

**Emit (Client → Server):**
```javascript
socket.emit('file:upload', {
  fileData: 'base64-encoded-string',
  fileName: 'image.png'
})
```

**Listen (Server → Client):**
```javascript
socket.on('file:upload', (data) => {
  console.log('Image uploaded:', data.fileName)
  console.log('From user:', data.userId)
})
```

## Error Handling

### Common Errors

**Room Full**
```javascript
socket.emit('room:join', { password: 'test' }, (response) => {
  if (!response.success) {
    console.error(response.message) // "Room is full"
  }
})
```

**Invalid Password**
```javascript
// Server will reject if password doesn't match existing room
```

**Connection Lost**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server')
})

socket.on('reconnect', () => {
  console.log('Reconnected to server')
})
```

## Rate Limiting

The server currently has basic rate limiting. High-frequency events may be throttled.

**Recommended Intervals:**
- Drawing updates: 30-50ms
- Cursor updates: 50-100ms
- Zoom/Pan: 100-200ms

## Best Practices

1. **Always wait for callbacks** before sending another join
2. **Throttle cursor updates** to reduce network traffic
3. **Handle disconnections gracefully**
4. **Validate data** before emitting
5. **Use unique user IDs** from room state
6. **Respect room limits** (max 2 users)

## Example Usage

```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3001')

// Join room
socket.emit('room:join', { password: 'myroom' }, (response) => {
  if (response.success) {
    console.log('Joined room:', response.roomId)
    console.log('Your ID:', response.userId)
  }
})

// Listen for user joins
socket.on('room:user-joined', (data) => {
  console.log('User joined:', data.user.name)
})

// Send drawing
socket.emit('draw:update', {
  type: 'line',
  points: [[0, 0], [100, 100]],
  color: '#ff0000'
})

// Listen for drawing
socket.on('draw:update', (data) => {
  drawOnCanvas(data)
})

// Leave room
socket.emit('room:leave', {})
```

---

For more information, see the [README.md](README.md).
