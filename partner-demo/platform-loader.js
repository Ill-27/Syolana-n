import { safeHttps as checkedHttps, normalizedAccess as validateAccess,
  assetRequestUrl } from "./access.mjs";

function finishBoot() {
  if (typeof window.__partnerBootDone === "function") {
    window.__partnerBootDone("platform");
    return;
  }

  document.documentElement.classList.remove("partner-booting");
  const boot = document.getElementById("partner-boot");
  if (boot) {
    boot.style.opacity = "0";
    window.setTimeout(() => boot.remove(), 320);
  }
}

async function readJSON(path) {
  try {
    const response = await fetch(path, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function safeHttps(value) {
  return checkedHttps(value, location.href);
}
function normalizedAccess(data, config) {
  return validateAccess(data, config, location);
}

async function entitlement(config) {
  const forcedOff =
    new URLSearchParams(location.search).get("syolana") === "off";

  if (forcedOff || !config || ["off", "inactive"].includes(config.mode)) {
    return { active: false };
  }

  if (config.mode === "preview") {
    const localPreview = ["localhost", "127.0.0.1"].includes(
      location.hostname,
    );

    return localPreview
      ? normalizedAccess(
          {
            active: true,
            features: config.features || {},
            coreUrl: config.coreUrl || "",
          },
          { ...config, environment: "demo" },
        )
      : { active: false };
  }

  if (config.mode !== "active") return { active: false };

  const endpoint = safeHttps(config.licenseEndpoint);
  if (!endpoint) return { active: false };

  try {
    const url = new URL(endpoint);
    url.searchParams.set("partnerId", config.partnerId || "");
    url.searchParams.set("hostname", location.hostname);

    const response = await fetch(url, {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    });

    if (!response.ok) return { active: false };

    const data = await response.json();

    if (typeof data?.active === "boolean") {
      return normalizedAccess(data, config);
    }

    // Compatibility only for the current demo registry. Production must
    // return one partner-specific response with short-lived asset URLs.
    const record = data?.partners?.[config.partnerId || ""];
    if (!record?.active) return { active: false };

    return normalizedAccess(
      {
        active: true,
        features: record.features || config.features || {},
        allowedHosts: record.allowedHosts || [],
        coreUrl:
          config.environment === "production"
            ? ""
            : config.coreUrl || "",
      },
      config,
    );
  } catch {
    return { active: false };
  }
}

function loadStyle(url, marker) {
  return new Promise((resolve) => {
    const href = safeHttps(url);
    if (!href) return resolve(false);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.platformRemote = marker;
    link.onload = () => resolve(true);
    link.onerror = () => resolve(false);
    document.head.append(link);
  });
}

function removeRemoteStyles() {
  document
    .querySelectorAll("link[data-platform-remote]")
    .forEach((node) => node.remove());
}

async function bootIntegration() {
  let shellReady = false;
  const onShellReady = () => {
    shellReady = true;
    finishBoot();
  };

  window.addEventListener("syolana:shell-ready", onShellReady, {
    once: true,
  });

  try {
    const [config, partner] = await Promise.all([
      readJSON("./integration.json"),
      readJSON("./partner.json"),
    ]);

    const access = await entitlement(config);

    document.documentElement.dataset.syolana = access.active
      ? "active"
      : "off";

    if (!access.active) return;

    const coreUrl = assetRequestUrl(access.coreUrl, access, config.environment);

    const styles = access.styleUrls.map((url, index) => {
      return loadStyle(assetRequestUrl(url, access, config.environment), "asset-" + index);
    });

    try {
      const modulePromise = import(coreUrl);
      const [module] = await Promise.all([
        modulePromise,
        Promise.all(styles),
      ]);

      if (typeof module.mountPartnerCore !== "function") {
        removeRemoteStyles();
        return;
      }

      const handle = await module.mountPartnerCore({
        partner: partner || {},
        partnerId: config.partnerId || "",
        features: access.features || config.features || {},
        version: access.version,
        assetBase: access.assetBase,
      });

      let checking = false;
      let expiryTimer;

      const revoke = async () => {
        clearTimeout(expiryTimer);
        try { await handle?.destroy?.(); }
        finally {
          removeRemoteStyles();
          document.documentElement.dataset.syolana = "off";
        }
      };

      const revalidate = async () => {
        if (checking) return;
        checking = true;

        try {
          const next = await entitlement(config);

          if (!next.active) {
            await revoke();
            clearInterval(interval);
            document.removeEventListener(
              "visibilitychange",
              onVisibility,
            );
          } else scheduleExpiry(next);
        } catch {
          // A transient network failure does not destroy a working shell.
        } finally {
          checking = false;
        }
      };

      const onVisibility = () => {
        if (!document.hidden) revalidate();
      };

      document.addEventListener("visibilitychange", onVisibility);
      const interval = setInterval(revalidate, 60 * 1000);
      const scheduleExpiry = (current) => {
        clearTimeout(expiryTimer);
        if (config.environment === "production")
          expiryTimer = setTimeout(() => {
            revoke().catch(() => {});
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisibility);
          }, Math.max(0, current.expires - Date.now()));
      };
      scheduleExpiry(access);
    } catch (error) {
      removeRemoteStyles();
      console.warn("Optional immersive layer unavailable", error);
    }
  } finally {
    window.removeEventListener("syolana:shell-ready", onShellReady);
    if (!shellReady) finishBoot();
  }
}

bootIntegration().catch(() => finishBoot());
