use anchor_lang::prelude::*;

#[error_code]
pub enum TrustNetError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid status for this action")]
    InvalidStatus,
    #[msg("Deadline not reached")]
    DeadlineNotReached,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Already submitted")]
    AlreadySubmitted,
    #[msg("Already rated")]
    AlreadyRated,
    #[msg("Invalid vote reveal")]
    InvalidVoteReveal,
    #[msg("Invalid dispute state")]
    InvalidDisputeState,
    #[msg("Minimum stake not met")]
    MinimumStakeNotMet,
    #[msg("Dispute not resolved")]
    DisputeNotResolved,
    #[msg("Rating out of range")]
    RatingOutOfRange,
    #[msg("Too many bytes provided")]
    BytesTooLarge,
}
