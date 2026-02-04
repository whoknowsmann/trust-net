use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::job_escrow::{JobEscrow, JobStatus, VerifyType};
use crate::utils::constants::{now_ts, BPS_DENOMINATOR, PROTOCOL_FEE_BPS};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
#[instruction(job_id: [u8;32])]
pub struct CreateJob<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    /// CHECK: provider can be empty at creation
    pub provider: UncheckedAccount<'info>,
    #[account(
        init,
        payer = client,
        space = JobEscrow::LEN,
        seeds = [b"job", job_id.as_ref()],
        bump
    )]
    pub job: Account<'info, JobEscrow>,
    #[account(
        init,
        payer = client,
        space = 0,
        seeds = [b"job_vault", job.key().as_ref()],
        bump
    )]
    pub job_vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = client,
        space = 0,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateJob>,
    job_id: [u8; 32],
    amount: u64,
    deadline: i64,
    verification_type: VerifyType,
    verification_data: [u8; 64],
    terms_hash: [u8; 32],
) -> Result<()> {
    require!(amount > 0, TrustNetError::InsufficientFunds);
    let job = &mut ctx.accounts.job;
    job.job_id = job_id;
    job.client = ctx.accounts.client.key();
    job.provider = ctx.accounts.provider.key();
    job.amount = amount;
    job.provider_stake = 0;
    job.deadline = deadline;
    job.status = JobStatus::Created;
    job.verification_type = verification_type;
    job.verification_data = verification_data;
    job.created_at = now_ts(&Clock::get()?);
    job.submitted_at = None;
    job.completed_at = None;
    job.terms_hash = terms_hash;
    job.bump = *ctx.bumps.get("job").unwrap();

    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.client.to_account_info(),
            to: ctx.accounts.job_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi, amount)?;

    let _fee_preview = amount
        .checked_mul(PROTOCOL_FEE_BPS)
        .and_then(|v| v.checked_div(BPS_DENOMINATOR))
        .unwrap_or(0);
    Ok(())
}
