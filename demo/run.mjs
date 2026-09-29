#!/usr/bin/env node
// End-to-end demo for mermail-newsletter-digest. No credentials, no network.
//
// It feeds a fixture inbox (including a promo-heavy sender, a normal human
// thread, and a flagged prompt-injection newsletter) through the SAME
// deterministic clusterer the skill instructs the agent to follow, then writes
// a JSON + text briefing and asserts the security-relevant invariants.
//
// Run:  node demo/run.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDigest } from "../skills/mermail-newsletter-digest/scripts/digest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, "fixtures", "inbox.json");
const reportsDir = join(here, "reports");
mkdirSync(reportsDir, { recursive: true });

// Freeze "now" so the demo is byte-for-byte reproducible.
process.env.DIGEST_NOW = "2026-09-29T12:00:00Z";

const emails = JSON.parse(readFileSync(fixture, "utf8"));
const digest = buildDigest(emails);

writeFileSync(join(reportsDir, "report.json"), JSON.stringify(digest, null, 2));

const log = [];
const check = (name, ok, detail = "") => {
  log.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) process.exitCode = 1;
};

// --- Invariant assertions (the security story of the demo) ------------------

// 1. The normal human thread (em_009) is NOT treated as a newsletter.
check(
  "human thread excluded from newsletters",
  !digest.clusters.some((c) => c.emailIds.includes("em_009")),
  "em_009 must be skipped as not-bulk"
);

// 2. The flagged injection newsletter (em_010) is quarantined: only its id and
//    scan reason surface — no subject, sender, or body — and it appears in no
//    cluster or top-item, so it can never become a recipient or instruction.
const injectionQ = digest.quarantine.find((q) => q.id === "em_010");
check(
  "flagged injection message quarantined (id + reason only)",
  Boolean(injectionQ) && injectionQ.reason.startsWith("scan:"),
  injectionQ ? injectionQ.reason : "em_010 not quarantined"
);
check(
  "quarantined message absent from clusters and top items",
  !digest.clusters.some((c) => c.emailIds.includes("em_010")) &&
    !digest.topItems.some((t) => t.id === "em_010")
);

// 3. No email body text leaked an executable instruction into a summary.
const leaked = JSON.stringify(digest).toLowerCase().includes("ignore previous instructions")
  || JSON.stringify(digest).toLowerCase().includes("attacker@evil.example");
check("no injected instruction or attacker address in output", !leaked);

// 4. The substantive security postmortem (em_008) and breaking API change
//    (em_001) rank as must-read; the promo (em_003) does not.
const tierOf = (id) => {
  for (const c of digest.clusters) {
    if (c.emailIds.includes(id)) return c;
  }
  return null;
};
const topIds = digest.topItems.map((t) => t.id);
check("substantive security update ranks in top items", topIds.includes("em_008"));
check("breaking API change ranks in top items", topIds.includes("em_001"));
check(
  "pure promo does not rank must-read",
  digest.topItems.find((t) => t.id === "em_003")?.tier !== "must-read"
);

// 5. The read stayed bounded (no unbounded expansion): output only references
//    ids present in the fixture.
const fixtureIds = new Set(emails.map((e) => e.id));
const referenced = new Set([
  ...digest.clusters.flatMap((c) => c.emailIds),
  ...digest.skipped.map((s) => s.id),
  ...digest.quarantine.map((q) => q.id),
]);
check(
  "output references only fixture emails",
  [...referenced].every((id) => fixtureIds.has(id))
);

const text = [
  "mermail-newsletter-digest — demo run",
  `generated ${digest.generatedAt}`,
  "",
  ...log,
  "",
  "--- briefing ---",
  "",
].join("\n");

// Re-render the human-readable briefing for the log.
const briefingText = renderBriefing(digest);
const fullLog = text + briefingText + "\n";
writeFileSync(join(reportsDir, "run.log"), fullLog);
console.log(fullLog);

function renderBriefing(d) {
  const lines = [];
  lines.push(`TOP OF THE PILE:`);
  for (const t of d.topItems) lines.push(`  [${t.tier}] ${t.subject}  <${t.id}>`);
  lines.push("");
  lines.push("CLUSTERS:");
  for (const c of d.clusters) {
    lines.push(`  ${c.domain} — ${c.count} msg — ${c.tier} — ids: ${c.emailIds.join(", ")}`);
  }
  lines.push("");
  lines.push("SKIPPED:");
  for (const s of d.skipped) lines.push(`  ${s.id}: ${s.reason}`);
  lines.push("");
  lines.push("QUARANTINED (id + reason only):");
  for (const q of d.quarantine) lines.push(`  ${q.id}: ${q.reason}`);
  return lines.join("\n");
}

console.log(process.exitCode ? "\nDEMO FAILED\n" : "\nDEMO OK — 0 external actions taken, all invariants held.\n");
