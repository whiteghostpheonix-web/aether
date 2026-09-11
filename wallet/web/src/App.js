import React, { useState, useEffect } from 'react';
import { loadWallet, generateWallet, saveWallet } from './wallet';
import './index.css';

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
    setMessage('⏳ Processing...');
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
        setMessage(`✅ Sent ${amount} AETH successfully!`);
        setMessageType('success');
        setTransactions([...transactions, {
          to: toAddress,
          amount: amount,
          time: new Date().toLocaleTimeString(),
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
    setMessage('✅ New anonymous wallet created!');
    setMessageType('success');
  };

  if (!wallet) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#030014',color:'white'}}>Loading...</div>;

  return (
    <div className="app">
      <div className="app-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <div className="logo-title">AETHER</div>
            <div className="logo-subtitle">Gas-Free Blockchain</div>
          </div>
        </div>
        <div className="header-badge">Gas: 0 AETH</div>
      </header>

      <div className="container">
        <div className="card balance-card">
          <div className="balance-header">
            <span className="balance-label">Total Balance</span>
          </div>
          <div className="balance-amount">
            {balance.toLocaleString()}
            <span className="balance-currency">AETH</span>
          </div>
          <div className="address-box">
            <div className="address-icon">👤</div>
            <div className="address-text">{wallet.address}</div>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyAddress}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="action-grid">
          <button className="action-tile">
            <div className="action-tile-icon">📤</div>
            <span>Send</span>
          </button>
          <button className="action-tile">
            <div className="action-tile-icon">📥</div>
            <span>Receive</span>
          </button>
          <button className="action-tile">
            <div className="action-tile-icon">🔄</div>
            <span>Swap</span>
          </button>
          <button className="action-tile" onClick={getNewWallet}>
            <div className="action-tile-icon">✨</div>
            <span>New</span>
          </button>
        </div>

        <div className="card">
          <h3 className="card-title">Send AETH</h3>
          <p className="card-subtitle">Transfer funds instantly with zero fees</p>
          <div className="gas-pill">Gas: 0 AETH</div>
          <div className="input-group">
            <label className="input-label">Recipient Address</label>
            <input type="text" className="input" placeholder="0x..." value={toAddress} onChange={(e) => setToAddress(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Amount</label>
            <input type="number" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <button className="send-btn" onClick={sendTransaction} disabled={loading}>
            {loading ? '⏳ Processing...' : '🚀 Send Now'}
          </button>
          {message && <div className={`message ${messageType}`}>{message}</div>}
        </div>

        <div className="card">
          <h3 className="card-title">Recent Activity</h3>
          <p className="card-subtitle">Your latest transactions</p>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No transactions yet</div>
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
                  <div className="tx-amount">-{tx.amount} AETH</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Network Overview</h3>
          <p className="card-subtitle">Live Aether network statistics</p>
          <div className="stats-grid">
            <div className="stat-item"><div className="stat-value">520+</div><div className="stat-label">Validators</div></div>
            <div className="stat-item"><div className="stat-value">$0</div><div className="stat-label">Gas Fees</div></div>
            <div className="stat-item"><div className="stat-value">190+</div><div className="stat-label">Countries</div></div>
            <div className="stat-item"><div className="stat-value">1,000</div><div className="stat-label">Free TX/Day</div></div>
          </div>
        </div>

        <footer className="footer">
          <div className="footer-brand">⚡ AETHER</div>
          <p>Built to be FREE. Forever.</p>
          <div className="footer-links">
            <a href="https://github.com/whiteghostpheonix-web/aether">GitHub</a>
            <a href="https://aether-dashboard.whiteghostpheonix.workers.dev">Dashboard</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
