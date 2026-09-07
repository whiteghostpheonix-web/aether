//! AETHERLANG LEXER
//! Tokenizes source code

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Keywords
    Contract, Func, Let, If, Else, Return, Emit, View, Constructor,
    // Types
    U64, Address, Bool, String, Map, List,
    // Operators
    Plus, Minus, Star, Slash, Percent,
    Eq, Ne, Lt, Lte, Gt, Gte,
    And, Or, Not,
    Assign, Arrow, Colon, Semicolon, Comma, Dot,
    // Delimiters
    LParen, RParen, LBrace, RBrace, LBracket, RBracket,
    LAngle, RAngle,
    // Literals
    Integer(u64), StringLit(String), BoolLit(bool), AddressLit(String),
    Identifier(String),
    // Special
    EOF,
}

pub struct Lexer {
    source: String,
    chars: Vec<char>,
    pos: usize,
}

impl Lexer {
    pub fn new(source: &str) -> Self {
        Self {
            source: source.to_string(),
            chars: source.chars().collect(),
            pos: 0,
        }
    }

    pub fn next_token(&mut self) -> Token {
        self.skip_whitespace();
        
        if self.pos >= self.chars.len() {
            return Token::EOF;
        }

        let ch = self.chars[self.pos];
        
        match ch {
            '+' => { self.pos += 1; Token::Plus }
            '-' => { self.pos += 1; Token::Minus }
            '*' => { self.pos += 1; Token::Star }
            '/' => { self.pos += 1; Token::Slash }
            '%' => { self.pos += 1; Token::Percent }
            '(' => { self.pos += 1; Token::LParen }
            ')' => { self.pos += 1; Token::RParen }
            '{' => { self.pos += 1; Token::LBrace }
            '}' => { self.pos += 1; Token::RBrace }
            '[' => { self.pos += 1; Token::LBracket }
            ']' => { self.pos += 1; Token::RBracket }
            '<' => { self.pos += 1; Token::LAngle }
            '>' => { self.pos += 1; Token::RAngle }
            ':' => { self.pos += 1; Token::Colon }
            ';' => { self.pos += 1; Token::Semicolon }
            ',' => { self.pos += 1; Token::Comma }
            '.' => { self.pos += 1; Token::Dot }
            '=' => {
                self.pos += 1;
                if self.peek() == '=' {
                    self.pos += 1;
                    Token::Eq
                } else {
                    Token::Assign
                }
            }
            '!' => {
                self.pos += 1;
                if self.peek() == '=' {
                    self.pos += 1;
                    Token::Ne
                } else {
                    Token::Not
                }
            }
            '0'..='9' => self.read_number(),
            '"' => self.read_string(),
            'a'..='z' | 'A'..='Z' | '_' => self.read_identifier(),
            _ => {
                self.pos += 1;
                Token::EOF
            }
        }
    }

    fn peek(&self) -> char {
        if self.pos + 1 < self.chars.len() {
            self.chars[self.pos + 1]
        } else {
            '\0'
        }
    }

    fn skip_whitespace(&mut self) {
        while self.pos < self.chars.len() {
            match self.chars[self.pos] {
                ' ' | '\t' | '\n' | '\r' => self.pos += 1,
                _ => break,
            }
        }
    }

    fn read_number(&mut self) -> Token {
        let start = self.pos;
        while self.pos < self.chars.len() && self.chars[self.pos].is_ascii_digit() {
            self.pos += 1;
        }
        let num_str: String = self.chars[start..self.pos].iter().collect();
        let num = num_str.parse::<u64>().unwrap_or(0);
        Token::Integer(num)
    }

    fn read_string(&mut self) -> Token {
        self.pos += 1;
        let start = self.pos;
        while self.pos < self.chars.len() && self.chars[self.pos] != '"' {
            self.pos += 1;
        }
        let str_val: String = self.chars[start..self.pos].iter().collect();
        self.pos += 1;
        Token::StringLit(str_val)
    }

    fn read_identifier(&mut self) -> Token {
        let start = self.pos;
        while self.pos < self.chars.len() && 
              (self.chars[self.pos].is_ascii_alphanumeric() || self.chars[self.pos] == '_') {
            self.pos += 1;
        }
        let ident: String = self.chars[start..self.pos].iter().collect();
        
        match ident.as_str() {
            "contract" => Token::Contract,
            "func" => Token::Func,
            "let" => Token::Let,
            "if" => Token::If,
            "else" => Token::Else,
            "return" => Token::Return,
            "emit" => Token::Emit,
            "view" => Token::View,
            "constructor" => Token::Constructor,
            "u64" => Token::U64,
            "Address" => Token::Address,
            "bool" => Token::Bool,
            "String" => Token::String,
            "Map" => Token::Map,
            "List" => Token::List,
            "true" => Token::BoolLit(true),
            "false" => Token::BoolLit(false),
            _ => Token::Identifier(ident),
        }
    }
}
