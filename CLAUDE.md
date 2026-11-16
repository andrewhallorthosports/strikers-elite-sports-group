# STRIKERS Elite Sports Group website: guide for Claude

This repository is the static website for the STRIKERS Elite Sports Group, published by
GitHub Pages at https://strikerselitesports.com (custom domain in `CNAME`). There is no
build step, and pushing to `main` deploys the live site.

## Layout

- `index.html`: the homepage.
- One folder per project page, each with its own `index.html` (for example `acl-outcomes/`,
  `ai-in-sem/`, `hybrid-athlete/`, `performance-medicine/`, `retired-athlete-knee-health/`,
  `sem-pillars-fellowship/`, `sports-medicine-event-care/`, `collaborators/`).
- `symposion/workstreams/`: encrypted, passcode-protected Symposion portals. Edit these only
  within the Symposion workflow that builds them; never decrypt, re-encrypt or publish their
  contents by hand.
- `symposion/private/`: an unlisted, password-locked page that is not a portal. Out of scope;
  do not edit.

## Rules

- Research integrity comes first: every number, citation and DOI on a page must match its
  source exactly. Say so when something cannot be verified.
- Embedded base64 images must not be truncated, re-wrapped or altered.
- Publishing rule (AH, 16 Nov 2026): every change goes on a branch with a pull request.
  When AH says "publish" in the session, Claude merges the pull request to `main` itself and
  then checks the live page. Never commit directly to `main`.
- Commits are made under AH's name (Andrew Hall <andrew@andrewhallortho.uk>), and nothing a
  visitor or collaborator sees carries AI wording.
- Never commit secrets, passcodes or API keys.
