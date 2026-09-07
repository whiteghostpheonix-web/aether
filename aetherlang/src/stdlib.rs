//! AETHERLANG STANDARD LIBRARY

pub fn saturating_add(a: u64, b: u64) -> u64 {
    a.saturating_add(b)
}

pub fn saturating_mul(a: u64, b: u64) -> u64 {
    a.saturating_mul(b)
}

pub fn min(a: u64, b: u64) -> u64 {
    if a < b { a } else { b }
}

pub fn max(a: u64, b: u64) -> u64 {
    if a > b { a } else { b }
}

pub fn percent_of(value: u64, percent: u64) -> u64 {
    (value * percent) / 100
}
