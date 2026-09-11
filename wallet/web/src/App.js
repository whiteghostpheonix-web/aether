import React, { useState, useEffect } from 'react';
import './App.css';
import { loadWallet, generateWallet, saveWallet } from './wallet';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const w = loadWallet();
    setWallet(w);
    setBalance(1000 + Math.floor(Math.random() * 9000));
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendTransaction = async () => {
    if (!toAddress || !amount) {
      setMessage('❌ Please fill in all fields');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('⏳ Sending...');

    try {
      const response = await fetch(`${API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: wallet.address,
          to: toAddress,
          amount: parseInt(amount),
          currency: 'AETH',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Sent ${amount} AETH! Gas: 0 (FREE!)`);
        setMessageType('success');
        setTransactions([...transactions, {
          to: toAddress,
          amount: amount,
          time: new Date().toLocaleTimeString(),
          tx: data.tx_hash ? data.tx_hash.substring(0, 10) : '0x0000'
        }]);
        setToAddress('');
        setAmount('');
        setBalance(balance - parseInt(amount));
      } else {
        setMessage(`❌ Failed: ${data.message || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getNewWallet = () => {
    const newWallet = generateWallet();
    saveWallet(newWallet);
    setWallet(newWallet);
    setTransactions([]);
    setBalance(1000 + Math.floor(Math.random() * 9000));
    setMessage('✅ New anonymous wallet generated!');
    setMessageType('success');
  };

  if (!wallet) return <div className="app">Loading...</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">AETHER</span>
        </div>
        <span className="badge">100% FREE</span>
      </header>

      <div className="container">
        {/* Balance Card */}
        <div className="card balance-card">
          <div className="balance-label">Total Balance</div>
          <div className="balance-amount">
            {balance}<span className="balance-currency">AETH</span>
          </div>
          
          <div className="address-display">
            <span>{wallet.address}</span>
            <button className="copy-btn" onClick={copyAddress}>
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>

          <div className="wallet-actions">
            <button className="action-btn" onClick={getNewWallet}>
              🔄 New Wallet
            </button>
            <button className="action-btn" onClick={() => setBalance(balance + 100)}>
              💰 Add 100
            </button>
          </div>
        </div>

        {/* Send Card */}
        <div className="card">
          <h3 className="card-title">Send AETH</h3>
          <div className="gas-badge">Gas: 0 AETH (FREE!)</div>

          <div className="input-group">
            <label className="input-label">Recipient Address</label>
            <input
              type="text"
              className="input"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Amount (AETH)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button
            className="send-btn"
            onClick={sendTransaction}
            disabled={loading}
          >
            {loading ? '⏳ Sending...' : '🚀 Send (FREE)'}
          </button>

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="card">
          <h3 className="card-title">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="tx-list">
              {transactions.slice(-5).reverse().map((tx, i) => (
                <div key={i} className="tx-item">
                  <div className="tx-icon">🚀</div>
                  <div className="tx-details">
                    <div className="tx-address">→ {tx.to.slice(0, 16)}...</div>
                    <div className="tx-time">{tx.time}</div>
                  </div>
                  <div className="tx-amount">{tx.amount} AETH</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card">
          <h3 className="card-title">Network Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">520+</div>
              <div className="stat-label">Validators</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">$0</div>
              <div className="stat-label">Gas Fees</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">190+</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">1,000</div>
              <div className="stat-label">Free TX/Day</div>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>⚡ AETHER - Built to be FREE. Forever.</p>
          <p style={{ marginTop: '12px' }}>
            <a href="https://github.com/whiteghostpheonix-web/aether">GitHub</a>
            <a href="https://aether-dashboard.whiteghostpheonix.workers.dev">Dashboard</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
