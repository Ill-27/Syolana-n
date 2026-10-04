const bundleURL = new URL("./living-sea.bundle.gz?v=20261004-sea-v2", import.meta.url);
if (typeof DecompressionStream !== "function") {
  throw new Error("Living Sea requires a modern browser with DecompressionStream support.");
}
const response = await fetch(bundleURL, { cache: "no-cache" });
if (!response.ok || !response.body) throw new Error("Living Sea bundle unavailable");
const source = await new Response(
  response.body.pipeThrough(new DecompressionStream("gzip"))
).text();
const moduleURL = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let theme;
try {
  ({ default: theme } = await import(moduleURL));
} finally {
  setTimeout(() => URL.revokeObjectURL(moduleURL), 0);
}
export default theme;
