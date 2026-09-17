addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env))
})

async function handleRequest(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  const url = new URL(request.url)
  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const db = env.DB

    // ─── HEALTH ──────────────────────────────────────────
    if (url.pathname === '/health') {
      return json({ status: 'online', network: 'Aether', version: '1.0.0', gas: 0, free: true }, cors)
    }

    // ─── REGISTER (Requires Biometric) ───────────────────
    if (url.pathname === '/register' && request.method === 'POST') {
      const body = await request.json()
      
      // MANDATORY: Must have biometric hash
      if (!body.biometric_hash) {
        return json({ error: 'Biometric verification required' }, cors, 400)
      }

      // CHECK: Is this biometric already registered?
      const existing = await db.prepare(
        'SELECT * FROM users WHERE biometric_hash = ?'
      ).bind(body.biometric_hash).first()

      if (existing) {
        // Return existing account
        const wallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(existing.id).first()
        return json({
          success: true,
          existing: true,
          user: existing,
          wallet: wallet,
          message: '✅ Welcome back! One biometric = one account.'
        }, cors)
      }

      // Create new user (0 balance for non-founders)
      const userId = 'user_' + crypto.randomUUID()
      const walletId = 'wallet_' + crypto.randomUUID()
      const address = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

      // Check if this is a founder phone
      const isFounder = ['+256744557693', '+256761184084'].includes(body.phone) ? 1 : 0

      await db.prepare(
        `INSERT INTO users (id, phone, address, biometric_hash, verification_method, trust_score, verified, biometric_locked, is_founder)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).bind(
        userId,
        body.phone || null,
        address,
        body.biometric_hash,
        body.method || 'biometric',
        body.trust || 95,
        1,
        isFounder
      ).run()

      await db.prepare(
        `INSERT INTO wallets (id, user_id, address, balance, is_infinite, balance_hidden)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        walletId,
        userId,
        address,
        isFounder ? 999999999 : 0,
        isFounder,
        isFounder
      ).run()

      return json({
        success: true,
        user: { id: userId, address, phone: body.phone, is_founder: isFounder },
        wallet: {
          id: walletId,
          address,
          balance: isFounder ? '∞' : 0,
          is_infinite: isFounder
        },
        message: isFounder ? '👑 Founder account created!' : '✅ Welcome to Aether! Your account is ready.'
      }, cors)
    }

    // ─── SEND ────────────────────────────────────────────
    if (url.pathname === '/send' && request.method === 'POST') {
      const body = await request.json()
      const txId = 'tx_' + crypto.randomUUID()
      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

      const senderWallet = await db.prepare('SELECT * FROM wallets WHERE address = ?').bind(body.from).first()
      if (!senderWallet) return json({ error: 'Sender not found' }, cors, 404)

      // Founder has infinite balance
      if (!senderWallet.is_infinite && senderWallet.balance < body.amount) {
        return json({ error: 'Insufficient balance' }, cors, 400)
      }

      // Check quota (founders don't have quota)
      if (!senderWallet.is_infinite && senderWallet.used_today >= senderWallet.daily_quota) {
        return json({ error: 'Daily quota exceeded' }, cors, 429)
      }

      await db.prepare(
        `INSERT INTO transactions (id, from_address, to_address, amount, currency, gas, fee, status, tx_hash)
         VALUES (?, ?, ?, ?, 'AETH', 0, 0, 'confirmed', ?)`
      ).bind(txId, body.from, body.to, body.amount, txHash).run()

      if (!senderWallet.is_infinite) {
        await db.prepare(
          `UPDATE wallets SET balance = balance - ?, used_today = used_today + 1, total_sent = total_sent + ? WHERE address = ?`
        ).bind(body.amount, body.amount, body.from).run()
      }

      await db.prepare(
        `UPDATE wallets SET balance = balance + ?, total_received = total_received + ? WHERE address = ?`
      ).bind(body.amount, body.amount, body.to).run()

      return json({
        status: 'success',
        tx_id: txId,
        tx_hash: txHash,
        gas: 0,
        free: true,
        message: '✅ Sent! Gas: 0 AETH'
      }, cors)
    }

    // ─── BALANCE (Hidden for founder) ────────────────────
    if (url.pathname === '/balance') {
      const address = url.searchParams.get('address')
      const requesterAddress = url.searchParams.get('requester')
      
      const wallet = await db.prepare('SELECT * FROM wallets WHERE address = ?').bind(address).first()
      if (!wallet) return json({ balance: 0, gas: 0, free: true }, cors)

      // Hide founder balance from other users
      const isSelf = requesterAddress === address
      const shouldHide = wallet.balance_hidden && !isSelf

      return json({
        address,
        balance: wallet.is_infinite ? (isSelf ? '∞' : '∞') : wallet.balance,
        is_infinite: wallet.is_infinite,
        hidden: shouldHide,
        display: shouldHide ? '***' : (wallet.is_infinite ? '∞' : wallet.balance),
        gas: 0,
        free: true
      }, cors)
    }

    // ─── USER INFO ───────────────────────────────────────
    if (url.pathname === '/user') {
      const address = url.searchParams.get('address')
      const user = await db.prepare('SELECT * FROM users WHERE address = ?').bind(address).first()
      if (!user) return json({ error: 'Not found' }, cors, 404)
      const wallet = await db.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(user.id).first()
      return json({ user, wallet }, cors)
    }

    // ─── VERIFY (Saves biometric hash) ────────────────────
    if (url.pathname === '/verify' && request.method === 'POST') {
      const body = await request.json()
      
      // Check if biometric already exists
      const existing = await db.prepare(
        'SELECT * FROM users WHERE biometric_hash = ? AND address != ?'
      ).bind(body.hash, body.address).first()

      if (existing) {
        return json({
          error: 'This biometric is already registered to another account',
          existing_account: existing.address
        }, cors, 409)
      }

      await db.prepare(
        `UPDATE users SET verified = 1, verification_method = ?, biometric_hash = ?, trust_score = ?, biometric_locked = 1 WHERE address = ?`
      ).bind(body.method, body.hash, body.trust, body.address).run()

      return json({
        success: true,
        method: body.method,
        trust: body.trust,
        message: '✅ Identity locked to this account'
      }, cors)
    }

    // ─── TRANSACTIONS ────────────────────────────────────
    if (url.pathname === '/transactions') {
      const address = url.searchParams.get('address')
      const txs = await db.prepare(
        `SELECT * FROM transactions WHERE from_address = ? OR to_address = ? ORDER BY timestamp DESC LIMIT 50`
      ).bind(address, address).all()
      return json({ transactions: txs.results || [] }, cors)
    }

    // ─── STATS ───────────────────────────────────────────
    if (url.pathname === '/stats') {
      const users = await db.prepare('SELECT COUNT(*) as count FROM users').first()
      const txs = await db.prepare('SELECT COUNT(*) as count FROM transactions').first()
      return json({
        users: users?.count || 0,
        transactions: txs?.count || 0,
        gas: 0,
        free: true
      }, cors)
    }

    return json({ status: 'online', service: 'AETHER API', gas: 0, free: true }, cors)

  } catch (error) {
    return json({ status: 'error', message: error.message }, cors, 500)
  }
}

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}
