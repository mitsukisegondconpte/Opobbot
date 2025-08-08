#!/bin/bash

# WhatsApp Music Bot Startup Script
# This script starts both the Node.js WhatsApp service and Python Telegram bridge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! nc -z localhost $1 2>/dev/null
}

# Function to wait for service to start
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    print_colored $BLUE "Waiting for $name to start..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s $url > /dev/null 2>&1; then
            print_colored $GREEN "$name is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    
    print_colored $RED "$name failed to start within expected time"
    return 1
}

# Header
print_colored $BLUE "🚀 WhatsApp Music Bot Startup Script"
print_colored $BLUE "======================================="

# Check prerequisites
print_colored $YELLOW "📋 Checking prerequisites..."

if ! command_exists node; then
    print_colored $RED "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists python3; then
    print_colored $RED "❌ Python 3 is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_colored $RED "❌ npm is not installed"
    exit 1
fi

if ! command_exists pip; then
    print_colored $RED "❌ pip is not installed"
    exit 1
fi

print_colored $GREEN "✅ All prerequisites are installed"

# Check if .env file exists, if not, use environment variables from Replit Secrets
if [ -f .env ]; then
    print_colored $YELLOW "📄 Loading .env file..."
    export $(grep -v '^#' .env | xargs)
else
    print_colored $YELLOW "🔐 Using Replit Secrets for configuration..."
fi

# Check required environment variables
print_colored $YELLOW "🔍 Checking environment variables..."

required_vars=("TELEGRAM_API_ID" "TELEGRAM_API_HASH")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_colored $RED "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        print_colored $RED "   - $var"
    done
    print_colored $YELLOW "💡 Make sure Telegram API secrets are added in Replit Secrets"
    exit 1
fi

print_colored $GREEN "✅ Environment variables are set"

# Check ports availability
print_colored $YELLOW "🔌 Checking port availability..."

WHATSAPP_PORT=${PORT:-5000}
TELEGRAM_PORT=${TELEGRAM_PORT:-8000}

if ! port_available $WHATSAPP_PORT; then
    print_colored $RED "❌ Port $WHATSAPP_PORT is already in use"
    exit 1
fi

if ! port_available $TELEGRAM_PORT; then
    print_colored $RED "❌ Port $TELEGRAM_PORT is already in use"
    exit 1
fi

print_colored $GREEN "✅ Ports are available"

# Create necessary directories
print_colored $YELLOW "📁 Creating directories..."
mkdir -p logs
mkdir -p sessions
mkdir -p auth_info
print_colored $GREEN "✅ Directories created"

# Install Node.js dependencies
print_colored $YELLOW "📦 Installing Node.js dependencies..."
if ! npm install --silent; then
    print_colored $RED "❌ Failed to install Node.js dependencies"
    exit 1
fi
print_colored $GREEN "✅ Node.js dependencies installed"

# Install Python dependencies
print_colored $YELLOW "🐍 Installing Python dependencies..."
if ! pip install -q telethon aiohttp python-dotenv; then
    print_colored $RED "❌ Failed to install Python dependencies"
    exit 1
fi
print_colored $GREEN "✅ Python dependencies installed"

# Start Telegram Bridge Service
print_colored $BLUE "🐍 Starting Python Telegram Bridge..."
python3 api/server.py &
TELEGRAM_PID=$!

# Wait for Telegram bridge to start
if ! wait_for_service "http://localhost:$TELEGRAM_PORT/health" "Telegram Bridge"; then
    kill $TELEGRAM_PID 2>/dev/null || true
    exit 1
fi

# Start WhatsApp Bot Service
print_colored $BLUE "🤖 Starting Node.js WhatsApp Bot..."
node index.js &
WHATSAPP_PID=$!

# Wait for WhatsApp bot to start
if ! wait_for_service "http://localhost:$WHATSAPP_PORT/health" "WhatsApp Bot"; then
    kill $TELEGRAM_PID 2>/dev/null || true
    kill $WHATSAPP_PID 2>/dev/null || true
    exit 1
fi

# Success message
print_colored $GREEN "🎉 All services started successfully!"
print_colored $BLUE "📱 WhatsApp Bot: http://localhost:$WHATSAPP_PORT"
print_colored $BLUE "🐍 Telegram Bridge: http://localhost:$TELEGRAM_PORT"
print_colored $YELLOW ""
print_colored $YELLOW "📋 Next steps:"
print_colored $YELLOW "1. Scan the QR code with WhatsApp mobile app"
print_colored $YELLOW "2. Send a message to your WhatsApp number"
print_colored $YELLOW "3. Try commands like /help, /menu, /tictactoe"
print_colored $YELLOW ""
print_colored $BLUE "💡 To stop the services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    print_colored $YELLOW "\n🛑 Shutting down services..."
    kill $TELEGRAM_PID 2>/dev/null || true
    kill $WHATSAPP_PID 2>/dev/null || true
    print_colored $GREEN "👋 Services stopped successfully"
    exit 0
}

# Set trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Keep script running and monitor services
while true; do
    # Check if services are still running
    if ! kill -0 $TELEGRAM_PID 2>/dev/null; then
        print_colored $RED "❌ Telegram Bridge service stopped unexpectedly"
        kill $WHATSAPP_PID 2>/dev/null || true
        exit 1
    fi
    
    if ! kill -0 $WHATSAPP_PID 2>/dev/null; then
        print_colored $RED "❌ WhatsApp Bot service stopped unexpectedly"
        kill $TELEGRAM_PID 2>/dev/null || true
        exit 1
    fi
    
    sleep 5
done
