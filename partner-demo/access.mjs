// This validates the integration response for correct behaviour. The server
// remains responsible for issuing authorised, short-lived asset URLs.
export function safeHttps(value, base) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, base);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash
      ? url.href : "";
  } catch { return ""; }
}

export function normalizedAccess(data, config, { hostname, href, now = Date.now() }) {
  const demo = config?.environment === "demo";
  if (!demo && config?.environment !== "production") return { active: false };
  if (data?.active !== true) return { active: false };
  const hosts = Array.isArray(data.allowedHosts) ? data.allowedHosts : [];
  if ((!demo && !hosts.length) ||
      (hosts.length && !hosts.some(h => typeof h === "string" && h.toLowerCase() === hostname.toLowerCase())))
    return { active: false };
  const expiresAt = data.expiresAt || data.assets?.expiresAt || null;
  const expires = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
  if (!demo && (data.partnerId !== config.partnerId || !Number.isFinite(expires) ||
      expires <= now || expires > now + 15 * 60 * 1000 + 30 * 1000))
    return { active: false };

  const assets = data.assets || {};
  const checked = value => safeHttps(value, href);
  let coreUrl = checked(assets.coreUrl || data.coreUrl || "");
  let assetBase = checked(assets.baseUrl || data.assetBase || "");
  if (demo && !coreUrl && assetBase) coreUrl = new URL("partner-core.js", assetBase).href;
  if (demo && !coreUrl) coreUrl = checked(config.coreUrl || "");
  if (!coreUrl) return { active: false };
  if (!assetBase) assetBase = new URL("./", coreUrl).href;

  let styleUrls;
  if (Array.isArray(assets.styles)) {
    styleUrls = assets.styles.map(checked);
    if (styleUrls.some(url => !url)) return { active: false };
  } else if (demo) {
    styleUrls = ["assets/fonts/fonts.css", "styles.css", "partner-core.css"]
      .map(path => new URL(path, assetBase).href);
  } else return { active: false };

  return { active: true, features: data.features || (demo ? config.features : {}) || {},
    coreUrl, assetBase, styleUrls, expiresAt, expires,
    version: String(data.version || config.coreVersion || "live") };
}

// Never add cache-busting parameters to provider-signed URLs.
export function assetRequestUrl(url, access, environment) {
  if (environment !== "demo") return url;
  const parsed = new URL(url);
  if ([...parsed.searchParams.keys()].some(key => /signature|credential|token|expires/i.test(key)))
    return url;
  parsed.searchParams.set("v", access.version);
  return parsed.href;
}
