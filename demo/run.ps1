# End-to-end demo (no credentials, no network). Requires Node 18+.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
node demo/run.mjs
