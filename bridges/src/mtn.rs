//! MTN MOBILE MONEY BRIDGE
//! Uganda, Ghana, Rwanda

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MTNPayment {
    pub phone: String,
    pub amount: u64,
    pub reference: String,
}

pub struct MTNBridge {
    api_key: String,
    api_secret: String,
    merchant_code: String,
}

impl MTNBridge {
    pub fn new(api_key: String, api_secret: String, merchant_code: String) -> Self {
        Self { api_key, api_secret, merchant_code }
    }

    pub async fn send_payment(&self, phone: &str, amount: u64) -> Result<String, String> {
        Ok(format!("MTN_{}_{}", phone, amount))
    }

    pub async fn deposit_to_aether(&self, phone: &str, amount: u64) -> Result<String, String> {
        Ok(format!("DEPOSIT_MTN_{}_{}", phone, amount))
    }
}
