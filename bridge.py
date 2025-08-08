"""
Telegram Bridge Server
Handles music search requests and communicates with Telegram bot
"""

import asyncio
import logging
import os
from aiohttp import web, ClientSession
import sys
import os
sys.path.append(os.path.dirname(__file__))
from telegram_client import TelegramMusicClient
from config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/telegram_bridge.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TelegramBridge:
    def __init__(self):
        self.telegram_client = None
        self.session = None
        
    async def initialize(self):
        """Initialize the Telegram client and HTTP session"""
        try:
            logger.info("🚀 Initializing Telegram Bridge...")
            
            # Initialize Telegram client
            self.telegram_client = TelegramMusicClient()
            await self.telegram_client.connect()
            
            # Initialize HTTP session
            self.session = ClientSession()
            
            logger.info("✅ Telegram Bridge initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Telegram Bridge: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            if self.telegram_client:
                await self.telegram_client.disconnect()
            
            if self.session:
                await self.session.close()
                
            logger.info("🧹 Telegram Bridge cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def search_music(self, query):
        """Search for music using Telegram bot"""
        try:
            if not self.telegram_client:
                raise Exception("Telegram client not initialized")
            
            logger.info(f"🔍 Searching for music: {query}")
            
            # Search music using Telegram client
            result = await self.telegram_client.search_music(query)
            
            if result:
                logger.info(f"✅ Music found: {result.get('title', 'Unknown')}")
                return {
                    'success': True,
                    'title': result.get('title'),
                    'artist': result.get('artist'),
                    'audio_url': result.get('audio_url'),
                    'duration': result.get('duration'),
                    'file_size': result.get('file_size')
                }
            else:
                logger.warning(f"❌ No music found for query: {query}")
                return {
                    'success': False,
                    'error': 'No music found for the given query'
                }
                
        except Exception as e:
            logger.error(f"Error searching music: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Global bridge instance
bridge = TelegramBridge()

async def handle_search(request):
    """Handle music search requests"""
    try:
        data = await request.json()
        query = data.get('query', '').strip()
        
        if not query:
            return web.json_response({
                'success': False,
                'error': 'Query parameter is required'
            }, status=400)
        
        if len(query) < 2:
            return web.json_response({
                'success': False,
                'error': 'Query must be at least 2 characters long'
            }, status=400)
        
        # Search for music
        result = await bridge.search_music(query)
        
        return web.json_response(result)
        
    except Exception as e:
        logger.error(f"Error handling search request: {e}")
        return web.json_response({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

async def handle_health(request):
    """Health check endpoint"""
    try:
        telegram_status = bridge.telegram_client.is_connected() if bridge.telegram_client else False
        
        return web.json_response({
            'status': 'healthy',
            'telegram_connected': telegram_status,
            'timestamp': asyncio.get_event_loop().time()
        })
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return web.json_response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)

async def handle_status(request):
    """Status endpoint"""
    try:
        if bridge.telegram_client:
            stats = await bridge.telegram_client.get_stats()
            return web.json_response({
                'connected': bridge.telegram_client.is_connected(),
                'stats': stats
            })
        else:
            return web.json_response({
                'connected': False,
                'stats': {}
            })
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return web.json_response({
            'error': str(e)
        }, status=500)

async def init_app():
    """Initialize the web application"""
    app = web.Application()
    
    # Add routes
    app.router.add_post('/search', handle_search)
    app.router.add_get('/health', handle_health)
    app.router.add_get('/status', handle_status)
    
    # Add CORS headers
    async def cors_handler(request, handler):
        response = await handler(request)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    app.middlewares.append(cors_handler)
    
    return app

async def main():
    """Main function"""
    try:
        # Initialize bridge
        await bridge.initialize()
        
        # Create web application
        app = await init_app()
        
        # Start server
        port = int(os.getenv('PORT', 8000))
        logger.info(f"🌐 Starting Telegram Bridge server on port {port}")
        
        runner = web.AppRunner(app)
        await runner.setup()
        
        site = web.TCPSite(runner, '0.0.0.0', port)
        await site.start()
        
        logger.info(f"✅ Telegram Bridge server running on http://0.0.0.0:{port}")
        
        # Keep the server running
        try:
            while True:
                await asyncio.sleep(3600)  # Sleep for 1 hour
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down server...")
        finally:
            await bridge.cleanup()
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        if bridge:
            await bridge.cleanup()

if __name__ == '__main__':
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Run the server
    asyncio.run(main())
