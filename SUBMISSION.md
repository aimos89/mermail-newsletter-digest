# Superteam Earn submission — Build and Demo a Mermail Agent Skill

**Skill:** `mermail-newsletter-digest` (community/companion; upstreamable to `Nudgen-Marketing/mermail-skills`)
**Bounty:** Build and Demo a Mermail Agent Skill — 500 USDC
**Prizes:** 1st 250 / 2nd 100 / 3rd 50 / 2× 50 bonus. Winners announced ~Oct 11, 2026.

## One-liner

Turns a noisy Mermail agent inbox of newsletters, product updates, and digests into **one ranked, injection-safe briefing**, then optionally sends a single roll-up after an exact preview and fresh approval. Owns zero MCP tools — composes existing official ones — so it upstreams cleanly.

## Deliverables in this repo

| Item | Path |
| --- | --- |
| Skill (SKILL.md + agents + references) | `skills/mermail-newsletter-digest/` |
| Deterministic clusterer/ranker | `skills/mermail-newsletter-digest/scripts/digest.mjs` |
| Runnable no-credentials demo + assertions | `demo/run.mjs` (`npm run demo`) |
| Demo fixtures (incl. injection message) | `demo/fixtures/inbox.json` |
| Demo evidence (generated) | `demo/reports/report.json`, `demo/reports/run.log` |
| Routing + happy-path + security scenarios | `tests/scenarios.json` |
| Local format validator (AUTHORING.md contract) | `scripts/validate.mjs` (`npm run validate`) |
| Format notes + upstreaming steps | `AGENT_SKILL_NOTES.md` |
| Video script / storyboard | `DEMO_VIDEO_SCRIPT.md` |

## How to verify (Node 18+, no credentials, no network)

```bash
npm test     # 21 validation checks + 8/8 demo invariants → "0 external actions taken"
```

## Why it should win

- **Fills a real gap.** No official skill produces a periodic, subscription-aware, ranked briefing. It composes owned tools instead of duplicating them (same pattern as `mermail-scheduling-agent`).
- **Security-first, provable.** Newsletters are hostile input. The demo proves a flagged injection newsletter is quarantined (id + reason only), no embedded instruction or harvested address leaks, and 0 external actions run.
- **Upstream-ready.** Passes the AUTHORING.md contract; `AGENT_SKILL_NOTES.md` gives exact PR steps; owns no tools so no `tool-coverage.json` conflict.
- **Reproducible.** Frozen clock, zero dependencies, one command.

## Demo video

See `DEMO_VIDEO_SCRIPT.md`. Post on X tagging **@Mermailapp**, then attach the link here. *(Not yet recorded/submitted.)*

## Honest scope notes

- The clustering/ranking is exercised **offline** against fixtures for reproducibility. Live MCP reads use the **exact** official tool names documented in `references/tools.md`; a live walkthrough needs a Mermail **test workspace + API key** (a test key was not used here — never paste one into the repo or the video).
- This is packaged as a **companion** skill. To become *official*, follow the PR steps in `AGENT_SKILL_NOTES.md`. Maintainers ask that large new official skills open a proposal issue first.
