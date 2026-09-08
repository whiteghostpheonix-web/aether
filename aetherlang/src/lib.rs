//! AETHERLANG - Gas-Free Smart Contract Language
//! No loops, No recursion, Fixed execution time

pub mod lexer;
pub mod parser;
pub mod compiler;
pub mod vm;
pub mod stdlib;

pub use lexer::Lexer;
pub use parser::Parser;
pub use compiler::Compiler;
pub use vm::VM;
pub use vm::VMConfig;
pub use vm::Value;
