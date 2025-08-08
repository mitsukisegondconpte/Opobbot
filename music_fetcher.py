"""
Music Fetcher
Handles interaction with VK Music Bot on Telegram
"""

import asyncio
import logging
import re
import time
from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError
from telethon.tl.types import DocumentAttributeAudio

logger = logging.getLogger(__name__)

class MusicFetcher:
    def __init__(self, client):
        self.client = client
        self.vk_bot_username = '@vkmusbot'
        self.search_timeout = 30  # seconds
        self.pending_searches = {}
        
    async def search_music(self, query):
        """Search for music using VK Music Bot"""
        try:
            logger.info(f"🎵 Starting music search for: {query}")
            
            # Generate unique search ID
            search_id = f"{time.time()}_{hash(query)}"
            
            # Create future for this search
            search_future = asyncio.Future()
            self.pending_searches[search_id] = {
                'future': search_future,
                'query': query,
                'timestamp': time.time()
            }
            
            # Send search query to VK Music Bot
            await self.send_search_query(query, search_id)
            
            # Wait for response with timeout
            try:
                result = await asyncio.wait_for(search_future, timeout=self.search_timeout)
                return result
            except asyncio.TimeoutError:
                logger.warning(f"⏰ Search timeout for query: {query}")
                return None
            finally:
                # Clean up
                self.pending_searches.pop(search_id, None)
                
        except Exception as e:
            logger.error(f"Error searching music: {e}")
            return None
    
    async def send_search_query(self, query, search_id):
        """Send search query to VK Music Bot"""
        try:
            # Get VK Music Bot entity
            vk_bot = await self.client.get_entity(self.vk_bot_username)
            
            # Send search message
            await self.client.send_message(vk_bot, query)
            logger.debug(f"📤 Sent search query to VK Bot: {query}")
            
        except Exception as e:
            logger.error(f"Error sending search query: {e}")
            raise
    
    def setup_message_handler(self):
        """Setup message handler for VK Bot responses"""
        @self.client.on(events.NewMessage(from_users=[self.vk_bot_username]))
        async def handle_vk_response(event):
            await self.process_vk_response(event)
    
    async def process_vk_response(self, event):
        """Process response from VK Music Bot"""
        try:
            message = event.message
            
            # Check if message has audio
            if message.audio:
                audio_info = await self.extract_audio_info(message)
                if audio_info:
                    # Find matching pending search
                    await self.match_search_result(audio_info)
            
            # Check for "not found" messages
            elif message.text and self.is_not_found_message(message.text):
                await self.handle_not_found()
                
        except Exception as e:
            logger.error(f"Error processing VK response: {e}")
    
    async def extract_audio_info(self, message):
        """Extract audio information from message"""
        try:
            audio = message.audio
            if not audio:
                return None
            
            # Get audio attributes
            duration = audio.duration if hasattr(audio, 'duration') else 0
            file_size = audio.size if hasattr(audio, 'size') else 0
            
            # Extract title and artist from attributes
            title = "Unknown Title"
            artist = "Unknown Artist"
            
            for attr in audio.attributes:
                if isinstance(attr, DocumentAttributeAudio):
                    if attr.title:
                        title = attr.title
                    if attr.performer:
                        artist = attr.performer
                    break
            
            # Get download URL
            audio_url = await self.get_audio_url(message)
            
            return {
                'title': title,
                'artist': artist,
                'duration': duration,
                'file_size': file_size,
                'audio_url': audio_url,
                'message_id': message.id
            }
            
        except Exception as e:
            logger.error(f"Error extracting audio info: {e}")
            return None
    
    async def get_audio_url(self, message):
        """Get downloadable URL for audio"""
        try:
            # Download audio to get URL
            file_path = await message.download_media(file=bytes)
            
            # For now, we'll return a placeholder URL
            # In a real implementation, you'd upload this to a file server
            # or use Telegram's file API to get a direct URL
            
            return f"telegram_audio_{message.id}"
            
        except Exception as e:
            logger.error(f"Error getting audio URL: {e}")
            return None
    
    def is_not_found_message(self, text):
        """Check if message indicates no results found"""
        not_found_patterns = [
            r"not found",
            r"ничего не найдено",
            r"no results",
            r"нет результатов",
            r"try another"
        ]
        
        text_lower = text.lower()
        return any(re.search(pattern, text_lower) for pattern in not_found_patterns)
    
    async def match_search_result(self, audio_info):
        """Match audio result with pending search"""
        try:
            # For now, just complete the most recent search
            # In a more sophisticated implementation, you'd match based on query similarity
            
            if self.pending_searches:
                # Get the most recent search
                latest_search_id = max(self.pending_searches.keys(), 
                                     key=lambda x: self.pending_searches[x]['timestamp'])
                
                search_info = self.pending_searches.get(latest_search_id)
                if search_info and not search_info['future'].done():
                    search_info['future'].set_result(audio_info)
                    logger.info(f"✅ Matched audio result for search: {search_info['query']}")
                    
        except Exception as e:
            logger.error(f"Error matching search result: {e}")
    
    async def handle_not_found(self):
        """Handle "not found" response"""
        try:
            if self.pending_searches:
                # Get the most recent search
                latest_search_id = max(self.pending_searches.keys(), 
                                     key=lambda x: self.pending_searches[x]['timestamp'])
                
                search_info = self.pending_searches.get(latest_search_id)
                if search_info and not search_info['future'].done():
                    search_info['future'].set_result(None)
                    logger.info(f"❌ No results found for search: {search_info['query']}")
                    
        except Exception as e:
            logger.error(f"Error handling not found: {e}")
    
    def cleanup_expired_searches(self):
        """Clean up expired searches"""
        current_time = time.time()
        expired_searches = []
        
        for search_id, search_info in self.pending_searches.items():
            if current_time - search_info['timestamp'] > self.search_timeout:
                expired_searches.append(search_id)
        
        for search_id in expired_searches:
            search_info = self.pending_searches.pop(search_id, None)
            if search_info and not search_info['future'].done():
                search_info['future'].set_result(None)
                logger.warning(f"⏰ Expired search: {search_info['query']}")
