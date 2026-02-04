import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TrustNetClient, arbiterPda, arbiterVaultPda, voteCommitmentPda } from "@trustnet/sdk";
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

export async function runDisputePath(): Promise<void> {
  console.log("\n⚖️ TrustNet Dispute Path Demo (localnet)\n");
  console.log("─".repeat(60));

  // Setup
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  const clientKeypair = Keypair.generate();
  const providerKeypair = Keypair.generate();
  const arbiter1Keypair = Keypair.generate();
  const arbiter2Keypair = Keypair.generate();
  const arbiter3Keypair = Keypair.generate();

  const clientWallet = new Wallet(clientKeypair);
  const providerWallet = new Wallet(providerKeypair);

  const clientSdk = new TrustNetClient({ connection, wallet: clientWallet });
  const providerSdk = new TrustNetClient({ connection, wallet: providerWallet });

  const arbiterSdks = [
    new TrustNetClient({ connection, wallet: new Wallet(arbiter1Keypair) }),
    new TrustNetClient({ connection, wallet: new Wallet(arbiter2Keypair) }),
    new TrustNetClient({ connection, wallet: new Wallet(arbiter3Keypair) }),
  ];

  console.log("👤 Client:   ", clientKeypair.publicKey.toBase58());
  console.log("👷 Provider: ", providerKeypair.publicKey.toBase58());
  console.log("⚖️ Arbiter 1:", arbiter1Keypair.publicKey.toBase58());
  console.log("⚖️ Arbiter 2:", arbiter2Keypair.publicKey.toBase58());
  console.log("⚖️ Arbiter 3:", arbiter3Keypair.publicKey.toBase58());
  console.log();

  // Fund wallets
  console.log("💰 Funding wallets...");
  await airdrop(connection, clientKeypair.publicKey, 3 * SOL);
  await airdrop(connection, providerKeypair.publicKey, 2 * SOL);
  await airdrop(connection, arbiter1Keypair.publicKey, 2 * SOL);
  await airdrop(connection, arbiter2Keypair.publicKey, 2 * SOL);
  await airdrop(connection, arbiter3Keypair.publicKey, 2 * SOL);
  console.log("   ✓ All wallets funded\n");

  // Init reputation
  console.log("📊 Initializing reputation...");
  const minStake = BigInt(0.1 * SOL);
  await clientSdk.initReputation(minStake);
  await providerSdk.initReputation(minStake);
  console.log("   ✓ Client & provider reputation initialized\n");

  // Register arbiters
  console.log("⚖️ Registering arbiters (1 SOL stake each)...");
  const arbiterStake = BigInt(1 * SOL);
  for (let i = 0; i < 3; i++) {
    await arbiterSdks[i].registerArbiter(arbiterStake);
    console.log(`   ✓ Arbiter ${i + 1} registered`);
  }
  console.log();

  // Create and accept job
  console.log("📝 Creating job...");
  const jobId = randomBytes(32);
  const { job } = await clientSdk.createJob({
    jobId,
    amountLamports: BigInt(0.5 * SOL),
    deadline: Math.floor(Date.now() / 1000) + 3600,
    verificationType: "ClientApproval",
    verificationData: new Uint8Array(64),
    termsHash: sha256("Build a smart contract"),
    provider: providerKeypair.publicKey,
  });
  console.log("   ✓ Job created:", job.toBase58());

  await providerSdk.acceptJob(job, BigInt(0.1 * SOL));
  console.log("   ✓ Job accepted\n");

  // Provider submits
  console.log("📤 Provider submitting work...");
  await providerSdk.submitCompletion(job, sha256("https://github.com/example/contract"));
  console.log("   ✓ Work submitted\n");

  // Client disputes
  console.log("🚨 Client raising dispute...");
  const dispute = await clientSdk.raiseDispute(
    job,
    new TextEncoder().encode("Work does not meet requirements"),
    sha256("evidence: screenshot of broken tests")
  );
  console.log("   ✓ Dispute raised:", dispute.toBase58(), "\n");

  // Arbiters commit votes
  console.log("🗳️ Arbiters committing votes...");
  const salts = [randomBytes(16), randomBytes(16), randomBytes(16)];
  const votes = [true, true, false]; // 2 vote for provider, 1 for client

  for (let i = 0; i < 3; i++) {
    await arbiterSdks[i].commitVote(dispute, votes[i], salts[i]);
    console.log(`   ✓ Arbiter ${i + 1} committed`);
  }
  console.log();

  // Arbiters reveal votes
  console.log("🔓 Arbiters revealing votes...");
  for (let i = 0; i < 3; i++) {
    await arbiterSdks[i].revealVote(dispute, votes[i], salts[i]);
    const voteLabel = votes[i] ? "Provider" : "Client";
    console.log(`   ✓ Arbiter ${i + 1} revealed: ${voteLabel}`);
  }
  console.log();

  // Resolve dispute
  console.log("⚖️ Resolving dispute...");
  const arbiterAccounts = [arbiter1Keypair, arbiter2Keypair, arbiter3Keypair].map((kp) => {
    const [arbiter] = arbiterPda(kp.publicKey);
    const [arbiterVault] = arbiterVaultPda(kp.publicKey);
    const [voteCommitment] = voteCommitmentPda(dispute, arbiter);
    return { arbiter, arbiterVault, voteCommitment, authority: kp.publicKey };
  });

  await clientSdk.resolveDispute(dispute, clientKeypair.publicKey, providerKeypair.publicKey, arbiterAccounts);

  const jobData = await clientSdk.getJob(job);
  console.log("   ✓ Dispute resolved");
  console.log("   Final job status:", JSON.stringify(jobData.status));
  console.log();

  // Check balances
  const providerBal = await connection.getBalance(providerKeypair.publicKey);
  const clientBal = await connection.getBalance(clientKeypair.publicKey);
  console.log("💰 Final balances:");
  console.log("   Provider:", providerBal / SOL, "SOL");
  console.log("   Client:  ", clientBal / SOL, "SOL");
  console.log();

  console.log("─".repeat(60));
  console.log("✨ Dispute path complete! (Provider won 2-1)\n");
}
