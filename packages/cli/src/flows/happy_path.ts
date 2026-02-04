import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TrustNetClient } from "@trustnet/sdk";
import crypto from "crypto";

const SOL = LAMPORTS_PER_SOL;

function randomBytes(n: number): Uint8Array {
  return new Uint8Array(crypto.randomBytes(n));
}

function sha256(data: string): Uint8Array {
  return new Uint8Array(crypto.createHash("sha256").update(data).digest());
}

async function airdrop(connection: Connection, pubkey: Keypair["publicKey"], amount: number): Promise<void> {
  const sig = await connection.requestAirdrop(pubkey, amount);
  await connection.confirmTransaction(sig, "confirmed");
}

export async function runHappyPath(): Promise<void> {
  console.log("\n🚀 TrustNet Happy Path Demo (localnet)\n");
  console.log("─".repeat(60));

  // Setup
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  const clientKeypair = Keypair.generate();
  const providerKeypair = Keypair.generate();

  const clientWallet = new Wallet(clientKeypair);
  const providerWallet = new Wallet(providerKeypair);

  const clientSdk = new TrustNetClient({ connection, wallet: clientWallet });
  const providerSdk = new TrustNetClient({ connection, wallet: providerWallet });

  console.log("👤 Client:  ", clientKeypair.publicKey.toBase58());
  console.log("👷 Provider:", providerKeypair.publicKey.toBase58());
  console.log("📦 Program: ", clientSdk.program.programId.toBase58());
  console.log();

  // Fund wallets
  console.log("💰 Funding wallets (2 SOL each)...");
  await airdrop(connection, clientKeypair.publicKey, 2 * SOL);
  await airdrop(connection, providerKeypair.publicKey, 2 * SOL);
  console.log("   ✓ Wallets funded\n");

  // 1. Init reputation for both parties
  console.log("📊 Initializing reputation...");
  const minStake = BigInt(0.1 * SOL);
  await clientSdk.initReputation(minStake);
  await providerSdk.initReputation(minStake);
  console.log("   ✓ Client reputation initialized");
  console.log("   ✓ Provider reputation initialized\n");

  // 2. Create job
  console.log("📝 Creating job...");
  const jobId = randomBytes(32);
  const jobAmount = BigInt(0.5 * SOL);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const termsHash = sha256("Build a landing page for TrustNet");
  const verificationData = new Uint8Array(64); // Empty for ClientApproval

  const { job, vault } = await clientSdk.createJob({
    jobId,
    amountLamports: jobAmount,
    deadline,
    verificationType: "ClientApproval",
    verificationData,
    termsHash,
    provider: providerKeypair.publicKey,
  });

  console.log("   ✓ Job created:", job.toBase58());
  console.log("   ✓ Vault:      ", vault.toBase58());
  console.log("   ✓ Amount:     ", Number(jobAmount) / SOL, "SOL\n");

  // 3. Provider accepts job
  console.log("🤝 Provider accepting job...");
  const providerStake = BigInt(0.1 * SOL);
  await providerSdk.acceptJob(job, providerStake);
  console.log("   ✓ Job accepted (staked", Number(providerStake) / SOL, "SOL)\n");

  // 4. Provider submits work
  console.log("📤 Provider submitting work...");
  const submissionHash = sha256("https://trustnet.example.com - landing page complete");
  await providerSdk.submitCompletion(job, submissionHash);
  console.log("   ✓ Work submitted\n");

  // 5. Client approves
  console.log("✅ Client approving completion...");
  await clientSdk.approveCompletion(job, providerKeypair.publicKey);
  console.log("   ✓ Job completed!\n");

  // 6. Check final state
  console.log("📊 Final state:");
  const jobData = await clientSdk.getJob(job);
  console.log("   Job status:", JSON.stringify(jobData.status));

  const providerBal = await connection.getBalance(providerKeypair.publicKey);
  const expectedPayout = Number(jobAmount) + Number(providerStake);
  const protocolFee = Number(jobAmount) * 0.001; // 0.1% fee
  console.log("   Provider balance:", providerBal / SOL, "SOL");
  console.log("   Expected payout: ~", (expectedPayout - protocolFee) / SOL, "SOL (minus gas)\n");

  // 7. Rate the job
  console.log("⭐ Client rating provider...");
  await clientSdk.rateJob(job, {
    jobId,
    score: 5,
    tags: new Uint8Array([1, 2]), // "quality", "communication"
    commentHash: sha256("Excellent work, delivered on time!"),
    ratee: providerKeypair.publicKey,
  });
  console.log("   ✓ Rating submitted (5 stars)\n");

  // 8. Check reputation
  const providerRep = await clientSdk.getReputation(providerKeypair.publicKey);
  const score = clientSdk.computeScore(providerRep, Math.floor(Date.now() / 1000));
  console.log("📈 Provider reputation:");
  console.log("   Jobs completed:", providerRep.totalJobsCompleted.toString());
  console.log("   Avg rating:    ", providerRep.avgRating / 100, "/ 5");
  console.log("   Trust score:   ", score, "/ 100\n");

  console.log("─".repeat(60));
  console.log("✨ Happy path complete!\n");
}
