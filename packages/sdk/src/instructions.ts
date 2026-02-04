import crypto from "crypto";
import { PublicKey } from "@solana/web3.js";

export function sha256(data: Uint8Array): Uint8Array {
  return crypto.createHash("sha256").update(Buffer.from(data)).digest();
}

export function voteHash(arbiter: PublicKey, dispute: PublicKey, vote: boolean, salt: Uint8Array): Uint8Array {
  const data = Buffer.concat([
    arbiter.toBuffer(),
    dispute.toBuffer(),
    Buffer.from([vote ? 1 : 0]),
    Buffer.from(salt),
  ]);
  return sha256(data);
}
