/**
 * Message Handler
 * Routes and processes incoming WhatsApp messages
 */

const GameHandler = require('./gameHandler');
const MusicHandler = require('./musicHandler');
const SimpleMusicHandler = require('./simpleMusicHandler');
const logger = require('../../utils/logger');

class MessageHandler {
    constructor() {
        this.gameHandler = new GameHandler();
        this.musicHandler = new MusicHandler();
        this.simpleMusicHandler = new SimpleMusicHandler();
        this.commands = {
            '/help': this.handleHelpCommand.bind(this),
            '/start': this.handleStartCommand.bind(this),
            '/menu': this.handleMenuCommand.bind(this),
            '/tictactoe': this.gameHandler.startTicTacToe.bind(this.gameHandler),
            '/rps': this.gameHandler.startRockPaperScissors.bind(this.gameHandler),
            '/music': this.simpleMusicHandler.sendMusicHelp.bind(this.simpleMusicHandler),
            '/search': this.musicHandler.handleMusicSearch.bind(this.musicHandler)
        };
    }

    /**
     * Main message handling function
     */
    async handleMessage(sock, message) {
        try {
            const messageText = this.extractMessageText(message);
            const senderId = message.key.remoteJid;
            const senderName = message.pushName || 'User';

            if (!messageText) return;

            logger.info(`📨 Message from ${senderName} (${senderId}): ${messageText}`);

            // Check if it's a command
            if (messageText.startsWith('/')) {
                await this.handleCommand(sock, senderId, messageText, senderName);
            } else {
                // Check if user is in a game session
                const gameResponse = await this.gameHandler.handleGameInput(sock, senderId, messageText);
                
                if (!gameResponse) {
                    // Check if it's a music search query (starts with 🎵 or contains music keywords)
                    if (messageText.startsWith('🎵') || 
                        messageText.toLowerCase().includes('music') || 
                        messageText.toLowerCase().includes('chanson') ||
                        messageText.toLowerCase().includes('song')) {
                        // Use simple music handler for better reliability
                        const cleanQuery = messageText.replace(/^🎵\s*/, '').trim();
                        if (cleanQuery.length > 2) {
                            await this.simpleMusicHandler.handleMusicRequest(sock, senderId, cleanQuery);
                        } else {
                            await this.simpleMusicHandler.sendMusicHelp(sock, senderId);
                        }
                    } else if (messageText.length > 2) {
                        // Fallback to original music handler for other queries
                        await this.musicHandler.handleMusicSearch(sock, senderId, messageText);
                    } else {
                        await this.handleGeneralMessage(sock, senderId, messageText, senderName);
                    }
                }
            }
        } catch (error) {
            logger.error('Error in message handler:', error);
            await this.sendErrorMessage(sock, message.key.remoteJid);
        }
    }

    /**
     * Extract text content from message
     */
    extractMessageText(message) {
        const messageType = Object.keys(message.message || {})[0];
        
        if (messageType === 'conversation') {
            return message.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            return message.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            return message.message.imageMessage.caption || '';
        }
        
        return null;
    }

    /**
     * Handle command messages
     */
    async handleCommand(sock, senderId, messageText, senderName) {
        const [command, ...args] = messageText.split(' ');
        const handler = this.commands[command.toLowerCase()];

        if (handler) {
            await handler(sock, senderId, args, senderName);
        } else {
            await sock.sendMessage(senderId, {
                text: `❌ Commande inconnue: ${command}\n\nTapez /help pour voir les commandes disponibles.`
            });
        }
    }

    /**
     * Handle general non-command messages
     */
    async handleGeneralMessage(sock, senderId, messageText, senderName) {
        const responses = [
            `Salut ${senderName}! 👋 Tapez /help pour voir ce que je peux faire.`,
            `Bonjour! 😊 Utilisez /menu pour voir les options disponibles.`,
            `Coucou! 🤖 Tapez /help pour découvrir mes fonctionnalités.`
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        await sock.sendMessage(senderId, { text: response });
    }

    /**
     * Handle /help command
     */
    async handleHelpCommand(sock, senderId) {
        const helpText = `
🤖 *Bot WhatsApp - Aide*

*Commandes disponibles:*

🎮 *Jeux:*
• /tictactoe - Jouer au Tic-Tac-Toe
• /rps - Pierre-Feuille-Ciseaux

🎵 *Musique:*
• /music [artiste - titre] - Rechercher de la musique
• /search [query] - Recherche personnalisée

ℹ️ *Général:*
• /help - Afficher cette aide
• /menu - Menu principal
• /start - Redémarrer

*Comment utiliser:*
1. Tapez une commande pour commencer
2. Suivez les instructions affichées
3. Pour la musique, écrivez simplement le nom de la chanson

*Exemples:*
• /music Eminem - Lose Yourself
• /search Bob Marley No Woman No Cry
• /tictactoe

Amusez-vous bien! 🎉
        `;

        await sock.sendMessage(senderId, { text: helpText });
    }

    /**
     * Handle /start command
     */
    async handleStartCommand(sock, senderId, args, senderName) {
        const welcomeText = `
🎉 *Bienvenue ${senderName}!*

Je suis votre bot WhatsApp polyvalent! 🤖

*Ce que je peux faire:*
• 🎮 Jeux interactifs (Tic-Tac-Toe, Pierre-Feuille-Ciseaux)
• 🎵 Recherche et envoi de musique
• 💬 Conversations amusantes

Tapez /help pour voir toutes les commandes disponibles ou /menu pour un accès rapide.

Prêt à commencer? 🚀
        `;

        await sock.sendMessage(senderId, { text: welcomeText });
    }

    /**
     * Handle /menu command
     */
    async handleMenuCommand(sock, senderId) {
        const menuText = `
📋 *Menu Principal*

Choisissez une option:

1️⃣ *Jeux*
   • /tictactoe - Tic-Tac-Toe
   • /rps - Pierre-Feuille-Ciseaux

2️⃣ *Musique* 🎵
   • /music [recherche] - Trouver de la musique
   • Ou écrivez simplement le nom d'une chanson

3️⃣ *Aide*
   • /help - Guide complet

*Astuce:* Vous pouvez aussi simplement écrire le nom d'une chanson pour la rechercher!

Que voulez-vous faire? 😊
        `;

        await sock.sendMessage(senderId, { text: menuText });
    }

    /**
     * Send error message
     */
    async sendErrorMessage(sock, senderId) {
        await sock.sendMessage(senderId, {
            text: '❌ Une erreur est survenue. Veuillez réessayer plus tard.'
        });
    }
}

module.exports = MessageHandler;
