//! AETHERLANG VIRTUAL MACHINE
//! Executes bytecode with 100ms timeout - NO GAS!

use std::time::{Instant, Duration};
use std::collections::HashMap;
use log::{info, debug, warn};

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

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum OpCode {
    Push(u64),
    Pop,
    Dup,
    Swap,
    Add, Sub, Mul, Div, Mod,
    Eq, Ne, Lt, Lte, Gt, Gte,
    And, Or, Not,
    Load(u16),
    Store(u16),
    LoadGlobal(u16),
    StoreGlobal(u16),
    JumpIfFalse(usize),
    JumpIfTrue(usize),
    Jump(usize),
    Call(u16),
    Return,
    Emit,
    Map,
    Reduce,
    Filter,
    Halt,
}

#[derive(Debug, Clone)]
pub struct Event {
    pub name: String,
    pub args: Vec<Value>,
}

pub struct VMConfig {
    pub max_steps: usize,
    pub timeout_ms: u64,
    pub max_memory: usize,
}

impl Default for VMConfig {
    fn default() -> Self {
        Self {
            max_steps: 1000,
            timeout_ms: 100,
            max_memory: 1024 * 1024,
        }
    }
}

pub struct VM {
    pub stack: Vec<Value>,
    pub locals: HashMap<u16, Value>,
    pub globals: HashMap<u16, Value>,
    pub pc: usize,
    pub events: Vec<Event>,
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
            events: Vec::new(),
            config,
            step_count: 0,
        }
    }

    pub fn execute(&mut self, bytecode: &[u8]) -> Result<Value, String> {
        let start = Instant::now();
        self.pc = 0;
        self.step_count = 0;

        while self.pc < bytecode.len() {
            // Check timeout (NO GAS!)
            if start.elapsed() > Duration::from_millis(self.config.timeout_ms) {
                return Err("Execution timeout".to_string());
            }

            if self.step_count > self.config.max_steps {
                return Err("Max steps exceeded".to_string());
            }

            let op = bytecode[self.pc];
            self.pc += 1;
            self.execute_op(op, bytecode)?;
            self.step_count += 1;
        }

        Ok(self.stack.pop().unwrap_or(Value::Unit))
    }

    fn execute_op(&mut self, op: u8, bytecode: &[u8]) -> Result<(), String> {
        match op {
            0x01 => { // Push
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&bytecode[self.pc..self.pc+8]);
                let val = u64::from_le_bytes(bytes);
                self.pc += 8;
                self.stack.push(Value::Integer(val));
            }
            0x02 => { self.stack.pop(); } // Pop
            0x03 => { // Dup
                let val = self.stack.last().cloned().unwrap_or(Value::Unit);
                self.stack.push(val);
            }
            0x04 => { // Swap
                let a = self.stack.pop().unwrap_or(Value::Unit);
                let b = self.stack.pop().unwrap_or(Value::Unit);
                self.stack.push(a);
                self.stack.push(b);
            }
            0x10 => { // Add
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Integer(a + b));
            }
            0x11 => { // Sub
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Integer(a - b));
            }
            0x12 => { // Mul
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Integer(a * b));
            }
            0x13 => { // Div
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                if b == 0 { return Err("Division by zero".to_string()); }
                self.stack.push(Value::Integer(a / b));
            }
            0x14 => { // Mod
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                if b == 0 { return Err("Division by zero".to_string()); }
                self.stack.push(Value::Integer(a % b));
            }
            0x20 => { // Eq
                let b = self.stack.pop().unwrap_or(Value::Unit);
                let a = self.stack.pop().unwrap_or(Value::Unit);
                self.stack.push(Value::Bool(a == b));
            }
            0x21 => { // Ne
                let b = self.stack.pop().unwrap_or(Value::Unit);
                let a = self.stack.pop().unwrap_or(Value::Unit);
                self.stack.push(Value::Bool(a != b));
            }
            0x22 => { // Lt
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Bool(a < b));
            }
            0x23 => { // Lte
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Bool(a <= b));
            }
            0x24 => { // Gt
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Bool(a > b));
            }
            0x25 => { // Gte
                let b = self.pop_int()?;
                let a = self.pop_int()?;
                self.stack.push(Value::Bool(a >= b));
            }
            0x30 => { // Load
                let mut bytes = [0u8; 2];
                bytes.copy_from_slice(&bytecode[self.pc..self.pc+2]);
                let idx = u16::from_le_bytes(bytes);
                self.pc += 2;
                let val = self.locals.get(&idx).cloned().unwrap_or(Value::Unit);
                self.stack.push(val);
            }
            0x31 => { // Store
                let mut bytes = [0u8; 2];
                bytes.copy_from_slice(&bytecode[self.pc..self.pc+2]);
                let idx = u16::from_le_bytes(bytes);
                self.pc += 2;
                let val = self.stack.pop().unwrap_or(Value::Unit);
                self.locals.insert(idx, val);
            }
            0x40 => { // JumpIfFalse
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&bytecode[self.pc..self.pc+8]);
                let target = usize::from_le_bytes(bytes);
                self.pc += 8;
                let cond = self.stack.pop().unwrap_or(Value::Bool(false));
                if let Value::Bool(false) = cond {
                    self.pc = target;
                }
            }
            0x41 => { // JumpIfTrue
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&bytecode[self.pc..self.pc+8]);
                let target = usize::from_le_bytes(bytes);
                self.pc += 8;
                let cond = self.stack.pop().unwrap_or(Value::Bool(false));
                if let Value::Bool(true) = cond {
                    self.pc = target;
                }
            }
            0x42 => { // Jump
                let mut bytes = [0u8; 8];
                bytes.copy_from_slice(&bytecode[self.pc..self.pc+8]);
                let target = usize::from_le_bytes(bytes);
                self.pc = target;
            }
            0x50 => { return Ok(()); } // Return
            0x60 => { // Emit
                let name = self.stack.pop().unwrap_or(Value::String("".to_string()));
                let args = Vec::new();
                self.events.push(Event {
                    name: match name {
                        Value::String(s) => s,
                        _ => "".to_string(),
                    },
                    args,
                });
            }
            0x70 => { // Map (built-in, NOT a loop)
                // Placeholder
            }
            0xFF => { return Ok(()); } // Halt
            _ => { return Err(format!("Invalid opcode: {}", op)); }
        }
        Ok(())
    }

    fn pop_int(&mut self) -> Result<u64, String> {
        match self.stack.pop() {
            Some(Value::Integer(val)) => Ok(val),
            _ => Err("Type mismatch: expected integer".to_string()),
        }
    }
}
