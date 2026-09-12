//! AETHER ONBOARDING

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname === '/register') {
    const body = await request.json()
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: 'user_' + Math.random().toString(36).substring(7),
        phone: body.phone,
        address: '0x' + Math.random().toString(16).substring(2, 42),
        quota: 1000,
        used: 0
      },
      message: '✅ Welcome to Aether! 1000 free transactions waiting for you!'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  return new Response('AETHER Onboarding', { headers: { 'Content-Type': 'text/plain' } })
}
