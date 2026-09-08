//! BANKING BRIDGES
//! SWIFT, ACH, SEPA

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankAccount {
    pub account_number: String,
    pub routing_number: String,
    pub bank_name: String,
    pub country: String,
    pub swift_code: String,
    pub iban: String,
}

#[derive(Debug, Clone)]
pub enum BankSystem {
    SWIFT,
    ACH,
    SEPA,
    FasterPayments,
}

pub struct BankBridge {
    api_key: String,
}

impl BankBridge {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    pub async fn deposit(&self, account: &BankAccount, amount: u64) -> Result<String, String> {
        Ok(format!("BANK_DEPOSIT_{}_{}", account.account_number, amount))
    }

    pub async fn withdraw(&self, account: &BankAccount, amount: u64) -> Result<String, String> {
        Ok(format!("BANK_WITHDRAW_{}_{}", account.account_number, amount))
    }
}
