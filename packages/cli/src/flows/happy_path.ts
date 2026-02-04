import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { TrustNetClient } from "@trustnet/sdk";

export async function runHappyPath(): Promise<void> {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const payer = Keypair.generate();
  const wallet = new Wallet(payer);
  const client = new TrustNetClient({ connection, wallet });

  console.log("Running TrustNet happy-path flow (localnet).");
  console.log("Wallet:", wallet.publicKey.toBase58());
  console.log("SDK ready:", client.program.programId.toBase58());
  console.log("Note: fund the generated keypair before running on-chain transactions.");
}
