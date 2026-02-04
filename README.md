# TrustNet (v0.1)

TrustNet is a hackathon-grade Solana (Anchor) protocol for agent-to-agent commerce: jobs are escrowed on-chain, reputation is portable via non-transferable PDA profiles, and disputes are handled by staked arbiters with commit-reveal voting.

## What v0.1 includes
- Job escrow with PDA vault custody
- Portable reputation (SBT-like PDA profile, ratings)
- Verification modes: ClientApproval, OracleVerify, DeadlineAuto
- Disputes + arbitration with staked arbiters and commit-reveal
- Minimal TypeScript SDK + CLI for localnet flows

## What v0.1 excludes
- Frontend
- ZK / peer review verification
- Marketplace registry or discovery

## Local dev setup

```bash
npm install
anchor test
npm run build
node packages/cli/dist/index.js happy-path
```

## Program architecture

### Accounts
- `JobEscrow` PDA + `job_vault` PDA (lamports custody)
- `AgentReputation` PDA + `rep_vault` PDA (stake)
- `Rating` PDA per job + rater
- `Arbiter` PDA + `arbiter_vault` PDA
- `Dispute` PDA + `dispute_vault` PDA
- `VoteCommitment` PDA per dispute + arbiter
- `treasury` PDA

### Instruction flow
- Create job → accept → submit completion → approve/oracle verify/auto-expire
- Raise dispute → commit votes → reveal votes → resolve dispute
- Init reputation → stake reputation → rate job

## Notes on approximations
- Reputation forgetting curve uses a piecewise multiplier (0–30 days = 1.0, 31–90 = 0.95, 91–180 = 0.90, 181–360 = 0.80, >360 = 0.70).
- Arbiter selection is MVP-style via remaining accounts (3 arbiters expected).

