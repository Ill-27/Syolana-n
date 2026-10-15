import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {normalizePartnerFooter,prepareAttribution,ATTRIBUTION_TEXT} from '../partner-attribution.js';
test('an already published partner receives the neutral credit without losing its own links',()=>{
 const dom=new JSDOM('<footer id="footer"><span>© Артивид</span><a href="#/terms">Условия чтения</a><a class="platform-credit" href="https://syolana.com/"><img src="missing.svg">Система оформления — Syolana</a></footer>',{url:'https://example.ru/'});globalThis.document=dom.window.document;
 const link=document.querySelector('.platform-credit');normalizePartnerFooter(link);
 assert.equal(link.textContent,ATTRIBUTION_TEXT);assert.equal(link.querySelectorAll('img').length,1);assert.equal(link.querySelector('img').src,'https://syolana.com/assets/logo.svg?v=20261014-passport-1');assert.equal(document.querySelectorAll('.partner-footer-nav a').length,1);assert.equal(link.closest('.partner-footer-credit')?.parentElement.id,'footer');
 normalizePartnerFooter(link);assert.equal(document.querySelectorAll('.partner-footer-meta').length,1);assert.equal(document.querySelectorAll('link[data-syolana-credit-style]').length,1);assert.equal(link.querySelectorAll('img').length,1);dom.window.close();
});
test('preparing an exported credit preserves a single label and logo',()=>{
 const dom=new JSDOM('<footer><a id="syolana-attribution"></a></footer>');globalThis.document=dom.window.document;const link=document.querySelector('a');prepareAttribution(link);prepareAttribution(link);assert.equal(link.textContent,ATTRIBUTION_TEXT);assert.equal(link.querySelectorAll('img').length,1);assert.equal(link.href,'https://syolana.com/');dom.window.close();
});
