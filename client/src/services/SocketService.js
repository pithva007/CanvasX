/**
 * Socket service - Manages socket.io connection and events
 */
export class SocketService {
  constructor(socket) {
    this.socket = socket
  }

  // Room events
  joinRoom(password, callback) {
    this.socket.emit('room:join', { password }, callback)
  }

  leaveRoom(roomId) {
    this.socket.emit('room:leave', { roomId })
  }

  getRoomState(callback) {
    this.socket.emit('room:get-state', {}, callback)
  }

  // Drawing events
  sendDrawingUpdate(data) {
    this.socket.emit('draw:update', data)
  }

  clearCanvas() {
    this.socket.emit('draw:clear', {})
  }

  // Canvas events
  updateZoom(zoom) {
    this.socket.emit('canvas:zoom', { zoom })
  }

  updatePan(pan) {
    this.socket.emit('canvas:pan', { pan })
  }

  // Cursor events
  moveCursor(position) {
    this.socket.emit('cursor:move', { position })
  }

  // File events
  uploadImage(fileData, fileName) {
    this.socket.emit('file:upload', { fileData, fileName })
  }

  // Event listeners
  onRoomUserJoined(callback) {
    this.socket.on('room:user-joined', callback)
  }

  onRoomUserLeft(callback) {
    this.socket.on('room:user-left', callback)
  }

  onDrawingUpdate(callback) {
    this.socket.on('draw:update', callback)
  }

  onDrawingClear(callback) {
    this.socket.on('draw:clear', callback)
  }

  onCursorMove(callback) {
    this.socket.on('cursor:move', callback)
  }

  onCanvasZoom(callback) {
    this.socket.on('canvas:zoom', callback)
  }

  onCanvasPan(callback) {
    this.socket.on('canvas:pan', callback)
  }

  onImageUpload(callback) {
    this.socket.on('file:upload', callback)
  }

  // Cleanup
  removeAllListeners() {
    this.socket.removeAllListeners()
  }
}
