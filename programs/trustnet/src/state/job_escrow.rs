use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum JobStatus {
    Created,
    Active,
    Submitted,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VerifyType {
    ClientApproval,
    OracleVerify,
    DeadlineAuto,
    PeerReview,
    ZkVerify,
}

#[account]
pub struct JobEscrow {
    pub job_id: [u8; 32],
    pub client: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub provider_stake: u64,
    pub deadline: i64,
    pub status: JobStatus,
    pub verification_type: VerifyType,
    pub verification_data: [u8; 64],
    pub created_at: i64,
    pub submitted_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub terms_hash: [u8; 32],
    pub bump: u8,
}

impl JobEscrow {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 64 + 8 + 9 + 9 + 32 + 1;
}
