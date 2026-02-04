import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("TruSTnet111111111111111111111111111111111");

export function jobPda(jobId: Uint8Array, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("job"), Buffer.from(jobId)], programId);
}

export function jobVaultPda(job: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("job_vault"), job.toBuffer()], programId);
}

export function treasuryPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("treasury")], programId);
}

export function reputationPda(agent: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("reputation"), agent.toBuffer()], programId);
}

export function repVaultPda(agent: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("rep_vault"), agent.toBuffer()], programId);
}

export function arbiterPda(authority: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("arbiter"), authority.toBuffer()], programId);
}

export function arbiterVaultPda(authority: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("arbiter_vault"), authority.toBuffer()], programId);
}

export function disputePda(job: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("dispute"), job.toBuffer()], programId);
}

export function disputeVaultPda(dispute: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("dispute_vault"), dispute.toBuffer()], programId);
}

export function ratingPda(jobId: Uint8Array, rater: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("rating"), Buffer.from(jobId), rater.toBuffer()], programId);
}

export function voteCommitmentPda(dispute: PublicKey, arbiter: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("vote"), dispute.toBuffer(), arbiter.toBuffer()], programId);
}
