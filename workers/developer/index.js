//! DEVELOPER BENEFITS SYSTEM

const DEVELOPERS = {
  '+256744557693': { name: 'Developer 1', share: 0.5, earned: 1000 },
  '+256761184084': { name: 'Developer 2', share: 0.5, earned: 1000 }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname === '/developer/stats') {
    const totalEarned = Object.values(DEVELOPERS).reduce((sum, d) => sum + d.earned, 0)
    return new Response(JSON.stringify({
      developers: DEVELOPERS,
      total_earned: totalEarned,
      currency: 'AETH',
      gas: 0,
      free: true
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  if (url.pathname === '/developer/claim') {
    const body = await request.json().catch(() => ({}))
    const phone = body.phone || '+256744557693'
    
    if (DEVELOPERS[phone]) {
      const earned = DEVELOPERS[phone].earned
      DEVELOPERS[phone].earned = 0
      return new Response(JSON.stringify({
        status: 'success',
        phone: phone,
        claimed: earned,
        currency: 'AETH',
        gas: 0
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    return new Response(JSON.stringify({ error: 'Developer not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  return new Response(JSON.stringify({
    status: 'online',
    service: 'AETHER Developer Benefits',
    developers: Object.keys(DEVELOPERS),
    gas: 0,
    free: true
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}
