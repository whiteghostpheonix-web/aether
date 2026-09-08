import React, { useState } from 'react';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

function App() {
  const [address] = useState('0x' + Math.random().toString(16).substring(2, 10) + '...');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendTransaction = async () => {
    if (!toAddress || !amount) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          to: toAddress,
          amount: parseInt(amount),
          currency: 'AETH',
        }),
      });

      const data = await response.json();
      setMessage(`✅ Transaction sent! Gas: ${data.gas || 0} AETH`);
      setToAddress('');
      setAmount('');
    } catch (error) {
      setMessage('❌ Transaction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', background: '#0a0a0f', color: '#e5e5e5', minHeight: '100vh'}}>
      <h1 style={{textAlign: 'center'}}>⚡ AETHER WALLET</h1>
      <p style={{textAlign: 'center', color: '#60a5fa'}}>100% Gas-Free</p>
      
      <div style={{background: '#1a1a2e', borderRadius: '12px', padding: '20px', margin: '16px 0'}}>
        <p style={{color: '#9ca3af'}}>Your Address</p>
        <p>{address}</p>
      </div>

      <div style={{background: '#1a1a2e', borderRadius: '12px', padding: '20px', margin: '16px 0'}}>
        <h3>Send AETH</h3>
        <p style={{color: '#10b981'}}>⛽ Gas: 0 AETH (FREE!)</p>
        
        <input type="text" placeholder="Recipient Address" value={toAddress} onChange={(e) => setToAddress(e.target.value)} style={{width: '100%', padding: '10px', marginBottom: '12px', background: '#0a0a1f', border: '1px solid #2a2a4a', borderRadius: '6px', color: '#e5e5e5'}} />
        <input type="number" placeholder="Amount (AETH)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{width: '100%', padding: '10px', marginBottom: '12px', background: '#0a0a1f', border: '1px solid #2a2a4a', borderRadius: '6px', color: '#e5e5e5'}} />
        
        <button onClick={sendTransaction} disabled={loading} style={{width: '100%', padding: '12px', background: '#60a5fa', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>
          {loading ? 'Sending...' : '🚀 Send (FREE)'}
        </button>
        
        {message && <p style={{marginTop: '12px', color: '#10b981'}}>{message}</p>}
      </div>

      <footer style={{textAlign: 'center', color: '#6b7280', padding: '20px 0'}}>
        <p>⚡ AETHER - Built to be FREE. Forever.</p>
      </footer>
    </div>
  );
}

export default App;
