/**
 * Logger Utility
 * Provides consistent logging across the application
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = process.env.LOG_LEVEL ? 
            this.logLevels[process.env.LOG_LEVEL.toUpperCase()] : 
            this.logLevels.INFO;
        
        this.colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            DEBUG: '\x1b[35m', // Magenta
            RESET: '\x1b[0m'
        };

        // Create logs directory if it doesn't exist
        this.logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    /**
     * Format log message with timestamp and level
     */
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';
        
        return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
    }

    /**
     * Write log to console and file
     */
    writeLog(level, message, ...args) {
        if (this.logLevels[level] > this.currentLevel) return;

        const formattedMessage = this.formatMessage(level, message, ...args);
        
        // Console output with colors
        const colorCode = this.colors[level] || '';
        const resetCode = this.colors.RESET;
        console.log(`${colorCode}${formattedMessage}${resetCode}`);

        // File output
        this.writeToFile(formattedMessage);
    }

    /**
     * Write log message to file
     */
    writeToFile(message) {
        try {
            const logFile = path.join(this.logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Error level logging
     */
    error(message, ...args) {
        this.writeLog('ERROR', message, ...args);
    }

    /**
     * Warning level logging
     */
    warn(message, ...args) {
        this.writeLog('WARN', message, ...args);
    }

    /**
     * Info level logging
     */
    info(message, ...args) {
        this.writeLog('INFO', message, ...args);
    }

    /**
     * Debug level logging
     */
    debug(message, ...args) {
        this.writeLog('DEBUG', message, ...args);
    }

    /**
     * Clean old log files (keep last 7 days)
     */
    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logsDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);

            files.forEach(file => {
                if (file.startsWith('app-') && file.endsWith('.log')) {
                    const filePath = path.join(this.logsDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        this.info(`Deleted old log file: ${file}`);
                    }
                }
            });
        } catch (error) {
            this.error('Failed to clean old logs:', error);
        }
    }
}

// Create and export singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

// Schedule daily cleanup
setInterval(() => {
    logger.cleanOldLogs();
}, 24 * 60 * 60 * 1000); // 24 hours

module.exports = logger;
