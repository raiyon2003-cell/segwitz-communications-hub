#!/usr/bin/env node
/**
 * Sync .env.local variables to Vercel production.
 * Run: npx vercel login && npm run vercel:env
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { resolve } from "path";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const TARGET = process.argv[2] || "production";

const SKIP = new Set(["NODE_ENV", "VERCEL", "VERCEL_ENV"]);

function parseEnvFile(path) {
  const vars = {};
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return result;
}

if (!existsSync(ENV_FILE)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const vars = parseEnvFile(ENV_FILE);

// Ensure production app URL
vars.NEXT_PUBLIC_APP_URL =
  vars.NEXT_PUBLIC_APP_URL?.includes("localhost")
    ? "https://segwitz-communications-hub.vercel.app"
    : vars.NEXT_PUBLIC_APP_URL || "https://segwitz-communications-hub.vercel.app";

console.log(`Linking project and syncing ${Object.keys(vars).length} vars to ${TARGET}...`);

const link = run("npx", ["vercel", "link", "--yes"], "");
if (link.status !== 0) {
  console.error("vercel link failed. Run: npx vercel login");
  console.error(link.stderr || link.stdout);
  process.exit(1);
}

let ok = 0;
let fail = 0;

for (const [key, value] of Object.entries(vars)) {
  if (SKIP.has(key) || !value) continue;

  // Remove existing var first (ignore errors)
  run("npx", ["vercel", "env", "rm", key, TARGET, "--yes"], "");

  const add = run(
    "npx",
    ["vercel", "env", "add", key, TARGET, "--force"],
    value
  );

  if (add.status === 0) {
    console.log(`✓ ${key}`);
    ok++;
  } else {
    console.error(`✗ ${key}:`, add.stderr || add.stdout);
    fail++;
  }
}

console.log(`\nDone: ${ok} synced, ${fail} failed.`);
console.log("Redeploy with: npx vercel --prod");
