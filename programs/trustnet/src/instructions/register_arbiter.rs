use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::arbiter::Arbiter;
use crate::utils::constants::{MIN_ARBITER_STAKE_LAMPORTS, now_ts, MAX_SPECIALIZATIONS_LEN};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct RegisterArbiter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Arbiter::LEN,
        seeds = [b"arbiter", authority.key().as_ref()],
        bump
    )]
    pub arbiter: Account<'info, Arbiter>,
    #[account(
        init,
        payer = authority,
        space = 0,
        seeds = [b"arbiter_vault", authority.key().as_ref()],
        bump
    )]
    pub arbiter_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterArbiter>, stake_amount: u64, specializations: Vec<u8>) -> Result<()> {
    require!(stake_amount >= MIN_ARBITER_STAKE_LAMPORTS, TrustNetError::MinimumStakeNotMet);
    require!(specializations.len() <= MAX_SPECIALIZATIONS_LEN, TrustNetError::BytesTooLarge);

    let arbiter = &mut ctx.accounts.arbiter;
    arbiter.authority = ctx.accounts.authority.key();
    arbiter.stake = stake_amount;
    arbiter.cases_judged = 0;
    arbiter.accuracy_score = 500;
    arbiter.specializations = specializations;
    arbiter.active = true;
    arbiter.created_at = now_ts(&Clock::get()?);
    arbiter.last_case = arbiter.created_at;
    arbiter.bump = *ctx.bumps.get("arbiter").unwrap();

    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.arbiter_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi, stake_amount)?;
    Ok(())
}
