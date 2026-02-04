import { PublicKey } from "@solana/web3.js";

export type VerifyType = "ClientApproval" | "OracleVerify" | "DeadlineAuto" | "PeerReview" | "ZkVerify";

export type JobStatus = "Created" | "Active" | "Submitted" | "Completed" | "Disputed" | "Resolved" | "Cancelled" | "Expired";

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

export interface JobView {
  jobId: Uint8Array;
  client: PublicKey;
  provider: PublicKey;
  amount: bigint;
  providerStake: bigint;
  deadline: number;
  status: JobStatus;
  verificationType: VerifyType;
  createdAt: number;
  submittedAt: number | null;
  completedAt: number | null;
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
