"""
Configuration for Python Telegram Bridge
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Telegram API Configuration
TELEGRAM_API_ID = int(os.getenv('TELEGRAM_API_ID', '0'))
TELEGRAM_API_HASH = os.getenv('TELEGRAM_API_HASH', '')
TELEGRAM_PHONE = os.getenv('TELEGRAM_PHONE', '')
TELEGRAM_CODE = os.getenv('TELEGRAM_CODE', '')
TELEGRAM_PASSWORD = os.getenv('TELEGRAM_PASSWORD', '')

# Bot Configuration
VK_MUSIC_BOT = '@vkmusbot'
SESSION_NAME = 'whatsapp_music_bot'
SESSIONS_DIR = BASE_DIR / 'sessions'

# Search Configuration
SEARCH_TIMEOUT = 30  # seconds
MAX_CONCURRENT_SEARCHES = 10
SEARCH_RATE_LIMIT = 5  # searches per minute per IP

# File Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_AUDIO_FORMATS = ['.mp3', '.m4a', '.ogg', '.wav']
TEMP_DIR = BASE_DIR / 'temp'

# Server Configuration
SERVER_HOST = '0.0.0.0'
SERVER_PORT = int(os.getenv('PORT', 8000))
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_DIR = BASE_DIR / 'logs'
MAX_LOG_SIZE = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5

# Health Check Configuration
HEALTH_CHECK_INTERVAL = 60  # seconds
CONNECTION_RETRY_ATTEMPTS = 3
CONNECTION_RETRY_DELAY = 5  # seconds

# Rate Limiting Configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 20

# Security Configuration
CORS_ORIGINS = ['*']  # In production, specify actual origins
MAX_REQUEST_SIZE = 1024  # bytes for search queries

# Performance Configuration
ASYNC_TIMEOUT = 30  # seconds
MAX_WORKERS = 4
KEEP_ALIVE_TIMEOUT = 30

# Error Handling Configuration
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
EXPONENTIAL_BACKOFF = True

# Create necessary directories
SESSIONS_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# Configuration dictionary
config = {
    'telegram': {
        'api_id': TELEGRAM_API_ID,
        'api_hash': TELEGRAM_API_HASH,
        'phone': TELEGRAM_PHONE,
        'session_name': SESSION_NAME,
        'vk_bot': VK_MUSIC_BOT
    },
    'search': {
        'timeout': SEARCH_TIMEOUT,
        'max_concurrent': MAX_CONCURRENT_SEARCHES,
        'rate_limit': SEARCH_RATE_LIMIT
    },
    'server': {
        'host': SERVER_HOST,
        'port': SERVER_PORT,
        'debug': DEBUG
    },
    'logging': {
        'level': LOG_LEVEL,
        'dir': LOG_DIR,
        'max_size': MAX_LOG_SIZE,
        'backup_count': LOG_BACKUP_COUNT
    },
    'files': {
        'max_size': MAX_FILE_SIZE,
        'allowed_formats': ALLOWED_AUDIO_FORMATS,
        'temp_dir': TEMP_DIR
    },
    'performance': {
        'async_timeout': ASYNC_TIMEOUT,
        'max_workers': MAX_WORKERS,
        'keep_alive_timeout': KEEP_ALIVE_TIMEOUT
    }
}
