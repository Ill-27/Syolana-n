import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist/public");
let checked = 0;
for (const name of await readdir(root)) {
  if (!name.endsWith(".js")) continue;
  const source = await readFile(path.join(root,name),"utf8");
  for (const m of source.matchAll(/\bimport\s*(?:[^;\n]*?\bfrom\s*|\(\s*)?["'](\.\.?\/[^"']+)["']/g)) {
    const target = path.resolve(root,m[1].split("?")[0]);
    assert(target.startsWith(root + path.sep), "Module escapes public bundle: " + m[1]);
    await access(target);
    checked++;
  }
}
assert(checked > 10, "No meaningful import graph was checked");
console.log("PASS: public bundle contains all " + checked + " relative module imports.");
