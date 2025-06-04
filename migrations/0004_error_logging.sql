-- Add error logging table
CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(type);

-- Add persona selection tracking table
CREATE TABLE IF NOT EXISTS persona_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL,
    selected_at TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas (id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_persona_selections_persona_id ON persona_selections(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_selections_selected_at ON persona_selections(selected_at);

-- Add Discord feedback tracking table
CREATE TABLE IF NOT EXISTS discord_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL, -- 'reaction', 'comment', 'click', 'share', 'join'
    user_id TEXT,
    metadata TEXT, -- JSON data for additional context
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES discord_posts (id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_discord_feedback_post_id ON discord_feedback(post_id);
CREATE INDEX IF NOT EXISTS idx_discord_feedback_created_at ON discord_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_discord_feedback_interaction_type ON discord_feedback(interaction_type);
