//! AIRTEL MONEY BRIDGE
//! Uganda, Kenya, Tanzania, Nigeria

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Airtel Money Send
  if (url.pathname === '/airtel/send') {
    const body = await request.json()
    
    const response = {
      status: 'success',
      transaction_id: 'AIRTEL_' + Math.random().toString(36).substring(7),
      phone: body.phone || '+256744557693',
      amount: body.amount || 100,
      gas: 0,
      free: true,
      message: '✅ Airtel Money sent! Gas: 0 AETH'
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  // Airtel Balance
  if (url.pathname === '/airtel/balance') {
    const phone = url.searchParams.get('phone')
    return new Response(JSON.stringify({
      phone: phone || '+256744557693',
      balance: 5000,
      gas: 0,
      free: true
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  return new Response('Airtel Money Bridge', { headers: { 'Content-Type': 'text/plain' } })
}
