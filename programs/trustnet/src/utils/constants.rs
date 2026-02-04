use anchor_lang::prelude::*;

pub const MIN_REPUTATION_STAKE_LAMPORTS: u64 = 100_000_000; // 0.1 SOL
pub const MIN_ARBITER_STAKE_LAMPORTS: u64 = 1_000_000_000; // 1 SOL
pub const PROTOCOL_FEE_BPS: u64 = 10; // 0.1%
pub const BPS_DENOMINATOR: u64 = 10_000;
pub const DISPUTE_FEE_BPS: u64 = 100; // 1%
pub const GRACE_PERIOD_SECONDS: i64 = 60 * 60; // 1 hour
pub const MAX_TAGS_LEN: usize = 64;
pub const MAX_SPECIALIZATIONS_LEN: usize = 64;

pub fn now_ts(clock: &Clock) -> i64 {
    clock.unix_timestamp
}
