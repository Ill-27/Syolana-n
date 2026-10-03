import { readFile, writeFile } from "node:fs/promises";

const [partnerId, action, host = "", note = ""] = process.argv.slice(2);
if (!partnerId) throw new Error("partner_id is required");
if (!["enable", "disable"].includes(action))
  throw new Error("action must be enable or disable");

const path = "partners/entitlements.json";
const data = JSON.parse(await readFile(path, "utf8"));
data.version = Number(data.version || 1) + 1;
data.partners ||= {};

const current = data.partners[partnerId] || {
  partnerId,
  active: false,
  features: {
    themes: true,
    banner: true,
    player: true,
    zen: true,
    publishing: true,
  },
  allowedHosts: [],
};

current.partnerId = partnerId;
current.active = action === "enable";
current.manualState = current.active ? "on" : "off";
current.updatedAt = new Date().toISOString();

if (host.trim()) {
  const hosts = host
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  current.allowedHosts = [...new Set([...(current.allowedHosts || []), ...hosts])];
}

if (note.trim()) current.note = note.trim();

data.partners[partnerId] = current;
await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      partnerId,
      active: current.active,
      allowedHosts: current.allowedHosts,
      updatedAt: current.updatedAt,
    },
    null,
    2,
  ),
);
