import { PublicKey } from "@solana/web3.js";

export type VerifyType = "ClientApproval" | "OracleVerify" | "DeadlineAuto" | "PeerReview" | "ZkVerify";

export interface CreateJobArgs {
  jobId: Uint8Array;
  amountLamports: bigint;
  deadline: number;
  verificationType: VerifyType;
  verificationData: Uint8Array;
  termsHash: Uint8Array;
  provider: PublicKey;
}

export interface RateJobArgs {
  jobId: Uint8Array;
  score: number;
  tags: Uint8Array;
  commentHash: Uint8Array;
  ratee: PublicKey;
}

export interface AgentReputationView {
  agent: PublicKey;
  totalJobsCompleted: bigint;
  totalJobsFailed: bigint;
  totalDisputesWon: bigint;
  totalDisputesLost: bigint;
  totalVolume: bigint;
  avgRating: number;
  ratingCount: bigint;
  stakeAmount: bigint;
  lastActive: number;
}
