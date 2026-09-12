-- ============================================================
-- AETHER D1 DATABASE SCHEMA
-- 100% Gas-Free Blockchain
-- ============================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT UNIQUE NOT NULL,
  identity_hash TEXT UNIQUE,
  trust_score INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  verification_method TEXT,
  biometric_hash TEXT,
  imei TEXT,
  iccid TEXT,
  network TEXT,
  country TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_seen INTEGER DEFAULT (strftime('%s', 'now')),
  status TEXT DEFAULT 'active'
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  address TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 1000,
  daily_quota INTEGER DEFAULT 1000,
  used_today INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_received INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'AETH',
  gas INTEGER DEFAULT 0,
  fee INTEGER DEFAULT 0,
  status TEXT DEFAULT 'confirmed',
  method TEXT DEFAULT 'web',
  tx_hash TEXT UNIQUE,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  device TEXT,
  ip TEXT,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
