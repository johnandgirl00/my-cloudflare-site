// Fetch cryptocurrency data from CoinGecko API
export async function handleCoinsFetch(request, env) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,polygon,chainlink&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
