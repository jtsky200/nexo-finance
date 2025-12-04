/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pa=()=>{};var qr={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $s=function(i){const e=[];let t=0;for(let r=0;r<i.length;r++){let o=i.charCodeAt(r);o<128?e[t++]=o:o<2048?(e[t++]=o>>6|192,e[t++]=o&63|128):(o&64512)===55296&&r+1<i.length&&(i.charCodeAt(r+1)&64512)===56320?(o=65536+((o&1023)<<10)+(i.charCodeAt(++r)&1023),e[t++]=o>>18|240,e[t++]=o>>12&63|128,e[t++]=o>>6&63|128,e[t++]=o&63|128):(e[t++]=o>>12|224,e[t++]=o>>6&63|128,e[t++]=o&63|128)}return e},Ra=function(i){const e=[];let t=0,r=0;for(;t<i.length;){const o=i[t++];if(o<128)e[r++]=String.fromCharCode(o);else if(o>191&&o<224){const c=i[t++];e[r++]=String.fromCharCode((o&31)<<6|c&63)}else if(o>239&&o<365){const c=i[t++],h=i[t++],g=i[t++],I=((o&7)<<18|(c&63)<<12|(h&63)<<6|g&63)-65536;e[r++]=String.fromCharCode(55296+(I>>10)),e[r++]=String.fromCharCode(56320+(I&1023))}else{const c=i[t++],h=i[t++];e[r++]=String.fromCharCode((o&15)<<12|(c&63)<<6|h&63)}}return e.join("")},Ws={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(i,e){if(!Array.isArray(i))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let o=0;o<i.length;o+=3){const c=i[o],h=o+1<i.length,g=h?i[o+1]:0,I=o+2<i.length,v=I?i[o+2]:0,S=c>>2,b=(c&3)<<4|g>>4;let A=(g&15)<<2|v>>6,O=v&63;I||(O=64,h||(A=64)),r.push(t[S],t[b],t[A],t[O])}return r.join("")},encodeString(i,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(i):this.encodeByteArray($s(i),e)},decodeString(i,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(i):Ra(this.decodeStringToByteArray(i,e))},decodeStringToByteArray(i,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let o=0;o<i.length;){const c=t[i.charAt(o++)],g=o<i.length?t[i.charAt(o)]:0;++o;const v=o<i.length?t[i.charAt(o)]:64;++o;const b=o<i.length?t[i.charAt(o)]:64;if(++o,c==null||g==null||v==null||b==null)throw new ka;const A=c<<2|g>>4;if(r.push(A),v!==64){const O=g<<4&240|v>>2;if(r.push(O),b!==64){const D=v<<6&192|b;r.push(D)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let i=0;i<this.ENCODED_VALS.length;i++)this.byteToCharMap_[i]=this.ENCODED_VALS.charAt(i),this.charToByteMap_[this.byteToCharMap_[i]]=i,this.byteToCharMapWebSafe_[i]=this.ENCODED_VALS_WEBSAFE.charAt(i),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]]=i,i>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)]=i,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)]=i)}}};class ka extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Na=function(i){const e=$s(i);return Ws.encodeByteArray(e,!0)},wn=function(i){return Na(i).replace(/\./g,"")},Gs=function(i){try{return Ws.decodeString(i,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Oa(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Da=()=>Oa().__FIREBASE_DEFAULTS__,La=()=>{if(typeof process>"u"||typeof qr>"u")return;const i=qr.__FIREBASE_DEFAULTS__;if(i)return JSON.parse(i)},Ma=()=>{if(typeof document>"u")return;let i;try{i=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=i&&Gs(i[1]);return e&&JSON.parse(e)},bi=()=>{try{return Pa()||Da()||La()||Ma()}catch(i){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${i}`);return}},zs=i=>bi()?.emulatorHosts?.[i],qs=i=>{const e=zs(i);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},Ks=()=>bi()?.config,Js=i=>bi()?.[`_${i}`];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ua{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function it(i){try{return(i.startsWith("http://")||i.startsWith("https://")?new URL(i).hostname:i).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Ci(i){return(await fetch(i,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xa(i,e){if(i.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",o=i.iat||0,c=i.sub||i.user_id;if(!c)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const h={iss:`https://securetoken.google.com/${r}`,aud:r,iat:o,exp:o+3600,auth_time:o,sub:c,user_id:c,firebase:{sign_in_provider:"custom",identities:{}},...i};return[wn(JSON.stringify(t)),wn(JSON.stringify(h)),""].join(".")}const Mt={};function Fa(){const i={prod:[],emulator:[]};for(const e of Object.keys(Mt))Mt[e]?i.emulator.push(e):i.prod.push(e);return i}function Va(i){let e=document.getElementById(i),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",i),t=!0),{created:t,element:e}}let Kr=!1;function Pi(i,e){if(typeof window>"u"||typeof document>"u"||!it(window.location.host)||Mt[i]===e||Mt[i]||Kr)return;Mt[i]=e;function t(A){return`__firebase__banner__${A}`}const r="__firebase__banner",c=Fa().prod.length>0;function h(){const A=document.getElementById(r);A&&A.remove()}function g(A){A.style.display="flex",A.style.background="#7faaf0",A.style.position="fixed",A.style.bottom="5px",A.style.left="5px",A.style.padding=".5em",A.style.borderRadius="5px",A.style.alignItems="center"}function I(A,O){A.setAttribute("width","24"),A.setAttribute("id",O),A.setAttribute("height","24"),A.setAttribute("viewBox","0 0 24 24"),A.setAttribute("fill","none"),A.style.marginLeft="-6px"}function v(){const A=document.createElement("span");return A.style.cursor="pointer",A.style.marginLeft="16px",A.style.fontSize="24px",A.innerHTML=" &times;",A.onclick=()=>{Kr=!0,h()},A}function S(A,O){A.setAttribute("id",O),A.innerText="Learn more",A.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",A.setAttribute("target","__blank"),A.style.paddingLeft="5px",A.style.textDecoration="underline"}function b(){const A=Va(r),O=t("text"),D=document.getElementById(O)||document.createElement("span"),V=t("learnmore"),x=document.getElementById(V)||document.createElement("a"),Y=t("preprendIcon"),Q=document.getElementById(Y)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(A.created){const Z=A.element;g(Z),S(x,V);const Te=v();I(Q,Y),Z.append(Q,D,x,Te),document.body.appendChild(Z)}c?(D.innerText="Preview backend disconnected.",Q.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(Q.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,D.innerText="Preview backend running in this workspace."),D.setAttribute("id",O)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",b):b()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function q(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function ja(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(q())}function Ba(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Ha(){const i=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof i=="object"&&i.id!==void 0}function $a(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Wa(){const i=q();return i.indexOf("MSIE ")>=0||i.indexOf("Trident/")>=0}function Ga(){try{return typeof indexedDB=="object"}catch{return!1}}function za(){return new Promise((i,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",o=self.indexedDB.open(r);o.onsuccess=()=>{o.result.close(),t||self.indexedDB.deleteDatabase(r),i(!0)},o.onupgradeneeded=()=>{t=!1},o.onerror=()=>{e(o.error?.message||"")}}catch(t){e(t)}})}function Ed(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qa="FirebaseError";class me extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=qa,Object.setPrototypeOf(this,me.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Wt.prototype.create)}}class Wt{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},o=`${this.service}/${e}`,c=this.errors[e],h=c?Ka(c,r):"Error",g=`${this.serviceName}: ${h} (${o}).`;return new me(o,g,r)}}function Ka(i,e){return i.replace(Ja,(t,r)=>{const o=e[r];return o!=null?String(o):`<${r}?>`})}const Ja=/\{\$([^}]+)}/g;function Xa(i){for(const e in i)if(Object.prototype.hasOwnProperty.call(i,e))return!1;return!0}function Qe(i,e){if(i===e)return!0;const t=Object.keys(i),r=Object.keys(e);for(const o of t){if(!r.includes(o))return!1;const c=i[o],h=e[o];if(Jr(c)&&Jr(h)){if(!Qe(c,h))return!1}else if(c!==h)return!1}for(const o of r)if(!t.includes(o))return!1;return!0}function Jr(i){return i!==null&&typeof i=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gt(i){const e=[];for(const[t,r]of Object.entries(i))Array.isArray(r)?r.forEach(o=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(o))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function Dt(i){const e={};return i.replace(/^\?/,"").split("&").forEach(r=>{if(r){const[o,c]=r.split("=");e[decodeURIComponent(o)]=decodeURIComponent(c)}}),e}function Lt(i){const e=i.indexOf("?");if(!e)return"";const t=i.indexOf("#",e);return i.substring(e,t>0?t:void 0)}function Ya(i,e){const t=new Qa(i,e);return t.subscribe.bind(t)}class Qa{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let o;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");Za(e,["next","error","complete"])?o=e:o={next:e,error:t,complete:r},o.next===void 0&&(o.next=oi),o.error===void 0&&(o.error=oi),o.complete===void 0&&(o.complete=oi);const c=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?o.error(this.finalError):o.complete()}catch{}}),this.observers.push(o),c}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Za(i,e){if(typeof i!="object"||i===null)return!1;for(const t of e)if(t in i&&typeof i[t]=="function")return!0;return!1}function oi(){}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ec=1e3,tc=2,nc=14400*1e3,ic=.5;function vd(i,e=ec,t=tc){const r=e*Math.pow(t,i),o=Math.round(ic*r*(Math.random()-.5)*2);return Math.min(nc,r+o)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ie(i){return i&&i._delegate?i._delegate:i}class Fe{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qe="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rc{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new Ua;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const o=this.getOrInitializeService({instanceIdentifier:t});o&&r.resolve(o)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e?.identifier),r=e?.optional??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(o){if(r)return null;throw o}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(oc(e))try{this.getOrInitializeService({instanceIdentifier:qe})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const o=this.normalizeInstanceIdentifier(t);try{const c=this.getOrInitializeService({instanceIdentifier:o});r.resolve(c)}catch{}}}}clearInstance(e=qe){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=qe){return this.instances.has(e)}getOptions(e=qe){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const o=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[c,h]of this.instancesDeferred.entries()){const g=this.normalizeInstanceIdentifier(c);r===g&&h.resolve(o)}return o}onInit(e,t){const r=this.normalizeInstanceIdentifier(t),o=this.onInitCallbacks.get(r)??new Set;o.add(e),this.onInitCallbacks.set(r,o);const c=this.instances.get(r);return c&&e(c,r),()=>{o.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const o of r)try{o(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:sc(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=qe){return this.component?this.component.multipleInstances?e:qe:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function sc(i){return i===qe?void 0:i}function oc(i){return i.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ac{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new rc(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var L;(function(i){i[i.DEBUG=0]="DEBUG",i[i.VERBOSE=1]="VERBOSE",i[i.INFO=2]="INFO",i[i.WARN=3]="WARN",i[i.ERROR=4]="ERROR",i[i.SILENT=5]="SILENT"})(L||(L={}));const cc={debug:L.DEBUG,verbose:L.VERBOSE,info:L.INFO,warn:L.WARN,error:L.ERROR,silent:L.SILENT},hc=L.INFO,lc={[L.DEBUG]:"log",[L.VERBOSE]:"log",[L.INFO]:"info",[L.WARN]:"warn",[L.ERROR]:"error"},uc=(i,e,...t)=>{if(e<i.logLevel)return;const r=new Date().toISOString(),o=lc[e];if(o)console[o](`[${r}]  ${i.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Ri{constructor(e){this.name=e,this._logLevel=hc,this._logHandler=uc,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in L))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?cc[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,L.DEBUG,...e),this._logHandler(this,L.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,L.VERBOSE,...e),this._logHandler(this,L.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,L.INFO,...e),this._logHandler(this,L.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,L.WARN,...e),this._logHandler(this,L.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,L.ERROR,...e),this._logHandler(this,L.ERROR,...e)}}const dc=(i,e)=>e.some(t=>i instanceof t);let Xr,Yr;function fc(){return Xr||(Xr=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function pc(){return Yr||(Yr=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Xs=new WeakMap,gi=new WeakMap,Ys=new WeakMap,ai=new WeakMap,ki=new WeakMap;function gc(i){const e=new Promise((t,r)=>{const o=()=>{i.removeEventListener("success",c),i.removeEventListener("error",h)},c=()=>{t(Ue(i.result)),o()},h=()=>{r(i.error),o()};i.addEventListener("success",c),i.addEventListener("error",h)});return e.then(t=>{t instanceof IDBCursor&&Xs.set(t,i)}).catch(()=>{}),ki.set(e,i),e}function mc(i){if(gi.has(i))return;const e=new Promise((t,r)=>{const o=()=>{i.removeEventListener("complete",c),i.removeEventListener("error",h),i.removeEventListener("abort",h)},c=()=>{t(),o()},h=()=>{r(i.error||new DOMException("AbortError","AbortError")),o()};i.addEventListener("complete",c),i.addEventListener("error",h),i.addEventListener("abort",h)});gi.set(i,e)}let mi={get(i,e,t){if(i instanceof IDBTransaction){if(e==="done")return gi.get(i);if(e==="objectStoreNames")return i.objectStoreNames||Ys.get(i);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Ue(i[e])},set(i,e,t){return i[e]=t,!0},has(i,e){return i instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in i}};function _c(i){mi=i(mi)}function yc(i){return i===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const r=i.call(ci(this),e,...t);return Ys.set(r,e.sort?e.sort():[e]),Ue(r)}:pc().includes(i)?function(...e){return i.apply(ci(this),e),Ue(Xs.get(this))}:function(...e){return Ue(i.apply(ci(this),e))}}function wc(i){return typeof i=="function"?yc(i):(i instanceof IDBTransaction&&mc(i),dc(i,fc())?new Proxy(i,mi):i)}function Ue(i){if(i instanceof IDBRequest)return gc(i);if(ai.has(i))return ai.get(i);const e=wc(i);return e!==i&&(ai.set(i,e),ki.set(e,i)),e}const ci=i=>ki.get(i);function Ic(i,e,{blocked:t,upgrade:r,blocking:o,terminated:c}={}){const h=indexedDB.open(i,e),g=Ue(h);return r&&h.addEventListener("upgradeneeded",I=>{r(Ue(h.result),I.oldVersion,I.newVersion,Ue(h.transaction),I)}),t&&h.addEventListener("blocked",I=>t(I.oldVersion,I.newVersion,I)),g.then(I=>{c&&I.addEventListener("close",()=>c()),o&&I.addEventListener("versionchange",v=>o(v.oldVersion,v.newVersion,v))}).catch(()=>{}),g}const Ec=["get","getKey","getAll","getAllKeys","count"],vc=["put","add","delete","clear"],hi=new Map;function Qr(i,e){if(!(i instanceof IDBDatabase&&!(e in i)&&typeof e=="string"))return;if(hi.get(e))return hi.get(e);const t=e.replace(/FromIndex$/,""),r=e!==t,o=vc.includes(t);if(!(t in(r?IDBIndex:IDBObjectStore).prototype)||!(o||Ec.includes(t)))return;const c=async function(h,...g){const I=this.transaction(h,o?"readwrite":"readonly");let v=I.store;return r&&(v=v.index(g.shift())),(await Promise.all([v[t](...g),o&&I.done]))[0]};return hi.set(e,c),c}_c(i=>({...i,get:(e,t,r)=>Qr(e,t)||i.get(e,t,r),has:(e,t)=>!!Qr(e,t)||i.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tc{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Ac(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function Ac(i){return i.getComponent()?.type==="VERSION"}const _i="@firebase/app",Zr="0.14.6";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ie=new Ri("@firebase/app"),Sc="@firebase/app-compat",bc="@firebase/analytics-compat",Cc="@firebase/analytics",Pc="@firebase/app-check-compat",Rc="@firebase/app-check",kc="@firebase/auth",Nc="@firebase/auth-compat",Oc="@firebase/database",Dc="@firebase/data-connect",Lc="@firebase/database-compat",Mc="@firebase/functions",Uc="@firebase/functions-compat",xc="@firebase/installations",Fc="@firebase/installations-compat",Vc="@firebase/messaging",jc="@firebase/messaging-compat",Bc="@firebase/performance",Hc="@firebase/performance-compat",$c="@firebase/remote-config",Wc="@firebase/remote-config-compat",Gc="@firebase/storage",zc="@firebase/storage-compat",qc="@firebase/firestore",Kc="@firebase/ai",Jc="@firebase/firestore-compat",Xc="firebase",Yc="12.6.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yi="[DEFAULT]",Qc={[_i]:"fire-core",[Sc]:"fire-core-compat",[Cc]:"fire-analytics",[bc]:"fire-analytics-compat",[Rc]:"fire-app-check",[Pc]:"fire-app-check-compat",[kc]:"fire-auth",[Nc]:"fire-auth-compat",[Oc]:"fire-rtdb",[Dc]:"fire-data-connect",[Lc]:"fire-rtdb-compat",[Mc]:"fire-fn",[Uc]:"fire-fn-compat",[xc]:"fire-iid",[Fc]:"fire-iid-compat",[Vc]:"fire-fcm",[jc]:"fire-fcm-compat",[Bc]:"fire-perf",[Hc]:"fire-perf-compat",[$c]:"fire-rc",[Wc]:"fire-rc-compat",[Gc]:"fire-gcs",[zc]:"fire-gcs-compat",[qc]:"fire-fst",[Jc]:"fire-fst-compat",[Kc]:"fire-vertex","fire-js":"fire-js",[Xc]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const In=new Map,Zc=new Map,wi=new Map;function es(i,e){try{i.container.addComponent(e)}catch(t){Ie.debug(`Component ${e.name} failed to register with FirebaseApp ${i.name}`,t)}}function Ze(i){const e=i.name;if(wi.has(e))return Ie.debug(`There were multiple attempts to register component ${e}.`),!1;wi.set(e,i);for(const t of In.values())es(t,i);for(const t of Zc.values())es(t,i);return!0}function kn(i,e){const t=i.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),i.container.getProvider(e)}function J(i){return i==null?!1:i.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eh={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},xe=new Wt("app","Firebase",eh);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class th{constructor(e,t,r){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new Fe("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw xe.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gt=Yc;function nh(i,e={}){let t=i;typeof e!="object"&&(e={name:e});const r={name:yi,automaticDataCollectionEnabled:!0,...e},o=r.name;if(typeof o!="string"||!o)throw xe.create("bad-app-name",{appName:String(o)});if(t||(t=Ks()),!t)throw xe.create("no-options");const c=In.get(o);if(c){if(Qe(t,c.options)&&Qe(r,c.config))return c;throw xe.create("duplicate-app",{appName:o})}const h=new ac(o);for(const I of wi.values())h.addComponent(I);const g=new th(t,r,h);return In.set(o,g),g}function Ni(i=yi){const e=In.get(i);if(!e&&i===yi&&Ks())return nh();if(!e)throw xe.create("no-app",{appName:i});return e}function de(i,e,t){let r=Qc[i]??i;t&&(r+=`-${t}`);const o=r.match(/\s|\//),c=e.match(/\s|\//);if(o||c){const h=[`Unable to register library "${r}" with version "${e}":`];o&&h.push(`library name "${r}" contains illegal characters (whitespace or "/")`),o&&c&&h.push("and"),c&&h.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Ie.warn(h.join(" "));return}Ze(new Fe(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ih="firebase-heartbeat-database",rh=1,jt="firebase-heartbeat-store";let li=null;function Qs(){return li||(li=Ic(ih,rh,{upgrade:(i,e)=>{switch(e){case 0:try{i.createObjectStore(jt)}catch(t){console.warn(t)}}}}).catch(i=>{throw xe.create("idb-open",{originalErrorMessage:i.message})})),li}async function sh(i){try{const t=(await Qs()).transaction(jt),r=await t.objectStore(jt).get(Zs(i));return await t.done,r}catch(e){if(e instanceof me)Ie.warn(e.message);else{const t=xe.create("idb-get",{originalErrorMessage:e?.message});Ie.warn(t.message)}}}async function ts(i,e){try{const r=(await Qs()).transaction(jt,"readwrite");await r.objectStore(jt).put(e,Zs(i)),await r.done}catch(t){if(t instanceof me)Ie.warn(t.message);else{const r=xe.create("idb-set",{originalErrorMessage:t?.message});Ie.warn(r.message)}}}function Zs(i){return`${i.name}!${i.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oh=1024,ah=30;class ch{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new lh(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){try{const t=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=ns();if(this._heartbeatsCache?.heartbeats==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(o=>o.date===r))return;if(this._heartbeatsCache.heartbeats.push({date:r,agent:t}),this._heartbeatsCache.heartbeats.length>ah){const o=uh(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){Ie.warn(e)}}async getHeartbeatsHeader(){try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=ns(),{heartbeatsToSend:t,unsentEntries:r}=hh(this._heartbeatsCache.heartbeats),o=wn(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return Ie.warn(e),""}}}function ns(){return new Date().toISOString().substring(0,10)}function hh(i,e=oh){const t=[];let r=i.slice();for(const o of i){const c=t.find(h=>h.agent===o.agent);if(c){if(c.dates.push(o.date),is(t)>e){c.dates.pop();break}}else if(t.push({agent:o.agent,dates:[o.date]}),is(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class lh{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ga()?za().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await sh(this.app);return t?.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return ts(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return ts(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function is(i){return wn(JSON.stringify({version:2,heartbeats:i})).length}function uh(i){if(i.length===0)return-1;let e=0,t=i[0].date;for(let r=1;r<i.length;r++)i[r].date<t&&(t=i[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dh(i){Ze(new Fe("platform-logger",e=>new Tc(e),"PRIVATE")),Ze(new Fe("heartbeat",e=>new ch(e),"PRIVATE")),de(_i,Zr,i),de(_i,Zr,"esm2020"),de("fire-js","")}dh("");function eo(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const fh=eo,to=new Wt("auth","Firebase",eo());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const En=new Ri("@firebase/auth");function ph(i,...e){En.logLevel<=L.WARN&&En.warn(`Auth (${gt}): ${i}`,...e)}function pn(i,...e){En.logLevel<=L.ERROR&&En.error(`Auth (${gt}): ${i}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ne(i,...e){throw Di(i,...e)}function fe(i,...e){return Di(i,...e)}function Oi(i,e,t){const r={...fh(),[e]:t};return new Wt("auth","Firebase",r).create(e,{appName:i.name})}function pe(i){return Oi(i,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function gh(i,e,t){const r=t;if(!(e instanceof r))throw r.name!==e.constructor.name&&ne(i,"argument-error"),Oi(i,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function Di(i,...e){if(typeof i!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=i.name),i._errorFactory.create(t,...r)}return to.create(i,...e)}function C(i,e,...t){if(!i)throw Di(e,...t)}function ye(i){const e="INTERNAL ASSERTION FAILED: "+i;throw pn(e),new Error(e)}function Ee(i,e){i||ye(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ii(){return typeof self<"u"&&self.location?.href||""}function mh(){return rs()==="http:"||rs()==="https:"}function rs(){return typeof self<"u"&&self.location?.protocol||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _h(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(mh()||Ha()||"connection"in navigator)?navigator.onLine:!0}function yh(){if(typeof navigator>"u")return null;const i=navigator;return i.languages&&i.languages[0]||i.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zt{constructor(e,t){this.shortDelay=e,this.longDelay=t,Ee(t>e,"Short delay should be less than long delay!"),this.isMobile=ja()||$a()}get(){return _h()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Li(i,e){Ee(i.emulator,"Emulator should always be set here");const{url:t}=i.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class no{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;ye("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;ye("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;ye("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wh={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ih=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],Eh=new zt(3e4,6e4);function je(i,e){return i.tenantId&&!e.tenantId?{...e,tenantId:i.tenantId}:e}async function Be(i,e,t,r,o={}){return io(i,o,async()=>{let c={},h={};r&&(e==="GET"?h=r:c={body:JSON.stringify(r)});const g=Gt({key:i.config.apiKey,...h}).slice(1),I=await i._getAdditionalHeaders();I["Content-Type"]="application/json",i.languageCode&&(I["X-Firebase-Locale"]=i.languageCode);const v={method:e,headers:I,...c};return Ba()||(v.referrerPolicy="no-referrer"),i.emulatorConfig&&it(i.emulatorConfig.host)&&(v.credentials="include"),no.fetch()(await ro(i,i.config.apiHost,t,g),v)})}async function io(i,e,t){i._canInitEmulator=!1;const r={...wh,...e};try{const o=new Th(i),c=await Promise.race([t(),o.promise]);o.clearNetworkTimeout();const h=await c.json();if("needConfirmation"in h)throw un(i,"account-exists-with-different-credential",h);if(c.ok&&!("errorMessage"in h))return h;{const g=c.ok?h.errorMessage:h.error.message,[I,v]=g.split(" : ");if(I==="FEDERATED_USER_ID_ALREADY_LINKED")throw un(i,"credential-already-in-use",h);if(I==="EMAIL_EXISTS")throw un(i,"email-already-in-use",h);if(I==="USER_DISABLED")throw un(i,"user-disabled",h);const S=r[I]||I.toLowerCase().replace(/[_\s]+/g,"-");if(v)throw Oi(i,S,v);ne(i,S)}}catch(o){if(o instanceof me)throw o;ne(i,"network-request-failed",{message:String(o)})}}async function qt(i,e,t,r,o={}){const c=await Be(i,e,t,r,o);return"mfaPendingCredential"in c&&ne(i,"multi-factor-auth-required",{_serverResponse:c}),c}async function ro(i,e,t,r){const o=`${e}${t}?${r}`,c=i,h=c.config.emulator?Li(i.config,o):`${i.config.apiScheme}://${o}`;return Ih.includes(t)&&(await c._persistenceManagerAvailable,c._getPersistenceType()==="COOKIE")?c._getPersistence()._getFinalTarget(h).toString():h}function vh(i){switch(i){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class Th{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(fe(this.auth,"network-request-failed")),Eh.get())})}}function un(i,e,t){const r={appName:i.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const o=fe(i,e,r);return o.customData._tokenResponse=t,o}function ss(i){return i!==void 0&&i.enterprise!==void 0}class Ah{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return vh(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}async function Sh(i,e){return Be(i,"GET","/v2/recaptchaConfig",je(i,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function bh(i,e){return Be(i,"POST","/v1/accounts:delete",e)}async function vn(i,e){return Be(i,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ut(i){if(i)try{const e=new Date(Number(i));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function Ch(i,e=!1){const t=ie(i),r=await t.getIdToken(e),o=Mi(r);C(o&&o.exp&&o.auth_time&&o.iat,t.auth,"internal-error");const c=typeof o.firebase=="object"?o.firebase:void 0,h=c?.sign_in_provider;return{claims:o,token:r,authTime:Ut(ui(o.auth_time)),issuedAtTime:Ut(ui(o.iat)),expirationTime:Ut(ui(o.exp)),signInProvider:h||null,signInSecondFactor:c?.sign_in_second_factor||null}}function ui(i){return Number(i)*1e3}function Mi(i){const[e,t,r]=i.split(".");if(e===void 0||t===void 0||r===void 0)return pn("JWT malformed, contained fewer than 3 sections"),null;try{const o=Gs(t);return o?JSON.parse(o):(pn("Failed to decode base64 JWT payload"),null)}catch(o){return pn("Caught error parsing JWT payload as JSON",o?.toString()),null}}function os(i){const e=Mi(i);return C(e,"internal-error"),C(typeof e.exp<"u","internal-error"),C(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bt(i,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof me&&Ph(r)&&i.auth.currentUser===i&&await i.auth.signOut(),r}}function Ph({code:i}){return i==="auth/user-disabled"||i==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rh{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){e?.code==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ei{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Ut(this.lastLoginAt),this.creationTime=Ut(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Tn(i){const e=i.auth,t=await i.getIdToken(),r=await Bt(i,vn(e,{idToken:t}));C(r?.users.length,e,"internal-error");const o=r.users[0];i._notifyReloadListener(o);const c=o.providerUserInfo?.length?so(o.providerUserInfo):[],h=Nh(i.providerData,c),g=i.isAnonymous,I=!(i.email&&o.passwordHash)&&!h?.length,v=g?I:!1,S={uid:o.localId,displayName:o.displayName||null,photoURL:o.photoUrl||null,email:o.email||null,emailVerified:o.emailVerified||!1,phoneNumber:o.phoneNumber||null,tenantId:o.tenantId||null,providerData:h,metadata:new Ei(o.createdAt,o.lastLoginAt),isAnonymous:v};Object.assign(i,S)}async function kh(i){const e=ie(i);await Tn(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Nh(i,e){return[...i.filter(r=>!e.some(o=>o.providerId===r.providerId)),...e]}function so(i){return i.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Oh(i,e){const t=await io(i,{},async()=>{const r=Gt({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:o,apiKey:c}=i.config,h=await ro(i,o,"/v1/token",`key=${c}`),g=await i._getAdditionalHeaders();g["Content-Type"]="application/x-www-form-urlencoded";const I={method:"POST",headers:g,body:r};return i.emulatorConfig&&it(i.emulatorConfig.host)&&(I.credentials="include"),no.fetch()(h,I)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function Dh(i,e){return Be(i,"POST","/v2/accounts:revokeToken",je(i,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){C(e.idToken,"internal-error"),C(typeof e.idToken<"u","internal-error"),C(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):os(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){C(e.length!==0,"internal-error");const t=os(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(C(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:o,expiresIn:c}=await Oh(e,t);this.updateTokensAndExpiration(r,o,Number(c))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:o,expirationTime:c}=t,h=new ht;return r&&(C(typeof r=="string","internal-error",{appName:e}),h.refreshToken=r),o&&(C(typeof o=="string","internal-error",{appName:e}),h.accessToken=o),c&&(C(typeof c=="number","internal-error",{appName:e}),h.expirationTime=c),h}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new ht,this.toJSON())}_performRefresh(){return ye("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ne(i,e){C(typeof i=="string"||typeof i>"u","internal-error",{appName:e})}class se{constructor({uid:e,auth:t,stsTokenManager:r,...o}){this.providerId="firebase",this.proactiveRefresh=new Rh(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=o.displayName||null,this.email=o.email||null,this.emailVerified=o.emailVerified||!1,this.phoneNumber=o.phoneNumber||null,this.photoURL=o.photoURL||null,this.isAnonymous=o.isAnonymous||!1,this.tenantId=o.tenantId||null,this.providerData=o.providerData?[...o.providerData]:[],this.metadata=new Ei(o.createdAt||void 0,o.lastLoginAt||void 0)}async getIdToken(e){const t=await Bt(this,this.stsTokenManager.getToken(this.auth,e));return C(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Ch(this,e)}reload(){return kh(this)}_assign(e){this!==e&&(C(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new se({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){C(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await Tn(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(J(this.auth.app))return Promise.reject(pe(this.auth));const e=await this.getIdToken();return await Bt(this,bh(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const r=t.displayName??void 0,o=t.email??void 0,c=t.phoneNumber??void 0,h=t.photoURL??void 0,g=t.tenantId??void 0,I=t._redirectEventId??void 0,v=t.createdAt??void 0,S=t.lastLoginAt??void 0,{uid:b,emailVerified:A,isAnonymous:O,providerData:D,stsTokenManager:V}=t;C(b&&V,e,"internal-error");const x=ht.fromJSON(this.name,V);C(typeof b=="string",e,"internal-error"),Ne(r,e.name),Ne(o,e.name),C(typeof A=="boolean",e,"internal-error"),C(typeof O=="boolean",e,"internal-error"),Ne(c,e.name),Ne(h,e.name),Ne(g,e.name),Ne(I,e.name),Ne(v,e.name),Ne(S,e.name);const Y=new se({uid:b,auth:e,email:o,emailVerified:A,displayName:r,isAnonymous:O,photoURL:h,phoneNumber:c,tenantId:g,stsTokenManager:x,createdAt:v,lastLoginAt:S});return D&&Array.isArray(D)&&(Y.providerData=D.map(Q=>({...Q}))),I&&(Y._redirectEventId=I),Y}static async _fromIdTokenResponse(e,t,r=!1){const o=new ht;o.updateFromServerResponse(t);const c=new se({uid:t.localId,auth:e,stsTokenManager:o,isAnonymous:r});return await Tn(c),c}static async _fromGetAccountInfoResponse(e,t,r){const o=t.users[0];C(o.localId!==void 0,"internal-error");const c=o.providerUserInfo!==void 0?so(o.providerUserInfo):[],h=!(o.email&&o.passwordHash)&&!c?.length,g=new ht;g.updateFromIdToken(r);const I=new se({uid:o.localId,auth:e,stsTokenManager:g,isAnonymous:h}),v={uid:o.localId,displayName:o.displayName||null,photoURL:o.photoUrl||null,email:o.email||null,emailVerified:o.emailVerified||!1,phoneNumber:o.phoneNumber||null,tenantId:o.tenantId||null,providerData:c,metadata:new Ei(o.createdAt,o.lastLoginAt),isAnonymous:!(o.email&&o.passwordHash)&&!c?.length};return Object.assign(I,v),I}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const as=new Map;function we(i){Ee(i instanceof Function,"Expected a class definition");let e=as.get(i);return e?(Ee(e instanceof i,"Instance stored in cache mismatched with class"),e):(e=new i,as.set(i,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oo{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}oo.type="NONE";const cs=oo;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gn(i,e,t){return`firebase:${i}:${e}:${t}`}class lt{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:o,name:c}=this.auth;this.fullUserKey=gn(this.userKey,o.apiKey,c),this.fullPersistenceKey=gn("persistence",o.apiKey,c),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await vn(this.auth,{idToken:e}).catch(()=>{});return t?se._fromGetAccountInfoResponse(this.auth,t,e):null}return se._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new lt(we(cs),e,r);const o=(await Promise.all(t.map(async v=>{if(await v._isAvailable())return v}))).filter(v=>v);let c=o[0]||we(cs);const h=gn(r,e.config.apiKey,e.name);let g=null;for(const v of t)try{const S=await v._get(h);if(S){let b;if(typeof S=="string"){const A=await vn(e,{idToken:S}).catch(()=>{});if(!A)break;b=await se._fromGetAccountInfoResponse(e,A,S)}else b=se._fromJSON(e,S);v!==c&&(g=b),c=v;break}}catch{}const I=o.filter(v=>v._shouldAllowMigration);return!c._shouldAllowMigration||!I.length?new lt(c,e,r):(c=I[0],g&&await c._set(h,g.toJSON()),await Promise.all(t.map(async v=>{if(v!==c)try{await v._remove(h)}catch{}})),new lt(c,e,r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hs(i){const e=i.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(lo(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(ao(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(fo(e))return"Blackberry";if(po(e))return"Webos";if(co(e))return"Safari";if((e.includes("chrome/")||ho(e))&&!e.includes("edge/"))return"Chrome";if(uo(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=i.match(t);if(r?.length===2)return r[1]}return"Other"}function ao(i=q()){return/firefox\//i.test(i)}function co(i=q()){const e=i.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function ho(i=q()){return/crios\//i.test(i)}function lo(i=q()){return/iemobile/i.test(i)}function uo(i=q()){return/android/i.test(i)}function fo(i=q()){return/blackberry/i.test(i)}function po(i=q()){return/webos/i.test(i)}function Ui(i=q()){return/iphone|ipad|ipod/i.test(i)||/macintosh/i.test(i)&&/mobile/i.test(i)}function Lh(i=q()){return Ui(i)&&!!window.navigator?.standalone}function Mh(){return Wa()&&document.documentMode===10}function go(i=q()){return Ui(i)||uo(i)||po(i)||fo(i)||/windows phone/i.test(i)||lo(i)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mo(i,e=[]){let t;switch(i){case"Browser":t=hs(q());break;case"Worker":t=`${hs(q())}-${i}`;break;default:t=i}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${gt}/${r}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uh{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=c=>new Promise((h,g)=>{try{const I=e(c);h(I)}catch(I){g(I)}});r.onAbort=t,this.queue.push(r);const o=this.queue.length-1;return()=>{this.queue[o]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const o of t)try{o()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r?.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xh(i,e={}){return Be(i,"GET","/v2/passwordPolicy",je(i,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fh=6;class Vh{constructor(e){const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??Fh,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=e.allowedNonAlphanumericCharacters?.join("")??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,o=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),o&&(t.meetsMaxPasswordLength=e.length<=o)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let o=0;o<e.length;o++)r=e.charAt(o),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,o,c){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=o)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=c))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jh{constructor(e,t,r,o){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=o,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new ls(this),this.idTokenSubscription=new ls(this),this.beforeStateQueue=new Uh(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=to,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=o.sdkClientVersion,this._persistenceManagerAvailable=new Promise(c=>this._resolvePersistenceManagerAvailable=c)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=we(t)),this._initializationPromise=this.queue(async()=>{if(!this._deleted&&(this.persistenceManager=await lt.create(this,e),this._resolvePersistenceManagerAvailable?.(),!this._deleted)){if(this._popupRedirectResolver?._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=this.currentUser?.uid||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await vn(this,{idToken:e}),r=await se._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){if(J(this.app)){const c=this.app.settings.authIdToken;return c?new Promise(h=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(c).then(h,h))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let r=t,o=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const c=this.redirectUser?._redirectEventId,h=r?._redirectEventId,g=await this.tryRedirectSignIn(e);(!c||c===h)&&g?.user&&(r=g.user,o=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(o)try{await this.beforeStateQueue.runMiddleware(r)}catch(c){r=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(c))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return C(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Tn(e)}catch(t){if(t?.code!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=yh()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(J(this.app))return Promise.reject(pe(this));const t=e?ie(e):null;return t&&C(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&C(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return J(this.app)?Promise.reject(pe(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return J(this.app)?Promise.reject(pe(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(we(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await xh(this),t=new Vh(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new Wt("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await Dh(this,r)}}toJSON(){return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:this._currentUser?.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&we(e)||this._popupRedirectResolver;C(t,this,"argument-error"),this.redirectPersistenceManager=await lt.create(this,[we(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){return this._isInitialized&&await this.queue(async()=>{}),this._currentUser?._redirectEventId===e?this._currentUser:this.redirectUser?._redirectEventId===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=this.currentUser?.uid??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,o){if(this._deleted)return()=>{};const c=typeof t=="function"?t:t.next.bind(t);let h=!1;const g=this._isInitialized?Promise.resolve():this._initializationPromise;if(C(g,this,"internal-error"),g.then(()=>{h||c(this.currentUser)}),typeof t=="function"){const I=e.addObserver(t,r,o);return()=>{h=!0,I()}}else{const I=e.addObserver(t);return()=>{h=!0,I()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return C(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=mo(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await this.heartbeatServiceProvider.getImmediate({optional:!0})?.getHeartbeatsHeader();t&&(e["X-Firebase-Client"]=t);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){if(J(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await this.appCheckServiceProvider.getImmediate({optional:!0})?.getToken();return e?.error&&ph(`Error while retrieving App Check token: ${e.error}`),e?.token}}function ve(i){return ie(i)}class ls{constructor(e){this.auth=e,this.observer=null,this.addObserver=Ya(t=>this.observer=t)}get next(){return C(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Nn={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Bh(i){Nn=i}function _o(i){return Nn.loadJS(i)}function Hh(){return Nn.recaptchaEnterpriseScript}function $h(){return Nn.gapiScript}function Wh(i){return`__${i}${Math.floor(Math.random()*1e6)}`}class Gh{constructor(){this.enterprise=new zh}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class zh{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}const qh="recaptcha-enterprise",yo="NO_RECAPTCHA";class Kh{constructor(e){this.type=qh,this.auth=ve(e)}async verify(e="verify",t=!1){async function r(c){if(!t){if(c.tenantId==null&&c._agentRecaptchaConfig!=null)return c._agentRecaptchaConfig.siteKey;if(c.tenantId!=null&&c._tenantRecaptchaConfigs[c.tenantId]!==void 0)return c._tenantRecaptchaConfigs[c.tenantId].siteKey}return new Promise(async(h,g)=>{Sh(c,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(I=>{if(I.recaptchaKey===void 0)g(new Error("recaptcha Enterprise site key undefined"));else{const v=new Ah(I);return c.tenantId==null?c._agentRecaptchaConfig=v:c._tenantRecaptchaConfigs[c.tenantId]=v,h(v.siteKey)}}).catch(I=>{g(I)})})}function o(c,h,g){const I=window.grecaptcha;ss(I)?I.enterprise.ready(()=>{I.enterprise.execute(c,{action:e}).then(v=>{h(v)}).catch(()=>{h(yo)})}):g(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new Gh().execute("siteKey",{action:"verify"}):new Promise((c,h)=>{r(this.auth).then(g=>{if(!t&&ss(window.grecaptcha))o(g,c,h);else{if(typeof window>"u"){h(new Error("RecaptchaVerifier is only supported in browser"));return}let I=Hh();I.length!==0&&(I+=g),_o(I).then(()=>{o(g,c,h)}).catch(v=>{h(v)})}}).catch(g=>{h(g)})})}}async function us(i,e,t,r=!1,o=!1){const c=new Kh(i);let h;if(o)h=yo;else try{h=await c.verify(t)}catch{h=await c.verify(t,!0)}const g={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in g){const I=g.phoneEnrollmentInfo.phoneNumber,v=g.phoneEnrollmentInfo.recaptchaToken;Object.assign(g,{phoneEnrollmentInfo:{phoneNumber:I,recaptchaToken:v,captchaResponse:h,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in g){const I=g.phoneSignInInfo.recaptchaToken;Object.assign(g,{phoneSignInInfo:{recaptchaToken:I,captchaResponse:h,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return g}return r?Object.assign(g,{captchaResp:h}):Object.assign(g,{captchaResponse:h}),Object.assign(g,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(g,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),g}async function vi(i,e,t,r,o){if(i._getRecaptchaConfig()?.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const c=await us(i,e,t,t==="getOobCode");return r(i,c)}else return r(i,e).catch(async c=>{if(c.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const h=await us(i,e,t,t==="getOobCode");return r(i,h)}else return Promise.reject(c)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jh(i,e){const t=kn(i,"auth");if(t.isInitialized()){const o=t.getImmediate(),c=t.getOptions();if(Qe(c,e??{}))return o;ne(o,"already-initialized")}return t.initialize({options:e})}function Xh(i,e){const t=e?.persistence||[],r=(Array.isArray(t)?t:[t]).map(we);e?.errorMap&&i._updateErrorMap(e.errorMap),i._initializeWithPersistence(r,e?.popupRedirectResolver)}function Yh(i,e,t){const r=ve(i);C(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");const o=!1,c=wo(e),{host:h,port:g}=Qh(e),I=g===null?"":`:${g}`,v={url:`${c}//${h}${I}/`},S=Object.freeze({host:h,port:g,protocol:c.replace(":",""),options:Object.freeze({disableWarnings:o})});if(!r._canInitEmulator){C(r.config.emulator&&r.emulatorConfig,r,"emulator-config-failed"),C(Qe(v,r.config.emulator)&&Qe(S,r.emulatorConfig),r,"emulator-config-failed");return}r.config.emulator=v,r.emulatorConfig=S,r.settings.appVerificationDisabledForTesting=!0,it(h)?(Ci(`${c}//${h}${I}`),Pi("Auth",!0)):Zh()}function wo(i){const e=i.indexOf(":");return e<0?"":i.substr(0,e+1)}function Qh(i){const e=wo(i),t=/(\/\/)?([^?#/]+)/.exec(i.substr(e.length));if(!t)return{host:"",port:null};const r=t[2].split("@").pop()||"",o=/^(\[[^\]]+\])(:|$)/.exec(r);if(o){const c=o[1];return{host:c,port:ds(r.substr(c.length+1))}}else{const[c,h]=r.split(":");return{host:c,port:ds(h)}}}function ds(i){if(!i)return null;const e=Number(i);return isNaN(e)?null:e}function Zh(){function i(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",i):i())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xi{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return ye("not implemented")}_getIdTokenResponse(e){return ye("not implemented")}_linkToIdToken(e,t){return ye("not implemented")}_getReauthenticationResolver(e){return ye("not implemented")}}async function el(i,e){return Be(i,"POST","/v1/accounts:signUp",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function tl(i,e){return qt(i,"POST","/v1/accounts:signInWithPassword",je(i,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function nl(i,e){return qt(i,"POST","/v1/accounts:signInWithEmailLink",je(i,e))}async function il(i,e){return qt(i,"POST","/v1/accounts:signInWithEmailLink",je(i,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht extends xi{constructor(e,t,r,o=null){super("password",r),this._email=e,this._password=t,this._tenantId=o}static _fromEmailAndPassword(e,t){return new Ht(e,t,"password")}static _fromEmailAndCode(e,t,r=null){return new Ht(e,t,"emailLink",r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t?.email&&t?.password){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return vi(e,t,"signInWithPassword",tl);case"emailLink":return nl(e,{email:this._email,oobCode:this._password});default:ne(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const r={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return vi(e,r,"signUpPassword",el);case"emailLink":return il(e,{idToken:t,email:this._email,oobCode:this._password});default:ne(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ut(i,e){return qt(i,"POST","/v1/accounts:signInWithIdp",je(i,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rl="http://localhost";class et extends xi{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new et(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):ne("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:o,...c}=t;if(!r||!o)return null;const h=new et(r,o);return h.idToken=c.idToken||void 0,h.accessToken=c.accessToken||void 0,h.secret=c.secret,h.nonce=c.nonce,h.pendingToken=c.pendingToken||null,h}_getIdTokenResponse(e){const t=this.buildRequest();return ut(e,t)}_linkToIdToken(e,t){const r=this.buildRequest();return r.idToken=t,ut(e,r)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ut(e,t)}buildRequest(){const e={requestUri:rl,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Gt(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sl(i){switch(i){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function ol(i){const e=Dt(Lt(i)).link,t=e?Dt(Lt(e)).deep_link_id:null,r=Dt(Lt(i)).deep_link_id;return(r?Dt(Lt(r)).link:null)||r||t||e||i}class Fi{constructor(e){const t=Dt(Lt(e)),r=t.apiKey??null,o=t.oobCode??null,c=sl(t.mode??null);C(r&&o&&c,"argument-error"),this.apiKey=r,this.operation=c,this.code=o,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){const t=ol(e);try{return new Fi(t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(){this.providerId=mt.PROVIDER_ID}static credential(e,t){return Ht._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const r=Fi.parseLink(t);return C(r,"argument-error"),Ht._fromEmailAndCode(e,r.code,r.tenantId)}}mt.PROVIDER_ID="password";mt.EMAIL_PASSWORD_SIGN_IN_METHOD="password";mt.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vi{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kt extends Vi{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oe extends Kt{constructor(){super("facebook.com")}static credential(e){return et._fromParams({providerId:Oe.PROVIDER_ID,signInMethod:Oe.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Oe.credentialFromTaggedObject(e)}static credentialFromError(e){return Oe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Oe.credential(e.oauthAccessToken)}catch{return null}}}Oe.FACEBOOK_SIGN_IN_METHOD="facebook.com";Oe.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class De extends Kt{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return et._fromParams({providerId:De.PROVIDER_ID,signInMethod:De.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return De.credentialFromTaggedObject(e)}static credentialFromError(e){return De.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:r}=e;if(!t&&!r)return null;try{return De.credential(t,r)}catch{return null}}}De.GOOGLE_SIGN_IN_METHOD="google.com";De.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le extends Kt{constructor(){super("github.com")}static credential(e){return et._fromParams({providerId:Le.PROVIDER_ID,signInMethod:Le.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Le.credentialFromTaggedObject(e)}static credentialFromError(e){return Le.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Le.credential(e.oauthAccessToken)}catch{return null}}}Le.GITHUB_SIGN_IN_METHOD="github.com";Le.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me extends Kt{constructor(){super("twitter.com")}static credential(e,t){return et._fromParams({providerId:Me.PROVIDER_ID,signInMethod:Me.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return Me.credentialFromTaggedObject(e)}static credentialFromError(e){return Me.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:r}=e;if(!t||!r)return null;try{return Me.credential(t,r)}catch{return null}}}Me.TWITTER_SIGN_IN_METHOD="twitter.com";Me.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function al(i,e){return qt(i,"POST","/v1/accounts:signUp",je(i,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tt{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,r,o=!1){const c=await se._fromIdTokenResponse(e,r,o),h=fs(r);return new tt({user:c,providerId:h,_tokenResponse:r,operationType:t})}static async _forOperation(e,t,r){await e._updateTokensIfNecessary(r,!0);const o=fs(r);return new tt({user:e,providerId:o,_tokenResponse:r,operationType:t})}}function fs(i){return i.providerId?i.providerId:"phoneNumber"in i?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class An extends me{constructor(e,t,r,o){super(t.code,t.message),this.operationType=r,this.user=o,Object.setPrototypeOf(this,An.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,t,r,o){return new An(e,t,r,o)}}function Io(i,e,t,r){return(e==="reauthenticate"?t._getReauthenticationResolver(i):t._getIdTokenResponse(i)).catch(c=>{throw c.code==="auth/multi-factor-auth-required"?An._fromErrorAndOperation(i,c,e,r):c})}async function cl(i,e,t=!1){const r=await Bt(i,e._linkToIdToken(i.auth,await i.getIdToken()),t);return tt._forOperation(i,"link",r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function hl(i,e,t=!1){const{auth:r}=i;if(J(r.app))return Promise.reject(pe(r));const o="reauthenticate";try{const c=await Bt(i,Io(r,o,e,i),t);C(c.idToken,r,"internal-error");const h=Mi(c.idToken);C(h,r,"internal-error");const{sub:g}=h;return C(i.uid===g,r,"user-mismatch"),tt._forOperation(i,o,c)}catch(c){throw c?.code==="auth/user-not-found"&&ne(r,"user-mismatch"),c}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Eo(i,e,t=!1){if(J(i.app))return Promise.reject(pe(i));const r="signIn",o=await Io(i,r,e),c=await tt._fromIdTokenResponse(i,r,o);return t||await i._updateCurrentUser(c.user),c}async function ll(i,e){return Eo(ve(i),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function vo(i){const e=ve(i);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function Td(i,e,t){if(J(i.app))return Promise.reject(pe(i));const r=ve(i),h=await vi(r,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",al).catch(I=>{throw I.code==="auth/password-does-not-meet-requirements"&&vo(i),I}),g=await tt._fromIdTokenResponse(r,"signIn",h);return await r._updateCurrentUser(g.user),g}function Ad(i,e,t){return J(i.app)?Promise.reject(pe(i)):ll(ie(i),mt.credential(e,t)).catch(async r=>{throw r.code==="auth/password-does-not-meet-requirements"&&vo(i),r})}function ul(i,e,t,r){return ie(i).onIdTokenChanged(e,t,r)}function dl(i,e,t){return ie(i).beforeAuthStateChanged(e,t)}function Sd(i,e,t,r){return ie(i).onAuthStateChanged(e,t,r)}function bd(i){return ie(i).signOut()}const Sn="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class To{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Sn,"1"),this.storage.removeItem(Sn),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fl=1e3,pl=10;class Ao extends To{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=go(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const r=this.storage.getItem(t),o=this.localCache[t];r!==o&&e(t,o,r)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((h,g,I)=>{this.notifyListeners(h,I)});return}const r=e.key;t?this.detachListener():this.stopPolling();const o=()=>{const h=this.storage.getItem(r);!t&&this.localCache[r]===h||this.notifyListeners(r,h)},c=this.storage.getItem(r);Mh()&&c!==e.newValue&&e.newValue!==e.oldValue?setTimeout(o,pl):o()}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const o of Array.from(r))o(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:r}),!0)})},fl)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Ao.type="LOCAL";const gl=Ao;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class So extends To{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}So.type="SESSION";const bo=So;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ml(i){return Promise.all(i.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class On{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(o=>o.isListeningto(e));if(t)return t;const r=new On(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:r,eventType:o,data:c}=t.data,h=this.handlersMap[o];if(!h?.size)return;t.ports[0].postMessage({status:"ack",eventId:r,eventType:o});const g=Array.from(h).map(async v=>v(t.origin,c)),I=await ml(g);t.ports[0].postMessage({status:"done",eventId:r,eventType:o,response:I})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}On.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ji(i="",e=10){let t="";for(let r=0;r<e;r++)t+=Math.floor(Math.random()*10);return i+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _l{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,r=50){const o=typeof MessageChannel<"u"?new MessageChannel:null;if(!o)throw new Error("connection_unavailable");let c,h;return new Promise((g,I)=>{const v=ji("",20);o.port1.start();const S=setTimeout(()=>{I(new Error("unsupported_event"))},r);h={messageChannel:o,onMessage(b){const A=b;if(A.data.eventId===v)switch(A.data.status){case"ack":clearTimeout(S),c=setTimeout(()=>{I(new Error("timeout"))},3e3);break;case"done":clearTimeout(c),g(A.data.response);break;default:clearTimeout(S),clearTimeout(c),I(new Error("invalid_response"));break}}},this.handlers.add(h),o.port1.addEventListener("message",h.onMessage),this.target.postMessage({eventType:e,eventId:v,data:t},[o.port2])}).finally(()=>{h&&this.removeMessageHandler(h)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ge(){return window}function yl(i){ge().location.href=i}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Co(){return typeof ge().WorkerGlobalScope<"u"&&typeof ge().importScripts=="function"}async function wl(){if(!navigator?.serviceWorker)return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Il(){return navigator?.serviceWorker?.controller||null}function El(){return Co()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Po="firebaseLocalStorageDb",vl=1,bn="firebaseLocalStorage",Ro="fbase_key";class Jt{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Dn(i,e){return i.transaction([bn],e?"readwrite":"readonly").objectStore(bn)}function Tl(){const i=indexedDB.deleteDatabase(Po);return new Jt(i).toPromise()}function Ti(){const i=indexedDB.open(Po,vl);return new Promise((e,t)=>{i.addEventListener("error",()=>{t(i.error)}),i.addEventListener("upgradeneeded",()=>{const r=i.result;try{r.createObjectStore(bn,{keyPath:Ro})}catch(o){t(o)}}),i.addEventListener("success",async()=>{const r=i.result;r.objectStoreNames.contains(bn)?e(r):(r.close(),await Tl(),e(await Ti()))})})}async function ps(i,e,t){const r=Dn(i,!0).put({[Ro]:e,value:t});return new Jt(r).toPromise()}async function Al(i,e){const t=Dn(i,!1).get(e),r=await new Jt(t).toPromise();return r===void 0?null:r.value}function gs(i,e){const t=Dn(i,!0).delete(e);return new Jt(t).toPromise()}const Sl=800,bl=3;class ko{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Ti(),this.db)}async _withRetries(e){let t=0;for(;;)try{const r=await this._openDb();return await e(r)}catch(r){if(t++>bl)throw r;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Co()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=On._getInstance(El()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){if(this.activeServiceWorker=await wl(),!this.activeServiceWorker)return;this.sender=new _l(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&e[0]?.fulfilled&&e[0]?.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Il()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await Ti();return await ps(e,Sn,"1"),await gs(e,Sn),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(r=>ps(r,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(r=>Al(r,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>gs(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(o=>{const c=Dn(o,!1).getAll();return new Jt(c).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],r=new Set;if(e.length!==0)for(const{fbase_key:o,value:c}of e)r.add(o),JSON.stringify(this.localCache[o])!==JSON.stringify(c)&&(this.notifyListeners(o,c),t.push(o));for(const o of Object.keys(this.localCache))this.localCache[o]&&!r.has(o)&&(this.notifyListeners(o,null),t.push(o));return t}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const o of Array.from(r))o(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Sl)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}ko.type="LOCAL";const Cl=ko;new zt(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function No(i,e){return e?we(e):(C(i._popupRedirectResolver,i,"argument-error"),i._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bi extends xi{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return ut(e,this._buildIdpRequest())}_linkToIdToken(e,t){return ut(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return ut(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function Pl(i){return Eo(i.auth,new Bi(i),i.bypassAuthState)}function Rl(i){const{auth:e,user:t}=i;return C(t,e,"internal-error"),hl(t,new Bi(i),i.bypassAuthState)}async function kl(i){const{auth:e,user:t}=i;return C(t,e,"internal-error"),cl(t,new Bi(i),i.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oo{constructor(e,t,r,o,c=!1){this.auth=e,this.resolver=r,this.user=o,this.bypassAuthState=c,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(r){this.reject(r)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:r,postBody:o,tenantId:c,error:h,type:g}=e;if(h){this.reject(h);return}const I={auth:this.auth,requestUri:t,sessionId:r,tenantId:c||void 0,postBody:o||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(g)(I))}catch(v){this.reject(v)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return Pl;case"linkViaPopup":case"linkViaRedirect":return kl;case"reauthViaPopup":case"reauthViaRedirect":return Rl;default:ne(this.auth,"internal-error")}}resolve(e){Ee(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Ee(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nl=new zt(2e3,1e4);class ct extends Oo{constructor(e,t,r,o,c){super(e,t,o,c),this.provider=r,this.authWindow=null,this.pollId=null,ct.currentPopupAction&&ct.currentPopupAction.cancel(),ct.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return C(e,this.auth,"internal-error"),e}async onExecution(){Ee(this.filter.length===1,"Popup operations only handle one event");const e=ji();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(fe(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){return this.authWindow?.associatedEvent||null}cancel(){this.reject(fe(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,ct.currentPopupAction=null}pollUserCancellation(){const e=()=>{if(this.authWindow?.window?.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(fe(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,Nl.get())};e()}}ct.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ol="pendingRedirect",mn=new Map;class Dl extends Oo{constructor(e,t,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,r),this.eventId=null}async execute(){let e=mn.get(this.auth._key());if(!e){try{const r=await Ll(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(t){e=()=>Promise.reject(t)}mn.set(this.auth._key(),e)}return this.bypassAuthState||mn.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function Ll(i,e){const t=Lo(e),r=Do(i);if(!await r._isAvailable())return!1;const o=await r._get(t)==="true";return await r._remove(t),o}async function Ml(i,e){return Do(i)._set(Lo(e),"true")}function Ul(i,e){mn.set(i._key(),e)}function Do(i){return we(i._redirectPersistence)}function Lo(i){return gn(Ol,i.config.apiKey,i.name)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cd(i,e,t){return xl(i,e,t)}async function xl(i,e,t){if(J(i.app))return Promise.reject(pe(i));const r=ve(i);gh(i,e,Vi),await r._initializationPromise;const o=No(r,t);return await Ml(o,r),o._openRedirect(r,e,"signInViaRedirect")}async function Pd(i,e){return await ve(i)._initializationPromise,Mo(i,e,!1)}async function Mo(i,e,t=!1){if(J(i.app))return Promise.reject(pe(i));const r=ve(i),o=No(r,e),h=await new Dl(r,o,t).execute();return h&&!t&&(delete h.user._redirectEventId,await r._persistUserIfCurrent(h.user),await r._setRedirectUser(null,e)),h}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fl=600*1e3;class Vl{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(t=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!jl(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){if(e.error&&!Uo(e)){const r=e.error.code?.split("auth/")[1]||"internal-error";t.onError(fe(this.auth,r))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const r=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=Fl&&this.cachedEventUids.clear(),this.cachedEventUids.has(ms(e))}saveEventToCache(e){this.cachedEventUids.add(ms(e)),this.lastProcessedEventTime=Date.now()}}function ms(i){return[i.type,i.eventId,i.sessionId,i.tenantId].filter(e=>e).join("-")}function Uo({type:i,error:e}){return i==="unknown"&&e?.code==="auth/no-auth-event"}function jl(i){switch(i.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Uo(i);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bl(i,e={}){return Be(i,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hl=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,$l=/^https?/;async function Wl(i){if(i.config.emulator)return;const{authorizedDomains:e}=await Bl(i);for(const t of e)try{if(Gl(t))return}catch{}ne(i,"unauthorized-domain")}function Gl(i){const e=Ii(),{protocol:t,hostname:r}=new URL(e);if(i.startsWith("chrome-extension://")){const h=new URL(i);return h.hostname===""&&r===""?t==="chrome-extension:"&&i.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&h.hostname===r}if(!$l.test(t))return!1;if(Hl.test(i))return r===i;const o=i.replace(/\./g,"\\.");return new RegExp("^(.+\\."+o+"|"+o+")$","i").test(r)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zl=new zt(3e4,6e4);function _s(){const i=ge().___jsl;if(i?.H){for(const e of Object.keys(i.H))if(i.H[e].r=i.H[e].r||[],i.H[e].L=i.H[e].L||[],i.H[e].r=[...i.H[e].L],i.CP)for(let t=0;t<i.CP.length;t++)i.CP[t]=null}}function ql(i){return new Promise((e,t)=>{function r(){_s(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{_s(),t(fe(i,"network-request-failed"))},timeout:zl.get()})}if(ge().gapi?.iframes?.Iframe)e(gapi.iframes.getContext());else if(ge().gapi?.load)r();else{const o=Wh("iframefcb");return ge()[o]=()=>{gapi.load?r():t(fe(i,"network-request-failed"))},_o(`${$h()}?onload=${o}`).catch(c=>t(c))}}).catch(e=>{throw _n=null,e})}let _n=null;function Kl(i){return _n=_n||ql(i),_n}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jl=new zt(5e3,15e3),Xl="__/auth/iframe",Yl="emulator/auth/iframe",Ql={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Zl=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function eu(i){const e=i.config;C(e.authDomain,i,"auth-domain-config-required");const t=e.emulator?Li(e,Yl):`https://${i.config.authDomain}/${Xl}`,r={apiKey:e.apiKey,appName:i.name,v:gt},o=Zl.get(i.config.apiHost);o&&(r.eid=o);const c=i._getFrameworks();return c.length&&(r.fw=c.join(",")),`${t}?${Gt(r).slice(1)}`}async function tu(i){const e=await Kl(i),t=ge().gapi;return C(t,i,"internal-error"),e.open({where:document.body,url:eu(i),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Ql,dontclear:!0},r=>new Promise(async(o,c)=>{await r.restyle({setHideOnLeave:!1});const h=fe(i,"network-request-failed"),g=ge().setTimeout(()=>{c(h)},Jl.get());function I(){ge().clearTimeout(g),o(r)}r.ping(I).then(I,()=>{c(h)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nu={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},iu=500,ru=600,su="_blank",ou="http://localhost";class ys{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function au(i,e,t,r=iu,o=ru){const c=Math.max((window.screen.availHeight-o)/2,0).toString(),h=Math.max((window.screen.availWidth-r)/2,0).toString();let g="";const I={...nu,width:r.toString(),height:o.toString(),top:c,left:h},v=q().toLowerCase();t&&(g=ho(v)?su:t),ao(v)&&(e=e||ou,I.scrollbars="yes");const S=Object.entries(I).reduce((A,[O,D])=>`${A}${O}=${D},`,"");if(Lh(v)&&g!=="_self")return cu(e||"",g),new ys(null);const b=window.open(e||"",g,S);C(b,i,"popup-blocked");try{b.focus()}catch{}return new ys(b)}function cu(i,e){const t=document.createElement("a");t.href=i,t.target=e;const r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hu="__/auth/handler",lu="emulator/auth/handler",uu=encodeURIComponent("fac");async function ws(i,e,t,r,o,c){C(i.config.authDomain,i,"auth-domain-config-required"),C(i.config.apiKey,i,"invalid-api-key");const h={apiKey:i.config.apiKey,appName:i.name,authType:t,redirectUrl:r,v:gt,eventId:o};if(e instanceof Vi){e.setDefaultLanguage(i.languageCode),h.providerId=e.providerId||"",Xa(e.getCustomParameters())||(h.customParameters=JSON.stringify(e.getCustomParameters()));for(const[S,b]of Object.entries({}))h[S]=b}if(e instanceof Kt){const S=e.getScopes().filter(b=>b!=="");S.length>0&&(h.scopes=S.join(","))}i.tenantId&&(h.tid=i.tenantId);const g=h;for(const S of Object.keys(g))g[S]===void 0&&delete g[S];const I=await i._getAppCheckToken(),v=I?`#${uu}=${encodeURIComponent(I)}`:"";return`${du(i)}?${Gt(g).slice(1)}${v}`}function du({config:i}){return i.emulator?Li(i,lu):`https://${i.authDomain}/${hu}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const di="webStorageSupport";class fu{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=bo,this._completeRedirectFn=Mo,this._overrideRedirectResult=Ul}async _openPopup(e,t,r,o){Ee(this.eventManagers[e._key()]?.manager,"_initialize() not called before _openPopup()");const c=await ws(e,t,r,Ii(),o);return au(e,c,ji())}async _openRedirect(e,t,r,o){await this._originValidation(e);const c=await ws(e,t,r,Ii(),o);return yl(c),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:o,promise:c}=this.eventManagers[t];return o?Promise.resolve(o):(Ee(c,"If manager is not set, promise should be"),c)}const r=this.initAndGetManager(e);return this.eventManagers[t]={promise:r},r.catch(()=>{delete this.eventManagers[t]}),r}async initAndGetManager(e){const t=await tu(e),r=new Vl(e);return t.register("authEvent",o=>(C(o?.authEvent,e,"invalid-auth-event"),{status:r.onEvent(o.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=t,r}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(di,{type:di},o=>{const c=o?.[0]?.[di];c!==void 0&&t(!!c),ne(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Wl(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return go()||co()||Ui()}}const pu=fu;var Is="@firebase/auth",Es="1.11.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gu{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){return this.assertAuthConfigured(),this.auth.currentUser?.uid||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e(r?.stsTokenManager.accessToken||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){C(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mu(i){switch(i){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function _u(i){Ze(new Fe("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),o=e.getProvider("heartbeat"),c=e.getProvider("app-check-internal"),{apiKey:h,authDomain:g}=r.options;C(h&&!h.includes(":"),"invalid-api-key",{appName:r.name});const I={apiKey:h,authDomain:g,clientPlatform:i,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:mo(i)},v=new jh(r,o,c,I);return Xh(v,t),v},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),Ze(new Fe("auth-internal",e=>{const t=ve(e.getProvider("auth").getImmediate());return(r=>new gu(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),de(Is,Es,mu(i)),de(Is,Es,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yu=300,wu=Js("authIdTokenMaxAge")||yu;let vs=null;const Iu=i=>async e=>{const t=e&&await e.getIdTokenResult(),r=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(r&&r>wu)return;const o=t?.token;vs!==o&&(vs=o,await fetch(i,{method:o?"POST":"DELETE",headers:o?{Authorization:`Bearer ${o}`}:{}}))};function Rd(i=Ni()){const e=kn(i,"auth");if(e.isInitialized())return e.getImmediate();const t=Jh(i,{popupRedirectResolver:pu,persistence:[Cl,gl,bo]}),r=Js("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){const c=new URL(r,location.origin);if(location.origin===c.origin){const h=Iu(c.toString());dl(t,h,()=>h(t.currentUser)),ul(t,g=>h(g))}}const o=zs("auth");return o&&Yh(t,`http://${o}`),t}function Eu(){return document.getElementsByTagName("head")?.[0]??document}Bh({loadJS(i){return new Promise((e,t)=>{const r=document.createElement("script");r.setAttribute("src",i),r.onload=e,r.onerror=o=>{const c=fe("internal-error");c.customData=o,t(c)},r.type="text/javascript",r.charset="UTF-8",Eu().appendChild(r)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});_u("Browser");var vu="firebase",Tu="12.6.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */de(vu,Tu,"app");var Ts=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Hi;(function(){var i;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(m,u){function f(){}f.prototype=u.prototype,m.F=u.prototype,m.prototype=new f,m.prototype.constructor=m,m.D=function(_,p,w){for(var d=Array(arguments.length-2),K=2;K<arguments.length;K++)d[K-2]=arguments[K];return u.prototype[p].apply(_,d)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,t),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function o(m,u,f){f||(f=0);const _=Array(16);if(typeof u=="string")for(var p=0;p<16;++p)_[p]=u.charCodeAt(f++)|u.charCodeAt(f++)<<8|u.charCodeAt(f++)<<16|u.charCodeAt(f++)<<24;else for(p=0;p<16;++p)_[p]=u[f++]|u[f++]<<8|u[f++]<<16|u[f++]<<24;u=m.g[0],f=m.g[1],p=m.g[2];let w=m.g[3],d;d=u+(w^f&(p^w))+_[0]+3614090360&4294967295,u=f+(d<<7&4294967295|d>>>25),d=w+(p^u&(f^p))+_[1]+3905402710&4294967295,w=u+(d<<12&4294967295|d>>>20),d=p+(f^w&(u^f))+_[2]+606105819&4294967295,p=w+(d<<17&4294967295|d>>>15),d=f+(u^p&(w^u))+_[3]+3250441966&4294967295,f=p+(d<<22&4294967295|d>>>10),d=u+(w^f&(p^w))+_[4]+4118548399&4294967295,u=f+(d<<7&4294967295|d>>>25),d=w+(p^u&(f^p))+_[5]+1200080426&4294967295,w=u+(d<<12&4294967295|d>>>20),d=p+(f^w&(u^f))+_[6]+2821735955&4294967295,p=w+(d<<17&4294967295|d>>>15),d=f+(u^p&(w^u))+_[7]+4249261313&4294967295,f=p+(d<<22&4294967295|d>>>10),d=u+(w^f&(p^w))+_[8]+1770035416&4294967295,u=f+(d<<7&4294967295|d>>>25),d=w+(p^u&(f^p))+_[9]+2336552879&4294967295,w=u+(d<<12&4294967295|d>>>20),d=p+(f^w&(u^f))+_[10]+4294925233&4294967295,p=w+(d<<17&4294967295|d>>>15),d=f+(u^p&(w^u))+_[11]+2304563134&4294967295,f=p+(d<<22&4294967295|d>>>10),d=u+(w^f&(p^w))+_[12]+1804603682&4294967295,u=f+(d<<7&4294967295|d>>>25),d=w+(p^u&(f^p))+_[13]+4254626195&4294967295,w=u+(d<<12&4294967295|d>>>20),d=p+(f^w&(u^f))+_[14]+2792965006&4294967295,p=w+(d<<17&4294967295|d>>>15),d=f+(u^p&(w^u))+_[15]+1236535329&4294967295,f=p+(d<<22&4294967295|d>>>10),d=u+(p^w&(f^p))+_[1]+4129170786&4294967295,u=f+(d<<5&4294967295|d>>>27),d=w+(f^p&(u^f))+_[6]+3225465664&4294967295,w=u+(d<<9&4294967295|d>>>23),d=p+(u^f&(w^u))+_[11]+643717713&4294967295,p=w+(d<<14&4294967295|d>>>18),d=f+(w^u&(p^w))+_[0]+3921069994&4294967295,f=p+(d<<20&4294967295|d>>>12),d=u+(p^w&(f^p))+_[5]+3593408605&4294967295,u=f+(d<<5&4294967295|d>>>27),d=w+(f^p&(u^f))+_[10]+38016083&4294967295,w=u+(d<<9&4294967295|d>>>23),d=p+(u^f&(w^u))+_[15]+3634488961&4294967295,p=w+(d<<14&4294967295|d>>>18),d=f+(w^u&(p^w))+_[4]+3889429448&4294967295,f=p+(d<<20&4294967295|d>>>12),d=u+(p^w&(f^p))+_[9]+568446438&4294967295,u=f+(d<<5&4294967295|d>>>27),d=w+(f^p&(u^f))+_[14]+3275163606&4294967295,w=u+(d<<9&4294967295|d>>>23),d=p+(u^f&(w^u))+_[3]+4107603335&4294967295,p=w+(d<<14&4294967295|d>>>18),d=f+(w^u&(p^w))+_[8]+1163531501&4294967295,f=p+(d<<20&4294967295|d>>>12),d=u+(p^w&(f^p))+_[13]+2850285829&4294967295,u=f+(d<<5&4294967295|d>>>27),d=w+(f^p&(u^f))+_[2]+4243563512&4294967295,w=u+(d<<9&4294967295|d>>>23),d=p+(u^f&(w^u))+_[7]+1735328473&4294967295,p=w+(d<<14&4294967295|d>>>18),d=f+(w^u&(p^w))+_[12]+2368359562&4294967295,f=p+(d<<20&4294967295|d>>>12),d=u+(f^p^w)+_[5]+4294588738&4294967295,u=f+(d<<4&4294967295|d>>>28),d=w+(u^f^p)+_[8]+2272392833&4294967295,w=u+(d<<11&4294967295|d>>>21),d=p+(w^u^f)+_[11]+1839030562&4294967295,p=w+(d<<16&4294967295|d>>>16),d=f+(p^w^u)+_[14]+4259657740&4294967295,f=p+(d<<23&4294967295|d>>>9),d=u+(f^p^w)+_[1]+2763975236&4294967295,u=f+(d<<4&4294967295|d>>>28),d=w+(u^f^p)+_[4]+1272893353&4294967295,w=u+(d<<11&4294967295|d>>>21),d=p+(w^u^f)+_[7]+4139469664&4294967295,p=w+(d<<16&4294967295|d>>>16),d=f+(p^w^u)+_[10]+3200236656&4294967295,f=p+(d<<23&4294967295|d>>>9),d=u+(f^p^w)+_[13]+681279174&4294967295,u=f+(d<<4&4294967295|d>>>28),d=w+(u^f^p)+_[0]+3936430074&4294967295,w=u+(d<<11&4294967295|d>>>21),d=p+(w^u^f)+_[3]+3572445317&4294967295,p=w+(d<<16&4294967295|d>>>16),d=f+(p^w^u)+_[6]+76029189&4294967295,f=p+(d<<23&4294967295|d>>>9),d=u+(f^p^w)+_[9]+3654602809&4294967295,u=f+(d<<4&4294967295|d>>>28),d=w+(u^f^p)+_[12]+3873151461&4294967295,w=u+(d<<11&4294967295|d>>>21),d=p+(w^u^f)+_[15]+530742520&4294967295,p=w+(d<<16&4294967295|d>>>16),d=f+(p^w^u)+_[2]+3299628645&4294967295,f=p+(d<<23&4294967295|d>>>9),d=u+(p^(f|~w))+_[0]+4096336452&4294967295,u=f+(d<<6&4294967295|d>>>26),d=w+(f^(u|~p))+_[7]+1126891415&4294967295,w=u+(d<<10&4294967295|d>>>22),d=p+(u^(w|~f))+_[14]+2878612391&4294967295,p=w+(d<<15&4294967295|d>>>17),d=f+(w^(p|~u))+_[5]+4237533241&4294967295,f=p+(d<<21&4294967295|d>>>11),d=u+(p^(f|~w))+_[12]+1700485571&4294967295,u=f+(d<<6&4294967295|d>>>26),d=w+(f^(u|~p))+_[3]+2399980690&4294967295,w=u+(d<<10&4294967295|d>>>22),d=p+(u^(w|~f))+_[10]+4293915773&4294967295,p=w+(d<<15&4294967295|d>>>17),d=f+(w^(p|~u))+_[1]+2240044497&4294967295,f=p+(d<<21&4294967295|d>>>11),d=u+(p^(f|~w))+_[8]+1873313359&4294967295,u=f+(d<<6&4294967295|d>>>26),d=w+(f^(u|~p))+_[15]+4264355552&4294967295,w=u+(d<<10&4294967295|d>>>22),d=p+(u^(w|~f))+_[6]+2734768916&4294967295,p=w+(d<<15&4294967295|d>>>17),d=f+(w^(p|~u))+_[13]+1309151649&4294967295,f=p+(d<<21&4294967295|d>>>11),d=u+(p^(f|~w))+_[4]+4149444226&4294967295,u=f+(d<<6&4294967295|d>>>26),d=w+(f^(u|~p))+_[11]+3174756917&4294967295,w=u+(d<<10&4294967295|d>>>22),d=p+(u^(w|~f))+_[2]+718787259&4294967295,p=w+(d<<15&4294967295|d>>>17),d=f+(w^(p|~u))+_[9]+3951481745&4294967295,m.g[0]=m.g[0]+u&4294967295,m.g[1]=m.g[1]+(p+(d<<21&4294967295|d>>>11))&4294967295,m.g[2]=m.g[2]+p&4294967295,m.g[3]=m.g[3]+w&4294967295}r.prototype.v=function(m,u){u===void 0&&(u=m.length);const f=u-this.blockSize,_=this.C;let p=this.h,w=0;for(;w<u;){if(p==0)for(;w<=f;)o(this,m,w),w+=this.blockSize;if(typeof m=="string"){for(;w<u;)if(_[p++]=m.charCodeAt(w++),p==this.blockSize){o(this,_),p=0;break}}else for(;w<u;)if(_[p++]=m[w++],p==this.blockSize){o(this,_),p=0;break}}this.h=p,this.o+=u},r.prototype.A=function(){var m=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);m[0]=128;for(var u=1;u<m.length-8;++u)m[u]=0;u=this.o*8;for(var f=m.length-8;f<m.length;++f)m[f]=u&255,u/=256;for(this.v(m),m=Array(16),u=0,f=0;f<4;++f)for(let _=0;_<32;_+=8)m[u++]=this.g[f]>>>_&255;return m};function c(m,u){var f=g;return Object.prototype.hasOwnProperty.call(f,m)?f[m]:f[m]=u(m)}function h(m,u){this.h=u;const f=[];let _=!0;for(let p=m.length-1;p>=0;p--){const w=m[p]|0;_&&w==u||(f[p]=w,_=!1)}this.g=f}var g={};function I(m){return-128<=m&&m<128?c(m,function(u){return new h([u|0],u<0?-1:0)}):new h([m|0],m<0?-1:0)}function v(m){if(isNaN(m)||!isFinite(m))return b;if(m<0)return x(v(-m));const u=[];let f=1;for(let _=0;m>=f;_++)u[_]=m/f|0,f*=4294967296;return new h(u,0)}function S(m,u){if(m.length==0)throw Error("number format error: empty string");if(u=u||10,u<2||36<u)throw Error("radix out of range: "+u);if(m.charAt(0)=="-")return x(S(m.substring(1),u));if(m.indexOf("-")>=0)throw Error('number format error: interior "-" character');const f=v(Math.pow(u,8));let _=b;for(let w=0;w<m.length;w+=8){var p=Math.min(8,m.length-w);const d=parseInt(m.substring(w,w+p),u);p<8?(p=v(Math.pow(u,p)),_=_.j(p).add(v(d))):(_=_.j(f),_=_.add(v(d)))}return _}var b=I(0),A=I(1),O=I(16777216);i=h.prototype,i.m=function(){if(V(this))return-x(this).m();let m=0,u=1;for(let f=0;f<this.g.length;f++){const _=this.i(f);m+=(_>=0?_:4294967296+_)*u,u*=4294967296}return m},i.toString=function(m){if(m=m||10,m<2||36<m)throw Error("radix out of range: "+m);if(D(this))return"0";if(V(this))return"-"+x(this).toString(m);const u=v(Math.pow(m,6));var f=this;let _="";for(;;){const p=Te(f,u).g;f=Y(f,p.j(u));let w=((f.g.length>0?f.g[0]:f.h)>>>0).toString(m);if(f=p,D(f))return w+_;for(;w.length<6;)w="0"+w;_=w+_}},i.i=function(m){return m<0?0:m<this.g.length?this.g[m]:this.h};function D(m){if(m.h!=0)return!1;for(let u=0;u<m.g.length;u++)if(m.g[u]!=0)return!1;return!0}function V(m){return m.h==-1}i.l=function(m){return m=Y(this,m),V(m)?-1:D(m)?0:1};function x(m){const u=m.g.length,f=[];for(let _=0;_<u;_++)f[_]=~m.g[_];return new h(f,~m.h).add(A)}i.abs=function(){return V(this)?x(this):this},i.add=function(m){const u=Math.max(this.g.length,m.g.length),f=[];let _=0;for(let p=0;p<=u;p++){let w=_+(this.i(p)&65535)+(m.i(p)&65535),d=(w>>>16)+(this.i(p)>>>16)+(m.i(p)>>>16);_=d>>>16,w&=65535,d&=65535,f[p]=d<<16|w}return new h(f,f[f.length-1]&-2147483648?-1:0)};function Y(m,u){return m.add(x(u))}i.j=function(m){if(D(this)||D(m))return b;if(V(this))return V(m)?x(this).j(x(m)):x(x(this).j(m));if(V(m))return x(this.j(x(m)));if(this.l(O)<0&&m.l(O)<0)return v(this.m()*m.m());const u=this.g.length+m.g.length,f=[];for(var _=0;_<2*u;_++)f[_]=0;for(_=0;_<this.g.length;_++)for(let p=0;p<m.g.length;p++){const w=this.i(_)>>>16,d=this.i(_)&65535,K=m.i(p)>>>16,He=m.i(p)&65535;f[2*_+2*p]+=d*He,Q(f,2*_+2*p),f[2*_+2*p+1]+=w*He,Q(f,2*_+2*p+1),f[2*_+2*p+1]+=d*K,Q(f,2*_+2*p+1),f[2*_+2*p+2]+=w*K,Q(f,2*_+2*p+2)}for(m=0;m<u;m++)f[m]=f[2*m+1]<<16|f[2*m];for(m=u;m<2*u;m++)f[m]=0;return new h(f,0)};function Q(m,u){for(;(m[u]&65535)!=m[u];)m[u+1]+=m[u]>>>16,m[u]&=65535,u++}function Z(m,u){this.g=m,this.h=u}function Te(m,u){if(D(u))throw Error("division by zero");if(D(m))return new Z(b,b);if(V(m))return u=Te(x(m),u),new Z(x(u.g),x(u.h));if(V(u))return u=Te(m,x(u)),new Z(x(u.g),u.h);if(m.g.length>30){if(V(m)||V(u))throw Error("slowDivide_ only works with positive integers.");for(var f=A,_=u;_.l(m)<=0;)f=Ae(f),_=Ae(_);var p=ee(f,1),w=ee(_,1);for(_=ee(_,2),f=ee(f,2);!D(_);){var d=w.add(_);d.l(m)<=0&&(p=p.add(f),w=d),_=ee(_,1),f=ee(f,1)}return u=Y(m,p.j(u)),new Z(p,u)}for(p=b;m.l(u)>=0;){for(f=Math.max(1,Math.floor(m.m()/u.m())),_=Math.ceil(Math.log(f)/Math.LN2),_=_<=48?1:Math.pow(2,_-48),w=v(f),d=w.j(u);V(d)||d.l(m)>0;)f-=_,w=v(f),d=w.j(u);D(w)&&(w=A),p=p.add(w),m=Y(m,d)}return new Z(p,m)}i.B=function(m){return Te(this,m).h},i.and=function(m){const u=Math.max(this.g.length,m.g.length),f=[];for(let _=0;_<u;_++)f[_]=this.i(_)&m.i(_);return new h(f,this.h&m.h)},i.or=function(m){const u=Math.max(this.g.length,m.g.length),f=[];for(let _=0;_<u;_++)f[_]=this.i(_)|m.i(_);return new h(f,this.h|m.h)},i.xor=function(m){const u=Math.max(this.g.length,m.g.length),f=[];for(let _=0;_<u;_++)f[_]=this.i(_)^m.i(_);return new h(f,this.h^m.h)};function Ae(m){const u=m.g.length+1,f=[];for(let _=0;_<u;_++)f[_]=m.i(_)<<1|m.i(_-1)>>>31;return new h(f,m.h)}function ee(m,u){const f=u>>5;u%=32;const _=m.g.length-f,p=[];for(let w=0;w<_;w++)p[w]=u>0?m.i(w+f)>>>u|m.i(w+f+1)<<32-u:m.i(w+f);return new h(p,m.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,h.prototype.add=h.prototype.add,h.prototype.multiply=h.prototype.j,h.prototype.modulo=h.prototype.B,h.prototype.compare=h.prototype.l,h.prototype.toNumber=h.prototype.m,h.prototype.toString=h.prototype.toString,h.prototype.getBits=h.prototype.i,h.fromNumber=v,h.fromString=S,Hi=h}).apply(typeof Ts<"u"?Ts:typeof self<"u"?self:typeof window<"u"?window:{});var dn=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};(function(){var i,e=Object.defineProperty;function t(n){n=[typeof globalThis=="object"&&globalThis,n,typeof window=="object"&&window,typeof self=="object"&&self,typeof dn=="object"&&dn];for(var s=0;s<n.length;++s){var a=n[s];if(a&&a.Math==Math)return a}throw Error("Cannot find global object")}var r=t(this);function o(n,s){if(s)e:{var a=r;n=n.split(".");for(var l=0;l<n.length-1;l++){var y=n[l];if(!(y in a))break e;a=a[y]}n=n[n.length-1],l=a[n],s=s(l),s!=l&&s!=null&&e(a,n,{configurable:!0,writable:!0,value:s})}}o("Symbol.dispose",function(n){return n||Symbol("Symbol.dispose")}),o("Array.prototype.values",function(n){return n||function(){return this[Symbol.iterator]()}}),o("Object.entries",function(n){return n||function(s){var a=[],l;for(l in s)Object.prototype.hasOwnProperty.call(s,l)&&a.push([l,s[l]]);return a}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var c=c||{},h=this||self;function g(n){var s=typeof n;return s=="object"&&n!=null||s=="function"}function I(n,s,a){return n.call.apply(n.bind,arguments)}function v(n,s,a){return v=I,v.apply(null,arguments)}function S(n,s){var a=Array.prototype.slice.call(arguments,1);return function(){var l=a.slice();return l.push.apply(l,arguments),n.apply(this,l)}}function b(n,s){function a(){}a.prototype=s.prototype,n.Z=s.prototype,n.prototype=new a,n.prototype.constructor=n,n.Ob=function(l,y,E){for(var T=Array(arguments.length-2),P=2;P<arguments.length;P++)T[P-2]=arguments[P];return s.prototype[y].apply(l,T)}}var A=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?n=>n&&AsyncContext.Snapshot.wrap(n):n=>n;function O(n){const s=n.length;if(s>0){const a=Array(s);for(let l=0;l<s;l++)a[l]=n[l];return a}return[]}function D(n,s){for(let l=1;l<arguments.length;l++){const y=arguments[l];var a=typeof y;if(a=a!="object"?a:y?Array.isArray(y)?"array":a:"null",a=="array"||a=="object"&&typeof y.length=="number"){a=n.length||0;const E=y.length||0;n.length=a+E;for(let T=0;T<E;T++)n[a+T]=y[T]}else n.push(y)}}class V{constructor(s,a){this.i=s,this.j=a,this.h=0,this.g=null}get(){let s;return this.h>0?(this.h--,s=this.g,this.g=s.next,s.next=null):s=this.i(),s}}function x(n){h.setTimeout(()=>{throw n},0)}function Y(){var n=m;let s=null;return n.g&&(s=n.g,n.g=n.g.next,n.g||(n.h=null),s.next=null),s}class Q{constructor(){this.h=this.g=null}add(s,a){const l=Z.get();l.set(s,a),this.h?this.h.next=l:this.g=l,this.h=l}}var Z=new V(()=>new Te,n=>n.reset());class Te{constructor(){this.next=this.g=this.h=null}set(s,a){this.h=s,this.g=a,this.next=null}reset(){this.next=this.g=this.h=null}}let Ae,ee=!1,m=new Q,u=()=>{const n=Promise.resolve(void 0);Ae=()=>{n.then(f)}};function f(){for(var n;n=Y();){try{n.h.call(n.g)}catch(a){x(a)}var s=Z;s.j(n),s.h<100&&(s.h++,n.next=s.g,s.g=n)}ee=!1}function _(){this.u=this.u,this.C=this.C}_.prototype.u=!1,_.prototype.dispose=function(){this.u||(this.u=!0,this.N())},_.prototype[Symbol.dispose]=function(){this.dispose()},_.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function p(n,s){this.type=n,this.g=this.target=s,this.defaultPrevented=!1}p.prototype.h=function(){this.defaultPrevented=!0};var w=(function(){if(!h.addEventListener||!Object.defineProperty)return!1;var n=!1,s=Object.defineProperty({},"passive",{get:function(){n=!0}});try{const a=()=>{};h.addEventListener("test",a,s),h.removeEventListener("test",a,s)}catch{}return n})();function d(n){return/^[\s\xa0]*$/.test(n)}function K(n,s){p.call(this,n?n.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,n&&this.init(n,s)}b(K,p),K.prototype.init=function(n,s){const a=this.type=n.type,l=n.changedTouches&&n.changedTouches.length?n.changedTouches[0]:null;this.target=n.target||n.srcElement,this.g=s,s=n.relatedTarget,s||(a=="mouseover"?s=n.fromElement:a=="mouseout"&&(s=n.toElement)),this.relatedTarget=s,l?(this.clientX=l.clientX!==void 0?l.clientX:l.pageX,this.clientY=l.clientY!==void 0?l.clientY:l.pageY,this.screenX=l.screenX||0,this.screenY=l.screenY||0):(this.clientX=n.clientX!==void 0?n.clientX:n.pageX,this.clientY=n.clientY!==void 0?n.clientY:n.pageY,this.screenX=n.screenX||0,this.screenY=n.screenY||0),this.button=n.button,this.key=n.key||"",this.ctrlKey=n.ctrlKey,this.altKey=n.altKey,this.shiftKey=n.shiftKey,this.metaKey=n.metaKey,this.pointerId=n.pointerId||0,this.pointerType=n.pointerType,this.state=n.state,this.i=n,n.defaultPrevented&&K.Z.h.call(this)},K.prototype.h=function(){K.Z.h.call(this);const n=this.i;n.preventDefault?n.preventDefault():n.returnValue=!1};var He="closure_listenable_"+(Math.random()*1e6|0),Ko=0;function Jo(n,s,a,l,y){this.listener=n,this.proxy=null,this.src=s,this.type=a,this.capture=!!l,this.ha=y,this.key=++Ko,this.da=this.fa=!1}function Qt(n){n.da=!0,n.listener=null,n.proxy=null,n.src=null,n.ha=null}function Zt(n,s,a){for(const l in n)s.call(a,n[l],l,n)}function Xo(n,s){for(const a in n)s.call(void 0,n[a],a,n)}function Ki(n){const s={};for(const a in n)s[a]=n[a];return s}const Ji="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Xi(n,s){let a,l;for(let y=1;y<arguments.length;y++){l=arguments[y];for(a in l)n[a]=l[a];for(let E=0;E<Ji.length;E++)a=Ji[E],Object.prototype.hasOwnProperty.call(l,a)&&(n[a]=l[a])}}function en(n){this.src=n,this.g={},this.h=0}en.prototype.add=function(n,s,a,l,y){const E=n.toString();n=this.g[E],n||(n=this.g[E]=[],this.h++);const T=Mn(n,s,l,y);return T>-1?(s=n[T],a||(s.fa=!1)):(s=new Jo(s,this.src,E,!!l,y),s.fa=a,n.push(s)),s};function Ln(n,s){const a=s.type;if(a in n.g){var l=n.g[a],y=Array.prototype.indexOf.call(l,s,void 0),E;(E=y>=0)&&Array.prototype.splice.call(l,y,1),E&&(Qt(s),n.g[a].length==0&&(delete n.g[a],n.h--))}}function Mn(n,s,a,l){for(let y=0;y<n.length;++y){const E=n[y];if(!E.da&&E.listener==s&&E.capture==!!a&&E.ha==l)return y}return-1}var Un="closure_lm_"+(Math.random()*1e6|0),xn={};function Yi(n,s,a,l,y){if(Array.isArray(s)){for(let E=0;E<s.length;E++)Yi(n,s[E],a,l,y);return null}return a=er(a),n&&n[He]?n.J(s,a,g(l)?!!l.capture:!1,y):Yo(n,s,a,!1,l,y)}function Yo(n,s,a,l,y,E){if(!s)throw Error("Invalid event type");const T=g(y)?!!y.capture:!!y;let P=Vn(n);if(P||(n[Un]=P=new en(n)),a=P.add(s,a,l,T,E),a.proxy)return a;if(l=Qo(),a.proxy=l,l.src=n,l.listener=a,n.addEventListener)w||(y=T),y===void 0&&(y=!1),n.addEventListener(s.toString(),l,y);else if(n.attachEvent)n.attachEvent(Zi(s.toString()),l);else if(n.addListener&&n.removeListener)n.addListener(l);else throw Error("addEventListener and attachEvent are unavailable.");return a}function Qo(){function n(a){return s.call(n.src,n.listener,a)}const s=Zo;return n}function Qi(n,s,a,l,y){if(Array.isArray(s))for(var E=0;E<s.length;E++)Qi(n,s[E],a,l,y);else l=g(l)?!!l.capture:!!l,a=er(a),n&&n[He]?(n=n.i,E=String(s).toString(),E in n.g&&(s=n.g[E],a=Mn(s,a,l,y),a>-1&&(Qt(s[a]),Array.prototype.splice.call(s,a,1),s.length==0&&(delete n.g[E],n.h--)))):n&&(n=Vn(n))&&(s=n.g[s.toString()],n=-1,s&&(n=Mn(s,a,l,y)),(a=n>-1?s[n]:null)&&Fn(a))}function Fn(n){if(typeof n!="number"&&n&&!n.da){var s=n.src;if(s&&s[He])Ln(s.i,n);else{var a=n.type,l=n.proxy;s.removeEventListener?s.removeEventListener(a,l,n.capture):s.detachEvent?s.detachEvent(Zi(a),l):s.addListener&&s.removeListener&&s.removeListener(l),(a=Vn(s))?(Ln(a,n),a.h==0&&(a.src=null,s[Un]=null)):Qt(n)}}}function Zi(n){return n in xn?xn[n]:xn[n]="on"+n}function Zo(n,s){if(n.da)n=!0;else{s=new K(s,this);const a=n.listener,l=n.ha||n.src;n.fa&&Fn(n),n=a.call(l,s)}return n}function Vn(n){return n=n[Un],n instanceof en?n:null}var jn="__closure_events_fn_"+(Math.random()*1e9>>>0);function er(n){return typeof n=="function"?n:(n[jn]||(n[jn]=function(s){return n.handleEvent(s)}),n[jn])}function $(){_.call(this),this.i=new en(this),this.M=this,this.G=null}b($,_),$.prototype[He]=!0,$.prototype.removeEventListener=function(n,s,a,l){Qi(this,n,s,a,l)};function W(n,s){var a,l=n.G;if(l)for(a=[];l;l=l.G)a.push(l);if(n=n.M,l=s.type||s,typeof s=="string")s=new p(s,n);else if(s instanceof p)s.target=s.target||n;else{var y=s;s=new p(l,n),Xi(s,y)}y=!0;let E,T;if(a)for(T=a.length-1;T>=0;T--)E=s.g=a[T],y=tn(E,l,!0,s)&&y;if(E=s.g=n,y=tn(E,l,!0,s)&&y,y=tn(E,l,!1,s)&&y,a)for(T=0;T<a.length;T++)E=s.g=a[T],y=tn(E,l,!1,s)&&y}$.prototype.N=function(){if($.Z.N.call(this),this.i){var n=this.i;for(const s in n.g){const a=n.g[s];for(let l=0;l<a.length;l++)Qt(a[l]);delete n.g[s],n.h--}}this.G=null},$.prototype.J=function(n,s,a,l){return this.i.add(String(n),s,!1,a,l)},$.prototype.K=function(n,s,a,l){return this.i.add(String(n),s,!0,a,l)};function tn(n,s,a,l){if(s=n.i.g[String(s)],!s)return!0;s=s.concat();let y=!0;for(let E=0;E<s.length;++E){const T=s[E];if(T&&!T.da&&T.capture==a){const P=T.listener,B=T.ha||T.src;T.fa&&Ln(n.i,T),y=P.call(B,l)!==!1&&y}}return y&&!l.defaultPrevented}function ea(n,s){if(typeof n!="function")if(n&&typeof n.handleEvent=="function")n=v(n.handleEvent,n);else throw Error("Invalid listener argument");return Number(s)>2147483647?-1:h.setTimeout(n,s||0)}function tr(n){n.g=ea(()=>{n.g=null,n.i&&(n.i=!1,tr(n))},n.l);const s=n.h;n.h=null,n.m.apply(null,s)}class ta extends _{constructor(s,a){super(),this.m=s,this.l=a,this.h=null,this.i=!1,this.g=null}j(s){this.h=arguments,this.g?this.i=!0:tr(this)}N(){super.N(),this.g&&(h.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function _t(n){_.call(this),this.h=n,this.g={}}b(_t,_);var nr=[];function ir(n){Zt(n.g,function(s,a){this.g.hasOwnProperty(a)&&Fn(s)},n),n.g={}}_t.prototype.N=function(){_t.Z.N.call(this),ir(this)},_t.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Bn=h.JSON.stringify,na=h.JSON.parse,ia=class{stringify(n){return h.JSON.stringify(n,void 0)}parse(n){return h.JSON.parse(n,void 0)}};function rr(){}function ra(){}var yt={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Hn(){p.call(this,"d")}b(Hn,p);function $n(){p.call(this,"c")}b($n,p);var rt={},sr=null;function Wn(){return sr=sr||new $}rt.Ia="serverreachability";function or(n){p.call(this,rt.Ia,n)}b(or,p);function wt(n){const s=Wn();W(s,new or(s))}rt.STAT_EVENT="statevent";function ar(n,s){p.call(this,rt.STAT_EVENT,n),this.stat=s}b(ar,p);function G(n){const s=Wn();W(s,new ar(s,n))}rt.Ja="timingevent";function cr(n,s){p.call(this,rt.Ja,n),this.size=s}b(cr,p);function It(n,s){if(typeof n!="function")throw Error("Fn must not be null and must be a function");return h.setTimeout(function(){n()},s)}function Et(){this.g=!0}Et.prototype.ua=function(){this.g=!1};function sa(n,s,a,l,y,E){n.info(function(){if(n.g)if(E){var T="",P=E.split("&");for(let M=0;M<P.length;M++){var B=P[M].split("=");if(B.length>1){const H=B[0];B=B[1];const ce=H.split("_");T=ce.length>=2&&ce[1]=="type"?T+(H+"="+B+"&"):T+(H+"=redacted&")}}}else T=null;else T=E;return"XMLHTTP REQ ("+l+") [attempt "+y+"]: "+s+`
`+a+`
`+T})}function oa(n,s,a,l,y,E,T){n.info(function(){return"XMLHTTP RESP ("+l+") [ attempt "+y+"]: "+s+`
`+a+`
`+E+" "+T})}function st(n,s,a,l){n.info(function(){return"XMLHTTP TEXT ("+s+"): "+ca(n,a)+(l?" "+l:"")})}function aa(n,s){n.info(function(){return"TIMEOUT: "+s})}Et.prototype.info=function(){};function ca(n,s){if(!n.g)return s;if(!s)return null;try{const E=JSON.parse(s);if(E){for(n=0;n<E.length;n++)if(Array.isArray(E[n])){var a=E[n];if(!(a.length<2)){var l=a[1];if(Array.isArray(l)&&!(l.length<1)){var y=l[0];if(y!="noop"&&y!="stop"&&y!="close")for(let T=1;T<l.length;T++)l[T]=""}}}}return Bn(E)}catch{return s}}var Gn={NO_ERROR:0,TIMEOUT:8},ha={},hr;function zn(){}b(zn,rr),zn.prototype.g=function(){return new XMLHttpRequest},hr=new zn;function vt(n){return encodeURIComponent(String(n))}function la(n){var s=1;n=n.split(":");const a=[];for(;s>0&&n.length;)a.push(n.shift()),s--;return n.length&&a.push(n.join(":")),a}function Se(n,s,a,l){this.j=n,this.i=s,this.l=a,this.S=l||1,this.V=new _t(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new lr}function lr(){this.i=null,this.g="",this.h=!1}var ur={},qn={};function Kn(n,s,a){n.M=1,n.A=rn(ae(s)),n.u=a,n.R=!0,dr(n,null)}function dr(n,s){n.F=Date.now(),nn(n),n.B=ae(n.A);var a=n.B,l=n.S;Array.isArray(l)||(l=[String(l)]),Sr(a.i,"t",l),n.C=0,a=n.j.L,n.h=new lr,n.g=$r(n.j,a?s:null,!n.u),n.P>0&&(n.O=new ta(v(n.Y,n,n.g),n.P)),s=n.V,a=n.g,l=n.ba;var y="readystatechange";Array.isArray(y)||(y&&(nr[0]=y.toString()),y=nr);for(let E=0;E<y.length;E++){const T=Yi(a,y[E],l||s.handleEvent,!1,s.h||s);if(!T)break;s.g[T.key]=T}s=n.J?Ki(n.J):{},n.u?(n.v||(n.v="POST"),s["Content-Type"]="application/x-www-form-urlencoded",n.g.ea(n.B,n.v,n.u,s)):(n.v="GET",n.g.ea(n.B,n.v,null,s)),wt(),sa(n.i,n.v,n.B,n.l,n.S,n.u)}Se.prototype.ba=function(n){n=n.target;const s=this.O;s&&Pe(n)==3?s.j():this.Y(n)},Se.prototype.Y=function(n){try{if(n==this.g)e:{const P=Pe(this.g),B=this.g.ya(),M=this.g.ca();if(!(P<3)&&(P!=3||this.g&&(this.h.h||this.g.la()||Or(this.g)))){this.K||P!=4||B==7||(B==8||M<=0?wt(3):wt(2)),Jn(this);var s=this.g.ca();this.X=s;var a=ua(this);if(this.o=s==200,oa(this.i,this.v,this.B,this.l,this.S,P,s),this.o){if(this.U&&!this.L){t:{if(this.g){var l,y=this.g;if((l=y.g?y.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!d(l)){var E=l;break t}}E=null}if(n=E)st(this.i,this.l,n,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Xn(this,n);else{this.o=!1,this.m=3,G(12),$e(this),Tt(this);break e}}if(this.R){n=!0;let H;for(;!this.K&&this.C<a.length;)if(H=da(this,a),H==qn){P==4&&(this.m=4,G(14),n=!1),st(this.i,this.l,null,"[Incomplete Response]");break}else if(H==ur){this.m=4,G(15),st(this.i,this.l,a,"[Invalid Chunk]"),n=!1;break}else st(this.i,this.l,H,null),Xn(this,H);if(fr(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),P!=4||a.length!=0||this.h.h||(this.m=1,G(16),n=!1),this.o=this.o&&n,!n)st(this.i,this.l,a,"[Invalid Chunked Response]"),$e(this),Tt(this);else if(a.length>0&&!this.W){this.W=!0;var T=this.j;T.g==this&&T.aa&&!T.P&&(T.j.info("Great, no buffering proxy detected. Bytes received: "+a.length),ri(T),T.P=!0,G(11))}}else st(this.i,this.l,a,null),Xn(this,a);P==4&&$e(this),this.o&&!this.K&&(P==4?Vr(this.j,this):(this.o=!1,nn(this)))}else ba(this.g),s==400&&a.indexOf("Unknown SID")>0?(this.m=3,G(12)):(this.m=0,G(13)),$e(this),Tt(this)}}}catch{}finally{}};function ua(n){if(!fr(n))return n.g.la();const s=Or(n.g);if(s==="")return"";let a="";const l=s.length,y=Pe(n.g)==4;if(!n.h.i){if(typeof TextDecoder>"u")return $e(n),Tt(n),"";n.h.i=new h.TextDecoder}for(let E=0;E<l;E++)n.h.h=!0,a+=n.h.i.decode(s[E],{stream:!(y&&E==l-1)});return s.length=0,n.h.g+=a,n.C=0,n.h.g}function fr(n){return n.g?n.v=="GET"&&n.M!=2&&n.j.Aa:!1}function da(n,s){var a=n.C,l=s.indexOf(`
`,a);return l==-1?qn:(a=Number(s.substring(a,l)),isNaN(a)?ur:(l+=1,l+a>s.length?qn:(s=s.slice(l,l+a),n.C=l+a,s)))}Se.prototype.cancel=function(){this.K=!0,$e(this)};function nn(n){n.T=Date.now()+n.H,pr(n,n.H)}function pr(n,s){if(n.D!=null)throw Error("WatchDog timer not null");n.D=It(v(n.aa,n),s)}function Jn(n){n.D&&(h.clearTimeout(n.D),n.D=null)}Se.prototype.aa=function(){this.D=null;const n=Date.now();n-this.T>=0?(aa(this.i,this.B),this.M!=2&&(wt(),G(17)),$e(this),this.m=2,Tt(this)):pr(this,this.T-n)};function Tt(n){n.j.I==0||n.K||Vr(n.j,n)}function $e(n){Jn(n);var s=n.O;s&&typeof s.dispose=="function"&&s.dispose(),n.O=null,ir(n.V),n.g&&(s=n.g,n.g=null,s.abort(),s.dispose())}function Xn(n,s){try{var a=n.j;if(a.I!=0&&(a.g==n||Yn(a.h,n))){if(!n.L&&Yn(a.h,n)&&a.I==3){try{var l=a.Ba.g.parse(s)}catch{l=null}if(Array.isArray(l)&&l.length==3){var y=l;if(y[0]==0){e:if(!a.v){if(a.g)if(a.g.F+3e3<n.F)hn(a),an(a);else break e;ii(a),G(18)}}else a.xa=y[1],0<a.xa-a.K&&y[2]<37500&&a.F&&a.A==0&&!a.C&&(a.C=It(v(a.Va,a),6e3));_r(a.h)<=1&&a.ta&&(a.ta=void 0)}else Ge(a,11)}else if((n.L||a.g==n)&&hn(a),!d(s))for(y=a.Ba.g.parse(s),s=0;s<y.length;s++){let M=y[s];const H=M[0];if(!(H<=a.K))if(a.K=H,M=M[1],a.I==2)if(M[0]=="c"){a.M=M[1],a.ba=M[2];const ce=M[3];ce!=null&&(a.ka=ce,a.j.info("VER="+a.ka));const ze=M[4];ze!=null&&(a.za=ze,a.j.info("SVER="+a.za));const Re=M[5];Re!=null&&typeof Re=="number"&&Re>0&&(l=1.5*Re,a.O=l,a.j.info("backChannelRequestTimeoutMs_="+l)),l=a;const ke=n.g;if(ke){const ln=ke.g?ke.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(ln){var E=l.h;E.g||ln.indexOf("spdy")==-1&&ln.indexOf("quic")==-1&&ln.indexOf("h2")==-1||(E.j=E.l,E.g=new Set,E.h&&(Qn(E,E.h),E.h=null))}if(l.G){const si=ke.g?ke.g.getResponseHeader("X-HTTP-Session-Id"):null;si&&(l.wa=si,U(l.J,l.G,si))}}a.I=3,a.l&&a.l.ra(),a.aa&&(a.T=Date.now()-n.F,a.j.info("Handshake RTT: "+a.T+"ms")),l=a;var T=n;if(l.na=Hr(l,l.L?l.ba:null,l.W),T.L){yr(l.h,T);var P=T,B=l.O;B&&(P.H=B),P.D&&(Jn(P),nn(P)),l.g=T}else xr(l);a.i.length>0&&cn(a)}else M[0]!="stop"&&M[0]!="close"||Ge(a,7);else a.I==3&&(M[0]=="stop"||M[0]=="close"?M[0]=="stop"?Ge(a,7):ni(a):M[0]!="noop"&&a.l&&a.l.qa(M),a.A=0)}}wt(4)}catch{}}var fa=class{constructor(n,s){this.g=n,this.map=s}};function gr(n){this.l=n||10,h.PerformanceNavigationTiming?(n=h.performance.getEntriesByType("navigation"),n=n.length>0&&(n[0].nextHopProtocol=="hq"||n[0].nextHopProtocol=="h2")):n=!!(h.chrome&&h.chrome.loadTimes&&h.chrome.loadTimes()&&h.chrome.loadTimes().wasFetchedViaSpdy),this.j=n?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function mr(n){return n.h?!0:n.g?n.g.size>=n.j:!1}function _r(n){return n.h?1:n.g?n.g.size:0}function Yn(n,s){return n.h?n.h==s:n.g?n.g.has(s):!1}function Qn(n,s){n.g?n.g.add(s):n.h=s}function yr(n,s){n.h&&n.h==s?n.h=null:n.g&&n.g.has(s)&&n.g.delete(s)}gr.prototype.cancel=function(){if(this.i=wr(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const n of this.g.values())n.cancel();this.g.clear()}};function wr(n){if(n.h!=null)return n.i.concat(n.h.G);if(n.g!=null&&n.g.size!==0){let s=n.i;for(const a of n.g.values())s=s.concat(a.G);return s}return O(n.i)}var Ir=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function pa(n,s){if(n){n=n.split("&");for(let a=0;a<n.length;a++){const l=n[a].indexOf("=");let y,E=null;l>=0?(y=n[a].substring(0,l),E=n[a].substring(l+1)):y=n[a],s(y,E?decodeURIComponent(E.replace(/\+/g," ")):"")}}}function be(n){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let s;n instanceof be?(this.l=n.l,At(this,n.j),this.o=n.o,this.g=n.g,St(this,n.u),this.h=n.h,Zn(this,br(n.i)),this.m=n.m):n&&(s=String(n).match(Ir))?(this.l=!1,At(this,s[1]||"",!0),this.o=bt(s[2]||""),this.g=bt(s[3]||"",!0),St(this,s[4]),this.h=bt(s[5]||"",!0),Zn(this,s[6]||"",!0),this.m=bt(s[7]||"")):(this.l=!1,this.i=new Pt(null,this.l))}be.prototype.toString=function(){const n=[];var s=this.j;s&&n.push(Ct(s,Er,!0),":");var a=this.g;return(a||s=="file")&&(n.push("//"),(s=this.o)&&n.push(Ct(s,Er,!0),"@"),n.push(vt(a).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a=this.u,a!=null&&n.push(":",String(a))),(a=this.h)&&(this.g&&a.charAt(0)!="/"&&n.push("/"),n.push(Ct(a,a.charAt(0)=="/"?_a:ma,!0))),(a=this.i.toString())&&n.push("?",a),(a=this.m)&&n.push("#",Ct(a,wa)),n.join("")},be.prototype.resolve=function(n){const s=ae(this);let a=!!n.j;a?At(s,n.j):a=!!n.o,a?s.o=n.o:a=!!n.g,a?s.g=n.g:a=n.u!=null;var l=n.h;if(a)St(s,n.u);else if(a=!!n.h){if(l.charAt(0)!="/")if(this.g&&!this.h)l="/"+l;else{var y=s.h.lastIndexOf("/");y!=-1&&(l=s.h.slice(0,y+1)+l)}if(y=l,y==".."||y==".")l="";else if(y.indexOf("./")!=-1||y.indexOf("/.")!=-1){l=y.lastIndexOf("/",0)==0,y=y.split("/");const E=[];for(let T=0;T<y.length;){const P=y[T++];P=="."?l&&T==y.length&&E.push(""):P==".."?((E.length>1||E.length==1&&E[0]!="")&&E.pop(),l&&T==y.length&&E.push("")):(E.push(P),l=!0)}l=E.join("/")}else l=y}return a?s.h=l:a=n.i.toString()!=="",a?Zn(s,br(n.i)):a=!!n.m,a&&(s.m=n.m),s};function ae(n){return new be(n)}function At(n,s,a){n.j=a?bt(s,!0):s,n.j&&(n.j=n.j.replace(/:$/,""))}function St(n,s){if(s){if(s=Number(s),isNaN(s)||s<0)throw Error("Bad port number "+s);n.u=s}else n.u=null}function Zn(n,s,a){s instanceof Pt?(n.i=s,Ia(n.i,n.l)):(a||(s=Ct(s,ya)),n.i=new Pt(s,n.l))}function U(n,s,a){n.i.set(s,a)}function rn(n){return U(n,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),n}function bt(n,s){return n?s?decodeURI(n.replace(/%25/g,"%2525")):decodeURIComponent(n):""}function Ct(n,s,a){return typeof n=="string"?(n=encodeURI(n).replace(s,ga),a&&(n=n.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),n):null}function ga(n){return n=n.charCodeAt(0),"%"+(n>>4&15).toString(16)+(n&15).toString(16)}var Er=/[#\/\?@]/g,ma=/[#\?:]/g,_a=/[#\?]/g,ya=/[#\?@]/g,wa=/#/g;function Pt(n,s){this.h=this.g=null,this.i=n||null,this.j=!!s}function We(n){n.g||(n.g=new Map,n.h=0,n.i&&pa(n.i,function(s,a){n.add(decodeURIComponent(s.replace(/\+/g," ")),a)}))}i=Pt.prototype,i.add=function(n,s){We(this),this.i=null,n=ot(this,n);let a=this.g.get(n);return a||this.g.set(n,a=[]),a.push(s),this.h+=1,this};function vr(n,s){We(n),s=ot(n,s),n.g.has(s)&&(n.i=null,n.h-=n.g.get(s).length,n.g.delete(s))}function Tr(n,s){return We(n),s=ot(n,s),n.g.has(s)}i.forEach=function(n,s){We(this),this.g.forEach(function(a,l){a.forEach(function(y){n.call(s,y,l,this)},this)},this)};function Ar(n,s){We(n);let a=[];if(typeof s=="string")Tr(n,s)&&(a=a.concat(n.g.get(ot(n,s))));else for(n=Array.from(n.g.values()),s=0;s<n.length;s++)a=a.concat(n[s]);return a}i.set=function(n,s){return We(this),this.i=null,n=ot(this,n),Tr(this,n)&&(this.h-=this.g.get(n).length),this.g.set(n,[s]),this.h+=1,this},i.get=function(n,s){return n?(n=Ar(this,n),n.length>0?String(n[0]):s):s};function Sr(n,s,a){vr(n,s),a.length>0&&(n.i=null,n.g.set(ot(n,s),O(a)),n.h+=a.length)}i.toString=function(){if(this.i)return this.i;if(!this.g)return"";const n=[],s=Array.from(this.g.keys());for(let l=0;l<s.length;l++){var a=s[l];const y=vt(a);a=Ar(this,a);for(let E=0;E<a.length;E++){let T=y;a[E]!==""&&(T+="="+vt(a[E])),n.push(T)}}return this.i=n.join("&")};function br(n){const s=new Pt;return s.i=n.i,n.g&&(s.g=new Map(n.g),s.h=n.h),s}function ot(n,s){return s=String(s),n.j&&(s=s.toLowerCase()),s}function Ia(n,s){s&&!n.j&&(We(n),n.i=null,n.g.forEach(function(a,l){const y=l.toLowerCase();l!=y&&(vr(this,l),Sr(this,y,a))},n)),n.j=s}function Ea(n,s){const a=new Et;if(h.Image){const l=new Image;l.onload=S(Ce,a,"TestLoadImage: loaded",!0,s,l),l.onerror=S(Ce,a,"TestLoadImage: error",!1,s,l),l.onabort=S(Ce,a,"TestLoadImage: abort",!1,s,l),l.ontimeout=S(Ce,a,"TestLoadImage: timeout",!1,s,l),h.setTimeout(function(){l.ontimeout&&l.ontimeout()},1e4),l.src=n}else s(!1)}function va(n,s){const a=new Et,l=new AbortController,y=setTimeout(()=>{l.abort(),Ce(a,"TestPingServer: timeout",!1,s)},1e4);fetch(n,{signal:l.signal}).then(E=>{clearTimeout(y),E.ok?Ce(a,"TestPingServer: ok",!0,s):Ce(a,"TestPingServer: server error",!1,s)}).catch(()=>{clearTimeout(y),Ce(a,"TestPingServer: error",!1,s)})}function Ce(n,s,a,l,y){try{y&&(y.onload=null,y.onerror=null,y.onabort=null,y.ontimeout=null),l(a)}catch{}}function Ta(){this.g=new ia}function ei(n){this.i=n.Sb||null,this.h=n.ab||!1}b(ei,rr),ei.prototype.g=function(){return new sn(this.i,this.h)};function sn(n,s){$.call(this),this.H=n,this.o=s,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}b(sn,$),i=sn.prototype,i.open=function(n,s){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=n,this.D=s,this.readyState=1,kt(this)},i.send=function(n){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const s={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};n&&(s.body=n),(this.H||h).fetch(new Request(this.D,s)).then(this.Pa.bind(this),this.ga.bind(this))},i.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Rt(this)),this.readyState=0},i.Pa=function(n){if(this.g&&(this.l=n,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=n.headers,this.readyState=2,kt(this)),this.g&&(this.readyState=3,kt(this),this.g)))if(this.responseType==="arraybuffer")n.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof h.ReadableStream<"u"&&"body"in n){if(this.j=n.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Cr(this)}else n.text().then(this.Oa.bind(this),this.ga.bind(this))};function Cr(n){n.j.read().then(n.Ma.bind(n)).catch(n.ga.bind(n))}i.Ma=function(n){if(this.g){if(this.o&&n.value)this.response.push(n.value);else if(!this.o){var s=n.value?n.value:new Uint8Array(0);(s=this.B.decode(s,{stream:!n.done}))&&(this.response=this.responseText+=s)}n.done?Rt(this):kt(this),this.readyState==3&&Cr(this)}},i.Oa=function(n){this.g&&(this.response=this.responseText=n,Rt(this))},i.Na=function(n){this.g&&(this.response=n,Rt(this))},i.ga=function(){this.g&&Rt(this)};function Rt(n){n.readyState=4,n.l=null,n.j=null,n.B=null,kt(n)}i.setRequestHeader=function(n,s){this.A.append(n,s)},i.getResponseHeader=function(n){return this.h&&this.h.get(n.toLowerCase())||""},i.getAllResponseHeaders=function(){if(!this.h)return"";const n=[],s=this.h.entries();for(var a=s.next();!a.done;)a=a.value,n.push(a[0]+": "+a[1]),a=s.next();return n.join(`\r
`)};function kt(n){n.onreadystatechange&&n.onreadystatechange.call(n)}Object.defineProperty(sn.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(n){this.m=n?"include":"same-origin"}});function Pr(n){let s="";return Zt(n,function(a,l){s+=l,s+=":",s+=a,s+=`\r
`}),s}function ti(n,s,a){e:{for(l in a){var l=!1;break e}l=!0}l||(a=Pr(a),typeof n=="string"?a!=null&&vt(a):U(n,s,a))}function F(n){$.call(this),this.headers=new Map,this.L=n||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}b(F,$);var Aa=/^https?$/i,Sa=["POST","PUT"];i=F.prototype,i.Fa=function(n){this.H=n},i.ea=function(n,s,a,l){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+n);s=s?s.toUpperCase():"GET",this.D=n,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():hr.g(),this.g.onreadystatechange=A(v(this.Ca,this));try{this.B=!0,this.g.open(s,String(n),!0),this.B=!1}catch(E){Rr(this,E);return}if(n=a||"",a=new Map(this.headers),l)if(Object.getPrototypeOf(l)===Object.prototype)for(var y in l)a.set(y,l[y]);else if(typeof l.keys=="function"&&typeof l.get=="function")for(const E of l.keys())a.set(E,l.get(E));else throw Error("Unknown input type for opt_headers: "+String(l));l=Array.from(a.keys()).find(E=>E.toLowerCase()=="content-type"),y=h.FormData&&n instanceof h.FormData,!(Array.prototype.indexOf.call(Sa,s,void 0)>=0)||l||y||a.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[E,T]of a)this.g.setRequestHeader(E,T);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(n),this.v=!1}catch(E){Rr(this,E)}};function Rr(n,s){n.h=!1,n.g&&(n.j=!0,n.g.abort(),n.j=!1),n.l=s,n.o=5,kr(n),on(n)}function kr(n){n.A||(n.A=!0,W(n,"complete"),W(n,"error"))}i.abort=function(n){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=n||7,W(this,"complete"),W(this,"abort"),on(this))},i.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),on(this,!0)),F.Z.N.call(this)},i.Ca=function(){this.u||(this.B||this.v||this.j?Nr(this):this.Xa())},i.Xa=function(){Nr(this)};function Nr(n){if(n.h&&typeof c<"u"){if(n.v&&Pe(n)==4)setTimeout(n.Ca.bind(n),0);else if(W(n,"readystatechange"),Pe(n)==4){n.h=!1;try{const E=n.ca();e:switch(E){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var s=!0;break e;default:s=!1}var a;if(!(a=s)){var l;if(l=E===0){let T=String(n.D).match(Ir)[1]||null;!T&&h.self&&h.self.location&&(T=h.self.location.protocol.slice(0,-1)),l=!Aa.test(T?T.toLowerCase():"")}a=l}if(a)W(n,"complete"),W(n,"success");else{n.o=6;try{var y=Pe(n)>2?n.g.statusText:""}catch{y=""}n.l=y+" ["+n.ca()+"]",kr(n)}}finally{on(n)}}}}function on(n,s){if(n.g){n.m&&(clearTimeout(n.m),n.m=null);const a=n.g;n.g=null,s||W(n,"ready");try{a.onreadystatechange=null}catch{}}}i.isActive=function(){return!!this.g};function Pe(n){return n.g?n.g.readyState:0}i.ca=function(){try{return Pe(this)>2?this.g.status:-1}catch{return-1}},i.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},i.La=function(n){if(this.g){var s=this.g.responseText;return n&&s.indexOf(n)==0&&(s=s.substring(n.length)),na(s)}};function Or(n){try{if(!n.g)return null;if("response"in n.g)return n.g.response;switch(n.F){case"":case"text":return n.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in n.g)return n.g.mozResponseArrayBuffer}return null}catch{return null}}function ba(n){const s={};n=(n.g&&Pe(n)>=2&&n.g.getAllResponseHeaders()||"").split(`\r
`);for(let l=0;l<n.length;l++){if(d(n[l]))continue;var a=la(n[l]);const y=a[0];if(a=a[1],typeof a!="string")continue;a=a.trim();const E=s[y]||[];s[y]=E,E.push(a)}Xo(s,function(l){return l.join(", ")})}i.ya=function(){return this.o},i.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Nt(n,s,a){return a&&a.internalChannelParams&&a.internalChannelParams[n]||s}function Dr(n){this.za=0,this.i=[],this.j=new Et,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Nt("failFast",!1,n),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Nt("baseRetryDelayMs",5e3,n),this.Za=Nt("retryDelaySeedMs",1e4,n),this.Ta=Nt("forwardChannelMaxRetries",2,n),this.va=Nt("forwardChannelRequestTimeoutMs",2e4,n),this.ma=n&&n.xmlHttpFactory||void 0,this.Ua=n&&n.Rb||void 0,this.Aa=n&&n.useFetchStreams||!1,this.O=void 0,this.L=n&&n.supportsCrossDomainXhr||!1,this.M="",this.h=new gr(n&&n.concurrentRequestLimit),this.Ba=new Ta,this.S=n&&n.fastHandshake||!1,this.R=n&&n.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=n&&n.Pb||!1,n&&n.ua&&this.j.ua(),n&&n.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&n&&n.detectBufferingProxy||!1,this.ia=void 0,n&&n.longPollingTimeout&&n.longPollingTimeout>0&&(this.ia=n.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}i=Dr.prototype,i.ka=8,i.I=1,i.connect=function(n,s,a,l){G(0),this.W=n,this.H=s||{},a&&l!==void 0&&(this.H.OSID=a,this.H.OAID=l),this.F=this.X,this.J=Hr(this,null,this.W),cn(this)};function ni(n){if(Lr(n),n.I==3){var s=n.V++,a=ae(n.J);if(U(a,"SID",n.M),U(a,"RID",s),U(a,"TYPE","terminate"),Ot(n,a),s=new Se(n,n.j,s),s.M=2,s.A=rn(ae(a)),a=!1,h.navigator&&h.navigator.sendBeacon)try{a=h.navigator.sendBeacon(s.A.toString(),"")}catch{}!a&&h.Image&&(new Image().src=s.A,a=!0),a||(s.g=$r(s.j,null),s.g.ea(s.A)),s.F=Date.now(),nn(s)}Br(n)}function an(n){n.g&&(ri(n),n.g.cancel(),n.g=null)}function Lr(n){an(n),n.v&&(h.clearTimeout(n.v),n.v=null),hn(n),n.h.cancel(),n.m&&(typeof n.m=="number"&&h.clearTimeout(n.m),n.m=null)}function cn(n){if(!mr(n.h)&&!n.m){n.m=!0;var s=n.Ea;Ae||u(),ee||(Ae(),ee=!0),m.add(s,n),n.D=0}}function Ca(n,s){return _r(n.h)>=n.h.j-(n.m?1:0)?!1:n.m?(n.i=s.G.concat(n.i),!0):n.I==1||n.I==2||n.D>=(n.Sa?0:n.Ta)?!1:(n.m=It(v(n.Ea,n,s),jr(n,n.D)),n.D++,!0)}i.Ea=function(n){if(this.m)if(this.m=null,this.I==1){if(!n){this.V=Math.floor(Math.random()*1e5),n=this.V++;const y=new Se(this,this.j,n);let E=this.o;if(this.U&&(E?(E=Ki(E),Xi(E,this.U)):E=this.U),this.u!==null||this.R||(y.J=E,E=null),this.S)e:{for(var s=0,a=0;a<this.i.length;a++){t:{var l=this.i[a];if("__data__"in l.map&&(l=l.map.__data__,typeof l=="string")){l=l.length;break t}l=void 0}if(l===void 0)break;if(s+=l,s>4096){s=a;break e}if(s===4096||a===this.i.length-1){s=a+1;break e}}s=1e3}else s=1e3;s=Ur(this,y,s),a=ae(this.J),U(a,"RID",n),U(a,"CVER",22),this.G&&U(a,"X-HTTP-Session-Id",this.G),Ot(this,a),E&&(this.R?s="headers="+vt(Pr(E))+"&"+s:this.u&&ti(a,this.u,E)),Qn(this.h,y),this.Ra&&U(a,"TYPE","init"),this.S?(U(a,"$req",s),U(a,"SID","null"),y.U=!0,Kn(y,a,null)):Kn(y,a,s),this.I=2}}else this.I==3&&(n?Mr(this,n):this.i.length==0||mr(this.h)||Mr(this))};function Mr(n,s){var a;s?a=s.l:a=n.V++;const l=ae(n.J);U(l,"SID",n.M),U(l,"RID",a),U(l,"AID",n.K),Ot(n,l),n.u&&n.o&&ti(l,n.u,n.o),a=new Se(n,n.j,a,n.D+1),n.u===null&&(a.J=n.o),s&&(n.i=s.G.concat(n.i)),s=Ur(n,a,1e3),a.H=Math.round(n.va*.5)+Math.round(n.va*.5*Math.random()),Qn(n.h,a),Kn(a,l,s)}function Ot(n,s){n.H&&Zt(n.H,function(a,l){U(s,l,a)}),n.l&&Zt({},function(a,l){U(s,l,a)})}function Ur(n,s,a){a=Math.min(n.i.length,a);const l=n.l?v(n.l.Ka,n.l,n):null;e:{var y=n.i;let P=-1;for(;;){const B=["count="+a];P==-1?a>0?(P=y[0].g,B.push("ofs="+P)):P=0:B.push("ofs="+P);let M=!0;for(let H=0;H<a;H++){var E=y[H].g;const ce=y[H].map;if(E-=P,E<0)P=Math.max(0,y[H].g-100),M=!1;else try{E="req"+E+"_"||"";try{var T=ce instanceof Map?ce:Object.entries(ce);for(const[ze,Re]of T){let ke=Re;g(Re)&&(ke=Bn(Re)),B.push(E+ze+"="+encodeURIComponent(ke))}}catch(ze){throw B.push(E+"type="+encodeURIComponent("_badmap")),ze}}catch{l&&l(ce)}}if(M){T=B.join("&");break e}}T=void 0}return n=n.i.splice(0,a),s.G=n,T}function xr(n){if(!n.g&&!n.v){n.Y=1;var s=n.Da;Ae||u(),ee||(Ae(),ee=!0),m.add(s,n),n.A=0}}function ii(n){return n.g||n.v||n.A>=3?!1:(n.Y++,n.v=It(v(n.Da,n),jr(n,n.A)),n.A++,!0)}i.Da=function(){if(this.v=null,Fr(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var n=4*this.T;this.j.info("BP detection timer enabled: "+n),this.B=It(v(this.Wa,this),n)}},i.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,G(10),an(this),Fr(this))};function ri(n){n.B!=null&&(h.clearTimeout(n.B),n.B=null)}function Fr(n){n.g=new Se(n,n.j,"rpc",n.Y),n.u===null&&(n.g.J=n.o),n.g.P=0;var s=ae(n.na);U(s,"RID","rpc"),U(s,"SID",n.M),U(s,"AID",n.K),U(s,"CI",n.F?"0":"1"),!n.F&&n.ia&&U(s,"TO",n.ia),U(s,"TYPE","xmlhttp"),Ot(n,s),n.u&&n.o&&ti(s,n.u,n.o),n.O&&(n.g.H=n.O);var a=n.g;n=n.ba,a.M=1,a.A=rn(ae(s)),a.u=null,a.R=!0,dr(a,n)}i.Va=function(){this.C!=null&&(this.C=null,an(this),ii(this),G(19))};function hn(n){n.C!=null&&(h.clearTimeout(n.C),n.C=null)}function Vr(n,s){var a=null;if(n.g==s){hn(n),ri(n),n.g=null;var l=2}else if(Yn(n.h,s))a=s.G,yr(n.h,s),l=1;else return;if(n.I!=0){if(s.o)if(l==1){a=s.u?s.u.length:0,s=Date.now()-s.F;var y=n.D;l=Wn(),W(l,new cr(l,a)),cn(n)}else xr(n);else if(y=s.m,y==3||y==0&&s.X>0||!(l==1&&Ca(n,s)||l==2&&ii(n)))switch(a&&a.length>0&&(s=n.h,s.i=s.i.concat(a)),y){case 1:Ge(n,5);break;case 4:Ge(n,10);break;case 3:Ge(n,6);break;default:Ge(n,2)}}}function jr(n,s){let a=n.Qa+Math.floor(Math.random()*n.Za);return n.isActive()||(a*=2),a*s}function Ge(n,s){if(n.j.info("Error code "+s),s==2){var a=v(n.bb,n),l=n.Ua;const y=!l;l=new be(l||"//www.google.com/images/cleardot.gif"),h.location&&h.location.protocol=="http"||At(l,"https"),rn(l),y?Ea(l.toString(),a):va(l.toString(),a)}else G(2);n.I=0,n.l&&n.l.pa(s),Br(n),Lr(n)}i.bb=function(n){n?(this.j.info("Successfully pinged google.com"),G(2)):(this.j.info("Failed to ping google.com"),G(1))};function Br(n){if(n.I=0,n.ja=[],n.l){const s=wr(n.h);(s.length!=0||n.i.length!=0)&&(D(n.ja,s),D(n.ja,n.i),n.h.i.length=0,O(n.i),n.i.length=0),n.l.oa()}}function Hr(n,s,a){var l=a instanceof be?ae(a):new be(a);if(l.g!="")s&&(l.g=s+"."+l.g),St(l,l.u);else{var y=h.location;l=y.protocol,s=s?s+"."+y.hostname:y.hostname,y=+y.port;const E=new be(null);l&&At(E,l),s&&(E.g=s),y&&St(E,y),a&&(E.h=a),l=E}return a=n.G,s=n.wa,a&&s&&U(l,a,s),U(l,"VER",n.ka),Ot(n,l),l}function $r(n,s,a){if(s&&!n.L)throw Error("Can't create secondary domain capable XhrIo object.");return s=n.Aa&&!n.ma?new F(new ei({ab:a})):new F(n.ma),s.Fa(n.L),s}i.isActive=function(){return!!this.l&&this.l.isActive(this)};function Wr(){}i=Wr.prototype,i.ra=function(){},i.qa=function(){},i.pa=function(){},i.oa=function(){},i.isActive=function(){return!0},i.Ka=function(){};function te(n,s){$.call(this),this.g=new Dr(s),this.l=n,this.h=s&&s.messageUrlParams||null,n=s&&s.messageHeaders||null,s&&s.clientProtocolHeaderRequired&&(n?n["X-Client-Protocol"]="webchannel":n={"X-Client-Protocol":"webchannel"}),this.g.o=n,n=s&&s.initMessageHeaders||null,s&&s.messageContentType&&(n?n["X-WebChannel-Content-Type"]=s.messageContentType:n={"X-WebChannel-Content-Type":s.messageContentType}),s&&s.sa&&(n?n["X-WebChannel-Client-Profile"]=s.sa:n={"X-WebChannel-Client-Profile":s.sa}),this.g.U=n,(n=s&&s.Qb)&&!d(n)&&(this.g.u=n),this.A=s&&s.supportsCrossDomainXhr||!1,this.v=s&&s.sendRawJson||!1,(s=s&&s.httpSessionIdParam)&&!d(s)&&(this.g.G=s,n=this.h,n!==null&&s in n&&(n=this.h,s in n&&delete n[s])),this.j=new at(this)}b(te,$),te.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},te.prototype.close=function(){ni(this.g)},te.prototype.o=function(n){var s=this.g;if(typeof n=="string"){var a={};a.__data__=n,n=a}else this.v&&(a={},a.__data__=Bn(n),n=a);s.i.push(new fa(s.Ya++,n)),s.I==3&&cn(s)},te.prototype.N=function(){this.g.l=null,delete this.j,ni(this.g),delete this.g,te.Z.N.call(this)};function Gr(n){Hn.call(this),n.__headers__&&(this.headers=n.__headers__,this.statusCode=n.__status__,delete n.__headers__,delete n.__status__);var s=n.__sm__;if(s){e:{for(const a in s){n=a;break e}n=void 0}(this.i=n)&&(n=this.i,s=s!==null&&n in s?s[n]:void 0),this.data=s}else this.data=n}b(Gr,Hn);function zr(){$n.call(this),this.status=1}b(zr,$n);function at(n){this.g=n}b(at,Wr),at.prototype.ra=function(){W(this.g,"a")},at.prototype.qa=function(n){W(this.g,new Gr(n))},at.prototype.pa=function(n){W(this.g,new zr)},at.prototype.oa=function(){W(this.g,"b")},te.prototype.send=te.prototype.o,te.prototype.open=te.prototype.m,te.prototype.close=te.prototype.close,Gn.NO_ERROR=0,Gn.TIMEOUT=8,Gn.HTTP_ERROR=6,ha.COMPLETE="complete",ra.EventType=yt,yt.OPEN="a",yt.CLOSE="b",yt.ERROR="c",yt.MESSAGE="d",$.prototype.listen=$.prototype.J,F.prototype.listenOnce=F.prototype.K,F.prototype.getLastError=F.prototype.Ha,F.prototype.getLastErrorCode=F.prototype.ya,F.prototype.getStatus=F.prototype.ca,F.prototype.getResponseJson=F.prototype.La,F.prototype.getResponseText=F.prototype.la,F.prototype.send=F.prototype.ea,F.prototype.setWithCredentials=F.prototype.Fa}).apply(typeof dn<"u"?dn:typeof self<"u"?self:typeof window<"u"?window:{});const As="@firebase/firestore",Ss="4.9.2";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}z.UNAUTHENTICATED=new z(null),z.GOOGLE_CREDENTIALS=new z("google-credentials-uid"),z.FIRST_PARTY=new z("first-party-uid"),z.MOCK_USER=new z("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Xt="12.3.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ft=new Ri("@firebase/firestore");function oe(i,...e){if(ft.logLevel<=L.DEBUG){const t=e.map($i);ft.debug(`Firestore (${Xt}): ${i}`,...t)}}function xo(i,...e){if(ft.logLevel<=L.ERROR){const t=e.map($i);ft.error(`Firestore (${Xt}): ${i}`,...t)}}function Au(i,...e){if(ft.logLevel<=L.WARN){const t=e.map($i);ft.warn(`Firestore (${Xt}): ${i}`,...t)}}function $i(i){if(typeof i=="string")return i;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return(function(t){return JSON.stringify(t)})(i)}catch{return i}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $t(i,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,Fo(i,r,t)}function Fo(i,e,t){let r=`FIRESTORE (${Xt}) INTERNAL ASSERTION FAILED: ${e} (ID: ${i.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw xo(r),new Error(r)}function xt(i,e,t,r){let o="Unexpected state";typeof t=="string"?o=t:r=t,i||Fo(e,o,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const k={CANCELLED:"cancelled",INVALID_ARGUMENT:"invalid-argument",FAILED_PRECONDITION:"failed-precondition"};class N extends me{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vo{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class Su{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(z.UNAUTHENTICATED)))}shutdown(){}}class bu{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class Cu{constructor(e){this.t=e,this.currentUser=z.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){xt(this.o===void 0,42304);let r=this.i;const o=I=>this.i!==r?(r=this.i,t(I)):Promise.resolve();let c=new Ft;this.o=()=>{this.i++,this.currentUser=this.u(),c.resolve(),c=new Ft,e.enqueueRetryable((()=>o(this.currentUser)))};const h=()=>{const I=c;e.enqueueRetryable((async()=>{await I.promise,await o(this.currentUser)}))},g=I=>{oe("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=I,this.o&&(this.auth.addAuthTokenListener(this.o),h())};this.t.onInit((I=>g(I))),setTimeout((()=>{if(!this.auth){const I=this.t.getImmediate({optional:!0});I?g(I):(oe("FirebaseAuthCredentialsProvider","Auth not yet detected"),c.resolve(),c=new Ft)}}),0),h()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((r=>this.i!==e?(oe("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(xt(typeof r.accessToken=="string",31837,{l:r}),new Vo(r.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return xt(e===null||typeof e=="string",2055,{h:e}),new z(e)}}class Pu{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=z.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class Ru{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new Pu(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(z.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class bs{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class ku{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,J(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){xt(this.o===void 0,3512);const r=c=>{c.error!=null&&oe("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${c.error.message}`);const h=c.token!==this.m;return this.m=c.token,oe("FirebaseAppCheckTokenProvider",`Received ${h?"new":"existing"} token.`),h?t(c.token):Promise.resolve()};this.o=c=>{e.enqueueRetryable((()=>r(c)))};const o=c=>{oe("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=c,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((c=>o(c))),setTimeout((()=>{if(!this.appCheck){const c=this.V.getImmediate({optional:!0});c?o(c):oe("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new bs(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(xt(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new bs(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nu(i){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(i);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<i;r++)t[r]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ou{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const o=Nu(40);for(let c=0;c<o.length;++c)r.length<20&&o[c]<t&&(r+=e.charAt(o[c]%62))}return r}}function Ve(i,e){return i<e?-1:i>e?1:0}function Du(i,e){const t=Math.min(i.length,e.length);for(let r=0;r<t;r++){const o=i.charAt(r),c=e.charAt(r);if(o!==c)return fi(o)===fi(c)?Ve(o,c):fi(o)?1:-1}return Ve(i.length,e.length)}const Lu=55296,Mu=57343;function fi(i){const e=i.charCodeAt(0);return e>=Lu&&e<=Mu}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cs="__name__";class he{constructor(e,t,r){t===void 0?t=0:t>e.length&&$t(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&$t(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return he.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof he?e.forEach((r=>{t.push(r)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let o=0;o<r;o++){const c=he.compareSegments(e.get(o),t.get(o));if(c!==0)return c}return Ve(e.length,t.length)}static compareSegments(e,t){const r=he.isNumericId(e),o=he.isNumericId(t);return r&&!o?-1:!r&&o?1:r&&o?he.extractNumericId(e).compare(he.extractNumericId(t)):Du(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Hi.fromString(e.substring(4,e.length-2))}}class re extends he{construct(e,t,r){return new re(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new N(k.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter((o=>o.length>0)))}return new re(t)}static emptyPath(){return new re([])}}const Uu=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Ke extends he{construct(e,t,r){return new Ke(e,t,r)}static isValidIdentifier(e){return Uu.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Ke.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Cs}static keyField(){return new Ke([Cs])}static fromServerFormat(e){const t=[];let r="",o=0;const c=()=>{if(r.length===0)throw new N(k.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let h=!1;for(;o<e.length;){const g=e[o];if(g==="\\"){if(o+1===e.length)throw new N(k.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const I=e[o+1];if(I!=="\\"&&I!=="."&&I!=="`")throw new N(k.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=I,o+=2}else g==="`"?(h=!h,o++):g!=="."||h?(r+=g,o++):(c(),o++)}if(c(),h)throw new N(k.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Ke(t)}static emptyPath(){return new Ke([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Je{constructor(e){this.path=e}static fromPath(e){return new Je(re.fromString(e))}static fromName(e){return new Je(re.fromString(e).popFirst(5))}static empty(){return new Je(re.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&re.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return re.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new Je(new re(e.slice()))}}function xu(i,e,t,r){if(e===!0&&r===!0)throw new N(k.INVALID_ARGUMENT,`${i} and ${t} cannot be used together.`)}function Fu(i){return typeof i=="object"&&i!==null&&(Object.getPrototypeOf(i)===Object.prototype||Object.getPrototypeOf(i)===null)}function Vu(i){if(i===void 0)return"undefined";if(i===null)return"null";if(typeof i=="string")return i.length>20&&(i=`${i.substring(0,20)}...`),JSON.stringify(i);if(typeof i=="number"||typeof i=="boolean")return""+i;if(typeof i=="object"){if(i instanceof Array)return"an array";{const e=(function(r){return r.constructor?r.constructor.name:null})(i);return e?`a custom ${e} object`:"an object"}}return typeof i=="function"?"a function":$t(12329,{type:typeof i})}function ju(i,e){if("_delegate"in i&&(i=i._delegate),!(i instanceof e)){if(e.name===i.constructor.name)throw new N(k.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Vu(i);throw new N(k.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return i}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function j(i,e){const t={typeString:i};return e&&(t.value=e),t}function Yt(i,e){if(!Fu(i))throw new N(k.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const o=e[r].typeString,c="value"in e[r]?{value:e[r].value}:void 0;if(!(r in i)){t=`JSON missing required field: '${r}'`;break}const h=i[r];if(o&&typeof h!==o){t=`JSON field '${r}' must be a ${o}.`;break}if(c!==void 0&&h!==c.value){t=`Expected '${r}' field to equal '${c.value}'`;break}}if(t)throw new N(k.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ps=-62135596800,Rs=1e6;class le{static now(){return le.fromMillis(Date.now())}static fromDate(e){return le.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*Rs);return new le(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new N(k.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new N(k.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Ps)throw new N(k.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new N(k.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Rs}_compareTo(e){return this.seconds===e.seconds?Ve(this.nanoseconds,e.nanoseconds):Ve(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:le._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Yt(e,le._jsonSchema))return new le(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Ps;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}le._jsonSchemaVersion="firestore/timestamp/1.0",le._jsonSchema={type:j("string",le._jsonSchemaVersion),seconds:j("number"),nanoseconds:j("number")};function Bu(i){return i.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hu extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nt{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(o){try{return atob(o)}catch(c){throw typeof DOMException<"u"&&c instanceof DOMException?new Hu("Invalid base64 string: "+c):c}})(e);return new nt(t)}static fromUint8Array(e){const t=(function(o){let c="";for(let h=0;h<o.length;++h)c+=String.fromCharCode(o[h]);return c})(e);return new nt(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const r=new Uint8Array(t.length);for(let o=0;o<t.length;o++)r[o]=t.charCodeAt(o);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return Ve(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}nt.EMPTY_BYTE_STRING=new nt("");const Ai="(default)";class Cn{constructor(e,t){this.projectId=e,this.database=t||Ai}static empty(){return new Cn("","")}get isDefaultDatabase(){return this.database===Ai}isEqual(e){return e instanceof Cn&&e.projectId===this.projectId&&e.database===this.database}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $u{constructor(e,t=null,r=[],o=[],c=null,h="F",g=null,I=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=o,this.limit=c,this.limitType=h,this.startAt=g,this.endAt=I,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Wu(i){return new $u(i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ks,R;(R=ks||(ks={}))[R.OK=0]="OK",R[R.CANCELLED=1]="CANCELLED",R[R.UNKNOWN=2]="UNKNOWN",R[R.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",R[R.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",R[R.NOT_FOUND=5]="NOT_FOUND",R[R.ALREADY_EXISTS=6]="ALREADY_EXISTS",R[R.PERMISSION_DENIED=7]="PERMISSION_DENIED",R[R.UNAUTHENTICATED=16]="UNAUTHENTICATED",R[R.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",R[R.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",R[R.ABORTED=10]="ABORTED",R[R.OUT_OF_RANGE=11]="OUT_OF_RANGE",R[R.UNIMPLEMENTED=12]="UNIMPLEMENTED",R[R.INTERNAL=13]="INTERNAL",R[R.UNAVAILABLE=14]="UNAVAILABLE",R[R.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */new Hi([4294967295,4294967295],0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gu=41943040;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zu=1048576;function pi(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qu{constructor(e,t,r=1e3,o=1.5,c=6e4){this.Mi=e,this.timerId=t,this.d_=r,this.A_=o,this.R_=c,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),o=Math.max(0,t-r);o>0&&oe("ExponentialBackoff",`Backing off for ${o} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,o,(()=>(this.f_=Date.now(),e()))),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wi{constructor(e,t,r,o,c){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=o,this.removalCallback=c,this.deferred=new Ft,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((h=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,o,c){const h=Date.now()+r,g=new Wi(e,t,h,o,c);return g.start(r),g}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new N(k.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}var Ns,Os;(Os=Ns||(Ns={})).Ma="default",Os.Cache="cache";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ku(i){const e={};return i.timeoutSeconds!==void 0&&(e.timeoutSeconds=i.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ds=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jo="firestore.googleapis.com",Ls=!0;class Ms{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new N(k.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=jo,this.ssl=Ls}else this.host=e.host,this.ssl=e.ssl??Ls;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Gu;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<zu)throw new N(k.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}xu("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Ku(e.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new N(k.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new N(k.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new N(k.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(r,o){return r.timeoutSeconds===o.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Bo{constructor(e,t,r,o){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=o,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Ms({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new N(k.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new N(k.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Ms(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new Su;switch(r.type){case"firstParty":return new Ru(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new N(k.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const r=Ds.get(t);r&&(oe("ComponentProvider","Removing Datastore"),Ds.delete(t),r.terminate())})(this),Promise.resolve()}}function Ju(i,e,t,r={}){i=ju(i,Bo);const o=it(e),c=i._getSettings(),h={...c,emulatorOptions:i._getEmulatorOptions()},g=`${e}:${t}`;o&&(Ci(`https://${g}`),Pi("Firestore",!0)),c.host!==jo&&c.host!==g&&Au("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const I={...c,host:g,ssl:o,emulatorOptions:r};if(!Qe(I,h)&&(i._setSettings(I),r.mockUserToken)){let v,S;if(typeof r.mockUserToken=="string")v=r.mockUserToken,S=z.MOCK_USER;else{v=xa(r.mockUserToken,i._app?.options.projectId);const b=r.mockUserToken.sub||r.mockUserToken.user_id;if(!b)throw new N(k.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");S=new z(b)}i._authCredentials=new bu(new Vo(v,S))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gi{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Gi(this.firestore,e,this._query)}}class ue{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new zi(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ue(this.firestore,e,this._key)}toJSON(){return{type:ue._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(Yt(t,ue._jsonSchema))return new ue(e,r||null,new Je(re.fromString(t.referencePath)))}}ue._jsonSchemaVersion="firestore/documentReference/1.0",ue._jsonSchema={type:j("string",ue._jsonSchemaVersion),referencePath:j("string")};class zi extends Gi{constructor(e,t,r){super(e,t,Wu(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ue(this.firestore,null,new Je(e))}withConverter(e){return new zi(this.firestore,e,this._path)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Us="AsyncQueue";class xs{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new qu(this,"async_queue_retry"),this._c=()=>{const r=pi();r&&oe(Us,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const t=pi();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=pi();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new Ft;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Xu.push(e),this.lc())))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!Bu(e))throw e;oe(Us,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((r=>{throw this.nc=r,this.rc=!1,xo("INTERNAL UNHANDLED ERROR: ",Fs(r)),r})).then((r=>(this.rc=!1,r))))));return this.ac=t,t}enqueueAfterDelay(e,t,r){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const o=Wi.createAndSchedule(this,e,t,r,(c=>this.hc(c)));return this.tc.push(o),o}uc(){this.nc&&$t(47125,{Pc:Fs(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,r)=>t.targetTimeMs-r.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function Fs(i){let e=i.message||"";return i.stack&&(e=i.stack.includes(i.message)?i.stack:i.message+`
`+i.stack),e}class Xu extends Bo{constructor(e,t,r,o){super(e,t,r,o),this.type="firestore",this._queue=new xs,this._persistenceKey=o?.name||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new xs(e),this._firestoreClient=void 0,await e}}}function kd(i,e){const t=typeof i=="object"?i:Ni(),r=typeof i=="string"?i:Ai,o=kn(t,"firestore").getImmediate({identifier:r});if(!o._initialized){const c=qs("firestore");c&&Ju(o,...c)}return o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _e{constructor(e){this._byteString=e}static fromBase64String(e){try{return new _e(nt.fromBase64String(e))}catch(t){throw new N(k.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new _e(nt.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:_e._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Yt(e,_e._jsonSchema))return _e.fromBase64String(e.bytes)}}_e._jsonSchemaVersion="firestore/bytes/1.0",_e._jsonSchema={type:j("string",_e._jsonSchemaVersion),bytes:j("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ho{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new N(k.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Ke(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xe{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new N(k.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new N(k.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return Ve(this._lat,e._lat)||Ve(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Xe._jsonSchemaVersion}}static fromJSON(e){if(Yt(e,Xe._jsonSchema))return new Xe(e.latitude,e.longitude)}}Xe._jsonSchemaVersion="firestore/geoPoint/1.0",Xe._jsonSchema={type:j("string",Xe._jsonSchemaVersion),latitude:j("number"),longitude:j("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ye{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(r,o){if(r.length!==o.length)return!1;for(let c=0;c<r.length;++c)if(r[c]!==o[c])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Ye._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Yt(e,Ye._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Ye(e.vectorValues);throw new N(k.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ye._jsonSchemaVersion="firestore/vectorValue/1.0",Ye._jsonSchema={type:j("string",Ye._jsonSchemaVersion),vectorValues:j("object")};const Yu=new RegExp("[~\\*/\\[\\]]");function Qu(i,e,t){if(e.search(Yu)>=0)throw Vs(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,i);try{return new Ho(...e.split("."))._internalPath}catch{throw Vs(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,i)}}function Vs(i,e,t,r,o){let c=`Function ${e}() called with invalid data`;c+=". ";let h="";return new N(k.INVALID_ARGUMENT,c+i+h)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $o{constructor(e,t,r,o,c){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=o,this._converter=c}get id(){return this._key.path.lastSegment()}get ref(){return new ue(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new Zu(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(Wo("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class Zu extends $o{data(){return super.data()}}function Wo(i,e){return typeof e=="string"?Qu(i,e):e instanceof Ho?e._internalPath:e._delegate._internalPath}class fn{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class dt extends $o{constructor(e,t,r,o,c,h){super(e,t,r,o,h),this._firestore=e,this._firestoreImpl=e,this.metadata=c}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new yn(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field(Wo("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new N(k.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=dt._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}dt._jsonSchemaVersion="firestore/documentSnapshot/1.0",dt._jsonSchema={type:j("string",dt._jsonSchemaVersion),bundleSource:j("string","DocumentSnapshot"),bundleName:j("string"),bundle:j("string")};class yn extends dt{data(e={}){return super.data(e)}}class Vt{constructor(e,t,r,o){this._firestore=e,this._userDataWriter=t,this._snapshot=o,this.metadata=new fn(o.hasPendingWrites,o.fromCache),this.query=r}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((r=>{e.call(t,new yn(this._firestore,this._userDataWriter,r.key,r,new fn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new N(k.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(o,c){if(o._snapshot.oldDocs.isEmpty()){let h=0;return o._snapshot.docChanges.map((g=>{const I=new yn(o._firestore,o._userDataWriter,g.doc.key,g.doc,new fn(o._snapshot.mutatedKeys.has(g.doc.key),o._snapshot.fromCache),o.query.converter);return g.doc,{type:"added",doc:I,oldIndex:-1,newIndex:h++}}))}{let h=o._snapshot.oldDocs;return o._snapshot.docChanges.filter((g=>c||g.type!==3)).map((g=>{const I=new yn(o._firestore,o._userDataWriter,g.doc.key,g.doc,new fn(o._snapshot.mutatedKeys.has(g.doc.key),o._snapshot.fromCache),o.query.converter);let v=-1,S=-1;return g.type!==0&&(v=h.indexOf(g.doc.key),h=h.delete(g.doc.key)),g.type!==1&&(h=h.add(g.doc),S=h.indexOf(g.doc.key)),{type:ed(g.type),doc:I,oldIndex:v,newIndex:S}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new N(k.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Vt._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Ou.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],o=[];return this.docs.forEach((c=>{c._document!==null&&(t.push(c._document),r.push(this._userDataWriter.convertObjectMap(c._document.data.value.mapValue.fields,"previous")),o.push(c.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function ed(i){switch(i){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return $t(61501,{type:i})}}Vt._jsonSchemaVersion="firestore/querySnapshot/1.0",Vt._jsonSchema={type:j("string",Vt._jsonSchemaVersion),bundleSource:j("string","QuerySnapshot"),bundleName:j("string"),bundle:j("string")};(function(e,t=!0){(function(o){Xt=o})(gt),Ze(new Fe("firestore",((r,{instanceIdentifier:o,options:c})=>{const h=r.getProvider("app").getImmediate(),g=new Xu(new Cu(r.getProvider("auth-internal")),new ku(h,r.getProvider("app-check-internal")),(function(v,S){if(!Object.prototype.hasOwnProperty.apply(v.options,["projectId"]))throw new N(k.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Cn(v.options.projectId,S)})(h,o),h);return c={useFetchStreams:t,...c},g._setSettings(c),g}),"PUBLIC").setMultipleInstances(!0)),de(As,Ss,e),de(As,Ss,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const td="type.googleapis.com/google.protobuf.Int64Value",nd="type.googleapis.com/google.protobuf.UInt64Value";function Go(i,e){const t={};for(const r in i)i.hasOwnProperty(r)&&(t[r]=e(i[r]));return t}function Pn(i){if(i==null)return null;if(i instanceof Number&&(i=i.valueOf()),typeof i=="number"&&isFinite(i)||i===!0||i===!1||Object.prototype.toString.call(i)==="[object String]")return i;if(i instanceof Date)return i.toISOString();if(Array.isArray(i))return i.map(e=>Pn(e));if(typeof i=="function"||typeof i=="object")return Go(i,e=>Pn(e));throw new Error("Data cannot be encoded in JSON: "+i)}function pt(i){if(i==null)return i;if(i["@type"])switch(i["@type"]){case td:case nd:{const e=Number(i.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+i);return e}default:throw new Error("Data cannot be decoded from JSON: "+i)}return Array.isArray(i)?i.map(e=>pt(e)):typeof i=="function"||typeof i=="object"?Go(i,e=>pt(e)):i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qi="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const js={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class X extends me{constructor(e,t,r){super(`${qi}/${e}`,t||""),this.details=r,Object.setPrototypeOf(this,X.prototype)}}function id(i){if(i>=200&&i<300)return"ok";switch(i){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function Rn(i,e){let t=id(i),r=t,o;try{const c=e&&e.error;if(c){const h=c.status;if(typeof h=="string"){if(!js[h])return new X("internal","internal");t=js[h],r=h}const g=c.message;typeof g=="string"&&(r=g),o=c.details,o!==void 0&&(o=pt(o))}}catch{}return t==="ok"?null:new X(t,r,o)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rd{constructor(e,t,r,o){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,J(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||t.get().then(c=>this.auth=c,()=>{}),this.messaging||r.get().then(c=>this.messaging=c,()=>{}),this.appCheck||o?.get().then(c=>this.appCheck=c,()=>{})}async getAuthToken(){if(this.auth)try{return(await this.auth.getToken())?.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),r=await this.getMessagingToken(),o=await this.getAppCheckToken(e);return{authToken:t,messagingToken:r,appCheckToken:o}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Si="us-central1",sd=/^data: (.*?)(?:\n|$)/;function od(i){let e=null;return{promise:new Promise((t,r)=>{e=setTimeout(()=>{r(new X("deadline-exceeded","deadline-exceeded"))},i)}),cancel:()=>{e&&clearTimeout(e)}}}class ad{constructor(e,t,r,o,c=Si,h=(...g)=>fetch(...g)){this.app=e,this.fetchImpl=h,this.emulatorOrigin=null,this.contextProvider=new rd(e,t,r,o),this.cancelAllRequests=new Promise(g=>{this.deleteService=()=>Promise.resolve(g())});try{const g=new URL(c);this.customDomain=g.origin+(g.pathname==="/"?"":g.pathname),this.region=Si}catch{this.customDomain=null,this.region=c}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function cd(i,e,t){const r=it(e);i.emulatorOrigin=`http${r?"s":""}://${e}:${t}`,r&&(Ci(i.emulatorOrigin+"/backends"),Pi("Functions",!0))}function hd(i,e,t){const r=o=>ud(i,e,o,{});return r.stream=(o,c)=>fd(i,e,o,c),r}function zo(i){return i.emulatorOrigin&&it(i.emulatorOrigin)?"include":void 0}async function ld(i,e,t,r,o){t["Content-Type"]="application/json";let c;try{c=await r(i,{method:"POST",body:JSON.stringify(e),headers:t,credentials:zo(o)})}catch{return{status:0,json:null}}let h=null;try{h=await c.json()}catch{}return{status:c.status,json:h}}async function qo(i,e){const t={},r=await i.contextProvider.getContext(e.limitedUseAppCheckTokens);return r.authToken&&(t.Authorization="Bearer "+r.authToken),r.messagingToken&&(t["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=r.appCheckToken),t}function ud(i,e,t,r){const o=i._url(e);return dd(i,o,t,r)}async function dd(i,e,t,r){t=Pn(t);const o={data:t},c=await qo(i,r),h=r.timeout||7e4,g=od(h),I=await Promise.race([ld(e,o,c,i.fetchImpl,i),g.promise,i.cancelAllRequests]);if(g.cancel(),!I)throw new X("cancelled","Firebase Functions instance was deleted.");const v=Rn(I.status,I.json);if(v)throw v;if(!I.json)throw new X("internal","Response is not valid JSON object.");let S=I.json.data;if(typeof S>"u"&&(S=I.json.result),typeof S>"u")throw new X("internal","Response is missing data field.");return{data:pt(S)}}function fd(i,e,t,r){const o=i._url(e);return pd(i,o,t,r||{})}async function pd(i,e,t,r){t=Pn(t);const o={data:t},c=await qo(i,r);c["Content-Type"]="application/json",c.Accept="text/event-stream";let h;try{h=await i.fetchImpl(e,{method:"POST",body:JSON.stringify(o),headers:c,signal:r?.signal,credentials:zo(i)})}catch(A){if(A instanceof Error&&A.name==="AbortError"){const D=new X("cancelled","Request was cancelled.");return{data:Promise.reject(D),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(D)}}}}}}const O=Rn(0,null);return{data:Promise.reject(O),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(O)}}}}}}let g,I;const v=new Promise((A,O)=>{g=A,I=O});r?.signal?.addEventListener("abort",()=>{const A=new X("cancelled","Request was cancelled.");I(A)});const S=h.body.getReader(),b=gd(S,g,I,r?.signal);return{stream:{[Symbol.asyncIterator](){const A=b.getReader();return{async next(){const{value:O,done:D}=await A.read();return{value:O,done:D}},async return(){return await A.cancel(),{done:!0,value:void 0}}}}},data:v}}function gd(i,e,t,r){const o=(h,g)=>{const I=h.match(sd);if(!I)return;const v=I[1];try{const S=JSON.parse(v);if("result"in S){e(pt(S.result));return}if("message"in S){g.enqueue(pt(S.message));return}if("error"in S){const b=Rn(0,S);g.error(b),t(b);return}}catch(S){if(S instanceof X){g.error(S),t(S);return}}},c=new TextDecoder;return new ReadableStream({start(h){let g="";return I();async function I(){if(r?.aborted){const v=new X("cancelled","Request was cancelled");return h.error(v),t(v),Promise.resolve()}try{const{value:v,done:S}=await i.read();if(S){g.trim()&&o(g.trim(),h),h.close();return}if(r?.aborted){const A=new X("cancelled","Request was cancelled");h.error(A),t(A),await i.cancel();return}g+=c.decode(v,{stream:!0});const b=g.split(`
`);g=b.pop()||"";for(const A of b)A.trim()&&o(A.trim(),h);return I()}catch(v){const S=v instanceof X?v:Rn(0,null);h.error(S),t(S)}}},cancel(){return i.cancel()}})}const Bs="@firebase/functions",Hs="0.13.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const md="auth-internal",_d="app-check-internal",yd="messaging-internal";function wd(i){const e=(t,{instanceIdentifier:r})=>{const o=t.getProvider("app").getImmediate(),c=t.getProvider(md),h=t.getProvider(yd),g=t.getProvider(_d);return new ad(o,c,h,g,r)};Ze(new Fe(qi,e,"PUBLIC").setMultipleInstances(!0)),de(Bs,Hs,i),de(Bs,Hs,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nd(i=Ni(),e=Si){const r=kn(ie(i),qi).getImmediate({identifier:e}),o=qs("functions");return o&&Id(r,...o),r}function Id(i,e,t){cd(ie(i),e,t)}function Od(i,e,t){return hd(ie(i),e)}wd();export{Fe as C,Wt as E,me as F,De as G,Ri as L,Ze as _,kn as a,Ga as b,vd as c,Ni as d,Qe as e,Ed as f,ie as g,nh as h,Ha as i,Rd as j,kd as k,Nd as l,Pd as m,Sd as n,Ic as o,Cd as p,Ad as q,de as r,bd as s,Td as t,Od as u,za as v};
