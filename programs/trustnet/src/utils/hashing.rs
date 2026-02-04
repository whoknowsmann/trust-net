use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

pub fn hash_bytes(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result[..32]);
    out
}

pub fn hash_vote(arbiter: &Pubkey, dispute: &Pubkey, vote: bool, salt: &[u8]) -> [u8; 32] {
    let mut data = Vec::with_capacity(32 + 32 + 1 + salt.len());
    data.extend_from_slice(arbiter.as_ref());
    data.extend_from_slice(dispute.as_ref());
    data.push(vote as u8);
    data.extend_from_slice(salt);
    hash_bytes(&data)
}
