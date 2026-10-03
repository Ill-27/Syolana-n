import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../partners/entitlements.json", import.meta.url);
const partnerId = String(process.env.PARTNER_ID || "").trim();
const active = String(process.env.ACTIVE || "") === "true";
const hostname = String(process.env.HOSTNAME || "").trim();

if (!partnerId) throw new Error("PARTNER_ID is required");

const registry = JSON.parse(await readFile(file, "utf8"));
registry.version = Number(registry.version || 1);
registry.partners ||= {};

const previous = registry.partners[partnerId] || {};
const allowedHosts = Array.isArray(previous.allowedHosts)
  ? previous.allowedHosts.filter(Boolean)
  : [];

if (hostname && !allowedHosts.includes(hostname)) allowedHosts.push(hostname);

registry.partners[partnerId] = {
  ...previous,
  partnerId,
  active,
  features: previous.features || {
    themes: true,
    banner: true,
    player: true,
    zen: true,
    publishing: true
  },
  allowedHosts
};

await writeFile(file, JSON.stringify(registry, null, 2) + "\n", "utf8");
console.log(`${partnerId}: active=${active}; hosts=${allowedHosts.join(",")}`);
