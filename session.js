/**
 * Session Manager
 * Handles user game sessions and state management
 */

const logger = require('./logger');

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        // Clean up expired sessions every 5 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);
    }

    /**
     * Create a new session for a user
     */
    createSession(userId, type, data = {}) {
        const session = {
            userId,
            type,
            data,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };

        this.sessions.set(userId, session);
        logger.debug(`Created ${type} session for user ${userId}`);
        
        return session;
    }

    /**
     * Get a user's active session
     */
    getSession(userId) {
        const session = this.sessions.get(userId);
        
        if (!session) return null;

        // Check if session has expired
        if (this.isSessionExpired(session)) {
            this.endSession(userId);
            return null;
        }

        // Update last activity
        session.lastActivity = Date.now();
        return session;
    }

    /**
     * Update session data
     */
    updateSession(userId, data) {
        const session = this.sessions.get(userId);
        
        if (session) {
            session.data = { ...session.data, ...data };
            session.lastActivity = Date.now();
            logger.debug(`Updated session for user ${userId}`);
        }
    }

    /**
     * End a user's session
     */
    endSession(userId) {
        const session = this.sessions.get(userId);
        
        if (session) {
            this.sessions.delete(userId);
            logger.debug(`Ended ${session.type} session for user ${userId}`);
            return true;
        }
        
        return false;
    }

    /**
     * Check if a session has expired
     */
    isSessionExpired(session) {
        return (Date.now() - session.lastActivity) > this.sessionTimeout;
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        let cleanedCount = 0;
        
        for (const [userId, session] of this.sessions.entries()) {
            if (this.isSessionExpired(session)) {
                this.sessions.delete(userId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} expired sessions`);
        }
    }

    /**
     * Get all active sessions
     */
    getActiveSessions() {
        const activeSessions = {};
        
        for (const [userId, session] of this.sessions.entries()) {
            if (!this.isSessionExpired(session)) {
                activeSessions[userId] = {
                    type: session.type,
                    duration: Date.now() - session.createdAt
                };
            }
        }
        
        return activeSessions;
    }

    /**
     * Get active sessions count
     */
    getActiveSessionsCount() {
        return Object.keys(this.getActiveSessions()).length;
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        const stats = {
            total: this.sessions.size,
            byType: {},
            averageDuration: 0
        };

        let totalDuration = 0;
        
        for (const session of this.sessions.values()) {
            if (!this.isSessionExpired(session)) {
                const type = session.type;
                stats.byType[type] = (stats.byType[type] || 0) + 1;
                totalDuration += Date.now() - session.createdAt;
            }
        }

        if (stats.total > 0) {
            stats.averageDuration = totalDuration / stats.total;
        }

        return stats;
    }

    /**
     * Clear all sessions
     */
    clearAllSessions() {
        const count = this.sessions.size;
        this.sessions.clear();
        logger.info(`Cleared all ${count} sessions`);
    }
}

module.exports = SessionManager;
