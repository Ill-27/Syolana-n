import {loadCourse,mountAccountPanel,sessionMark,watchSession} from './access.js?v=20261116-current-1';
import {mountCourseBranding} from '../../course-branding.js?v=20261116-current-1';
(() => {
  function _e(a = document) {
    let l = a.body;
    if (!l) return () => {};
    let u = l.classList.contains("syolana-course-protected");
    l.classList.add("syolana-course-protected");
    let r = (g) =>
        g?.nodeType === 1 &&
        !!g.closest(
          'input,textarea,[contenteditable="true"],[data-copy-allowed]',
        ),
      p = (g) => {
        r(g.target) || g.preventDefault();
      },
      h = (g) => {
        r(g.target) ||
          g.target?.closest?.("button,a,select") ||
          g.preventDefault();
      },
      y = (g) => {
        r(g.target) ||
          ((g.ctrlKey || g.metaKey) &&
            ["c", "x", "a"].includes(g.key.toLowerCase()) &&
            g.preventDefault());
      };
    return (
      a.addEventListener("copy", p, !0),
      a.addEventListener("cut", p, !0),
      a.addEventListener("selectstart", p, !0),
      a.addEventListener("contextmenu", h, !0),
      a.addEventListener("keydown", y, !0),
      () => {
        (a.removeEventListener("copy", p, !0),
          a.removeEventListener("cut", p, !0),
          a.removeEventListener("selectstart", p, !0),
          a.removeEventListener("contextmenu", h, !0),
          a.removeEventListener("keydown", y, !0),
          u || l.classList.remove("syolana-course-protected"));
      }
    );
  }
  var an =
    ".pair,.day-card,.trainer-card,.coverage-card,.variant-card,.practice-body,.lesson-body,.word-body";
  async function sn() {
    return { brand: "Syolana", domain: "syolana.com" };
  }
  async function St({
    root: a = document,
    course: l = "",
    personalMark: u = "",
    cards: r = !0,
  } = {}) {
    let p = await sn(),
      h = a.ownerDocument || a;
    if (!h.getElementById("syolana-course-attribution-style")) {
      let Y = h.createElement("link");
      ((Y.id = "syolana-course-attribution-style"),
        (Y.rel = "stylesheet"),
        (Y.href =
          "data:text/css;base64,LyogQ291cnNlIGF0dHJpYnV0aW9uIGlzIHZpc3VhbCBvbmx5OiBuZXZlciBhIHNwZWVjaCBvciBhY2Nlc3NpYmlsaXR5IGZyYWdtZW50LiAqLwpib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCxib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCAqe3VzZXItc2VsZWN0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lfQpib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCAucGFpcixib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCAubGVzc29uLWJvZHksYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgLndvcmQtYm9keXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZX0KYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgaW5wdXQsYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgdGV4dGFyZWEsYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgW2NvbnRlbnRlZGl0YWJsZT0idHJ1ZSJdLGJvZHkuc3lvbGFuYS1jb3Vyc2UtcHJvdGVjdGVkIFtkYXRhLWNvcHktYWxsb3dlZF0sYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgW2RhdGEtY29weS1hbGxvd2VkXSAqe3VzZXItc2VsZWN0OnRleHQ7LXdlYmtpdC11c2VyLXNlbGVjdDp0ZXh0Oy13ZWJraXQtdG91Y2gtY2FsbG91dDpkZWZhdWx0fQoKLyogVGhlIGNvdXJzZSBpdHNlbGYgbGl2ZXMgaW5zaWRlIGFuIGlmcmFtZSwgc28gdGhlIHBhcmVudCBzaXRlJ3MgZGlzcGxheS1mb250IHJ1bGVzCiAgIGNhbm5vdCByZWFjaCBpdC4gS2VlcCBoYW5kd3JpdGluZyBvbmx5IG9uIGxhcmdlIGVkaXRvcmlhbCBoZWFkaW5ncyBoZXJlOyBjb250cm9scywKICAgdGFicywgdm9jYWJ1bGFyeSBhbmQgYm9keSBjb3B5IHJldGFpbiB0aGUgY291cnNlIGludGVyZmFjZSBmb250cy4gKi8KLnZpZXctaGVhZGluZyBoMSwuY291cnNlLWhlcm8gaDEsLmxlc3Nvbi1oZXJvIGgxLC52aWV3PmhlYWRlcj5oMSwKLnZpZXctaGVhZGluZyBoMiwuY291cnNlLWhlcm8gaDIsLmxlc3Nvbi1oZXJvIGgyLC5zZWN0aW9uLWhlYWRpbmc+aDJ7CiAgZm9udC1mYW1pbHk6IlN5b2xhbmEgU2NyaXB0IiwiQ29ybW9yYW50IEdhcmFtb25kIixHZW9yZ2lhLHNlcmlmIWltcG9ydGFudDsKICBmb250LXdlaWdodDo0MDAhaW1wb3J0YW50OwogIGxldHRlci1zcGFjaW5nOi4wMWVtIWltcG9ydGFudDsKICBsaW5lLWhlaWdodDoxLjI0IWltcG9ydGFudDsKfQoKLmNvdXJzZS1hdHRyaWJ1dGlvbi1sYXllcntwb3NpdGlvbjpmaXhlZDtpbnNldDoxMTJweCAydncgMTU2cHg7ei1pbmRleDo5MDtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLG1pbm1heCgwLDFmcikpO2dyaWQtdGVtcGxhdGUtcm93czpyZXBlYXQoNCxtaW5tYXgoMCwxZnIpKTtnYXA6MTZweDtwb2ludGVyLWV2ZW50czpub25lIWltcG9ydGFudDt1c2VyLXNlbGVjdDpub25lO292ZXJmbG93OmhpZGRlbjtjb250YWluOmxheW91dCBwYWludH0KLmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJre3Bvc2l0aW9uOnJlbGF0aXZlO2FsaWduLXNlbGY6Y2VudGVyO2p1c3RpZnktc2VsZjpjZW50ZXI7bWF4LXdpZHRoOjEwMCU7dGV4dC1hbGlnbjpjZW50ZXI7dHJhbnNmb3JtOnJvdGF0ZSgtMTdkZWcpO2NvbG9yOnZhcigtLXBhbmVsLXRleHQsdmFyKC0tY291cnNlLWluaywjZWVlOGZhKSk7b3BhY2l0eTouMTU7Zm9udDo0MDAgY2xhbXAoMTZweCwxLjZ2dywyM3B4KS8xLjMgIlN5b2xhbmEgU2NyaXB0IiwiU2Vnb2UgUHJpbnQiLGN1cnNpdmU7bGV0dGVyLXNwYWNpbmc6LjAyNWVtO3doaXRlLXNwYWNlOm5vd3JhcDtmaWx0ZXI6ZHJvcC1zaGFkb3coMCAwIDdweCAjYjJhNGQ1MjEpO3BvaW50ZXItZXZlbnRzOm5vbmUhaW1wb3J0YW50fQouY291cnNlLWF0dHJpYnV0aW9uLW1hcms6bnRoLWNoaWxkKDJuKXt0cmFuc2Zvcm06cm90YXRlKC0xN2RlZykgdHJhbnNsYXRlWSgxNXB4KTtvcGFjaXR5Oi4xMn0KLmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJrIHNtYWxse2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDozcHg7Zm9udDo0MDAgOHB4LzEuNCBzeXN0ZW0tdWksc2Fucy1zZXJpZjtsZXR0ZXItc3BhY2luZzouMDllbTtvcGFjaXR5Oi44fQouY291cnNlLWF0dHJpYnV0aW9uLW1hcms6OmFmdGVye2NvbnRlbnQ6IiI7cG9zaXRpb246YWJzb2x1dGU7aW5zZXQ6MDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMDBkZWcsdHJhbnNwYXJlbnQgMTglLCNlN2Y4ZmYxYyA0OCUsdHJhbnNwYXJlbnQgNzglKTtiYWNrZ3JvdW5kLXNpemU6MjYwJSAxMDAlO2FuaW1hdGlvbjpjb3Vyc2UtYXR0cmlidXRpb24tZ2xvdyAyNHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7bWl4LWJsZW5kLW1vZGU6c2NyZWVufQouY291cnNlLWF0dHJpYnV0ZWQtY2FyZHtwb3NpdGlvbjpyZWxhdGl2ZTtpc29sYXRpb246aXNvbGF0ZX0KLmNvdXJzZS1hdHRyaWJ1dGVkLWNhcmQ6OmFmdGVye2NvbnRlbnQ6YXR0cihkYXRhLXN5b2xhbmEtYXR0cmlidXRpb24pO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjE4cHg7Ym90dG9tOjEwcHg7bWF4LXdpZHRoOmNhbGMoMTAwJSAtIDMwcHgpO2ZvbnQ6NDAwIDEzcHgvMS40ICJTeW9sYW5hIFNjcmlwdCIsIlNlZ29lIFByaW50IixjdXJzaXZlO2xldHRlci1zcGFjaW5nOi4wMmVtO2NvbG9yOnZhcigtLWNvdXJzZS1pbmssdmFyKC0tcGFuZWwtdGV4dCwjZWVlOGZhKSk7b3BhY2l0eTouMTk7cG9pbnRlci1ldmVudHM6bm9uZTt1c2VyLXNlbGVjdDpub25lO3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt6LWluZGV4OjJ9Ci5jb3Vyc2UtYXR0cmlidXRlZC1jYXJkIC5wYWlyLWFjdGlvbnN7bWFyZ2luLWJvdHRvbTo5cHh9CkBrZXlmcmFtZXMgY291cnNlLWF0dHJpYnV0aW9uLWdsb3d7MCUsMTAwJXtiYWNrZ3JvdW5kLXBvc2l0aW9uOjE1MCUgMDtvcGFjaXR5Oi4yfTUwJXtiYWNrZ3JvdW5kLXBvc2l0aW9uOi0xMDAlIDA7b3BhY2l0eTouNzV9fQpAbWVkaWEobWF4LXdpZHRoOjcwMHB4KXsudmlldy1oZWFkaW5nIGgxLC5jb3Vyc2UtaGVybyBoMSwubGVzc29uLWhlcm8gaDEsLnZpZXc+aGVhZGVyPmgxe2ZvbnQtc2l6ZTpjbGFtcCgyLjdyZW0sMTJ2dyw0LjNyZW0pIWltcG9ydGFudH0uY291cnNlLWF0dHJpYnV0aW9uLWxheWVye2luc2V0OjEwNXB4IDRweCAxNjBweDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSk7Z3JpZC10ZW1wbGF0ZS1yb3dzOnJlcGVhdCg1LG1pbm1heCgwLDFmcikpO2dhcDoxMnB4fS5jb3Vyc2UtYXR0cmlidXRpb24tbWFya3tmb250LXNpemU6MTdweH0uY291cnNlLWF0dHJpYnV0aW9uLW1hcms6bnRoLWNoaWxkKG4rMTEpe2Rpc3BsYXk6bm9uZX0uY291cnNlLWF0dHJpYnV0aW9uLW1hcmsgc21hbGx7Zm9udC1zaXplOjdweH0uY291cnNlLWF0dHJpYnV0ZWQtY2FyZDo6YWZ0ZXJ7Zm9udC1zaXplOjEycHg7cmlnaHQ6MTJweDtib3R0b206OHB4fX0KQG1lZGlhKG1heC1oZWlnaHQ6NDgwcHgpey5jb3Vyc2UtYXR0cmlidXRpb24tbGF5ZXJ7aW5zZXQ6NzZweCAydncgODBweDtncmlkLXRlbXBsYXRlLXJvd3M6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9LmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJrOm50aC1jaGlsZChuKzcpe2Rpc3BsYXk6bm9uZX19CkBtZWRpYShwcmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7LmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJrOjphZnRlcnthbmltYXRpb246bm9uZTtvcGFjaXR5Oi4yfX0KQG1lZGlhIHByaW50ey5jb3Vyc2UtYXR0cmlidXRpb24tbGF5ZXJ7aW5zZXQ6MDt6LWluZGV4OjEwMDB9LmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJre2NvbG9yOiM1NTU7b3BhY2l0eTouMn0uY291cnNlLWF0dHJpYnV0ZWQtY2FyZDo6YWZ0ZXJ7Y29sb3I6IzU1NTtvcGFjaXR5Oi4zNX19Cgpib2R5LnplbiAuY291cnNlLWF0dHJpYnV0aW9uLWxheWVye2Rpc3BsYXk6bm9uZX0KCi8qIFJlYWRhYmxlIHByb251bmNpYXRpb24gYW5kIHRvcGljIGxhYmVscyBpbnNpZGUgZW1iZWRkZWQgbGVzc29ucy4gKi8KLmVtYmVkZGVkIC50b3BpYy1udW1iZXIsLmVtYmVkZGVkIC5wYWlyIC5pcGEsLmVtYmVkZGVkIC5wcmVjaXNlLWlwYXtvcGFjaXR5OjEhaW1wb3J0YW50fQouZW1iZWRkZWQgOmlzKC5jYXJkLWxhYmVsLC5pbnN0cnVjdGlvbi1sYWJlbCwucHJvZ3Jlc3Mtcm93LC50b3BpYy1jb3B5IHNtYWxsLC53b3JkLWhlYWQgLnJ1LC5wYWlyIC5ydSl7Y29sb3I6dmFyKC0tcGFuZWwtbXV0ZWQsdmFyKC0tY291cnNlLW11dGVkKSl9Cgo="),
        h.head.append(Y));
    }
    let y = /^S-[a-f0-9]{12}$/.test(u) ? u : "",
      g = !1,
      X = _e(h),
      b = new Map();
    function N() {
      for (let Y of h.querySelectorAll("iframe.lesson-frame")) {
        if (b.has(Y)) continue;
        let G = { dispose: null, onload: null };
        ((G.onload = () => {
          G.dispose?.();
          try {
            let i = Y.contentDocument;
            if (i?.body) {
              if (!i.getElementById("syolana-course-protection-style")) {
                let m = i.createElement("link");
                ((m.id = "syolana-course-protection-style"),
                  (m.rel = "stylesheet"),
                  (m.href =
                    "data:text/css;base64,LyogQ291cnNlIGF0dHJpYnV0aW9uIGlzIHZpc3VhbCBvbmx5OiBuZXZlciBhIHNwZWVjaCBvciBhY2Nlc3NpYmlsaXR5IGZyYWdtZW50LiAqLwpib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCxib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCAqe3VzZXItc2VsZWN0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lfQpib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCAucGFpcixib2R5LnN5b2xhbmEtY291cnNlLXByb3RlY3RlZCAubGVzc29uLWJvZHksYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgLndvcmQtYm9keXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZX0KYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgaW5wdXQsYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgdGV4dGFyZWEsYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgW2NvbnRlbnRlZGl0YWJsZT0idHJ1ZSJdLGJvZHkuc3lvbGFuYS1jb3Vyc2UtcHJvdGVjdGVkIFtkYXRhLWNvcHktYWxsb3dlZF0sYm9keS5zeW9sYW5hLWNvdXJzZS1wcm90ZWN0ZWQgW2RhdGEtY29weS1hbGxvd2VkXSAqe3VzZXItc2VsZWN0OnRleHQ7LXdlYmtpdC11c2VyLXNlbGVjdDp0ZXh0Oy13ZWJraXQtdG91Y2gtY2FsbG91dDpkZWZhdWx0fQoKLyogVGhlIGNvdXJzZSBpdHNlbGYgbGl2ZXMgaW5zaWRlIGFuIGlmcmFtZSwgc28gdGhlIHBhcmVudCBzaXRlJ3MgZGlzcGxheS1mb250IHJ1bGVzCiAgIGNhbm5vdCByZWFjaCBpdC4gS2VlcCBoYW5kd3JpdGluZyBvbmx5IG9uIGxhcmdlIGVkaXRvcmlhbCBoZWFkaW5ncyBoZXJlOyBjb250cm9scywKICAgdGFicywgdm9jYWJ1bGFyeSBhbmQgYm9keSBjb3B5IHJldGFpbiB0aGUgY291cnNlIGludGVyZmFjZSBmb250cy4gKi8KLnZpZXctaGVhZGluZyBoMSwuY291cnNlLWhlcm8gaDEsLmxlc3Nvbi1oZXJvIGgxLC52aWV3PmhlYWRlcj5oMSwKLnZpZXctaGVhZGluZyBoMiwuY291cnNlLWhlcm8gaDIsLmxlc3Nvbi1oZXJvIGgyLC5zZWN0aW9uLWhlYWRpbmc+aDJ7CiAgZm9udC1mYW1pbHk6IlN5b2xhbmEgU2NyaXB0IiwiQ29ybW9yYW50IEdhcmFtb25kIixHZW9yZ2lhLHNlcmlmIWltcG9ydGFudDsKICBmb250LXdlaWdodDo0MDAhaW1wb3J0YW50OwogIGxldHRlci1zcGFjaW5nOi4wMWVtIWltcG9ydGFudDsKICBsaW5lLWhlaWdodDoxLjI0IWltcG9ydGFudDsKfQoKLmNvdXJzZS1hdHRyaWJ1dGlvbi1sYXllcntwb3NpdGlvbjpmaXhlZDtpbnNldDoxMTJweCAydncgMTU2cHg7ei1pbmRleDo5MDtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgzLG1pbm1heCgwLDFmcikpO2dyaWQtdGVtcGxhdGUtcm93czpyZXBlYXQoNCxtaW5tYXgoMCwxZnIpKTtnYXA6MTZweDtwb2ludGVyLWV2ZW50czpub25lIWltcG9ydGFudDt1c2VyLXNlbGVjdDpub25lO292ZXJmbG93OmhpZGRlbjtjb250YWluOmxheW91dCBwYWludH0KLmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJre3Bvc2l0aW9uOnJlbGF0aXZlO2FsaWduLXNlbGY6Y2VudGVyO2p1c3RpZnktc2VsZjpjZW50ZXI7bWF4LXdpZHRoOjEwMCU7dGV4dC1hbGlnbjpjZW50ZXI7dHJhbnNmb3JtOnJvdGF0ZSgtMTdkZWcpO2NvbG9yOnZhcigtLXBhbmVsLXRleHQsdmFyKC0tY291cnNlLWluaywjZWVlOGZhKSk7b3BhY2l0eTouMTU7Zm9udDo0MDAgY2xhbXAoMTZweCwxLjZ2dywyM3B4KS8xLjMgIlN5b2xhbmEgU2NyaXB0IiwiU2Vnb2UgUHJpbnQiLGN1cnNpdmU7bGV0dGVyLXNwYWNpbmc6LjAyNWVtO3doaXRlLXNwYWNlOm5vd3JhcDtmaWx0ZXI6ZHJvcC1zaGFkb3coMCAwIDdweCAjYjJhNGQ1MjEpO3BvaW50ZXItZXZlbnRzOm5vbmUhaW1wb3J0YW50fQouY291cnNlLWF0dHJpYnV0aW9uLW1hcms6bnRoLWNoaWxkKDJuKXt0cmFuc2Zvcm06cm90YXRlKC0xN2RlZykgdHJhbnNsYXRlWSgxNXB4KTtvcGFjaXR5Oi4xMn0KLmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJrIHNtYWxse2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDozcHg7Zm9udDo0MDAgOHB4LzEuNCBzeXN0ZW0tdWksc2Fucy1zZXJpZjtsZXR0ZXItc3BhY2luZzouMDllbTtvcGFjaXR5Oi44fQouY291cnNlLWF0dHJpYnV0aW9uLW1hcms6OmFmdGVye2NvbnRlbnQ6IiI7cG9zaXRpb246YWJzb2x1dGU7aW5zZXQ6MDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMDBkZWcsdHJhbnNwYXJlbnQgMTglLCNlN2Y4ZmYxYyA0OCUsdHJhbnNwYXJlbnQgNzglKTtiYWNrZ3JvdW5kLXNpemU6MjYwJSAxMDAlO2FuaW1hdGlvbjpjb3Vyc2UtYXR0cmlidXRpb24tZ2xvdyAyNHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7bWl4LWJsZW5kLW1vZGU6c2NyZWVufQouY291cnNlLWF0dHJpYnV0ZWQtY2FyZHtwb3NpdGlvbjpyZWxhdGl2ZTtpc29sYXRpb246aXNvbGF0ZX0KLmNvdXJzZS1hdHRyaWJ1dGVkLWNhcmQ6OmFmdGVye2NvbnRlbnQ6YXR0cihkYXRhLXN5b2xhbmEtYXR0cmlidXRpb24pO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjE4cHg7Ym90dG9tOjEwcHg7bWF4LXdpZHRoOmNhbGMoMTAwJSAtIDMwcHgpO2ZvbnQ6NDAwIDEzcHgvMS40ICJTeW9sYW5hIFNjcmlwdCIsIlNlZ29lIFByaW50IixjdXJzaXZlO2xldHRlci1zcGFjaW5nOi4wMmVtO2NvbG9yOnZhcigtLWNvdXJzZS1pbmssdmFyKC0tcGFuZWwtdGV4dCwjZWVlOGZhKSk7b3BhY2l0eTouMTk7cG9pbnRlci1ldmVudHM6bm9uZTt1c2VyLXNlbGVjdDpub25lO3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt6LWluZGV4OjJ9Ci5jb3Vyc2UtYXR0cmlidXRlZC1jYXJkIC5wYWlyLWFjdGlvbnN7bWFyZ2luLWJvdHRvbTo5cHh9CkBrZXlmcmFtZXMgY291cnNlLWF0dHJpYnV0aW9uLWdsb3d7MCUsMTAwJXtiYWNrZ3JvdW5kLXBvc2l0aW9uOjE1MCUgMDtvcGFjaXR5Oi4yfTUwJXtiYWNrZ3JvdW5kLXBvc2l0aW9uOi0xMDAlIDA7b3BhY2l0eTouNzV9fQpAbWVkaWEobWF4LXdpZHRoOjcwMHB4KXsudmlldy1oZWFkaW5nIGgxLC5jb3Vyc2UtaGVybyBoMSwubGVzc29uLWhlcm8gaDEsLnZpZXc+aGVhZGVyPmgxe2ZvbnQtc2l6ZTpjbGFtcCgyLjdyZW0sMTJ2dyw0LjNyZW0pIWltcG9ydGFudH0uY291cnNlLWF0dHJpYnV0aW9uLWxheWVye2luc2V0OjEwNXB4IDRweCAxNjBweDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSk7Z3JpZC10ZW1wbGF0ZS1yb3dzOnJlcGVhdCg1LG1pbm1heCgwLDFmcikpO2dhcDoxMnB4fS5jb3Vyc2UtYXR0cmlidXRpb24tbWFya3tmb250LXNpemU6MTdweH0uY291cnNlLWF0dHJpYnV0aW9uLW1hcms6bnRoLWNoaWxkKG4rMTEpe2Rpc3BsYXk6bm9uZX0uY291cnNlLWF0dHJpYnV0aW9uLW1hcmsgc21hbGx7Zm9udC1zaXplOjdweH0uY291cnNlLWF0dHJpYnV0ZWQtY2FyZDo6YWZ0ZXJ7Zm9udC1zaXplOjEycHg7cmlnaHQ6MTJweDtib3R0b206OHB4fX0KQG1lZGlhKG1heC1oZWlnaHQ6NDgwcHgpey5jb3Vyc2UtYXR0cmlidXRpb24tbGF5ZXJ7aW5zZXQ6NzZweCAydncgODBweDtncmlkLXRlbXBsYXRlLXJvd3M6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9LmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJrOm50aC1jaGlsZChuKzcpe2Rpc3BsYXk6bm9uZX19CkBtZWRpYShwcmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7LmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJrOjphZnRlcnthbmltYXRpb246bm9uZTtvcGFjaXR5Oi4yfX0KQG1lZGlhIHByaW50ey5jb3Vyc2UtYXR0cmlidXRpb24tbGF5ZXJ7aW5zZXQ6MDt6LWluZGV4OjEwMDB9LmNvdXJzZS1hdHRyaWJ1dGlvbi1tYXJre2NvbG9yOiM1NTU7b3BhY2l0eTouMn0uY291cnNlLWF0dHJpYnV0ZWQtY2FyZDo6YWZ0ZXJ7Y29sb3I6IzU1NTtvcGFjaXR5Oi4zNX19Cgpib2R5LnplbiAuY291cnNlLWF0dHJpYnV0aW9uLWxheWVye2Rpc3BsYXk6bm9uZX0KCi8qIFJlYWRhYmxlIHByb251bmNpYXRpb24gYW5kIHRvcGljIGxhYmVscyBpbnNpZGUgZW1iZWRkZWQgbGVzc29ucy4gKi8KLmVtYmVkZGVkIC50b3BpYy1udW1iZXIsLmVtYmVkZGVkIC5wYWlyIC5pcGEsLmVtYmVkZGVkIC5wcmVjaXNlLWlwYXtvcGFjaXR5OjEhaW1wb3J0YW50fQouZW1iZWRkZWQgOmlzKC5jYXJkLWxhYmVsLC5pbnN0cnVjdGlvbi1sYWJlbCwucHJvZ3Jlc3Mtcm93LC50b3BpYy1jb3B5IHNtYWxsLC53b3JkLWhlYWQgLnJ1LC5wYWlyIC5ydSl7Y29sb3I6dmFyKC0tcGFuZWwtbXV0ZWQsdmFyKC0tY291cnNlLW11dGVkKSl9Cgo="),
                  i.head.append(m));
              }
              G.dispose = _e(i);
            }
          } catch {}
        }),
          Y.addEventListener("load", G.onload),
          b.set(Y, G),
          G.onload());
      }
    }
    let C = () => p.domain + (y ? " \xB7 " + y : ""),
      V = h.createElement("div");
    ((V.className = "course-attribution-layer"),
      V.setAttribute("aria-hidden", "true"),
      V.setAttribute("role", "presentation"),
      (V.inert = !0));
    let Q = [];
    if (window.parent === window) {
      for (let Y = 0; Y < 12; Y++) {
        let G = h.createElement("span"),
          i = h.createElement("small");
        ((G.className = "course-attribution-mark"),
          G.append(h.createTextNode(p.domain), i),
          (i.textContent = y || l || p.brand),
          V.append(G),
          Q.push(i));
      }
      h.body.append(V);
    }
    function I() {
      if (!r || g) return;
      let Y = a.querySelectorAll ? a : h;
      for (let G of Y.querySelectorAll(an))
        (!G.classList.contains("pair") && G.querySelector(".pair")) ||
          (G.classList.add("course-attributed-card"),
          (G.dataset.syolanaAttribution = C()));
    }
    let J = !1,
      k = new MutationObserver(() => {
        !J &&
          !g &&
          ((J = !0),
          requestAnimationFrame(() => {
            ((J = !1), I(), N());
          }));
      });
    (I(), N(), k.observe(h.body, { childList: !0, subtree: !0 }));
    function S(Y) {
      if (
        Y.origin !== location.origin ||
        !Y.data?.syolanaLesson ||
        !/^S-[a-f0-9]{12}$/.test(Y.data.courseAttribution || "")
      )
        return;
      let G = h.querySelector("iframe.lesson-frame");
      !G ||
        Y.source !== G.contentWindow ||
        ((y = Y.data.courseAttribution),
        Q.forEach((i) => {
          i.textContent = y;
        }),
        I());
    }
    return (
      h.defaultView.addEventListener("message", S),
      () => {
        ((g = !0), k.disconnect(), V.remove(), X());
        for (let [Y, G] of b)
          (Y.removeEventListener("load", G.onload), G.dispose?.());
        h.defaultView.removeEventListener("message", S);
      }
    );
  }
  async function Mt() {
    return loadCourse();
  }
  function Bt(...args) { return mountAccountPanel(...args); }
  function et() { return sessionMark(); }
  function Ht(...args) { return watchSession(...args); }
  function on(a, l) {
    if (String(l).toLowerCase().replace("_", "-") !== "fr-fr")
      throw new Error("Выберите французский голос Франции.");
    let u = String(a || "").normalize("NFC");
    if (/[А-Яа-яЁё]/.test(u))
      throw new Error("Во французском фрагменте осталось слово другого языка.");
    if (/[ɐ-ʯˈˌː̃]/.test(u))
      throw new Error("Транскрипция предназначена для чтения глазами.");
    return u
      .replace(/[\/\\|_*<>={}\[\]«»“”]/g, " ")
      .replace(/[—–]/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function jt(a, l, u = "") {
    let r = (h) => String(h).toLowerCase().replaceAll("_", "-");
    let base = r(a).split("-")[0];
    let p = l.filter((h) => r(h.lang).split("-")[0] === base);
    return (
      p.find((h) => h.voiceURI === u) ||
      p.find((h) => r(h.lang) === r(a) && h.localService) ||
      p.find((h) => r(h.lang) === r(a)) ||
      p.find((h) => r(h.lang) === base) ||
      p.find((h) => h.localService) ||
      p[0] ||
      null
    );
  }
  const speechSegments = new WeakMap();
  function tt(a, l = "en", u = 1) {
    const r = a.pair;
    if (!r) return [];
    let cache = speechSegments.get(r);
    if (!cache) speechSegments.set(r, (cache = {}));
    if (!cache[l]) {
      const segments = [];
      const texts = [];
      if (r.en) texts.push({text:on(r.speak || r.en, "fr-FR"),lang:"fr-FR"});
      if (l === "both" && r.ru && !r.blindListening) texts.push({text:String(r.ru).replace(/[<>={}\[\]]/g," ").replace(/\s+/g," ").trim(),lang:"ru-RU"});
      for (const {text,lang} of texts) {
        for (const sentence of text.split(/(?<=[.!?])\s+/u)) {
          let part = "";
          for (const word of sentence.split(/\s+/u)) {
            if (!word) continue;
            if (part && part.length + word.length + 1 > 180) {
              segments.push({text:part,lang,pair:r});
              part = "";
            }
            part += (part ? " " : "") + word;
          }
          if (part) segments.push({text:part,lang,pair:r});
        }
      }
      cache[l] = segments;
    }
    return Array.from({length:Math.min(3,Math.max(1,u))},()=>cache[l]).flat();
  }
  function fe(a, l = 1, u = "en", r = 1) {
    return tt(a, u, r).reduce((p, h) => {
      let y = h.text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)?.length || 1;
      return (
        p + Math.max(0.55, (y * 60) / ((h.lang === "ru-RU" ? 135 : 145) * l)) + 0.45
      );
    }, 0);
  }
  var ye = class {
    constructor({
      synth: l = globalThis.speechSynthesis,
      Utterance: u = globalThis.SpeechSynthesisUtterance,
      voices: r = () => l?.getVoices() || [],
      settings: p = () => ({ rate: 1, repeat: 1, voices: {} }),
      onChange: h = () => {},
      onUnit: y = () => {},
      onProgress: g = () => {},
      now: X = () => performance.now(),
    } = {}) {
      (Object.assign(this, {
        synth: l,
        Utterance: u,
        voices: r,
        settings: p,
        onChange: h,
        onUnit: y,
        onProgress: g,
        now: X,
      }),
        (this.units = []),
        (this.unitIndex = 0),
        (this.segmentIndex = 0),
        (this.token = 0),
        (this.status = "idle"),
        (this.activeMs = 0),
        (this.activeStart = 0),
        (this.timer = null),
        (this.gap = null),
        (this.utterance = null),
        (this.error = ""));
    }
    elapsed() {
      return (
        (this.activeMs +
          (this.status === "playing" ? this.now() - this.activeStart : 0)) /
        1e3
      );
    }
    snapshot() {
      return {
        status: this.status,
        unitIndex: this.unitIndex,
        segmentIndex: this.segmentIndex,
        total: this.units.length,
        elapsed: this.elapsed(),
        error: this.error,
      };
    }
    emit() {
      this.onChange(this.snapshot());
    }
    haltTimers() {
      (clearTimeout(this.timer),
        clearTimeout(this.gap),
        (this.timer = this.gap = null));
    }
    freeze() {
      this.status === "playing" &&
        (this.activeMs += this.now() - this.activeStart);
    }
    start(
      l,
      {
        mode: u = "en",
        unitIndex: r = 0,
        segmentIndex: p = 0,
        elapsed: h = 0,
        loop: y = !1,
        repeat: g,
      } = {},
    ) {
      if ((this.stop(!1), !this.synth || !this.Utterance))
        return (
          this.fail(
            "В этом браузере недоступна озвучка. Материал можно читать.",
          ),
          !1
        );
      ((this.units = l),
        (this.mode = u),
        (this.loop = y),
        (this.repeat = g ?? this.settings().repeat ?? 1),
        (this.unitIndex = Math.min(Math.max(0, r), l.length)),
        (this.segmentIndex = Math.max(0, p)),
        (this.activeMs = h * 1e3),
        (this.error = ""));
      try {
        let b = (u === "both" ? ["fr-FR","ru-RU"] : ["fr-FR"])
          .filter((N) => this.voices().length && !jt(N, this.voices(), this.settings().voices?.[N]));
        if (b.length)
          return (
            this.fail(
              "Не найден " +
                b
                  .map(
                    (N) =>
                      ({ "fr-FR": "французский", "ru-RU": "русский" })[N] +
                      " голос",
                  )
                  .join(", ") +
                ". Обновите голоса или добавьте нужный язык в настройках речи устройства. Для прослушивания без русского перевода выберите «Только французский».",
            ),
            !1
          );
      } catch (X) {
        return (this.fail(X.message), !1);
      }
      return !l.length || this.unitIndex === l.length
        ? ((this.status = "ended"), this.emit(), !0)
        : ((this.status = "playing"),
          (this.activeStart = this.now()),
          this.emit(),
          this.next(),
          !0);
    }
    next() {
      if (this.status !== "playing") return;
      while(this.mode === "en" && this.segmentIndex === 0 && this.unitIndex > 0 && this.unitIndex < this.units.length && this.units[this.unitIndex].pair.en === this.units[this.unitIndex-1].pair.en) this.unitIndex++;
      if (this.unitIndex >= this.units.length)
        if (this.loop)
          ((this.unitIndex = 0),
            (this.segmentIndex = 0),
            this.onProgress(this.snapshot()));
        else {
          (this.freeze(),
            (this.status = "ended"),
            this.emit(),
            this.onProgress(this.snapshot()));
          return;
        }
      let l = this.units[this.unitIndex],
        u;
      try {
        u = tt(l, this.mode, this.repeat);
      } catch (b) {
        this.fail(b.message);
        return;
      }
      if (this.segmentIndex >= u.length) {
        (this.unitIndex++,
          (this.segmentIndex = 0),
          this.onProgress(this.snapshot()),
          this.next());
        return;
      }
      let r = u[this.segmentIndex],
        p = this.settings(),
        h = jt(r.lang, this.voices(), p.voices?.[r.lang]);
      if (!h && this.voices().length) {
        this.fail("Нужный голос стал недоступен. Обновите список голосов или выберите прослушивание только на французском.");
        return;
      }
      let y;
      try {
        y = new this.Utterance(r.text);
      } catch {
        this.fail("Не удалось подготовить озвучку. Место сохранено.");
        return;
      }
      let g = ++this.token;
      ((this.utterance = y),
        (y.lang = r.lang),
        (h && (y.voice = h)),
        (y.rate = Math.max(0.55, Math.min(1.5, p.rate || 1))),
        (y.pitch = 1),
        (y.volume = 1),
        this.onUnit(l, this.unitIndex, r),
        this.emit(),
        (y.onend = () => {
          g !== this.token ||
            this.status !== "playing" ||
            (clearTimeout(this.timer),
            (this.timer = null),
            this.segmentIndex++,
            this.onProgress(this.snapshot()),
            (this.gap = setTimeout(() => {
              ((this.gap = null), this.next());
            }, 450)));
        }),
        (y.onerror = (b) => {
          g !== this.token ||
            this.status !== "playing" ||
            this.fail(
              "Браузер остановил голос: " +
                ({
                  "not-allowed": "нужен повторный запуск кнопкой",
                  network: "нет связи с сервисом голоса",
                  "voice-unavailable": "голос недоступен",
                  "audio-busy": "звук занят другим приложением",
                  "synthesis-failed": "не удалось прочитать фразу",
                }[b.error] || "фраза не была дочитана") +
                ". Место сохранено; можно продолжить.",
            );
        }));
      let X = Math.max(8, (r.text.split(/\s+/).length * 60) / (95 * y.rate));
      this.timer = setTimeout(
        () => {
          g === this.token &&
            this.status === "playing" &&
            this.fail(
              "Голос перестал отвечать. Место сохранено. Нажмите \xABПродолжить\xBB, чтобы повторить текущую фразу.",
            );
        },
        Math.min(180, X * 2 + 15) * 1e3,
      );
      try {
        this.synth.speak(y);
      } catch {
        this.fail(
          "Не удалось начать озвучку. Место сохранено; повторите запуск.",
        );
      }
    }
    pause() {
      this.status === "playing" &&
        (this.freeze(),
        (this.status = "paused"),
        this.token++,
        this.haltTimers(),
        this.synth?.cancel(),
        this.emit(),
        this.onProgress(this.snapshot()));
    }
    resume() {
      ["paused", "error", "stopped"].includes(this.status) &&
        ((this.error = ""),
        (this.status = "playing"),
        (this.activeStart = this.now()),
        this.emit(),
        this.next());
    }
    stop(l = !0) {
      (this.freeze(),
        (this.status = "stopped"),
        this.token++,
        this.haltTimers(),
        this.synth?.cancel(),
        l && (this.emit(), this.onProgress(this.snapshot())));
    }
    seek(l) {
      let u = this.status === "playing";
      (this.pause(),
        this.token++,
        this.haltTimers(),
        this.synth?.cancel(),
        (this.unitIndex = Math.min(Math.max(0, l), this.units.length)),
        (this.segmentIndex = 0),
        u
          ? ((this.status = "playing"),
            (this.activeStart = this.now()),
            this.next())
          : this.emit(),
        this.onProgress(this.snapshot()));
    }
    fail(l) {
      (this.freeze(),
        (this.status = "error"),
        (this.error = l),
        this.token++,
        this.haltTimers(),
        this.synth?.cancel(),
        this.emit(),
        this.onProgress(this.snapshot()));
    }
    dispose() {
      this.stop(!1);
    }
  };
  function Fe(a) {
    return [
      { id: "alphabet", title: "Алфавит", description:"Слушайте названия букв по порядку и повторяйте. Затем продиктуйте своё имя по буквам.", introFr:"Écoutez les lettres dans l'ordre et répétez. Ensuite, épelez votre prénom.", pairs: a.alphabet },
      ...a.repetition,
    ];
  }
  function q(a, l, u = "") {
    return {
      id: "fr-explanation-" + a,
      en: l,
      ru: u,
      ipa: "",
      phoneticIPA: "",
      lang: "fr-FR",
      tag: "Пояснение",
    };
  }
  function assessmentPairs(a) {
    const found=[];
    function walk(value) {
      if(Array.isArray(value)) value.forEach(walk);
      else if(value && typeof value==="object") {
        if(value.id && value.en && value.lang) found.push(value);
        else Object.values(value).forEach(walk);
      }
    }
    walk(a.assessment);
    return found;
  }
  function zt(a, l, u, r) {
    let p = new Set([u.version, ...(u.progressCompatibility?.versions || [])]);
    if (
      !a ||
      !l ||
      a.version !== l.version ||
      !p.has(a.version) ||
      !Array.isArray(a.ids)
    )
      return null;
    let h = Number.isInteger(l.unitIndex) && l.unitIndex >= 0 ? l.unitIndex : 0,
      y = [],
      g = new Set(),
      X = 0;
    if (
      (a.ids.forEach((N, C) => {
        let V = r.map.get(N);
        V && !g.has(N) && (g.add(N), C < h && X++, y.push(V));
      }),
      !y.length || X >= y.length)
    )
      return null;
    let b = a.version === u.version;
    return {
      units: y,
      unitIndex: X,
      segmentIndex: b ? Math.max(0, l.segmentIndex || 0) : 0,
      elapsed: b ? Math.max(0, l.elapsed || 0) : 0,
    };
  }
  function nt(a, { rate: l = 1, repeat: u = 1, target: r = 1800 } = {}, p) {
    let h = [],
      y = new Map(),
      g = [],
      X = p ?? Fe(a);
    function b(i, m, v, f = "", M = "") {
      if (y.has(i.id)) return y.get(i.id);
      let O = { pair: i, kind: m, section: v, explanation: f, owner: M };
      return (y.set(i.id, O), h.push(O), O);
    }
    let N = (i) => fe(i, l, "en", u);
    function C(i) {
      for (let m of X.filter((v) => i.includes(v.id))) {
        let v = m.pairs.filter((T) => !y.has(T.id)),
          f = [],
          M = 0,
          O = () => {
            (f.length &&
              g.push({
                section: {
                  id: "repeat-" + m.id,
                  title: m.title,
                  area: "repetition",
                },
                units: f,
              }),
              (f = []),
              (M = 0));
          };
        for (let T of v) {
          let oe = b(T, "rule", "repeat-" + m.id),
            te = N(oe);
          (M + te > r * 0.22 && O(), f.push(oe), (M += te));
        }
        O();
      }
    }
    for (let i of a.rules) {
      let m = [];
      for (let [v, f] of i.items.entries()) {
        f.bodyFr
          ? m.push(
              b(q("rule-" + i.id + "-" + v, f.bodyFr, f.body), "rule", i.id),
            )
          : f.instruction && m.push(b(f.instruction, "rule", i.id, f.body));
        for (let M of f.pairs) m.push(b(M, "rule", i.id));
      }
      if (i.id === "read-alphabet")
        for (let v of a.alphabet) m.push(b(v, "rule", i.id));
      if (["read-vowels", "read-consonants"].includes(i.id))
        for (let v of a.phonetics.filter((f) =>
          i.id === "read-consonants"
            ? f.type === "Согласный"
            : f.type !== "Согласный",
        ))
          (v.mouthFr &&
            m.push(b(q("sound-" + v.id, v.mouthFr, v.mouth), "rule", i.id)),
            m.push(b(v.example, "rule", i.id, v.mouth)));
      (g.push({ section: i, units: m }),
        i.id === "numbers" &&
          C([
            "numbers",
            "ordinals",
            "time",
            "calendar",
            "dates",
            "prices",
            "measurements",
          ]),
        i.id === "contacts" && C(["contacts"]),
        i.id === "weather" && C(["weather"]),
        i.id === "perfect-duration" && C(["duration", "tense-patterns"]),
        i.id === "necessity" && C(["modal-patterns"]),
        i.id === "verb-gerund" && C(["verb-patterns"]),
        i.id === "comparison" && C(["comparison-patterns"]));
    }
    C(X.filter((i) => i.pairs.some((m) => !y.has(m.id))).map((i) => i.id));
    let V = a.vocabulary.map((i) => ({
        word: i,
        units: [
          b(i.head, "word", "vocabulary", "", i.id),
          ...(i.genderPair ? [b(i.genderPair, "word", "vocabulary", "", i.id)] : []),
          ...(i.formGroups || i.forms).map((m) => b(m, "word", "vocabulary", "", i.id)),
          ...i.examples.map((m) => b(m, "word", "vocabulary", "", i.id)),
        ],
      })),
      Q = [];
    for (let [i, m] of a.variants.entries())
      Q.push([
        b(m.uk, "comparison", "variants"),
        b(m.us, "comparison", "variants"),
        ...(m.noteFr
          ? [b(q("variant-" + i, m.noteFr, m.note), "comparison", "variants")]
          : []),
      ]);
    for (let i of a.practice)
      Q.push(
        [
          ...(i.taskFr ? [q("task-" + i.id, i.taskFr, i.task)] : []),
          ...i.pairs,
          ...(i.model ? [i.model] : []),
        ].map((m) => b(m, "practice", "practice")),
      );
    for (const item of a.coverage || []) Q.push([b(item.pair,"overview","coverage")]);
    let I = h.reduce((i, m) => i + N(m), 0),
      J = Math.max(2, Math.ceil(I / r)),
      k = Array.from({ length: J }, (i, m) => ({
        id: "day-" + (m + 1),
        number: m + 1,
        rules: [],
        words: [],
        extras: [],
        units: [],
        seconds: 0,
      })),
      S = g.filter((i) => i.section.area === "reading"),
      Y = g.filter((i) => i.section.area !== "reading");
    (k[0].rules.push(...S),
      Y.forEach((i, m) =>
        k[Math.min(J - 1, 1 + Math.floor((m * (J - 1)) / Y.length))].rules.push(
          i,
        ),
      ),
      k.forEach((i) => {
        ((i.units = i.rules.flatMap((m) => m.units)),
          (i.seconds = i.units.reduce((m, v) => m + N(v), 0)));
      }));
    let G = 0;
    for (let i = 0; i < J; i++) {
      let m = k[i];
      for (; G < V.length;) {
        let v = V[G],
          f = v.units.reduce((O, T) => O + N(T), 0),
          M = k
            .slice(i + 1)
            .reduce((O, T) => O + Math.max(0, r - T.seconds), 0);
        if (m.seconds + f > r && i < J - 1 && m.words.length && M > 0) break;
        (m.words.push(v.word), m.units.push(...v.units), (m.seconds += f), G++);
      }
    }
    for (let i of Q) {
      let m = i.reduce((f, M) => f + N(M), 0),
        v = k.find((f) => f.seconds + m <= r) || k.at(-1);
      (v.extras.push(...i), v.units.push(...i), (v.seconds += m));
    }
    for(const pair of assessmentPairs(a)) y.set(pair.id,{pair,kind:"assessment",section:"assessment"});
    for(const trainer of X) if(trainer.introFr) {
      const pair=q("trainer-intro-"+trainer.id,trainer.introFr,trainer.description||"");
      y.set(pair.id,{pair,kind:"trainer-intro",section:"repeat-"+trainer.id});
    }
    return {
      map: y,
      days: k,
      all: k.flatMap((i) => i.units),
      totalSeconds: I,
      rate: l,
      repeat: u,
    };
  }
  var Ot = new WeakMap();
  function At(a, l = 1) {
    let u = a.units,
      r = Ot.get(u);
    if (
      !r ||
      r.rate !== l ||
      r.mode !== a.mode ||
      r.repeat !== a.repeat ||
      r.length !== u.length
    ) {
      let p = new Float64Array(u.length + 1);
      for (let h = u.length - 1; h >= 0; h--)
        p[h] = p[h + 1] + fe(u[h], l, a.mode, a.repeat);
      ((r = {
        rate: l,
        mode: a.mode,
        repeat: a.repeat,
        length: u.length,
        seconds: p,
      }),
        Ot.set(u, r));
    }
    return r.seconds[a.unitIndex] ?? 0;
  }
  var ie = [
    ["days", "Курс по дням"],
    ["reading", "Чтение и звуки"],
    ["grammar", "Правила и конструкции"],
    ["vocabulary", "Словарь"],
    ["variants", "Франция и другие страны"],
    ["trainers", "Повторение до автоматизма"],
    ["practice", "Говорите, читайте и пишите"],
    ["assessment", "Итоговая самопроверка"],
    ["coverage", "Что входит в A1"],
  ];
  function ke(a) {
    return (
      "[" +
      String(a || "")
        .trim()
        .replace(/^[/\[]|[/\]]$/g, "") +
      "]"
    );
  }
  function Dt(a) {
    return String(a || "").replace(
      /\/([A-Za-zəɪʊɑɒɔɜθðʃʒŋˈˌːæʌɡɛɹɚɝʔɾ .()-]+)\//g,
      "[$1]",
    );
  }
  function _(a) {
    return a.title.replace(/^\d+\.\s*/, "");
  }
  function at(a) {
    let l = Math.abs(a),
      u = l % 10,
      r = l % 100,
      p =
        r >= 11 && r <= 14
          ? "словарных статей"
          : u === 1
            ? "словарная статья"
            : u >= 2 && u <= 4
              ? "словарные статьи"
              : "словарных статей";
    return a + " " + p;
  }
  function st(a, l) {
    let u = [...new Set(a.rules.map((h) => _(h.section)))],
      p = [...new Set(a.words.map((h) => h.group))]
        .map((h) => l.find((y) => y.id === h)?.title)
        .filter(Boolean);
    return {
      title:
        a.number === 1
          ? "Сначала — чтение и звуки"
          : u[0] || "Закрепляем слова и фразы",
      topics: u,
      vocabulary: p,
      extras: [
        ...new Set(
          a.extras.map((h) =>
            h.kind === "comparison"
              ? "региональные варианты французского"
              : "бытовые ситуации",
          ),
        ),
      ],
    };
  }
  function Et(a, l, u, r) {
    let p = String(a || "days").replace(/^#/, "");
    if (ie.some(([b]) => b === p)) return { key: p, type: p };
    let h = u.days.find((b) => b.id === p);
    if (h) return { key: p, type: "day", day: h };
    let y = l.rules.find((b) => b.id === p);
    if (y) return { key: p, type: "rule", rule: y };
    let g = r.find((b) => "repeat-" + b.id === p);
    if (g) return { key: p, type: "trainer", trainer: g };
    let X = l.vocabulary.find((b) => b.id === p);
    return X
      ? { key: p, type: "word", word: X }
      : { key: "days", type: "days" };
  }
  var t = (a, l = "", u = "") => {
      let r = document.createElement(a);
      return (l && (r.className = l), u && (r.textContent = Dt(u)), r);
    },
    Z = (a, l, u = "") => {
      let r = t("button", u, a);
      return ((r.type = "button"), r.addEventListener("click", l), r);
    },
    H = {
      read(a, l) {
        try {
          return JSON.parse(localStorage.getItem("syolana.fr.a1." + a)) ?? l;
        } catch {
          return l;
        }
      },
      write(a, l) {
        try {
          localStorage.setItem("syolana.fr.a1." + a, JSON.stringify(l));
        } catch {}
      },
    },
    $ = (a) => {
      window.parent !== window &&
        window.parent.postMessage({ syolanaLesson: !0, ...a }, location.origin);
    },
    ge = (a) => {
      let l = Math.round(a / 60);
      return l < 60
        ? l + " мин"
        : Math.floor(l / 60) + " ч " + (l % 60) + " мин";
    },
    rn = (a) => (
      (a = Math.floor(a)),
      Math.floor(a / 3600) +
        ":" +
        String(Math.floor((a % 3600) / 60)).padStart(2, "0") +
        ":" +
        String(a % 60).padStart(2, "0")
    ),
    Se = (a, l) => {
      let u = t("label", "field", a);
      return (u.append(l), u);
    },
    it = (a) => {
      let l = t("select");
      for (let [u, r] of a) {
        let p = t("option", "", r);
        ((p.value = u), l.append(p));
      }
      return l;
    },
    Qt = (a) =>
      a
        .toLowerCase()
        .replace(/[’]/g, "'")
        .replace(/[^\p{L}\p{N}' ]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
  document.documentElement.classList.toggle(
    "embedded",
    window.parent !== window,
  );
  function dn(a) {
    let l = {
      body: "--course-font",
      accent: "--course-accent",
      dim: "--course-muted",
      "panel-border": "--course-line",
      "panel-text": "--course-ink",
      "panel-muted": "--course-muted",
      "button-radius": "--course-button-radius",
    };
    for (let [r, p] of Object.entries(a))
      l[r] &&
        String(p).trim() &&
        document.documentElement.style.setProperty(l[r], p);
    let u = String(a.surface || "").trim();
    /^\d+(?:\s*,\s*\d+){2}$/.test(u) &&
      document.documentElement.style.setProperty("--course-surface", u);
  }
  window.addEventListener("message", (a) => {
    a.source === window.parent &&
      a.origin === location.origin &&
      a.data?.syolanaHost &&
      a.data.theme &&
      dn(a.data.theme);
  });
  async function ln() {
    let a = await Mt(),
      l = Fe(a),
      u = H.read("settings", {});
    (mountCourseBranding({ course: "Французский A1", personalMark: et() }),
      $({ courseAttribution: et() }));
    let r = {
        mode: u.mode === "both" ? "both" : "en",
        rate: Math.max(0.55, Math.min(1.5, Number(u.rate) || 1)),
        repeat: [1, 2, 3].includes(u.repeat) ? u.repeat : 1,
        voices: u.voices || {},
        loop: !!u.loop,
        follow: u.follow !== false,
      },
      p = nt(a, r, l),
      h = "Курс",
      y = null,
      g = null,
      X = !1,
      b = window.speechSynthesis?.getVoices() || [],
      N = {},
      C = "",
      V = "days",
      Q = 0,
      I = null,
      J = 0,
      k = new Set(a.vocabulary.map((e) => e.id)),
      S = new Set(H.read("learned", []).filter((e) => k.has(e))),
      Y = document.getElementById("app"),
      G = t("div", "shell");
    Y.append(G);
    let i = new Map(),
      m = new Map(),
      v = new Map();
    let activeVocabulary = a.vocabulary;
    function f(e, { actions: n = !0 } = {}) {
      let s = t("div", "pair");
      ((s.dataset.pair = e.id),
        (s.dataset.lang = e.lang),
        e.tag && s.append(t("span", "pair-tag", e.tag)));
      let o = t("div", "pair-content"),
        d = t("div", "en", e.en);
      d.lang = e.lang;
      let c = t("div", "ipa", ke(e.ipa));
      c.setAttribute("aria-label", "Французское произношение, IPA");
      let W = t("div", "ru", e.ru);
      if (
        ((W.lang = "ru"),
        o.append(d),
        e.speechContext && o.append(t("div", "speech-context", "В озвучке: " + e.speechContext + " " + (e.speechContextIPA || ""))),
        e.ipa && o.append(c),
        o.append(W),
        e.phoneticIPA)
      ) {
        let L = t("div", "precise-ipa", "IPA " + e.phoneticIPA);
        (L.setAttribute("aria-label", "Международная фонетическая запись"),
          o.append(L));
      }
      if ((s.append(o), n)) {
        let L = t("div", "pair-actions");
        (L.append(Z("▶ Французский", () => Zt(e, "en"), "listen-small")),
          s.append(L));
      }
      return s;
    }
    let M = t("header", "course-header"),
      O = Z("Французский A1", () => R("days"), "course-brand"),
      T = t("span", "breadcrumb", "Курс по дням"),
      oe = t("div", "header-actions"),
      te = Z("← К дням", () => R(V), "back-button");
    te.hidden = !0;
    let We = Z("☰ Оглавление", () => me(K.hidden));
    (We.setAttribute("aria-expanded", "false"),
      We.setAttribute("aria-controls", "course-toc"),
      oe.append(We));
    let ot = t("div", "course-trail");
    (ot.append(te), M.append(O, T, oe, ot));
    let ve = t("div", "workspace"),
      Me = t("main", "course-scroll");
    Me.id = "course-content";
    let Ze = t("div", "stage");
    (Me.append(Ze), ve.append(Me));
    let K = t("aside", "toc");
    ((K.id = "course-toc"),
      (K.hidden = !0),
      K.setAttribute("aria-label", "Оглавление курса"));
    let rt = t("div", "drawer-heading");
    (rt.append(
      t("h2", "", "Оглавление"),
      Z("Закрыть", () => me(!1), "quiet"),
    ),
      K.append(rt));
    let Xe = t("nav", "toc-nav");
    Xe.setAttribute("aria-label", "Разделы курса");
    for (let [e, n] of ie) {
      const row=t("div","toc-section");
      const listen=Z("▶",()=>{U(audioForSection(e),n);he(true)},"toc-listen");
      listen.setAttribute("aria-label","Слушать раздел: "+n);
      listen.title="Слушать раздел целиком";
      listen.dataset.listenSection=e;
      row.append(Z(n,()=>R(e),"toc-link"),listen);
      Xe.append(row);
      if(e==="vocabulary") {
        const quick=Z("▶ Только слова · без форм и примеров",()=>{quickWords(a.vocabulary);he(true)},"toc-words");
        Xe.append(quick);
      }
    }
    K.append(Xe);
    let Be = t("details", "toc-days");
    Be.append(t("summary", "", "Выбрать день"));
    let He = t("div", "toc-nav");
    (Be.append(He), K.append(Be), ve.append(K));
    let dt = t("footer", "audio-dock"),
      ee = Z("", () => he(ne.hidden), "audio-pill");
    (ee.setAttribute("aria-expanded", "false"),
      ee.setAttribute("aria-controls", "course-player"),
      ee.append(t("span", "audio-icon", "♫")));
    let lt = t("span", "pill-copy"),
      Le = t("strong", "", "Озвучка курса"),
      Ge = t("small", "", "Режим, скорость и голоса");
    (lt.append(Le, Ge), ee.append(lt, t("span", "pill-arrow", "⌃")));
    let re = t("progress", "mini-progress");
    ((re.max = 1),
      (re.value = 0),
      re.setAttribute("aria-label", "Прогресс прослушивания"),
      ee.append(re),
      dt.append(ee),
      G.append(M, ve, dt));
    let ne = t("section", "player-panel");
    ((ne.id = "course-player"),
      (ne.hidden = !0),
      ne.setAttribute("aria-label", "Озвучка курса"));
    let ct = t("div", "drawer-heading");
    ct.append(
      t("h2", "", "Слушайте в своём темпе"),
      Z("Свернуть", () => he(!1), "quiet"),
    );
    let pt = t("div", "toolbar-row"),
      Tt = Z("▶ Весь A1", () => U(p.all, "Весь A1"), "primary"),
      ut = Z("Продолжить", () => {
        let e = Wt();
        (e.status === "playing"
          ? (e.pause(), be())
          : ["paused", "stopped", "error"].includes(e.status) &&
              e.unitIndex < e.units.length
            ? ($({ audio: !0 }), e.resume())
            : U(p.all, "Весь A1"),
          P());
      }),
      je = Z("←", () => {
        (j.stop(!1), (X = !1), x.seek(Math.max(0, x.unitIndex - 1)));
      });
    je.setAttribute("aria-label", "Предыдущая фраза");
    let Oe = Z("→", () => {
      (j.stop(!1), (X = !1), x.seek(x.unitIndex + 1));
    });
    (Oe.setAttribute("aria-label", "Следующая фраза"),
      pt.append(Tt, Z("▶ Только слова",()=>quickWords(a.vocabulary)), ut, je, Oe));
    let ht = t("p", "status", "Выберите курс, день или отдельную фразу."),
      mt = t("div", "progress-row"),
      de = t("progress"),
      bt = t("span"),
      yt = t("span");
    ((de.max = 1),
      (de.value = 0),
      de.setAttribute("aria-label", "Прочитанная часть"),
      mt.append(de, bt, yt));
    let pe = t("div", "error");
    (pe.setAttribute("role", "status"), (pe.hidden = !0));
    let ze = t("details", "audio-settings");
    ze.append(t("summary", "", "Режим, скорость, повторы и голоса"));
    let Ae = t("div", "setting-grid"),
      xe = it([["en", "Только французский"],["both","Французский → русский"]]);
    xe.value = r.mode;
    xe.setAttribute("aria-label","Языки озвучки");
    let le = it([
      [0.6, "0,6 \xD7 — очень медленно"],
      [0.75, "0,75 \xD7 — медленно"],
      [0.9, "0,9 \xD7"],
      [1, "1 \xD7 — обычно"],
      [1.15, "1,15 \xD7"],
      [1.3, "1,3 \xD7"],
      [1.5, "1,5 \xD7"],
    ]);
    ((le.value = String(r.rate)), le.value || ((r.rate = 1), (le.value = "1")));
    let Ye = it([
      [1, "Один раз"],
      [2, "Каждую пару дважды"],
      [3, "Каждую пару трижды"],
    ]);
    Ye.value = r.repeat;
    let De = () => {
      let e = I,
        n = J;
      (x.pause(),
        j.stop(!1),
        (X = !1),
        (r.mode = xe.value),
        (r.rate = +le.value),
        (r.repeat = +Ye.value),
        (x.mode = r.mode),
        (x.repeat = r.repeat),
        (x.segmentIndex = 0),
        H.write("settings", r),
        (p = nt(a, r, l)),
        wt());
      for (let [s, o] of i)
        s.startsWith("day-") && (o.remove(), i.delete(s), m.delete(s));
      if (C.startsWith("day-")) {
        let s = C;
        ((C = ""), Ce(s), e && (ae(e), (J = n)));
      }
      (be(), P());
    };
    (xe.addEventListener("change", De),
      le.addEventListener("change", De),
      Ye.addEventListener("change", De),
      Ae.append(
        Se("Что слушать", xe),
        Se("Скорость", le),
        Se("Повтор слова или фразы", Ye),
      ));
    for (let [e, n] of [["fr-FR", "Французский голос"],["ru-RU","Русский голос"]]) {
      let s = t("select");
      (s.setAttribute("aria-label", n),
        (N[e] = s),
        s.addEventListener("change", () => {
          (x.pause(),
            j.stop(!1),
            (X = !1),
            (r.voices[e] = s.value),
            H.write("settings", r),
            P());
        }),
        Ae.append(Se(n, s)));
    }
    let ft = t("label", "inline-field"),
      we = t("input");
    ((we.type = "checkbox"),
      ft.append(
        we,
        document.createTextNode("Повторять выбранный раздел или список целиком"),
      ),
      we.addEventListener("change", () => {
        ((r.loop = we.checked), (x.loop = r.loop), H.write("settings",r));
      }));
    we.checked=r.loop;
    const followLabel=t("label","inline-field"), followInput=t("input");
    followInput.type="checkbox"; followInput.checked=r.follow;
    followLabel.append(followInput,document.createTextNode("Прокручивать открытый текст вслед за озвучкой"));
    followInput.addEventListener("change",()=>{r.follow=followInput.checked;H.write("settings",r)});
    let gt = t("div", "actions");
    (gt.append(Z("Обновить голоса", Ee)),
      ze.append(
        Ae,
        ft,
        followLabel,
        gt,
        t(
          "p",
          "muted",
          "Выберите только французский или французский с русским переводом. Предпочтение отдаётся голосу Франции; если доступен другой французский голос, он тоже появится в списке. Один выбранный голос читает весь французский текст. Если список ещё загружается, браузер выбирает голос по языку. Транскрипция и значки не читаются. Одинаковые соседние формы в режиме «Только французский» звучат один раз.",
        ),
      ));
    let ue = t("div", "player-current");
    ((ue.hidden = !0), ne.append(ct, pt, ht, mt, pe, ze, ue), ve.append(ne));
    function Ne(e) {
      requestAnimationFrame(() => {
        window.parent !== window
          ? $({
              height: Math.ceil(G.getBoundingClientRect().height),
              scroll: e,
            })
          : window.scrollTo({ top: e, behavior: "instant" });
      });
    }
    function ae(e, n = !0) {
      if (e === I) return;
      e && !I && (J = window.parent !== window ? Q : window.scrollY);
      let s = !!I;
      ((I = e),
        (Ze.hidden = !!e),
        (K.hidden = e !== "toc"),
        (ne.hidden = e !== "player"),
        ee.setAttribute("aria-expanded", String(e === "player")),
        We.setAttribute("aria-expanded", String(e === "toc")),
        $({ courseOverlay: e }),
        e ? Ne(0) : s && n && Ne(J));
    }
    function he(e) {
      e ? ae("player") : I === "player" && ae(null);
    }
    function me(e) {
      e ? ae("toc") : I === "toc" && ae(null);
    }
    function Wt() {
      return (X && j.status === "ended" && (X = !1), X ? j : x);
    }
    function vt(e, n, s) {
      (y?.classList.remove("active"),
        (y = i.get(C)?.querySelector('[data-pair="' + e.pair.id + '"]')),
        y?.classList.add("active"),
        ue.replaceChildren(e.pair.blindListening ? t("p","muted","Аудирование: текст и перевод можно раскрыть в задании после ответа.") : f(e.pair, { actions: !1 })),
        (ue.hidden = !1),
        (ue.dataset.language = s.lang));
      if (r.follow && y && !I && !e.pair.blindListening) {
        for (let parent=y.parentElement;parent;parent=parent.parentElement) if(parent.tagName==="DETAILS") parent.open=true;
        if (y.getClientRects().length) y.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
      }
    }
    let x = new ye({
        voices: () => b,
        settings: () => r,
        onUnit: vt,
        onChange: P,
        onProgress: () => {
          (be(), P());
        },
      }),
      j = new ye({
        voices: () => b,
        settings: () => r,
        onUnit: vt,
        onChange: P,
      }),
      Kt = Bt(
        K,
        () => {
          (x.dispose(), j.dispose());
        },
        {
          actions: oe,
          reveal: () => {
            (me(!0), Ne(0));
          },
        },
      );
    Ht(() => {
      (x.dispose(), j.dispose());
    });
    function Zt(e, n) {
      (x.pause(),
        (X = !0),
        $({ audio: !0 }),
        j.start([{ pair: e }], { mode: n, repeat: 1 }));
    }
    function be() {
      g &&
        H.write("progress", {
          ...x.snapshot(),
          version: a.version,
          label: h,
          mode: x.mode,
          repeat: x.repeat,
        });
    }
    function U(e, n) {
      Ee();
      (j.stop(!1),
        (X = !1),
        (h = n),
        (g = { version: a.version, ids: e.map((s) => s.pair.id), label: n }),
        H.write("queue", g),
        $({ audio: !0 }),
        x.start(e, { mode: r.mode, loop: r.loop, repeat: r.repeat }),
        be());
    }
    function trainerUnits(e) {
      return Ue([...(e.introFr ? [q("trainer-intro-"+e.id,e.introFr,e.description||"")] : []),...e.pairs]);
    }
    function quickWords(words) {
      U(Ue(words.map(word=>word.head)),"Только слова · "+words.length);
    }
    function audioForSection(key) {
      const units=[...p.map.values()];
      if(key==="days") return p.all;
      if(key==="reading" || key==="grammar") {
        const ids=new Set(a.rules.filter(rule=>(rule.area==="reading")===(key==="reading")).map(rule=>rule.id));
        return units.filter(unit=>ids.has(unit.section));
      }
      if(key==="trainers") return l.flatMap(trainerUnits);
      if(key==="assessment") return (a.assessmentPlaylist||[]).map(id=>p.map.get(id)).filter(Boolean);
      return units.filter(unit=>unit.section===key);
    }
    function Ee() {
      b = window.speechSynthesis?.getVoices() || [];
      for (let [e, n] of Object.entries(N)) {
        let s = b.filter(c=>c.lang.toLowerCase().replaceAll("_","-").split("-")[0]===e.split("-")[0])
          .sort((a,b)=>Number(b.lang.toLowerCase()===e.toLowerCase())-Number(a.lang.toLowerCase()===e.toLowerCase()));
        n.replaceChildren();
        let o =
            "Автоматически: " +
            (e === "ru-RU" ? "русский" : "французский") +
            " голос",
          d = t("option", "", o);
        ((d.value = ""),
          n.append(d),
          s.forEach((c, W) => {
            let L = t(
              "option",
              "",
              `${c.name || "Голос "+(W+1)} · ${c.lang} · ${c.localService ? "на устройстве" : "через интернет"}`,
            );
            ((L.value = c.voiceURI), n.append(L));
          }),
          (d.textContent = s.length ? o : "Выбор по языку браузером"),
          (n.disabled = !s.length),
          (n.value = s.some((c) => c.voiceURI === r.voices[e])
            ? r.voices[e]
            : ""));
      }
    }
    function P() {
      let e = Wt(),
        n = e.snapshot(),
        s = {
          idle: "Готово к прослушиванию",
          playing: "Читается",
          paused: "Пауза",
          stopped: "Пауза",
          ended: "Прочитано",
          error: "Проверьте голос",
        },
        o = e === x ? h : "Отдельная фраза";
      ((ht.textContent = o + " \xB7 " + (s[n.status] || "")),
        (de.max = re.max = Math.max(1, n.total)),
        (de.value = re.value = Math.min(n.unitIndex, n.total)),
        (bt.textContent = n.total
          ? `Прочитано ${Math.min(n.unitIndex, n.total)} из ${n.total} \xB7 осталось ${Math.max(0, n.total - n.unitIndex)}`
          : ""),
        (yt.textContent = n.total
          ? `Прошло ${rn(n.elapsed)} \xB7 осталось ≈ ${ge(At(e, r.rate))}`
          : ""),
        (Le.textContent = n.total ? o : "Озвучка курса"),
        (Ge.textContent = n.total
          ? (s[n.status] || "") +
            " \xB7 " +
            Math.min(n.unitIndex, n.total) +
            " / " +
            n.total
          : "Режим, скорость и голоса"),
        ee.setAttribute(
          "aria-label",
          Le.textContent + ". " + Ge.textContent + ". Открыть панель озвучки",
        ),
        $({
          courseAudio: {
            label: Le.textContent,
            status: Ge.textContent,
            index: Math.min(n.unitIndex, n.total),
            total: n.total,
          },
        }),
        (pe.textContent = n.error),
        (pe.hidden = !n.error),
        (ut.textContent =
          e.status === "playing"
            ? "Ⅱ Пауза"
            : e.units.length && e.unitIndex < e.units.length
              ? "▶ Продолжить"
              : "▶ Начать"),
        (je.disabled = !x.units.length),
        (Oe.disabled = !x.units.length || x.unitIndex >= x.units.length),
        n.error && he(!0));
    }
    function z(e, n, s, o = "ФРАНЦУЗСКИЙ \xB7 A1") {
      let d = t("section", "view");
      ((d.dataset.view = e), (d.hidden = !0));
      let c = t("header", "view-heading");
      c.append(t("p", "eyebrow", o));
      let W = t("h1", "", n);
      return (
        (W.tabIndex = -1),
        c.append(W),
        s && c.append(t("p", "view-intro", s)),
        d.append(c),
        e!=="days" && ie.some(([key])=>key===e) && c.append(Z(e==="assessment"?"▶ Слушать задания":"▶ Слушать раздел целиком",()=>U(audioForSection(e),n),"section-play")),
        i.set(e, d),
        Ze.append(d),
        d
      );
    }
    function R(e) {
      if (C === e) {
        ae(null);
        return;
      }
      ((location.hash = e), Ce(e));
    }
    function Ce(e) {
      let n = Et(e, a, p, l),
        s = n.key;
      (C &&
        C !== s &&
        m.set(C, I ? J : window.parent !== window ? Q : window.scrollY),
        v.has(s) && (v.get(s)(), v.delete(s)),
        i.has(s) || tn(n));
      for (let [c, W] of i) W.hidden = c !== s;
      let o = C !== s;
      ((C = s), H.write("view", s), (G.dataset.view = s));
      let d = ["day", "rule", "trainer", "word"].includes(n.type);
      ((V =
        n.type === "day"
          ? "days"
          : n.type === "rule"
            ? n.rule.area === "reading"
              ? "reading"
              : "grammar"
            : n.type === "trainer"
              ? "trainers"
              : n.type === "word"
                ? "vocabulary"
                : "days"),
        (te.hidden = s === "days"),
        (te.textContent = "← " + (ie.find(([c]) => c === V)?.[1] || "К дням")),
        (T.textContent = d
          ? n.type === "day"
            ? "День " + n.day.number
            : n.type === "rule"
              ? _(n.rule)
              : n.type === "trainer"
                ? n.trainer.title
                : n.word.head.ru
          : ie.find(([c]) => c === s)?.[1] || ""));
      for (let c of Xe.querySelectorAll("button"))
        c.setAttribute(
          "aria-current",
          String(c.textContent === ie.find(([W]) => W === (d ? V : s))?.[1]),
        );
      (ae(null, !1),
        o &&
          (Ne(m.get(s) || 0),
          i.get(s)?.querySelector("h1")?.focus({ preventScroll: !0 })));
    }
    (window.addEventListener("hashchange", () =>
      Ce(decodeURIComponent(location.hash.slice(1))),
    ),
      document.addEventListener("keydown", (e) => {
        e.key === "Escape" && (he(!1), me(!1));
      }));
    function Xt(e) {
      let n = t("div", "lesson-body");
      for (let [o, d] of e.items.entries()) {
        (e.items.length > 1 && n.append(t("h2", "", d.title)),
          d.bodyFr
            ? n.append(f(q("rule-" + e.id + "-" + o, d.bodyFr, d.body)))
            : (n.append(t("p", "explanation", d.body)),
              d.instruction && n.append(f(d.instruction))));
        let c = t("div", "pairs");
        (c.append(...d.pairs.map((W) => f(W))), n.append(c));
      }
      if (e.id === "read-alphabet") {
        let o = t("div", "alphabet");
        (o.append(...a.alphabet.map((d) => f(d))),
          n.append(t("h2", "", "Все 26 букв по порядку"), o));
      }
      if (["read-vowels", "read-consonants"].includes(e.id)) {
        let o = t("div", "sounds");
        for (let d of a.phonetics.filter((c) =>
          e.id === "read-consonants"
            ? c.type === "Согласный"
            : c.type !== "Согласный",
        )) {
          let c = t("article", "sound");
          (c.append(
            t("span", "symbol", ke(d.symbol)),
            t("span", "badge", d.type),
          ),
            d.mouthFr
              ? c.append(f(q("sound-" + d.id, d.mouthFr, d.mouth)))
              : c.append(t("p", "", d.mouth)),
            c.append(f(d.example)),
            o.append(c));
        }
        n.append(t("h2", "", "Звуки: как поставить рот и что произнести"), o);
      }
      let s = t("div", "actions");
      return (
        s.append(
          Z("▶ Слушать эту тему", () =>
            U(
              p.all.filter((o) => o.section === e.id),
              _(e),
            ),
          ),
        ),
        n.append(s),
        n
      );
    }
    function Ut(e, n = !1) {
      let s = t("details", "lesson");
      s.append(t("summary", "", _(e)+(e.scope==="extension"?" · Дополнение":"")));
      let o = !1,
        d = () => {
          o || ((o = !0), s.append(Xt(e)));
        };
      return (
        s.addEventListener("toggle", () => {
          s.open && d();
        }),
        n && (d(), (s.open = !0)),
        s
      );
    }
    function Lt(e, n) {
      let s = t("div", "topic-list");
      (n.forEach((o, d) => {
        let c = Z("", () => R(o.id), "topic-link"),
          W = t("span", "topic-number", String(d + 1).padStart(2, "0")),
          L = t("span", "topic-copy");
        L.append(t("strong", "", _(o)));
        let w = p.days.find((B) => B.rules.some((A) => A.section.id === o.id)),
          F = t("small", "", w ? "Входит в день " + w.number : "Правило курса");
        ((F.dataset.topicDay = o.id),
          L.append(F),
          c.append(W, L, t("span", "topic-arrow", "→")),
          s.append(c));
      }),
        e.append(s));
    }
    let Ve = z(
        "days",
        "От знакомых слов к уверенной речи",
        "Начните с дня 1 или выберите тему в оглавлении. В каждом дне сначала идут правила, затем — слова с примерами. Слушать можно весь курс, любой раздел, тему или отдельную фразу. В словаре есть быстрый режим «Только слова».",
      ),
      Gt = t("div", "actions welcome-actions");
    (Gt.append(
      Z("Начать с дня 1 →", () => R("day-1"), "primary"),
      Z("▶ Слушать весь A1", () => U(p.all, "Весь A1")),
    ),
      Ve.append(Gt));
    let xt = t("div", "stats");
    for (let [e, n] of [
      [
        a.statistics.uniqueHeadwords,
        ["разное слово", "разных слова", "разных слов"],
      ],
      [a.statistics.examples, ["пример", "примера", "примеров"]],
      [a.statistics.ruleSections, ["тема правил", "темы правил", "тем правил"]],
    ]) {
      let s = e % 100,
        o = e % 10,
        d = n[s >= 11 && s <= 14 ? 2 : o === 1 ? 0 : o >= 2 && o <= 4 ? 1 : 2],
        c = t("div");
      (c.append(t("strong", "", e.toLocaleString("ru-RU")), t("span", "", d)),
        xt.append(c));
    }
    Ve.append(xt);
    let Yt = t("p", "listening-summary"),
      Qe = t("div", "day-list");
    Ve.append(Yt, Qe);
    function wt() {
      let e = p.all.reduce((n, s) => n + fe(s, r.rate, r.mode, r.repeat), 0);
      ((Yt.textContent = `${p.days.length} дневных блоков \xB7 весь французский ≈ ${ge(p.totalSeconds)}${r.mode !== "en" ? " \xB7 с переводом ≈ " + ge(e) : ""}. Обычно в блоке около 30 минут французской речи; последний блок может быть короче. Это время одного прослушивания, а не длительность изучения уровня. Оценка учитывает скорость и повторы; реальное время зависит от голоса.`),
        Qe.replaceChildren(),
        He.replaceChildren());
      for (let n of Ze.querySelectorAll("[data-topic-day]")) {
        let s = p.days.find((o) =>
          o.rules.some((d) => d.section.id === n.dataset.topicDay),
        );
        n.textContent = s ? "Входит в день " + s.number : "Правило курса";
      }
      for (let n of p.days) {
        let s = st(n, a.groups),
          o = t("article", "day-card");
        o.append(
          t("div", "day-meta", "День " + n.number + " \xB7 ≈ " + ge(n.seconds)),
          t("h2", "", s.title),
        );
        let d = t("ul", "day-topics");
        for (let W of s.topics) d.append(t("li", "", W));
        if (
          (s.topics.length ||
            d.append(
              t("li", "", "Повторение знакомых правил в новых словах и фразах"),
            ),
          o.append(d),
          s.vocabulary.length)
        ) {
          o.append(
            t("span", "card-label", "Затем — слова с четырьмя примерами"),
          );
          let W = t("div", "topic-chips");
          (s.vocabulary.forEach((L) => W.append(t("span", "", L))),
            o.append(W));
        }
        (s.extras.length &&
          o.append(
            t("p", "day-extra", "В конце — " + s.extras.join(" и ") + "."),
          ),
          o.append(t("p", "day-count", at(n.words.length))));
        let c = t("div", "actions");
        (c.append(
          Z("Открыть день →", () => R(n.id), "primary"),
          Z("▶ Слушать", () => U(n.units, "День " + n.number)),
        ),
          o.append(c),
          Qe.append(o),
          He.append(
            Z(
              "День " + n.number + " \xB7 " + s.title,
              () => R(n.id),
              "toc-link",
            ),
          ));
      }
    }
    let Pt = z(
      "reading",
      "Сначала — чтение и звуки",
      "Буква и звук — разные вещи. Идите от алфавита к сочетаниям и окончаниям, слушайте примеры и произносите их вслух.",
    );
    v.set("reading", () => {
      Lt(
        Pt,
        a.rules.filter((e) => e.area === "reading"),
      );
    });
    let qt = z(
      "grammar",
      "Правила, которые превращаются в речь",
      "Короткое объяснение на французском, точный русский перевод того же объяснения и примеры. Открывайте одну тему или слушайте все правила подряд.",
    );
    v.set("grammar", () => {
      Lt(
        qt,
        a.rules.filter((e) => e.area !== "reading"),
      );
    });
    let $t = z(
        "vocabulary",
        "Слова, формы и четыре примера",
        "Краткие формы видны сразу. Существительные: артикль и множественное число. Глаголы: инфинитив, затем présent в порядке je, tu, il / elle / on, nous, vous, ils / elles. Прилагательные: м. ед., ж. ед., м. мн., ж. мн. «Только слова» читает заглавную форму без примеров и полных таблиц.",
      ),
      Nt = t("div", "search"),
      se = t("input");
    ((se.type = "search"),
      (se.placeholder = "Слово, перевод или фраза"),
      se.setAttribute("aria-label", "Поиск по всему словарю"));
    let Ct = t("span", "muted"),
      Te = t("span", "muted"),
      Ie = t("div", "vocabulary-list");
    Nt.append(
      se,
      Z("Все слова", () => {
        ((se.value = ""), Je(a.vocabulary));
      }),
      Z("Ещё не запомнил(а)", () =>
        Je(a.vocabulary.filter((e) => !S.has(e.id))),
      ),
    );
    let Vt = t("p", "search-summary");
    const wordAudio=t("div","actions word-audio");
    wordAudio.append(Z("▶ Только слова",()=>quickWords(activeVocabulary),"primary"),Z("▶ Слова, формы и 4 примера",()=>{const ids=new Set(activeVocabulary.map(word=>word.id));U([...p.map.values()].filter(unit=>ids.has(unit.owner)),"Слова, формы и 4 примера")}));
    (Vt.append(Ct, Te), $t.append(wordAudio,Nt, Vt, Ie));
    function compactWordHead(word) {
      const head=t("span","word-head"), row=t("span","compact-forms");
      if(word.compactKind && word.compactKind!=="Слово или выражение") head.append(t("span","word-meta",word.compactKind));
      const forms=word.compactForms||[{text:word.head.en,ipa:word.head.ipa}];
      forms.forEach((form,index)=>{
        if(index)row.append(t("span","compact-separator",", "));
        const unit=t("span","compact-form"), text=t("span","en",form.text), ipa=t("span","ipa",form.ipa);
        text.lang="fr-FR";ipa.setAttribute("aria-label","Французское произношение, IPA");
        if(form.label){unit.title=form.label;unit.dataset.formLabel=form.label;}
        unit.append(text,document.createTextNode(" "),ipa);
        if((word.compactKind==="Прилагательное" || word.type==="v") && form.label && form.label!=="инфинитив")unit.append(document.createTextNode(" "),t("span","compact-form-label",form.label));
        row.append(unit);
      });
      head.append(row);
      if(word.compactNote)head.append(t("span","compact-note",word.compactNote));
      head.append(t("span","ru",word.compactTranslation||word.head.ru));
      return head;
    }
    function Ke(e, { open: n = !1 } = {}) {
      let s = t("details", "word-entry");
      s.dataset.word = e.id;
      let o = t("summary"), d=compactWordHead(e);
      (o.append(d,t("span","badge",e.level)),s.append(o));
      let W = !1,
        L = () => {
          if (W) return;
          W = !0;
          let w = t("div", "word-body");
          w.append(f(e.head));
          if (e.pronunciationDetail) w.append(t("p", "word-pronunciation-note", e.pronunciationDetail));
          if (e.formGroups?.length) {
            w.append(t("h3", "", e.type === "v" ? "Формы глагола · через запятую" : "Формы слова"));
            const forms = t("div", "compact-form-groups");
            for (const group of e.formGroups) forms.append(f(group));
            w.append(forms);
          }
          w.append(t("h3", "", "Четыре разных примера"));
          let B = t("div", "pairs");
          (B.append(...e.examples.map((E) => f(E))), w.append(B));
          let A = t("div", "actions");
          A.append(
            Z("▶ Слово, формы и 4 примера", () =>
              U(
                p.all.filter((E) => E.owner === e.id),
                "Слово, формы и 4 примера",
              ),
            ),
          );
          A.append(Z("▶ Только слово",()=>quickWords([e])));
          let D = Z(S.has(e.id) ? "✓ Запомнил(а)" : "Запомнил(а)", () => {
            (S.has(e.id) ? S.delete(e.id) : S.add(e.id),
              H.write("learned", [...S]),
              (D.textContent = S.has(e.id) ? "✓ Запомнил(а)" : "Запомнил(а)"),
              (Te.textContent = " \xB7 Запомнил(а) " + S.size));
          });
          (A.append(D), w.append(A), s.append(w));
        };
      return (
        s.addEventListener("toggle", () => {
          s.open && L();
        }),
        n && (L(), (s.open = !0)),
        s
      );
    }
    function Je(e) {
      activeVocabulary=e;
      if (
        (Ie.replaceChildren(),
        (Ct.textContent = at(e.length)),
        (Te.textContent = " \xB7 Запомнил(а) " + S.size),
        !e.length)
      ) {
        Ie.append(
          t(
            "p",
            "empty",
            "Совпадений нет. Попробуйте другое слово или русский перевод.",
          ),
        );
        return;
      }
      for (let n of a.groups) {
        let s = e.filter((L) => L.group === n.id);
        if (!s.length) continue;
        let o = t("details", "word-group");
        o.dataset.group=n.id;
        o.append(t("summary", "", n.title + " \xB7 " + s.length));
        let d = !1,
          c = t("div", "group-body");
        const groupAudio=t("div","actions group-audio");
        groupAudio.append(Z("▶ Только слова темы",()=>quickWords(s)),Z("▶ Слова темы, формы и примеры",()=>{const ids=new Set(s.map(word=>word.id));U([...p.map.values()].filter(unit=>ids.has(unit.owner)),n.title)}));
        c.append(groupAudio);
        o.append(c);
        let W = () => {
          d || ((d = !0), c.append(...s.map((L) => Ke(L))));
        };
        (o.addEventListener("toggle", () => {
          o.open && W();
        }),
          e.length < 80 && (W(), (o.open = !0)),
          Ie.append(o));
      }
    }
    let It;
    (se.addEventListener("input", () => {
      (clearTimeout(It),
        (It = setTimeout(() => {
          let e = Qt(se.value);
          Je(
            a.vocabulary.filter((n) =>
              Qt(
                [
                  n.word,
                  n.ru,
                  n.note,
                  ...n.forms.flatMap((s) => [s.en, s.ru]),
                  ...n.examples.flatMap((s) => [s.en, s.ru]),
                ].join(" "),
              ).includes(e),
            ),
          );
        }, 180)));
    }),
      v.set("vocabulary", () => {
        Je(a.vocabulary);
      }));
    let _t = z(
      "variants",
      "Франция и другие страны",
      "Сравнивайте слова, конструкции и записи произношения. Все французские варианты читает один выбранный французский голос.",
    );
    v.set("variants", () => {
      let e = t("div", "variant-grid");
      for (let n of a.variants) {
        let s = t("article", "variant-card");
        (s.append(
          t("span", "card-label", "Франция"),
          f(n.uk),
          t("span", "card-label", n.us.tag || "Другие страны"),
          f(n.us),
          n.noteFr
            ? f(q("variant-" + a.variants.indexOf(n), n.noteFr, n.note))
            : t("p", "", n.note),
        ),
          e.append(s));
      }
      _t.append(
        e,
        t(
          "p",
          "muted",
          "Внутри каждой страны есть разные акценты. Здесь сравниваются варианты Франции, Бельгии, Швейцарии и Канады.",
        ),
      );
    });
    let en = z(
      "trainers",
      "Повторение до автоматизма",
      "Готовые списки без ввода ответов. Читайте по порядку, повторяйте вслух, слушайте весь список или отдельную запись.",
    );
    v.set("trainers", () => {
      let e = t("div", "trainer-list");
      for (let n of l) {
        let s = t("article", "trainer-card");
        s.append(t("h2", "", n.title), t("p", "", n.description));
        let o = t("div", "actions");
        (o.append(
          Z("Открыть список →", () => R("repeat-" + n.id), "primary"),
          Z("▶ Слушать список", () => U(trainerUnits(n), n.title)),
        ),
          s.append(o),
          e.append(s));
      }
      en.append(e);
    });
    function Ue(e) {
      return e.map((n) => p.map.get(n.id) || { pair: n });
    }
    function tn(e) {
      if (e.type === "rule") {
        let n = e.rule,
          s = z(
            e.key,
            _(n),
            "",
            n.area === "reading" ? "ЧТЕНИЕ И ЗВУКИ" : "ПРАВИЛА И КОНСТРУКЦИИ",
          );
        s.append(Xt(n));
        let o = a.rules.filter(
            (W) => (W.area === "reading") == (n.area === "reading"),
          ),
          d = o.indexOf(n),
          c = t("nav", "page-turns");
        (c.setAttribute("aria-label", "Переход между темами"),
          d > 0 && c.append(Z("← " + _(o[d - 1]), () => R(o[d - 1].id))),
          d < o.length - 1 &&
            c.append(Z(_(o[d + 1]) + " →", () => R(o[d + 1].id))),
          s.append(c));
      } else if (e.type === "day") {
        let n = e.day,
          s = st(n, a.groups),
          o = z(
            e.key,
            s.title,
            "Сначала разберите темы ниже. Затем переходите к словам и их примерам. Озвучка читает материал в том же порядке.",
            "ДЕНЬ " +
              n.number +
              " \xB7 ≈ " +
              ge(n.seconds) +
              " ФРАНЦУЗСКОЙ РЕЧИ",
          ),
          d = t("div", "actions");
        (d.append(
          Z(
            "▶ Слушать день " + n.number,
            () => U(n.units, "День " + n.number),
            "primary",
          ),
        ),
          o.append(d));
        let c = t("details", "day-outline");
        c.append(t("summary", "", "Что входит в этот день"));
        let W = t("ul");
        if (
          (s.topics.forEach((w) => W.append(t("li", "", w))),
          s.vocabulary.forEach((w) => W.append(t("li", "", "Слова: " + w))),
          c.append(W),
          o.append(c),
          n.rules.length &&
            (o.append(
              t(
                "h2",
                "section-label",
                n.number === 1
                  ? "Правила чтения"
                  : "Сначала — правила и повторение",
              ),
            ),
            n.rules.forEach((w, F) => {
              if (w.section.area === "repetition") {
                let B = t("details", "lesson");
                B.append(t("summary", "", w.section.title));
                let A = t("div", "lesson-body pairs");
                (A.append(...w.units.map((D) => f(D.pair))),
                  B.append(A),
                  o.append(B));
              } else o.append(Ut(w.section, F === 0));
            })),
          n.words.length)
        ) {
          o.append(t("h2", "section-label", "Затем — слова и четыре примера"));
          for (let w of [...new Set(n.words.map((F) => F.group))]) {
            let F = n.words.filter((D) => D.group === w),
              B = t("details", "word-group");
            B.append(
              t(
                "summary",
                "",
                (a.groups.find((D) => D.id === w)?.title || "Слова") +
                  " \xB7 " +
                  F.length,
              ),
            );
            let A = !1;
            (B.addEventListener("toggle", () => {
              if (B.open && !A) {
                A = !0;
                let D = t("div", "group-body");
                (D.append(...F.map((E) => Ke(E))), B.append(D));
              }
            }),
              o.append(B));
          }
        }
        if (n.extras.length) {
          o.append(
            t(
              "h2",
              "section-label",
              "В конце — сравнение вариантов и бытовые фразы",
            ),
          );
          let w = t("div", "pairs");
          (w.append(...n.extras.map((F) => f(F.pair))), o.append(w));
        }
        let L = t("nav", "page-turns");
        (L.setAttribute("aria-label", "Переход между днями"),
          n.number > 1 &&
            L.append(
              Z("← День " + (n.number - 1), () => R("day-" + (n.number - 1))),
            ),
          L.append(Z("Ко всем дням", () => R("days"))),
          n.number < p.days.length &&
            L.append(
              Z("День " + (n.number + 1) + " →", () =>
                R("day-" + (n.number + 1)),
              ),
            ),
          o.append(L),
          n.number === p.days.length && o.append(Pe()));
      } else if (e.type === "trainer") {
        let n = e.trainer,
          s = z(e.key, n.title, n.description, "ПОВТОРЕНИЕ ДО АВТОМАТИЗМА"),
          o = t("div", "actions");
        if (
          (o.append(
            Z(
              "▶ Слушать весь список",
              () => U(trainerUnits(n), n.title),
              "primary",
            ),
          ),
          s.append(o),
          n.note && s.append(t("p", "explanation", n.note)),
          n.entries)
        )
          for (let d of n.entries) {
            let c = t("article", "verb-row");
            c.append(f(d.head));
            let W = t("div", "forms");
            (W.append(f(d.forms[2])),
              d.word === "be" &&
                W.append(
                  ...d.forms.filter((L) => L.en === "were").map((L) => f(L)),
                ),
              W.append(f(d.forms[3])),
              c.append(W),
              s.append(c));
          }
        else {
          let d = t(
            "div",
            n.id === "alphabet" ? "alphabet" : "pairs repetition-list",
          );
          (d.append(...n.pairs.map((c) => f(c))), s.append(d));
        }
      } else
        e.type === "word" &&
          z(e.key, "Слово, формы и 4 примера", "").append(Ke(e.word, { open: !0 }));
    }
    let Jt = z(
      "practice",
      "Говорите, читайте и пишите",
      "Составьте свой ответ, прочитайте его вслух и сравните с образцом. Ваши ответы и заметки сохраняются на этом устройстве.",
    );
    v.set("practice", () => {
      for (let e of a.practice) {
        let n = t("details", "practice");
        n.append(t("summary", "", e.title));
        let s = t("div", "practice-body");
        e.taskFr
          ? s.append(f(q("task-" + e.id, e.taskFr, e.task)))
          : s.append(t("p", "", e.task));
        let o = t("div", "pairs");
        (o.append(...e.pairs.map((W) => f(W))), s.append(o));
        let d = t("textarea");
        if (
          ((d.rows = 3),
          (d.placeholder = "Ваш ответ или заметка"),
          d.setAttribute("aria-label", "Ваш ответ: " + e.title),
          (d.value = H.read("note." + e.id, "")),
          d.addEventListener("input", () => H.write("note." + e.id, d.value)),
          s.append(d),
          e.model)
        ) {
          let W = t("details", "model-answer");
          (W.append(t("summary", "", "Посмотреть образец ответа"), f(e.model)),
            s.append(W));
        }
        let c = t("div", "actions");
        (c.append(
          Z("▶ Слушать фразы ситуации", () =>
            U(Ue([...e.pairs, ...(e.model ? [e.model] : [])]), e.title),
          ),
        ),
          s.append(c),
          n.append(s),
          Jt.append(n));
      }
      Jt.append(Rt(), Pe());
    });
    function Rt() {
      let e = t("aside", "author-advice");
      return (
        e.append(
          t("h2", "", "Совет от автора"),
          t(
            "p",
            "",
            "Чтобы слова лучше запоминались, записывайте их от руки вместе с транскрипцией и коротким примером. Подойдёт тетрадь или планшет / смартфон со стилусом. Произносите слово, пока пишете, а потом закройте образец и попробуйте вспомнить его самостоятельно. Возвращайтесь к этим записям в следующие дни.",
          ),
        ),
        e
      );
    }
    function Pe() {
      let e = t("aside", "next-level");
      return (
        e.append(
          t("h2", "", "Проверяйте навык в живой речи"),
          t(
            "p",
            "",
            "После каждого блока перескажите ситуацию своими словами, напишите короткое сообщение и поговорите с собеседником. Возвращайтесь к темам, где пока трудно понять или ответить.",
          ),
          t(
            "p",
            "",
            "Знание карточек помогает, а уверенный A1 появляется, когда вы используете язык в чтении, письме, разговоре и понимании на слух.",
          ),
        ),
        e
      );
    }
    Ve.append(Rt(), Pe());
    const assessmentView=z("assessment","Итоговая самопроверка A1","Проверьте понимание на слух, чтение, письмо и устную речь. Ответы и черновик сохраняются на этом устройстве.");
    v.set("assessment",()=>{
      const exam=a.assessment;
      assessmentView.append(f(exam.intro));
      const controls=t("div","actions"), result=t("p","assessment-score","Ответьте на 24 вопроса, затем проверьте понимание.");
      result.setAttribute("role","status");
      const questions=[];
      function normalizedAnswer(value){return String(value).normalize("NFD").replace(/\p{M}/gu,"").toLowerCase().replace(/(\d{1,2})\s*(?:h|heures?|:)\s*(\d{2})\b/gu,"$1:$2").replace(/[^\p{L}\p{N}]/gu," ").replace(/\s+/gu," ").trim()}
      controls.append(Z("Проверить понимание",()=>{
        let correct=0;
        for(const row of questions){
          const answer=normalizedAnswer(row.input.value);
          const ok=!!answer && row.question.answers.some(item=>normalizedAnswer(item)===answer);
          correct+=Number(ok);
          row.feedback.textContent=(ok?"✓ ":"Сверьте: ")+row.question.solution;
          row.feedback.className="answer-result "+(ok?"correct":"review");
        }
        result.textContent="Понимание на слух и чтение: "+correct+" из "+questions.length+". Письмо и устную речь оцените отдельно по памяткам ниже.";
        H.write("assessment.result",result.textContent);
      },"primary"));
      assessmentView.append(controls,result,t("p","muted","Проверка принимает короткие ответы из ключа. Правильные развёрнутые ответы можно самостоятельно сверить с образцом."));
      for(const [key,title,items] of [["listening","1. Понимание на слух",exam.listening],["reading","2. Чтение",exam.reading]]){
        assessmentView.append(t("h2","section-label",title));
        for(const item of items){
          const card=t("details","practice assessment-card");card.append(t("summary","",item.title));
          const body=t("div","practice-body");
          if(key==="listening"){
            body.append(t("p","muted","Прослушайте сообщение, затем ответьте. Кнопку можно нажать повторно. Перевод в озвучку этого задания не входит."),Z("▶ Прослушать сообщение",()=>U(Ue([item.text]),item.title),"primary"));
            const transcript=t("details","assessment-transcript");transcript.append(t("summary","","Показать текст и перевод после ответа"),f(item.text));body.append(transcript);
          }else body.append(f(item.text));
          for(const question of item.questions){
            const box=t("div","assessment-question");box.append(f(question.pair));
            const input=t("input");input.type="text";input.autocomplete="off";input.placeholder="Короткий ответ по-французски или цифры";input.setAttribute("aria-label",question.pair.ru);input.value=H.read("assessment.answer."+question.id,"");
            input.addEventListener("input",()=>H.write("assessment.answer."+question.id,input.value));
            const feedback=t("p","answer-result");feedback.setAttribute("aria-live","polite");box.append(input,feedback);body.append(box);questions.push({question,input,feedback});
          }
          card.append(body);assessmentView.append(card);
        }
      }
      function checklist(key,items){
        const section=t("div","assessment-checklist"),count=t("p","muted");const checks=[];
        const update=()=>{count.textContent="Самооценка: "+checks.filter(check=>check.checked).length+" из "+checks.length};
        items.forEach(([fr,ru],index)=>{
          const label=t("label","assessment-check"),input=t("input"),text=t("span");input.type="checkbox";input.checked=!!H.read("assessment.check."+key+index,false);checks.push(input);
          const french=t("span","en",fr);french.lang="fr-FR";text.append(french,t("span","ru",ru));label.append(input,text);section.append(label);
          input.addEventListener("change",()=>{H.write("assessment.check."+key+index,input.checked);update()});
        });section.append(count);update();return section;
      }
      assessmentView.append(t("h2","section-label","3. Письмо"),f(exam.writing));
      const form=t("div","assessment-form");
      for(const [index,[fr,ru]] of [["Nom","Фамилия"],["Prénom","Имя"],["Nationalité","Гражданство"],["Ville","Город"],["Adresse électronique","Электронный адрес"]].entries()){
        const input=t("input");input.type="text";input.autocomplete="off";input.value=H.read("assessment.form."+index,"");input.addEventListener("input",()=>H.write("assessment.form."+index,input.value));form.append(Se(fr+" · "+ru,input));
      }
      const writing=t("textarea"),wordCount=t("p","muted");writing.rows=8;writing.placeholder="Ваше приглашение — не менее 40 слов";writing.setAttribute("aria-label","Письменное задание A1");writing.value=H.read("assessment.writing","");
      const updateCount=()=>{const words=writing.value.trim().split(/\s+/u).filter(word=>/[\p{L}\p{N}]/u.test(word)).length;wordCount.textContent="Слов: "+words+" · цель: не менее 40"};
      writing.addEventListener("input",()=>{H.write("assessment.writing",writing.value);updateCount()});updateCount();
      assessmentView.append(form,writing,wordCount,checklist("writing",exam.writingChecklist));
      assessmentView.append(t("h2","section-label","4. Устная речь"),f(exam.speaking),t("p","muted","Произнесите ответы вслух. Для диалога по возможности попросите собеседника сыграть вторую роль. Запись голоса не требуется."),checklist("speaking",exam.speakingChecklist));
      const end=t("div","actions");end.append(Z("Проверить понимание",()=>controls.querySelector("button").click(),"primary"),Z("Вернуться к практике",()=>R("practice")));assessmentView.append(end);
    });

    let Ft = z(
      "coverage",
      "Что вы отрабатываете на A1",
      a.scopeNote,
    );
    (v.set("coverage", () => {
      let e = t("div", "coverage");
      for (const item of a.coverage) {
        const card=t("article","coverage-card"), actions=t("div","actions");
        card.append(t("h2","",item.title),f(item.pair));
        for(const key of item.links) actions.append(Z(ie.find(([id])=>id===key)?.[1]||key,()=>R(key),"quiet"));
        card.append(actions);e.append(card);
      }
      Ft.append(e,t("p","muted",a.pronunciationNote));
      let n = t("footer", "sources");
      n.append(t("h2", "", "Ориентиры содержания"));
      for (let s of a.sources) {
        let o = t("p"),
          d = t("a", "", s.title);
        ((d.href = s.url),
          (d.target = "_blank"),
          (d.rel = "noopener"),
          o.append(d),
          n.append(o));
      }
      n.append(
        t(
          "p",
          "muted",
          "Версия " +
            a.version +
            ". Настройки, место прослушивания и заметки сохраняются в этом браузере.",
        ),
      );
      for (let s of a.licenses || []) {
        let o = t("details");
        (o.append(t("summary", "", s.title), t("pre", "", s.text)),
          n.append(o));
      }
      Ft.append(n);
    }),
      wt(),
      Ee());
    let qe = H.read("queue", null),
      Re = H.read("progress", null),
      ce = zt(qe, Re, a, p);
    (ce &&
      ((x.units = ce.units),
      (h = Re.label || qe.label),
      (g = { ...qe, version: a.version, ids: ce.units.map((e) => e.pair.id) }),
      H.write("queue", g),
      (x.unitIndex = ce.unitIndex),
      (x.segmentIndex = ce.segmentIndex),
      (x.activeMs = ce.elapsed * 1e3),
      (x.mode = Re.mode || r.mode),
      (x.repeat = Re.repeat || r.repeat),
      (x.status = "paused")),
      P(),
      Ce(decodeURIComponent(location.hash.slice(1)) || H.read("view", "days")),
      window.speechSynthesis?.addEventListener?.("voiceschanged", Ee));
    let kt = () => {
        (x.status === "playing" || j.status === "playing") && P();
      },
      $e = setInterval(kt, 1e3);
    (window.addEventListener("pageshow", (e) => {
      e.persisted && (clearInterval($e), ($e = setInterval(kt, 1e3)), P());
    }),
      window.addEventListener("pagehide", () => {
        (x.pause(), j.dispose(), be(), clearInterval($e));
      }),
      window.addEventListener("message", (e) => {
        if (
          e.source !== window.parent ||
          e.origin !== location.origin ||
          !e.data?.syolanaHost
        )
          return;
        let n = e.data;
        (n.pauseAudio && (x.pause(), j.stop(!1), (X = !1), P()),
          n.anchor && R(n.anchor),
          Number.isFinite(n.courseScroll) && (Q = Math.max(0, n.courseScroll)),
          n.openPlayer && he(I !== "player"),
          n.openTOC && me(I !== "toc"),
          n.openOwner && Kt?.());
      }),
      (Y.hidden = !1),
      (document.getElementById("loading").hidden = !0),
      new ResizeObserver(() =>
        $({ height: Math.ceil(G.getBoundingClientRect().height) }),
      ).observe(G),
      $({ ready: !0, height: Math.ceil(G.getBoundingClientRect().height) }));
  }
  return ln().catch((a) => {
    (document.getElementById("loading").replaceChildren(
      t("strong", "", "Курс пока не загрузился"),
      t("p", "", a.message),
      Z("Попробовать снова", () => location.reload()),
    ),
      $({ ready: !0, height: 450 }));
  });
})();

