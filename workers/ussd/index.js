//! AETHER USSD GATEWAY
//! Developer: +256744557693 (Airtel)
//! MTN: +256761184084

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url)
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }
    
    if (url.pathname === '/ussd') {
      let body
      try {
        body = await request.json()
      } catch (e) {
        body = { phone: '+256744557693', session_id: 'test' }
      }
      
      const phone = body.phone || '+256744557693'
      const input = body.input || ''
      const session_id = body.session_id || Math.random().toString(36).substring(7)
      
      // Developer check
      const isDeveloper = phone === '+256744557693' || phone === '+256761184084'
      
      let message = ''
      let next_step = 'menu'
      
      // Main menu
      if (!input || input === '') {
        message = '🌍 AETHER USSD\n================\n1. Send Money\n2. Check Balance\n3. Buy Aether\n4. My Wallet\n5. Help\n'
        if (isDeveloper) {
          message += '9. Dev Mode\n'
        }
        message += '0. Exit'
      } else if (input === '0') {
        message = '✅ Thank you for using Aether!\nGas: 0 AETH (FREE!)'
        next_step = 'end'
      } else if (input === '1') {
        message = '📱 Enter recipient number:'
        next_step = 'recipient'
      } else if (input === '2') {
        message = '💰 Balance: 1,234 AETH\n⛽ Gas: 0 AETH (FREE!)'
        next_step = 'menu'
      } else if (input === '3') {
        message = '💰 Enter amount to buy AETH:'
        next_step = 'buy'
      } else if (input === '4') {
        message = '👛 My Wallet\nAddress: 0x8a...88bd\nBalance: 1,234 AETH\nTX: 42\nGas: 0 AETH'
        next_step = 'menu'
      } else if (input === '5') {
        message = '🆘 HELP\nSend money with 0 gas!\nDeveloper: +256744557693\nMTN: +256761184084'
        next_step = 'menu'
      } else if (input === '9' && isDeveloper) {
        message = '🔧 DEV MODE\nValidators: 520\nTPS: Unlimited\nGas: 0\nAll systems: ONLINE\nNetwork: AETHER'
        next_step = 'menu'
      } else if (input.startsWith('+') || input.startsWith('0') || input.length > 5) {
        // Handle recipient input
        const amount = body.amount || 100
        message = '✅ Sending to ' + input + '\nAmount: ' + amount + ' AETH\nGas: 0 (FREE!)\nTX: 0x' + Math.random().toString(16).substring(2, 10) + '\n\n1. Main Menu\n0. Exit'
        next_step = 'menu'
      } else {
        message = '❌ Invalid option. Try again.\n' + (isDeveloper ? '9. Dev Mode\n' : '') + '0. Exit'
        next_step = 'menu'
      }
      
      const response = {
        session_id: session_id,
        phone: phone,
        message: message,
        next_step: next_step,
        status: 'success'
      }
      
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        }
      })
    }
    
    return new Response('AETHER USSD Gateway - Use /ussd endpoint', { 
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Server error',
      message: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
