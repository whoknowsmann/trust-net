use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("TruSTnet111111111111111111111111111111111");

#[program]
pub mod trustnet {
    use super::*;

    pub fn create_job(
        ctx: Context<create_job::CreateJob>,
        job_id: [u8; 32],
        amount: u64,
        deadline: i64,
        verification_type: state::job_escrow::VerifyType,
        verification_data: [u8; 64],
        terms_hash: [u8; 32],
    ) -> Result<()> {
        create_job::handler(ctx, job_id, amount, deadline, verification_type, verification_data, terms_hash)?;
        emit!(JobCreated { job: ctx.accounts.job.key() });
        Ok(())
    }

    pub fn accept_job(ctx: Context<accept_job::AcceptJob>, stake_amount: u64) -> Result<()> {
        accept_job::handler(ctx, stake_amount)?;
        emit!(JobAccepted { job: ctx.accounts.job.key() });
        Ok(())
    }

    pub fn submit_completion(ctx: Context<submit_completion::SubmitCompletion>, submission_hash: [u8; 32]) -> Result<()> {
        submit_completion::handler(ctx, submission_hash)?;
        emit!(JobSubmitted { job: ctx.accounts.job.key() });
        Ok(())
    }

    pub fn approve_completion(ctx: Context<approve_completion::ApproveCompletion>) -> Result<()> {
        approve_completion::handler(ctx)?;
        emit!(JobCompleted { job: ctx.accounts.job.key() });
        Ok(())
    }

    pub fn oracle_verify(ctx: Context<oracle_verify::OracleVerify>, approved: bool, notes_hash: [u8; 32]) -> Result<()> {
        oracle_verify::handler(ctx, approved, notes_hash)?;
        if approved {
            emit!(JobCompleted { job: ctx.accounts.job.key() });
        }
        Ok(())
    }

    pub fn raise_dispute(ctx: Context<raise_dispute::RaiseDispute>, reason_bytes: Vec<u8>, evidence_hash: [u8; 32]) -> Result<()> {
        raise_dispute::handler(ctx, reason_bytes, evidence_hash)?;
        emit!(JobDisputed { job: ctx.accounts.job.key(), dispute: ctx.accounts.dispute.key() });
        Ok(())
    }

    pub fn commit_vote(ctx: Context<commit_vote::CommitVote>, vote_hash: [u8; 32]) -> Result<()> {
        commit_vote::handler(ctx, vote_hash)?;
        emit!(DisputeCommitted { dispute: ctx.accounts.dispute.key(), arbiter: ctx.accounts.arbiter.key() });
        Ok(())
    }

    pub fn reveal_vote(ctx: Context<reveal_vote::RevealVote>, vote_bool: bool, salt: Vec<u8>) -> Result<()> {
        reveal_vote::handler(ctx, vote_bool, salt)?;
        emit!(DisputeRevealed { dispute: ctx.accounts.dispute.key(), arbiter: ctx.accounts.arbiter.key() });
        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<resolve_dispute::ResolveDispute>) -> Result<()> {
        resolve_dispute::handler(ctx)?;
        emit!(DisputeResolved { dispute: ctx.accounts.dispute.key() });
        Ok(())
    }

    pub fn expire_job(ctx: Context<expire_job::ExpireJob>) -> Result<()> {
        expire_job::handler(ctx)?;
        emit!(JobExpired { job: ctx.accounts.job.key() });
        Ok(())
    }

    pub fn init_reputation(ctx: Context<init_reputation::InitReputation>, stake_lamports: u64, specializations: Vec<u8>) -> Result<()> {
        init_reputation::handler(ctx, stake_lamports, specializations)?;
        emit!(ReputationUpdated { agent: ctx.accounts.agent.key() });
        Ok(())
    }

    pub fn stake_reputation(ctx: Context<stake_reputation::StakeReputation>, add_lamports: u64) -> Result<()> {
        stake_reputation::handler(ctx, add_lamports)?;
        emit!(ReputationUpdated { agent: ctx.accounts.agent.key() });
        Ok(())
    }

    pub fn rate_job(
        ctx: Context<rate_job::RateJob>,
        job_id: [u8; 32],
        score: u8,
        tags: Vec<u8>,
        comment_hash: [u8; 32],
    ) -> Result<()> {
        rate_job::handler(ctx, job_id, score, tags, comment_hash)?;
        emit!(ReputationUpdated { agent: ctx.accounts.ratee_reputation.agent });
        Ok(())
    }

    pub fn register_arbiter(ctx: Context<register_arbiter::RegisterArbiter>, stake_amount: u64, specializations: Vec<u8>) -> Result<()> {
        register_arbiter::handler(ctx, stake_amount, specializations)?;
        emit!(ArbiterRegistered { arbiter: ctx.accounts.arbiter.key() });
        Ok(())
    }
}

#[event]
pub struct JobCreated {
    pub job: Pubkey,
}

#[event]
pub struct JobAccepted {
    pub job: Pubkey,
}

#[event]
pub struct JobSubmitted {
    pub job: Pubkey,
}

#[event]
pub struct JobCompleted {
    pub job: Pubkey,
}

#[event]
pub struct JobDisputed {
    pub job: Pubkey,
    pub dispute: Pubkey,
}

#[event]
pub struct DisputeCommitted {
    pub dispute: Pubkey,
    pub arbiter: Pubkey,
}

#[event]
pub struct DisputeRevealed {
    pub dispute: Pubkey,
    pub arbiter: Pubkey,
}

#[event]
pub struct DisputeResolved {
    pub dispute: Pubkey,
}

#[event]
pub struct JobExpired {
    pub job: Pubkey,
}

#[event]
pub struct ReputationUpdated {
    pub agent: Pubkey,
}

#[event]
pub struct ArbiterRegistered {
    pub arbiter: Pubkey,
}
