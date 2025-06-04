// Error logging and alert system
export class ErrorLogger {
  constructor(env) {
    this.env = env;
  }

  async logError(type, error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: type,
      error: error.message || error,
      stack: error.stack || null,
      context: context
    };

    try {
      // Store in database
      await this.env.MY_COINGECKO_DB.prepare(`
        INSERT INTO error_logs (timestamp, type, error_message, context)
        VALUES (?, ?, ?, ?)
      `).bind(
        errorLog.timestamp,
        errorLog.type,
        errorLog.error,
        JSON.stringify(errorLog.context)
      ).run();

      console.error('🚨 Error logged:', errorLog);

      // Send critical errors to Discord (optional)
      if (this.isCriticalError(type)) {
        await this.sendErrorAlert(errorLog);
      }

      return errorLog;
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
      return errorLog;
    }
  }

  isCriticalError(type) {
    const criticalTypes = [
      'DISCORD_WEBHOOK_FAILED',
      'OPENAI_API_FAILED',
      'DATABASE_CONNECTION_FAILED',
      'CRON_EXECUTION_FAILED'
    ];
    return criticalTypes.includes(type);
  }

  async sendErrorAlert(errorLog) {
    try {
      if (!this.env.DISCORD_WEBHOOK_URL) return;

      const alertMessage = {
        username: '🚨 System Alert',
        avatar_url: 'https://ui-avatars.com/api/?name=Alert&background=f44336&color=fff',
        content: `**시스템 오류 발생**\n\n` +
                `**타입:** ${errorLog.type}\n` +
                `**시간:** ${errorLog.timestamp}\n` +
                `**오류:** ${errorLog.error}\n` +
                `**컨텍스트:** ${JSON.stringify(errorLog.context, null, 2)}`
      };

      await fetch(this.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertMessage)
      });
    } catch (alertError) {
      console.error('Failed to send error alert:', alertError);
    }
  }

  async getRecentErrors(hours = 24) {
    try {
      const errors = await this.env.MY_COINGECKO_DB.prepare(`
        SELECT * FROM error_logs 
        WHERE timestamp > datetime('now', '-${hours} hours')
        ORDER BY timestamp DESC
        LIMIT 50
      `).all();

      return errors.results || [];
    } catch (error) {
      console.error('Failed to fetch recent errors:', error);
      return [];
    }
  }

  async getErrorStats() {
    try {
      const stats = await this.env.MY_COINGECKO_DB.prepare(`
        SELECT 
          type,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM error_logs 
        WHERE timestamp > datetime('now', '-7 days')
        GROUP BY type
        ORDER BY count DESC
      `).all();

      return stats.results || [];
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
      return [];
    }
  }
}
