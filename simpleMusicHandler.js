/**
 * Simple Music Handler for WhatsApp Bot
 * Provides music search and download without complex Telegram integration
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class SimpleMusicHandler {
    constructor() {
        this.apiEndpoints = {
            // Alternative free music APIs
            youtube: 'https://youtube-search-api.vercel.app/api/search',
            soundcloud: 'https://api-v2.soundcloud.com/search/tracks'
        };
    }

    /**
     * Search for music using YouTube API
     */
    async searchYouTubeMusic(query) {
        try {
            const response = await axios.get(this.apiEndpoints.youtube, {
                params: {
                    q: query + ' audio',
                    maxResults: 5
                },
                timeout: 10000
            });

            if (response.data && response.data.items && response.data.items.length > 0) {
                const firstResult = response.data.items[0];
                return {
                    success: true,
                    title: firstResult.snippet?.title || query,
                    channel: firstResult.snippet?.channelTitle || 'Unknown',
                    videoId: firstResult.id?.videoId,
                    url: `https://www.youtube.com/watch?v=${firstResult.id?.videoId}`,
                    thumbnail: firstResult.snippet?.thumbnails?.high?.url
                };
            }

            return { success: false, error: 'No results found' };
        } catch (error) {
            logger.error('YouTube search error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle music search requests
     */
    async handleMusicRequest(sock, senderId, query) {
        try {
            logger.info(`Music search request: ${query} from ${senderId}`);

            // Search on YouTube
            const result = await this.searchYouTubeMusic(query);

            if (result.success) {
                // Send result with YouTube link
                const message = `🎵 *Musique trouvée*\n\n` +
                    `🎧 *Titre:* ${result.title}\n` +
                    `👤 *Chaîne:* ${result.channel}\n\n` +
                    `🔗 *Lien YouTube:* ${result.url}\n\n` +
                    `💡 *Pour télécharger:* Copiez le lien dans un convertisseur YouTube vers MP3\n\n` +
                    `⚡ *Astuce:* Utilisez des applications comme "YouTube to MP3" ou des sites web gratuits`;

                await sock.sendMessage(senderId, { text: message });

                // Send thumbnail if available
                if (result.thumbnail) {
                    try {
                        await sock.sendMessage(senderId, {
                            image: { url: result.thumbnail },
                            caption: `🖼️ Miniature de: ${result.title}`
                        });
                    } catch (imgError) {
                        logger.warn('Could not send thumbnail:', imgError.message);
                    }
                }

            } else {
                await sock.sendMessage(senderId, {
                    text: `❌ *Aucune musique trouvée*\n\n` +
                        `🔍 Recherche: "${query}"\n\n` +
                        `💡 *Suggestions:*\n` +
                        `• Essayez avec le nom de l'artiste et le titre\n` +
                        `• Vérifiez l'orthographe\n` +
                        `• Utilisez des mots-clés plus simples\n\n` +
                        `🎮 *En attendant, essayez nos jeux:*\n` +
                        `• /tictactoe - Tic-Tac-Toe\n` +
                        `• /rps - Pierre-Papier-Ciseaux`
                });
            }

        } catch (error) {
            logger.error('Music request handling error:', error);
            await sock.sendMessage(senderId, {
                text: `⚠️ *Erreur de recherche musicale*\n\n` +
                    `Une erreur s'est produite lors de la recherche de "${query}".\n\n` +
                    `🔄 Veuillez réessayer dans quelques minutes.\n\n` +
                    `🎮 *En attendant, essayez nos jeux:*\n` +
                    `• /tictactoe - Tic-Tac-Toe\n` +
                    `• /rps - Pierre-Papier-Ciseaux`
            });
        }
    }

    /**
     * Provide music help information
     */
    async sendMusicHelp(sock, senderId) {
        const helpMessage = `🎵 *Guide de Recherche Musicale*\n\n` +
            `📝 *Comment rechercher:*\n` +
            `• Tapez: 🎵 nom de la chanson\n` +
            `• Exemple: 🎵 Despacito Luis Fonsi\n\n` +
            `✨ *Fonctionnalités:*\n` +
            `• Recherche sur YouTube\n` +
            `• Liens directs vers les vidéos\n` +
            `• Miniatures des résultats\n` +
            `• Suggestions de téléchargement\n\n` +
            `💡 *Conseils pour de meilleurs résultats:*\n` +
            `• Incluez le nom de l'artiste\n` +
            `• Utilisez l'orthographe correcte\n` +
            `• Évitez les caractères spéciaux\n\n` +
            `🔗 *Pour télécharger la musique:*\n` +
            `1. Copiez le lien YouTube fourni\n` +
            `2. Utilisez un convertisseur YouTube vers MP3\n` +
            `3. Sites recommandés: y2mate.com, mp3convert.io\n\n` +
            `🎮 *Autres commandes disponibles:*\n` +
            `• /tictactoe - Jeu Tic-Tac-Toe\n` +
            `• /rps - Pierre-Papier-Ciseaux\n` +
            `• /help - Aide générale`;

        await sock.sendMessage(senderId, { text: helpMessage });
    }
}

module.exports = SimpleMusicHandler;