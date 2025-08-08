/**
 * Music Handler
 * Handles music search and retrieval requests via Telegram bridge
 */

const axios = require('axios');
const logger = require('../../utils/logger');
const config = require('../../config/config');

class MusicHandler {
    constructor() {
        this.telegramBridgeUrl = process.env.TELEGRAM_BRIDGE_URL || 'http://localhost:8000';
        this.isSearching = new Set(); // Track ongoing searches
    }

    /**
     * Handle music search request
     */
    async handleMusicSearch(sock, senderId, query, isDirectCommand = false) {
        try {
            // Prevent multiple simultaneous searches from same user
            if (this.isSearching.has(senderId)) {
                await sock.sendMessage(senderId, { 
                    text: '⏳ Recherche en cours... Veuillez patienter.' 
                });
                return;
            }

            this.isSearching.add(senderId);

            // Clean query
            const cleanQuery = query.replace(/^\/search\s*/i, '').trim();
            
            if (cleanQuery.length < 2) {
                await sock.sendMessage(senderId, { 
                    text: '❌ Veuillez entrer au moins 2 caractères pour la recherche.' 
                });
                this.isSearching.delete(senderId);
                return;
            }

            logger.info(`🔍 Music search request from ${senderId}: "${cleanQuery}"`);

            // Send searching message
            await sock.sendMessage(senderId, { 
                text: `🔍 Recherche de musique pour: *${cleanQuery}*\n\n⏳ Recherche en cours...` 
            });

            // Try to search music through Telegram bridge
            try {
                const response = await this.searchMusic(cleanQuery);
                
                if (response.success && response.audio_url) {
                    // Send success message
                    await sock.sendMessage(senderId, { 
                        text: `✅ Musique trouvée: *${response.title || cleanQuery}*\n\n📤 Envoi en cours...` 
                    });

                    // Download and send audio
                    await this.sendAudioFromUrl(sock, senderId, response.audio_url, response.title);
                    
                } else {
                    await sock.sendMessage(senderId, { 
                        text: `❌ Aucune musique trouvée pour: *${cleanQuery}*\n\n💡 Essayez avec:\n• Le nom de l'artiste et le titre\n• Des mots-clés différents\n• L'orthographe exacte` 
                    });
                }
            } catch (error) {
                logger.error('Music search error:', error);
                await sock.sendMessage(senderId, { 
                    text: `🎵 *Service musical temporairement indisponible*\n\nRecherche demandée: *${cleanQuery}*\n\n⚙️ Le service de recherche musicale est en cours de configuration. Veuillez réessayer dans quelques minutes.\n\nEn attendant, profitez des jeux disponibles avec /tictactoe ou /rps !` 
                });
            }

        } catch (error) {
            logger.error('Error in music search:', error);
            await sock.sendMessage(senderId, { 
                text: '❌ Erreur lors de la recherche musicale. Le service est temporairement indisponible.' 
            });
        } finally {
            this.isSearching.delete(senderId);
        }
    }

    /**
     * Handle direct music request command
     */
    async handleMusicRequest(sock, senderId, args) {
        const query = args.join(' ').trim();
        
        if (!query) {
            await sock.sendMessage(senderId, { 
                text: '🎵 *Recherche musicale*\n\n📝 Usage: /music [artiste - titre]\n\n💡 Exemples:\n• /music Eminem - Lose Yourself\n• /music Bob Marley No Woman No Cry\n• /music Céline Dion My Heart Will Go On' 
            });
            return;
        }

        await this.handleMusicSearch(sock, senderId, query, true);
    }

    /**
     * Search music via Telegram bridge
     */
    async searchMusic(query) {
        try {
            const response = await axios.post(`${this.telegramBridgeUrl}/search`, {
                query: query,
                timeout: 30000
            }, {
                timeout: 35000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                logger.error('Telegram bridge service is not available');
                throw new Error('Music service temporarily unavailable');
            } else if (error.response) {
                logger.error('Telegram bridge error:', error.response.data);
                throw new Error(error.response.data.error || 'Search failed');
            } else {
                logger.error('Network error during music search:', error.message);
                throw new Error('Network error during search');
            }
        }
    }

    /**
     * Download and send audio from URL
     */
    async sendAudioFromUrl(sock, senderId, audioUrl, title = 'Music') {
        try {
            logger.info(`📥 Downloading audio from: ${audioUrl}`);

            // Download audio file
            const response = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 60000, // 1 minute timeout
                maxContentLength: 50 * 1024 * 1024, // 50MB max
                headers: {
                    'User-Agent': 'WhatsApp-Music-Bot/1.0'
                }
            });

            const audioBuffer = Buffer.from(response.data);
            
            logger.info(`📤 Sending audio file (${audioBuffer.length} bytes) to ${senderId}`);

            // Send audio
            await sock.sendMessage(senderId, {
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: false,
                fileName: `${title}.mp3`
            });

            await sock.sendMessage(senderId, { 
                text: `🎵 *${title}*\n\n✅ Envoyé avec succès!\n\n💡 Tapez le nom d'une autre chanson pour continuer.` 
            });

            logger.info(`✅ Audio sent successfully to ${senderId}`);

        } catch (error) {
            logger.error('Error downloading/sending audio:', error);
            
            let errorMessage = '❌ Erreur lors de l\'envoi de l\'audio.';
            
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                errorMessage += ' Timeout de téléchargement.';
            } else if (error.message.includes('Request failed')) {
                errorMessage += ' Fichier audio non disponible.';
            }
            
            await sock.sendMessage(senderId, { text: errorMessage });
        }
    }

    /**
     * Validate audio URL
     */
    isValidAudioUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
}

module.exports = MusicHandler;
