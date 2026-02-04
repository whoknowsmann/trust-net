use anchor_lang::prelude::*;

use crate::state::job_escrow::{JobEscrow, JobStatus};
use crate::utils::constants::now_ts;
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct SubmitCompletion<'info> {
    pub provider: Signer<'info>,
    #[account(mut, has_one = provider @ TrustNetError::Unauthorized)]
    pub job: Account<'info, JobEscrow>,
}

pub fn handler(ctx: Context<SubmitCompletion>, _submission_hash: [u8; 32]) -> Result<()> {
    let job = &mut ctx.accounts.job;
    require!(job.status == JobStatus::Active, TrustNetError::InvalidStatus);
    job.status = JobStatus::Submitted;
    job.submitted_at = Some(now_ts(&Clock::get()?));
    Ok(())
}
