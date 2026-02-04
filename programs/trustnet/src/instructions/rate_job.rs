use anchor_lang::prelude::*;

use crate::state::job_escrow::{JobEscrow, JobStatus};
use crate::state::reputation::{AgentReputation, Rating};
use crate::utils::constants::MAX_TAGS_LEN;
use crate::utils::errors::TrustNetError;
use crate::utils::math::compute_rating_average;
use crate::utils::constants::now_ts;

#[derive(Accounts)]
#[instruction(job_id: [u8;32])]
pub struct RateJob<'info> {
    #[account(mut)]
    pub rater: Signer<'info>,
    #[account(mut)]
    pub job: Account<'info, JobEscrow>,
    #[account(mut)]
    pub ratee_reputation: Account<'info, AgentReputation>,
    #[account(
        init,
        payer = rater,
        space = Rating::LEN,
        seeds = [b"rating", job_id.as_ref(), rater.key().as_ref()],
        bump
    )]
    pub rating: Account<'info, Rating>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RateJob>,
    job_id: [u8; 32],
    score: u8,
    tags: Vec<u8>,
    comment_hash: [u8; 32],
) -> Result<()> {
    require!(score >= 1 && score <= 5, TrustNetError::RatingOutOfRange);
    require!(tags.len() <= MAX_TAGS_LEN, TrustNetError::BytesTooLarge);

    let job = &ctx.accounts.job;
    require!(job.status == JobStatus::Completed || job.status == JobStatus::Resolved, TrustNetError::InvalidStatus);

    let rating = &mut ctx.accounts.rating;
    rating.job_id = job_id;
    rating.rater = ctx.accounts.rater.key();
    rating.ratee = ctx.accounts.ratee_reputation.agent;
    rating.score = score;
    rating.tags = tags;
    rating.comment_hash = comment_hash;
    rating.timestamp = now_ts(&Clock::get()?);
    rating.bump = *ctx.bumps.get("rating").unwrap();

    let rep = &mut ctx.accounts.ratee_reputation;
    rep.avg_rating = compute_rating_average(rep.avg_rating, rep.rating_count, score);
    rep.rating_count = rep.rating_count.saturating_add(1);
    rep.last_active = now_ts(&Clock::get()?);
    Ok(())
}
