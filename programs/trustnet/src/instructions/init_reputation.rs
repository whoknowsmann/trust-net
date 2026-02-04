use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::reputation::AgentReputation;
use crate::utils::constants::{MIN_REPUTATION_STAKE_LAMPORTS, now_ts, MAX_SPECIALIZATIONS_LEN};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct InitReputation<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    #[account(
        init,
        payer = agent,
        space = AgentReputation::LEN,
        seeds = [b"reputation", agent.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, AgentReputation>,
    #[account(
        init,
        payer = agent,
        space = 0,
        seeds = [b"rep_vault", agent.key().as_ref()],
        bump
    )]
    pub rep_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitReputation>, stake_lamports: u64, specializations: Vec<u8>) -> Result<()> {
    require!(stake_lamports >= MIN_REPUTATION_STAKE_LAMPORTS, TrustNetError::MinimumStakeNotMet);
    require!(specializations.len() <= MAX_SPECIALIZATIONS_LEN, TrustNetError::BytesTooLarge);

    let reputation = &mut ctx.accounts.reputation;
    reputation.agent = ctx.accounts.agent.key();
    reputation.total_jobs_completed = 0;
    reputation.total_jobs_failed = 0;
    reputation.total_disputes_won = 0;
    reputation.total_disputes_lost = 0;
    reputation.total_volume = 0;
    reputation.avg_rating = 0;
    reputation.rating_count = 0;
    reputation.specializations = specializations;
    reputation.created_at = now_ts(&Clock::get()?);
    reputation.last_active = reputation.created_at;
    reputation.stake_amount = stake_lamports;
    reputation.bump = *ctx.bumps.get("reputation").unwrap();

    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.agent.to_account_info(),
            to: ctx.accounts.rep_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi, stake_lamports)?;
    Ok(())
}
