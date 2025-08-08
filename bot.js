/**
 * WhatsApp Bot Core Implementation
 * Handles connection, authentication, and message routing
 */

const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const MessageHandler = require('./handlers/messageHandler');
const SessionManager = require('../utils/session');
const logger = require('../utils/logger');
const config = require('../config/config');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.isConnectedFlag = false;
        this.messageHandler = new MessageHandler();
        this.sessionManager = new SessionManager();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    /**
     * Initialize the WhatsApp bot connection
     */
    async initialize() {
        try {
            // Get latest Baileys version
            const { version } = await fetchLatestBaileysVersion();
            logger.info(`Using Baileys version: ${version}`);

            // Setup authentication state
            const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

            // Create WhatsApp socket
            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
            });

            // Setup event handlers
            this.setupEventHandlers(saveCreds);

        } catch (error) {
            logger.error('Failed to initialize WhatsApp bot:', error);
            throw error;
        }
    }

    /**
     * Setup event handlers for WhatsApp connection
     */
    setupEventHandlers(saveCreds) {
        // Connection state updates
        this.sock.ev.on('connection.update', (update) => {
            this.handleConnectionUpdate(update);
        });

        // Authentication state updates
        this.sock.ev.on('creds.update', saveCreds);

        // Incoming messages
        this.sock.ev.on('messages.upsert', async (m) => {
            await this.handleIncomingMessages(m);
        });

        // Message receipts
        this.sock.ev.on('message-receipt.update', (update) => {
            logger.debug('Message receipt update:', update);
        });

        // Presence updates
        this.sock.ev.on('presence.update', (update) => {
            logger.debug('Presence update:', update);
        });
    }

    /**
     * Handle connection state updates
     */
    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            logger.info('📱 Scan the QR code to connect:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            this.isConnectedFlag = false;
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode) !== DisconnectReason.loggedOut;
            
            logger.warn('Connection closed:', lastDisconnect?.error);

            if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                logger.info(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                
                setTimeout(() => {
                    this.initialize();
                }, 5000);
            } else {
                logger.error('❌ Max reconnection attempts reached or logged out');
            }
        } else if (connection === 'open') {
            this.isConnectedFlag = true;
            this.reconnectAttempts = 0;
            logger.info('✅ WhatsApp connection established successfully');
        }
    }

    /**
     * Handle incoming messages
     */
    async handleIncomingMessages(messageUpdate) {
        try {
            const messages = messageUpdate.messages;
            
            for (const message of messages) {
                if (message.key.fromMe) continue; // Ignore own messages
                
                await this.messageHandler.handleMessage(this.sock, message);
            }
        } catch (error) {
            logger.error('Error handling incoming message:', error);
        }
    }

    /**
     * Send a text message
     */
    async sendMessage(jid, text) {
        try {
            if (!this.isConnectedFlag) {
                throw new Error('Bot is not connected');
            }

            await this.sock.sendMessage(jid, { text });
            logger.debug(`Message sent to ${jid}: ${text}`);
        } catch (error) {
            logger.error('Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Send an image with caption
     */
    async sendImage(jid, imageBuffer, caption = '') {
        try {
            if (!this.isConnectedFlag) {
                throw new Error('Bot is not connected');
            }

            await this.sock.sendMessage(jid, { 
                image: imageBuffer, 
                caption 
            });
            logger.debug(`Image sent to ${jid}`);
        } catch (error) {
            logger.error('Failed to send image:', error);
            throw error;
        }
    }

    /**
     * Send an audio file
     */
    async sendAudio(jid, audioBuffer) {
        try {
            if (!this.isConnectedFlag) {
                throw new Error('Bot is not connected');
            }

            await this.sock.sendMessage(jid, { 
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: false // Set to true for voice message
            });
            logger.debug(`Audio sent to ${jid}`);
        } catch (error) {
            logger.error('Failed to send audio:', error);
            throw error;
        }
    }

    /**
     * Check if bot is connected
     */
    isConnected() {
        return this.isConnectedFlag;
    }

    /**
     * Get active game sessions count
     */
    getActiveSessions() {
        return this.sessionManager.getActiveSessionsCount();
    }

    /**
     * Disconnect the bot
     */
    async disconnect() {
        try {
            if (this.sock) {
                await this.sock.logout();
                this.isConnectedFlag = false;
                logger.info('🔌 Bot disconnected successfully');
            }
        } catch (error) {
            logger.error('Error during disconnect:', error);
        }
    }
}

module.exports = WhatsAppBot;
