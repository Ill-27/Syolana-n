import { readFile, writeFile } from "node:fs/promises";

const [partnerIdRaw, stateRaw, hostsRaw = "", noteRaw = ""] = process.argv.slice(2);
const partnerId = String(partnerIdRaw || "").trim();
const state = String(stateRaw || "").trim().toLowerCase();

if (!/^[a-z0-9][a-z0-9._-]{1,79}$/i.test(partnerId)) {
  throw new Error("Invalid partner id");
}
if (!["on", "off"].includes(state)) {
  throw new Error("Usage: node scripts/set-partner-access.mjs <partnerId> on|off [hostsCsv] [note]");
}

const file = new URL("../partners/entitlements.json", import.meta.url);
const data = JSON.parse(await readFile(file, "utf8"));
data.version = Number(data.version || 0) + 1;
data.partners ||= {};

const current = data.partners[partnerId] || {
  active: false,
  allowedHosts: [],
  features: {
    themes: true,
    banner: true,
    player: true,
    zen: true,
    publishing: true,
  },
};

const hosts = String(hostsRaw || "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

if (hosts.length) {
  for (const host of hosts) {
    if (!/^(?:localhost|127\.0\.0\.1|[a-z0-9.-]+)$/i.test(host)) {
      throw new Error("Invalid host: " + host);
    }
  }
  current.allowedHosts = [...new Set(hosts)];
}

current.active = state === "on";
current.manualState = state;
current.manualUpdatedAt = new Date().toISOString();
if (noteRaw) current.manualNote = String(noteRaw).slice(0, 300);

data.partners[partnerId] = current;

await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`${partnerId}: ${current.active ? "enabled" : "disabled"}`);
