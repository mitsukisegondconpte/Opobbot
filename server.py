"""
Main API Server
Entry point for the Python Telegram bridge service
"""

import asyncio
import logging
import os
import signal
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from telegram.bridge import main as bridge_main

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/api_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def setup_signal_handlers():
    """Setup signal handlers for graceful shutdown"""
    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

def check_environment():
    """Check required environment variables"""
    required_vars = [
        'TELEGRAM_API_ID',
        'TELEGRAM_API_HASH'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

async def startup_checks():
    """Perform startup checks"""
    logger.info("🔍 Performing startup checks...")
    
    # Check environment variables
    if not check_environment():
        raise Exception("Environment check failed")
    
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    os.makedirs('sessions', exist_ok=True)
    
    logger.info("✅ Startup checks completed")

async def main():
    """Main function"""
    try:
        logger.info("🚀 Starting WhatsApp Music Bot API Server...")
        
        # Setup signal handlers
        setup_signal_handlers()
        
        # Perform startup checks
        await startup_checks()
        
        # Start the bridge server
        await bridge_main()
        
    except KeyboardInterrupt:
        logger.info("🛑 Received keyboard interrupt, shutting down...")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Shutdown complete")
