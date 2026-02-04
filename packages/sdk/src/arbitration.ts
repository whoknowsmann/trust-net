import { PublicKey } from "@solana/web3.js";
import { voteHash } from "./instructions";

export function buildVoteHash(arbiter: PublicKey, dispute: PublicKey, vote: boolean, salt: Uint8Array): Uint8Array {
  return voteHash(arbiter, dispute, vote, salt);
}
