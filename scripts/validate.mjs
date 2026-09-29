#!/usr/bin/env node
// Local validator mirroring the Nudgen-Marketing/mermail-skills AUTHORING.md
// contract for a single skill. This is a companion-repo convenience check; the
// authoritative validator remains `npm test` inside the official monorepo when
// opening a PR. Run: node scripts/validate.mjs

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = join(root, "skills", "mermail-newsletter-digest");
const errors = [];
const ok = [];
const req = (cond, msg) => (cond ? ok.push(msg) : errors.push(msg));

// --- required files ---
for (const f of [
  "SKILL.md",
  "agents/openai.yaml",
  "references/tools.md",
  "references/security.md",
]) {
  req(existsSync(join(skillDir, f)), `exists: ${f}`);
}

const skillMd = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const openai = readFileSync(join(skillDir, "agents", "openai.yaml"), "utf8");

// --- frontmatter parse (minimal, no deps) ---
const fm = skillMd.match(/^---\n([\s\S]*?)\n---/);
req(Boolean(fm), "SKILL.md has YAML frontmatter");
const fmText = fm ? fm[1] : "";

const nameMatch = fmText.match(/^name:\s*(.+)$/m);
req(Boolean(nameMatch), "frontmatter has name");
const name = nameMatch ? nameMatch[1].trim() : "";
req(name === "mermail-newsletter-digest", `name equals directory name (got "${name}")`);

req(/^description:\s*.+/m.test(fmText), "frontmatter has description");
req(/primaryEnv:\s*MERMAIL_API_KEY/.test(fmText), "metadata.openclaw.primaryEnv is MERMAIL_API_KEY");
req(/-\s*MERMAIL_API_KEY/.test(fmText), "requires.env includes MERMAIL_API_KEY");
req(/openclaw:/.test(fmText), "metadata.openclaw present");

// allowed top-level frontmatter keys only: name, description, metadata
const topKeys = [...fmText.matchAll(/^([a-zA-Z_]+):/gm)].map((m) => m[1]);
const disallowed = topKeys.filter((k) => !["name", "description", "metadata"].includes(k));
// metadata sub-keys are indented, so top-level match only catches column-0 keys
req(disallowed.length === 0, `only name/description/metadata at top level (extra: ${disallowed.join(",") || "none"})`);

// --- content rules ---
const lineCount = skillMd.split("\n").length;
req(lineCount <= 500, `SKILL.md <= 500 lines (got ${lineCount})`);
req(!/\bTODO\b|\bREPLACE\b/.test(skillMd), "no unresolved TODO/REPLACE in SKILL.md");

// --- openai.yaml rules ---
req(new RegExp(`default_prompt:.*\\$${name}`).test(openai), `default_prompt includes $${name}`);
req(/https:\/\/console\.mermail\.app\/mcp/.test(openai), "openai.yaml points at hosted MCP url");
req(/transport:\s*"?streamable_http"?/.test(openai), "openai.yaml transport is streamable_http");

// --- references link + untrusted-data language ---
req(/references\/tools\.md/.test(skillMd), "SKILL.md links references/tools.md");
req(/references\/security\.md/.test(skillMd), "SKILL.md links references/security.md");
req(/untrusted data/i.test(skillMd), "SKILL.md states untrusted-data handling");

// --- no stringified query anti-pattern in references ---
const toolsMd = readFileSync(join(skillDir, "references", "tools.md"), "utf8");
req(/native JSON object/i.test(toolsMd), "tools.md requires native JSON objects");

console.log(ok.map((m) => `  ok   ${m}`).join("\n"));
if (errors.length) {
  console.error("\nFAILURES:");
  console.error(errors.map((m) => `  FAIL ${m}`).join("\n"));
  process.exit(1);
}
console.log(`\nvalidate: ${ok.length} checks passed, 0 failures.`);
