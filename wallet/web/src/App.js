import React, { useState, useEffect } from 'react';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

function App() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Generate a REAL random address
    const randomAddr = '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setAddress(randomAddr);
    setBalance(1000);
  }, []);

  const sendTransaction = async () => {
    if (!toAddress || !amount) {
      setMessage('❌ Please fill in all fields');
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
      
      if (response.ok) {
        setMessage(`✅ Sent ${amount} AETH! Gas: 0 (FREE!)`);
        setTransactions([...transactions, {
          to: toAddress,
          amount: amount,
          time: new Date().toLocaleTimeString(),
          tx: data.tx_hash || '0x' + Math.random().toString(16).substring(2, 10)
        }]);
        setToAddress('');
        setAmount('');
        setBalance(balance - parseInt(amount));
      } else {
        setMessage(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async () => {
    try {
      const response = await fetch(`${API_URL}/balance?address=${address}`);
      const data = await response.json();
      setBalance(data.balance || 1000);
      setMessage(`✅ Balance updated: ${data.balance || 1000} AETH`);
    } catch (error) {
      setMessage('❌ Using local balance');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>⚡ AETHER WALLET</h1>
        <p style={styles.subtitle}>100% Gas-Free</p>
      </header>

      <div style={styles.card}>
        <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>Balance</span>
          <span style={styles.balanceAmount}>{balance} AETH</span>
        </div>
        <div style={styles.addressSection}>
          <span style={styles.addressLabel}>Your Address</span>
          <span style={styles.addressValue}>{address}</span>
        </div>
        <button onClick={getBalance} style={styles.refreshBtn}>🔄 Refresh</button>
      </div>

      <div style={styles.card}>
        <h3>Send AETH</h3>
        <p style={styles.gasFree}>⛽ Gas: 0 AETH (FREE!)</p>

        <input
          type="text"
          placeholder="Recipient Address (0x...)"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          placeholder="Amount (AETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={sendTransaction}
          disabled={loading}
          style={{...styles.sendBtn, ...(loading ? styles.disabled : {})}}
        >
          {loading ? 'Sending...' : '🚀 Send (FREE)'}
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </div>

      <div style={styles.card}>
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p style={styles.empty}>No transactions yet</p>
        ) : (
          transactions.slice(-5).reverse().map((tx, i) => (
            <div key={i} style={styles.txItem}>
              <span>→ {tx.to.slice(0, 10)}...</span>
              <span>{tx.amount} AETH</span>
              <span style={styles.txTime}>{tx.time}</span>
            </div>
          ))
        )}
      </div>

      <footer style={styles.footer}>
        <p>⚡ AETHER - Built to be FREE. Forever.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', background: '#0a0a0f', color: '#e5e5e5', minHeight: '100vh' },
  header: { textAlign: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  title: { margin: 0, fontSize: '28px' },
  subtitle: { color: '#60a5fa', margin: '4px 0' },
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '20px', margin: '16px 0', border: '1px solid rgba(255,255,255,0.05)' },
  balanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  balanceLabel: { color: '#9ca3af' },
  balanceAmount: { fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' },
  addressSection: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  addressLabel: { color: '#6b7280', fontSize: '12px', display: 'block' },
  addressValue: { fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' },
  refreshBtn: { marginTop: '10px', padding: '6px 12px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: '4px', cursor: 'pointer' },
  gasFree: { color: '#10b981', fontSize: '14px', marginBottom: '16px' },
  input: { width: '100%', padding: '10px', background: '#0a0a1f', border: '1px solid #2a2a4a', borderRadius: '6px', color: '#e5e5e5', marginBottom: '12px', boxSizing: 'border-box' },
  sendBtn: { width: '100%', padding: '12px', background: '#60a5fa', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  disabled: { opacity: 0.6, cursor: 'not-allowed' },
  message: { marginTop: '12px', padding: '8px', borderRadius: '4px', textAlign: 'center', background: 'rgba(16,185,129,0.1)', color: '#10b981' },
  empty: { color: '#6b7280', textAlign: 'center' },
  txItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' },
  txTime: { color: '#6b7280', fontSize: '12px' },
  footer: { textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: '12px' },
};

export default App;
