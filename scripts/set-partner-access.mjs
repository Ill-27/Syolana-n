import { readFile, writeFile } from "node:fs/promises";

const [partnerId, state] = process.argv.slice(2);
if (!partnerId || !/^[a-z0-9._-]{2,90}$/i.test(partnerId)) {
  throw new Error("Valid partner id is required");
}
if (!["active", "inactive"].includes(state)) {
  throw new Error('State must be "active" or "inactive"');
}

const file = new URL("../partners/entitlements.json", import.meta.url);
const data = JSON.parse(await readFile(file, "utf8"));
const record = data?.partners?.[partnerId];
if (!record) throw new Error("Unknown partner: " + partnerId);

record.active = state === "active";
record.updatedAt = new Date().toISOString();
data.version = Number(data.version || 0) + 1;

await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(partnerId + " => " + state);
