import React, { useState, useEffect } from 'react';
import { loadWallet, generateWallet, saveWallet } from './wallet';
import Verify from './Verify';
import './index.css';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [balanceDisplay, setBalanceDisplay] = useState('0');
  const [isInfinite, setIsInfinite] = useState(false);
  const [verified, setVerified] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
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
    // Check if already verified
    const savedVerified = localStorage.getItem('aether_verified');
    if (savedVerified === 'true') {
      setVerified(true);
      loadUserData(w);
    } else {
      setNeedsVerify(true);
    }
  }, []);

  const loadUserData = async (w) => {
    try {
      const userRes = await fetch(`${API_URL}/user?address=${w.address}`);
      if (userRes.ok) {
        const data = await userRes.json();
        if (data.wallet) {
          setIsInfinite(data.wallet.is_infinite === 1);
          setBalance(data.wallet.balance);
          setBalanceDisplay(data.wallet.is_infinite ? '∞' : data.wallet.balance.toLocaleString());
        }
      }
      const txRes = await fetch(`${API_URL}/transactions?address=${w.address}`);
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err) {}
  };

  const handleVerified = async (data) => {
    setVerified(true);
    setNeedsVerify(false);
    localStorage.setItem('aether_verified', 'true');
    localStorage.setItem('aether_biometric_hash', data.hash);
    localStorage.setItem('aether_method', data.method);

    // Register user with biometric hash
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.phone || 'device_' + wallet.address.substring(0, 10),
          address: wallet.address,
          biometric_hash: data.hash,
          method: data.method,
          trust: data.trust,
        }),
      });
      const result = await res.json();
      if (result.wallet) {
        setIsInfinite(result.wallet.is_infinite === 1);
        setBalance(result.wallet.balance);
        setBalanceDisplay(result.wallet.is_infinite ? '∞' : result.wallet.balance.toLocaleString());
      }
      setMessage(`✅ Verified via ${data.method} (${data.trust}%)`);
      setMessageType('success');
    } catch (err) {
      setMessage('❌ Registration failed');
      setMessageType('error');
    }
  };

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
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Sent ${amount} AETH! Gas: 0`);
        setMessageType('success');
        setTransactions([{ to_address: toAddress, amount: parseInt(amount), timestamp: Math.floor(Date.now() / 1000) }, ...transactions]);
        setToAddress('');
        setAmount('');
        if (!isInfinite) {
          setBalance(balance - parseInt(amount));
          setBalanceDisplay((balance - parseInt(amount)).toLocaleString());
        }
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

  if (!wallet) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#030014', color: 'white' }}>Loading...</div>;

  // BIOMETRIC-FIRST: Show verify screen before anything else
  if (needsVerify || !verified) {
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
              <div className="logo-subtitle">Verify to Begin</div>
            </div>
          </div>
          <div className="header-badge">STEP 1/2</div>
        </header>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h2 className="card-title" style={{ fontSize: '22px' }}>Verify Identity First</h2>
            <p className="card-subtitle" style={{ marginBottom: '8px' }}>
              One biometric = One account. This prevents multiple accounts.
            </p>
            <p style={{ color: '#FFB800', fontSize: '12px', marginBottom: '16px' }}>
              Your biometric is your identity. It cannot be used twice.
            </p>
          </div>
          <Verify wallet={wallet} onVerified={handleVerified} />
        </div>
      </div>
    );
  }

  // MAIN WALLET
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
        <div className="header-badge">
          {isInfinite ? '👑 FOUNDER' : '✓ VERIFIED'}
        </div>
      </header>

      <div className="container">
        <div className="card balance-card">
          <div className="balance-header">
            <span className="balance-label">{isInfinite ? 'Founder Balance' : 'Total Balance'}</span>
          </div>
          <div className="balance-amount">
            {balanceDisplay}
            <span className="balance-currency">AETH</span>
          </div>
          {isInfinite && (
            <p style={{ color: '#FFB800', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
              👑 Unlimited balance — hidden from other users
            </p>
          )}
          <div className="address-box">
            <div className="address-icon">👤</div>
            <div className="address-text">{wallet.address}</div>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyAddress}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

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

        <footer className="footer">
          <div className="footer-brand">⚡ AETHER</div>
          <p>Built to be FREE. Forever.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
