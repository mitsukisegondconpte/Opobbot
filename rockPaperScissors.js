/**
 * Rock-Paper-Scissors Game Engine
 * Implements game logic with score tracking
 */

class RockPaperScissors {
    constructor() {
        this.choices = ['pierre', 'feuille', 'ciseaux'];
        this.playerScore = 0;
        this.botScore = 0;
        this.rounds = 0;
        this.history = [];
    }

    /**
     * Play a round of Rock-Paper-Scissors
     */
    playRound(playerChoice) {
        if (!this.choices.includes(playerChoice)) {
            throw new Error('Invalid choice');
        }

        const botChoice = this.getBotChoice();
        const winner = this.determineWinner(playerChoice, botChoice);

        // Update scores
        if (winner === 'player') {
            this.playerScore++;
        } else if (winner === 'bot') {
            this.botScore++;
        }

        this.rounds++;
        this.history.push({
            round: this.rounds,
            playerChoice,
            botChoice,
            winner
        });

        return {
            playerChoice,
            botChoice,
            winner,
            playerScore: this.playerScore,
            botScore: this.botScore
        };
    }

    /**
     * Get bot's choice with some strategy
     */
    getBotChoice() {
        // For the first few rounds, play randomly
        if (this.history.length < 3) {
            return this.choices[Math.floor(Math.random() * 3)];
        }

        // Try to counter player's most frequent choice
        const playerChoices = this.history.map(h => h.playerChoice);
        const choiceCount = {};
        
        playerChoices.forEach(choice => {
            choiceCount[choice] = (choiceCount[choice] || 0) + 1;
        });

        const mostFrequentChoice = Object.keys(choiceCount)
            .reduce((a, b) => choiceCount[a] > choiceCount[b] ? a : b);

        // Counter the most frequent choice 60% of the time
        if (Math.random() < 0.6) {
            return this.getCounterChoice(mostFrequentChoice);
        }

        // Otherwise play randomly
        return this.choices[Math.floor(Math.random() * 3)];
    }

    /**
     * Get the choice that beats the given choice
     */
    getCounterChoice(choice) {
        const counters = {
            'pierre': 'feuille',
            'feuille': 'ciseaux',
            'ciseaux': 'pierre'
        };
        return counters[choice];
    }

    /**
     * Determine the winner of a round
     */
    determineWinner(playerChoice, botChoice) {
        if (playerChoice === botChoice) {
            return 'tie';
        }

        const winConditions = {
            'pierre': 'ciseaux',
            'feuille': 'pierre',
            'ciseaux': 'feuille'
        };

        return winConditions[playerChoice] === botChoice ? 'player' : 'bot';
    }

    /**
     * Get game statistics
     */
    getStats() {
        const totalRounds = this.rounds;
        const playerWins = this.history.filter(h => h.winner === 'player').length;
        const botWins = this.history.filter(h => h.winner === 'bot').length;
        const ties = this.history.filter(h => h.winner === 'tie').length;

        return {
            totalRounds,
            playerWins,
            botWins,
            ties,
            playerWinRate: totalRounds > 0 ? (playerWins / totalRounds * 100).toFixed(1) : 0,
            botWinRate: totalRounds > 0 ? (botWins / totalRounds * 100).toFixed(1) : 0
        };
    }

    /**
     * Reset the game
     */
    reset() {
        this.playerScore = 0;
        this.botScore = 0;
        this.rounds = 0;
        this.history = [];
    }

    /**
     * Check if game is over (first to reach target score)
     */
    isGameOver(targetScore = 3) {
        return this.playerScore >= targetScore || this.botScore >= targetScore;
    }

    /**
     * Get the final winner
     */
    getFinalWinner() {
        if (this.playerScore > this.botScore) {
            return 'player';
        } else if (this.botScore > this.playerScore) {
            return 'bot';
        }
        return 'tie';
    }
}

module.exports = RockPaperScissors;
