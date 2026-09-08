//! CARDS BRIDGE
//! Visa, Mastercard

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardPayment {
    pub card_number: String,
    pub expiry: String,
    pub cvv: String,
    pub amount: u64,
}

pub struct CardsBridge {
    api_key: String,
}

impl CardsBridge {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    pub async fn process_payment(&self, payment: &CardPayment) -> Result<String, String> {
        Ok(format!("CARD_PAYMENT_{}_{}", payment.card_number, payment.amount))
    }
}
