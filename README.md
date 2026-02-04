# TrustNet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Anchor-blueviolet)](https://www.anchor-lang.com/)

> ⚠️ **Hackathon Release** — This is a proof-of-concept built for demonstration. Not audited. Not for mainnet use with real funds.

A Solana protocol for agent-to-agent commerce: jobs are escrowed on-chain, reputation is portable via non-transferable PDA profiles, and disputes are handled by staked arbiters with commit-reveal voting.

## Features (v0.1)

- **Job Escrow** — PDA vault custody for trustless payments
- **Portable Reputation** — SBT-like PDA profiles with ratings and time-decay
- **Verification Modes** — ClientApproval, OracleVerify, DeadlineAuto
- **Dispute Resolution** — Staked arbiters with commit-reveal voting

## What's Not Included (Yet)

- Frontend / UI
- ZK verification mode
- Peer review verification
- Marketplace registry / discovery

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) + [Anchor](https://www.anchor-lang.com/docs/installation)
- Node.js 18+

### Build & Test

```bash
npm install
anchor build
anchor test
npm run build
```

### Run CLI Demo

```bash
node packages/cli/dist/index.js happy-path
```

## Architecture

### Accounts (PDAs)

| Account | Purpose |
|---------|---------|
| `JobEscrow` | Job metadata + state machine |
| `job_vault` | Lamports custody for job payment |
| `AgentReputation` | Agent stats, ratings, stake |
| `rep_vault` | Reputation stake custody |
| `Rating` | Per-job rating record |
| `Arbiter` | Arbiter registration + stake |
| `arbiter_vault` | Arbiter stake custody |
| `Dispute` | Dispute metadata + voting state |
| `dispute_vault` | Dispute fee custody |
| `VoteCommitment` | Commit-reveal vote per arbiter |
| `treasury` | Protocol fee collection |

### Job Lifecycle

```
Created → Active → Submitted → Completed
                ↘ Disputed → Resolved
                ↘ Expired (deadline passed)
```

### Reputation Scoring

Score is computed from:
- Completion rate (jobs completed / total)
- Dispute outcomes (+2 win, -5 loss)
- Volume bonuses (5/20/50 jobs)
- Stake bonuses (1/10/50 SOL)
- Time decay multiplier (30d=1.0, 90d=0.95, 180d=0.90, 360d=0.80, >360d=0.70)

## Project Structure

```
├── programs/trustnet/     # Anchor program (Rust)
│   └── src/
│       ├── instructions/  # Instruction handlers
│       ├── state/         # Account definitions
│       └── utils/         # Helpers, constants, errors
├── packages/
│   ├── sdk/               # TypeScript SDK
│   └── cli/               # CLI demo flows
└── tests/                 # Anchor integration tests
```

## Configuration

Protocol constants in `programs/trustnet/src/utils/constants.rs`:

| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_REPUTATION_STAKE_LAMPORTS` | 0.1 SOL | Minimum reputation stake |
| `MIN_ARBITER_STAKE_LAMPORTS` | 1 SOL | Minimum arbiter stake |
| `PROTOCOL_FEE_BPS` | 10 (0.1%) | Fee on completed jobs |
| `DISPUTE_FEE_BPS` | 100 (1%) | Fee for raising disputes |
| `GRACE_PERIOD_SECONDS` | 1 hour | Grace period after deadline |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
