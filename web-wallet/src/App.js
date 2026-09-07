import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const randomAddress = '0x' + Math.random().toString(16).substring(2, 42);
    setAddress(randomAddress);
    setBalance(Math.floor(Math.random() * 1000));
  }, []);

  const sendTransaction = async () => {
    if (!toAddress || !amount) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const txHash = '0x' + Math.random().toString(16).substring(2, 42);
      setMessage(`✅ Transaction sent! Hash: ${txHash}\n⛽ Gas: 0 AETH (FREE!)`);
      setBalance(balance - parseInt(amount));
      setToAddress('');
      setAmount('');
    } catch (error) {
      setMessage('❌ Transaction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>⚡ AETHER WALLET</h1>
        <p className="subtitle">100% Gas-Free • Global • Instant</p>
      </header>

      <div className="container">
        <div className="balance-card">
          <div className="balance-label">Your Balance</div>
          <div className="balance-amount">{balance} AETH</div>
          <div className="gas-badge">⛽ Gas: 0 AETH (FREE)</div>
          <div className="address-box">
            <div className="address-label">Address</div>
            <div className="address-value">{address}</div>
          </div>
        </div>

        <div className="send-card">
          <h3>Send AETH</h3>
          <p className="gas-free">⛽ 100% Gas-Free</p>
          
          <div className="form-group">
            <label>Recipient Address</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Amount (AETH)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input"
              min="0"
            />
          </div>

          <button
            onClick={sendTransaction}
            disabled={loading}
            className="send-button"
          >
            {loading ? 'Sending...' : '🚀 Send (Gas FREE)'}
          </button>

          {message && <div className="message">{message}</div>}
        </div>

        <div className="features">
          <div className="feature">⛽ Zero Gas Fees</div>
          <div className="feature">🌍 Global Instant</div>
          <div className="feature">🔒 Secure</div>
        </div>
      </div>
    </div>
  );
}

export default App;
