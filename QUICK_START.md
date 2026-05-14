# Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+ and npm installed

### Step 1: Clone Repository
```bash
git clone https://github.com/pithva007/Drawing.git
cd Drawing
```

### Step 2: Automated Setup (macOS/Linux)
```bash
chmod +x setup.sh
./setup.sh
```

Or on Windows:
```bash
setup.bat
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Step 4: Open in Browser
Visit: `http://localhost:5173`

## 🎮 How to Use

1. **Enter a room password** (any text you want)
2. **Click "Join Room"** - Room is created if it doesn't exist
3. **Share the password** with another person
4. They enter the same password and click "Join Room"
5. **Start drawing together!** 🎨

## 📚 Command Reference

### Backend Commands
```bash
cd server

# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Check server status
curl http://localhost:3001/health
```

### Frontend Commands
```bash
cd client

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Using Make (macOS/Linux)
```bash
make dev-server    # Start backend
make dev-client    # Start frontend
make install       # Install all dependencies
make clean         # Clean all artifacts
make help          # Show all commands
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
**Solution:**
1. Check backend is running: `curl http://localhost:3001/health`
2. If not, run: `cd server && npm run dev`
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Issue: "npm: command not found"
**Solution:**
1. Install Node.js from https://nodejs.org (v18+)
2. Run: `node --version` to verify

### Issue: "Port already in use"
**Solution:**
```bash
# macOS/Linux
lsof -i :3001  # Find process
kill -9 <PID>  # Kill process

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Issue: "Drawing not syncing"
**Solution:**
1. Check browser console for errors (F12)
2. Verify both users are in the same room (same password)
3. Check network tab for Socket.IO connection
4. Try refreshing both pages

## 🚀 Production Deployment

### Deploy Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render.com
3. Connect your repo, set:
   - Build: `npm install`
   - Start: `npm start`
   - Root Directory: `server`
4. Add environment variables
5. Deploy!

### Deploy Frontend (Vercel)
1. Push code to GitHub
2. Create new project on Vercel
3. Set root directory: `client`
4. Deploy!

## 📖 Full Documentation

See [README.md](README.md) for comprehensive documentation.

## 🤝 Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details
- Open an issue on GitHub
- Review error logs in browser console

## 🎓 Key Concepts

### Room System
- Rooms are identified by **password only**
- No login required
- Any password creates or joins a room
- Max 2 users per room

### Real-time Sync
- Uses **Socket.IO** for live updates
- Changes sync instantly across users
- Automatic reconnection on network issues

### Drawing
- Uses **tldraw** library
- Full drawing, shape, and text tools
- Infinite canvas with zoom/pan
- Export to PNG or JSON

---

**Ready to draw together? Let's go! 🎨**
