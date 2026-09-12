// This file is included by index.js - add this block inside handleRequest

export const verifyEndpoint = async (db, body, cors) => {
  try {
    await db.prepare(
      `UPDATE users SET verified = 1, verification_method = ?, biometric_hash = ?, trust_score = ? WHERE address = ?`
    ).bind(body.method, body.hash, body.trust, body.address).run();

    return new Response(JSON.stringify({
      success: true,
      method: body.method,
      trust: body.trust,
      message: '✅ Identity verified!',
    }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: cors,
    });
  }
};
