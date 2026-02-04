# Contributing to TrustNet

Thanks for your interest in contributing!

## Development Setup

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor](https://www.anchor-lang.com/docs/installation) (v0.30+)
- [Node.js](https://nodejs.org/) (v18+)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/whoknowsmann/trust-net.git
cd trust-net

# Install dependencies
npm install

# Build the Anchor program
anchor build

# Run tests
anchor test

# Build TypeScript packages
npm run build
```

## Code Style

- **Rust**: Follow standard Rust conventions, run `cargo fmt` and `cargo clippy`
- **TypeScript**: Use the project's TypeScript config, prefer explicit types

## Pull Requests

1. Fork the repo and create a feature branch
2. Make your changes with clear commit messages
3. Ensure tests pass (`anchor test`)
4. Open a PR with a description of what changed and why

## Reporting Issues

Open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Solana/Anchor versions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
