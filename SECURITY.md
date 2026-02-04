# Security Policy

## ⚠️ Hackathon Code Warning

This is hackathon-grade code. It has **not** been audited and should **not** be used with real funds on mainnet.

Known limitations:
- Arbiter selection is MVP-style (passed via remaining accounts)
- Reputation forgetting uses piecewise approximation, not continuous decay
- No formal verification or fuzzing performed

## Reporting Vulnerabilities

If you discover a security issue:

1. **Do not** open a public issue
2. Email the maintainer directly or open a private security advisory on GitHub
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We'll respond within 48 hours and work with you on responsible disclosure.

## Scope

Security concerns we care about:
- Fund loss or theft from escrow vaults
- Reputation manipulation or sybil attacks
- Arbiter collusion or vote manipulation
- Denial of service on critical paths

Out of scope:
- Issues in test/demo code only
- Issues requiring unrealistic economic conditions
- Social engineering attacks
