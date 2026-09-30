# Makefile for DrawTogether - Real-time Collaborative Whiteboard

.PHONY: help install dev dev-server dev-client build start clean docker-up docker-down

help:
	@echo "DrawTogether - Real-time Collaborative Whiteboard"
	@echo ""
	@echo "Available commands:"
	@echo "  make install       - Install dependencies for both client and server"
	@echo "  make dev           - Instructions to start both client & server in development"
	@echo "  make dev-server    - Start backend server in development mode (port 3001)"
	@echo "  make dev-client    - Start frontend Vite dev server (port 5173)"
	@echo "  make build         - Build client production bundle (Vite)"
	@echo "  make start         - Start server in production mode"
	@echo "  make docker-up     - Build and start full stack with Docker Compose"
	@echo "  make docker-down   - Stop and tear down Docker Compose services"
	@echo "  make clean         - Remove node_modules and build artifacts"
	@echo "  make help          - Show this help message"

install:
	cd server && npm install
	cd client && npm install

dev:
	@echo "Starting DrawTogether development environment..."
	@echo "Run these two commands in separate terminal tabs:"
	@echo ""
	@echo "  Terminal 1: make dev-server"
	@echo "  Terminal 2: make dev-client"

dev-server:
	cd server && npm run dev

dev-client:
	cd client && npm run dev

build:
	cd client && npm run build

start:
	cd server && npm start

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

clean:
	rm -rf server/node_modules client/node_modules
	rm -rf client/dist

.DEFAULT_GOAL := help
