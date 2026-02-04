use anchor_lang::prelude::*;

#[account]
pub struct Arbiter {
    pub authority: Pubkey,
    pub stake: u64,
    pub cases_judged: u64,
    pub accuracy_score: u16,
    pub specializations: Vec<u8>,
    pub active: bool,
    pub created_at: i64,
    pub last_case: i64,
    pub bump: u8,
}

impl Arbiter {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 2 + 4 + 64 + 1 + 8 + 8 + 1;
}
