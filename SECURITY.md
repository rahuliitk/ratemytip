# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in RateMyTip, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@ratemytip.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix and disclosure:** Within 30 days (coordinated disclosure)

## Scope

The following are in scope:
- The RateMyTip web application (ratemytip.com)
- API endpoints (`/api/v1/*`, `/api/admin/*`)
- Authentication and authorization
- Data integrity (tip immutability, score calculation)
- Injection vulnerabilities (SQL, XSS, etc.)

The following are out of scope:
- Third-party services (Twitter API, YouTube API, Yahoo Finance)
- Social engineering attacks
- Denial of service attacks
- Issues in dependencies (report to the upstream project)

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | Yes |
| Older releases | No |

## Recognition

We appreciate responsible disclosure. Contributors who report valid vulnerabilities will be acknowledged in our release notes (unless they prefer to remain anonymous).
