use anchor_lang::prelude::*;

use crate::state::arbiter::Arbiter;
use crate::state::dispute::{Dispute, DisputeStatus, VoteCommitment};
use crate::utils::errors::TrustNetError;

#[derive(Accounts)]
pub struct CommitVote<'info> {
    pub arbiter_authority: Signer<'info>,
    #[account(mut, has_one = authority @ TrustNetError::Unauthorized)]
    pub arbiter: Account<'info, Arbiter>,
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(
        init,
        payer = arbiter_authority,
        space = VoteCommitment::LEN,
        seeds = [b"vote", dispute.key().as_ref(), arbiter.key().as_ref()],
        bump
    )]
    pub vote_commitment: Account<'info, VoteCommitment>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CommitVote>, vote_hash: [u8; 32]) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    require!(dispute.status == DisputeStatus::CommitPhase, TrustNetError::InvalidDisputeState);

    let vote = &mut ctx.accounts.vote_commitment;
    vote.dispute = dispute.key();
    vote.arbiter = ctx.accounts.arbiter.key();
    vote.commit_hash = vote_hash;
    vote.revealed = false;
    vote.vote = None;
    vote.bump = *ctx.bumps.get("vote_commitment").unwrap();

    if !dispute.selected_arbiters.contains(&ctx.accounts.arbiter.key()) {
        dispute.selected_arbiters.push(ctx.accounts.arbiter.key());
    }
    Ok(())
}
