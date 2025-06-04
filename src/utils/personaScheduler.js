// Improved persona selection algorithm for better content variety
export class PersonaScheduler {
  constructor(env) {
    this.env = env;
  }

  async selectOptimalPersona() {
    try {
      // Get all personas with their recent activity
      const personas = await this.env.MY_COINGECKO_DB.prepare(`
        SELECT 
          p.*,
          COUNT(dp.id) as posts_last_24h,
          MAX(dp.posted_at) as last_post,
          COALESCE(AVG(dp.engagement_score), 0) as avg_engagement
        FROM personas p
        LEFT JOIN discord_posts dp ON p.id = dp.persona_id 
          AND dp.posted_at > datetime('now', '-24 hours')
        GROUP BY p.id
        ORDER BY posts_last_24h ASC, last_post ASC
      `).all();

      if (!personas.results || personas.results.length === 0) {
        throw new Error('No personas found in database');
      }

      // Apply selection strategy
      const selectedPersona = this.applySelectionStrategy(personas.results);
      
      // Log selection decision
      console.log(`🎯 Selected persona: ${selectedPersona.name} (${selectedPersona.gender}, ${selectedPersona.age}) - Posts last 24h: ${selectedPersona.posts_last_24h}`);
      
      return selectedPersona;
    } catch (error) {
      console.error('Error selecting persona:', error);
      throw error;
    }
  }

  applySelectionStrategy(personas) {
    // Strategy 1: Least recently used with engagement weighting
    const now = new Date();
    
    // Calculate scores for each persona
    const scoredPersonas = personas.map(persona => {
      let score = 0;
      
      // Favor personas with fewer recent posts
      score += (10 - persona.posts_last_24h) * 3;
      
      // Favor personas that haven't posted recently
      if (persona.last_post) {
        const hoursSinceLastPost = (now - new Date(persona.last_post)) / (1000 * 60 * 60);
        score += Math.min(hoursSinceLastPost, 24) * 2;
      } else {
        score += 48; // Big bonus for never-posted personas
      }
      
      // Consider engagement (but don't over-optimize for it)
      score += persona.avg_engagement;
      
      // Add some randomness to prevent predictability
      score += Math.random() * 5;
      
      return {
        ...persona,
        selection_score: score
      };
    });
    
    // Sort by score and return top candidate
    scoredPersonas.sort((a, b) => b.selection_score - a.selection_score);
    
    console.log('📊 Persona scores:', scoredPersonas.map(p => ({
      name: p.name,
      score: Math.round(p.selection_score * 100) / 100,
      posts_24h: p.posts_last_24h
    })));
    
    return scoredPersonas[0];
  }

  async getPersonaStats() {
    try {
      const stats = await this.env.MY_COINGECKO_DB.prepare(`
        SELECT 
          p.name,
          p.gender,
          p.age,
          COUNT(dp.id) as total_posts,
          COUNT(CASE WHEN dp.posted_at > datetime('now', '-24 hours') THEN 1 END) as posts_last_24h,
          COUNT(CASE WHEN dp.posted_at > datetime('now', '-7 days') THEN 1 END) as posts_last_week,
          COALESCE(AVG(dp.engagement_score), 0) as avg_engagement,
          MAX(dp.posted_at) as last_post
        FROM personas p
        LEFT JOIN discord_posts dp ON p.id = dp.persona_id
        GROUP BY p.id
        ORDER BY total_posts DESC
      `).all();

      return stats.results || [];
    } catch (error) {
      console.error('Error fetching persona stats:', error);
      return [];
    }
  }

  async recordPersonaSelection(personaId, selectionReason) {
    try {
      await this.env.MY_COINGECKO_DB.prepare(`
        INSERT INTO persona_selections (persona_id, selected_at, reason)
        VALUES (?, ?, ?)
      `).bind(personaId, new Date().toISOString(), selectionReason).run();
    } catch (error) {
      console.error('Error recording persona selection:', error);
    }
  }
}
