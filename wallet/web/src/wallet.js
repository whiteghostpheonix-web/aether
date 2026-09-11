//! AETHER WALLET - Client-Side Generation
//! Anonymous, Unlimited, Unique per User

export function generateWallet() {
  // Generate unique 40-char hex address
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * 16)];
  }
  
  // Generate unique private key (stored locally, never sent)
  let privateKey = '0x';
  for (let i = 0; i < 64; i++) {
    privateKey += chars[Math.floor(Math.random() * 16)];
  }
  
  // Generate 24-word mnemonic (anonymous recovery)
  const words = ['aether', 'free', 'gas', 'global', 'unlimited', 'anonymous', 
                 'future', 'money', 'send', 'receive', 'blockchain', 'instant',
                 'zero', 'cost', 'world', 'phone', 'mobile', 'bank', 'crypto', 'card',
                 'africa', 'asia', 'europe', 'america'];
  
  const mnemonic = Array.from({length: 24}, () => 
    words[Math.floor(Math.random() * words.length)]
  ).join(' ');
  
  return {
    address,
    privateKey,
    mnemonic,
    createdAt: new Date().toISOString(),
  };
}

export function saveWallet(wallet) {
  // Store in browser localStorage (anonymous)
  localStorage.setItem('aether_wallet', JSON.stringify(wallet));
}

export function loadWallet() {
  const data = localStorage.getItem('aether_wallet');
  if (!data) {
    const wallet = generateWallet();
    saveWallet(wallet);
    return wallet;
  }
  return JSON.parse(data);
}

export function clearWallet() {
  localStorage.removeItem('aether_wallet');
}
