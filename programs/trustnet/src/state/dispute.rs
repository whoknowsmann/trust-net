use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeStatus {
    Open,
    CommitPhase,
    RevealPhase,
    Resolved,
}

#[account]
pub struct Dispute {
    pub job: Pubkey,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub reason_hash: [u8; 32],
    pub evidence_hash: [u8; 32],
    pub status: DisputeStatus,
    pub commit_deadline: i64,
    pub reveal_deadline: i64,
    pub selected_arbiters: Vec<Pubkey>,
    pub client_weight: u64,
    pub provider_weight: u64,
    pub resolved_in_favor_of_client: Option<bool>,
    pub bump: u8,
}

impl Dispute {
    pub const LEN: usize = 8 + 32 * 3 + 32 + 32 + 1 + 8 + 8 + 4 + 32 * 3 + 8 + 8 + 1 + 1;
}

#[account]
pub struct VoteCommitment {
    pub dispute: Pubkey,
    pub arbiter: Pubkey,
    pub commit_hash: [u8; 32],
    pub revealed: bool,
    pub vote: Option<bool>,
    pub bump: u8,
}

impl VoteCommitment {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 1 + 1;
}
