/**
 * Tic-Tac-Toe Game Engine
 * Implements game logic with AI opponent
 */

class TicTacToe {
    constructor() {
        this.board = Array(9).fill(' ');
        this.currentPlayer = 'X'; // Player is X, Bot is O
    }

    /**
     * Display the game board with emojis
     */
    displayBoard() {
        const symbols = {
            ' ': (i) => `${i + 1}️⃣`,
            'X': () => '❌',
            'O': () => '⭕'
        };

        const boardDisplay = [];
        for (let i = 0; i < 9; i += 3) {
            const row = [
                symbols[this.board[i]](i),
                symbols[this.board[i + 1]](i + 1),
                symbols[this.board[i + 2]](i + 2)
            ].join(' ');
            boardDisplay.push(row);
        }

        return boardDisplay.join('\n');
    }

    /**
     * Make a move on the board
     */
    makeMove(position, player) {
        if (position < 0 || position > 8 || this.board[position] !== ' ') {
            return false;
        }

        this.board[position] = player;
        return true;
    }

    /**
     * Check for winner
     */
    checkWinner() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] !== ' ' && 
                this.board[a] === this.board[b] && 
                this.board[b] === this.board[c]) {
                return this.board[a];
            }
        }

        return null;
    }

    /**
     * Check if the game is a draw
     */
    isDraw() {
        return !this.board.includes(' ') && !this.checkWinner();
    }

    /**
     * Get available moves
     */
    getAvailableMoves() {
        return this.board
            .map((cell, index) => cell === ' ' ? index : null)
            .filter(index => index !== null);
    }

    /**
     * Get the best move for the bot using minimax algorithm
     */
    getBestMove() {
        const availableMoves = this.getAvailableMoves();
        
        if (availableMoves.length === 0) return -1;

        // If it's the first move, take center or corner
        if (availableMoves.length === 9) {
            return Math.random() < 0.7 ? 4 : [0, 2, 6, 8][Math.floor(Math.random() * 4)];
        }

        let bestScore = -Infinity;
        let bestMove = availableMoves[0];

        for (const move of availableMoves) {
            this.board[move] = 'O';
            const score = this.minimax(0, false);
            this.board[move] = ' ';

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Minimax algorithm for AI decision making
     */
    minimax(depth, isMaximizing) {
        const winner = this.checkWinner();
        
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isDraw()) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            const availableMoves = this.getAvailableMoves();
            
            for (const move of availableMoves) {
                this.board[move] = 'O';
                const score = this.minimax(depth + 1, false);
                this.board[move] = ' ';
                bestScore = Math.max(score, bestScore);
            }
            
            return bestScore;
        } else {
            let bestScore = Infinity;
            const availableMoves = this.getAvailableMoves();
            
            for (const move of availableMoves) {
                this.board[move] = 'X';
                const score = this.minimax(depth + 1, true);
                this.board[move] = ' ';
                bestScore = Math.min(score, bestScore);
            }
            
            return bestScore;
        }
    }

    /**
     * Reset the game
     */
    reset() {
        this.board = Array(9).fill(' ');
        this.currentPlayer = 'X';
    }
}

module.exports = TicTacToe;
