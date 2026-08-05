use std::collections::HashMap;
use log::{info, warn, debug};
use crate::transaction::{Transaction, Block, BlockHeader};
use crate::state::State;
use crate::types::{Address, Hash};
use crate::state::State;

pub struct ChainConfig {
    pub block_time: u64,
    pub tx_timeout: u64,
    pub daily_quota: u64,
    pub max_block_size: usize,
    pub inflation_rate: f64,
}

impl Default for ChainConfig {
    fn default() -> Self {
        Self {
            block_time: 1,
            tx_timeout: 100,
            daily_quota: 1000,
            max_block_size: 10000,
            inflation_rate: 0.02,
        }
    }
}

pub struct Blockchain {
    pub chain: Vec<Block>,
    pub state: State,
    pub pending_transactions: Vec<Transaction>,
    pub config: ChainConfig,
    pub validators: HashMap<Address, u64>,
}

impl Blockchain {
    pub fn new(config: ChainConfig) -> Self {
        let genesis = Self::create_genesis_block();
        Self {
            chain: vec![genesis],
            state: State::new(),
            pending_transactions: Vec::new(),
            config,
            validators: HashMap::new(),
        }
    }

    pub fn create_genesis_block() -> Block {
        Block {
            header: BlockHeader {
                version: 1,
                previous_hash: [0u8; 32],
                merkle_root: [0u8; 32],
                timestamp: 0,
                block_number: 0,
                validator: [0u8; 32],
            },
            transactions: vec![],
        }
    }

    pub fn submit_transaction(&mut self, tx: Transaction) -> Result<Hash, String> {
        // 1. Verify signature
        if !tx.verify(&tx.from) {
            return Err("Invalid signature".to_string());
        }

        // 2. Check nonce
        let expected_nonce = self.state.nonces.get(&tx.from).unwrap_or(&0);
        if tx.nonce != *expected_nonce {
            return Err(format!("Invalid nonce: expected {}, got {}", expected_nonce, tx.nonce));
        }

        // 3. Check daily quota (NO GAS!)
        if !self.state.check_daily_quota(&tx.from) {
            return Err("Daily quota exceeded (1000 free transactions)".to_string());
        }

        // 4. Add to pending
        let tx_hash = tx.hash();
        self.pending_transactions.push(tx);
        info!("✅ Transaction added: {}", hex::encode(&tx_hash));

        Ok(tx_hash)
    }

    pub fn produce_block(&mut self, validator: Address) -> Block {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let transactions: Vec<Transaction> = self.pending_transactions
            .drain(..)
            .take(self.config.max_block_size)
            .collect();

        // Apply transactions to state
        for tx in &transactions {
            if tx.is_transfer() {
                if let Err(e) = self.state.apply_transfer(tx) {
                    warn!("Transaction failed: {}", e);
                    continue;
                }
                self.state.increment_nonce(&tx.from);
                self.state.increment_daily_usage(&tx.from);
            }
        }

        let block = Block {
            header: BlockHeader {
                version: 1,
                previous_hash: self.chain.last().unwrap().header.hash(),
                merkle_root: self.calculate_merkle_root(&transactions),
                timestamp: now,
                block_number: self.chain.len() as u64,
                validator,
            },
            transactions,
        };

        info!("⛓️ Block #{} produced by validator", block.header.block_number);
        block
    }

    pub fn add_block(&mut self, block: Block) -> Result<(), String> {
        // Verify block
        self.verify_block(&block)?;
        self.chain.push(block);
        info!("📦 Block #{} added to chain", self.chain.len() - 1);
        Ok(())
    }

    fn verify_block(&self, block: &Block) -> Result<(), String> {
        // Check previous hash
        let last_hash = self.chain.last().unwrap().header.hash();
        if block.header.previous_hash != last_hash {
            return Err("Invalid previous hash".to_string());
        }

        // Check merkle root
        let calculated_root = self.calculate_merkle_root(&block.transactions);
        if block.header.merkle_root != calculated_root {
            return Err("Invalid merkle root".to_string());
        }

        Ok(())
    }

    fn calculate_merkle_root(&self, transactions: &[Transaction]) -> Hash {
        if transactions.is_empty() {
            return [0u8; 32];
        }
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        for tx in transactions {
            hasher.update(tx.hash());
        }
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    pub fn get_balance(&self, address: &Address) -> u64 {
        self.state.get_balance(address)
    }

    pub fn get_block_count(&self) -> u64 {
        self.chain.len() as u64
    }

    pub fn get_last_block(&self) -> &Block {
        self.chain.last().unwrap()
    }
}
