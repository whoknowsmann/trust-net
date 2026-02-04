use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::job_escrow::{JobEscrow, JobStatus, VerifyType};
use crate::utils::constants::{BPS_DENOMINATOR, PROTOCOL_FEE_BPS, now_ts};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct OracleVerify<'info> {
    pub oracle: Signer<'info>,
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
    /// CHECK: provider receives payout
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<OracleVerify>, approved: bool, _notes_hash: [u8; 32]) -> Result<()> {
    let job = &mut ctx.accounts.job;
    require!(job.status == JobStatus::Submitted, TrustNetError::InvalidStatus);
    require!(job.verification_type == VerifyType::OracleVerify, TrustNetError::InvalidStatus);
    let oracle_key = Pubkey::new_from_array(job.verification_data[..32].try_into().unwrap());
    require!(oracle_key == ctx.accounts.oracle.key(), TrustNetError::Unauthorized);

    if approved {
        let total = job.amount.checked_add(job.provider_stake).ok_or(TrustNetError::InsufficientFunds)?;
        let fee = job.amount
            .checked_mul(PROTOCOL_FEE_BPS)
            .and_then(|v| v.checked_div(BPS_DENOMINATOR))
            .unwrap_or(0);
        let payout = total.saturating_sub(fee);

        let job_key = job.key();
        let signer_seeds = &[b"job_vault", job_key.as_ref(), &[*ctx.bumps.get("job_vault").unwrap()]];

        let transfer_to_provider = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.job_vault.to_account_info(),
                to: ctx.accounts.provider.to_account_info(),
            },
            &[signer_seeds],
        );
        system_program::transfer(transfer_to_provider, payout)?;

        if fee > 0 {
            let transfer_fee = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.job_vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                &[signer_seeds],
            );
            system_program::transfer(transfer_fee, fee)?;
        }

        job.status = JobStatus::Completed;
        job.completed_at = Some(now_ts(&Clock::get()?));
    }
    Ok(())
}
