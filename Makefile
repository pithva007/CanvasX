# Makefile for DrawTogether

.PHONY: help install dev dev-server dev-client build start stop clean

help:
	@echo "DrawTogether - Collaborative Whiteboard"
	@echo ""
	@echo "Available commands:"
	@echo "  make install       - Install dependencies for both client and server"
	@echo "  make dev           - Start both client and server in development mode"
	@echo "  make dev-server    - Start only the server in development mode"
	@echo "  make dev-client    - Start only the client in development mode"
	@echo "  make build         - Build the client for production"
	@echo "  make start         - Start the server in production mode"
	@echo "  make clean         - Clean node_modules and build artifacts"
	@echo "  make help          - Show this help message"

install:
	cd server && npm install
	cd client && npm install

dev:
	@echo "Starting DrawTogether development environment..."
	@echo "Make sure to open this in two terminals"
	@echo ""
	@echo "Terminal 1: make dev-server"
	@echo "Terminal 2: make dev-client"

dev-server:
	cd server && npm run dev

dev-client:
	cd client && npm run dev

build:
	cd client && npm run build

start:
	cd server && npm start

clean:
	rm -rf server/node_modules client/node_modules
	rm -rf client/dist

.DEFAULT_GOAL := help
