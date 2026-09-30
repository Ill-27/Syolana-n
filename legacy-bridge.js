/* Only trusted, existing A1 lessons use this bridge. No partner HTML runs here. */
(() => {
  "use strict";
  const script = document.currentScript;
  const route = script.dataset.route;
  const embedded =
    window.parent !== window &&
    new URLSearchParams(location.search).get("embed") === "1";
  if (!embedded) {
    const anchor = location.hash.slice(1);
    location.replace(
      "./#/" + route + (anchor ? "/" + encodeURIComponent(anchor) : ""),
    );
    return;
  }
  document.documentElement.classList.add("sy-embedded");
  const send = (value) =>
    parent.postMessage({ syolanaLesson: true, ...value }, location.origin);
  // The parent owns the sole animated background; skip only the two old canvases.
  document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main");
    if (!main) return;
    let lastHeight = 0,
      scheduled = 0;
    function size() {
      scheduled = 0;
      const height = Math.ceil(main.getBoundingClientRect().height + 20);
      if (height !== lastHeight) {
        lastHeight = height;
        send({ height });
      }
    }
    const resize = () => {
      if (!scheduled) scheduled = requestAnimationFrame(size);
    };
    new ResizeObserver(resize).observe(main);
    resize();
    document.fonts?.ready.then(resize);
    document.addEventListener(
      "play",
      (event) => {
        if (event.target instanceof HTMLMediaElement) send({ audio: true });
      },
      true,
    );
    document.addEventListener("click", (event) => {
      if (
        event.target.closest(
          "#audio-btn,#audio-play,.say,.speak,[data-speak],[data-speech-button]",
        )
      )
        send({ audio: true });
      const a = event.target.closest("a");
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (
        (a.getAttribute("href")?.startsWith("#") ||
          url.pathname === location.pathname) &&
        url.hash
      ) {
        event.preventDefault();
        const target = document.getElementById(
          decodeURIComponent(url.hash.slice(1)),
        );
        if (target)
          send({ scroll: target.getBoundingClientRect().top + window.scrollY });
      } else if (
        url.origin === location.origin ||
        url.hostname === "syolana.com"
      ) {
        event.preventDefault();
        send({ navigate: url.pathname + url.hash });
      }
    });
    const originalScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {
      send({ scroll: this.getBoundingClientRect().top + window.scrollY });
    };
    addEventListener("pagehide", () => {
      window.speechSynthesis?.cancel();
      Element.prototype.scrollIntoView = originalScroll;
    });
    addEventListener("message", (event) => {
      if (
        event.source !== parent ||
        event.origin !== location.origin ||
        !event.data?.syolanaHost
      )
        return;
      if (event.data.pauseAudio) {
        for (const id of ["audio-stop", "stop-audio", "stop"])
          document.getElementById(id)?.click();
        document.querySelectorAll("audio,video").forEach((a) => a.pause());
        window.speechSynthesis?.cancel();
      }
      if (event.data.theme) {
        for (const key of [
          "heading",
          "body",
          "accent",
          "dim",
          "surface",
          "radius",
        ]) {
          const value = event.data.theme[key];
          if (typeof value === "string")
            document.documentElement.style.setProperty("--sy-" + key, value);
        }
      }
      if (event.data.anchor) {
        const target = document.getElementById(event.data.anchor);
        if (target)
          send({ scroll: target.getBoundingClientRect().top + window.scrollY });
      }
    });
    send({ ready: true });
  });
})();
