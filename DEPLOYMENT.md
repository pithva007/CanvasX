# Deployment Configurations

This folder contains deployment templates for various platforms.

## Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set root directory to `client`
3. Set build command to `npm run build`
4. Set output directory to `dist`
5. Add environment variables:
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
   - `VITE_API_URL=https://your-backend.onrender.com`

## Render (Backend)

1. Connect your GitHub repository to Render
2. Create new Web Service
3. Set build command to `npm install`
4. Set start command to `npm start`
5. Set working directory to `server`
6. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `CLIENT_URL=https://your-frontend-domain.com`

## Docker

Build and run with:

```bash
# Backend
docker build -f Dockerfile.server -t drawtogether-server .
docker run -p 3001:3001 drawtogether-server

# Frontend
docker build -f Dockerfile.client -t drawtogether-client .
docker run -p 80:80 drawtogether-client
```

## Docker Compose

```bash
docker-compose up
```
