import React, { useState, useEffect } from 'react';
import { loadWallet, generateWallet, saveWallet } from './wallet';
import Verify from './Verify';
import './index.css';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [verified, setVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const init = async () => {
      const w = loadWallet();
      setWallet(w);

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: 'device_' + w.address.substring(0, 10),
            address: w.address,
            method: 'web',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setBalance(data.wallet?.balance || 1000);
          setRegistered(true);
        }
      } catch (err) {
        setBalance(1000);
      }

      try {
        const txRes = await fetch(`${API_URL}/transactions?address=${w.address}`);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.transactions || []);
        }
      } catch (err) {}
    };

    init();
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendTransaction = async () => {
    if (!toAddress || !amount) {
      setMessage('❌ Fill in all fields');
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
        setMessage(`✅ Sent ${amount} AETH! Gas: 0`);
        setMessageType('success');
        setTransactions([{ to_address: toAddress, amount: parseInt(amount), timestamp: Math.floor(Date.now() / 1000) }, ...transactions]);
        setToAddress('');
        setAmount('');
        setBalance(balance - parseInt(amount));
      } else {
        setMessage(`❌ ${data.error || 'Failed'}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (data) => {
    setVerified(true);
    setShowVerify(false);
    setMessage(`✅ Verified via ${data.method} (${data.trust}% trust)`);
    setMessageType('success');
  };

  if (!wallet) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#030014', color: 'white' }}>Loading...</div>;

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
        <div className="header-badge">{verified ? '✓ VERIFIED' : registered ? 'LIVE' : 'LOCAL'}</div>
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
              {copied ? '✓' : 'Copy'}
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
          <button className="action-tile" onClick={() => setShowVerify(true)}>
            <div className="action-tile-icon">🔐</div>
            <span>{verified ? 'Verified' : 'Verify'}</span>
          </button>
          <button className="action-tile" onClick={() => { const w = generateWallet(); saveWallet(w); setWallet(w); window.location.reload(); }}>
            <div className="action-tile-icon">✨</div>
            <span>New</span>
          </button>
        </div>

        {showVerify && (
          <Verify wallet={wallet} onVerified={handleVerified} onSkip={() => setShowVerify(false)} />
        )}

        {!showVerify && (
          <>
            <div className="card">
              <h3 className="card-title">Send AETH</h3>
              <p className="card-subtitle">Transfer instantly with zero fees</p>
              <div className="gas-pill">Gas: 0 AETH</div>

              <div className="input-group">
                <label className="input-label">Recipient</label>
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
                  {transactions.slice(0, 5).map((tx, i) => (
                    <div key={i} className="tx-item">
                      <div className="tx-icon">🚀</div>
                      <div className="tx-details">
                        <div className="tx-address">→ {tx.to_address?.slice(0, 16)}...</div>
                        <div className="tx-time">{tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : 'Recently'}</div>
                      </div>
                      <div className="tx-amount">-{tx.amount} AETH</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="card">
          <h3 className="card-title">Network Overview</h3>
          <p className="card-subtitle">Live Aether network stats</p>
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
