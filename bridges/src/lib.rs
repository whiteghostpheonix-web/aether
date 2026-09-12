//! AETHER BRIDGES
//! Mobile Money, Banking, Crypto, Cards, USSD

pub mod mpesa;
pub mod mtn;
pub mod bank;
pub mod crypto;
pub mod cards;
pub mod ussd;

pub use mpesa::MpesaBridge;
pub use mtn::MTNBridge;
pub use bank::BankBridge;
pub use crypto::CryptoBridge;
pub use cards::CardsBridge;
pub use ussd::USSDService;
pub use ussd::USSDRequest;
pub use ussd::USSDResponse;
pub use ussd::handle_ussd_request;
