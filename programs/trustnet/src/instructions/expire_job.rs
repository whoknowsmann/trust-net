use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::job_escrow::{JobEscrow, JobStatus, VerifyType};
use crate::utils::constants::{GRACE_PERIOD_SECONDS, now_ts, BPS_DENOMINATOR, PROTOCOL_FEE_BPS};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct ExpireJob<'info> {
    #[account(mut)]
    pub job: Account<'info, JobEscrow>,
    #[account(
        mut,
        seeds = [b"job_vault", job.key().as_ref()],
        bump
    )]
    pub job_vault: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    /// CHECK: client refund
    #[account(mut)]
    pub client: UncheckedAccount<'info>,
    /// CHECK: provider payout
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExpireJob>) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let now = now_ts(&Clock::get()?);

    match job.status {
        JobStatus::Active => {
            require!(now > job.deadline, TrustNetError::DeadlineNotReached);
            let total = job.amount.checked_add(job.provider_stake).ok_or(TrustNetError::InsufficientFunds)?;
            transfer_from_vault(
                &ctx.accounts.job_vault,
                &ctx.accounts.client,
                &ctx.accounts.system_program,
                &[b"job_vault", job.key().as_ref()],
                total,
            )?;
            job.status = JobStatus::Expired;
        }
        JobStatus::Submitted => {
            require!(job.verification_type == VerifyType::DeadlineAuto, TrustNetError::InvalidStatus);
            require!(now > job.deadline + GRACE_PERIOD_SECONDS, TrustNetError::DeadlineNotReached);
            let total = job.amount.checked_add(job.provider_stake).ok_or(TrustNetError::InsufficientFunds)?;
            let fee = job.amount
                .checked_mul(PROTOCOL_FEE_BPS)
                .and_then(|v| v.checked_div(BPS_DENOMINATOR))
                .unwrap_or(0);
            let payout = total.saturating_sub(fee);
            transfer_from_vault(
                &ctx.accounts.job_vault,
                &ctx.accounts.provider,
                &ctx.accounts.system_program,
                &[b"job_vault", job.key().as_ref()],
                payout,
            )?;
            if fee > 0 {
                transfer_from_vault(
                    &ctx.accounts.job_vault,
                    &ctx.accounts.treasury,
                    &ctx.accounts.system_program,
                    &[b"job_vault", job.key().as_ref()],
                    fee,
                )?;
            }
            job.status = JobStatus::Completed;
        }
        _ => return Err(TrustNetError::InvalidStatus.into()),
    }
    Ok(())
}

fn transfer_from_vault(
    vault: &SystemAccount,
    to: &AccountInfo,
    system_program: &Program<System>,
    seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    let (pda, bump) = Pubkey::find_program_address(seeds, &crate::ID);
    require!(pda == vault.key(), TrustNetError::Unauthorized);
    let signer_seeds: &[&[u8]] = &[seeds[0], seeds[1], &[bump]];
    let transfer = CpiContext::new_with_signer(
        system_program.to_account_info(),
        system_program::Transfer {
            from: vault.to_account_info(),
            to: to.clone(),
        },
        &[signer_seeds],
    );
    system_program::transfer(transfer, amount)?;
    Ok(())
}
