# CanvasX - Real-time Collaborative Whiteboard

A production-ready real-time collaborative whiteboard application where teams can create or join drawing rooms using unique room codes and 1-click invite links to draw together live on an infinite canvas. Drawing, shapes, text, and cursors sync seamlessly in real time via **tldraw's multiplayer store** over **Socket.IO**. Includes live attention tools such as **Laser Pointer** and **Radar Ping**.

---

## 🎨 Features

### Core Collaboration
- ✨ **Real-time Co-Drawing** — Instant bi-directional document sync across all room collaborators via tldraw store diffs.
- 🔑 **Unique Room Codes & Invite Links** — Spontaneously create rooms with codes (e.g. `ART-4821`) or join via shareable URL (`?room=CODE`).
- ⏳ **5-Minute Single-User Discard Timer** — Rooms with only 1 participant show a live countdown banner and automatically discard after 5 minutes of inactivity; the timer automatically resets as soon as a teammate joins.
- 🛡️ **Empty Room Grace Period** — 60-second grace window before deleting an empty room, ensuring browser refreshes (`F5`/`Cmd+R`) and transient network reconnects never destroy active boards.
- 👥 **Live Collaborator Cursors & Roster** — Real-time cursor coordinates and presence names rendered directly on the infinite canvas.
- 🔄 **Automatic Reconnection** — Client-side reconnection with state unioning so edits made during offline blips automatically reconcile.

### Live Attention & Presentation Tools
- 🔴 **Laser Pointer (Hotkey: `L` or Button)** — Draw glowing vector pointer trails that smoothly fade away after 1.5 seconds. Perfect for guiding attention during meetings without dirtying the permanent canvas.
- 📡 **Radar Ping (`Alt + Click` or Button)** — Send expanding sonar ripple animations accompanied by an synthesized audio chime and a branded name badge to direct everyone's focus to any coordinate on the board.

### Drawing Capabilities (via tldraw)
- **Tools**: Freehand Draw, Eraser, Line & Arrow, Rectangle, Ellipse, Triangle, Star, Sticky Notes, Text, Frames, Hand Pan, and Select/Transform.
- **Styling**: Color palette, stroke width, fill patterns, dashed borders, and text alignment.
- **Canvas**: Infinite vector canvas, fluid pan & zoom, touch & stylus support.
- **Export**: Export selection or entire canvas to PNG, SVG, or JSON.

---

## 🚀 Tech Stack

### Frontend
- **React 18** — Component architecture & UI state
- **Vite 5** — High-speed build tool and development server
- **tldraw** — Infinite collaborative canvas engine
- **Socket.IO Client (v4)** — Real-time WebSocket connection
- **Tailwind CSS** — Modern responsive utility-first design
- **Lucide React** — Minimalist UI icons

### Backend
- **Node.js (LTS)** — Event-driven runtime
- **Express** — HTTP server and health check endpoints
- **Socket.IO (v4)** — WebSocket event handling & room management
- **UUID & NanoID** — Room & user identifier generation
- **CORS** — Configurable cross-origin resource sharing

### DevOps & Infrastructure
- **Docker & Docker Compose** — Multi-stage production containerization
- **Nginx** — Reverse proxy & static SPA asset caching
- **Render / Vercel** — One-click cloud deployment configuration

---

## 📋 Requirements

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

---

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/pithva007/Drawing.git
cd Drawing
```

### 2. Install Dependencies
Using make:
```bash
make install
```
Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Start Development Servers

Run backend and frontend in separate terminals:

**Terminal 1 (Backend - Port 3001):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📖 How It Works

### Creating or Joining a Room
1. **Create Room**:
   - Enter your display name.
   - Click **Create Room & Start Drawing**.
   - A unique Room Code (e.g. `ART-4821`) is generated, and the browser address bar syncs to `/?room=ART-4821`.
   - Click the **Share** or **Room Code** button in the top bar to copy an instant invite link.
2. **Join Room**:
   - Paste or enter the room code shared by your teammate.
   - Enter your display name and click **Join Room**.
   - When opening an invite link (`/?room=CODE`), the room code is pre-filled automatically.

### Solo Room Auto-Discard & Grace Window
- **Single-User Discard**: When you are the only user in a room, a banner alerts you that the room will auto-close in 5 minutes unless another collaborator joins.
- **Grace Period**: If all participants leave or disconnect (e.g. browser reload), the backend preserves the room and its whiteboard state for 60 seconds (`EMPTY_ROOM_GRACE_PERIOD_MS`). Reconnecting within this window restores the drawing intact.

---

## 🔧 Environment Variables

### Backend (`server/.env`)
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Room limits
MAX_USERS_PER_ROOM=50

# Grace period before empty room deletion (milliseconds)
EMPTY_ROOM_GRACE_PERIOD_MS=60000
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

## 📦 Project Structure

```
Drawing/
├── client/                           # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx     # Graceful error fallback
│   │   │   ├── LaserAndPingOverlay.jsx # Laser trail & radar ping canvas
│   │   │   └── Toast.jsx             # Notification toasts
│   │   ├── context/
│   │   │   ├── SocketContext.jsx     # Socket.IO connection provider
│   │   │   └── WhiteboardContext.jsx # Room session & identity provider
│   │   ├── hooks/
│   │   │   ├── useSyncStore.js       # tldraw multiplayer store synchronization
│   │   │   ├── useSocketEvents.js    # Room events & discard handlers
│   │   │   └── useToast.js           # Toast notification hook
│   │   ├── pages/
│   │   │   ├── JoinPage.jsx          # Create / Join room landing page
│   │   │   └── WhiteboardPage.jsx    # Infinite canvas workspace & controls
│   │   ├── styles/
│   │   │   └── globals.css           # Tailwind directives & custom animations
│   │   ├── App.jsx                   # Page router
│   │   └── main.jsx                  # Application entry point
│   ├── index.html                    # HTML template
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                           # Express + Socket.IO Backend
│   ├── src/
│   │   ├── rooms/
│   │   │   └── RoomManager.js        # Room lifecycle, snapshot storage & timers
│   │   ├── socket/
│   │   │   └── handlers.js           # Real-time WebSocket event dispatchers
│   │   ├── utils/
│   │   │   └── constants.js          # Shared socket events & default thresholds
│   │   └── index.js                  # Express HTTP and WebSocket server entry
│   ├── package.json
│   └── .env.example
│
├── Dockerfile.client                 # Multi-stage Nginx client container
├── Dockerfile.server                 # Node 20 backend container
├── docker-compose.yml                # Multi-service local stack
├── Makefile                          # Development & operational tasks
├── nginx.conf                        # SPA routing & security headers config
└── render.yaml                       # Cloud infrastructure specification
```

---

## 🔌 Socket.IO Event Reference

### Room Lifecycle
| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | Client → Server | `{ name }` | Generates a new room and returns `{ roomId, roomCode, userId }`. |
| `room:join` | Client → Server | `{ roomCode, name }` | Joins existing room; returns current document snapshot. |
| `room:leave` | Client → Server | _none_ | Explicitly departs current room. |
| `room:user-joined` | Server → Client | `{ user, users }` | Broadcast when a collaborator enters the room. |
| `room:user-left` | Server → Client | `{ userId, users }` | Broadcast when a collaborator exits or disconnects. |
| `room:timer-started` | Server → Client | `{ singleUserDiscardAt }` | Signals start of the 5-minute solo discard countdown. |
| `room:timer-cancelled`| Server → Client | _none_ | Signals that 2+ collaborators are present; cancels discard timer. |
| `room:discarded` | Server → Client | `{ message }` | Dispatched to remaining user when solo room expires. |

### Document Synchronization (tldraw Store)
| Event | Direction | Payload | Description |
|---|---|---|---|
| `store:init` | Client → Server | `{ roomId, snapshot }` | Initializer seeds the authoritative room document. |
| `store:seeded` | Server → Client | _none_ | Broadcast to waiting peers that document is seeded. |
| `store:request-snapshot` | Client → Server | `{ roomId }` | Requests full room document state from server. |
| `store:update` | Bi-directional | `{ roomId, updates }` | Broadcasts document record diffs (shapes, bindings, assets). |

### Real-Time Presentation & Attention
| Event | Direction | Payload | Description |
|---|---|---|---|
| `presence:update` | Bi-directional | `{ roomId, presence }` | Relays live cursor position and user color (ephemeral). |
| `presence:leave` | Bi-directional | `{ roomId, userId }` | Cleans up cursor upon user departure. |
| `laser:points` | Bi-directional | `{ roomId, userId, points, color }` | Relays real-time laser pointer coordinates. |
| `ping:create` | Bi-directional | `{ roomId, point, color, userName }`| Triggers sonar ripple animation and chime at coordinates. |

---

## 🐳 Docker Deployment

Run the complete multi-container stack locally with Docker Compose:

```bash
docker compose up --build -d
```

- **Frontend**: `http://localhost`
- **Backend**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`

To stop services:
```bash
docker compose down
```

---

## 🔒 Security & Best Practices

- **Zero-Storage Privacy**: Whiteboards live strictly in transient memory. Room documents are cleared after inactivity, ensuring no sensitive sketches linger on disk.
- **Security Headers**: Production Nginx configuration enforces `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `X-XSS-Protection`.
- **CORS Protection**: Socket.IO and Express HTTP endpoints validate origin headers against `CLIENT_URL`.
- **Room Capacity Limits**: Configurable per-room participant ceilings protect system resources against connection flooding.

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

**Built with ❤️ for fluid real-time visual collaboration.**
