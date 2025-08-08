/**
 * Game Handler
 * Manages interactive games (Tic-Tac-Toe and Rock-Paper-Scissors)
 */

const TicTacToe = require('../../games/ticTacToe');
const RockPaperScissors = require('../../games/rockPaperScissors');
const SessionManager = require('../../utils/session');
const logger = require('../../utils/logger');

class GameHandler {
    constructor() {
        this.sessionManager = new SessionManager();
        this.ticTacToeGames = new Map();
        this.rpsGames = new Map();
    }

    /**
     * Start a new Tic-Tac-Toe game
     */
    async startTicTacToe(sock, senderId, args, senderName) {
        try {
            // End any existing game for this user
            this.endAllGamesForUser(senderId);

            // Create new game
            const game = new TicTacToe();
            this.ticTacToeGames.set(senderId, game);
            this.sessionManager.createSession(senderId, 'tictactoe');

            const gameText = `
🎮 *Tic-Tac-Toe avec ${senderName}*

${game.displayBoard()}

🎯 Vous êtes **X**, je suis **O**
📝 Tapez un chiffre de 1 à 9 pour jouer
❌ Tapez "quit" pour arrêter

C'est votre tour! Choisissez une case:
            `;

            await sock.sendMessage(senderId, { text: gameText });
            logger.info(`Started Tic-Tac-Toe game for ${senderId}`);
        } catch (error) {
            logger.error('Error starting Tic-Tac-Toe:', error);
            await sock.sendMessage(senderId, { 
                text: '❌ Erreur lors du démarrage du jeu. Réessayez.' 
            });
        }
    }

    /**
     * Start a new Rock-Paper-Scissors game
     */
    async startRockPaperScissors(sock, senderId, args, senderName) {
        try {
            // End any existing game for this user
            this.endAllGamesForUser(senderId);

            // Create new game
            const game = new RockPaperScissors();
            this.rpsGames.set(senderId, game);
            this.sessionManager.createSession(senderId, 'rps');

            const gameText = `
🎮 *Pierre-Feuille-Ciseaux avec ${senderName}*

🗿 Pierre bat Ciseaux
📄 Feuille bat Pierre  
✂️ Ciseaux bat Feuille

*Choisissez votre coup:*
• Tapez **pierre** ou **1**
• Tapez **feuille** ou **2**
• Tapez **ciseaux** ou **3**
• Tapez **quit** pour arrêter

Score: Vous ${game.playerScore} - ${game.botScore} Bot

Faites votre choix! 🎲
            `;

            await sock.sendMessage(senderId, { text: gameText });
            logger.info(`Started Rock-Paper-Scissors game for ${senderId}`);
        } catch (error) {
            logger.error('Error starting Rock-Paper-Scissors:', error);
            await sock.sendMessage(senderId, { 
                text: '❌ Erreur lors du démarrage du jeu. Réessayez.' 
            });
        }
    }

    /**
     * Handle game input from user
     */
    async handleGameInput(sock, senderId, input) {
        const session = this.sessionManager.getSession(senderId);
        
        if (!session) return false;

        if (input.toLowerCase() === 'quit') {
            await this.endGame(sock, senderId);
            return true;
        }

        try {
            if (session.type === 'tictactoe') {
                return await this.handleTicTacToeInput(sock, senderId, input);
            } else if (session.type === 'rps') {
                return await this.handleRPSInput(sock, senderId, input);
            }
        } catch (error) {
            logger.error('Error handling game input:', error);
            await sock.sendMessage(senderId, { 
                text: '❌ Erreur dans le jeu. Tapez "quit" pour arrêter.' 
            });
        }

        return false;
    }

    /**
     * Handle Tic-Tac-Toe game input
     */
    async handleTicTacToeInput(sock, senderId, input) {
        const game = this.ticTacToeGames.get(senderId);
        if (!game) return false;

        const position = parseInt(input);
        if (isNaN(position) || position < 1 || position > 9) {
            await sock.sendMessage(senderId, { 
                text: '❌ Veuillez entrer un chiffre de 1 à 9.' 
            });
            return true;
        }

        // Player move
        const playerMoveResult = game.makeMove(position - 1, 'X');
        if (!playerMoveResult) {
            await sock.sendMessage(senderId, { 
                text: '❌ Cette case est déjà occupée! Choisissez une autre case.' 
            });
            return true;
        }

        let gameText = `🎮 *Tic-Tac-Toe*\n\n${game.displayBoard()}\n\n`;

        // Check if player won
        if (game.checkWinner() === 'X') {
            gameText += '🎉 **Vous avez gagné!** Félicitations! 🏆';
            await sock.sendMessage(senderId, { text: gameText });
            this.endGameForUser(senderId);
            return true;
        }

        // Check if draw
        if (game.isDraw()) {
            gameText += '🤝 **Match nul!** Bien joué! ⚖️';
            await sock.sendMessage(senderId, { text: gameText });
            this.endGameForUser(senderId);
            return true;
        }

        // Bot move
        const botMove = game.getBestMove();
        game.makeMove(botMove, 'O');
        
        gameText = `🎮 *Tic-Tac-Toe*\n\n${game.displayBoard()}\n\n`;

        // Check if bot won
        if (game.checkWinner() === 'O') {
            gameText += '🤖 **J\'ai gagné!** Bonne partie! 🎯\n\nTapez /tictactoe pour rejouer!';
            await sock.sendMessage(senderId, { text: gameText });
            this.endGameForUser(senderId);
            return true;
        }

        // Check if draw after bot move
        if (game.isDraw()) {
            gameText += '🤝 **Match nul!** Bien joué! ⚖️\n\nTapez /tictactoe pour rejouer!';
            await sock.sendMessage(senderId, { text: gameText });
            this.endGameForUser(senderId);
            return true;
        }

        gameText += '🎯 Votre tour! Choisissez une case (1-9):';
        await sock.sendMessage(senderId, { text: gameText });

        return true;
    }

    /**
     * Handle Rock-Paper-Scissors game input
     */
    async handleRPSInput(sock, senderId, input) {
        const game = this.rpsGames.get(senderId);
        if (!game) return false;

        let playerChoice;
        const lowerInput = input.toLowerCase();

        // Parse player input
        if (lowerInput === 'pierre' || lowerInput === '1' || lowerInput === 'rock') {
            playerChoice = 'pierre';
        } else if (lowerInput === 'feuille' || lowerInput === '2' || lowerInput === 'paper') {
            playerChoice = 'feuille';
        } else if (lowerInput === 'ciseaux' || lowerInput === '3' || lowerInput === 'scissors') {
            playerChoice = 'ciseaux';
        } else {
            await sock.sendMessage(senderId, { 
                text: '❌ Choix invalide! Tapez: pierre, feuille, ciseaux (ou 1, 2, 3)' 
            });
            return true;
        }

        const result = game.playRound(playerChoice);
        
        let resultText = `🎮 *Pierre-Feuille-Ciseaux*\n\n`;
        resultText += `🧑 Vous: ${this.getChoiceEmoji(playerChoice)} ${playerChoice}\n`;
        resultText += `🤖 Bot: ${this.getChoiceEmoji(result.botChoice)} ${result.botChoice}\n\n`;

        if (result.winner === 'player') {
            resultText += '🎉 **Vous gagnez ce round!**';
        } else if (result.winner === 'bot') {
            resultText += '🤖 **Je gagne ce round!**';
        } else {
            resultText += '🤝 **Égalité ce round!**';
        }

        resultText += `\n\n📊 **Score:**\nVous: ${game.playerScore} | Bot: ${game.botScore}`;

        // Check if game should end (first to 3 wins)
        if (game.playerScore >= 3 || game.botScore >= 3) {
            if (game.playerScore > game.botScore) {
                resultText += '\n\n🏆 **VOUS GAGNEZ LA PARTIE!** Félicitations! 🎉';
            } else {
                resultText += '\n\n🤖 **J\'AI GAGNÉ LA PARTIE!** Bien tenté! 🎯';
            }
            resultText += '\n\nTapez /rps pour rejouer!';
            
            await sock.sendMessage(senderId, { text: resultText });
            this.endGameForUser(senderId);
        } else {
            resultText += '\n\n🎲 Faites votre prochain choix:';
            resultText += '\n• pierre/1 🗿 • feuille/2 📄 • ciseaux/3 ✂️';
            await sock.sendMessage(senderId, { text: resultText });
        }

        return true;
    }

    /**
     * Get emoji for choice
     */
    getChoiceEmoji(choice) {
        const emojis = {
            'pierre': '🗿',
            'feuille': '📄',
            'ciseaux': '✂️'
        };
        return emojis[choice] || '❓';
    }

    /**
     * End a specific game session
     */
    async endGame(sock, senderId) {
        const session = this.sessionManager.getSession(senderId);
        
        if (session) {
            let gameType;
            if (session.type === 'tictactoe') {
                gameType = 'Tic-Tac-Toe';
            } else if (session.type === 'rps') {
                gameType = 'Pierre-Feuille-Ciseaux';
            }

            await sock.sendMessage(senderId, { 
                text: `🔚 Partie de ${gameType} terminée!\n\nTapez /menu pour voir les autres options.` 
            });
        }

        this.endGameForUser(senderId);
    }

    /**
     * End all games for a user
     */
    endAllGamesForUser(senderId) {
        this.ticTacToeGames.delete(senderId);
        this.rpsGames.delete(senderId);
        this.sessionManager.endSession(senderId);
    }

    /**
     * End game for user (internal)
     */
    endGameForUser(senderId) {
        this.endAllGamesForUser(senderId);
        logger.info(`Ended game session for ${senderId}`);
    }
}

module.exports = GameHandler;
