# Architecture & Technical Stack

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components                                    │   │
│  │  - JoinPage (Room entry)                            │   │
│  │  - WhiteboardPage (Canvas)                          │   │
│  │  - Toolbar (Tool selection)                         │   │
│  │  - UserPresence (Live users)                        │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  Context Providers                                  │   │
│  │  - SocketContext (Socket.IO connection)             │   │
│  │  - WhiteboardContext (Canvas state)                 │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  Services & Hooks                                   │   │
│  │  - useSocket (Socket events)                        │   │
│  │  - useToast (Notifications)                         │   │
│  │  - SocketService (Event management)                 │   │
│  └────────────────┬─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ Socket.IO
                    │ (WebSocket)
                    │
┌─────────────────────────────────────────────────────────────┐
│                    Server (Express)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Socket.IO Handler                                  │   │
│  │  - Room join/leave                                  │   │
│  │  - Drawing events                                   │   │
│  │  - Canvas state sync                                │   │
│  │  - User presence                                    │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  Room Manager                                       │   │
│  │  - Room CRUD operations                             │   │
│  │  - User management                                  │   │
│  │  - State storage                                    │   │
│  │  - Cleanup logic                                    │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  Express Routes                                     │   │
│  │  - /health (Server status)                          │   │
│  │  - /api/stats (Statistics)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Room Join Flow
```
1. User enters password on JoinPage
2. Socket emits 'room:join' event
3. Server RoomManager processes:
   - Gets or creates room with password
   - Validates room not full (max 2 users)
   - Adds user to room
   - Returns roomId and current state
4. Client stores roomId and navigates to WhiteboardPage
5. Server broadcasts 'room:user-joined' to other users
```

### Drawing Sync Flow
```
1. User draws on canvas
2. tldraw emits change event
3. Component emits 'draw:update' via socket
4. Server broadcasts to room:
   - Stores drawing state in room
   - Sends to all other users in room
5. Other clients receive update and render
6. Multiple users see changes in real-time
```

### User Disconnect Flow
```
1. User closes browser/loses connection
2. Socket disconnects
3. Server 'room:leave' triggered
4. RoomManager removes user from room
5. Server broadcasts 'room:user-left'
6. Other users see presence update
7. If room empty, scheduled for cleanup
```

## Technology Stack Details

### Frontend

**React 18**
- Component-based UI
- Hooks for state management
- Context API for global state
- Functional components throughout

**Vite**
- Lightning-fast development server
- Optimized production builds
- Native ES modules
- Built-in HMR (Hot Module Reloading)

**tldraw**
- Vector drawing library
- Full drawing tool suite
- Infinite canvas support
- Built-in undo/redo
- JSON export/import

**Socket.IO Client**
- Real-time communication
- Automatic reconnection
- Multiple transport fallbacks
- Event-based API

**Tailwind CSS**
- Utility-first styling
- Dark mode support
- Custom animations
- Responsive design

**Lucide React**
- Beautiful icon set
- 350+ icons
- Lightweight
- Tree-shakeable

### Backend

**Node.js**
- JavaScript runtime
- Non-blocking I/O
- NPM ecosystem
- V8 engine

**Express**
- Lightweight HTTP framework
- Routing system
- Middleware support
- Error handling

**Socket.IO**
- Real-time bidirectional communication
- Room/namespace support
- Broadcasting capabilities
- Connection fallbacks

**UUID**
- Unique identifier generation
- For room sessions and events

### DevOps

**Docker**
- Containerization
- Multi-stage builds
- Environment consistency

**Docker Compose**
- Multi-container orchestration
- Local development environment

**Vercel**
- Frontend deployment
- Automatic builds
- Git integration
- Edge functions

**Render**
- Backend deployment
- Auto-scaling
- Persistent storage ready

**Nginx**
- Static file serving
- SPA routing
- Gzip compression
- Reverse proxy

## Performance Optimizations

### Client-side
- **Code splitting** via Vite
- **Image optimization** (lazy loading)
- **Debounced updates** (drawing, cursor)
- **Memoization** of components
- **Virtual scrolling** (if needed)
- **Service workers** (PWA ready)

### Server-side
- **Room cleanup** (inactive room removal)
- **Memory management** (room limits)
- **Event throttling** (cursor updates)
- **Broadcasting optimization** (only to room members)
- **Connection pooling** (ready for DB)

### Network
- **WebSocket** (lower latency)
- **Polling fallback** (compatibility)
- **Message compression** (not enabled, optional)
- **Delta updates** (not full state)

## Security Considerations

### Implemented
- ✅ CORS validation
- ✅ Input sanitization
- ✅ XSS protection (React)
- ✅ CSRF tokens (ready)
- ✅ Room access control
- ✅ User limit enforcement

### Recommended for Production
- 🔒 HTTPS/TLS encryption
- 🔒 Rate limiting middleware
- 🔒 DDoS protection
- 🔒 Authentication layer
- 🔒 Data encryption at rest
- 🔒 API key management
- 🔒 Audit logging

## Scalability

### Current Capacity
- **Per server**: Hundreds of concurrent users
- **Memory usage**: ~1-2 MB per active room
- **Connections**: Limited by Node.js event loop

### Scaling Strategies
1. **Load balancing** - Multiple Express servers
2. **Sticky sessions** - Ensure user stays on same server
3. **Redis adapter** - For Socket.IO rooms
4. **Database** - Move room state to MongoDB
5. **Microservices** - Separate services per domain
6. **Message queue** - For async operations

## Monitoring & Logging

### Current Implementation
- Basic console logging
- Connection tracking
- Room statistics

### Production Setup
- Centralized logging (ELK stack, DataDog)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Distributed tracing (Jaeger)
- Metrics collection (Prometheus)

## Database Integration (Future)

```javascript
// Example MongoDB integration
const room = await Room.findOrCreate(password)
room.users.push(user)
room.save()

// State persistence
await drawingState.save()
```

---

For more information, see the [README.md](README.md) and [API.md](API.md).
