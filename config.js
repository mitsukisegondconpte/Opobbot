/**
 * Configuration for Node.js WhatsApp Bot
 */

const config = {
    // WhatsApp Bot Configuration
    whatsapp: {
        sessionPath: './auth_info',
        maxReconnectAttempts: 5,
        reconnectDelay: 5000,
        keepAliveInterval: 10000,
        connectTimeout: 60000,
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0']
    },

    // Game Configuration
    games: {
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        cleanupInterval: 5 * 60 * 1000, // 5 minutes
        ticTacToe: {
            maxGames: 100,
            aiDifficulty: 'hard'
        },
        rockPaperScissors: {
            maxScore: 3,
            maxGames: 50
        }
    },

    // Music Service Configuration
    music: {
        telegramBridgeUrl: process.env.TELEGRAM_BRIDGE_URL || 'http://localhost:8000',
        searchTimeout: 35000,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        downloadTimeout: 60000
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'INFO',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        logDirectory: './logs'
    },

    // Server Configuration
    server: {
        port: process.env.PORT || 5000,
        host: '0.0.0.0',
        healthCheckInterval: 30000
    },

    // Rate Limiting
    rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // limit each IP to 100 requests per windowMs
        gameRequests: 20, // limit game requests per user
        musicRequests: 10 // limit music requests per user
    },

    // Messages Configuration
    messages: {
        language: process.env.BOT_LANGUAGE || 'fr', // fr, en, ht
        welcomeMessage: true,
        helpMessage: true,
        errorMessages: true
    }
};

module.exports = config;
