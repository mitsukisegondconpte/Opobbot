"""
Telegram Client
Manages Telegram connection and music search operations
"""

import asyncio
import logging
import os
import time
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError
import sys
import os
sys.path.append(os.path.dirname(__file__))
from music_fetcher import MusicFetcher

logger = logging.getLogger(__name__)

class TelegramMusicClient:
    def __init__(self):
        # Telegram API credentials
        self.api_id = int(os.getenv('TELEGRAM_API_ID', '0'))
        self.api_hash = os.getenv('TELEGRAM_API_HASH', '')
        self.phone_number = os.getenv('TELEGRAM_PHONE', '')
        self.session_name = 'whatsapp_music_bot'
        
        # Client and components
        self.client = None
        self.music_fetcher = None
        self.connected = False
        
        # Statistics
        self.stats = {
            'searches_performed': 0,
            'successful_searches': 0,
            'failed_searches': 0,
            'start_time': time.time()
        }
        
    async def connect(self):
        """Connect to Telegram"""
        try:
            if not self.api_id or not self.api_hash:
                raise ValueError("Telegram API ID and Hash are required")
            
            logger.info("🔗 Connecting to Telegram...")
            
            # Create client
            self.client = TelegramClient(
                self.session_name, 
                self.api_id, 
                self.api_hash
            )
            
            # Connect
            await self.client.connect()
            
            # Check if we're authorized
            if not await self.client.is_user_authorized():
                await self.authorize()
            
            # Initialize music fetcher
            self.music_fetcher = MusicFetcher(self.client)
            self.music_fetcher.setup_message_handler()
            
            self.connected = True
            logger.info("✅ Connected to Telegram successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to Telegram: {e}")
            raise
    
    async def authorize(self):
        """Authorize the Telegram client"""
        try:
            if not self.phone_number:
                raise ValueError("Phone number is required for authorization")
            
            logger.info("📱 Starting Telegram authorization...")
            
            # Send code request
            await self.client.send_code_request(self.phone_number)
            
            # In a production environment, you'd need to implement
            # a way to receive the code from the user
            # For now, we'll check for environment variable
            code = os.getenv('TELEGRAM_CODE')
            if not code:
                raise ValueError(
                    "Please provide TELEGRAM_CODE environment variable "
                    "with the verification code received on your phone"
                )
            
            try:
                await self.client.sign_in(self.phone_number, code)
                logger.info("✅ Telegram authorization successful")
            except SessionPasswordNeededError:
                # Two-factor authentication
                password = os.getenv('TELEGRAM_PASSWORD')
                if not password:
                    raise ValueError(
                        "Two-factor authentication enabled. "
                        "Please provide TELEGRAM_PASSWORD environment variable"
                    )
                await self.client.sign_in(password=password)
                logger.info("✅ Telegram 2FA authorization successful")
                
        except Exception as e:
            logger.error(f"❌ Telegram authorization failed: {e}")
            raise
    
    async def search_music(self, query):
        """Search for music"""
        try:
            if not self.connected:
                raise Exception("Telegram client not connected")
            
            self.stats['searches_performed'] += 1
            
            logger.info(f"🎵 Searching music: {query}")
            result = await self.music_fetcher.search_music(query)
            
            if result:
                self.stats['successful_searches'] += 1
                logger.info(f"✅ Music search successful: {result.get('title', 'Unknown')}")
            else:
                self.stats['failed_searches'] += 1
                logger.warning(f"❌ No music found for: {query}")
            
            return result
            
        except Exception as e:
            self.stats['failed_searches'] += 1
            logger.error(f"Error searching music: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from Telegram"""
        try:
            if self.client:
                await self.client.disconnect()
                self.connected = False
                logger.info("🔌 Disconnected from Telegram")
        except Exception as e:
            logger.error(f"Error disconnecting from Telegram: {e}")
    
    def is_connected(self):
        """Check if client is connected"""
        return self.connected and self.client and self.client.is_connected()
    
    async def get_stats(self):
        """Get client statistics"""
        uptime = time.time() - self.stats['start_time']
        
        return {
            **self.stats,
            'uptime_seconds': uptime,
            'uptime_formatted': self.format_uptime(uptime),
            'success_rate': (
                self.stats['successful_searches'] / self.stats['searches_performed'] * 100
                if self.stats['searches_performed'] > 0 else 0
            )
        }
    
    def format_uptime(self, seconds):
        """Format uptime in human-readable format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        seconds = int(seconds % 60)
        
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    async def health_check(self):
        """Perform health check"""
        try:
            if not self.is_connected():
                return False
            
            # Try to get current user info
            me = await self.client.get_me()
            return me is not None
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
