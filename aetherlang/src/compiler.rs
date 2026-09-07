//! AETHERLANG COMPILER

use super::parser::{Contract, FunctionDecl, Statement, Expression, Type};

pub struct Compiler {
    pub bytecode: Vec<u8>,
}

impl Compiler {
    pub fn new() -> Self {
        Self { bytecode: Vec::new() }
    }

    pub fn compile(&mut self, contract: &Contract) -> Vec<u8> {
        self.bytecode.clear();
        
        for function in &contract.functions {
            self.compile_function(function);
        }
        
        self.bytecode.push(0xFF);
        self.bytecode.clone()
    }

    fn compile_function(&mut self, function: &FunctionDecl) {
        for statement in &function.body {
            self.compile_statement(statement);
        }
        self.bytecode.push(0x50); // Return
    }

    fn compile_statement(&mut self, statement: &Statement) {
        match statement {
            Statement::Assignment { name: _, expr } => {
                self.compile_expression(expr);
                self.bytecode.push(0x31);
                self.bytecode.extend_from_slice(&0u16.to_le_bytes());
            }
            Statement::If { condition, then_body, else_body } => {
                self.compile_expression(condition);
                let jump_pos = self.bytecode.len();
                self.bytecode.push(0x40);
                self.bytecode.extend_from_slice(&0usize.to_le_bytes());
                
                for stmt in then_body {
                    self.compile_statement(stmt);
                }
                
                let else_pos = self.bytecode.len();
                self.bytecode.push(0x42);
                self.bytecode.extend_from_slice(&0usize.to_le_bytes());
                
                let end_pos = self.bytecode.len();
                let offset = (end_pos - jump_pos - 9) as u64;
                self.bytecode[jump_pos+1..jump_pos+9].copy_from_slice(&offset.to_le_bytes());
                
                if let Some(body) = else_body {
                    for stmt in body {
                        self.compile_statement(stmt);
                    }
                }
                
                let end_pos2 = self.bytecode.len();
                let offset2 = (end_pos2 - else_pos - 9) as u64;
                self.bytecode[else_pos+1..else_pos+9].copy_from_slice(&offset2.to_le_bytes());
            }
            Statement::Return { expr } => {
                if let Some(e) = expr {
                    self.compile_expression(e);
                } else {
                    self.bytecode.push(0x01);
                    self.bytecode.extend_from_slice(&0u64.to_le_bytes());
                }
                self.bytecode.push(0x50);
            }
            Statement::Emit { event: _, args } => {
                for arg in args {
                    self.compile_expression(arg);
                }
                self.bytecode.push(0x60);
            }
            Statement::Expression(expr) => {
                self.compile_expression(expr);
                self.bytecode.push(0x02);
            }
        }
    }

    fn compile_expression(&mut self, expr: &Expression) {
        match expr {
            Expression::Literal(lit) => {
                self.bytecode.push(0x01);
                let value = match lit {
                    super::parser::Literal::Integer(n) => *n,
                    super::parser::Literal::Bool(b) => if *b { 1 } else { 0 },
                    super::parser::Literal::String(s) => s.len() as u64,
                };
                self.bytecode.extend_from_slice(&value.to_le_bytes());
            }
            Expression::Identifier(_) => {
                self.bytecode.push(0x30);
                self.bytecode.extend_from_slice(&0u16.to_le_bytes());
            }
            Expression::Binary { left, op, right } => {
                self.compile_expression(left);
                self.compile_expression(right);
                let op_byte = match op {
                    super::parser::Operator::Add => 0x10,
                    super::parser::Operator::Sub => 0x11,
                    super::parser::Operator::Mul => 0x12,
                    super::parser::Operator::Div => 0x13,
                    super::parser::Operator::Mod => 0x14,
                    super::parser::Operator::Eq => 0x20,
                    super::parser::Operator::Ne => 0x21,
                    super::parser::Operator::Lt => 0x22,
                    super::parser::Operator::Lte => 0x23,
                    super::parser::Operator::Gt => 0x24,
                    super::parser::Operator::Gte => 0x25,
                };
                self.bytecode.push(op_byte);
            }
            Expression::FunctionCall { name: _, args } => {
                for arg in args {
                    self.compile_expression(arg);
                }
                self.bytecode.push(0x50);
            }
        }
    }
}
