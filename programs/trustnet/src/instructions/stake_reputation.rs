use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::reputation::AgentReputation;

#[derive(Accounts)]
pub struct StakeReputation<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    #[account(mut, has_one = agent)]
    pub reputation: Account<'info, AgentReputation>,
    #[account(
        mut,
        seeds = [b"rep_vault", agent.key().as_ref()],
        bump
    )]
    pub rep_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StakeReputation>, add_lamports: u64) -> Result<()> {
    let reputation = &mut ctx.accounts.reputation;
    reputation.stake_amount = reputation.stake_amount.saturating_add(add_lamports);

    let cpi = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.agent.to_account_info(),
            to: ctx.accounts.rep_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi, add_lamports)?;
    Ok(())
}
