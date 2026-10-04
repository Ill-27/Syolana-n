const bundleURL = new URL("./living-sea.bundle.gz", import.meta.url);
if (typeof DecompressionStream !== "function") {
  throw new Error("Living Sea requires a modern browser with DecompressionStream support.");
}
const response = await fetch(bundleURL, { cache: "force-cache" });
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
