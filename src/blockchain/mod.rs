use std::collections::HashMap;
use sha2::{Sha256, Digest};
use std::time::{SystemTime, UNIX_EPOCH};

pub type Hash = [u8; 32];
pub type Address = [u8; 32];

#[derive(Debug, Clone)]
pub struct Transaction {
    pub from: Address,
    pub to: Address,
    pub amount: u64,
    pub data: Vec<u8>,
    pub nonce: u64,
    pub timestamp: u64,
}

impl Transaction {
    pub fn new(from: Address, to: Address, amount: u64) -> Self {
        Self {
            from,
            to,
            amount,
            data: vec![],
            nonce: 0,
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    pub fn hash(&self) -> Hash {
        let mut hasher = Sha256::new();
        hasher.update(&self.from);
        hasher.update(&self.to);
        hasher.update(&self.amount.to_le_bytes());
        hasher.update(&self.nonce.to_le_bytes());
        hasher.update(&self.data);
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }
}

#[derive(Debug, Clone)]
pub struct Block {
    pub version: u32,
    pub previous_hash: Hash,
    pub merkle_root: Hash,
    pub timestamp: u64,
    pub block_number: u64,
    pub validator: Address,
    pub transactions: Vec<Transaction>,
}

impl Block {
    pub fn hash(&self) -> Hash {
        let mut hasher = Sha256::new();
        hasher.update(&self.version.to_le_bytes());
        hasher.update(&self.previous_hash);
        hasher.update(&self.merkle_root);
        hasher.update(&self.timestamp.to_le_bytes());
        hasher.update(&self.block_number.to_le_bytes());
        hasher.update(&self.validator);
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }
}

pub struct Blockchain {
    pub chain: Vec<Block>,
    pub pending_transactions: Vec<Transaction>,
}

impl Blockchain {
    pub fn new() -> Self {
        Self {
            chain: vec![],
            pending_transactions: vec![],
        }
    }

    pub fn create_genesis(&mut self, validator: Address) -> Block {
        let block = Block {
            version: 1,
            previous_hash: [0u8; 32],
            merkle_root: [0u8; 32],
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            block_number: 0,
            validator,
            transactions: vec![],
        };
        self.chain.push(block.clone());
        block
    }
}
