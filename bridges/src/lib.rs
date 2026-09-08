//! AETHER BRIDGES
//! Mobile Money, Banking, Crypto, Cards

pub mod mpesa;
pub mod mtn;
pub mod bank;
pub mod crypto;
pub mod cards;

pub use mpesa::MpesaBridge;
pub use mtn::MTNBridge;
