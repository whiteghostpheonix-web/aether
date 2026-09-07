use serde::{Deserialize, Serialize};
use crate::types::{Address, Hash, Signature, hash_bytes};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub from: Address,
    pub to: Address,
    pub amount: u64,
    #[serde(default)]
    pub data: Vec<u8>,
    pub nonce: u64,
    pub signature: Signature,
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
            signature: Signature([0u8; 64]),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    pub fn hash(&self) -> Hash {
        let mut data = Vec::new();
        data.extend_from_slice(&self.from);
        data.extend_from_slice(&self.to);
        data.extend_from_slice(&self.amount.to_le_bytes());
        data.extend_from_slice(&self.nonce.to_le_bytes());
        data.extend_from_slice(&self.data);
        hash_bytes(&data)
    }

    pub fn sign(&mut self, _keypair: &[u8; 32]) {}
    pub fn verify(&self, _public_key: &[u8; 32]) -> bool { true }
    pub fn is_transfer(&self) -> bool { self.data.is_empty() }
    pub fn is_contract_call(&self) -> bool { !self.data.is_empty() }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockHeader {
    pub version: u32,
    pub previous_hash: Hash,
    pub merkle_root: Hash,
    pub timestamp: u64,
    pub block_number: u64,
    pub validator: Address,
}

impl BlockHeader {
    pub fn hash(&self) -> Hash {
        let mut data = Vec::new();
        data.extend_from_slice(&self.version.to_le_bytes());
        data.extend_from_slice(&self.previous_hash);
        data.extend_from_slice(&self.merkle_root);
        data.extend_from_slice(&self.timestamp.to_le_bytes());
        data.extend_from_slice(&self.block_number.to_le_bytes());
        data.extend_from_slice(&self.validator);
        hash_bytes(&data)
    }
}
