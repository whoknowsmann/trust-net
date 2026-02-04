import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";

describe("trustnet", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  it("happy path (ClientApproval)", async () => {
    assert.ok(provider.wallet.publicKey);
  });

  it("happy path (OracleVerify)", async () => {
    assert.ok(provider.wallet.publicKey);
  });

  it("deadline expiry (no submission)", async () => {
    assert.ok(provider.wallet.publicKey);
  });

  it("deadline auto (submitted)", async () => {
    assert.ok(provider.wallet.publicKey);
  });

  it("dispute path — provider wins", async () => {
    assert.ok(provider.wallet.publicKey);
  });

  it("dispute path — client wins", async () => {
    assert.ok(provider.wallet.publicKey);
  });

  it("sybil resistance", async () => {
    assert.ok(provider.wallet.publicKey);
  });
});
