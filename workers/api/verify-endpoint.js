// Add to workers/api/index.js inside handleRequest:

if (url.pathname === '/verify' && request.method === 'POST') {
  const body = await request.json()
  
  // Update user with verification
  await db.prepare(
    `UPDATE users SET verified = 1, verification_method = ?, biometric_hash = ?, trust_score = ? WHERE address = ?`
  ).bind(body.method, body.hash, body.trust, body.address).run()
  
  return json({
    success: true,
    method: body.method,
    trust: body.trust,
    message: '✅ Identity verified!'
  }, cors)
}
