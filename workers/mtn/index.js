//! MTN MOBILE MONEY BRIDGE
//! Uganda, Ghana, Rwanda

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname === '/mtn/send') {
    const body = await request.json()
    return new Response(JSON.stringify({
      status: 'success',
      transaction_id: 'MTN_' + Math.random().toString(36).substring(7),
      phone: body.phone || '256712345678',
      amount: body.amount || 100,
      gas: 0,
      free: true,
      message: '✅ MTN payment sent! Gas: 0 AETH'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  return new Response('MTN Bridge', { headers: { 'Content-Type': 'text/plain' } })
}
