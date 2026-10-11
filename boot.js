import "./device-access.js?v=20261011-device-bound-1";
import {installAPITransport} from "./api-transport.js?v=20261011-owner-failover-1";
const oldStudioPath = /^\/partner\/?$/.test(location.pathname);
if (oldStudioPath) {
  location.replace(new URL("./partner-demo/studio/", import.meta.url).href);
} else {
installAPITransport();

let previousHash = location.hash;
let preserveLanguageScroll = false;
let savedLanguageY = 0;
const nativeScrollTo = window.scrollTo.bind(window);
window.scrollTo = (...args) => {
  const first = args[0];
  const requestsTop = first === 0 || (first && typeof first === "object" && Number(first.top) === 0);
  if (preserveLanguageScroll && requestsTop) return;
  return nativeScrollTo(...args);
};
window.addEventListener("hashchange", () => {
  const nextHash = location.hash;
  const isLanguage = value => /^#\/languages(?:\/[a-z]{2})?(?:$|\/)/.test(value);
  preserveLanguageScroll = isLanguage(previousHash) && isLanguage(nextHash);
  previousHash = nextHash;
  if (!preserveLanguageScroll) return;
  savedLanguageY = window.scrollY;
  const page = document.getElementById("page");
  if (page) page.style.minHeight = Math.max(page.getBoundingClientRect().height, window.innerHeight + savedLanguageY) + "px";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    nativeScrollTo({ top: savedLanguageY, behavior: "instant" });
    if (page) page.style.minHeight = "";
    preserveLanguageScroll = false;
  }));
}, true);

if (/^#\/lesson\/(?:en\/a[12]\/course|es\/a[12]\/(?:course|rules|words|practice))(?:\/|$)/.test(location.hash)) {
  document.body.classList.add("course-reading");
}
const release = new URL(import.meta.url).searchParams.get("v") || "20261011-worlds-2";
const appURL = new URL("./app.js?v=20261011-worlds-2", import.meta.url);
appURL.searchParams.set("v", release);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function importWithRetry(url, attempts=2){let error;for(let i=0;i<attempts;i++){try{const attemptURL=new URL(url,location.href);if(i)attemptURL.searchParams.set("retry",String(i));return await import(attemptURL.href);}catch(e){error=e;if(i+1<attempts)await wait(450*(i+1));}}throw error;}

importWithRetry(appURL.href,2).then(async () => {
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const register=()=>navigator.serviceWorker.register(new URL('./sw.js',import.meta.url), {scope:new URL('./',import.meta.url).pathname, updateViaCache:"none"}).catch(()=>{});
    if ("requestIdleCallback" in window) requestIdleCallback(register,{timeout:5000});
    else setTimeout(register,1500);
  }
  const extras = ["polish.js","refinements.js","theme-sound.js","positioning.js","copy-polish.js"].map(name =>
    importWithRetry("./"+name+"?v="+encodeURIComponent(release),2)
  );
  const results = await Promise.allSettled(extras);
  results.forEach(result=>{if(result.status==='rejected')console.warn('Optional Syolana layer unavailable:',result.reason);});
}).catch((error) => {
  console.error("Syolana startup:", error);
  const page = document.getElementById("page");
  if (!page) return;
  const existing = page.children.length && !page.querySelector('.loading');
  if (existing) return;
  const text = document.createElement("p");
  text.className = "notice";
  text.textContent = "Не удалось загрузить основной модуль. Проверьте соединение и попробуйте ещё раз — уже открытые части сайта не затрагиваются.";
  const retry = document.createElement("button");
  retry.className = "btn";
  retry.textContent = "Попробовать снова";
  retry.onclick = () => location.reload();
  page.replaceChildren(text, retry);
});
}