// User feedback collection from Discord interactions
export async function handleDiscordFeedback(request, env) {
  try {
    const { postId, interactionType, userId, metadata } = await request.json();
    
    // Validate input
    if (!postId || !interactionType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: postId, interactionType'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Record feedback in database
    await env.MY_COINGECKO_DB.prepare(`
      INSERT INTO discord_feedback (
        post_id, interaction_type, user_id, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      postId,
      interactionType,
      userId || 'anonymous',
      JSON.stringify(metadata || {}),
      new Date().toISOString()
    ).run();

    // Update engagement score for the post
    await updatePostEngagementScore(env, postId, interactionType);

    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback recorded successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling Discord feedback:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updatePostEngagementScore(env, postId, interactionType) {
  try {
    // Define engagement weights
    const engagementWeights = {
      'reaction': 1,
      'comment': 3,
      'click': 2,
      'share': 5,
      'join': 10
    };

    const weight = engagementWeights[interactionType] || 1;

    // Update the post's engagement score
    await env.MY_COINGECKO_DB.prepare(`
      UPDATE discord_posts 
      SET engagement_score = engagement_score + ?
      WHERE id = ?
    `).bind(weight, postId).run();

  } catch (error) {
    console.error('Error updating engagement score:', error);
  }
}

export async function getFeedbackAnalytics(env, days = 7) {
  try {
    // Get feedback statistics
    const feedbackStats = await env.MY_COINGECKO_DB.prepare(`
      SELECT 
        interaction_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM discord_feedback 
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY interaction_type
      ORDER BY count DESC
    `).all();

    // Get top performing personas by engagement
    const topPersonas = await env.MY_COINGECKO_DB.prepare(`
      SELECT 
        p.name,
        p.gender,
        p.age,
        COUNT(dp.id) as post_count,
        COALESCE(AVG(dp.engagement_score), 0) as avg_engagement,
        SUM(dp.engagement_score) as total_engagement
      FROM personas p
      JOIN discord_posts dp ON p.id = dp.persona_id
      WHERE dp.posted_at > datetime('now', '-${days} days')
      GROUP BY p.id
      ORDER BY avg_engagement DESC
    `).all();

    // Get best performing content topics
    const topTopics = await env.MY_COINGECKO_DB.prepare(`
      SELECT 
        CASE 
          WHEN LOWER(dp.content) LIKE '%bitcoin%' OR LOWER(dp.content) LIKE '%btc%' THEN 'Bitcoin'
          WHEN LOWER(dp.content) LIKE '%ethereum%' OR LOWER(dp.content) LIKE '%eth%' THEN 'Ethereum'
          WHEN LOWER(dp.content) LIKE '%defi%' THEN 'DeFi'
          WHEN LOWER(dp.content) LIKE '%nft%' THEN 'NFT'
          WHEN LOWER(dp.content) LIKE '%analysis%' OR LOWER(dp.content) LIKE '%technical%' THEN 'Technical Analysis'
          ELSE 'General'
        END as topic,
        COUNT(*) as post_count,
        COALESCE(AVG(dp.engagement_score), 0) as avg_engagement
      FROM discord_posts dp
      WHERE dp.posted_at > datetime('now', '-${days} days')
      GROUP BY topic
      ORDER BY avg_engagement DESC
    `).all();

    return {
      period_days: days,
      feedback_stats: feedbackStats.results || [],
      top_personas: topPersonas.results || [],
      top_topics: topTopics.results || [],
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating feedback analytics:', error);
    return {
      error: error.message,
      generated_at: new Date().toISOString()
    };
  }
}
