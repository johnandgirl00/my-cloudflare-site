// Hourly persona poster - main automation scheduler
import { PersonaScheduler } from '../../utils/personaScheduler.js';
import { ErrorLogger } from '../../utils/errorLogger.js';

export async function hourlyPersonaPoster(env) {
  console.log('🤖 Starting hourly persona poster...');
  
  const errorLogger = new ErrorLogger(env);
  const personaScheduler = new PersonaScheduler(env);
  
  try {
    // Use improved persona selection algorithm
    const persona = await personaScheduler.selectOptimalPersona();
    
    if (!persona) {
      const error = new Error('No personas available');
      await errorLogger.logError('PERSONA_SELECTION_FAILED', error);
      return { success: false, error: 'No personas available' };
    }
    
    console.log(`Selected persona: ${persona.name} (${persona.age}, ${persona.gender}, ${persona.country})`);
    
    // Record persona selection
    await personaScheduler.recordPersonaSelection(persona.id, 'optimal_algorithm');
    
    // Get latest crypto data for content generation
    const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
    const cryptoData = await cryptoResponse.json();
    
    // Generate GPT prompt based on persona
    const prompt = buildGPTPrompt(persona, cryptoData);
    
    // Generate content using OpenAI
    const content = await generateContent(prompt, env.OPENAI_API_KEY);
    
    // Post to Discord
    const postResult = await postToDiscord(content, persona, env.DISCORD_WEBHOOK_URL);
    
    // Log to database with engagement tracking
    const logStmt = env.MY_COINGECKO_DB.prepare(`
      INSERT INTO discord_posts (persona_id, content, channel, posted_at, engagement_score) 
      VALUES (?, ?, ?, datetime('now'), 0)
    `);
    const result = await logStmt.bind(persona.id, content, 'crypto-updates').run();
    
    console.log('✅ Persona posting completed successfully');
    
    return {
      success: true,
      persona: persona.name,
      content_length: content.length,
      post_id: result.meta?.last_row_id,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Persona posting error:', error);
    await errorLogger.logError('PERSONA_POSTING_FAILED', error, {
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: error.message,      timestamp: new Date().toISOString()
    };
  }
}

function buildGPTPrompt(persona, cryptoData) {
  const bitcoinData = cryptoData.bitcoin;
  const ethereumData = cryptoData.ethereum;
  
  return `You are ${persona.name}, a ${persona.age}-year-old ${persona.gender} from ${persona.country}.
Your communication style is ${persona.style} and your tone is ${persona.tone}.
Your bias level is ${persona.bias}/10 and you focus on topics: ${persona.topics}.
Language preference: ${persona.language}

Current crypto market data:
- Bitcoin: $${bitcoinData.usd.toLocaleString()} (${bitcoinData.usd_24h_change > 0 ? '+' : ''}${bitcoinData.usd_24h_change.toFixed(2)}%)
- Ethereum: $${ethereumData.usd.toLocaleString()} (${ethereumData.usd_24h_change > 0 ? '+' : ''}${ethereumData.usd_24h_change.toFixed(2)}%)

Write a short Discord message (max 280 characters) about the current crypto market situation. 
Stay in character and include a call-to-action to visit our community site.
Add relevant emojis and make it engaging for Discord users.`;
}

async function generateContent(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a crypto market expert creating engaging Discord content.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function postToDiscord(content, persona, webhookUrl) {
  const message = {
    username: persona.name,
    avatar_url: `https://ui-avatars.com/api/?name=${persona.name}&background=random`,
    content: content + `\n\n🔗 Join our community: https://my-cloudflare-site.johnandgirl.workers.dev`
  };
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  
  if (!response.ok) {
    throw new Error(`Discord posting failed: ${response.status}`);
  }
  
  return { success: true, status: response.status };
} 
