# Commands Reference

## Project Commands

### Setup
```bash
# Automated setup (macOS/Linux)
chmod +x setup.sh
./setup.sh

# Automated setup (Windows)
setup.bat

# Manual setup
cd server && npm install
cd ../client && npm install
```

### Development

**Start both servers (requires 2 terminals):**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

**Or using Make (macOS/Linux):**
```bash
make dev-server    # Terminal 1
make dev-client    # Terminal 2
make dev           # Shows instructions
```

### Building

```bash
# Frontend production build
cd client
npm run build

# Preview production build
npm run preview
```

### Production

```bash
# Start backend in production
cd server
npm start

# Start frontend in production
cd client
npm run preview
```

## Useful Make Commands (macOS/Linux)

```bash
make help              # Show all commands
make install           # Install all dependencies
make dev               # Show dev instructions
make dev-server        # Start backend
make dev-client        # Start frontend
make build             # Build client
make start             # Start server
make clean             # Clean all artifacts
```

## Backend Commands

```bash
cd server

# Development with auto-reload
npm run dev

# Production
npm start

# Check health
curl http://localhost:3001/health

# Get statistics
curl http://localhost:3001/api/stats

# Install dependencies
npm install

# View logs
# Logs are printed to console
```

## Frontend Commands

```bash
cd client

# Development server with HMR
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Check dependencies
npm list

# Update packages
npm update

# Clean cache
rm -rf node_modules
npm install
```

## Docker Commands

```bash
# Build backend image
docker build -f Dockerfile.server -t drawtogether-server .

# Build frontend image
docker build -f Dockerfile.client -t drawtogether-client .

# Run with Docker Compose
docker-compose up

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

## Useful Utilities

### Port Management

```bash
# macOS/Linux - Check port in use
lsof -i :3001
lsof -i :5173

# Kill process on port
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database (if adding MongoDB)

```bash
# Start MongoDB locally (if installed)
mongod

# Connect with MongoDB shell
mongosh

# Start MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Git Commands

```bash
# Clone repository
git clone https://github.com/pithva007/Drawing.git

# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: Add amazing feature"

# Push to origin
git push origin feature/my-feature

# View logs
git log --oneline

# Create tag
git tag v1.0.0
git push origin v1.0.0
```

### Testing Commands

```bash
# Run frontend tests (if added)
cd client
npm test

# Run backend tests (if added)
cd server
npm test

# Run linter (if added)
npm run lint

# Format code (if prettier added)
npm run format
```

### Debug Commands

### Enable Socket.IO debugging
```bash
# In browser console
localStorage.debug = 'socket.io-client:*'

# To disable
localStorage.removeItem('debug')
```

### Check server status
```bash
# Health check
curl http://localhost:3001/health

# Get statistics
curl http://localhost:3001/api/stats

# List all requests (if logging enabled)
# Check server console output
```

### Performance Profiling

```bash
# Node.js profiling
node --prof server/src/index.js
# Generates isolate-*.log file

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

## Environment Setup

### macOS/Linux

```bash
# Install Node.js (using Homebrew)
brew install node@18

# Verify installation
node --version
npm --version

# Install global tools
npm install -g npm@latest
npm install -g nodemon
```

### Windows

```bash
# Install Node.js
# Download from https://nodejs.org

# Verify installation
node --version
npm --version

# Install global tools
npm install -g npm@latest
npm install -g nodemon
```

## Troubleshooting Commands

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check port availability
# macOS/Linux
netstat -tuln | grep LISTEN

# Windows
netstat -ano | findstr LISTENING
```

## Production Deployment Commands

### Deploy Backend to Render

```bash
# Push to GitHub (Render will auto-deploy)
git push origin main

# Check deployment status
# View in Render dashboard
```

### Deploy Frontend to Vercel

```bash
# Push to GitHub (Vercel will auto-deploy)
git push origin main

# Set environment variables
# In Vercel dashboard:
# VITE_SOCKET_URL=https://your-backend.onrender.com
# VITE_API_URL=https://your-backend.onrender.com
```

## Quick Reference

| Command | Purpose | Location |
|---------|---------|----------|
| `npm run dev` | Start dev server | client, server |
| `npm run build` | Build for production | client |
| `npm start` | Start production | server |
| `make dev-server` | Start backend | Root |
| `make dev-client` | Start frontend | Root |
| `curl http://localhost:3001/health` | Check server | Terminal |
| `docker-compose up` | Run with Docker | Root |
| `git push origin main` | Deploy | Terminal |

---

For more information, see [DEPLOYMENT.md](DEPLOYMENT.md) and [README.md](README.md).
