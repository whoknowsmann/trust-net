use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::dispute::{Dispute, DisputeStatus};
use crate::state::job_escrow::{JobEscrow, JobStatus};
use crate::utils::constants::{BPS_DENOMINATOR, DISPUTE_FEE_BPS, now_ts};
use crate::utils::errors::TrustNetError;
use crate::utils::hashing::hash_bytes;

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut)]
    pub raiser: Signer<'info>,
    #[account(mut)]
    pub job: Account<'info, JobEscrow>,
    #[account(
        init,
        payer = raiser,
        space = Dispute::LEN,
        seeds = [b"dispute", job.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    #[account(
        mut,
        seeds = [b"job_vault", job.key().as_ref()],
        bump
    )]
    pub job_vault: SystemAccount<'info>,
    #[account(
        init,
        payer = raiser,
        space = 0,
        seeds = [b"dispute_vault", dispute.key().as_ref()],
        bump
    )]
    pub dispute_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RaiseDispute>, reason_bytes: Vec<u8>, evidence_hash: [u8; 32]) -> Result<()> {
    let job = &mut ctx.accounts.job;
    require!(job.status == JobStatus::Submitted, TrustNetError::InvalidStatus);
    let dispute = &mut ctx.accounts.dispute;

    let now = now_ts(&Clock::get()?);
    let commit_deadline = now + 3600;
    let reveal_deadline = commit_deadline + 3600;

    dispute.job = job.key();
    dispute.client = job.client;
    dispute.provider = job.provider;
    dispute.reason_hash = hash_bytes(&reason_bytes);
    dispute.evidence_hash = evidence_hash;
    dispute.status = DisputeStatus::CommitPhase;
    dispute.commit_deadline = commit_deadline;
    dispute.reveal_deadline = reveal_deadline;
    dispute.selected_arbiters = Vec::with_capacity(3);
    dispute.client_weight = 0;
    dispute.provider_weight = 0;
    dispute.resolved_in_favor_of_client = None;
    dispute.bump = *ctx.bumps.get("dispute").unwrap();

    let dispute_fee = job.amount
        .checked_mul(DISPUTE_FEE_BPS)
        .and_then(|v| v.checked_div(BPS_DENOMINATOR))
        .unwrap_or(0);

    if dispute_fee > 0 {
        let job_key = job.key();
        let signer_seeds = &[b"job_vault", job_key.as_ref(), &[*ctx.bumps.get("job_vault").unwrap()]];
        let transfer_fee = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.job_vault.to_account_info(),
                to: ctx.accounts.dispute_vault.to_account_info(),
            },
            &[signer_seeds],
        );
        system_program::transfer(transfer_fee, dispute_fee)?;
    }

    job.status = JobStatus::Disputed;
    Ok(())
}
