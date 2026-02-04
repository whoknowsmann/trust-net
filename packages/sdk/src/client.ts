import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AgentReputationView, CreateJobArgs, JobView, RateJobArgs, VerifyType } from "./types";
import {
  arbiterPda,
  arbiterVaultPda,
  disputePda,
  disputeVaultPda,
  jobPda,
  jobVaultPda,
  PROGRAM_ID,
  ratingPda,
  reputationPda,
  repVaultPda,
  treasuryPda,
  voteCommitmentPda,
} from "./pda";
import { voteHash } from "./instructions";

const IDL: any = {
  version: "0.1.0",
  name: "trustnet",
  instructions: [],
};

export class TrustNetClient {
  readonly connection: Connection;
  readonly wallet: AnchorProvider["wallet"];
  readonly program: Program;

  constructor(opts: { connection: Connection; wallet: AnchorProvider["wallet"]; programId?: PublicKey }) {
    this.connection = opts.connection;
    this.wallet = opts.wallet;
    const provider = new AnchorProvider(opts.connection, opts.wallet, {});
    this.program = new Program(IDL, opts.programId ?? PROGRAM_ID, provider);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reputation
  // ─────────────────────────────────────────────────────────────────────────────

  async initReputation(stakeLamports: bigint, specializations: number[] = []): Promise<PublicKey> {
    const [reputation] = reputationPda(this.wallet.publicKey);
    const [repVault] = repVaultPda(this.wallet.publicKey);
    await this.program.methods
      .initReputation(new BN(stakeLamports.toString()), specializations)
      .accounts({
        agent: this.wallet.publicKey,
        reputation,
        repVault,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    return reputation;
  }

  async stakeReputation(addLamports: bigint): Promise<string> {
    const [reputation] = reputationPda(this.wallet.publicKey);
    const [repVault] = repVaultPda(this.wallet.publicKey);
    return this.program.methods
      .stakeReputation(new BN(addLamports.toString()))
      .accounts({
        agent: this.wallet.publicKey,
        reputation,
        repVault,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  async getReputation(agent: PublicKey): Promise<AgentReputationView> {
    const [reputation] = reputationPda(agent);
    const account: any = await this.program.account.agentReputation.fetch(reputation);
    return {
      agent: account.agent,
      totalJobsCompleted: BigInt(account.totalJobsCompleted.toString()),
      totalJobsFailed: BigInt(account.totalJobsFailed.toString()),
      totalDisputesWon: BigInt(account.totalDisputesWon.toString()),
      totalDisputesLost: BigInt(account.totalDisputesLost.toString()),
      totalVolume: BigInt(account.totalVolume.toString()),
      avgRating: account.avgRating,
      ratingCount: BigInt(account.ratingCount.toString()),
      stakeAmount: BigInt(account.stakeAmount.toString()),
      lastActive: account.lastActive.toNumber(),
    };
  }

  computeScore(view: AgentReputationView, nowTs: number): number {
    const completed = Number(view.totalJobsCompleted);
    const failed = Number(view.totalJobsFailed);
    const disputesWon = Number(view.totalDisputesWon);
    const disputesLost = Number(view.totalDisputesLost);
    const total = completed + failed;
    let base = total === 0 ? 0 : Math.floor((completed / total) * 100);
    base += disputesWon * 2 - disputesLost * 5;
    if (completed >= 50) base += 15;
    else if (completed >= 20) base += 10;
    else if (completed >= 5) base += 5;
    const stakeSol = Number(view.stakeAmount) / 1_000_000_000;
    if (stakeSol >= 50) base += 10;
    else if (stakeSol >= 10) base += 5;
    else if (stakeSol >= 1) base += 2;
    const daysInactive = Math.floor((nowTs - view.lastActive) / 86_400);
    const multiplier =
      daysInactive <= 30 ? 1 : daysInactive <= 90 ? 0.95 : daysInactive <= 180 ? 0.9 : daysInactive <= 360 ? 0.8 : 0.7;
    const adjusted = Math.floor(base * multiplier);
    return Math.max(0, Math.min(100, adjusted));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Jobs
  // ─────────────────────────────────────────────────────────────────────────────

  async getJob(jobPubkey: PublicKey): Promise<JobView> {
    const account: any = await this.program.account.jobEscrow.fetch(jobPubkey);
    return {
      jobId: new Uint8Array(account.jobId),
      client: account.client,
      provider: account.provider,
      amount: BigInt(account.amount.toString()),
      providerStake: BigInt(account.providerStake.toString()),
      deadline: account.deadline.toNumber(),
      status: account.status,
      verificationType: account.verificationType,
      createdAt: account.createdAt.toNumber(),
      submittedAt: account.submittedAt?.toNumber() ?? null,
      completedAt: account.completedAt?.toNumber() ?? null,
    };
  }

  async createJob(args: CreateJobArgs): Promise<{ job: PublicKey; vault: PublicKey }> {
    const [job] = jobPda(args.jobId);
    const [vault] = jobVaultPda(job);
    const [treasury] = treasuryPda();
    await this.program.methods
      .createJob(
        Array.from(args.jobId),
        new BN(args.amountLamports.toString()),
        new BN(args.deadline),
        this.mapVerifyType(args.verificationType),
        Array.from(args.verificationData),
        Array.from(args.termsHash)
      )
      .accounts({
        client: this.wallet.publicKey,
        provider: args.provider,
        job,
        jobVault: vault,
        treasury,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    return { job, vault };
  }

  async acceptJob(job: PublicKey, stakeLamports: bigint): Promise<string> {
    const [vault] = jobVaultPda(job);
    return this.program.methods
      .acceptJob(new BN(stakeLamports.toString()))
      .accounts({
        provider: this.wallet.publicKey,
        job,
        jobVault: vault,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  async submitCompletion(job: PublicKey, submissionHash: Uint8Array): Promise<string> {
    return this.program.methods
      .submitCompletion(Array.from(submissionHash))
      .accounts({ provider: this.wallet.publicKey, job })
      .rpc();
  }

  /**
   * Approve job completion (client only). Pays out to provider.
   * @param job - Job PDA
   * @param provider - Provider pubkey (receives payout)
   */
  async approveCompletion(job: PublicKey, provider: PublicKey): Promise<string> {
    const [vault] = jobVaultPda(job);
    const [treasury] = treasuryPda();
    return this.program.methods
      .approveCompletion()
      .accounts({
        client: this.wallet.publicKey,
        job,
        jobVault: vault,
        treasury,
        provider,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  /**
   * Oracle verification of job completion.
   * @param job - Job PDA
   * @param provider - Provider pubkey (receives payout if approved)
   * @param approved - Whether oracle approves the work
   * @param notesHash - Hash of oracle notes
   */
  async oracleVerify(job: PublicKey, provider: PublicKey, approved: boolean, notesHash: Uint8Array): Promise<string> {
    const [vault] = jobVaultPda(job);
    const [treasury] = treasuryPda();
    return this.program.methods
      .oracleVerify(approved, Array.from(notesHash))
      .accounts({
        oracle: this.wallet.publicKey,
        job,
        jobVault: vault,
        treasury,
        provider,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  /**
   * Expire a job (permissionless after deadline).
   * @param job - Job PDA
   * @param client - Client pubkey (receives refund if job was active)
   * @param provider - Provider pubkey (receives payout if DeadlineAuto + submitted)
   */
  async expireJob(job: PublicKey, client: PublicKey, provider: PublicKey): Promise<string> {
    const [vault] = jobVaultPda(job);
    const [treasury] = treasuryPda();
    return this.program.methods
      .expireJob()
      .accounts({
        job,
        jobVault: vault,
        treasury,
        client,
        provider,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Disputes
  // ─────────────────────────────────────────────────────────────────────────────

  async raiseDispute(job: PublicKey, reasonBytes: Uint8Array, evidenceHash: Uint8Array): Promise<PublicKey> {
    const [dispute] = disputePda(job);
    const [jobVault] = jobVaultPda(job);
    const [disputeVault] = disputeVaultPda(dispute);
    await this.program.methods
      .raiseDispute(Array.from(reasonBytes), Array.from(evidenceHash))
      .accounts({
        raiser: this.wallet.publicKey,
        job,
        dispute,
        jobVault,
        disputeVault,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    return dispute;
  }

  async commitVote(dispute: PublicKey, vote: boolean, salt: Uint8Array): Promise<string> {
    const [arbiter] = arbiterPda(this.wallet.publicKey);
    const [commitment] = voteCommitmentPda(dispute, arbiter);
    const hash = voteHash(arbiter, dispute, vote, salt);
    return this.program.methods
      .commitVote(Array.from(hash))
      .accounts({
        arbiterAuthority: this.wallet.publicKey,
        arbiter,
        dispute,
        voteCommitment: commitment,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  async revealVote(dispute: PublicKey, vote: boolean, salt: Uint8Array): Promise<string> {
    const [arbiter] = arbiterPda(this.wallet.publicKey);
    const [commitment] = voteCommitmentPda(dispute, arbiter);
    return this.program.methods
      .revealVote(vote, Array.from(salt))
      .accounts({
        arbiterAuthority: this.wallet.publicKey,
        arbiter,
        dispute,
        voteCommitment: commitment,
      })
      .rpc();
  }

  /**
   * Resolve a dispute after voting. Permissionless.
   * @param dispute - Dispute PDA
   * @param client - Client pubkey (receives payout if they win)
   * @param provider - Provider pubkey (receives payout if they win)
   * @param arbiterAccounts - Array of arbiter remaining accounts (arbiter, arbiterVault, voteCommitment, authority) per arbiter
   */
  async resolveDispute(
    dispute: PublicKey,
    client: PublicKey,
    provider: PublicKey,
    arbiterAccounts: { arbiter: PublicKey; arbiterVault: PublicKey; voteCommitment: PublicKey; authority: PublicKey }[] = []
  ): Promise<string> {
    const disputeData = await this.program.account.dispute.fetch(dispute);
    const job = disputeData.job as PublicKey;
    const [disputeVault] = disputeVaultPda(dispute);
    const [jobVault] = jobVaultPda(job);
    const [treasury] = treasuryPda();

    const remainingAccounts = arbiterAccounts.flatMap((a) => [
      { pubkey: a.arbiter, isSigner: false, isWritable: true },
      { pubkey: a.arbiterVault, isSigner: false, isWritable: true },
      { pubkey: a.voteCommitment, isSigner: false, isWritable: false },
      { pubkey: a.authority, isSigner: false, isWritable: true },
    ]);

    return this.program.methods
      .resolveDispute()
      .accounts({
        dispute,
        job,
        jobVault,
        disputeVault,
        treasury,
        client,
        provider,
        systemProgram: web3.SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
      .rpc();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Ratings
  // ─────────────────────────────────────────────────────────────────────────────

  async rateJob(job: PublicKey, args: RateJobArgs): Promise<string> {
    const [rating] = ratingPda(args.jobId, this.wallet.publicKey);
    const [rateeReputation] = reputationPda(args.ratee);
    return this.program.methods
      .rateJob(Array.from(args.jobId), args.score, Array.from(args.tags), Array.from(args.commentHash))
      .accounts({
        rater: this.wallet.publicKey,
        job,
        rateeReputation,
        rating,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Arbiters
  // ─────────────────────────────────────────────────────────────────────────────

  async registerArbiter(stakeLamports: bigint, specializations: number[] = []): Promise<PublicKey> {
    const [arbiter] = arbiterPda(this.wallet.publicKey);
    const [arbiterVault] = arbiterVaultPda(this.wallet.publicKey);
    await this.program.methods
      .registerArbiter(new BN(stakeLamports.toString()), specializations)
      .accounts({
        authority: this.wallet.publicKey,
        arbiter,
        arbiterVault,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    return arbiter;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private mapVerifyType(verifyType: VerifyType): any {
    switch (verifyType) {
      case "ClientApproval":
        return { clientApproval: {} };
      case "OracleVerify":
        return { oracleVerify: {} };
      case "DeadlineAuto":
        return { deadlineAuto: {} };
      case "PeerReview":
        return { peerReview: {} };
      case "ZkVerify":
        return { zkVerify: {} };
    }
  }
}
