import React, { useState } from 'react';
import { saveWallet } from './wallet';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

const FOUNDER_WALLETS = {
  '+256744557693': {
    address: '0xfounder1000000000000000000000000000000001',
    name: 'Founder 1 (Airtel)',
  },
  '+256761184084': {
    address: '0xfounder2000000000000000000000000000000002',
    name: 'Founder 2 (MTN)',
  },
};

export default function FounderLogin({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFounderLogin = async () => {
    const cleanPhone = phone.trim();
    
    if (!FOUNDER_WALLETS[cleanPhone]) {
      setMessage('❌ This is not a founder number');
      return;
    }

    setLoading(true);
    setMessage('⏳ Loading founder account...');

    try {
      const founder = FOUNDER_WALLETS[cleanPhone];
      
      // Save founder wallet locally
      const founderWallet = {
        address: founder.address,
        privateKey: 'founder_' + cleanPhone,
        mnemonic: 'founder account ' + cleanPhone,
        isFounder: true,
        phone: cleanPhone,
        createdAt: new Date().toISOString(),
      };
      
      saveWallet(founderWallet);
      
      setMessage('👑 Welcome Founder! Reloading...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
    setLoading(false);
  };

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
            <div className="logo-subtitle">Founder Login</div>
          </div>
        </div>
        <div className="header-badge" style={{ background: 'linear-gradient(135deg, #FFB800, #CC9200)' }}>
          👑 ADMIN
        </div>
      </header>

      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>👑</div>
          <h2 className="card-title" style={{ fontSize: '24px' }}>Founder Access</h2>
          <p className="card-subtitle">
            Enter your founder phone number to access the infinite balance account.
          </p>
        </div>

        <div className="card">
          <div className="input-group">
            <label className="input-label">Founder Phone Number</label>
            <input
              type="tel"
              className="input"
              placeholder="+256744557693"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ fontSize: '16px' }}
            />
          </div>

          <button
            className="send-btn"
            onClick={handleFounderLogin}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #FFB800, #CC9200)',
              boxShadow: '0 8px 32px rgba(255, 184, 0, 0.4)',
            }}
          >
            {loading ? '⏳ Loading...' : '👑 Login as Founder'}
          </button>

          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`} style={{ marginTop: '16px' }}>
              {message}
            </div>
          )}
        </div>

        <div className="card" style={{ fontSize: '12px', color: '#6b7280' }}>
          <h4 style={{ color: '#FFB800', marginBottom: '8px' }}>🔐 Founder Numbers</h4>
          <p>• +256744557693 (Airtel)</p>
          <p>• +256761184084 (MTN)</p>
          <p style={{ marginTop: '12px', color: '#FFB800' }}>
            ⚠️ Only these numbers have infinite balance
          </p>
        </div>

        <footer className="footer">
          <div className="footer-brand">⚡ AETHER</div>
          <p>Founder Mode</p>
        </footer>
      </div>
    </div>
  );
}
