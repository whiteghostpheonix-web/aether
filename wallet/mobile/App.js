import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';

const API_URL = 'https://aether-api.whiteghostpheonix.workers.dev';

const App = () => {
  const [address, setAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Generate random address
    setAddress('0x' + Math.random().toString(16).substring(2, 10) + '...');
  }, []);

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
          currency: 'AETH'
        })
      });

      const data = await response.json();
      setMessage(`✅ Sent! Gas: ${data.gas || 0} AETH`);
      setToAddress('');
      setAmount('');
    } catch (error) {
      setMessage('❌ Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async () => {
    try {
      const response = await fetch(`${API_URL}/balance?address=${address}`);
      const data = await response.json();
      setBalance(data.balance || 0);
      setMessage(`✅ Balance: ${data.balance || 0} AETH`);
    } catch (error) {
      setMessage('❌ Failed to get balance');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ AETHER</Text>
        <Text style={styles.subtitle}>100% Gas-Free</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Your Address</Text>
        <Text style={styles.address}>{address}</Text>
        <TouchableOpacity onPress={getBalance} style={styles.balanceBtn}>
          <Text style={styles.balanceText}>Balance: {balance} AETH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Send AETH</Text>
        <Text style={styles.gasFree}>⛽ Gas: 0 AETH (FREE!)</Text>

        <TextInput
          style={styles.input}
          placeholder="Recipient Address"
          placeholderTextColor="#6b7280"
          value={toAddress}
          onChangeText={setToAddress}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount (AETH)"
          placeholderTextColor="#6b7280"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.disabled]}
          onPress={sendTransaction}
          disabled={loading}
        >
          <Text style={styles.sendText}>
            {loading ? 'Sending...' : '🚀 Send (FREE)'}
          </Text>
        </TouchableOpacity>

        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Built to be FREE. Forever.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    padding: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e5e5e5',
  },
  subtitle: {
    fontSize: 16,
    color: '#60a5fa',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  address: {
    color: '#e5e5e5',
    fontSize: 16,
  },
  gasFree: {
    color: '#10b981',
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0a0a1f',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 6,
    padding: 10,
    color: '#e5e5e5',
    fontSize: 14,
    marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: '#60a5fa',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    color: '#10b981',
    textAlign: 'center',
  },
  balanceBtn: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderRadius: 4,
    alignItems: 'center',
  },
  balanceText: {
    color: '#60a5fa',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
  },
});

export default App;
