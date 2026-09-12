//! USSD BRIDGE
//! Unstructured Supplementary Service Data
//! For mobile banking and payments

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct USSDRequest {
    pub session_id: String,
    pub phone: String,
    pub input: String,
    pub network: USSDNetwork,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum USSDNetwork {
    Safaricom,
    MTN,
    Airtel,
    Orange,
    Vodafone,
    Tigo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct USSDResponse {
    pub message: String,
    pub next_step: USSDStep,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum USSDStep {
    End,
    Continue,
    Menu,
}

pub struct USSDService {
    sessions: std::collections::HashMap<String, USSDState>,
}

#[derive(Debug, Clone)]
pub struct USSDState {
    pub phone: String,
    pub step: usize,
    pub data: std::collections::HashMap<String, String>,
}

impl USSDService {
    pub fn new() -> Self {
        Self {
            sessions: std::collections::HashMap::new(),
        }
    }

    pub fn process_request(&mut self, request: USSDRequest) -> USSDResponse {
        let session_id = request.session_id.clone();
        let state = self.sessions.entry(session_id).or_insert(USSDState {
            phone: request.phone.clone(),
            step: 0,
            data: std::collections::HashMap::new(),
        });

        let input = request.input.trim();
        
        // Main menu
        if state.step == 0 {
            state.step = 1;
            return USSDResponse {
                message: format!(
                    "🌍 AETHER USSD\n\
                    1. Send Money\n\
                    2. Check Balance\n\
                    3. Buy Aether\n\
                    4. My Wallet\n\
                    5. Help\n\
                    0. Exit"
                ),
                next_step: USSDStep::Menu,
            };
        }

        // Handle menu selection
        if input == "0" {
            self.sessions.remove(&request.session_id);
            return USSDResponse {
                message: "✅ Thank you for using Aether USSD!".to_string(),
                next_step: USSDStep::End,
            };
        }

        match input {
            "1" => self.handle_send_money(&request, state),
            "2" => self.handle_check_balance(&request, state),
            "3" => self.handle_buy_aether(&request, state),
            "4" => self.handle_my_wallet(&request, state),
            "5" => self.handle_help(),
            _ => {
                state.step = 0;
                USSDResponse {
                    message: "❌ Invalid option. Please try again.".to_string(),
                    next_step: USSDStep::Continue,
                }
            }
        }
    }

    fn handle_send_money(&self, _request: &USSDRequest, state: &mut USSDState) -> USSDResponse {
        if state.step == 1 {
            state.step = 2;
            return USSDResponse {
                message: "📱 Enter recipient phone number:".to_string(),
                next_step: USSDStep::Continue,
            };
        }

        if state.step == 2 {
            state.data.insert("recipient".to_string(), _request.input.clone());
            state.step = 3;
            return USSDResponse {
                message: "💰 Enter amount (KES):".to_string(),
                next_step: USSDStep::Continue,
            };
        }

        if state.step == 3 {
            let amount = _request.input.parse::<u64>().unwrap_or(0);
            let recipient = state.data.get("recipient").unwrap_or(&"".to_string());
            
            // Send via Aether
            let response = format!(
                "✅ Sending {} KES to {}\n\
                ⛽ Gas: 0 AETH (FREE!)\n\
                🔗 TX: 0x{}\n\
                1. Main Menu\n\
                0. Exit",
                amount,
                recipient,
                hex::encode(&[0u8; 16])
            );
            
            state.step = 0;
            return USSDResponse {
                message: response,
                next_step: USSDStep::Menu,
            };
        }

        state.step = 0;
        USSDResponse {
            message: "❌ Session expired. Please start again.".to_string(),
            next_step: USSDStep::End,
        }
    }

    fn handle_check_balance(&self, _request: &USSDRequest, state: &mut USSDState) -> USSDResponse {
        // Get balance from Aether
        let balance = 1234;
        
        state.step = 0;
        USSDResponse {
            message: format!(
                "💰 AETHER BALANCE\n\
                Balance: {} AETH\n\
                ⛽ Gas: 0 AETH (FREE!)\n\
                \n\
                1. Main Menu\n\
                0. Exit",
                balance
            ),
            next_step: USSDStep::Menu,
        }
    }

    fn handle_buy_aether(&self, _request: &USSDRequest, state: &mut USSDState) -> USSDResponse {
        if state.step == 1 {
            state.step = 2;
            return USSDResponse {
                message: "💰 Enter amount (KES):".to_string(),
                next_step: USSDStep::Continue,
            };
        }

        if state.step == 2 {
            let amount = _request.input.parse::<u64>().unwrap_or(0);
            let aeth = amount / 100; // Mock rate: 100 KES = 1 AETH
            
            state.step = 0;
            return USSDResponse {
                message: format!(
                    "✅ BOUGHT {} AETH\n\
                    Amount: {} KES\n\
                    ⛽ Gas: 0 AETH (FREE!)\n\
                    \n\
                    1. Main Menu\n\
                    0. Exit",
                    aeth, amount
                ),
                next_step: USSDStep::Menu,
            };
        }

        state.step = 1;
        USSDResponse {
            message: "💰 Enter amount to buy AETH:".to_string(),
            next_step: USSDStep::Continue,
        }
    }

    fn handle_my_wallet(&self, _request: &USSDRequest, state: &mut USSDState) -> USSDResponse {
        state.step = 0;
        USSDResponse {
            message: format!(
                "👛 MY WALLET\n\
                Address: 0x{}...\n\
                Balance: 1,234 AETH\n\
                ⛽ Gas: 0 AETH (FREE!)\n\
                TX: 42 transactions\n\
                \n\
                1. Main Menu\n\
                0. Exit",
                hex::encode(&[0u8; 8])
            ),
            next_step: USSDStep::Menu,
        }
    }

    fn handle_help(&self) -> USSDResponse {
        USSDResponse {
            message: format!(
                "🆘 AETHER HELP\n\
                Send money with 0 gas!\n\
                \n\
                * Send: 1\n\
                * Balance: 2\n\
                * Buy: 3\n\
                * Wallet: 4\n\
                \n\
                💡 USSD: *384*9999#\n\
                🌐 Web: aether.io\n\
                📱 App: Aether Wallet\n\
                \n\
                1. Main Menu\n\
                0. Exit"
            ),
            next_step: USSDStep::Menu,
        }
    }
}

// ─── USSD API ROUTE ──────────────────────────────────────────
pub async fn handle_ussd_request(req: USSDRequest) -> USSDResponse {
    let mut service = USSDService::new();
    service.process_request(req)
}
