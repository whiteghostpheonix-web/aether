use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

pub type Address = [u8; 32];
pub type Hash = [u8; 32];
pub type Signature = [u8; 64];

pub fn hash_bytes(data: &[u8]) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

pub fn hex_encode(data: &[u8]) -> String {
    hex::encode(data)
}

pub fn hex_decode(data: &str) -> Result<Vec<u8>, hex::FromHexError> {
    hex::decode(data)
}
