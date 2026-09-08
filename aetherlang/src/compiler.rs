//! AETHERLANG COMPILER
//! Generates bytecode from AST

use super::parser::{Contract, FunctionDecl, Statement, Expression, Type, Operator, Literal};

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
        
        self.bytecode.push(0xFF); // Halt
        self.bytecode.clone()
    }

    fn compile_function(&mut self, function: &FunctionDecl) {
        // Function header
        for statement in &function.body {
            self.compile_statement(statement);
        }
        self.bytecode.push(0x50); // Return
    }

    fn compile_statement(&mut self, statement: &Statement) {
        match statement {
            Statement::Assignment { name, expr } => {
                self.compile_expression(expr);
                self.bytecode.push(0x31); // Store
                // Store variable index would go here
            }
            Statement::If { condition, then_body, else_body } => {
                self.compile_expression(condition);
                let jump_pos = self.bytecode.len();
                self.bytecode.push(0x40); // JumpIfFalse
                self.bytecode.extend_from_slice(&[0u8; 8]);
                
                for stmt in then_body {
                    self.compile_statement(stmt);
                }
                
                let else_pos = self.bytecode.len();
                self.bytecode.push(0x42); // Jump
                self.bytecode.extend_from_slice(&[0u8; 8]);
                
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
                }
                self.bytecode.push(0x50);
            }
            Statement::Emit { event, args } => {
                for arg in args {
                    self.compile_expression(arg);
                }
                self.bytecode.push(0x60); // Emit
            }
            Statement::Expression(expr) => {
                self.compile_expression(expr);
                self.bytecode.push(0x02); // Pop
            }
        }
    }

    fn compile_expression(&mut self, expr: &Expression) {
        match expr {
            Expression::Literal(lit) => {
                self.bytecode.push(0x01);
                let value = match lit {
                    Literal::Integer(n) => *n,
                    Literal::Bool(b) => if *b { 1 } else { 0 },
                    Literal::String(s) => s.len() as u64,
                };
                self.bytecode.extend_from_slice(&value.to_le_bytes());
            }
            Expression::Identifier(name) => {
                self.bytecode.push(0x30);
                self.bytecode.extend_from_slice(&0u16.to_le_bytes());
            }
            Expression::Binary { left, op, right } => {
                self.compile_expression(left);
                self.compile_expression(right);
                let op_byte = match op {
                    Operator::Add => 0x10,
                    Operator::Sub => 0x11,
                    Operator::Mul => 0x12,
                    Operator::Div => 0x13,
                    Operator::Mod => 0x14,
                    Operator::Eq => 0x20,
                    Operator::Ne => 0x21,
                    Operator::Lt => 0x22,
                    Operator::Lte => 0x23,
                    Operator::Gt => 0x24,
                    Operator::Gte => 0x25,
                };
                self.bytecode.push(op_byte);
            }
            Expression::FunctionCall { name, args } => {
                for arg in args {
                    self.compile_expression(arg);
                }
                self.bytecode.push(0x50);
            }
            Expression::MethodCall { object, method, args } => {
                self.compile_expression(object);
                for arg in args {
                    self.compile_expression(arg);
                }
                self.bytecode.push(0x50);
            }
        }
    }
}
