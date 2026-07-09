# DrawTogether - Real-time Collaborative Whiteboard

A production-ready real-time collaborative whiteboard application where multiple users can join the same drawing room using only a password and draw together live on an infinite canvas. Drawing, shapes, text and cursors sync in real time via tldraw's multiplayer store over Socket.IO.

## 🎨 Features

### Core Features
- ✨ **Real-time Collaboration** - Live drawing synchronization across all users in a room
- 🔐 **Password-based Rooms** - Simple room creation and joining with password
- 🎯 **Infinite Canvas** - Unlimited drawing space with zoom and pan
- 🎨 **Complete Drawing Tools** - Pencil, eraser, shapes, text, and more
- 👥 **User Presence** - Live cursor tracking and user connection indicators
- 📊 **Performance Optimized** - Efficient state management and network communication

### Drawing Tools
- **Pencil** - Freehand drawing
- **Eraser** - Remove content
- **Highlighter** - Semi-transparent marker
- **Line/Arrow** - Straight lines and arrows
- **Shapes** - Rectangle, circle/ellipse
- **Text Tool** - Add text annotations
- **Sticky Notes** - Quick note creation
- **Selection Tool** - Select and move objects
- **Undo/Redo** - History management
- **Clear Canvas** - Clear all content

### Customization
- **Color Picker** - Custom stroke and fill colors
- **Stroke Width** - Adjustable line thickness
- **Dashed Lines** - Alternative line styles
- **Fill Colors** - Shape fill customization
- **Zoom/Pan** - Canvas navigation
- **Dark/Light Mode** - Theme switching

### Export
- **PNG Export** - Download as image
- **JSON Export** - Save/restore state
- **PDF Export** - Document generation (can be added)

### Collaboration
- **Live Cursors** - See where others are drawing
- **Presence Indicators** - Know when users connect/disconnect
- **Automatic Sync** - Real-time updates
- **Auto-reconnect** - Handle network disconnections
- **Room State Persistence** - Restore on reconnection

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **tldraw** - Drawing library
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.IO** - Real-time events
- **UUID** - Unique identifiers
- **CORS** - Cross-origin handling

### DevOps
- **Vercel** - Frontend deployment
- **Render** - Backend deployment
- **Docker** - Containerization (optional)

## 📋 Requirements

- Node.js 18+
- npm 9+

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/pithva007/Drawing.git
cd Drawing
```

### 2. Setup Backend

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev

# Or start production server
npm start
```

Backend will run on `http://localhost:3001`

### 3. Setup Frontend

In a new terminal:

```bash
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📖 Usage

### Local Development

1. **Start Backend**
```bash
cd server
npm run dev
```

2. **Start Frontend**
```bash
cd client
npm run dev
```

3. **Open Browser**
- Navigate to `http://localhost:5173`

4. **Join Room**
- Enter any password (e.g., "password123")
- Click "Join Room"
- Room is created if it doesn't exist
- Share password with someone else to collaborate

### Room Rules
- Configurable capacity per room (default **50**, set via `MAX_USERS_PER_ROOM`)
- Any password creates or joins a room
- Room (and its drawing) persists as long as at least one user is connected
- Empty rooms are cleaned up after 1 hour of inactivity
- Password is not stored persistently (session only)

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
# Max users allowed in a single room (default 50)
MAX_USERS_PER_ROOM=50
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## 📦 Project Structure

```
Drawing/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/          # Context providers
│   │   │   ├── SocketContext.jsx      # Socket.IO connection
│   │   │   └── WhiteboardContext.jsx  # Room/user session state
│   │   ├── hooks/            # Custom hooks
│   │   │   ├── useSyncStore.js        # tldraw multiplayer store sync
│   │   │   ├── useSocketEvents.js     # room roster updates
│   │   │   └── useToast.js
│   │   ├── pages/            # Page components
│   │   │   ├── JoinPage.jsx
│   │   │   └── WhiteboardPage.jsx
│   │   ├── styles/           # CSS
│   │   │   └── globals.css
│   │   ├── App.jsx           # Main app
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static files
│   ├── index.html            # HTML template
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── server/                   # Express backend
    ├── src/
    │   ├── socket/          # Socket.IO handlers
    │   │   └── handlers.js
    │   ├── rooms/           # Room management
    │   │   └── RoomManager.js
    │   ├── middleware/      # Express middleware
    │   ├── utils/           # Utility functions
    │   └── index.js         # Server entry
    ├── package.json
    ├── .env                 # Environment config
    └── .gitignore
```

## 🎯 Key Features Implementation

### Room System
- Rooms identified by password
- Auto-generated unique session ID internally
- Authoritative document snapshot stored server-side (in memory)
- Inactive rooms cleaned up automatically
- Configurable room capacity (`MAX_USERS_PER_ROOM`)

### Real-time Sync (tldraw DIY multiplayer)
The whiteboard uses tldraw's document store synced over Socket.IO:

1. **Seeding handshake** — the first user into an empty room is the *initializer*
   and seeds the room's document snapshot (`store:init`). Everyone else either
   receives the current snapshot on join, or (if a seed is in progress) waits for
   `store:seeded` and pulls the up-to-date snapshot (`store:request-snapshot`).
   If the initializer disconnects before seeding, another user is promoted.
2. **Live edits** — local document changes (`store.listen`, `source: 'user'`) are
   emitted as diffs (`store:update`), folded into the room snapshot so late
   joiners stay current, and applied on peers via `store.mergeRemoteChanges`
   (which tags them `remote`, preventing rebroadcast loops).
3. **Presence** — cursors flow as `presence:update` (throttled, last-write-wins)
   and are relayed but never persisted; `presence:leave` removes a cursor.

This design converges correctly even when two users open the same fresh room
simultaneously (verified by an end-to-end two-browser test).

### User Presence
- Live cursor tracking with names (tldraw collaborator cursors)
- User join/leave updates the room roster
- Live user count in the room bar

## ⚠️ Known Limitations
- **In-memory only** — a room's drawing lives in server memory and is lost when
  the room empties (matches the no-database design). Add a persistence layer if
  you need durable boards.
- **Single-node** — real horizontal scaling across multiple server instances
  requires the [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/);
  a single instance is assumed here.
- **Reconnection** — after a dropped connection, Socket.IO reconnects with a new
  socket id and the old room membership has already been released server-side, so
  the client should rejoin the room to resume syncing. Automatic session recovery
  is not yet implemented.

## 🌐 Deployment

### Backend Deployment (Render)

1. **Connect GitHub Repository**
   - Sign in to Render
   - Create new Web Service
   - Connect Drawing repository

2. **Configure**
   ```
   Build Command: npm install
   Start Command: npm start
   Environment: Node
   ```

3. **Set Environment Variables**
   ```
   PORT=3001
   NODE_ENV=production
   CLIENT_URL=https://yourdomain.com
   ```

### Frontend Deployment (Vercel)

1. **Connect GitHub Repository**
   - Sign in to Vercel
   - Create new project from Drawing/client

2. **Configure**
   - Root Directory: client
   - Build Command: npm run build
   - Output Directory: dist

3. **Set Environment Variables**
   ```
   VITE_SOCKET_URL=https://your-backend.onrender.com
   VITE_API_URL=https://your-backend.onrender.com
   ```

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security

### Implemented
- ✅ CORS configuration
- ✅ Input validation
- ✅ Room access control
- ✅ User overflow prevention
- ✅ Socket event validation
- ✅ XSS protection via React

### Recommendations
- Use HTTPS in production
- Implement rate limiting
- Add user authentication (optional)
- Sanitize user input
- Use environment variables for secrets

## 📊 API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "activeRooms": 5,
  "activeUsers": 8
}
```

### Statistics
```
GET /api/stats
```
Response:
```json
{
  "rooms": 5,
  "users": 8,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔌 Socket.IO Events

### Client → Server

#### Room Management
- `room:join` - Join room with password
- `room:leave` - Leave current room
- `room:get-state` - Get current room state

#### Drawing
- `draw:update` - Send drawing update
- `draw:clear` - Clear canvas

#### Canvas Control
- `canvas:zoom` - Update zoom level
- `canvas:pan` - Update pan offset

#### Interaction
- `cursor:move` - Update cursor position
- `file:upload` - Upload image

### Server → Client

#### Room Events
- `room:user-joined` - User joined room
- `room:user-left` - User left room
- `room:full` - Room is full

#### Drawing Events
- `draw:update` - Drawing update received
- `draw:clear` - Canvas cleared

#### Canvas Events
- `canvas:zoom` - Zoom updated
- `canvas:pan` - Pan updated

#### Interaction Events
- `cursor:move` - Cursor moved
- `file:upload` - Image uploaded

## 🚦 Getting Help

### Common Issues

**Connection Failed**
- Check backend is running on port 3001
- Verify CORS settings
- Check firewall rules

**Drawing Not Syncing**
- Check Socket.IO connection in browser console
- Verify room password is same for both users
- Check browser console for errors

**Deployment Issues**
- Verify environment variables are set
- Check logs in deployment platform
- Ensure firewall allows ports 3001, 5173

### Debug Mode
Enable verbose logging in browser console:
```javascript
localStorage.debug = '*'
```

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Khush Pithva

## 🎓 Learning Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs/)
- [tldraw Documentation](https://tldraw.dev/)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# macOS/Linux - Find process on port 3001
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Clear Cache & Reinstall
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Socket Connection Issues
1. Check browser console for errors
2. Verify server is running: `curl http://localhost:3001/health`
3. Check CORS origin matches
4. Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Support

For support, please open an issue on GitHub or contact the author.

---

**Made with ❤️ for real-time collaboration**
