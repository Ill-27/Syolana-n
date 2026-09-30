"use strict";
const route = document.currentScript.dataset.route;
location.replace(new URL("./#/" + route, document.baseURI).href);
