//! AETHERLANG VIRTUAL MACHINE
//! No gas, 100ms timeout

use std::time::{Instant, Duration};
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Integer(u64),
    Bool(bool),
    String(String),
    Address([u8; 32]),
    List(Vec<Value>),
    Map(HashMap<String, Value>),
    Unit,
}

pub struct VMConfig {
    pub max_steps: usize,
    pub timeout_ms: u64,
}

impl Default for VMConfig {
    fn default() -> Self {
        Self { max_steps: 1000, timeout_ms: 100 }
    }
}

pub struct VM {
    pub stack: Vec<Value>,
    pub locals: HashMap<u16, Value>,
    pub globals: HashMap<u16, Value>,
    pub pc: usize,
    pub config: VMConfig,
    pub step_count: usize,
}

impl VM {
    pub fn new(config: VMConfig) -> Self {
        Self {
            stack: Vec::new(),
            locals: HashMap::new(),
            globals: HashMap::new(),
            pc: 0,
            config,
            step_count: 0,
        }
    }

    pub fn execute(&mut self, bytecode: &[u8]) -> Result<Value, String> {
        let start = Instant::now();
        self.pc = 0;
        self.step_count = 0;

        while self.pc < bytecode.len() {
            if start.elapsed() > Duration::from_millis(self.config.timeout_ms) {
                return Err("Execution timeout".to_string());
            }
            if self.step_count > self.config.max_steps {
                return Err("Max steps exceeded".to_string());
            }
            // Execute opcode...
            self.step_count += 1;
        }

        Ok(self.stack.pop().unwrap_or(Value::Unit))
    }
}
