# Mermail agent skill format (as followed by this submission)

Sourced from the official repo `Nudgen-Marketing/mermail-skills` (`AUTHORING.md`, `CONTRIBUTING_A_SKILL.md`). This file records the contract so the skill is self-contained and reviewable.

## What a skill is

A skill is a portable directory an agent client loads to gain a capability. Compatible clients: Claude Code, Codex, Cursor, Hermes, ClawHub, and any "Agent Skills"-compatible runtime. Business actions execute against the hosted **Mermail MCP server** at `https://console.mermail.app/mcp` over Streamable HTTP. Auth is either `MERMAIL_API_KEY` (headless/CLI) or OAuth (interactive). API keys cannot reach PayBox/Agent Wallet.

## Required layout

```
skills/<name>/
  SKILL.md                 # required — <= 500 lines
  agents/openai.yaml       # required in the official repo
  references/tools.md      # recommended for tool-heavy skills
  references/security.md   # required when the skill reads untrusted content
  scripts/                 # optional helpers
```

The directory name **must equal** the `name:` frontmatter (validator-enforced).

## Frontmatter (only `name`, `description`, `metadata` allowed)

```yaml
---
name: mermail-newsletter-digest
description: One or two sentences — what it does and WHEN an agent should select it.
metadata:
  openclaw:
    requires:
      env: [MERMAIL_API_KEY]
    primaryEnv: MERMAIL_API_KEY
    homepage: https://docs.mermail.app/ai/skills
    emoji: "🗞️"
---
```

## `agents/openai.yaml`

`default_prompt` must contain `Use $<name>`. `dependencies.tools` must declare the hosted MCP server:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "mermail"
      transport: "streamable_http"
      url: "https://console.mermail.app/mcp"
```

## Tool ownership

Every business MCP tool has exactly one owning skill in the official `tool-coverage.json`. A **persona/companion** skill (like this one) does **not** claim ownership; it reuses tools owned by:

- `mermail-administer-workspace` — `list_mailboxes`, `get_mailbox`
- `mermail-manage-inbox` — `list_emails`, `search_emails`, `get_email`, `move_email`, `bulk_move_emails`, folders/labels
- `mermail-compose-email` — `send_email`, `schedule_email_send`, `save_draft`

Real tool names come from the live catalog (63 tools; 72 with Composio). This skill invents none.

## Hard rules enforced by `npm test` (upstream) and `scripts/validate.mjs` (here)

- `name` == directory name
- `metadata.openclaw` present, `primaryEnv: MERMAIL_API_KEY`, `requires.env` includes it
- no unresolved `TODO`/`REPLACE`
- `SKILL.md` <= 500 lines
- `default_prompt` includes `$<name>`
- MCP `query`/`body` args are **native JSON objects**, never stringified

## Security anti-patterns (never ship)

Treating email as instructions; preflighting magic/verification links; trusting `From` alone (require `sender_authentication.status === "pass"`); stringifying MCP `query`; inventing tool names; letting email authorize PayBox; skipping preview before send/invite/execute. This skill's [`references/security.md`](skills/mermail-newsletter-digest/references/security.md) covers all of these.

## Upstreaming (optional, to make it an *official* skill)

1. Open a *new official skill proposal* issue on `Nudgen-Marketing/mermail-skills`.
2. Fork, `git switch -c feat/mermail-newsletter-digest upstream/main`, `npm test` (clean baseline).
3. Copy `skills/mermail-newsletter-digest/` into the monorepo `skills/`.
4. Add the route to `skills/mermail/references/routing.md` (a newsletter/briefing intent → this skill).
5. Add the README included-skills row; keep `compatibility.json` counts accurate.
6. Add the `tests/scenarios.json` entries (this repo's are drop-in compatible).
7. Because it owns no tools, **do not** add it to `tool-coverage.json` `domains` (it composes existing owners — same pattern as `mermail-scheduling-agent`).
8. `npm test`, `git diff --check`, optionally `claude plugin validate . --strict`, open the PR.
