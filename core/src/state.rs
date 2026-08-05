use std::collections::HashMap;
use crate::types::Address;
use crate::transaction::Transaction;

#[derive(Debug, Clone)]
pub struct State {
    pub balances: HashMap<Address, u64>,
    pub nonces: HashMap<Address, u64>,
    pub daily_usage: HashMap<Address, u64>,
    pub last_reset: u64,
}

impl State {
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
            nonces: HashMap::new(),
            daily_usage: HashMap::new(),
            last_reset: 0,
        }
    }

    pub fn apply_transfer(&mut self, tx: &Transaction) -> Result<(), String> {
        let from_balance = self.balances.get(&tx.from).unwrap_or(&0);
        let to_balance = self.balances.get(&tx.to).unwrap_or(&0);

        if *from_balance < tx.amount {
            return Err("Insufficient balance".to_string());
        }

        self.balances.insert(tx.from, from_balance - tx.amount);
        self.balances.insert(tx.to, to_balance + tx.amount);
        Ok(())
    }

    pub fn get_balance(&self, address: &Address) -> u64 {
        *self.balances.get(address).unwrap_or(&0)
    }

    pub fn increment_nonce(&mut self, address: &Address) {
        let nonce = self.nonces.entry(*address).or_insert(0);
        *nonce += 1;
    }

    pub fn check_daily_quota(&self, address: &Address) -> bool {
        let usage = self.daily_usage.get(address).unwrap_or(&0);
        *usage < 1000 // 1000 free transactions per day
    }

    pub fn increment_daily_usage(&mut self, address: &Address) {
        let usage = self.daily_usage.entry(*address).or_insert(0);
        *usage += 1;
    }
}
