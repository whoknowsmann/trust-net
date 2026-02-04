use anchor_lang::prelude::*;

use crate::state::arbiter::Arbiter;
use crate::state::dispute::{Dispute, DisputeStatus, VoteCommitment};
use crate::utils::errors::TrustNetError;
use crate::utils::hashing::hash_vote;
use crate::utils::math::integer_sqrt;

#[derive(Accounts)]
pub struct RevealVote<'info> {
    pub arbiter_authority: Signer<'info>,
    #[account(has_one = authority @ TrustNetError::Unauthorized)]
    pub arbiter: Account<'info, Arbiter>,
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(
        mut,
        seeds = [b"vote", dispute.key().as_ref(), arbiter.key().as_ref()],
        bump
    )]
    pub vote_commitment: Account<'info, VoteCommitment>,
}

pub fn handler(ctx: Context<RevealVote>, vote_bool: bool, salt: Vec<u8>) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    require!(dispute.status == DisputeStatus::CommitPhase || dispute.status == DisputeStatus::RevealPhase, TrustNetError::InvalidDisputeState);

    let vote = &mut ctx.accounts.vote_commitment;
    let expected = hash_vote(&ctx.accounts.arbiter.key(), &dispute.key(), vote_bool, &salt);
    require!(expected == vote.commit_hash, TrustNetError::InvalidVoteReveal);

    let weight = integer_sqrt(ctx.accounts.arbiter.stake);
    if vote_bool {
        dispute.provider_weight = dispute.provider_weight.saturating_add(weight);
    } else {
        dispute.client_weight = dispute.client_weight.saturating_add(weight);
    }

    vote.revealed = true;
    vote.vote = Some(vote_bool);
    dispute.status = DisputeStatus::RevealPhase;
    Ok(())
}
