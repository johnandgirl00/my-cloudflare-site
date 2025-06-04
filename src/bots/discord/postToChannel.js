// 차트???�이?��? ?�공?�는 ?�들??
export async function handleCoinsChart(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // 쿼리 ?�라미터 처리
    const coinId = url.searchParams.get('coin') || 'bitcoin';
    const period = url.searchParams.get('period') || '24h';
    const format = url.searchParams.get('format') || 'json';
    
    // ?�정 코인 ?�이??조회
    const { results } = await db.prepare(`
      SELECT * FROM coin_market_data 
      WHERE id = ? OR symbol = ?
      LIMIT 1
    `).bind(coinId, coinId.toUpperCase()).all();
    
    if (results.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Coin not found',
        coinId: coinId
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const coin = results[0];
    
    // 차트???�이???�맷??
    const chartData = {
      coin: {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image
      },
      price: {
        current: coin.current_price,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        change_24h: coin.price_change_percentage_24h,
        ath: coin.ath,
        atl: coin.atl
      },
      market: {
        cap: coin.market_cap,
        rank: coin.market_cap_rank,
        volume_24h: coin.total_volume
      },
      supply: {
        circulating: coin.circulating_supply,
        max: coin.max_supply
      },
      timestamp: coin.last_updated
    };
    
    // WebM ?�식?�로 ?�청??경우 (차트 ?�베?�용)
    if (format === 'webm' || url.pathname.includes('chart.webm')) {
      const svgChart = generateSVGChart(chartData);
      return new Response(svgChart, {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300' // 5�?캐시
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: chartData,
      period: period,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error generating chart data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// SVG 차트 ?�성 ?�수
function generateSVGChart(data) {
  const price = data.price.current || 0;
  const change = data.price.change_24h || 0;
  const isPositive = change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="200" fill="url(#gradient)" rx="10"/>
  
  <!-- Title -->
  <text x="20" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
    ${data.coin.symbol} Live Price
  </text>
  
  <!-- Price -->
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">
    $${price.toLocaleString()}
  </text>
  
  <!-- Change -->
  <text x="20" y="85" font-family="Arial, sans-serif" font-size="16" fill="white">
    ${isPositive ? '?? : '??} ${change.toFixed(2)}% (24h)
  </text>
  
  <!-- Market Cap -->
  <text x="20" y="110" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.9">
    Market Cap: $${(data.market.cap / 1e9).toFixed(2)}B
  </text>
  
  <!-- Rank -->
  <text x="20" y="130" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.9">
    Rank: #${data.market.rank}
  </text>
  
  <!-- Simple chart line (mock) -->
  <polyline points="20,160 80,150 140,170 200,140 260,155 320,145 380,${isPositive ? '135' : '165'}" 
            stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
  
  <!-- Time -->
  <text x="320" y="190" font-family="Arial, sans-serif" font-size="10" fill="white" opacity="0.7">
    ${new Date().toLocaleTimeString()}
  </text>
</svg>`;
}

// CoinGecko API?�서 ?�이?��? 가?�오???�들??
export async function handleCoinsFetch(request, env, ctx) {
  try {
    console.log('Starting CoinGecko API fetch...');
    
    // CoinGecko API?�서 ?�위 100�?코인 ?�이??가?�오�?
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoGram/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const coins = await response.json();
    console.log(`Fetched ${coins.length} coins from CoinGecko`);

    return new Response(JSON.stringify({
      success: true,
      data: coins,
      count: coins.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ?�이?�베?�스?�서 코인 목록??조회?�는 ?�들??
export async function handleCoinsList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // 쿼리 ?�라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const type = url.searchParams.get('type') || 'all';
    const direction = url.searchParams.get('direction') || 'gainers';
    
    let query;
    let queryParams = [];
    
    switch (type) {
      case 'market':
        // ?��?총액 ?�위�??�렬
        query = `
          SELECT * FROM coin_market_data 
          ORDER BY market_cap_rank ASC 
          LIMIT ?
        `;
        queryParams = [limit];
        break;
        
      case 'movers':
        // 가�?변?�률 기�? ?�렬
        const order = direction === 'gainers' ? 'DESC' : 'ASC';
        query = `
          SELECT * FROM coin_market_data 
          WHERE price_change_percentage_24h IS NOT NULL 
          ORDER BY price_change_percentage_24h ${order} 
          LIMIT ?
        `;
        queryParams = [limit];
        break;
        
      case 'volume':
        // 거래??기�? ?�렬
        query = `
          SELECT * FROM coin_market_data 
          WHERE total_volume IS NOT NULL 
          ORDER BY total_volume DESC 
          LIMIT ?
        `;
        queryParams = [limit];
        break;
        
      default:
        // 기본: ?��?총액 ?�위�?
        query = `
          SELECT * FROM coin_market_data 
          ORDER BY market_cap_rank ASC 
          LIMIT ?
        `;
        queryParams = [limit];
    }
    
    const { results } = await db.prepare(query).bind(...queryParams).all();
    
    console.log(`Retrieved ${results.length} coins from database (type: ${type})`);
    
    return new Response(JSON.stringify({
      success: true,
      data: results,
      count: results.length,
      type: type,
      limit: limit,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching coins list:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// CoinGecko ?�이?��? D1 ?�이?�베?�스???�?�하???�들??
export async function handleCoinsSave(request, env, ctx) {
  try {
    console.log('Starting coins save to D1...');
    
    const db = env.MY_COINGECKO_DB;
    
    // coin_market_data ?�이블이 존재?�는지 ?�인?�고 ?�성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS coin_market_data (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        current_price REAL,
        market_cap REAL,
        market_cap_rank INTEGER,
        total_volume REAL,
        high_24h REAL,
        low_24h REAL,
        price_change_percentage_24h REAL,
        circulating_supply REAL,
        max_supply REAL,
        ath REAL,
        atl REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // CoinGecko API?�서 ?�이??가?�오�?
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoGram/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const coins = await response.json();
    console.log(`Fetched ${coins.length} coins from CoinGecko`);

    // ?�이?�베?�스???�??
    let savedCount = 0;
    const errors = [];

    for (const coin of coins) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO coin_market_data (
            id, symbol, name, image, current_price, market_cap, market_cap_rank,
            total_volume, high_24h, low_24h, price_change_percentage_24h,
            circulating_supply, max_supply, ath, atl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          coin.id,
          coin.symbol?.toUpperCase(),
          coin.name,
          coin.image,
          coin.current_price,
          coin.market_cap,
          coin.market_cap_rank,
          coin.total_volume,
          coin.high_24h,
          coin.low_24h,
          coin.price_change_percentage_24h,
          coin.circulating_supply,
          coin.max_supply,
          coin.ath,
          coin.atl
        ).run();
        
        savedCount++;
      } catch (saveError) {
        console.error(`Error saving coin ${coin.id}:`, saveError);
        errors.push({ coin: coin.id, error: saveError.message });
      }
    }

    console.log(`Successfully saved ${savedCount}/${coins.length} coins to database`);

    return new Response(JSON.stringify({
      success: true,
      saved: savedCount,
      total: coins.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in coins save:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ?��? ?�성 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handleCommentsCreate(request, env, ctx) {
  try {
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    const { post_id, content, user } = await request.json();
    
    if (!post_id || !content || content.trim() === '') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Post ID and content are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 게시글 존재 ?�인
    const { results: [post] } = await db.prepare(`
      SELECT post_id FROM posts WHERE post_id = ?
    `).bind(post_id).all();

    if (!post) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Post not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ?�용??ID 결정
    let authorId = 2; // 기본�? Anonymous ?�용??
    let isAi = false;
    
    if (user) {
      if (user.id) {
        authorId = user.id;
      } else if (user.google_id) {
        // Google ID�??�용??찾기
        const { results: existingUsers } = await db.prepare(`
          SELECT user_id FROM users WHERE google_id = ?
        `).bind(user.google_id).all();
        
        if (existingUsers.length > 0) {
          authorId = existingUsers[0].user_id;
        }
      }
      
      if (user.is_ai) {
        isAi = true;
        authorId = 1; // AI ?�용??
      }
    }

    // ?��? ?�성
    const result = await db.prepare(`
      INSERT INTO comments (post_id, author_id, is_ai, content)
      VALUES (?, ?, ?, ?)
    `).bind(post_id, authorId, isAi, content.trim()).run();

    if (!result.success) {
      throw new Error('Failed to create comment');
    }

    // ?�성???��? 조회 (?�성???�보 ?�함)
    const { results: [newComment] } = await db.prepare(`
      SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
      WHERE c.comment_id = ?
    `).bind(result.meta.last_row_id).all();

    console.log(`??Comment created with ID: ${result.meta.last_row_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: newComment,
      message: 'Comment created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('??Comments create error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ?��? 목록 조회 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handleCommentsList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    // 쿼리 ?�라미터 처리
    const post_id = url.searchParams.get('post_id');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let query = `
      SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
    `;
    let bindings = [];

    if (post_id) {
      query += ` WHERE c.post_id = ?`;
      bindings.push(post_id);
    }

    query += ` ORDER BY c.created_at ASC LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const { results: comments } = await db.prepare(query).bind(...bindings).all();

    console.log(`Retrieved ${comments.length} comments from database`);

    return new Response(JSON.stringify({
      success: true,
      data: comments,
      count: comments.length,
      limit: limit,
      offset: offset,
      post_id: post_id || null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('??Comments list error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * ?�� ?�스코드 ?�입 추적 API
 */

/**
 * ?�스코드?�서 ?�입???�용??추적 �?리다?�렉??
 * @param {Request} request - HTTP ?�청 객체
 * @param {Object} env - Cloudflare environment variables
 * @returns {Response} HTTP ?�답
 */
export async function handleDiscordJoin(request, env) {
  try {
    const url = new URL(request.url);
    const personaId = url.searchParams.get('persona');
    const postId = url.searchParams.get('post');
    
    // ?�수 ?�라미터 검�?
    if (!personaId || !postId) {
      return new Response('Missing required parameters', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // ?�입 기록 ?�??
    try {
      await env.MY_COINGECKO_DB.prepare(`
        INSERT INTO discord_joins (persona_id, post_id, joined_at)
        VALUES (?, ?, datetime('now'))
      `).bind(personaId, postId).run();
      
      console.log(`Discord join tracked: persona=${personaId}, post=${postId}`);
    } catch (dbError) {
      console.error('Failed to log discord join:', dbError);
      // DB ?�러가 ?�어??리다?�렉?��? 계속 진행
    }
    
    // 메인 ?�이?�로 리다?�렉??(?�입 ?�공 ?�이지)
    const redirectUrl = `https://${env.WORKER_DOMAIN || 'my-cloudflare-site.johnandgirl.workers.dev'}?utm_source=discord&utm_persona=${personaId}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error in discord join handler:', error);
    
    // ?�러가 ?�어??메인 ?�이?�로 리다?�렉??
    const fallbackUrl = `https://${env.WORKER_DOMAIN || 'my-cloudflare-site.johnandgirl.workers.dev'}`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': fallbackUrl
      }
    });
  }
}

/**
 * ?�입 ?�계 조회 API
 * @param {Object} env - Cloudflare environment variables
 * @returns {Response} JSON ?�답
 */
export async function getDiscordJoinStats(env) {
  try {
    // ?�체 ?�입 ??
    const totalJoins = await env.MY_COINGECKO_DB.prepare(`
      SELECT COUNT(*) as total FROM discord_joins
    `).first();
    
    // ?�르?�나�??�입 ??
    const personaStats = await env.MY_COINGECKO_DB.prepare(`
      SELECT 
        dj.persona_id,
        p.name as persona_name,
        COUNT(*) as join_count
      FROM discord_joins dj
      LEFT JOIN personas p ON dj.persona_id = p.id
      GROUP BY dj.persona_id, p.name
      ORDER BY join_count DESC
    `).all();
    
    // 최근 24?�간 ?�입
    const recentJoins = await env.MY_COINGECKO_DB.prepare(`
      SELECT COUNT(*) as recent_total 
      FROM discord_joins 
      WHERE joined_at > datetime('now', '-24 hours')
    `).first();
    
    return new Response(JSON.stringify({
      total_joins: totalJoins.total,
      recent_24h: recentJoins.recent_total,
      by_persona: personaStats.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching discord join stats:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch stats' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 미디???�일 목록 조회 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handleMediaList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    // 쿼리 ?�라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const mediaType = url.searchParams.get('media_type'); // 'image', 'video', 'audio', 'document'
    const postId = url.searchParams.get('post_id');
    const commentId = url.searchParams.get('comment_id');
    
    let query = `
      SELECT m.*, u.name as uploader_name, u.profile_picture as uploader_avatar
      FROM media_files m
      LEFT JOIN users u ON m.uploaded_by = u.user_id
    `;
    let queryParams = [];
    let conditions = [];
    
    // 조건 추�?
    if (mediaType) {
      conditions.push('m.media_type = ?');
      queryParams.push(mediaType);
    }
    
    if (postId) {
      conditions.push('m.linked_post_id = ?');
      queryParams.push(parseInt(postId));
    }
    
    if (commentId) {
      conditions.push('m.linked_comment_id = ?');
      queryParams.push(parseInt(commentId));
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY m.uploaded_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    const { results: mediaFiles } = await db.prepare(query).bind(...queryParams).all();
    
    console.log(`Retrieved ${mediaFiles.length} media files from database`);
    
    return new Response(JSON.stringify({
      success: true,
      data: mediaFiles,
      count: mediaFiles.length,
      limit: limit,
      offset: offset,
      filters: {
        media_type: mediaType,
        post_id: postId,
        comment_id: commentId
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get media files error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Media ?�이�?초기???�수
async function initializeMediaTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        name TEXT,
        given_name TEXT,
        family_name TEXT,
        profile_picture TEXT,
        locale TEXT DEFAULT 'en',
        is_ai BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS media_files (
        media_id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size_kb INTEGER,
        media_type TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        uploaded_by INTEGER,
        is_ai BOOLEAN DEFAULT FALSE,
        linked_post_id INTEGER,
        linked_comment_id INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 기본 ?�용?�들 ?�성
    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
    `).run();

    console.log('??Media tables initialized');
  } catch (err) {
    console.error('??Media table initialization error:', err);
  }
}

// 미디???�일 ?�로???�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handleMediaUpload(request, env, ctx) {
  try {
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    const { file_name, file_type, file_size_kb, media_type, url, thumbnail_url, uploaded_by, is_ai, linked_post_id, linked_comment_id } = await request.json();
    
    if (!file_name || !file_type || !media_type || !url) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields (file_name, file_type, media_type, url)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 미디???�일 ?�보 ?�??
    const result = await db.prepare(`
      INSERT INTO media_files (file_name, file_type, file_size_kb, media_type, url, thumbnail_url, uploaded_by, is_ai, linked_post_id, linked_comment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      file_name, 
      file_type, 
      file_size_kb || null, 
      media_type, 
      url, 
      thumbnail_url || null, 
      uploaded_by || 2, // 기본?�으�?anonymous ?�용??
      is_ai || false, 
      linked_post_id || null, 
      linked_comment_id || null
    ).run();

    console.log('Media file created:', result.meta.last_row_id);

    // ?�성??미디???�일 ?�보 조회
    const { results: mediaFile } = await db.prepare(`
      SELECT * FROM media_files WHERE media_id = ?
    `).bind(result.meta.last_row_id).all();

    return new Response(JSON.stringify({ 
      success: true,
      media: mediaFile[0],
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Upload media error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Media ?�이�?초기???�수
async function initializeMediaTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        name TEXT,
        given_name TEXT,
        family_name TEXT,
        profile_picture TEXT,
        locale TEXT DEFAULT 'en',
        is_ai BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS media_files (
        media_id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size_kb INTEGER,
        media_type TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        uploaded_by INTEGER,
        is_ai BOOLEAN DEFAULT FALSE,
        linked_post_id INTEGER,
        linked_comment_id INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        media_id INTEGER
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 기본 ?�용?�들 ?�성
    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
    `).run();

    console.log('??Media tables initialized');
  } catch (err) {
    console.error('??Media table initialization error:', err);
  }
}

// 게시글 ?�성 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handlePostsCreate(request, env, ctx) {
  try {
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    const { content, user, media_id } = await request.json();
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Content is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ?�용??ID 결정
    let authorId = 2; // 기본�? Anonymous ?�용??
    let isAi = false;
    
    if (user) {
      if (user.id) {
        authorId = user.id;
      } else if (user.google_id) {
        // Google ID�??�용??찾기
        const { results: existingUsers } = await db.prepare(`
          SELECT user_id FROM users WHERE google_id = ?
        `).bind(user.google_id).all();
        
        if (existingUsers.length > 0) {
          authorId = existingUsers[0].user_id;
        }
      }
      
      if (user.is_ai) {
        isAi = true;
        authorId = 1; // AI ?�용??
      }
    }

    // 게시글 ?�성
    const result = await db.prepare(`
      INSERT INTO posts (author_id, is_ai, content, media_id)
      VALUES (?, ?, ?, ?)
    `).bind(authorId, isAi, content.trim(), media_id || null).run();

    if (!result.success) {
      throw new Error('Failed to create post');
    }

    // ?�성??게시글 조회 (?�성???�보 ?�함)
    const { results: [newPost] } = await db.prepare(`
      SELECT p.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai,
             m.url as media_url, m.media_type, m.thumbnail_url
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN media_files m ON p.media_id = m.media_id
      WHERE p.post_id = ?
    `).bind(result.meta.last_row_id).all();

    console.log(`??Post created with ID: ${result.meta.last_row_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: newPost,
      message: 'Post created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('??Posts create error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 게시글 ?�세 조회 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handlePostsDetail(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // URL?�서 post ID 추출
    const postId = url.pathname.split('/')[4]; // /api/v2/posts/:id ?�태
    
    if (!postId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Post ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    // ?�정 ?�스??조회 - ?�용???�보?� 미디???�보?� ?�께
    const { results: posts } = await db.prepare(`
      SELECT p.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai,
             m.url as media_url, m.media_type, m.thumbnail_url, m.file_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN media_files m ON p.media_id = m.media_id
      WHERE p.post_id = ?
    `).bind(parseInt(postId)).all();
    
    if (posts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Post not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const post = posts[0];
    
    // ?�당 ?�스?�의 ?��? 조회 - ?�용???�보?� ?�께
    const { results: comments } = await db.prepare(`
      SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC
    `).bind(parseInt(postId)).all();
    
    const postWithComments = {
      ...post,
      comments: comments || []
    };
    
    console.log(`Retrieved post ${postId} with ${comments.length} comments`);
    
    return new Response(JSON.stringify({
      success: true,
      data: postWithComments,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get post detail error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Posts ?�이�?초기???�수
async function initializePostsTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        name TEXT,
        given_name TEXT,
        family_name TEXT,
        profile_picture TEXT,
        locale TEXT DEFAULT 'en',
        is_ai BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        media_id INTEGER
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 기본 ?�용?�들 ?�성
    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
    `).run();

    console.log('??Posts tables initialized');
  } catch (err) {
    console.error('??Posts table initialization error:', err);
  }
}

// 게시글 목록 조회 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handlePostsList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    // 쿼리 ?�라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const withComments = url.searchParams.get('comments') !== 'false';
    
    // ?�스??조회 - ?�용???�보?� 미디???�보?� ?�께
    const { results: posts } = await db.prepare(`
      SELECT p.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai,
             m.url as media_url, m.media_type, m.thumbnail_url, m.file_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN media_files m ON p.media_id = m.media_id
      ORDER BY p.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    let postsWithComments = posts;
    
    // ?��? ?�함 ?��? ?�인
    if (withComments) {
      postsWithComments = await Promise.all(posts.map(async (post) => {
        const { results: comments } = await db.prepare(`
          SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
          FROM comments c
          LEFT JOIN users u ON c.author_id = u.user_id
          WHERE c.post_id = ? 
          ORDER BY c.created_at ASC
        `).bind(post.post_id).all();
        
        return {
          ...post,
          comments: comments || []
        };
      }));
    }

    console.log(`Retrieved ${postsWithComments.length} posts from database`);

    return new Response(JSON.stringify({
      success: true,
      data: postsWithComments,
      count: postsWithComments.length,
      limit: limit,
      offset: offset,
      hasMore: postsWithComments.length === limit
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('??Posts list error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ?�용???�성/로그???�들??(Google OAuth)
import { initializeDatabase } from '../../utils/database.js';

export async function handleUsersCreate(request, env, ctx) {
  try {
    const db = env.MY_COINGECKO_DB;
    await initializeDatabase(db);
    
    const { google_id, email, email_verified, name, given_name, family_name, profile_picture, locale } = await request.json();
    
    if (!email || !google_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields (email, google_id)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 기존 ?�용???�인
    const { results: existingUsers } = await db.prepare(`
      SELECT * FROM users WHERE google_id = ? OR email = ?
    `).bind(google_id, email).all();

    if (existingUsers.length > 0) {
      // 기존 ?�용?��? ?�으�?로그???�간 ?�데?�트
      await db.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?
      `).bind(existingUsers[0].user_id).run();

      return new Response(JSON.stringify({ 
        success: true,
        data: existingUsers[0],
        message: 'User logged in successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ???�용???�성
    const result = await db.prepare(`
      INSERT INTO users (google_id, email, email_verified, name, given_name, family_name, profile_picture, locale, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(google_id, email, email_verified || false, name, given_name, family_name, profile_picture, locale || 'en').run();

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    // ?�성???�용??조회
    const { results: [newUser] } = await db.prepare(`
      SELECT * FROM users WHERE user_id = ?
    `).bind(result.meta.last_row_id).all();

    return new Response(JSON.stringify({ 
      success: true,
      data: newUser,
      message: 'User created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('??Users create error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ?�용???�세 ?�보 조회 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handleUsersDetail(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // URL?�서 user ID 추출
    const userId = url.pathname.split('/')[3]; // /api/users/:id ?�태
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    // ?�정 ?�용??조회
    const { results: users } = await db.prepare(`
      SELECT user_id, google_id, email, name, given_name, family_name, profile_picture, is_ai, created_at, last_login
      FROM users WHERE user_id = ?
    `).bind(parseInt(userId)).all();
    
    if (users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = users[0];
    
    // ?�용?�의 게시글 ??조회
    const { results: postCount } = await db.prepare(`
      SELECT COUNT(*) as count FROM posts WHERE author_id = ?
    `).bind(parseInt(userId)).all();
    
    // ?�용?�의 ?��? ??조회
    const { results: commentCount } = await db.prepare(`
      SELECT COUNT(*) as count FROM comments WHERE author_id = ?
    `).bind(parseInt(userId)).all();
    
    const userWithStats = {
      ...user,
      posts_count: postCount[0]?.count || 0,
      comments_count: commentCount[0]?.count || 0
    };
    
    console.log(`Retrieved user ${userId} details`);
    
    return new Response(JSON.stringify({
      success: true,
      data: userWithStats,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user detail error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Users ?�이�?초기???�수
async function initializeUsersTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        name TEXT,
        given_name TEXT,
        family_name TEXT,
        profile_picture TEXT,
        locale TEXT DEFAULT 'en',
        is_ai BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        media_id INTEGER
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 기본 ?�용?�들 ?�성
    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
    `).run();

    console.log('??Users tables initialized');
  } catch (err) {
    console.error('??Users table initialization error:', err);
  }
}

// ?�용??목록 조회 ?�들??
import { initializeDatabase } from '../../utils/database.js';

export async function handleUsersList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.MY_COINGECKO_DB;
    
    // ?�이?�베?�스 초기??
    await initializeDatabase(db);
    
    // 쿼리 ?�라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const includeAI = url.searchParams.get('include_ai') === 'true';
    
    let query;
    let queryParams;
    
    if (includeAI) {
      // AI ?�용???�함
      query = `
        SELECT user_id, google_id, email, name, given_name, family_name, profile_picture, is_ai, created_at, last_login
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];
    } else {
      // ?�제 ?�용?�만
      query = `
        SELECT user_id, google_id, email, name, given_name, family_name, profile_picture, is_ai, created_at, last_login
        FROM users 
        WHERE is_ai = FALSE
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];
    }
    
    const { results: users } = await db.prepare(query).bind(...queryParams).all();
    
    console.log(`Retrieved ${users.length} users from database`);
    
    return new Response(JSON.stringify({
      success: true,
      data: users,
      count: users.length,
      limit: limit,
      offset: offset,
      includeAI: includeAI,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Users ?�이�?초기???�수
async function initializeUsersTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        name TEXT,
        given_name TEXT,
        family_name TEXT,
        profile_picture TEXT,
        locale TEXT DEFAULT 'en',
        is_ai BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `).run();

    // 기본 ?�용?�들 ?�성
    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
    `).run();

    console.log('??Users tables initialized');
  } catch (err) {
    console.error('??Users table initialization error:', err);
  }
}

/**
 * ?�� ?�스코드 채널 ?�스???�들??
 */

/**
 * ?�스코드 ?�훅???�해 채널??메시지 ?�송
 * @param {string} webhookUrl - ?�스코드 ?�훅 URL
 * @param {Object} persona - ?�르?�나 ?�보
 * @param {string} content - ?�스???�용
 * @param {string} trackingLink - ?�입 추적 링크
 * @returns {Object} ?�송 결과 {success: boolean, messageId?: string, error?: string}
 */
export async function postToChannel(webhookUrl, persona, content, trackingLink) {
  try {
    // ?�입 링크가 ?�함??최종 컨텐�??�성
    const finalContent = `${content}\n\n?�� ${trackingLink}`;
    
    const payload = {
      username: persona.name,
      avatar_url: persona.avatar_url || null,
      content: finalContent,
      embeds: []
    };
    
    console.log(`Posting to Discord as ${persona.name}:`, finalContent.substring(0, 100) + '...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log('Discord post successful');
      return {
        success: true,
        messageId: response.headers.get('X-RateLimit-Reset-After') || 'unknown'
      };
    } else {
      const errorText = await response.text();
      console.error('Discord post failed:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }
    
  } catch (error) {
    console.error('Error posting to Discord:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ?�입 추적 링크 ?�성
 * @param {string} baseUrl - 기본 ?�이??URL  
 * @param {string} personaId - ?�르?�나 ID
 * @param {string} postId - ?�스??ID
 * @returns {string} 추적 링크
 */
export function generateTrackingLink(baseUrl, personaId, postId) {
  return `${baseUrl}/discord/join?persona=${personaId}&post=${postId}`;
}

/**
 * ?�스코드 ?�스??결과�??�이?�베?�스??기록
 * @param {Object} env - Cloudflare environment variables
 * @param {string} postId - ?�스??ID (UUID)
 * @param {string} personaId - ?�르?�나 ID
 * @param {string} content - ?�스???�용
 * @param {string} link - 추적 링크
 * @param {boolean} success - ?�스???�공 ?��?
 * @returns {boolean} ?�???�공 ?��?
 */
export async function logDiscordPost(env, postId, personaId, content, link, success) {
  try {
    await env.MY_COINGECKO_DB.prepare(`
      INSERT INTO discord_posts (id, persona_id, content, link, status, posted_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      postId,
      personaId,
      content,
      link,
      success ? 'success' : 'failed'
    ).run();
    
    console.log(`Discord post logged: ${postId} (${success ? 'success' : 'failed'})`);
    return true;
    
  } catch (error) {
    console.error('Error logging discord post:', error);
    return false;
  }
}

/**
 * ??매시�??�르?�나 기반 ?�동 ?�스???��?줄러
 */

import { getRandomPersona } from '../../utils/personaQuery.js';
import { buildPersonaPrompt } from '../../utils/gptPromptBuilder.js';
import { postToChannel, generateTrackingLink, logDiscordPost } from '../discord/postToChannel.js';

/**
 * GPT API ?�출?�여 컨텐�??�성
 * @param {string} prompt - GPT ?�롬?�트
 * @param {string} apiKey - OpenAI API ??
 * @returns {string|null} ?�성??컨텐�?
 */
async function generateContent(prompt, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GPT API error:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Error calling GPT API:', error);
    return null;
  }
}

/**
 * UUID v4 ?�성
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 매시�??�르?�나 ?�스???�행
 * @param {Object} env - Cloudflare environment variables
 * @returns {Object} ?�행 결과
 */
export async function hourlyPersonaPoster(env) {
  console.log('?? Starting hourly persona posting...');
  
  try {
    // 1. ?�덤 ?�르?�나 ?�택
    const persona = await getRandomPersona(env, 'hourly');
    if (!persona) {
      return { 
        success: false, 
        error: 'No hourly persona found' 
      };
    }

    // 2. GPT ?�롬?�트 ?�성
    const prompt = buildPersonaPrompt(persona);
    
    // 3. GPT API ?�출
    const content = await generateContent(prompt, env.OPENAI_API_KEY);
    if (!content) {
      return { 
        success: false, 
        error: 'Failed to generate content' 
      };
    }

    // 4. ?�스??ID ?�성 �?추적 링크 ?�성
    const postId = generateUUID();
    const baseUrl = `https://${env.WORKER_DOMAIN || 'my-cloudflare-site.johnandgirl.workers.dev'}`;
    const trackingLink = generateTrackingLink(baseUrl, persona.id, postId);

    // 5. ?�스코드???�스??
    const discordResult = await postToChannel(
      env.DISCORD_WEBHOOK_URL,
      persona,
      content,
      trackingLink
    );

    // 6. 결과�?DB??기록
    await logDiscordPost(
      env,
      postId,
      persona.id,
      content,
      trackingLink,
      discordResult.success
    );

    console.log(`??Hourly posting completed: ${persona.name} - ${discordResult.success ? 'SUCCESS' : 'FAILED'}`);

    return {
      success: discordResult.success,
      persona: persona.name,
      postId: postId,
      content: content.substring(0, 100) + '...',
      error: discordResult.error || null
    };

  } catch (error) {
    console.error('??Error in hourly persona posting:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// src/embedChart.js - 커�??�티 ?�베?�용 고정 URL 처리
import { errorResponse } from './utils.js';

export async function handleEmbedChart(request, env, ctx) {
  try {
    // 최신 차트 ?�일??가?�옴
    let object = await env.CHARTS.get('latest-chart.svg');
    
    // 만약 최신 ?�일???�다�??�로 ?�성
    if (!object) {
      // generateWebM ?�수�?직접 ?�출?�여 ??차트 ?�성
      const { handleGenerateWebM } = await import('./generateWebM.js');
      await handleGenerateWebM(null, env, ctx);
      
      // ?�시 ?�도
      object = await env.CHARTS.get('latest-chart.svg');
      
      if (!object) {
        return errorResponse('차트�??�성?????�습?�다', 500);
      }
    }
    
    const headers = new Headers();
    
    // 커�??�티 ?�베?��? ?�한 최적?�된 ?�더
    headers.set('Content-Type', 'image/svg+xml');
    headers.set('Cache-Control', 'public, max-age=60'); // 1�?캐시 (?�주 ?�데?�트)
    headers.set('Access-Control-Allow-Origin', '*'); // 모든 ?�메?�에???�베???�용
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // WebM ?�청?��?�?SVG�?반환 (?�환??
    // ?�제 WebM???�요?�다�??�기??변??로직 추�?
    
    return new Response(object.body, { headers });
    
  } catch (err) {
    console.error('?�베??차트 ?�류:', err);
    return errorResponse(`?�베??차트 처리 ?�패: ${err.message}`, 500);
  }
}

// src/generateWebM.js - ?�호?�폐 차트 WebM ?�성
import { jsonResponse, errorResponse } from './utils.js';

export async function handleGenerateWebM(request, env, ctx) {
  try {
    // 1) ?�이??가?�오�?(최근 24?�간)
    const { results } = await env.MY_COINGECKO_DB.prepare(`
      SELECT fetched_at as timestamp, price_usd as price, symbol
      FROM coin_prices 
      WHERE coin_id = 'bitcoin'
      ORDER BY fetched_at DESC 
      LIMIT 48
    `).all();

    if (!results || results.length < 5) {
      return errorResponse('충분???�이?��? ?�습?�다. 최소 5�??�상 ?�요?�니??', 400);
    }

    // 2) ?�이???�규??
    const prices = results.reverse().map(r => parseFloat(r.price)); // ?�간???�렬
    const timestamps = results.map(r => new Date(r.timestamp));
    const symbol = results[0]?.symbol || 'BTC';
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // 3) WebM??SVG ?�니메이???�성 (커�??�티 최적??
    const width = 400;
    const height = 200;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    // ?�재 가격과 24?�간 변?�율 계산
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[0];
    const changePercent = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);
    const isPositive = changePercent >= 0;
    
    // 가�??�인?�들??좌표�?변??
    let pathData = '';
    const points = [];
    
    for (let i = 0; i < prices.length; i++) {
      const x = padding + (i / (prices.length - 1)) * chartWidth;
      const y = padding + (1 - (prices[i] - minPrice) / priceRange) * chartHeight;
      points.push({ x, y, price: prices[i] });
      pathData += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }
    
    // 그라?�이???�역???�한 ?�스
    const areaPath = pathData + ` L ${padding + chartWidth} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;
    
    // ?�니메이??SVG ?�성
    const animatedSVG = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 그라?�이???�의 -->
    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${isPositive ? '#10b981' : '#ef4444'};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${isPositive ? '#10b981' : '#ef4444'};stop-opacity:0.05" />
    </linearGradient>
    
    <!-- ?�니메이?�용 마스??-->
    <mask id="revealMask">
      <rect width="0" height="${height}" fill="white">
        <animate attributeName="width" values="0;${width}" dur="3s" repeatCount="indefinite" />
      </rect>
    </mask>
  </defs>
  
  <!-- 배경 -->
  <rect width="100%" height="100%" fill="#0f172a" />
  
  <!-- 그리???�인 -->
  <g stroke="#334155" stroke-width="0.5" opacity="0.3">
    ${Array.from({length: 5}, (_, i) => {
      const y = padding + (i / 4) * chartHeight;
      return `<line x1="${padding}" y1="${y}" x2="${padding + chartWidth}" y2="${y}" />`;
    }).join('')}
  </g>
  
  <!-- 차트 ?�역 -->
  <path d="${areaPath}" fill="url(#chartGradient)" mask="url(#revealMask)" />
  
  <!-- 차트 ?�인 -->
  <path d="${pathData}" 
        stroke="${isPositive ? '#10b981' : '#ef4444'}" 
        stroke-width="2" 
        fill="none" 
        mask="url(#revealMask)" />
  
  <!-- ?�재 가�??�인??-->
  <circle cx="${points[points.length-1].x}" cy="${points[points.length-1].y}" r="4" 
          fill="${isPositive ? '#10b981' : '#ef4444'}" 
          mask="url(#revealMask)">
    <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
  </circle>
  
  <!-- ?�스???�보 -->
  <g font-family="Arial, sans-serif" fill="white">
    <!-- ?�볼 -->
    <text x="20" y="30" font-size="18" font-weight="bold">${symbol}/USD</text>
    
    <!-- ?�재 가�?-->
    <text x="20" y="50" font-size="16" fill="${isPositive ? '#10b981' : '#ef4444'}">
      $${currentPrice.toLocaleString()}
    </text>
    
    <!-- 변?�율 -->
    <text x="20" y="70" font-size="14" fill="${isPositive ? '#10b981' : '#ef4444'}">
      ${isPositive ? '+' : ''}${changePercent}% (24h)
    </text>
    
    <!-- ?�간 ?�탬??-->
    <text x="20" y="${height - 10}" font-size="10" fill="#64748b">
      Last update: ${new Date().toLocaleTimeString()}
    </text>
  </g>
  
  <!-- 깜박?�는 ?�이�??�디케?�터 -->
  <circle cx="${width - 30}" cy="25" r="3" fill="#10b981">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
  </circle>
  <text x="${width - 50}" y="30" font-size="10" fill="#10b981" font-family="Arial">LIVE</text>
</svg>`;

    // 4) SVG�?R2???�??(WebM ?�??먼�? ?�니메이??SVG�??�스??
    const timestamp = Date.now();
    const key = `chart-${timestamp}.svg`;
    
    console.log(`?�� Saving chart to R2 with key: ${key}`);
    
    try {
      await env.CHARTS.put(key, animatedSVG, {
        httpMetadata: { 
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=300' // 5�?캐시
        }
      });
      console.log(`??Chart saved to R2: ${key}`);
    } catch (putError) {
      console.error(`??Failed to save to R2: ${putError.message}`);
      throw putError;
    }
    
    // 5) 고정 URL?�으로도 ?�??
    console.log('?�� Saving latest chart...');
    try {
      await env.CHARTS.put('latest-chart.svg', animatedSVG, {
        httpMetadata: { 
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=60' // 1�?캐시
        }
      });
      console.log('??Latest chart saved to R2');
    } catch (latestError) {
      console.error(`??Failed to save latest chart: ${latestError.message}`);
    }
    
    return jsonResponse({
      success: true,
      url: `/media/${key}`,
      embedUrl: '/embed/chart.webm', // ?�제로는 SVG?��?�??�환?�을 ?�해
      dataPoints: prices.length,
      currentPrice,
      changePercent: parseFloat(changePercent),
      timestamp
    });
    
  } catch (err) {
    console.error('WebM ?�성 ?�류:', err);
    return errorResponse(`WebM ?�성 ?�패: ${err.message}`, 500);
  }
}

export async function handleDataApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log('DataAPI called with path:', path); // ?�버�?로그 추�?
  
  try {
    const db = env.MY_COINGECKO_DB;
    
    // 기존 ?�드?�인??(?�환???��?) - 쿼리 ?�라미터�??�장
    if (path === '/api/data') {
      const type = url.searchParams.get('type'); // ?�로??쿼리 ?�라미터
      const limit = url.searchParams.get('limit') || 100;
      
      // 마켓 ?�이???�청
      if (type === 'market') {
        console.log('Market data requested via /api/data?type=market');
        const { results } = await db.prepare(`
          SELECT * FROM coin_market_data 
          ORDER BY market_cap_rank ASC 
          LIMIT ?
        `).bind(limit).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // ?�위/?�위 변?�률 ?�청
      if (type === 'movers') {
        const direction = url.searchParams.get('direction') || 'gainers';
        const order = direction === 'gainers' ? 'DESC' : 'ASC';
        
        const { results } = await db.prepare(`
          SELECT id, symbol, name, current_price, price_change_percentage_24h, image
          FROM coin_market_data 
          WHERE price_change_percentage_24h IS NOT NULL
          ORDER BY price_change_percentage_24h ${order}
          LIMIT ?
        `).bind(limit).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // ?�장 ?�계 ?�청
      if (type === 'stats') {
        const { results } = await db.prepare(`
          SELECT 
            COUNT(*) as total_coins,
            SUM(market_cap) as total_market_cap,
            SUM(total_volume) as total_volume_24h,
            AVG(price_change_percentage_24h) as avg_price_change_24h
          FROM coin_market_data
        `).all();
        
        return new Response(JSON.stringify(results[0]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // ?�정 코인 ?�보 ?�청
      const coinId = url.searchParams.get('coin');
      if (coinId) {
        const { results } = await db.prepare(`
          SELECT * FROM coin_market_data 
          WHERE id = ? OR symbol = ?
        `).bind(coinId, coinId).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: 'Coin not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(results[0]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 기본: 기존 prices ?�이�??�이??
      const { results } = await db.prepare(`
        SELECT symbol, price, timestamp 
        FROM prices 
        ORDER BY timestamp DESC 
        LIMIT ?
      `).bind(limit).all();
      
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// src/serveMedia.js - R2?�서 미디???�일 ?�빙
import { errorResponse } from './utils.js';

export async function handleServeMedia(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const key = url.pathname.split('/').pop(); // /media/filename?�서 filename 추출
    
    console.log(`?�� Serving media file: ${key}`);
    
    if (!key) {
      console.error('??No file key provided');
      return errorResponse('?�일 ?��? ?�요?�니??, 400);
    }
    
    console.log('?�� Checking R2 bucket for key:', key);
    const object = await env.CHARTS.get(key);
    
    if (!object) {
      console.error(`??File not found in R2: ${key}`);
      // R2 버킷??모든 객체 ?�열 (?�버깅용)
      try {
        const list = await env.CHARTS.list({ limit: 10 });
        console.log('?�� Available files in R2:', list.objects.map(obj => obj.key));
      } catch (listErr) {
        console.error('??Failed to list R2 objects:', listErr);
      }
      return errorResponse('?�일??찾을 ???�습?�다', 404);
    }
    
    console.log('??File found in R2, serving...');
    
    const headers = new Headers();
    
    // Content-Type ?�정
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    
    // 캐시 ?�더 ?�정
    headers.set('Cache-Control', 'public, max-age=300'); // 5�?캐시
    headers.set('Access-Control-Allow-Origin', '*'); // CORS ?�용
    
    // SVG??경우 ?�별 처리
    if (key.endsWith('.svg')) {
      headers.set('Content-Type', 'image/svg+xml');
      headers.set('X-Content-Type-Options', 'nosniff');
    }
    
    return new Response(object.body, { headers });
    
  } catch (err) {
    console.error('미디???�빙 ?�류:', err);
    return errorResponse(`미디???�일 ?�빙 ?�패: ${err.message}`, 500);
  }
}

// src/utils.js
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 공통 ?�이?�베?�스 초기???�틸리티

export async function initializeDatabase(db) {
  try {
    console.log('?�� Database initialization started...');
    
    // 마이그레?�션 ?�행
    await runMigration(db);
    
    console.log('??Database initialization completed');
    return true;
  } catch (err) {
    console.error('??Database initialization error:', err);
    throw err;
  }
}

async function runMigration(db) {
  // 0001_database.sql 마이그레?�션 ?�행
  
  // ====================================
  // DROP OLD TABLES (clean slate)
  // ====================================
  
  // Drop old tables that we don't need anymore
  await db.prepare(`DROP TABLE IF EXISTS coin_prices`).run();
  await db.prepare(`DROP TABLE IF EXISTS prices`).run();
  
  // Drop any old triggers
  await db.prepare(`DROP TRIGGER IF EXISTS update_comments_count_insert`).run();
  await db.prepare(`DROP TRIGGER IF EXISTS update_comments_count_delete`).run();

  // ====================================
  // CREATE NEW TABLES
  // ====================================

  // 0. Coin market data table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS coin_market_data (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      image TEXT,
      current_price REAL,
      market_cap REAL,
      market_cap_rank INTEGER,
      total_volume REAL,
      high_24h REAL,
      low_24h REAL,
      price_change_percentage_24h REAL,
      circulating_supply REAL,
      max_supply REAL,
      ath REAL,
      atl REAL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 1. Users table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      name TEXT,
      given_name TEXT,
      family_name TEXT,
      profile_picture TEXT,
      locale TEXT DEFAULT 'en',
      is_ai BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `).run();

  // 2. Media files table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS media_files (
      media_id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size_kb INTEGER,
      media_type TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      uploaded_by INTEGER,
      is_ai BOOLEAN DEFAULT FALSE,
      linked_post_id INTEGER,
      linked_comment_id INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
      FOREIGN KEY (linked_post_id) REFERENCES posts(post_id),
      FOREIGN KEY (linked_comment_id) REFERENCES comments(comment_id)
    )
  `).run();

  // 3. Posts table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS posts (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      is_ai BOOLEAN DEFAULT FALSE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      media_id INTEGER,
      FOREIGN KEY (author_id) REFERENCES users(user_id),
      FOREIGN KEY (media_id) REFERENCES media_files(media_id)
    )
  `).run();

  // 4. Comments table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      is_ai BOOLEAN DEFAULT FALSE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(user_id)
    )
  `).run();

  // ====================================
  // CREATE INDEXES FOR PERFORMANCE
  // ====================================

  // Coin market data indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coin_market_data_symbol ON coin_market_data(symbol)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coin_market_data_rank ON coin_market_data(market_cap_rank)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coin_market_data_updated ON coin_market_data(last_updated)`).run();

  // Users indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_is_ai ON users(is_ai)`).run();

  // Media files indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_files(uploaded_by)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_linked_post ON media_files(linked_post_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_linked_comment ON media_files(linked_comment_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_type ON media_files(media_type)`).run();

  // Posts indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_is_ai ON posts(is_ai)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count)`).run();

  // Comments indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`).run();

  // ====================================
  // CREATE TRIGGERS FOR AUTO UPDATES
  // ====================================

  // Trigger to update comments_count when comment is added
  await db.prepare(`
    CREATE TRIGGER IF NOT EXISTS update_comments_count_insert
    AFTER INSERT ON comments
    BEGIN
      UPDATE posts 
      SET comments_count = (
        SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id
      )
      WHERE post_id = NEW.post_id;
    END
  `).run();

  // Trigger to update comments_count when comment is deleted
  await db.prepare(`
    CREATE TRIGGER IF NOT EXISTS update_comments_count_delete
    AFTER DELETE ON comments
    BEGIN
      UPDATE posts 
      SET comments_count = (
        SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id
      )
      WHERE post_id = OLD.post_id;
    END
  `).run();

  // ====================================
  // INSERT DEFAULT DATA
  // ====================================

  // Create AI user for system-generated content
  await db.prepare(`
    INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
    VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
  `).run();

  // Create anonymous user for guest posts
  await db.prepare(`
    INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
    VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
  `).run();

  console.log('??Database migration completed successfully');
}

/**
 * ?�� GPT ?�롬?�트 빌더 - ?�르?�나 기반 콘텐�??�성 ?�롬?�트 ?�성
 */

export function buildPersonaPrompt(persona) {
  const topics = JSON.parse(persona.topics || '[]');
  const language = persona.language || 'kr';
  
  // ?�어�?기본 ?�정
  const langSettings = {
    kr: {
      instruction: '?�국?�로 ?��??�주?�요.',
      cryptoTerms: '?�호?�폐, 비트코인, ?�더리�?, ?�트코인'
    },
    en: {
      instruction: 'Please respond in English.',
      cryptoTerms: 'cryptocurrency, bitcoin, ethereum, altcoins'
    }
  };
  
  const settings = langSettings[language] || langSettings.kr;
  
  // ?�르?�나�??�롬?�트 구성
  const prompt = `?�신?� ${persona.name}(${persona.age}?? ${persona.gender})?�니??

**?�격�??��???**
- 글?�기 ?��??? ${persona.style}
- 말투/?? ${persona.tone}
- 관???�견: ${persona.bias}
- ?�랭 ?�용: ${persona.slang ? '?�주 ?�용' : '거의 ?�용?��? ?�음'}

**관?�사:** ${topics.join(', ')}

**?�청?�항:**
${settings.cryptoTerms}???�??짧�? ?�견?�나 ?�보�?${persona.style} ?��??�로 ?�성?�주?�요. 
${persona.tone} ?�을 ?��??�고, ${persona.bias} 관?�을 반영?�주?�요.

- 길이: 150-300???�외
- ${settings.instruction}
- ?�시?�그 2-3�??�함
- ?�연?�럽�?개성?�게 ?�성

글�??�성?�고 ?�른 ?�명?� ?��? 마세??`;

  return prompt;
}

export function buildRandomTopicPrompt(persona) {
  const topics = JSON.parse(persona.topics || '[]');
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  return `${persona.name}???�각?�로 "${randomTopic}"???�??${persona.style} ?��??�로 짧게 ?�견??말해주세?? ${persona.tone} ?�을 ?�용?�고 ${persona.language === 'kr' ? '?�국?�로' : 'in English'} ?�성?�주?�요.`;
}

/**
 * ?�� ?�르?�나 쿼리 ?�터�??�틸리티
 */

/**
 * 조건??맞는 ?�르?�나�??�덤?�로 ?�택
 * @param {Object} env - Cloudflare environment variables
 * @param {string} frequency - posting_frequency 조건 ('hourly', 'daily', etc.)
 * @param {string} language - ?�어 조건 (?�택?�항)
 * @returns {Object|null} ?�택???�르?�나 객체
 */
export async function getRandomPersona(env, frequency = 'hourly', language = null) {
  try {
    let query = `SELECT * FROM personas WHERE posting_frequency = ?`;
    let params = [frequency];
    
    if (language) {
      query += ` AND language = ?`;
      params.push(language);
    }
    
    query += ` ORDER BY RANDOM() LIMIT 1`;
    
    const result = await env.MY_COINGECKO_DB.prepare(query)
      .bind(...params)
      .first();
    
    if (!result) {
      console.log(`No persona found with frequency: ${frequency}, language: ${language}`);
      return null;
    }
    
    // JSON ?�드 ?�싱
    const persona = {
      ...result,
      topics: JSON.parse(result.topics || '[]'),
      posting_hours: JSON.parse(result.posting_hours || '[]')
    };
    
    console.log(`Selected persona: ${persona.name} (${persona.id})`);
    return persona;
    
  } catch (error) {
    console.error('Error fetching random persona:', error);
    return null;
  }
}

/**
 * ?�재 ?�간???�스??가?�한 ?�르?�나 목록 조회
 * @param {Object} env - Cloudflare environment variables
 * @param {number} currentHour - ?�재 ?�간 (0-23)
 * @returns {Array} ?�스??가?�한 ?�르?�나 배열
 */
export async function getActivePersonas(env, currentHour) {
  try {
    const allPersonas = await env.MY_COINGECKO_DB.prepare(
      `SELECT * FROM personas WHERE posting_frequency = 'hourly'`
    ).all();
    
    const activePersonas = allPersonas.results.filter(persona => {
      const postingHours = JSON.parse(persona.posting_hours || '[]');
      return postingHours.includes(currentHour);
    });
    
    return activePersonas;
    
  } catch (error) {
    console.error('Error fetching active personas:', error);
    return [];
  }
}

/**
 * ?�르?�나 ID�??�정 ?�르?�나 조회
 * @param {Object} env - Cloudflare environment variables  
 * @param {string} personaId - ?�르?�나 ID
 * @returns {Object|null} ?�르?�나 객체
 */
export async function getPersonaById(env, personaId) {
  try {
    const result = await env.MY_COINGECKO_DB.prepare(
      `SELECT * FROM personas WHERE id = ?`
    ).bind(personaId).first();
    
    if (!result) return null;
    
    return {
      ...result,
      topics: JSON.parse(result.topics || '[]'),
      posting_hours: JSON.parse(result.posting_hours || '[]')
    };
    
  } catch (error) {
    console.error('Error fetching persona by ID:', error);
    return null;
  }
}

export async function handleCronPrices(request, env, ctx) {
  try {
    console.log('Starting CoinGecko API fetch...');
    
    const db = env.MY_COINGECKO_DB;
    
    // coin_market_data ?�이블이 존재?�는지 ?�인?�고 ?�성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS coin_market_data (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        current_price REAL,
        market_cap REAL,
        market_cap_rank INTEGER,
        total_volume REAL,
        high_24h REAL,
        low_24h REAL,
        price_change_percentage_24h REAL,
        circulating_supply REAL,
        max_supply REAL,
        ath REAL,
        atl REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // CoinGecko API?�서 ?�위 100�?코인 ?�이??가?�오�?
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoGram/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const coinsData = await response.json();
    console.log(`Fetched ${coinsData.length} coins from CoinGecko`);
    
    // 배치�??�이???�입
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO coin_market_data (
        id, symbol, name, image, current_price, market_cap, market_cap_rank,
        total_volume, high_24h, low_24h, price_change_percentage_24h,
        circulating_supply, max_supply, ath, atl, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    let insertedCount = 0;
    const sampleData = [];
    
    for (const coin of coinsData) {
      try {
        await insertStmt.bind(
          coin.id,
          coin.symbol,
          coin.name,
          coin.image,
          coin.current_price,
          coin.market_cap,
          coin.market_cap_rank,
          coin.total_volume,
          coin.high_24h,
          coin.low_24h,
          coin.price_change_percentage_24h,
          coin.circulating_supply,
          coin.max_supply,
          coin.ath,
          coin.atl
        ).run();
        
        insertedCount++;
        
        // ?�위 5�?코인 ?�이?��? ?�답???�함
        if (insertedCount <= 5) {
          sampleData.push({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            current_price: coin.current_price,
            market_cap_rank: coin.market_cap_rank,
            price_change_percentage_24h: coin.price_change_percentage_24h
          });
        }
      } catch (insertError) {
        console.error(`Error inserting ${coin.id}:`, insertError);
      }
    }
    
    // 기존 ?�환?�을 ?�해 prices ?�이블도 ?�데?�트 (Bitcoin, Ethereum�?
    const btcData = coinsData.find(coin => coin.id === 'bitcoin');
    const ethData = coinsData.find(coin => coin.id === 'ethereum');
    
    if (btcData || ethData) {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS prices (
          symbol TEXT PRIMARY KEY,
          price REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      if (btcData) {
        await db.prepare(
          'INSERT OR REPLACE INTO prices (symbol, price, timestamp) VALUES (?, ?, datetime("now"))'
        ).bind('bitcoin', btcData.current_price).run();
      }
      
      if (ethData) {
        await db.prepare(
          'INSERT OR REPLACE INTO prices (symbol, price, timestamp) VALUES (?, ?, datetime("now"))'
        ).bind('ethereum', ethData.current_price).run();
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully updated ${insertedCount} coins from CoinGecko API`,
      data: {
        inserted_count: insertedCount,
        sample_coins: sampleData,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Cron error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

import { Router } from 'itty-router';
import { handleCronPrices } from './cronPrices.js';
import { handleDataApi } from './handlers/dataApi.js';
import { handleGenerateWebM } from './charts/generateWebM.js';
import { handleServeMedia } from './handlers/serveMedia.js';
import { handleEmbedChart } from './charts/embedChart.js';

// ?�로??모듈??API imports
import { handleCoinsFetch } from './api/coins/fetch.js';
import { handleCoinsSave } from './api/coins/save.js';
import { handleCoinsList } from './api/coins/list.js';
import { handleCoinsChart } from './api/coins/chart.js';
import { handlePostsCreate } from './api/posts/create.js';
import { handlePostsList } from './api/posts/list.js';
import { handlePostsDetail } from './api/posts/detail.js';
import { handleCommentsCreate } from './api/comments/create.js';
import { handleCommentsList } from './api/comments/list.js';
import { handleUsersCreate } from './api/users/create.js';
import { handleUsersList } from './api/users/list.js';
import { handleUsersDetail } from './api/users/detail.js';
import { handleMediaUpload } from './api/media/upload.js';
import { handleMediaList } from './api/media/list.js';

// Discord Bot imports
import { hourlyPersonaPoster } from './bots/scheduler/hourlyPersonaPoster.js';
import { handleDiscordJoin, getDiscordJoinStats } from './api/discord/join.js';

const router = Router();

// 기존 API ?�우?�들 (?�거???�환??
router.get('/cron/prices', (request, env, ctx) => handleCronPrices(request, env, ctx));
router.get('/api/data', (request, env, ctx) => handleDataApi(request, env, ctx)); // ?�합???�이??API

// 커�??�티 API??(?�로??모듈??구조 ?�용)
router.get('/api/posts', (request, env, ctx) => handlePostsList(request, env, ctx));
router.post('/api/posts', (request, env, ctx) => handlePostsCreate(request, env, ctx));
router.post('/api/posts/:id/comments', (request, env, ctx) => {
  // URL?�서 post_id�?추출?�여 body??추�?
  const url = new URL(request.url);
  const postId = url.pathname.split('/')[3];
  
  // ?�본 request body?� post_id�??�치??wrapper
  const wrappedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  // post_id�?주입?�기 ?�한 custom json() 메서??
  wrappedRequest.json = async () => {
    const originalBody = await request.json();
    return { ...originalBody, post_id: parseInt(postId) };
  };
  
  return handleCommentsCreate(wrappedRequest, env, ctx);
});

// ?�로??모듈??API ?�우?�들
// Coins API
router.get('/api/coins/fetch', (request, env, ctx) => handleCoinsFetch(request, env, ctx));
router.post('/api/coins/save', (request, env, ctx) => handleCoinsSave(request, env, ctx));
router.get('/api/coins/list', (request, env, ctx) => handleCoinsList(request, env, ctx));
router.get('/api/coins/chart', (request, env, ctx) => handleCoinsChart(request, env, ctx));

// Posts API (??구조)
router.post('/api/v2/posts', (request, env, ctx) => handlePostsCreate(request, env, ctx));
router.get('/api/v2/posts', (request, env, ctx) => handlePostsList(request, env, ctx));
router.get('/api/v2/posts/:id', (request, env, ctx) => handlePostsDetail(request, env, ctx));

// Comments API (??구조)
router.post('/api/v2/comments', (request, env, ctx) => handleCommentsCreate(request, env, ctx));
router.get('/api/v2/comments', (request, env, ctx) => handleCommentsList(request, env, ctx));

// Users API
router.post('/api/users', (request, env, ctx) => handleUsersCreate(request, env, ctx));
router.get('/api/users', (request, env, ctx) => handleUsersList(request, env, ctx));
router.get('/api/users/:id', (request, env, ctx) => handleUsersDetail(request, env, ctx));

// Media API
router.post('/api/media/upload', (request, env, ctx) => handleMediaUpload(request, env, ctx));
router.get('/api/media', (request, env, ctx) => handleMediaList(request, env, ctx));

// Discord API
router.get('/discord/join', (request, env, ctx) => handleDiscordJoin(request, env, ctx));
router.get('/api/discord/stats', (request, env, ctx) => getDiscordJoinStats(env));

// 기�? API??
router.post('/api/generate-webm', (request, env, ctx) => handleGenerateWebM(request, env, ctx));
router.get('/media/:key', (request, env, ctx) => handleServeMedia(request, env, ctx));
router.get('/embed/chart.webm', (request, env, ctx) => handleEmbedChart(request, env, ctx));

// 관리자 ?�이지
router.get('/admin', () => {
  const html = '<!DOCTYPE html>' +
    '<html lang="ko">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>CryptoGram - 관리자</title>' +
    '<style>' +
    'body { margin: 0; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; }' +
    '.container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }' +
    '.status { padding: 1rem; margin: 1rem 0; border-radius: 8px; background: #e3f2fd; border-left: 4px solid #2196f3; }' +
    '.btn { background: #2196f3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 0.5rem; }' +
    '.btn:hover { background: #1976d2; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
    '<h1>?? CryptoGram 관리자</h1>' +
    '<p><a href="/">??메인?�로 ?�아가�?/a></p>' +
    '<div class="status" id="status">?�스??준비됨</div>' +
    '<button class="btn" onclick="checkData()">?�이???�인</button>' +
    '<button class="btn" onclick="generateWebM()">WebM ?�성</button>' +
    '</div>' +
    '<script>' +
    'const status = document.getElementById("status");' +
    'async function checkData() {' +
    '  status.textContent = "?�이???�인 �?..";' +
    '  try {' +
    '    const res = await fetch("/api/data");' +
    '    const data = await res.json();' +
    '    status.innerHTML = "???�이??" + data.length + "�??�인??;' +
    '  } catch (err) {' +
    '    status.innerHTML = "???�이???�인 ?�패: " + err.message;' +
    '  }' +
    '}' +
    'async function generateWebM() {' +
    '  status.textContent = "WebM ?�성 �?..";' +
    '  try {' +
    '    const res = await fetch("/api/generate-webm", { method: "POST" });' +
    '    const result = await res.json();' +
    '    status.innerHTML = "??WebM ?�성 ?�료: " + result.url;' +
    '  } catch (err) {' +
    '    status.innerHTML = "??WebM ?�성 ?�패: " + err.message;' +
    '  }' +
    '}' +
    'checkData();' +
    '</script>' +
    '</body>' +
    '</html>';
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
});

// 메인 ?�이지 - Instagram ?��???커�??�티
router.get('/', () => {
  const html = '<!DOCTYPE html>' +
    '<html lang="ko">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>CryptoGram</title>' +
    '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' +
    '<style>' +
    '* { margin: 0; padding: 0; box-sizing: border-box; }' +
    'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fafafa; }' +
    '.content-container { max-width: 470px; margin: 0 auto; }' +
    '@media (min-width: 768px) { .content-container { max-width: 614px; } }' +
    '.story-gradient { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 2px; }' +
    '.hover-scale { transition: transform 0.2s; }' +
    '.hover-scale:hover { transform: scale(1.05); }' +
    '.post-input { flex: 1; border: 1px solid #dbdbdb; border-radius: 22px; padding: 0 16px; font-size: 14px; outline: none; }' +
    '.post-input:focus { border-color: #a8a8a8; }' +
    '</style>' +
    '</head>' +
    '<body class="bg-gray-50">' +
    '<nav class="bg-white border-b border-gray-200 fixed top-0 w-full z-50">' +
    '<div class="content-container px-4">' +
    '<div class="flex justify-between items-center h-16">' +
    '<div class="flex items-center space-x-3">' +
    '<i class="fab fa-bitcoin text-2xl text-yellow-500"></i>' +
    '<h1 class="text-xl font-semibold">CryptoGram</h1>' +
    '</div>' +
    '<div class="flex items-center space-x-4">' +
    '<a href="/admin" class="text-xs text-gray-400 hover:text-gray-600">관리자</a>' +
    '<button onclick="quickLogin()" id="login-btn" class="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-md hover:bg-blue-600 transition">로그??/button>' +
    '<div id="user-info" class="hidden flex items-center space-x-3">' +
    '<span id="username-display" class="text-sm font-medium"></span>' +
    '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">' +
    '<span id="user-avatar-text"></span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</nav>' +
    '<main class="pt-16">' +
    '<div class="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-4">' +
    '<div class="content-container px-4">' +
    '<div class="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 text-white text-center">' +
    '<h2 class="text-2xl font-bold mb-2">?�� Bitcoin Live Chart</h2>' +
    '<p class="text-white text-opacity-90 text-sm">?�시�??�호?�폐 차트?� 커�??�티</p>' +
    '<div class="mt-4 bg-white bg-opacity-20 rounded-xl overflow-hidden">' +
    '<object data="/embed/chart.webm" type="image/svg+xml" width="100%" height="200" style="border-radius: 8px;">' +
    '<div class="flex items-center justify-center h-48">' +
    '<span class="text-white text-opacity-60 text-sm">차트 로딩 �?..</span>' +
    '</div>' +
    '</object>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="content-container px-4 py-6">' +
    '<div id="post-creator" class="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 opacity-60 pointer-events-none">' +
    '<div class="flex items-center p-3 gap-2">' +
    '<input type="text" id="post-content" class="post-input h-10" placeholder="로그?????�각??공유?�세??.." onkeypress="if(event.key===\'Enter\' && currentUser) { createPost(); }"/>' +
    '<button onclick="createPost()" class="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition">게시</button>' +
    '</div>' +
    '</div>' +
    '<div id="posts-container" class="space-y-3">' +
    '<div class="text-center py-8">' +
    '<div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">' +
    '<i class="fas fa-spinner fa-spin text-gray-400"></i>' +
    '</div>' +
    '<p class="text-gray-500">?�스?��? 불러?�는 �?..</p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</main>' +
    '<script>' +
    'let currentUser = null;' +
    'window.addEventListener("load", function() { loadPosts(); });' +
    'function quickLogin() {' +
    'const username = prompt("?�용?�명???�력?�세??(2-10??:");' +
    'if (!username || username.length < 2 || username.length > 10) {' +
    'alert("2-10???�이???�용?�명???�력?�주?�요.");' +
    'return;' +
    '}' +
    'currentUser = { id: Date.now(), name: username };' +
    'document.getElementById("login-btn").classList.add("hidden");' +
    'document.getElementById("user-info").classList.remove("hidden");' +
    'document.getElementById("username-display").textContent = username;' +
    'document.getElementById("user-avatar-text").textContent = username.charAt(0).toUpperCase();' +
    'const postCreator = document.getElementById("post-creator");' +
    'postCreator.classList.remove("opacity-60", "pointer-events-none");' +
    'document.getElementById("post-content").placeholder = "무슨 ?�각???�고 계신가??";' +
    'updateCommentForms();' +
    '}' +
    'function updateCommentForms() {' +
    'document.querySelectorAll(".comment-input").forEach(input => {' +
    'input.disabled = !currentUser;' +
    'input.placeholder = currentUser ? "?��? ?�기..." : "로그?????��????????�습?�다";' +
    '});' +
    'document.querySelectorAll("button[onclick*=\\"addComment\\"]").forEach(button => {' +
    'button.disabled = !currentUser;' +
    'if (currentUser) {' +
    'button.classList.remove("opacity-50", "cursor-not-allowed");' +
    '} else {' +
    'button.classList.add("opacity-50", "cursor-not-allowed");' +
    '}' +
    '});' +
    '}' +
    'async function createPost() {' +
    'if (!currentUser) { quickLogin(); return; }' +
    'const content = document.getElementById("post-content").value.trim();' +
    'if (!content) return;' +
    'try {' +
    'const response = await fetch("/api/posts", {' +
    'method: "POST",' +
    'headers: { "Content-Type": "application/json" },' +
    'body: JSON.stringify({ content: content, user: currentUser })' +
    '});' +
    'if (response.ok) {' +
    'document.getElementById("post-content").value = "";' +
    'loadPosts();' +
    '}' +
    '} catch (err) {' +
    'alert("?�스???�성???�패?�습?�다.");' +
    '}' +
    '}' +
    'async function loadPosts() {' +
    'try {' +
    'console.log("?�스??로드 ?�작...");' +
    'const response = await fetch("/api/posts");' +
    'console.log("API ?�답 ?�신:", response.status);' +
    'const posts = await response.json();' +
    'console.log("?�스???�이??", posts);' +
    'const container = document.getElementById("posts-container");' +
    'if (posts.length === 0) {' +
    'container.innerHTML = "<div class=\\"text-center py-12\\"><i class=\\"far fa-images text-6xl text-gray-300 mb-4\\"></i><p class=\\"text-gray-500 mb-4\\">?�직 게시물이 ?�습?�다</p><button onclick=\\"quickLogin()\\" class=\\"text-blue-500 font-medium\\">�?번째 게시물을 ?�성?�보?�요</button></div>";' +
    'return;' +
    '}' +
    'console.log("?�스??HTML ?�성 ?�작...");' +
    'let htmlContent = "";' +
    'for (let i = 0; i < posts.length; i++) {' +
    'const post = posts[i];' +
    'console.log("?�스??처리 �?", post.post_id);' +
    'const postHTML = createPostHTML(post);' +
    'console.log("?�스??HTML ?�성??", postHTML.length, "characters");' +
    'htmlContent += postHTML;' +
    '}' +
    'container.innerHTML = htmlContent;' +
    'console.log("?�스??HTML ?�성 ?�료, �?길이:", htmlContent.length);' +
    'updateCommentForms();' +
    '} catch (err) {' +
    'console.error("?�스??로드 ?�패:", err);' +
    'const container = document.getElementById("posts-container");' +
    'container.innerHTML = "<div class=\\"text-center py-12 text-red-500\\">?�스??로드 �??�류가 발생?�습?�다: " + err.message + "</div>";' +
    '}' +
    '}' +
    'function createPostHTML(post) {' +
    'console.log("createPostHTML ?�출?? post:", post);' +
    'try {' +
    'const timeAgo = getTimeAgo(new Date(post.created_at));' +
    'const authorName = "User" + post.author_id;' +
    'const comments = post.comments || [];' +
    'const avatarLetter = authorName.charAt(0).toUpperCase();' +
    '' +
    'let commentsHTML = "";' +
    'if (comments.length > 0) {' +
    'commentsHTML = "<div class=\\"px-4 py-2 space-y-1\\">";' +
    'for (let i = 0; i < comments.length; i++) {' +
    'const comment = comments[i];' +
    'const commentAuthor = "User" + comment.author_id;' +
    'commentsHTML += "<div class=\\"text-sm\\"><span class=\\"font-medium\\">" + commentAuthor + "</span><span class=\\"ml-1\\">" + comment.content + "</span></div>";' +
    '}' +
    'commentsHTML += "</div>";' +
    '}' +
    '' +
    'const html = "<article class=\\"bg-white rounded-lg shadow-sm border border-gray-200\\">" +' +
    '"<div class=\\"flex items-center justify-between p-4\\">" +' +
    '"<div class=\\"flex items-center space-x-3\\">" +' +
    '"<div class=\\"story-gradient rounded-full p-0.5\\">" +' +
    '"<div class=\\"bg-white p-0.5 rounded-full\\">" +' +
    '"<div class=\\"w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold\\">" +' +
    'avatarLetter +' +
    '"</div></div></div>" +' +
    '"<div><p class=\\"font-medium text-sm\\">" + authorName + "</p>" +' +
    '"<p class=\\"text-xs text-gray-500\\">" + timeAgo + "</p></div>" +' +
    '"</div>" +' +
    '"<button class=\\"text-gray-400 hover:text-gray-600\\"><i class=\\"fas fa-ellipsis-h\\"></i></button>" +' +
    '"</div>" +' +
    '"<div class=\\"px-4 pb-3\\"><p class=\\"text-sm\\">" + post.content + "</p></div>" +' +
    '"<div class=\\"px-4 pb-2\\"><div class=\\"flex items-center space-x-4\\">" +' +
    '"<button class=\\"hover-scale\\"><i class=\\"far fa-heart text-2xl\\"></i></button>" +' +
    '"<button class=\\"hover-scale\\"><i class=\\"far fa-comment text-2xl\\"></i></button>" +' +
    '"<button class=\\"hover-scale\\"><i class=\\"far fa-paper-plane text-2xl\\"></i></button>" +' +
    '"<button class=\\"ml-auto hover-scale\\"><i class=\\"far fa-bookmark text-2xl\\"></i></button>" +' +
    '"</div></div>" +' +
    '"<div class=\\"border-t border-gray-100\\">" + commentsHTML +' +
    '"<div class=\\"flex items-center p-3 gap-2 border-t border-gray-100\\">" +' +
    '"<input type=\\"text\\" class=\\"comment-input post-input h-9\\" placeholder=\\"?��? ?�기...\\" onkeypress=\\"if(event.key===\'Enter\' && currentUser) { addComment(" + post.post_id + ", this.value); this.value=\'\'; }\\" disabled>" +' +
    '"<button onclick=\\"addComment(" + post.post_id + ", this.previousElementSibling.value); this.previousElementSibling.value=\'\';\\" class=\\"text-blue-500 font-medium text-sm px-3 py-1.5 opacity-50 cursor-not-allowed\\" disabled>게시</button>" +' +
    '"</div></div></article>";' +
    '' +
    'console.log("HTML ?�성 ?�료, post_id:", post.post_id);' +
    'return html;' +
    '} catch (err) {' +
    'console.error("createPostHTML ?�러:", err);' +
    'return "<div style=\\"color: red; border: 2px solid red; padding: 15px; margin: 10px;\\">?�류: " + err.message + "</div>";' +
    '}' +
    '}' +
    'async function addComment(postId, content) {' +
    'if (!currentUser || !content.trim()) return;' +
    'try {' +
    'const response = await fetch("/api/posts/" + postId + "/comments", {' +
    'method: "POST",' +
    'headers: { "Content-Type": "application/json" },' +
    'body: JSON.stringify({ content: content.trim(), user: currentUser })' +
    '});' +
    'if (response.ok) { loadPosts(); }' +
    '} catch (err) {' +
    'alert("?��? ?�성???�패?�습?�다.");' +
    '}' +
    '}' +
    'function escapeHtml(text) {' +
    'const div = document.createElement("div");' +
    'div.textContent = text;' +
    'return div.innerHTML;' +
    '}' +
    'function getTimeAgo(date) {' +
    'const seconds = Math.floor((new Date() - date) / 1000);' +
    'const intervals = { "??: 31536000, "개월": 2592000, "??: 86400, "?�간": 3600, "�?: 60 };' +
    'for (const [unit, secondsInUnit] of Object.entries(intervals)) {' +
    'const interval = Math.floor(seconds / secondsInUnit);' +
    'if (interval >= 1) { return interval + unit + " ??; }' +
    '}' +
    'return "방금 ??;' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';
  
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
});

// 404 처리
router.all('*', () => new Response('Not found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    console.log('?�� Scheduled event triggered:', event.cron);
    
    switch (event.cron) {
      case '0 * * * *': // 매시�??�각 (?�호?�폐 가�??�집)
        console.log('Running hourly crypto price collection...');
        await handleCronPrices(null, env, ctx);
        break;
        
      case '15 * * * *': // 매시�?15�?(?�르?�나 ?�스??
        console.log('Running hourly persona posting...');
        try {
          const result = await hourlyPersonaPoster(env);
          console.log('Persona posting result:', result);
        } catch (error) {
          console.error('Error in persona posting:', error);
        }
        break;
        
      default:
        console.log('Unknown cron pattern:', event.cron);
    }
  }
};

