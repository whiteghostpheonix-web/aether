//! AETHERLANG PARSER
//! Parses tokens into AST

use super::lexer::{Lexer, Token};

#[derive(Debug, Clone)]
pub struct Contract {
    pub name: String,
    pub states: Vec<StateDecl>,
    pub functions: Vec<FunctionDecl>,
}

#[derive(Debug, Clone)]
pub struct StateDecl {
    pub name: String,
    pub var_type: Type,
    pub initial: Option<Expression>,
}

#[derive(Debug, Clone)]
pub struct FunctionDecl {
    pub name: String,
    pub is_view: bool,
    pub params: Vec<Param>,
    pub return_type: Option<Type>,
    pub body: Vec<Statement>,
}

#[derive(Debug, Clone)]
pub enum Type {
    U64, Address, Bool, String,
    Map(Box<Type>, Box<Type>),
    List(Box<Type>),
}

#[derive(Debug, Clone)]
pub enum Statement {
    Assignment { name: String, expr: Expression },
    If { condition: Expression, then_body: Vec<Statement>, else_body: Option<Vec<Statement>> },
    Return { expr: Option<Expression> },
    Emit { event: String, args: Vec<Expression> },
    Expression(Expression),
}

#[derive(Debug, Clone)]
pub enum Expression {
    Literal(Literal),
    Identifier(String),
    Binary { left: Box<Expression>, op: Operator, right: Box<Expression> },
    FunctionCall { name: String, args: Vec<Expression> },
    MethodCall { object: Box<Expression>, method: String, args: Vec<Expression> },
}

#[derive(Debug, Clone)]
pub enum Literal {
    Integer(u64), String(String), Bool(bool),
}

#[derive(Debug, Clone)]
pub enum Operator {
    Add, Sub, Mul, Div, Mod,
    Eq, Ne, Lt, Lte, Gt, Gte,
}

#[derive(Debug, Clone)]
pub struct Param {
    pub name: String,
    pub var_type: Type,
}

pub struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

impl Parser {
    pub fn new(source: &str) -> Self {
        let mut lexer = Lexer::new(source);
        let mut tokens = Vec::new();
        loop {
            let token = lexer.next_token();
            if token == Token::EOF { break; }
            tokens.push(token);
        }
        Self { tokens, pos: 0 }
    }

    pub fn parse(&mut self) -> Contract {
        self.expect(Token::Contract);
        let name = self.expect_identifier();
        self.expect(Token::LBrace);
        
        let mut states = Vec::new();
        let mut functions = Vec::new();
        
        while self.peek() != Token::RBrace && self.peek() != Token::EOF {
            match self.peek() {
                Token::Let => states.push(self.parse_state()),
                Token::Func | Token::View => functions.push(self.parse_function()),
                _ => { self.pos += 1; }
            }
        }
        
        self.expect(Token::RBrace);
        Contract { name, states, functions }
    }

    fn parse_state(&mut self) -> StateDecl {
        self.expect(Token::Let);
        let name = self.expect_identifier();
        self.expect(Token::Colon);
        let var_type = self.parse_type();
        let mut initial = None;
        if self.peek() == Token::Assign {
            self.pos += 1;
            initial = Some(self.parse_expression());
        }
        self.expect(Token::Semicolon);
        StateDecl { name, var_type, initial }
    }

    fn parse_function(&mut self) -> FunctionDecl {
        let is_view = if self.peek() == Token::View {
            self.pos += 1;
            true
        } else {
            self.expect(Token::Func);
            false
        };
        
        let name = self.expect_identifier();
        self.expect(Token::LParen);
        let mut params = Vec::new();
        
        if self.peek() != Token::RParen {
            loop {
                let param_name = self.expect_identifier();
                self.expect(Token::Colon);
                let param_type = self.parse_type();
                params.push(Param { name: param_name, var_type: param_type });
                if self.peek() != Token::Comma { break; }
                self.pos += 1;
            }
        }
        
        self.expect(Token::RParen);
        let return_type = if self.peek() == Token::Arrow {
            self.pos += 1;
            Some(self.parse_type())
        } else {
            None
        };
        
        self.expect(Token::LBrace);
        let mut body = Vec::new();
        while self.peek() != Token::RBrace && self.peek() != Token::EOF {
            body.push(self.parse_statement());
        }
        self.expect(Token::RBrace);
        
        FunctionDecl { name, is_view, params, return_type, body }
    }

    fn parse_type(&mut self) -> Type {
        match self.peek() {
            Token::U64 => { self.pos += 1; Type::U64 }
            Token::Address => { self.pos += 1; Type::Address }
            Token::Bool => { self.pos += 1; Type::Bool }
            Token::String => { self.pos += 1; Type::String }
            Token::Map => {
                self.pos += 1;
                self.expect(Token::LAngle);
                let key = self.parse_type();
                self.expect(Token::Comma);
                let value = self.parse_type();
                self.expect(Token::RAngle);
                Type::Map(Box::new(key), Box::new(value))
            }
            Token::List => {
                self.pos += 1;
                self.expect(Token::LAngle);
                let inner = self.parse_type();
                self.expect(Token::RAngle);
                Type::List(Box::new(inner))
            }
            _ => { self.pos += 1; Type::U64 }
        }
    }

    fn parse_statement(&mut self) -> Statement {
        match self.peek() {
            Token::Let => {
                self.pos += 1;
                let name = self.expect_identifier();
                self.expect(Token::Assign);
                let expr = self.parse_expression();
                self.expect(Token::Semicolon);
                Statement::Assignment { name, expr }
            }
            Token::If => {
                self.pos += 1;
                let condition = self.parse_expression();
                self.expect(Token::LBrace);
                let mut then_body = Vec::new();
                while self.peek() != Token::RBrace && self.peek() != Token::EOF {
                    then_body.push(self.parse_statement());
                }
                self.expect(Token::RBrace);
                let else_body = if self.peek() == Token::Else {
                    self.pos += 1;
                    self.expect(Token::LBrace);
                    let mut body = Vec::new();
                    while self.peek() != Token::RBrace && self.peek() != Token::EOF {
                        body.push(self.parse_statement());
                    }
                    self.expect(Token::RBrace);
                    Some(body)
                } else {
                    None
                };
                Statement::If { condition, then_body, else_body }
            }
            Token::Return => {
                self.pos += 1;
                let expr = if self.peek() != Token::Semicolon {
                    Some(self.parse_expression())
                } else {
                    None
                };
                self.expect(Token::Semicolon);
                Statement::Return { expr }
            }
            Token::Emit => {
                self.pos += 1;
                let event = self.expect_identifier();
                self.expect(Token::LParen);
                let mut args = Vec::new();
                if self.peek() != Token::RParen {
                    loop {
                        args.push(self.parse_expression());
                        if self.peek() != Token::Comma { break; }
                        self.pos += 1;
                    }
                }
                self.expect(Token::RParen);
                self.expect(Token::Semicolon);
                Statement::Emit { event, args }
            }
            _ => {
                let expr = self.parse_expression();
                self.expect(Token::Semicolon);
                Statement::Expression(expr)
            }
        }
    }

    fn parse_expression(&mut self) -> Expression {
        self.parse_binary(0)
    }

    fn parse_binary(&mut self, min_prec: u8) -> Expression {
        let mut left = self.parse_primary();
        
        while let Some(op) = self.parse_operator() {
            let prec = self.get_precedence(&op);
            if prec < min_prec { break; }
            self.pos += 1;
            let right = self.parse_binary(prec + 1);
            left = Expression::Binary { 
                left: Box::new(left), 
                op, 
                right: Box::new(right) 
            };
        }
        
        left
    }

    fn parse_primary(&mut self) -> Expression {
        match self.peek() {
            Token::Integer(n) => {
                self.pos += 1;
                Expression::Literal(Literal::Integer(n))
            }
            Token::BoolLit(b) => {
                self.pos += 1;
                Expression::Literal(Literal::Bool(b))
            }
            Token::StringLit(s) => {
                self.pos += 1;
                Expression::Literal(Literal::String(s))
            }
            Token::Identifier(name) => {
                self.pos += 1;
                if self.peek() == Token::LParen {
                    self.pos += 1;
                    let mut args = Vec::new();
                    if self.peek() != Token::RParen {
                        loop {
                            args.push(self.parse_expression());
                            if self.peek() != Token::Comma { break; }
                            self.pos += 1;
                        }
                    }
                    self.expect(Token::RParen);
                    Expression::FunctionCall { name, args }
                } else {
                    Expression::Identifier(name)
                }
            }
            Token::LParen => {
                self.pos += 1;
                let expr = self.parse_expression();
                self.expect(Token::RParen);
                expr
            }
            _ => {
                self.pos += 1;
                Expression::Literal(Literal::Integer(0))
            }
        }
    }

    fn parse_operator(&mut self) -> Option<Operator> {
        match self.peek() {
            Token::Plus => Some(Operator::Add),
            Token::Minus => Some(Operator::Sub),
            Token::Star => Some(Operator::Mul),
            Token::Slash => Some(Operator::Div),
            Token::Percent => Some(Operator::Mod),
            Token::Eq => Some(Operator::Eq),
            Token::Ne => Some(Operator::Ne),
            Token::Lt => Some(Operator::Lt),
            Token::Lte => Some(Operator::Lte),
            Token::Gt => Some(Operator::Gt),
            Token::Gte => Some(Operator::Gte),
            _ => None,
        }
    }

    fn get_precedence(&self, op: &Operator) -> u8 {
        match op {
            Operator::Eq | Operator::Ne => 1,
            Operator::Lt | Operator::Lte | Operator::Gt | Operator::Gte => 2,
            Operator::Add | Operator::Sub => 3,
            Operator::Mul | Operator::Div | Operator::Mod => 4,
        }
    }

    fn peek(&self) -> Token {
        if self.pos < self.tokens.len() {
            self.tokens[self.pos].clone()
        } else {
            Token::EOF
        }
    }

    fn expect(&mut self, expected: Token) {
        let token = self.peek();
        if token == expected {
            self.pos += 1;
        } else {
            self.pos += 1;
        }
    }

    fn expect_identifier(&mut self) -> String {
        match self.peek() {
            Token::Identifier(name) => {
                self.pos += 1;
                name
            }
            _ => {
                self.pos += 1;
                "".to_string()
            }
        }
    }
}
