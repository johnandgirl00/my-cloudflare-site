// List saved cryptocurrency data
export async function handleCoinsList(request, env) {
  try {
    // Simple implementation - return mock data for now
    const mockData = {
      coins: [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 67000 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 3800 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', current_price: 0.45 }
      ],
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(mockData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('List error:', error);
    return new Response(JSON.stringify({ error: 'Failed to list data' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
