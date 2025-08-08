# WhatsApp Music Bot

## Overview

A comprehensive WhatsApp bot that serves as a bridge between WhatsApp and Telegram's VK Music Bot, featuring interactive games and multi-language support. The system uses a dual-architecture approach with Node.js handling WhatsApp interactions and Python managing Telegram communications. The bot provides music search and streaming capabilities, interactive games (Tic-Tac-Toe and Rock-Paper-Scissors), and supports English, French, and Haitian Creole languages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture Pattern
The application follows a **microservices architecture** with two main services:
- **Node.js WhatsApp Service**: Handles WhatsApp Web API interactions, user sessions, and game logic
- **Python Telegram Bridge**: Manages Telegram client connections and music fetching operations

### WhatsApp Service (Node.js)
- **Framework**: Express.js server with Baileys library for WhatsApp Web API
- **Authentication**: Multi-file auth state management with QR code or pairing code support
- **Session Management**: In-memory session storage with automatic cleanup for user game states
- **Message Routing**: Command-based message handler with support for games and music requests
- **Game Engines**: Standalone classes for Tic-Tac-Toe (with AI opponent) and Rock-Paper-Scissors
- **Health Monitoring**: Built-in health check endpoints and connection status monitoring

### Telegram Bridge Service (Python)
- **Client Library**: Telethon for Telegram API interactions
- **HTTP Server**: aiohttp for async request handling
- **Music Integration**: Direct communication with @vkmusbot for music search and download
- **Session Handling**: File-based Telegram session management
- **Rate Limiting**: Request throttling to prevent API abuse

### Data Flow
1. User sends message to WhatsApp bot
2. Node.js service processes message and determines intent (command, game input, or music search)
3. For music requests, Node.js forwards query to Python bridge via HTTP API
4. Python service searches music through Telegram @vkmusbot
5. Audio files are streamed back through the bridge to WhatsApp

### Configuration Management
- **Environment-based**: Separate configuration files for Node.js and Python services
- **Service Discovery**: Configurable endpoints for service communication
- **Feature Flags**: Configurable timeouts, limits, and behavior settings

## External Dependencies

### Telegram Services
- **Telegram API**: Requires API ID and Hash from my.telegram.org
- **VK Music Bot (@vkmusbot)**: Third-party Telegram bot for music search and download
- **Telethon Library**: Python client for Telegram API interactions

### WhatsApp Integration
- **Baileys Library**: WhatsApp Web API implementation for Node.js
- **WhatsApp Web**: Requires active WhatsApp account for bot connection

### Infrastructure Dependencies
- **Node.js Runtime**: Version 16+ required for WhatsApp service
- **Python Runtime**: Version 3.8+ required for Telegram bridge
- **File System**: Session storage for both WhatsApp and Telegram authentication
- **HTTP Communication**: Inter-service communication between Node.js and Python services

### Development Tools
- **qrcode-terminal**: QR code display for WhatsApp authentication
- **axios**: HTTP client for service-to-service communication
- **aiohttp**: Async HTTP server framework for Python bridge
- **Express.js**: Web framework for Node.js health checks and API endpoints