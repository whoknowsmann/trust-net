use anchor_lang::prelude::*;

#[account]
pub struct AgentReputation {
    pub agent: Pubkey,
    pub total_jobs_completed: u64,
    pub total_jobs_failed: u64,
    pub total_disputes_won: u64,
    pub total_disputes_lost: u64,
    pub total_volume: u64,
    pub avg_rating: u16,
    pub rating_count: u64,
    pub specializations: Vec<u8>,
    pub created_at: i64,
    pub last_active: i64,
    pub stake_amount: u64,
    pub bump: u8,
}

impl AgentReputation {
    pub const LEN: usize = 8 + 32 + 8 * 5 + 2 + 8 + 4 + 64 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Rating {
    pub job_id: [u8; 32],
    pub rater: Pubkey,
    pub ratee: Pubkey,
    pub score: u8,
    pub tags: Vec<u8>,
    pub comment_hash: [u8; 32],
    pub timestamp: i64,
    pub bump: u8,
}

impl Rating {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 4 + 64 + 32 + 8 + 1;
}
