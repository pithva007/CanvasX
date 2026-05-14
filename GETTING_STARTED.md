# Getting Started - Complete Guide

## Welcome to DrawTogether! 🎨

A production-ready real-time collaborative whiteboard where you and one other person can draw together instantly using just a password.

## What You're Getting

- ✨ Complete working whiteboard app
- 🔐 Simple password-based room system
- ⚡ Real-time synchronization
- 🎨 Full drawing toolset
- 📱 Mobile responsive
- 🚀 Production-ready code
- 📦 Ready to deploy

## 5-Minute Quick Start

### 1. Prerequisites
Make sure you have **Node.js 18+** installed:
```bash
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

### 2. Clone & Setup
```bash
# Clone repository
git clone https://github.com/pithva007/Drawing.git
cd Drawing

# Automated setup (macOS/Linux)
chmod +x setup.sh
./setup.sh

# Or Windows
setup.bat

# Or manual setup
cd server && npm install
cd ../client && npm install
```

### 3. Start Application
Open **two separate terminal windows**:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
You should see:
```
Server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
You should see:
```
Local: http://localhost:5173
```

### 4. Open Browser
Go to: **http://localhost:5173**

### 5. Test It Out
- **First window**: Enter password "test123" → Click "Join Room"
- **Second window**: Same password "test123" → Click "Join Room"
- **Draw together!** 🎨

---

## Detailed Setup Guide

### macOS Setup

#### 1. Install Node.js
```bash
# Option A: Download from nodejs.org
# https://nodejs.org (v18 LTS recommended)

# Option B: Using Homebrew
brew install node@18
brew link node@18
```

#### 2. Verify Installation
```bash
node --version
npm --version
```

#### 3. Clone Repository
```bash
cd ~/Documents
git clone https://github.com/pithva007/Drawing.git
cd Drawing
```

#### 4. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

#### 5. Start Servers
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Terminal 3 (optional - for monitoring)
curl http://localhost:3001/health
```

### Linux Setup

#### 1. Install Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install nodejs npm

# Verify
node --version
npm --version
```

#### 2. Clone Repository
```bash
cd ~
git clone https://github.com/pithva007/Drawing.git
cd Drawing
```

#### 3. Run Setup
```bash
chmod +x setup.sh
./setup.sh
```

#### 4. Start Services
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

### Windows Setup

#### 1. Install Node.js
- Download from https://nodejs.org (v18 LTS)
- Run installer
- Click "Next" through installation
- Verify: Open Command Prompt, type `node --version`

#### 2. Clone Repository
```cmd
cd Documents
git clone https://github.com/pithva007/Drawing.git
cd Drawing
```

#### 3. Run Setup
```cmd
setup.bat
```

#### 4. Start Servers
```cmd
REM Terminal 1
cd server
npm run dev

REM Terminal 2
cd client
npm run dev
```

---

## Using the Application

### Joining a Room

1. **Open** http://localhost:5173 in browser
2. **Enter any password** (e.g., "myroom")
3. **Click "Join Room"**
4. **Share the password** with someone else
5. They enter same password and click "Join Room"
6. **Start drawing!**

### Drawing Tools

- **Select** (Hand) - Select and move objects
- **Pencil** - Freehand drawing
- **Eraser** - Remove content
- **Text** - Add text
- **Rectangle** - Draw rectangles
- **Circle** - Draw circles
- **Line** - Draw straight lines
- **Arrow** - Draw arrows
- **Highlighter** - Transparent drawing

### Canvas Controls

- **Color Picker** - Change stroke and fill colors
- **Stroke Width** - Adjust line thickness
- **Zoom** - Zoom in/out
- **Pan** - Move around canvas
- **Undo/Redo** - History management
- **Clear** - Clear entire canvas
- **Export** - Save as PNG or JSON

### Shortcuts

Most shortcuts work from the tldraw library:
- **Ctrl+Z** / **Cmd+Z** - Undo
- **Ctrl+Y** / **Cmd+Y** - Redo
- **Delete** - Delete selected
- **Escape** - Deselect

---

## Project Structure

```
Drawing/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # State management
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Full pages
│   │   ├── services/      # Services
│   │   ├── styles/        # CSS
│   │   └── config.js      # Configuration
│   └── package.json
│
└── server/                # Express backend
    ├── src/
    │   ├── socket/        # Socket.IO handlers
    │   ├── rooms/         # Room management
    │   ├── middleware/    # Express middleware
    │   └── utils/         # Utilities
    └── package.json
```

---

## Available Commands

### Using Make (macOS/Linux)
```bash
make help          # Show all commands
make install       # Install dependencies
make dev-server    # Start backend
make dev-client    # Start frontend
make build         # Build for production
make clean         # Clean artifacts
```

### Direct npm Commands
```bash
# Backend
cd server
npm run dev        # Development
npm start          # Production

# Frontend
cd client
npm run dev        # Development
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## Troubleshooting

### "Port already in use"
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "npm: command not found"
- Install Node.js from https://nodejs.org
- Restart terminal
- Verify: `node --version`

### "Cannot connect to server"
1. Check backend is running: `curl http://localhost:3001/health`
2. Check browser console for errors (F12)
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### "Drawing not syncing"
1. Check both users have same password
2. Check browser console for errors
3. Verify Socket.IO connection in Network tab
4. Try refreshing both pages

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Deploy Backend (Render)

1. Push code to GitHub
2. Create new Web Service on Render.com
3. Connect repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `server`
5. Add environment variables
6. Deploy!

### Deploy Frontend (Vercel)

1. Push code to GitHub
2. Create new project on Vercel
3. Set Root Directory: `client`
4. Add environment variables:
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
5. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## Documentation

- **[README.md](README.md)** - Comprehensive guide
- **[QUICK_START.md](QUICK_START.md)** - Quick reference
- **[API.md](API.md)** - API documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
- **[COMMANDS.md](COMMANDS.md)** - Command reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

---

## What's Included

### Features ✅
- Real-time collaborative drawing
- Password-based room system
- Live user presence
- Complete drawing toolset
- Infinite canvas with zoom/pan
- Auto-save state
- Export to PNG/JSON
- Dark/light mode ready
- Mobile responsive

### Technology ✅
- React 18 + Vite
- Express + Socket.IO
- tldraw library
- Tailwind CSS
- Production-ready code

### Deployment ✅
- Docker support
- Vercel ready (frontend)
- Render ready (backend)
- Environment configuration
- Health checks
- Error handling

---

## Next Steps

1. ✅ **Setup** - Follow the setup guide above
2. ✅ **Test** - Try drawing with two browser windows
3. ✅ **Explore** - Check out the code structure
4. ✅ **Customize** - Add your own features
5. ✅ **Deploy** - Launch to production

---

## Getting Help

- 📖 Check documentation files
- 🔍 Search similar issues
- 💬 Open a discussion
- 🐛 Report bugs
- ⭐ Star the repo if you like it!

---

## Tips & Tricks

### Development Tips
- Use React DevTools to inspect components
- Check Socket.IO events in Network tab
- Enable debug mode: `localStorage.debug = 'socket.io-client:*'`
- Watch for console errors (F12)

### Performance
- Drawing updates are throttled
- Cursor updates are debounced
- Room cleanup prevents memory leaks
- Auto-reconnection is automatic

### Customization
- Edit `tailwind.config.js` for colors/fonts
- Modify toolbar in `Toolbar.jsx`
- Update room limits in `RoomManager.js`
- Add new drawing tools via tldraw

---

## System Requirements

### Minimum
- Node.js 18+
- npm 9+
- 2GB RAM
- Modern browser

### Recommended
- Node.js 20+
- npm 10+
- 4GB RAM
- Chrome, Firefox, or Safari (latest)

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

---

## Frequently Asked Questions

**Q: Do I need a database?**
A: No, currently uses in-memory storage. See ARCHITECTURE.md for MongoDB integration.

**Q: Can I self-host?**
A: Yes! Deploy backend to any Node.js hosting (Render, Railway, Heroku) and frontend to any static host (Vercel, Netlify, GitHub Pages).

**Q: Is it secure?**
A: Basic security implemented. For production, add authentication, rate limiting, and HTTPS.

**Q: How many users can use it?**
A: Currently 2 users per room. Scalable to thousands with load balancing.

**Q: Can I add more features?**
A: Yes! See CONTRIBUTING.md for guidelines.

**Q: What's the license?**
A: MIT - Use freely, modify, distribute.

---

## Success! 🎉

You now have a fully functional real-time collaborative whiteboard! 

**Start drawing and invite a friend to draw together!**

---

For detailed information, see the full [README.md](README.md)
