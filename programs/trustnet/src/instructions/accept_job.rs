use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::job_escrow::{JobEscrow, JobStatus};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct AcceptJob<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    #[account(mut, has_one = provider @ TrustNetError::Unauthorized)]
    pub job: Account<'info, JobEscrow>,
    #[account(
        mut,
        seeds = [b"job_vault", job.key().as_ref()],
        bump
    )]
    pub job_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AcceptJob>, stake_amount: u64) -> Result<()> {
    let job = &mut ctx.accounts.job;
    require!(job.status == JobStatus::Created, TrustNetError::InvalidStatus);
    require!(stake_amount > 0, TrustNetError::InsufficientFunds);

    job.status = JobStatus::Active;
    job.provider_stake = stake_amount;

    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.provider.to_account_info(),
            to: ctx.accounts.job_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi, stake_amount)?;
    Ok(())
}
