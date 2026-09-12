import React, { useState } from 'react';
import { biometric } from './biometric';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';
const SIM_URL = 'https://aether-sim-auth.whiteghostpheonix.workers.dev';

export default function Verify({ onVerified, wallet, onSkip }) {
  const [step, setStep] = useState('choose');
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');

  const handleBiometric = async (type) => {
    setMethod(type);
    setLoading(true);
    setMessage(`⏳ Capturing ${type}...`);
    setMessageType('success');

    let result;
    try {
      if (type === 'fingerprint') result = await biometric.authenticateFingerprint();
      else if (type === 'eye') result = await biometric.authenticateEye();
      else if (type === 'face') result = await biometric.authenticateFace();
      else if (type === 'voice') result = await biometric.authenticateVoice();
    } catch (err) {
      result = { success: false, error: err.message };
    }

    if (result && result.success) {
      setMessage(`✅ ${type} verified! Trust: ${result.trust}%`);
      setMessageType('success');
      try {
        await fetch(`${API_URL}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: wallet.address,
            method: type,
            hash: result.hash,
            trust: result.trust,
          }),
        });
      } catch (err) {}
      setTimeout(() => onVerified({ method: type, trust: result.trust }), 1500);
    } else {
      setMessage(`❌ ${type} failed: ${result?.error || 'Try again'}`);
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleButtonPhone = async (type) => {
    if (!phoneNumber) {
      setMessage('❌ Enter your phone number');
      setMessageType('error');
      return;
    }
    setMethod(type);
    setLoading(true);

    try {
      const endpoint = { call: '/voice-verify', sms: '/sms-verify', ussd: '/ussd-verify', sim: '/verify' }[type];
      const response = await fetch(`${SIM_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await response.json();

      if (type === 'sim') {
        setMessage(`✅ SIM verified! Trust: ${data.trustScore}%`);
        setMessageType('success');
        try {
          await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: wallet.address,
              method: 'sim',
              hash: data.identityHash,
              trust: data.trustScore,
            }),
          });
        } catch (err) {}
        setTimeout(() => onVerified({ method: 'sim', trust: data.trustScore }), 1500);
      } else {
        setCode(data.code);
        setMessage(`📱 ${data.instruction}`);
        setMessageType('success');
        setStep('verify-code');
      }
    } catch (err) {
      setMessage(`❌ Failed: ${err.message}`);
      setMessageType('error');
    }
    setLoading(false);
  };

  const confirmCode = async () => {
    if (code === '' || code.length < 6) {
      setMessage('❌ Enter the 6-digit code');
      setMessageType('error');
      return;
    }
    setMessage(`✅ Verified with ${method}!`);
    setMessageType('success');
    try {
      await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address, method: method, hash: code, trust: 85 }),
      });
    } catch (err) {}
    setTimeout(() => onVerified({ method, trust: 85 }), 1500);
  };

  if (step === 'verify-code') {
    return (
      <div className="card">
        <h3 className="card-title">📲 Enter Code</h3>
        <p className="card-subtitle">{message}</p>
        <div className="input-group">
          <label className="input-label">6-Digit Code</label>
          <input
            type="text"
            className="input"
            placeholder="123456"
            maxLength="6"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '0.5em' }}
          />
        </div>
        <button className="send-btn" onClick={confirmCode}>✅ Confirm</button>
        <button className="action-btn" style={{ marginTop: '8px', width: '100%' }} onClick={() => setStep('choose')}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">🔐 Verify Identity</h3>
      <p className="card-subtitle">Choose a verification method</p>

      <h4 style={{ color: '#00E5FF', marginTop: '16px', marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        📱 Smart Devices
      </h4>

      <div className="action-grid">
        <button className="action-tile" onClick={() => handleBiometric('fingerprint')} disabled={loading}>
          <div className="action-tile-icon">🖐️</div>
          <span>Finger</span>
        </button>
        <button className="action-tile" onClick={() => handleBiometric('eye')} disabled={loading}>
          <div className="action-tile-icon">👁️</div>
          <span>Eye</span>
        </button>
        <button className="action-tile" onClick={() => handleBiometric('face')} disabled={loading}>
          <div className="action-tile-icon">😊</div>
          <span>Face</span>
        </button>
        <button className="action-tile" onClick={() => handleBiometric('voice')} disabled={loading}>
          <div className="action-tile-icon">🎤</div>
          <span>Voice</span>
        </button>
      </div>

      <h4 style={{ color: '#FFB800', marginTop: '24px', marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        📟 Button Phones
      </h4>

      <div className="input-group">
        <label className="input-label">Phone Number</label>
        <input
          type="tel"
          className="input"
          placeholder="+256744557693"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="action-grid">
        <button className="action-tile" onClick={() => handleButtonPhone('sim')} disabled={loading}>
          <div className="action-tile-icon">🔢</div>
          <span>SIM</span>
        </button>
        <button className="action-tile" onClick={() => handleButtonPhone('call')} disabled={loading}>
          <div className="action-tile-icon">📞</div>
          <span>Call</span>
        </button>
        <button className="action-tile" onClick={() => handleButtonPhone('sms')} disabled={loading}>
          <div className="action-tile-icon">💬</div>
          <span>SMS</span>
        </button>
        <button className="action-tile" onClick={() => handleButtonPhone('ussd')} disabled={loading}>
          <div className="action-tile-icon">*️⃣</div>
          <span>USSD</span>
        </button>
      </div>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      {onSkip && (
        <button
          className="action-btn"
          style={{ marginTop: '16px', width: '100%' }}
          onClick={onSkip}
        >
          Skip for now →
        </button>
      )}
    </div>
  );
}
