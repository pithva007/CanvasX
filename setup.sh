#!/bin/bash

# DrawTogether Setup Script
# This script sets up both backend and frontend

echo "🎨 DrawTogether - Collaborative Whiteboard Setup"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"
echo ""

# Setup backend
echo -e "${YELLOW}Setting up backend...${NC}"
cd server
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file"
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

cd ..
echo ""

# Setup frontend
echo -e "${YELLOW}Setting up frontend...${NC}"
cd client
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file"
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..
echo ""

# Summary
echo "================================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd server && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd client && npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""
echo "================================================"
