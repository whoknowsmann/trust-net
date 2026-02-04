use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::arbiter::Arbiter;
use crate::state::dispute::{Dispute, DisputeStatus, VoteCommitment};
use crate::state::job_escrow::{JobEscrow, JobStatus};
use crate::utils::constants::{BPS_DENOMINATOR, PROTOCOL_FEE_BPS, now_ts};
use crate::utils::errors::TrustNetError;
use crate::utils::math::integer_sqrt;

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
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
        seeds = [b"dispute_vault", dispute.key().as_ref()],
        bump
    )]
    pub dispute_vault: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    /// CHECK: payout to client
    #[account(mut)]
    pub client: UncheckedAccount<'info>,
    /// CHECK: payout to provider
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ResolveDispute>) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    require!(dispute.status == DisputeStatus::RevealPhase || dispute.status == DisputeStatus::CommitPhase, TrustNetError::InvalidDisputeState);

    let total_weight = dispute.client_weight.saturating_add(dispute.provider_weight);
    let provider_ratio = if total_weight == 0 {
        0
    } else {
        dispute.provider_weight * 100 / total_weight
    };
    let client_ratio = if total_weight == 0 {
        0
    } else {
        dispute.client_weight * 100 / total_weight
    };

    let now = now_ts(&Clock::get()?);
    let mut provider_wins = if provider_ratio >= 60 {
        true
    } else if client_ratio >= 60 {
        false
    } else {
        now > dispute.reveal_deadline
    };

    dispute.resolved_in_favor_of_client = Some(!provider_wins);
    dispute.status = DisputeStatus::Resolved;

    // Arbiter rewards + penalties
    let dispute_fee_balance = ctx.accounts.dispute_vault.lamports();
    let mut winning_weight_total: u64 = 0;
    let mut arbiter_infos: Vec<(Pubkey, u64, bool)> = Vec::new();

    let remaining = &ctx.remaining_accounts;
    for chunk in remaining.chunks(4) {
        if chunk.len() < 4 {
            continue;
        }
        let arbiter_account = &chunk[0];
        let vote_account = &chunk[2];
        let arbiter: Account<Arbiter> = Account::try_from(arbiter_account)?;
        let vote: Account<VoteCommitment> = Account::try_from(vote_account)?;
        let weight = integer_sqrt(arbiter.stake);
        let voted_provider = vote.vote.unwrap_or(false);
        if vote.revealed {
            let is_winner = voted_provider == provider_wins;
            if is_winner {
                winning_weight_total = winning_weight_total.saturating_add(weight);
            }
            arbiter_infos.push((arbiter.key(), weight, is_winner));
        } else if now > dispute.reveal_deadline {
            slash_arbiter(&arbiter, &chunk[1], &ctx.accounts.treasury, &ctx.accounts.system_program, 200)?;
        }
        if vote.revealed && voted_provider != provider_wins {
            slash_arbiter(&arbiter, &chunk[1], &ctx.accounts.treasury, &ctx.accounts.system_program, 100)?;
        }
    }

    for chunk in remaining.chunks(4) {
        if chunk.len() < 4 {
            continue;
        }
        let arbiter_account = &chunk[0];
        let arbiter: Account<Arbiter> = Account::try_from(arbiter_account)?;
        let authority_account = &chunk[3];
        let weight = integer_sqrt(arbiter.stake);
        let is_winner = arbiter_infos
            .iter()
            .find(|(key, _, _)| key == &arbiter.key())
            .map(|(_, _, win)| *win)
            .unwrap_or(false);
        if is_winner && winning_weight_total > 0 {
            let share = dispute_fee_balance.saturating_mul(weight) / winning_weight_total;
            if share > 0 {
                transfer_from_vault(
                    &ctx.accounts.dispute_vault,
                    authority_account,
                    &ctx.accounts.system_program,
                    &[b"dispute_vault", ctx.accounts.dispute.key().as_ref()],
                    share,
                )?;
            }
        }
    }

    // Payouts
    let job = &mut ctx.accounts.job;
    require!(job.status == JobStatus::Disputed, TrustNetError::InvalidStatus);
    let total = job.amount.checked_add(job.provider_stake).ok_or(TrustNetError::InsufficientFunds)?;
    if provider_wins {
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
    } else {
        transfer_from_vault(
            &ctx.accounts.job_vault,
            &ctx.accounts.client,
            &ctx.accounts.system_program,
            &[b"job_vault", job.key().as_ref()],
            total,
        )?;
    }

    job.status = JobStatus::Resolved;
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
    let signer_seeds: &[&[u8]] = &[seeds[0], seeds[1], &[bump]];
    let transfer = CpiContext::new_with_signer(
        system_program.to_account_info(),
        system_program::Transfer {
            from: vault.to_account_info(),
            to: to.clone(),
        },
        &[signer_seeds],
    );
    require!(pda == vault.key(), TrustNetError::Unauthorized);
    system_program::transfer(transfer, amount)?;
    Ok(())
}

fn slash_arbiter(
    arbiter: &Account<Arbiter>,
    vault_info: &AccountInfo,
    treasury: &SystemAccount,
    system_program: &Program<System>,
    bps: u64,
) -> Result<()> {
    let amount = arbiter.stake.saturating_mul(bps) / 10_000;
    if amount == 0 {
        return Ok(());
    }
    let seeds = &[b"arbiter_vault", arbiter.authority.as_ref()];
    let (pda, bump) = Pubkey::find_program_address(seeds, &crate::ID);
    require!(pda == vault_info.key(), TrustNetError::Unauthorized);
    let signer_seeds: &[&[u8]] = &[seeds[0], seeds[1], &[bump]];
    let transfer = CpiContext::new_with_signer(
        system_program.to_account_info(),
        system_program::Transfer {
            from: vault_info.clone(),
            to: treasury.to_account_info(),
        },
        &[signer_seeds],
    );
    system_program::transfer(transfer, amount)?;
    Ok(())
}
