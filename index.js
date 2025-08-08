/**
 * Main entry point for WhatsApp Bot
 * Handles bot initialization and connection management
 */

const express = require('express');
const WhatsAppBot = require('./whatsapp/bot');
const config = require('./config/config');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

let bot = null;

/**
 * Initialize and start the WhatsApp bot
 */
async function startBot() {
    try {
        logger.info('🚀 Starting WhatsApp Bot...');
        
        bot = new WhatsAppBot();
        await bot.initialize();
        
        logger.info('✅ WhatsApp Bot started successfully');
    } catch (error) {
        logger.error('❌ Failed to start WhatsApp Bot:', error);
        process.exit(1);
    }
}

/**
 * Main page endpoint
 */
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot WhatsApp Musical</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
                .header { text-align: center; background: linear-gradient(135deg, #25D366, #128C7E); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
                .status { background: #e8f5e8; border: 1px solid #25D366; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
                .feature { background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; }
                .qr-info { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #666; margin-top: 40px; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎵 Bot WhatsApp Musical</h1>
                <p>Bot intelligent avec jeux interactifs et recherche musicale</p>
            </div>
            
            <div class="status">
                <h3>✅ Statut : Bot Actif</h3>
                <p>Le bot WhatsApp fonctionne et est prêt à recevoir des connexions.</p>
            </div>
            
            <div class="qr-info">
                <h3>📱 Comment se connecter</h3>
                <p><strong>1. Scanner le QR Code :</strong> Le QR code s'affiche dans les logs du serveur</p>
                <p><strong>2. Ouvrir WhatsApp :</strong> Aller dans Paramètres → Appareils liés → Lier un appareil</p>
                <p><strong>3. Scanner :</strong> Pointer la caméra vers le QR code affiché dans les logs</p>
            </div>

            <div class="features">
                <div class="feature">
                    <h3>🎯 Tic-Tac-Toe</h3>
                    <p>Jouer contre l'IA</p>
                    <code>/tictactoe</code>
                </div>
                <div class="feature">
                    <h3>✂️ Pierre-Papier-Ciseaux</h3>
                    <p>Jeu classique interactif</p>
                    <code>/rps</code>
                </div>
                <div class="feature">
                    <h3>🎵 Recherche Musicale</h3>
                    <p>Recherche YouTube intégrée</p>
                    <code>🎵 nom de la chanson</code>
                </div>
                <div class="feature">
                    <h3>ℹ️ Aide</h3>
                    <p>Liste des commandes</p>
                    <code>/help</code>
                </div>
            </div>

            <div class="footer">
                <p>Bot WhatsApp Musical - Développé avec Baileys & Node.js</p>
                <p>Documentation disponible en Français, English et Kreyòl Ayisyen</p>
            </div>
        </body>
        </html>
    `);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bot_connected: bot ? bot.isConnected() : false
    });
});

/**
 * Bot status endpoint
 */
app.get('/status', (req, res) => {
    if (!bot) {
        return res.status(503).json({ error: 'Bot not initialized' });
    }
    
    res.json({
        connected: bot.isConnected(),
        sessions: bot.getActiveSessions(),
        uptime: process.uptime()
    });
});

/**
 * Restart bot endpoint
 */
app.post('/restart', async (req, res) => {
    try {
        logger.info('🔄 Restarting bot...');
        
        if (bot) {
            await bot.disconnect();
        }
        
        await startBot();
        res.json({ message: 'Bot restarted successfully' });
    } catch (error) {
        logger.error('Failed to restart bot:', error);
        res.status(500).json({ error: 'Failed to restart bot' });
    }
});

/**
 * Graceful shutdown handler
 */
process.on('SIGINT', async () => {
    logger.info('🛑 Shutting down gracefully...');
    
    if (bot) {
        await bot.disconnect();
    }
    
    process.exit(0);
});

/**
 * Unhandled rejection handler
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Start the application
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🌐 HTTP server running on port ${PORT}`);
    startBot();
});
