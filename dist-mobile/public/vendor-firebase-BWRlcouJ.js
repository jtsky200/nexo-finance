import{b6 as co}from"./vendor-misc-BL476KuS.js";const mc=()=>{};var os={};/**
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
 */const ho=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},yc=function(n){const e=[];let t=0,r=0;for(;t<n.length;){const s=n[t++];if(s<128)e[r++]=String.fromCharCode(s);else if(s>191&&s<224){const c=n[t++];e[r++]=String.fromCharCode((s&31)<<6|c&63)}else if(s>239&&s<365){const c=n[t++],h=n[t++],u=n[t++],_=((s&7)<<18|(c&63)<<12|(h&63)<<6|u&63)-65536;e[r++]=String.fromCharCode(55296+(_>>10)),e[r++]=String.fromCharCode(56320+(_&1023))}else{const c=n[t++],h=n[t++];e[r++]=String.fromCharCode((s&15)<<12|(c&63)<<6|h&63)}}return e.join("")},lo={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const c=n[s],h=s+1<n.length,u=h?n[s+1]:0,_=s+2<n.length,E=_?n[s+2]:0,A=c>>2,b=(c&3)<<4|u>>4;let v=(u&15)<<2|E>>6,O=E&63;_||(O=64,h||(v=64)),r.push(t[A],t[b],t[v],t[O])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(ho(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):yc(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const c=t[n.charAt(s++)],u=s<n.length?t[n.charAt(s)]:0;++s;const E=s<n.length?t[n.charAt(s)]:64;++s;const b=s<n.length?t[n.charAt(s)]:64;if(++s,c==null||u==null||E==null||b==null)throw new _c;const v=c<<2|u>>4;if(r.push(v),E!==64){const O=u<<4&240|E>>2;if(r.push(O),b!==64){const D=E<<6&192|b;r.push(D)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class _c extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const wc=function(n){const e=ho(n);return lo.encodeByteArray(e,!0)},Sn=function(n){return wc(n).replace(/\./g,"")},uo=function(n){try{return lo.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */function Ic(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Ec=()=>Ic().__FIREBASE_DEFAULTS__,Tc=()=>{if(typeof process>"u"||typeof os>"u")return;const n=os.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},vc=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&uo(n[1]);return e&&JSON.parse(e)},Ui=()=>{try{return mc()||Ec()||Tc()||vc()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},fo=n=>Ui()?.emulatorHosts?.[n],po=n=>{const e=fo(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},go=()=>Ui()?.config,mo=n=>Ui()?.[`_${n}`];/**
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
 */class Ac{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
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
 */function ct(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function xi(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function Sc(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",s=n.iat||0,c=n.sub||n.user_id;if(!c)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const h={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:c,user_id:c,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Sn(JSON.stringify(t)),Sn(JSON.stringify(h)),""].join(".")}const Bt={};function bc(){const n={prod:[],emulator:[]};for(const e of Object.keys(Bt))Bt[e]?n.emulator.push(e):n.prod.push(e);return n}function Cc(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let as=!1;function Fi(n,e){if(typeof window>"u"||typeof document>"u"||!ct(window.location.host)||Bt[n]===e||Bt[n]||as)return;Bt[n]=e;function t(v){return`__firebase__banner__${v}`}const r="__firebase__banner",c=bc().prod.length>0;function h(){const v=document.getElementById(r);v&&v.remove()}function u(v){v.style.display="flex",v.style.background="#7faaf0",v.style.position="fixed",v.style.bottom="5px",v.style.left="5px",v.style.padding=".5em",v.style.borderRadius="5px",v.style.alignItems="center"}function _(v,O){v.setAttribute("width","24"),v.setAttribute("id",O),v.setAttribute("height","24"),v.setAttribute("viewBox","0 0 24 24"),v.setAttribute("fill","none"),v.style.marginLeft="-6px"}function E(){const v=document.createElement("span");return v.style.cursor="pointer",v.style.marginLeft="16px",v.style.fontSize="24px",v.innerHTML=" &times;",v.onclick=()=>{as=!0,h()},v}function A(v,O){v.setAttribute("id",O),v.innerText="Learn more",v.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",v.setAttribute("target","__blank"),v.style.paddingLeft="5px",v.style.textDecoration="underline"}function b(){const v=Cc(r),O=t("text"),D=document.getElementById(O)||document.createElement("span"),V=t("learnmore"),x=document.getElementById(V)||document.createElement("a"),ee=t("preprendIcon"),te=document.getElementById(ee)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(v.created){const ie=v.element;u(ie),A(x,V);const Ce=E();_(te,ee),ie.append(te,D,x,Ce),document.body.appendChild(ie)}c?(D.innerText="Preview backend disconnected.",te.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(te.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
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
 */function K(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Rc(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(K())}function Pc(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function yo(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function kc(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Nc(){const n=K();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function _o(){try{return typeof indexedDB=="object"}catch{return!1}}function wo(){return new Promise((n,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{e(s.error?.message||"")}}catch(t){e(t)}})}function Oc(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
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
 */const Dc="FirebaseError";class ce extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=Dc,Object.setPrototypeOf(this,ce.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ht.prototype.create)}}class ht{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},s=`${this.service}/${e}`,c=this.errors[e],h=c?Lc(c,r):"Error",u=`${this.serviceName}: ${h} (${s}).`;return new ce(s,u,r)}}function Lc(n,e){return n.replace(Mc,(t,r)=>{const s=e[r];return s!=null?String(s):`<${r}?>`})}const Mc=/\{\$([^}]+)}/g;function Uc(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function $e(n,e){if(n===e)return!0;const t=Object.keys(n),r=Object.keys(e);for(const s of t){if(!r.includes(s))return!1;const c=n[s],h=e[s];if(cs(c)&&cs(h)){if(!$e(c,h))return!1}else if(c!==h)return!1}for(const s of r)if(!t.includes(s))return!1;return!0}function cs(n){return n!==null&&typeof n=="object"}/**
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
 */function Yt(n){const e=[];for(const[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function jt(n){const e={};return n.replace(/^\?/,"").split("&").forEach(r=>{if(r){const[s,c]=r.split("=");e[decodeURIComponent(s)]=decodeURIComponent(c)}}),e}function $t(n){const e=n.indexOf("?");if(!e)return"";const t=n.indexOf("#",e);return n.substring(e,t>0?t:void 0)}function xc(n,e){const t=new Fc(n,e);return t.subscribe.bind(t)}class Fc{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let s;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");Vc(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:r},s.next===void 0&&(s.next=yi),s.error===void 0&&(s.error=yi),s.complete===void 0&&(s.complete=yi);const c=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),c}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Vc(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function yi(){}/**
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
 */const jc=1e3,$c=2,Bc=14400*1e3,Hc=.5;function hs(n,e=jc,t=$c){const r=e*Math.pow(t,n),s=Math.round(Hc*r*(Math.random()-.5)*2);return Math.min(Bc,r+s)}/**
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
 */function J(n){return n&&n._delegate?n._delegate:n}class oe{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const Ye="[DEFAULT]";/**
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
 */class Wc{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new Ac;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e?.identifier),r=e?.optional??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Gc(e))try{this.getOrInitializeService({instanceIdentifier:Ye})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const c=this.getOrInitializeService({instanceIdentifier:s});r.resolve(c)}catch{}}}}clearInstance(e=Ye){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Ye){return this.instances.has(e)}getOptions(e=Ye){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[c,h]of this.instancesDeferred.entries()){const u=this.normalizeInstanceIdentifier(c);r===u&&h.resolve(s)}return s}onInit(e,t){const r=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(r)??new Set;s.add(e),this.onInitCallbacks.set(r,s);const c=this.instances.get(r);return c&&e(c,r),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const s of r)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:qc(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=Ye){return this.component?this.component.multipleInstances?e:Ye:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function qc(n){return n===Ye?void 0:n}function Gc(n){return n.instantiationMode==="EAGER"}/**
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
 */class zc{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Wc(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var L;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(L||(L={}));const Kc={debug:L.DEBUG,verbose:L.VERBOSE,info:L.INFO,warn:L.WARN,error:L.ERROR,silent:L.SILENT},Jc=L.INFO,Xc={[L.DEBUG]:"log",[L.VERBOSE]:"log",[L.INFO]:"info",[L.WARN]:"warn",[L.ERROR]:"error"},Yc=(n,e,...t)=>{if(e<n.logLevel)return;const r=new Date().toISOString(),s=Xc[e];if(s)console[s](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Fn{constructor(e){this.name=e,this._logLevel=Jc,this._logHandler=Yc,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in L))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Kc[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,L.DEBUG,...e),this._logHandler(this,L.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,L.VERBOSE,...e),this._logHandler(this,L.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,L.INFO,...e),this._logHandler(this,L.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,L.WARN,...e),this._logHandler(this,L.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,L.ERROR,...e),this._logHandler(this,L.ERROR,...e)}}/**
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
 */class Qc{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Zc(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function Zc(n){return n.getComponent()?.type==="VERSION"}const bi="@firebase/app",ls="0.14.6";/**
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
 */const Ae=new Fn("@firebase/app"),eh="@firebase/app-compat",th="@firebase/analytics-compat",nh="@firebase/analytics",ih="@firebase/app-check-compat",rh="@firebase/app-check",sh="@firebase/auth",oh="@firebase/auth-compat",ah="@firebase/database",ch="@firebase/data-connect",hh="@firebase/database-compat",lh="@firebase/functions",uh="@firebase/functions-compat",dh="@firebase/installations",fh="@firebase/installations-compat",ph="@firebase/messaging",gh="@firebase/messaging-compat",mh="@firebase/performance",yh="@firebase/performance-compat",_h="@firebase/remote-config",wh="@firebase/remote-config-compat",Ih="@firebase/storage",Eh="@firebase/storage-compat",Th="@firebase/firestore",vh="@firebase/ai",Ah="@firebase/firestore-compat",Sh="firebase",bh="12.6.0";/**
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
 */const Ci="[DEFAULT]",Ch={[bi]:"fire-core",[eh]:"fire-core-compat",[nh]:"fire-analytics",[th]:"fire-analytics-compat",[rh]:"fire-app-check",[ih]:"fire-app-check-compat",[sh]:"fire-auth",[oh]:"fire-auth-compat",[ah]:"fire-rtdb",[ch]:"fire-data-connect",[hh]:"fire-rtdb-compat",[lh]:"fire-fn",[uh]:"fire-fn-compat",[dh]:"fire-iid",[fh]:"fire-iid-compat",[ph]:"fire-fcm",[gh]:"fire-fcm-compat",[mh]:"fire-perf",[yh]:"fire-perf-compat",[_h]:"fire-rc",[wh]:"fire-rc-compat",[Ih]:"fire-gcs",[Eh]:"fire-gcs-compat",[Th]:"fire-fst",[Ah]:"fire-fst-compat",[vh]:"fire-vertex","fire-js":"fire-js",[Sh]:"fire-js-all"};/**
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
 */const bn=new Map,Rh=new Map,Ri=new Map;function us(n,e){try{n.container.addComponent(e)}catch(t){Ae.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function de(n){const e=n.name;if(Ri.has(e))return Ae.debug(`There were multiple attempts to register component ${e}.`),!1;Ri.set(e,n);for(const t of bn.values())us(t,n);for(const t of Rh.values())us(t,n);return!0}function He(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function Y(n){return n==null?!1:n.settings!==void 0}/**
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
 */const Ph={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},je=new ht("app","Firebase",Ph);/**
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
 */class kh{constructor(e,t,r){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new oe("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw je.create("app-deleted",{appName:this._name})}}/**
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
 */const Tt=bh;function Nh(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const r={name:Ci,automaticDataCollectionEnabled:!0,...e},s=r.name;if(typeof s!="string"||!s)throw je.create("bad-app-name",{appName:String(s)});if(t||(t=go()),!t)throw je.create("no-options");const c=bn.get(s);if(c){if($e(t,c.options)&&$e(r,c.config))return c;throw je.create("duplicate-app",{appName:s})}const h=new zc(s);for(const _ of Ri.values())h.addComponent(_);const u=new kh(t,r,h);return bn.set(s,u),u}function Vn(n=Ci){const e=bn.get(n);if(!e&&n===Ci&&go())return Nh();if(!e)throw je.create("no-app",{appName:n});return e}function Z(n,e,t){let r=Ch[n]??n;t&&(r+=`-${t}`);const s=r.match(/\s|\//),c=e.match(/\s|\//);if(s||c){const h=[`Unable to register library "${r}" with version "${e}":`];s&&h.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&c&&h.push("and"),c&&h.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Ae.warn(h.join(" "));return}de(new oe(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
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
 */const Oh="firebase-heartbeat-database",Dh=1,zt="firebase-heartbeat-store";let _i=null;function Io(){return _i||(_i=co(Oh,Dh,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(zt)}catch(t){console.warn(t)}}}}).catch(n=>{throw je.create("idb-open",{originalErrorMessage:n.message})})),_i}async function Lh(n){try{const t=(await Io()).transaction(zt),r=await t.objectStore(zt).get(Eo(n));return await t.done,r}catch(e){if(e instanceof ce)Ae.warn(e.message);else{const t=je.create("idb-get",{originalErrorMessage:e?.message});Ae.warn(t.message)}}}async function ds(n,e){try{const r=(await Io()).transaction(zt,"readwrite");await r.objectStore(zt).put(e,Eo(n)),await r.done}catch(t){if(t instanceof ce)Ae.warn(t.message);else{const r=je.create("idb-set",{originalErrorMessage:t?.message});Ae.warn(r.message)}}}function Eo(n){return`${n.name}!${n.options.appId}`}/**
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
 */const Mh=1024,Uh=30;class xh{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Vh(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){try{const t=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=fs();if(this._heartbeatsCache?.heartbeats==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(s=>s.date===r))return;if(this._heartbeatsCache.heartbeats.push({date:r,agent:t}),this._heartbeatsCache.heartbeats.length>Uh){const s=jh(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(s,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){Ae.warn(e)}}async getHeartbeatsHeader(){try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=fs(),{heartbeatsToSend:t,unsentEntries:r}=Fh(this._heartbeatsCache.heartbeats),s=Sn(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(e){return Ae.warn(e),""}}}function fs(){return new Date().toISOString().substring(0,10)}function Fh(n,e=Mh){const t=[];let r=n.slice();for(const s of n){const c=t.find(h=>h.agent===s.agent);if(c){if(c.dates.push(s.date),ps(t)>e){c.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),ps(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class Vh{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return _o()?wo().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Lh(this.app);return t?.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return ds(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return ds(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function ps(n){return Sn(JSON.stringify({version:2,heartbeats:n})).length}function jh(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let r=1;r<n.length;r++)n[r].date<t&&(t=n[r].date,e=r);return e}/**
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
 */function $h(n){de(new oe("platform-logger",e=>new Qc(e),"PRIVATE")),de(new oe("heartbeat",e=>new xh(e),"PRIVATE")),Z(bi,ls,n),Z(bi,ls,"esm2020"),Z("fire-js","")}$h("");var Bh="firebase",Hh="12.6.0";/**
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
 */Z(Bh,Hh,"app");function To(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Wh=To,vo=new ht("auth","Firebase",To());/**
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
 */const Cn=new Fn("@firebase/auth");function qh(n,...e){Cn.logLevel<=L.WARN&&Cn.warn(`Auth (${Tt}): ${n}`,...e)}function In(n,...e){Cn.logLevel<=L.ERROR&&Cn.error(`Auth (${Tt}): ${n}`,...e)}/**
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
 */function ae(n,...e){throw ji(n,...e)}function _e(n,...e){return ji(n,...e)}function Vi(n,e,t){const r={...Wh(),[e]:t};return new ht("auth","Firebase",r).create(e,{appName:n.name})}function we(n){return Vi(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Gh(n,e,t){const r=t;if(!(e instanceof r))throw r.name!==e.constructor.name&&ae(n,"argument-error"),Vi(n,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function ji(n,...e){if(typeof n!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return vo.create(n,...e)}function C(n,e,...t){if(!n)throw ji(e,...t)}function Te(n){const e="INTERNAL ASSERTION FAILED: "+n;throw In(e),new Error(e)}function Se(n,e){n||Te(e)}/**
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
 */function Pi(){return typeof self<"u"&&self.location?.href||""}function zh(){return gs()==="http:"||gs()==="https:"}function gs(){return typeof self<"u"&&self.location?.protocol||null}/**
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
 */function Kh(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(zh()||yo()||"connection"in navigator)?navigator.onLine:!0}function Jh(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class Qt{constructor(e,t){this.shortDelay=e,this.longDelay=t,Se(t>e,"Short delay should be less than long delay!"),this.isMobile=Rc()||kc()}get(){return Kh()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function $i(n,e){Se(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class Ao{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Te("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Te("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Te("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const Xh={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const Yh=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],Qh=new Qt(3e4,6e4);function We(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function qe(n,e,t,r,s={}){return So(n,s,async()=>{let c={},h={};r&&(e==="GET"?h=r:c={body:JSON.stringify(r)});const u=Yt({key:n.config.apiKey,...h}).slice(1),_=await n._getAdditionalHeaders();_["Content-Type"]="application/json",n.languageCode&&(_["X-Firebase-Locale"]=n.languageCode);const E={method:e,headers:_,...c};return Pc()||(E.referrerPolicy="no-referrer"),n.emulatorConfig&&ct(n.emulatorConfig.host)&&(E.credentials="include"),Ao.fetch()(await bo(n,n.config.apiHost,t,u),E)})}async function So(n,e,t){n._canInitEmulator=!1;const r={...Xh,...e};try{const s=new el(n),c=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const h=await c.json();if("needConfirmation"in h)throw yn(n,"account-exists-with-different-credential",h);if(c.ok&&!("errorMessage"in h))return h;{const u=c.ok?h.errorMessage:h.error.message,[_,E]=u.split(" : ");if(_==="FEDERATED_USER_ID_ALREADY_LINKED")throw yn(n,"credential-already-in-use",h);if(_==="EMAIL_EXISTS")throw yn(n,"email-already-in-use",h);if(_==="USER_DISABLED")throw yn(n,"user-disabled",h);const A=r[_]||_.toLowerCase().replace(/[_\s]+/g,"-");if(E)throw Vi(n,A,E);ae(n,A)}}catch(s){if(s instanceof ce)throw s;ae(n,"network-request-failed",{message:String(s)})}}async function Zt(n,e,t,r,s={}){const c=await qe(n,e,t,r,s);return"mfaPendingCredential"in c&&ae(n,"multi-factor-auth-required",{_serverResponse:c}),c}async function bo(n,e,t,r){const s=`${e}${t}?${r}`,c=n,h=c.config.emulator?$i(n.config,s):`${n.config.apiScheme}://${s}`;return Yh.includes(t)&&(await c._persistenceManagerAvailable,c._getPersistenceType()==="COOKIE")?c._getPersistence()._getFinalTarget(h).toString():h}function Zh(n){switch(n){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class el{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(_e(this.auth,"network-request-failed")),Qh.get())})}}function yn(n,e,t){const r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const s=_e(n,e,r);return s.customData._tokenResponse=t,s}function ms(n){return n!==void 0&&n.enterprise!==void 0}class tl{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return Zh(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}async function nl(n,e){return qe(n,"GET","/v2/recaptchaConfig",We(n,e))}/**
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
 */async function il(n,e){return qe(n,"POST","/v1/accounts:delete",e)}async function Rn(n,e){return qe(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function Ht(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function rl(n,e=!1){const t=J(n),r=await t.getIdToken(e),s=Bi(r);C(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const c=typeof s.firebase=="object"?s.firebase:void 0,h=c?.sign_in_provider;return{claims:s,token:r,authTime:Ht(wi(s.auth_time)),issuedAtTime:Ht(wi(s.iat)),expirationTime:Ht(wi(s.exp)),signInProvider:h||null,signInSecondFactor:c?.sign_in_second_factor||null}}function wi(n){return Number(n)*1e3}function Bi(n){const[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return In("JWT malformed, contained fewer than 3 sections"),null;try{const s=uo(t);return s?JSON.parse(s):(In("Failed to decode base64 JWT payload"),null)}catch(s){return In("Caught error parsing JWT payload as JSON",s?.toString()),null}}function ys(n){const e=Bi(n);return C(e,"internal-error"),C(typeof e.exp<"u","internal-error"),C(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function Kt(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof ce&&sl(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function sl({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class ol{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){e?.code==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class ki{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Ht(this.lastLoginAt),this.creationTime=Ht(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function Pn(n){const e=n.auth,t=await n.getIdToken(),r=await Kt(n,Rn(e,{idToken:t}));C(r?.users.length,e,"internal-error");const s=r.users[0];n._notifyReloadListener(s);const c=s.providerUserInfo?.length?Co(s.providerUserInfo):[],h=cl(n.providerData,c),u=n.isAnonymous,_=!(n.email&&s.passwordHash)&&!h?.length,E=u?_:!1,A={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:h,metadata:new ki(s.createdAt,s.lastLoginAt),isAnonymous:E};Object.assign(n,A)}async function al(n){const e=J(n);await Pn(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function cl(n,e){return[...n.filter(r=>!e.some(s=>s.providerId===r.providerId)),...e]}function Co(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
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
 */async function hl(n,e){const t=await So(n,{},async()=>{const r=Yt({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:c}=n.config,h=await bo(n,s,"/v1/token",`key=${c}`),u=await n._getAdditionalHeaders();u["Content-Type"]="application/x-www-form-urlencoded";const _={method:"POST",headers:u,body:r};return n.emulatorConfig&&ct(n.emulatorConfig.host)&&(_.credentials="include"),Ao.fetch()(h,_)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function ll(n,e){return qe(n,"POST","/v2/accounts:revokeToken",We(n,e))}/**
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
 */class gt{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){C(e.idToken,"internal-error"),C(typeof e.idToken<"u","internal-error"),C(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):ys(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){C(e.length!==0,"internal-error");const t=ys(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(C(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:s,expiresIn:c}=await hl(e,t);this.updateTokensAndExpiration(r,s,Number(c))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:s,expirationTime:c}=t,h=new gt;return r&&(C(typeof r=="string","internal-error",{appName:e}),h.refreshToken=r),s&&(C(typeof s=="string","internal-error",{appName:e}),h.accessToken=s),c&&(C(typeof c=="number","internal-error",{appName:e}),h.expirationTime=c),h}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new gt,this.toJSON())}_performRefresh(){return Te("not implemented")}}/**
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
 */function Me(n,e){C(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class le{constructor({uid:e,auth:t,stsTokenManager:r,...s}){this.providerId="firebase",this.proactiveRefresh=new ol(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new ki(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await Kt(this,this.stsTokenManager.getToken(this.auth,e));return C(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return rl(this,e)}reload(){return al(this)}_assign(e){this!==e&&(C(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new le({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){C(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await Pn(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Y(this.auth.app))return Promise.reject(we(this.auth));const e=await this.getIdToken();return await Kt(this,il(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const r=t.displayName??void 0,s=t.email??void 0,c=t.phoneNumber??void 0,h=t.photoURL??void 0,u=t.tenantId??void 0,_=t._redirectEventId??void 0,E=t.createdAt??void 0,A=t.lastLoginAt??void 0,{uid:b,emailVerified:v,isAnonymous:O,providerData:D,stsTokenManager:V}=t;C(b&&V,e,"internal-error");const x=gt.fromJSON(this.name,V);C(typeof b=="string",e,"internal-error"),Me(r,e.name),Me(s,e.name),C(typeof v=="boolean",e,"internal-error"),C(typeof O=="boolean",e,"internal-error"),Me(c,e.name),Me(h,e.name),Me(u,e.name),Me(_,e.name),Me(E,e.name),Me(A,e.name);const ee=new le({uid:b,auth:e,email:s,emailVerified:v,displayName:r,isAnonymous:O,photoURL:h,phoneNumber:c,tenantId:u,stsTokenManager:x,createdAt:E,lastLoginAt:A});return D&&Array.isArray(D)&&(ee.providerData=D.map(te=>({...te}))),_&&(ee._redirectEventId=_),ee}static async _fromIdTokenResponse(e,t,r=!1){const s=new gt;s.updateFromServerResponse(t);const c=new le({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:r});return await Pn(c),c}static async _fromGetAccountInfoResponse(e,t,r){const s=t.users[0];C(s.localId!==void 0,"internal-error");const c=s.providerUserInfo!==void 0?Co(s.providerUserInfo):[],h=!(s.email&&s.passwordHash)&&!c?.length,u=new gt;u.updateFromIdToken(r);const _=new le({uid:s.localId,auth:e,stsTokenManager:u,isAnonymous:h}),E={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:c,metadata:new ki(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!c?.length};return Object.assign(_,E),_}}/**
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
 */const _s=new Map;function ve(n){Se(n instanceof Function,"Expected a class definition");let e=_s.get(n);return e?(Se(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,_s.set(n,e),e)}/**
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
 */class Ro{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Ro.type="NONE";const ws=Ro;/**
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
 */function En(n,e,t){return`firebase:${n}:${e}:${t}`}class mt{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:s,name:c}=this.auth;this.fullUserKey=En(this.userKey,s.apiKey,c),this.fullPersistenceKey=En("persistence",s.apiKey,c),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Rn(this.auth,{idToken:e}).catch(()=>{});return t?le._fromGetAccountInfoResponse(this.auth,t,e):null}return le._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new mt(ve(ws),e,r);const s=(await Promise.all(t.map(async E=>{if(await E._isAvailable())return E}))).filter(E=>E);let c=s[0]||ve(ws);const h=En(r,e.config.apiKey,e.name);let u=null;for(const E of t)try{const A=await E._get(h);if(A){let b;if(typeof A=="string"){const v=await Rn(e,{idToken:A}).catch(()=>{});if(!v)break;b=await le._fromGetAccountInfoResponse(e,v,A)}else b=le._fromJSON(e,A);E!==c&&(u=b),c=E;break}}catch{}const _=s.filter(E=>E._shouldAllowMigration);return!c._shouldAllowMigration||!_.length?new mt(c,e,r):(c=_[0],u&&await c._set(h,u.toJSON()),await Promise.all(t.map(async E=>{if(E!==c)try{await E._remove(h)}catch{}})),new mt(c,e,r))}}/**
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
 */function Is(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Oo(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Po(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Lo(e))return"Blackberry";if(Mo(e))return"Webos";if(ko(e))return"Safari";if((e.includes("chrome/")||No(e))&&!e.includes("edge/"))return"Chrome";if(Do(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if(r?.length===2)return r[1]}return"Other"}function Po(n=K()){return/firefox\//i.test(n)}function ko(n=K()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function No(n=K()){return/crios\//i.test(n)}function Oo(n=K()){return/iemobile/i.test(n)}function Do(n=K()){return/android/i.test(n)}function Lo(n=K()){return/blackberry/i.test(n)}function Mo(n=K()){return/webos/i.test(n)}function Hi(n=K()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function ul(n=K()){return Hi(n)&&!!window.navigator?.standalone}function dl(){return Nc()&&document.documentMode===10}function Uo(n=K()){return Hi(n)||Do(n)||Mo(n)||Lo(n)||/windows phone/i.test(n)||Oo(n)}/**
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
 */function xo(n,e=[]){let t;switch(n){case"Browser":t=Is(K());break;case"Worker":t=`${Is(K())}-${n}`;break;default:t=n}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Tt}/${r}`}/**
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
 */class fl{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=c=>new Promise((h,u)=>{try{const _=e(c);h(_)}catch(_){u(_)}});r.onAbort=t,this.queue.push(r);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r?.message})}}}/**
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
 */async function pl(n,e={}){return qe(n,"GET","/v2/passwordPolicy",We(n,e))}/**
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
 */const gl=6;class ml{constructor(e){const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??gl,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=e.allowedNonAlphanumericCharacters?.join("")??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let s=0;s<e.length;s++)r=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,s,c){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=c))}}/**
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
 */class yl{constructor(e,t,r,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Es(this),this.idTokenSubscription=new Es(this),this.beforeStateQueue=new fl(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=vo,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(c=>this._resolvePersistenceManagerAvailable=c)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=ve(t)),this._initializationPromise=this.queue(async()=>{if(!this._deleted&&(this.persistenceManager=await mt.create(this,e),this._resolvePersistenceManagerAvailable?.(),!this._deleted)){if(this._popupRedirectResolver?._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=this.currentUser?.uid||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Rn(this,{idToken:e}),r=await le._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){if(Y(this.app)){const c=this.app.settings.authIdToken;return c?new Promise(h=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(c).then(h,h))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let r=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const c=this.redirectUser?._redirectEventId,h=r?._redirectEventId,u=await this.tryRedirectSignIn(e);(!c||c===h)&&u?.user&&(r=u.user,s=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(r)}catch(c){r=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(c))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return C(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Pn(e)}catch(t){if(t?.code!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=Jh()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Y(this.app))return Promise.reject(we(this));const t=e?J(e):null;return t&&C(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&C(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Y(this.app)?Promise.reject(we(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Y(this.app)?Promise.reject(we(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(ve(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await pl(this),t=new ml(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new ht("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await ll(this,r)}}toJSON(){return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:this._currentUser?.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&ve(e)||this._popupRedirectResolver;C(t,this,"argument-error"),this.redirectPersistenceManager=await mt.create(this,[ve(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){return this._isInitialized&&await this.queue(async()=>{}),this._currentUser?._redirectEventId===e?this._currentUser:this.redirectUser?._redirectEventId===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=this.currentUser?.uid??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,s){if(this._deleted)return()=>{};const c=typeof t=="function"?t:t.next.bind(t);let h=!1;const u=this._isInitialized?Promise.resolve():this._initializationPromise;if(C(u,this,"internal-error"),u.then(()=>{h||c(this.currentUser)}),typeof t=="function"){const _=e.addObserver(t,r,s);return()=>{h=!0,_()}}else{const _=e.addObserver(t);return()=>{h=!0,_()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return C(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=xo(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await this.heartbeatServiceProvider.getImmediate({optional:!0})?.getHeartbeatsHeader();t&&(e["X-Firebase-Client"]=t);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){if(Y(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await this.appCheckServiceProvider.getImmediate({optional:!0})?.getToken();return e?.error&&qh(`Error while retrieving App Check token: ${e.error}`),e?.token}}function be(n){return J(n)}class Es{constructor(e){this.auth=e,this.observer=null,this.addObserver=xc(t=>this.observer=t)}get next(){return C(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
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
 */let jn={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function _l(n){jn=n}function Fo(n){return jn.loadJS(n)}function wl(){return jn.recaptchaEnterpriseScript}function Il(){return jn.gapiScript}function El(n){return`__${n}${Math.floor(Math.random()*1e6)}`}class Tl{constructor(){this.enterprise=new vl}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class vl{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}const Al="recaptcha-enterprise",Vo="NO_RECAPTCHA";class Sl{constructor(e){this.type=Al,this.auth=be(e)}async verify(e="verify",t=!1){async function r(c){if(!t){if(c.tenantId==null&&c._agentRecaptchaConfig!=null)return c._agentRecaptchaConfig.siteKey;if(c.tenantId!=null&&c._tenantRecaptchaConfigs[c.tenantId]!==void 0)return c._tenantRecaptchaConfigs[c.tenantId].siteKey}return new Promise(async(h,u)=>{nl(c,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(_=>{if(_.recaptchaKey===void 0)u(new Error("recaptcha Enterprise site key undefined"));else{const E=new tl(_);return c.tenantId==null?c._agentRecaptchaConfig=E:c._tenantRecaptchaConfigs[c.tenantId]=E,h(E.siteKey)}}).catch(_=>{u(_)})})}function s(c,h,u){const _=window.grecaptcha;ms(_)?_.enterprise.ready(()=>{_.enterprise.execute(c,{action:e}).then(E=>{h(E)}).catch(()=>{h(Vo)})}):u(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new Tl().execute("siteKey",{action:"verify"}):new Promise((c,h)=>{r(this.auth).then(u=>{if(!t&&ms(window.grecaptcha))s(u,c,h);else{if(typeof window>"u"){h(new Error("RecaptchaVerifier is only supported in browser"));return}let _=wl();_.length!==0&&(_+=u),Fo(_).then(()=>{s(u,c,h)}).catch(E=>{h(E)})}}).catch(u=>{h(u)})})}}async function Ts(n,e,t,r=!1,s=!1){const c=new Sl(n);let h;if(s)h=Vo;else try{h=await c.verify(t)}catch{h=await c.verify(t,!0)}const u={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in u){const _=u.phoneEnrollmentInfo.phoneNumber,E=u.phoneEnrollmentInfo.recaptchaToken;Object.assign(u,{phoneEnrollmentInfo:{phoneNumber:_,recaptchaToken:E,captchaResponse:h,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in u){const _=u.phoneSignInInfo.recaptchaToken;Object.assign(u,{phoneSignInInfo:{recaptchaToken:_,captchaResponse:h,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return u}return r?Object.assign(u,{captchaResp:h}):Object.assign(u,{captchaResponse:h}),Object.assign(u,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(u,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),u}async function Ni(n,e,t,r,s){if(n._getRecaptchaConfig()?.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const c=await Ts(n,e,t,t==="getOobCode");return r(n,c)}else return r(n,e).catch(async c=>{if(c.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const h=await Ts(n,e,t,t==="getOobCode");return r(n,h)}else return Promise.reject(c)})}/**
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
 */function bl(n,e){const t=He(n,"auth");if(t.isInitialized()){const s=t.getImmediate(),c=t.getOptions();if($e(c,e??{}))return s;ae(s,"already-initialized")}return t.initialize({options:e})}function Cl(n,e){const t=e?.persistence||[],r=(Array.isArray(t)?t:[t]).map(ve);e?.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e?.popupRedirectResolver)}function Rl(n,e,t){const r=be(n);C(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");const s=!1,c=jo(e),{host:h,port:u}=Pl(e),_=u===null?"":`:${u}`,E={url:`${c}//${h}${_}/`},A=Object.freeze({host:h,port:u,protocol:c.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!r._canInitEmulator){C(r.config.emulator&&r.emulatorConfig,r,"emulator-config-failed"),C($e(E,r.config.emulator)&&$e(A,r.emulatorConfig),r,"emulator-config-failed");return}r.config.emulator=E,r.emulatorConfig=A,r.settings.appVerificationDisabledForTesting=!0,ct(h)?(xi(`${c}//${h}${_}`),Fi("Auth",!0)):kl()}function jo(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Pl(n){const e=jo(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const r=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(r);if(s){const c=s[1];return{host:c,port:vs(r.substr(c.length+1))}}else{const[c,h]=r.split(":");return{host:c,port:vs(h)}}}function vs(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function kl(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
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
 */class Wi{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return Te("not implemented")}_getIdTokenResponse(e){return Te("not implemented")}_linkToIdToken(e,t){return Te("not implemented")}_getReauthenticationResolver(e){return Te("not implemented")}}async function Nl(n,e){return qe(n,"POST","/v1/accounts:signUp",e)}/**
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
 */async function Ol(n,e){return Zt(n,"POST","/v1/accounts:signInWithPassword",We(n,e))}/**
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
 */async function Dl(n,e){return Zt(n,"POST","/v1/accounts:signInWithEmailLink",We(n,e))}async function Ll(n,e){return Zt(n,"POST","/v1/accounts:signInWithEmailLink",We(n,e))}/**
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
 */class Jt extends Wi{constructor(e,t,r,s=null){super("password",r),this._email=e,this._password=t,this._tenantId=s}static _fromEmailAndPassword(e,t){return new Jt(e,t,"password")}static _fromEmailAndCode(e,t,r=null){return new Jt(e,t,"emailLink",r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t?.email&&t?.password){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Ni(e,t,"signInWithPassword",Ol);case"emailLink":return Dl(e,{email:this._email,oobCode:this._password});default:ae(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const r={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Ni(e,r,"signUpPassword",Nl);case"emailLink":return Ll(e,{idToken:t,email:this._email,oobCode:this._password});default:ae(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
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
 */async function yt(n,e){return Zt(n,"POST","/v1/accounts:signInWithIdp",We(n,e))}/**
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
 */const Ml="http://localhost";class it extends Wi{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new it(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):ae("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:s,...c}=t;if(!r||!s)return null;const h=new it(r,s);return h.idToken=c.idToken||void 0,h.accessToken=c.accessToken||void 0,h.secret=c.secret,h.nonce=c.nonce,h.pendingToken=c.pendingToken||null,h}_getIdTokenResponse(e){const t=this.buildRequest();return yt(e,t)}_linkToIdToken(e,t){const r=this.buildRequest();return r.idToken=t,yt(e,r)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,yt(e,t)}buildRequest(){const e={requestUri:Ml,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Yt(t)}return e}}/**
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
 */function Ul(n){switch(n){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function xl(n){const e=jt($t(n)).link,t=e?jt($t(e)).deep_link_id:null,r=jt($t(n)).deep_link_id;return(r?jt($t(r)).link:null)||r||t||e||n}class qi{constructor(e){const t=jt($t(e)),r=t.apiKey??null,s=t.oobCode??null,c=Ul(t.mode??null);C(r&&s&&c,"argument-error"),this.apiKey=r,this.operation=c,this.code=s,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){const t=xl(e);try{return new qi(t)}catch{return null}}}/**
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
 */class vt{constructor(){this.providerId=vt.PROVIDER_ID}static credential(e,t){return Jt._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const r=qi.parseLink(t);return C(r,"argument-error"),Jt._fromEmailAndCode(e,r.code,r.tenantId)}}vt.PROVIDER_ID="password";vt.EMAIL_PASSWORD_SIGN_IN_METHOD="password";vt.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
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
 */class Gi{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
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
 */class en extends Gi{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
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
 */class Ue extends en{constructor(){super("facebook.com")}static credential(e){return it._fromParams({providerId:Ue.PROVIDER_ID,signInMethod:Ue.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Ue.credentialFromTaggedObject(e)}static credentialFromError(e){return Ue.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Ue.credential(e.oauthAccessToken)}catch{return null}}}Ue.FACEBOOK_SIGN_IN_METHOD="facebook.com";Ue.PROVIDER_ID="facebook.com";/**
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
 */class xe extends en{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return it._fromParams({providerId:xe.PROVIDER_ID,signInMethod:xe.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return xe.credentialFromTaggedObject(e)}static credentialFromError(e){return xe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:r}=e;if(!t&&!r)return null;try{return xe.credential(t,r)}catch{return null}}}xe.GOOGLE_SIGN_IN_METHOD="google.com";xe.PROVIDER_ID="google.com";/**
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
 */class Fe extends en{constructor(){super("github.com")}static credential(e){return it._fromParams({providerId:Fe.PROVIDER_ID,signInMethod:Fe.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Fe.credentialFromTaggedObject(e)}static credentialFromError(e){return Fe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Fe.credential(e.oauthAccessToken)}catch{return null}}}Fe.GITHUB_SIGN_IN_METHOD="github.com";Fe.PROVIDER_ID="github.com";/**
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
 */class Ve extends en{constructor(){super("twitter.com")}static credential(e,t){return it._fromParams({providerId:Ve.PROVIDER_ID,signInMethod:Ve.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return Ve.credentialFromTaggedObject(e)}static credentialFromError(e){return Ve.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:r}=e;if(!t||!r)return null;try{return Ve.credential(t,r)}catch{return null}}}Ve.TWITTER_SIGN_IN_METHOD="twitter.com";Ve.PROVIDER_ID="twitter.com";/**
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
 */async function Fl(n,e){return Zt(n,"POST","/v1/accounts:signUp",We(n,e))}/**
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
 */class rt{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,r,s=!1){const c=await le._fromIdTokenResponse(e,r,s),h=As(r);return new rt({user:c,providerId:h,_tokenResponse:r,operationType:t})}static async _forOperation(e,t,r){await e._updateTokensIfNecessary(r,!0);const s=As(r);return new rt({user:e,providerId:s,_tokenResponse:r,operationType:t})}}function As(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
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
 */class kn extends ce{constructor(e,t,r,s){super(t.code,t.message),this.operationType=r,this.user=s,Object.setPrototypeOf(this,kn.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,t,r,s){return new kn(e,t,r,s)}}function $o(n,e,t,r){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(c=>{throw c.code==="auth/multi-factor-auth-required"?kn._fromErrorAndOperation(n,c,e,r):c})}async function Vl(n,e,t=!1){const r=await Kt(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return rt._forOperation(n,"link",r)}/**
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
 */async function jl(n,e,t=!1){const{auth:r}=n;if(Y(r.app))return Promise.reject(we(r));const s="reauthenticate";try{const c=await Kt(n,$o(r,s,e,n),t);C(c.idToken,r,"internal-error");const h=Bi(c.idToken);C(h,r,"internal-error");const{sub:u}=h;return C(n.uid===u,r,"user-mismatch"),rt._forOperation(n,s,c)}catch(c){throw c?.code==="auth/user-not-found"&&ae(r,"user-mismatch"),c}}/**
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
 */async function Bo(n,e,t=!1){if(Y(n.app))return Promise.reject(we(n));const r="signIn",s=await $o(n,r,e),c=await rt._fromIdTokenResponse(n,r,s);return t||await n._updateCurrentUser(c.user),c}async function $l(n,e){return Bo(be(n),e)}/**
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
 */async function Ho(n){const e=be(n);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function _p(n,e,t){if(Y(n.app))return Promise.reject(we(n));const r=be(n),h=await Ni(r,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",Fl).catch(_=>{throw _.code==="auth/password-does-not-meet-requirements"&&Ho(n),_}),u=await rt._fromIdTokenResponse(r,"signIn",h);return await r._updateCurrentUser(u.user),u}function wp(n,e,t){return Y(n.app)?Promise.reject(we(n)):$l(J(n),vt.credential(e,t)).catch(async r=>{throw r.code==="auth/password-does-not-meet-requirements"&&Ho(n),r})}function Bl(n,e,t,r){return J(n).onIdTokenChanged(e,t,r)}function Hl(n,e,t){return J(n).beforeAuthStateChanged(e,t)}function Ip(n,e,t,r){return J(n).onAuthStateChanged(e,t,r)}function Ep(n){return J(n).signOut()}const Nn="__sak";/**
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
 */class Wo{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Nn,"1"),this.storage.removeItem(Nn),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
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
 */const Wl=1e3,ql=10;class qo extends Wo{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Uo(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const r=this.storage.getItem(t),s=this.localCache[t];r!==s&&e(t,s,r)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((h,u,_)=>{this.notifyListeners(h,_)});return}const r=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const h=this.storage.getItem(r);!t&&this.localCache[r]===h||this.notifyListeners(r,h)},c=this.storage.getItem(r);dl()&&c!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,ql):s()}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const s of Array.from(r))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:r}),!0)})},Wl)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}qo.type="LOCAL";const Gl=qo;/**
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
 */class Go extends Wo{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Go.type="SESSION";const zo=Go;/**
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
 */function zl(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
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
 */class $n{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const r=new $n(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:r,eventType:s,data:c}=t.data,h=this.handlersMap[s];if(!h?.size)return;t.ports[0].postMessage({status:"ack",eventId:r,eventType:s});const u=Array.from(h).map(async E=>E(t.origin,c)),_=await zl(u);t.ports[0].postMessage({status:"done",eventId:r,eventType:s,response:_})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}$n.receivers=[];/**
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
 */function zi(n="",e=10){let t="";for(let r=0;r<e;r++)t+=Math.floor(Math.random()*10);return n+t}/**
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
 */class Kl{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,r=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let c,h;return new Promise((u,_)=>{const E=zi("",20);s.port1.start();const A=setTimeout(()=>{_(new Error("unsupported_event"))},r);h={messageChannel:s,onMessage(b){const v=b;if(v.data.eventId===E)switch(v.data.status){case"ack":clearTimeout(A),c=setTimeout(()=>{_(new Error("timeout"))},3e3);break;case"done":clearTimeout(c),u(v.data.response);break;default:clearTimeout(A),clearTimeout(c),_(new Error("invalid_response"));break}}},this.handlers.add(h),s.port1.addEventListener("message",h.onMessage),this.target.postMessage({eventType:e,eventId:E,data:t},[s.port2])}).finally(()=>{h&&this.removeMessageHandler(h)})}}/**
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
 */function Ie(){return window}function Jl(n){Ie().location.href=n}/**
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
 */function Ko(){return typeof Ie().WorkerGlobalScope<"u"&&typeof Ie().importScripts=="function"}async function Xl(){if(!navigator?.serviceWorker)return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Yl(){return navigator?.serviceWorker?.controller||null}function Ql(){return Ko()?self:null}/**
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
 */const Jo="firebaseLocalStorageDb",Zl=1,On="firebaseLocalStorage",Xo="fbase_key";class tn{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Bn(n,e){return n.transaction([On],e?"readwrite":"readonly").objectStore(On)}function eu(){const n=indexedDB.deleteDatabase(Jo);return new tn(n).toPromise()}function Oi(){const n=indexedDB.open(Jo,Zl);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const r=n.result;try{r.createObjectStore(On,{keyPath:Xo})}catch(s){t(s)}}),n.addEventListener("success",async()=>{const r=n.result;r.objectStoreNames.contains(On)?e(r):(r.close(),await eu(),e(await Oi()))})})}async function Ss(n,e,t){const r=Bn(n,!0).put({[Xo]:e,value:t});return new tn(r).toPromise()}async function tu(n,e){const t=Bn(n,!1).get(e),r=await new tn(t).toPromise();return r===void 0?null:r.value}function bs(n,e){const t=Bn(n,!0).delete(e);return new tn(t).toPromise()}const nu=800,iu=3;class Yo{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Oi(),this.db)}async _withRetries(e){let t=0;for(;;)try{const r=await this._openDb();return await e(r)}catch(r){if(t++>iu)throw r;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Ko()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=$n._getInstance(Ql()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){if(this.activeServiceWorker=await Xl(),!this.activeServiceWorker)return;this.sender=new Kl(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&e[0]?.fulfilled&&e[0]?.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Yl()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await Oi();return await Ss(e,Nn,"1"),await bs(e,Nn),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(r=>Ss(r,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(r=>tu(r,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>bs(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(s=>{const c=Bn(s,!1).getAll();return new tn(c).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],r=new Set;if(e.length!==0)for(const{fbase_key:s,value:c}of e)r.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(c)&&(this.notifyListeners(s,c),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!r.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const s of Array.from(r))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),nu)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}Yo.type="LOCAL";const ru=Yo;new Qt(3e4,6e4);/**
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
 */function Qo(n,e){return e?ve(e):(C(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
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
 */class Ki extends Wi{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return yt(e,this._buildIdpRequest())}_linkToIdToken(e,t){return yt(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return yt(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function su(n){return Bo(n.auth,new Ki(n),n.bypassAuthState)}function ou(n){const{auth:e,user:t}=n;return C(t,e,"internal-error"),jl(t,new Ki(n),n.bypassAuthState)}async function au(n){const{auth:e,user:t}=n;return C(t,e,"internal-error"),Vl(t,new Ki(n),n.bypassAuthState)}/**
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
 */class Zo{constructor(e,t,r,s,c=!1){this.auth=e,this.resolver=r,this.user=s,this.bypassAuthState=c,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(r){this.reject(r)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:r,postBody:s,tenantId:c,error:h,type:u}=e;if(h){this.reject(h);return}const _={auth:this.auth,requestUri:t,sessionId:r,tenantId:c||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(u)(_))}catch(E){this.reject(E)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return su;case"linkViaPopup":case"linkViaRedirect":return au;case"reauthViaPopup":case"reauthViaRedirect":return ou;default:ae(this.auth,"internal-error")}}resolve(e){Se(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Se(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
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
 */const cu=new Qt(2e3,1e4);class pt extends Zo{constructor(e,t,r,s,c){super(e,t,s,c),this.provider=r,this.authWindow=null,this.pollId=null,pt.currentPopupAction&&pt.currentPopupAction.cancel(),pt.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return C(e,this.auth,"internal-error"),e}async onExecution(){Se(this.filter.length===1,"Popup operations only handle one event");const e=zi();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(_e(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){return this.authWindow?.associatedEvent||null}cancel(){this.reject(_e(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,pt.currentPopupAction=null}pollUserCancellation(){const e=()=>{if(this.authWindow?.window?.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(_e(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,cu.get())};e()}}pt.currentPopupAction=null;/**
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
 */const hu="pendingRedirect",Tn=new Map;class lu extends Zo{constructor(e,t,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,r),this.eventId=null}async execute(){let e=Tn.get(this.auth._key());if(!e){try{const r=await uu(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(t){e=()=>Promise.reject(t)}Tn.set(this.auth._key(),e)}return this.bypassAuthState||Tn.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function uu(n,e){const t=ta(e),r=ea(n);if(!await r._isAvailable())return!1;const s=await r._get(t)==="true";return await r._remove(t),s}async function du(n,e){return ea(n)._set(ta(e),"true")}function fu(n,e){Tn.set(n._key(),e)}function ea(n){return ve(n._redirectPersistence)}function ta(n){return En(hu,n.config.apiKey,n.name)}/**
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
 */function Tp(n,e,t){return pu(n,e,t)}async function pu(n,e,t){if(Y(n.app))return Promise.reject(we(n));const r=be(n);Gh(n,e,Gi),await r._initializationPromise;const s=Qo(r,t);return await du(s,r),s._openRedirect(r,e,"signInViaRedirect")}async function vp(n,e){return await be(n)._initializationPromise,na(n,e,!1)}async function na(n,e,t=!1){if(Y(n.app))return Promise.reject(we(n));const r=be(n),s=Qo(r,e),h=await new lu(r,s,t).execute();return h&&!t&&(delete h.user._redirectEventId,await r._persistUserIfCurrent(h.user),await r._setRedirectUser(null,e)),h}/**
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
 */const gu=600*1e3;class mu{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(t=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!yu(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){if(e.error&&!ia(e)){const r=e.error.code?.split("auth/")[1]||"internal-error";t.onError(_e(this.auth,r))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const r=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=gu&&this.cachedEventUids.clear(),this.cachedEventUids.has(Cs(e))}saveEventToCache(e){this.cachedEventUids.add(Cs(e)),this.lastProcessedEventTime=Date.now()}}function Cs(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function ia({type:n,error:e}){return n==="unknown"&&e?.code==="auth/no-auth-event"}function yu(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return ia(n);default:return!1}}/**
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
 */async function _u(n,e={}){return qe(n,"GET","/v1/projects",e)}/**
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
 */const wu=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Iu=/^https?/;async function Eu(n){if(n.config.emulator)return;const{authorizedDomains:e}=await _u(n);for(const t of e)try{if(Tu(t))return}catch{}ae(n,"unauthorized-domain")}function Tu(n){const e=Pi(),{protocol:t,hostname:r}=new URL(e);if(n.startsWith("chrome-extension://")){const h=new URL(n);return h.hostname===""&&r===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&h.hostname===r}if(!Iu.test(t))return!1;if(wu.test(n))return r===n;const s=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(r)}/**
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
 */const vu=new Qt(3e4,6e4);function Rs(){const n=Ie().___jsl;if(n?.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function Au(n){return new Promise((e,t)=>{function r(){Rs(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Rs(),t(_e(n,"network-request-failed"))},timeout:vu.get()})}if(Ie().gapi?.iframes?.Iframe)e(gapi.iframes.getContext());else if(Ie().gapi?.load)r();else{const s=El("iframefcb");return Ie()[s]=()=>{gapi.load?r():t(_e(n,"network-request-failed"))},Fo(`${Il()}?onload=${s}`).catch(c=>t(c))}}).catch(e=>{throw vn=null,e})}let vn=null;function Su(n){return vn=vn||Au(n),vn}/**
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
 */const bu=new Qt(5e3,15e3),Cu="__/auth/iframe",Ru="emulator/auth/iframe",Pu={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},ku=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Nu(n){const e=n.config;C(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?$i(e,Ru):`https://${n.config.authDomain}/${Cu}`,r={apiKey:e.apiKey,appName:n.name,v:Tt},s=ku.get(n.config.apiHost);s&&(r.eid=s);const c=n._getFrameworks();return c.length&&(r.fw=c.join(",")),`${t}?${Yt(r).slice(1)}`}async function Ou(n){const e=await Su(n),t=Ie().gapi;return C(t,n,"internal-error"),e.open({where:document.body,url:Nu(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Pu,dontclear:!0},r=>new Promise(async(s,c)=>{await r.restyle({setHideOnLeave:!1});const h=_e(n,"network-request-failed"),u=Ie().setTimeout(()=>{c(h)},bu.get());function _(){Ie().clearTimeout(u),s(r)}r.ping(_).then(_,()=>{c(h)})}))}/**
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
 */const Du={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Lu=500,Mu=600,Uu="_blank",xu="http://localhost";class Ps{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Fu(n,e,t,r=Lu,s=Mu){const c=Math.max((window.screen.availHeight-s)/2,0).toString(),h=Math.max((window.screen.availWidth-r)/2,0).toString();let u="";const _={...Du,width:r.toString(),height:s.toString(),top:c,left:h},E=K().toLowerCase();t&&(u=No(E)?Uu:t),Po(E)&&(e=e||xu,_.scrollbars="yes");const A=Object.entries(_).reduce((v,[O,D])=>`${v}${O}=${D},`,"");if(ul(E)&&u!=="_self")return Vu(e||"",u),new Ps(null);const b=window.open(e||"",u,A);C(b,n,"popup-blocked");try{b.focus()}catch{}return new Ps(b)}function Vu(n,e){const t=document.createElement("a");t.href=n,t.target=e;const r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(r)}/**
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
 */const ju="__/auth/handler",$u="emulator/auth/handler",Bu=encodeURIComponent("fac");async function ks(n,e,t,r,s,c){C(n.config.authDomain,n,"auth-domain-config-required"),C(n.config.apiKey,n,"invalid-api-key");const h={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:r,v:Tt,eventId:s};if(e instanceof Gi){e.setDefaultLanguage(n.languageCode),h.providerId=e.providerId||"",Uc(e.getCustomParameters())||(h.customParameters=JSON.stringify(e.getCustomParameters()));for(const[A,b]of Object.entries({}))h[A]=b}if(e instanceof en){const A=e.getScopes().filter(b=>b!=="");A.length>0&&(h.scopes=A.join(","))}n.tenantId&&(h.tid=n.tenantId);const u=h;for(const A of Object.keys(u))u[A]===void 0&&delete u[A];const _=await n._getAppCheckToken(),E=_?`#${Bu}=${encodeURIComponent(_)}`:"";return`${Hu(n)}?${Yt(u).slice(1)}${E}`}function Hu({config:n}){return n.emulator?$i(n,$u):`https://${n.authDomain}/${ju}`}/**
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
 */const Ii="webStorageSupport";class Wu{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=zo,this._completeRedirectFn=na,this._overrideRedirectResult=fu}async _openPopup(e,t,r,s){Se(this.eventManagers[e._key()]?.manager,"_initialize() not called before _openPopup()");const c=await ks(e,t,r,Pi(),s);return Fu(e,c,zi())}async _openRedirect(e,t,r,s){await this._originValidation(e);const c=await ks(e,t,r,Pi(),s);return Jl(c),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:c}=this.eventManagers[t];return s?Promise.resolve(s):(Se(c,"If manager is not set, promise should be"),c)}const r=this.initAndGetManager(e);return this.eventManagers[t]={promise:r},r.catch(()=>{delete this.eventManagers[t]}),r}async initAndGetManager(e){const t=await Ou(e),r=new mu(e);return t.register("authEvent",s=>(C(s?.authEvent,e,"invalid-auth-event"),{status:r.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=t,r}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Ii,{type:Ii},s=>{const c=s?.[0]?.[Ii];c!==void 0&&t(!!c),ae(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Eu(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Uo()||ko()||Hi()}}const qu=Wu;var Ns="@firebase/auth",Os="1.11.1";/**
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
 */class Gu{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){return this.assertAuthConfigured(),this.auth.currentUser?.uid||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e(r?.stsTokenManager.accessToken||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){C(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function zu(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function Ku(n){de(new oe("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),c=e.getProvider("app-check-internal"),{apiKey:h,authDomain:u}=r.options;C(h&&!h.includes(":"),"invalid-api-key",{appName:r.name});const _={apiKey:h,authDomain:u,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:xo(n)},E=new yl(r,s,c,_);return Cl(E,t),E},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),de(new oe("auth-internal",e=>{const t=be(e.getProvider("auth").getImmediate());return(r=>new Gu(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Z(Ns,Os,zu(n)),Z(Ns,Os,"esm2020")}/**
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
 */const Ju=300,Xu=mo("authIdTokenMaxAge")||Ju;let Ds=null;const Yu=n=>async e=>{const t=e&&await e.getIdTokenResult(),r=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(r&&r>Xu)return;const s=t?.token;Ds!==s&&(Ds=s,await fetch(n,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function Ap(n=Vn()){const e=He(n,"auth");if(e.isInitialized())return e.getImmediate();const t=bl(n,{popupRedirectResolver:qu,persistence:[ru,Gl,zo]}),r=mo("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){const c=new URL(r,location.origin);if(location.origin===c.origin){const h=Yu(c.toString());Hl(t,h,()=>h(t.currentUser)),Bl(t,u=>h(u))}}const s=fo("auth");return s&&Rl(t,`http://${s}`),t}function Qu(){return document.getElementsByTagName("head")?.[0]??document}_l({loadJS(n){return new Promise((e,t)=>{const r=document.createElement("script");r.setAttribute("src",n),r.onload=e,r.onerror=s=>{const c=_e("internal-error");c.customData=s,t(c)},r.type="text/javascript",r.charset="UTF-8",Qu().appendChild(r)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});Ku("Browser");var Ls=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ji;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(m,d){function p(){}p.prototype=d.prototype,m.F=d.prototype,m.prototype=new p,m.prototype.constructor=m,m.D=function(y,g,I){for(var f=Array(arguments.length-2),X=2;X<arguments.length;X++)f[X-2]=arguments[X];return d.prototype[g].apply(y,f)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,t),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(m,d,p){p||(p=0);const y=Array(16);if(typeof d=="string")for(var g=0;g<16;++g)y[g]=d.charCodeAt(p++)|d.charCodeAt(p++)<<8|d.charCodeAt(p++)<<16|d.charCodeAt(p++)<<24;else for(g=0;g<16;++g)y[g]=d[p++]|d[p++]<<8|d[p++]<<16|d[p++]<<24;d=m.g[0],p=m.g[1],g=m.g[2];let I=m.g[3],f;f=d+(I^p&(g^I))+y[0]+3614090360&4294967295,d=p+(f<<7&4294967295|f>>>25),f=I+(g^d&(p^g))+y[1]+3905402710&4294967295,I=d+(f<<12&4294967295|f>>>20),f=g+(p^I&(d^p))+y[2]+606105819&4294967295,g=I+(f<<17&4294967295|f>>>15),f=p+(d^g&(I^d))+y[3]+3250441966&4294967295,p=g+(f<<22&4294967295|f>>>10),f=d+(I^p&(g^I))+y[4]+4118548399&4294967295,d=p+(f<<7&4294967295|f>>>25),f=I+(g^d&(p^g))+y[5]+1200080426&4294967295,I=d+(f<<12&4294967295|f>>>20),f=g+(p^I&(d^p))+y[6]+2821735955&4294967295,g=I+(f<<17&4294967295|f>>>15),f=p+(d^g&(I^d))+y[7]+4249261313&4294967295,p=g+(f<<22&4294967295|f>>>10),f=d+(I^p&(g^I))+y[8]+1770035416&4294967295,d=p+(f<<7&4294967295|f>>>25),f=I+(g^d&(p^g))+y[9]+2336552879&4294967295,I=d+(f<<12&4294967295|f>>>20),f=g+(p^I&(d^p))+y[10]+4294925233&4294967295,g=I+(f<<17&4294967295|f>>>15),f=p+(d^g&(I^d))+y[11]+2304563134&4294967295,p=g+(f<<22&4294967295|f>>>10),f=d+(I^p&(g^I))+y[12]+1804603682&4294967295,d=p+(f<<7&4294967295|f>>>25),f=I+(g^d&(p^g))+y[13]+4254626195&4294967295,I=d+(f<<12&4294967295|f>>>20),f=g+(p^I&(d^p))+y[14]+2792965006&4294967295,g=I+(f<<17&4294967295|f>>>15),f=p+(d^g&(I^d))+y[15]+1236535329&4294967295,p=g+(f<<22&4294967295|f>>>10),f=d+(g^I&(p^g))+y[1]+4129170786&4294967295,d=p+(f<<5&4294967295|f>>>27),f=I+(p^g&(d^p))+y[6]+3225465664&4294967295,I=d+(f<<9&4294967295|f>>>23),f=g+(d^p&(I^d))+y[11]+643717713&4294967295,g=I+(f<<14&4294967295|f>>>18),f=p+(I^d&(g^I))+y[0]+3921069994&4294967295,p=g+(f<<20&4294967295|f>>>12),f=d+(g^I&(p^g))+y[5]+3593408605&4294967295,d=p+(f<<5&4294967295|f>>>27),f=I+(p^g&(d^p))+y[10]+38016083&4294967295,I=d+(f<<9&4294967295|f>>>23),f=g+(d^p&(I^d))+y[15]+3634488961&4294967295,g=I+(f<<14&4294967295|f>>>18),f=p+(I^d&(g^I))+y[4]+3889429448&4294967295,p=g+(f<<20&4294967295|f>>>12),f=d+(g^I&(p^g))+y[9]+568446438&4294967295,d=p+(f<<5&4294967295|f>>>27),f=I+(p^g&(d^p))+y[14]+3275163606&4294967295,I=d+(f<<9&4294967295|f>>>23),f=g+(d^p&(I^d))+y[3]+4107603335&4294967295,g=I+(f<<14&4294967295|f>>>18),f=p+(I^d&(g^I))+y[8]+1163531501&4294967295,p=g+(f<<20&4294967295|f>>>12),f=d+(g^I&(p^g))+y[13]+2850285829&4294967295,d=p+(f<<5&4294967295|f>>>27),f=I+(p^g&(d^p))+y[2]+4243563512&4294967295,I=d+(f<<9&4294967295|f>>>23),f=g+(d^p&(I^d))+y[7]+1735328473&4294967295,g=I+(f<<14&4294967295|f>>>18),f=p+(I^d&(g^I))+y[12]+2368359562&4294967295,p=g+(f<<20&4294967295|f>>>12),f=d+(p^g^I)+y[5]+4294588738&4294967295,d=p+(f<<4&4294967295|f>>>28),f=I+(d^p^g)+y[8]+2272392833&4294967295,I=d+(f<<11&4294967295|f>>>21),f=g+(I^d^p)+y[11]+1839030562&4294967295,g=I+(f<<16&4294967295|f>>>16),f=p+(g^I^d)+y[14]+4259657740&4294967295,p=g+(f<<23&4294967295|f>>>9),f=d+(p^g^I)+y[1]+2763975236&4294967295,d=p+(f<<4&4294967295|f>>>28),f=I+(d^p^g)+y[4]+1272893353&4294967295,I=d+(f<<11&4294967295|f>>>21),f=g+(I^d^p)+y[7]+4139469664&4294967295,g=I+(f<<16&4294967295|f>>>16),f=p+(g^I^d)+y[10]+3200236656&4294967295,p=g+(f<<23&4294967295|f>>>9),f=d+(p^g^I)+y[13]+681279174&4294967295,d=p+(f<<4&4294967295|f>>>28),f=I+(d^p^g)+y[0]+3936430074&4294967295,I=d+(f<<11&4294967295|f>>>21),f=g+(I^d^p)+y[3]+3572445317&4294967295,g=I+(f<<16&4294967295|f>>>16),f=p+(g^I^d)+y[6]+76029189&4294967295,p=g+(f<<23&4294967295|f>>>9),f=d+(p^g^I)+y[9]+3654602809&4294967295,d=p+(f<<4&4294967295|f>>>28),f=I+(d^p^g)+y[12]+3873151461&4294967295,I=d+(f<<11&4294967295|f>>>21),f=g+(I^d^p)+y[15]+530742520&4294967295,g=I+(f<<16&4294967295|f>>>16),f=p+(g^I^d)+y[2]+3299628645&4294967295,p=g+(f<<23&4294967295|f>>>9),f=d+(g^(p|~I))+y[0]+4096336452&4294967295,d=p+(f<<6&4294967295|f>>>26),f=I+(p^(d|~g))+y[7]+1126891415&4294967295,I=d+(f<<10&4294967295|f>>>22),f=g+(d^(I|~p))+y[14]+2878612391&4294967295,g=I+(f<<15&4294967295|f>>>17),f=p+(I^(g|~d))+y[5]+4237533241&4294967295,p=g+(f<<21&4294967295|f>>>11),f=d+(g^(p|~I))+y[12]+1700485571&4294967295,d=p+(f<<6&4294967295|f>>>26),f=I+(p^(d|~g))+y[3]+2399980690&4294967295,I=d+(f<<10&4294967295|f>>>22),f=g+(d^(I|~p))+y[10]+4293915773&4294967295,g=I+(f<<15&4294967295|f>>>17),f=p+(I^(g|~d))+y[1]+2240044497&4294967295,p=g+(f<<21&4294967295|f>>>11),f=d+(g^(p|~I))+y[8]+1873313359&4294967295,d=p+(f<<6&4294967295|f>>>26),f=I+(p^(d|~g))+y[15]+4264355552&4294967295,I=d+(f<<10&4294967295|f>>>22),f=g+(d^(I|~p))+y[6]+2734768916&4294967295,g=I+(f<<15&4294967295|f>>>17),f=p+(I^(g|~d))+y[13]+1309151649&4294967295,p=g+(f<<21&4294967295|f>>>11),f=d+(g^(p|~I))+y[4]+4149444226&4294967295,d=p+(f<<6&4294967295|f>>>26),f=I+(p^(d|~g))+y[11]+3174756917&4294967295,I=d+(f<<10&4294967295|f>>>22),f=g+(d^(I|~p))+y[2]+718787259&4294967295,g=I+(f<<15&4294967295|f>>>17),f=p+(I^(g|~d))+y[9]+3951481745&4294967295,m.g[0]=m.g[0]+d&4294967295,m.g[1]=m.g[1]+(g+(f<<21&4294967295|f>>>11))&4294967295,m.g[2]=m.g[2]+g&4294967295,m.g[3]=m.g[3]+I&4294967295}r.prototype.v=function(m,d){d===void 0&&(d=m.length);const p=d-this.blockSize,y=this.C;let g=this.h,I=0;for(;I<d;){if(g==0)for(;I<=p;)s(this,m,I),I+=this.blockSize;if(typeof m=="string"){for(;I<d;)if(y[g++]=m.charCodeAt(I++),g==this.blockSize){s(this,y),g=0;break}}else for(;I<d;)if(y[g++]=m[I++],g==this.blockSize){s(this,y),g=0;break}}this.h=g,this.o+=d},r.prototype.A=function(){var m=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);m[0]=128;for(var d=1;d<m.length-8;++d)m[d]=0;d=this.o*8;for(var p=m.length-8;p<m.length;++p)m[p]=d&255,d/=256;for(this.v(m),m=Array(16),d=0,p=0;p<4;++p)for(let y=0;y<32;y+=8)m[d++]=this.g[p]>>>y&255;return m};function c(m,d){var p=u;return Object.prototype.hasOwnProperty.call(p,m)?p[m]:p[m]=d(m)}function h(m,d){this.h=d;const p=[];let y=!0;for(let g=m.length-1;g>=0;g--){const I=m[g]|0;y&&I==d||(p[g]=I,y=!1)}this.g=p}var u={};function _(m){return-128<=m&&m<128?c(m,function(d){return new h([d|0],d<0?-1:0)}):new h([m|0],m<0?-1:0)}function E(m){if(isNaN(m)||!isFinite(m))return b;if(m<0)return x(E(-m));const d=[];let p=1;for(let y=0;m>=p;y++)d[y]=m/p|0,p*=4294967296;return new h(d,0)}function A(m,d){if(m.length==0)throw Error("number format error: empty string");if(d=d||10,d<2||36<d)throw Error("radix out of range: "+d);if(m.charAt(0)=="-")return x(A(m.substring(1),d));if(m.indexOf("-")>=0)throw Error('number format error: interior "-" character');const p=E(Math.pow(d,8));let y=b;for(let I=0;I<m.length;I+=8){var g=Math.min(8,m.length-I);const f=parseInt(m.substring(I,I+g),d);g<8?(g=E(Math.pow(d,g)),y=y.j(g).add(E(f))):(y=y.j(p),y=y.add(E(f)))}return y}var b=_(0),v=_(1),O=_(16777216);n=h.prototype,n.m=function(){if(V(this))return-x(this).m();let m=0,d=1;for(let p=0;p<this.g.length;p++){const y=this.i(p);m+=(y>=0?y:4294967296+y)*d,d*=4294967296}return m},n.toString=function(m){if(m=m||10,m<2||36<m)throw Error("radix out of range: "+m);if(D(this))return"0";if(V(this))return"-"+x(this).toString(m);const d=E(Math.pow(m,6));var p=this;let y="";for(;;){const g=Ce(p,d).g;p=ee(p,g.j(d));let I=((p.g.length>0?p.g[0]:p.h)>>>0).toString(m);if(p=g,D(p))return I+y;for(;I.length<6;)I="0"+I;y=I+y}},n.i=function(m){return m<0?0:m<this.g.length?this.g[m]:this.h};function D(m){if(m.h!=0)return!1;for(let d=0;d<m.g.length;d++)if(m.g[d]!=0)return!1;return!0}function V(m){return m.h==-1}n.l=function(m){return m=ee(this,m),V(m)?-1:D(m)?0:1};function x(m){const d=m.g.length,p=[];for(let y=0;y<d;y++)p[y]=~m.g[y];return new h(p,~m.h).add(v)}n.abs=function(){return V(this)?x(this):this},n.add=function(m){const d=Math.max(this.g.length,m.g.length),p=[];let y=0;for(let g=0;g<=d;g++){let I=y+(this.i(g)&65535)+(m.i(g)&65535),f=(I>>>16)+(this.i(g)>>>16)+(m.i(g)>>>16);y=f>>>16,I&=65535,f&=65535,p[g]=f<<16|I}return new h(p,p[p.length-1]&-2147483648?-1:0)};function ee(m,d){return m.add(x(d))}n.j=function(m){if(D(this)||D(m))return b;if(V(this))return V(m)?x(this).j(x(m)):x(x(this).j(m));if(V(m))return x(this.j(x(m)));if(this.l(O)<0&&m.l(O)<0)return E(this.m()*m.m());const d=this.g.length+m.g.length,p=[];for(var y=0;y<2*d;y++)p[y]=0;for(y=0;y<this.g.length;y++)for(let g=0;g<m.g.length;g++){const I=this.i(y)>>>16,f=this.i(y)&65535,X=m.i(g)>>>16,Ge=m.i(g)&65535;p[2*y+2*g]+=f*Ge,te(p,2*y+2*g),p[2*y+2*g+1]+=I*Ge,te(p,2*y+2*g+1),p[2*y+2*g+1]+=f*X,te(p,2*y+2*g+1),p[2*y+2*g+2]+=I*X,te(p,2*y+2*g+2)}for(m=0;m<d;m++)p[m]=p[2*m+1]<<16|p[2*m];for(m=d;m<2*d;m++)p[m]=0;return new h(p,0)};function te(m,d){for(;(m[d]&65535)!=m[d];)m[d+1]+=m[d]>>>16,m[d]&=65535,d++}function ie(m,d){this.g=m,this.h=d}function Ce(m,d){if(D(d))throw Error("division by zero");if(D(m))return new ie(b,b);if(V(m))return d=Ce(x(m),d),new ie(x(d.g),x(d.h));if(V(d))return d=Ce(m,x(d)),new ie(x(d.g),d.h);if(m.g.length>30){if(V(m)||V(d))throw Error("slowDivide_ only works with positive integers.");for(var p=v,y=d;y.l(m)<=0;)p=Re(p),y=Re(y);var g=re(p,1),I=re(y,1);for(y=re(y,2),p=re(p,2);!D(y);){var f=I.add(y);f.l(m)<=0&&(g=g.add(p),I=f),y=re(y,1),p=re(p,1)}return d=ee(m,g.j(d)),new ie(g,d)}for(g=b;m.l(d)>=0;){for(p=Math.max(1,Math.floor(m.m()/d.m())),y=Math.ceil(Math.log(p)/Math.LN2),y=y<=48?1:Math.pow(2,y-48),I=E(p),f=I.j(d);V(f)||f.l(m)>0;)p-=y,I=E(p),f=I.j(d);D(I)&&(I=v),g=g.add(I),m=ee(m,f)}return new ie(g,m)}n.B=function(m){return Ce(this,m).h},n.and=function(m){const d=Math.max(this.g.length,m.g.length),p=[];for(let y=0;y<d;y++)p[y]=this.i(y)&m.i(y);return new h(p,this.h&m.h)},n.or=function(m){const d=Math.max(this.g.length,m.g.length),p=[];for(let y=0;y<d;y++)p[y]=this.i(y)|m.i(y);return new h(p,this.h|m.h)},n.xor=function(m){const d=Math.max(this.g.length,m.g.length),p=[];for(let y=0;y<d;y++)p[y]=this.i(y)^m.i(y);return new h(p,this.h^m.h)};function Re(m){const d=m.g.length+1,p=[];for(let y=0;y<d;y++)p[y]=m.i(y)<<1|m.i(y-1)>>>31;return new h(p,m.h)}function re(m,d){const p=d>>5;d%=32;const y=m.g.length-p,g=[];for(let I=0;I<y;I++)g[I]=d>0?m.i(I+p)>>>d|m.i(I+p+1)<<32-d:m.i(I+p);return new h(g,m.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,h.prototype.add=h.prototype.add,h.prototype.multiply=h.prototype.j,h.prototype.modulo=h.prototype.B,h.prototype.compare=h.prototype.l,h.prototype.toNumber=h.prototype.m,h.prototype.toString=h.prototype.toString,h.prototype.getBits=h.prototype.i,h.fromNumber=E,h.fromString=A,Ji=h}).apply(typeof Ls<"u"?Ls:typeof self<"u"?self:typeof window<"u"?window:{});var _n=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};(function(){var n,e=Object.defineProperty;function t(i){i=[typeof globalThis=="object"&&globalThis,i,typeof window=="object"&&window,typeof self=="object"&&self,typeof _n=="object"&&_n];for(var o=0;o<i.length;++o){var a=i[o];if(a&&a.Math==Math)return a}throw Error("Cannot find global object")}var r=t(this);function s(i,o){if(o)e:{var a=r;i=i.split(".");for(var l=0;l<i.length-1;l++){var w=i[l];if(!(w in a))break e;a=a[w]}i=i[i.length-1],l=a[i],o=o(l),o!=l&&o!=null&&e(a,i,{configurable:!0,writable:!0,value:o})}}s("Symbol.dispose",function(i){return i||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(i){return i||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(i){return i||function(o){var a=[],l;for(l in o)Object.prototype.hasOwnProperty.call(o,l)&&a.push([l,o[l]]);return a}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var c=c||{},h=this||self;function u(i){var o=typeof i;return o=="object"&&i!=null||o=="function"}function _(i,o,a){return i.call.apply(i.bind,arguments)}function E(i,o,a){return E=_,E.apply(null,arguments)}function A(i,o){var a=Array.prototype.slice.call(arguments,1);return function(){var l=a.slice();return l.push.apply(l,arguments),i.apply(this,l)}}function b(i,o){function a(){}a.prototype=o.prototype,i.Z=o.prototype,i.prototype=new a,i.prototype.constructor=i,i.Ob=function(l,w,T){for(var S=Array(arguments.length-2),R=2;R<arguments.length;R++)S[R-2]=arguments[R];return o.prototype[w].apply(l,S)}}var v=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?i=>i&&AsyncContext.Snapshot.wrap(i):i=>i;function O(i){const o=i.length;if(o>0){const a=Array(o);for(let l=0;l<o;l++)a[l]=i[l];return a}return[]}function D(i,o){for(let l=1;l<arguments.length;l++){const w=arguments[l];var a=typeof w;if(a=a!="object"?a:w?Array.isArray(w)?"array":a:"null",a=="array"||a=="object"&&typeof w.length=="number"){a=i.length||0;const T=w.length||0;i.length=a+T;for(let S=0;S<T;S++)i[a+S]=w[S]}else i.push(w)}}class V{constructor(o,a){this.i=o,this.j=a,this.h=0,this.g=null}get(){let o;return this.h>0?(this.h--,o=this.g,this.g=o.next,o.next=null):o=this.i(),o}}function x(i){h.setTimeout(()=>{throw i},0)}function ee(){var i=m;let o=null;return i.g&&(o=i.g,i.g=i.g.next,i.g||(i.h=null),o.next=null),o}class te{constructor(){this.h=this.g=null}add(o,a){const l=ie.get();l.set(o,a),this.h?this.h.next=l:this.g=l,this.h=l}}var ie=new V(()=>new Ce,i=>i.reset());class Ce{constructor(){this.next=this.g=this.h=null}set(o,a){this.h=o,this.g=a,this.next=null}reset(){this.next=this.g=this.h=null}}let Re,re=!1,m=new te,d=()=>{const i=Promise.resolve(void 0);Re=()=>{i.then(p)}};function p(){for(var i;i=ee();){try{i.h.call(i.g)}catch(a){x(a)}var o=ie;o.j(i),o.h<100&&(o.h++,i.next=o.g,o.g=i)}re=!1}function y(){this.u=this.u,this.C=this.C}y.prototype.u=!1,y.prototype.dispose=function(){this.u||(this.u=!0,this.N())},y.prototype[Symbol.dispose]=function(){this.dispose()},y.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function g(i,o){this.type=i,this.g=this.target=o,this.defaultPrevented=!1}g.prototype.h=function(){this.defaultPrevented=!0};var I=(function(){if(!h.addEventListener||!Object.defineProperty)return!1;var i=!1,o=Object.defineProperty({},"passive",{get:function(){i=!0}});try{const a=()=>{};h.addEventListener("test",a,o),h.removeEventListener("test",a,o)}catch{}return i})();function f(i){return/^[\s\xa0]*$/.test(i)}function X(i,o){g.call(this,i?i.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,i&&this.init(i,o)}b(X,g),X.prototype.init=function(i,o){const a=this.type=i.type,l=i.changedTouches&&i.changedTouches.length?i.changedTouches[0]:null;this.target=i.target||i.srcElement,this.g=o,o=i.relatedTarget,o||(a=="mouseover"?o=i.fromElement:a=="mouseout"&&(o=i.toElement)),this.relatedTarget=o,l?(this.clientX=l.clientX!==void 0?l.clientX:l.pageX,this.clientY=l.clientY!==void 0?l.clientY:l.pageY,this.screenX=l.screenX||0,this.screenY=l.screenY||0):(this.clientX=i.clientX!==void 0?i.clientX:i.pageX,this.clientY=i.clientY!==void 0?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0),this.button=i.button,this.key=i.key||"",this.ctrlKey=i.ctrlKey,this.altKey=i.altKey,this.shiftKey=i.shiftKey,this.metaKey=i.metaKey,this.pointerId=i.pointerId||0,this.pointerType=i.pointerType,this.state=i.state,this.i=i,i.defaultPrevented&&X.Z.h.call(this)},X.prototype.h=function(){X.Z.h.call(this);const i=this.i;i.preventDefault?i.preventDefault():i.returnValue=!1};var Ge="closure_listenable_"+(Math.random()*1e6|0),Ua=0;function xa(i,o,a,l,w){this.listener=i,this.proxy=null,this.src=o,this.type=a,this.capture=!!l,this.ha=w,this.key=++Ua,this.da=this.fa=!1}function sn(i){i.da=!0,i.listener=null,i.proxy=null,i.src=null,i.ha=null}function on(i,o,a){for(const l in i)o.call(a,i[l],l,i)}function Fa(i,o){for(const a in i)o.call(void 0,i[a],a,i)}function ar(i){const o={};for(const a in i)o[a]=i[a];return o}const cr="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function hr(i,o){let a,l;for(let w=1;w<arguments.length;w++){l=arguments[w];for(a in l)i[a]=l[a];for(let T=0;T<cr.length;T++)a=cr[T],Object.prototype.hasOwnProperty.call(l,a)&&(i[a]=l[a])}}function an(i){this.src=i,this.g={},this.h=0}an.prototype.add=function(i,o,a,l,w){const T=i.toString();i=this.g[T],i||(i=this.g[T]=[],this.h++);const S=Gn(i,o,l,w);return S>-1?(o=i[S],a||(o.fa=!1)):(o=new xa(o,this.src,T,!!l,w),o.fa=a,i.push(o)),o};function qn(i,o){const a=o.type;if(a in i.g){var l=i.g[a],w=Array.prototype.indexOf.call(l,o,void 0),T;(T=w>=0)&&Array.prototype.splice.call(l,w,1),T&&(sn(o),i.g[a].length==0&&(delete i.g[a],i.h--))}}function Gn(i,o,a,l){for(let w=0;w<i.length;++w){const T=i[w];if(!T.da&&T.listener==o&&T.capture==!!a&&T.ha==l)return w}return-1}var zn="closure_lm_"+(Math.random()*1e6|0),Kn={};function lr(i,o,a,l,w){if(Array.isArray(o)){for(let T=0;T<o.length;T++)lr(i,o[T],a,l,w);return null}return a=fr(a),i&&i[Ge]?i.J(o,a,u(l)?!!l.capture:!1,w):Va(i,o,a,!1,l,w)}function Va(i,o,a,l,w,T){if(!o)throw Error("Invalid event type");const S=u(w)?!!w.capture:!!w;let R=Xn(i);if(R||(i[zn]=R=new an(i)),a=R.add(o,a,l,S,T),a.proxy)return a;if(l=ja(),a.proxy=l,l.src=i,l.listener=a,i.addEventListener)I||(w=S),w===void 0&&(w=!1),i.addEventListener(o.toString(),l,w);else if(i.attachEvent)i.attachEvent(dr(o.toString()),l);else if(i.addListener&&i.removeListener)i.addListener(l);else throw Error("addEventListener and attachEvent are unavailable.");return a}function ja(){function i(a){return o.call(i.src,i.listener,a)}const o=$a;return i}function ur(i,o,a,l,w){if(Array.isArray(o))for(var T=0;T<o.length;T++)ur(i,o[T],a,l,w);else l=u(l)?!!l.capture:!!l,a=fr(a),i&&i[Ge]?(i=i.i,T=String(o).toString(),T in i.g&&(o=i.g[T],a=Gn(o,a,l,w),a>-1&&(sn(o[a]),Array.prototype.splice.call(o,a,1),o.length==0&&(delete i.g[T],i.h--)))):i&&(i=Xn(i))&&(o=i.g[o.toString()],i=-1,o&&(i=Gn(o,a,l,w)),(a=i>-1?o[i]:null)&&Jn(a))}function Jn(i){if(typeof i!="number"&&i&&!i.da){var o=i.src;if(o&&o[Ge])qn(o.i,i);else{var a=i.type,l=i.proxy;o.removeEventListener?o.removeEventListener(a,l,i.capture):o.detachEvent?o.detachEvent(dr(a),l):o.addListener&&o.removeListener&&o.removeListener(l),(a=Xn(o))?(qn(a,i),a.h==0&&(a.src=null,o[zn]=null)):sn(i)}}}function dr(i){return i in Kn?Kn[i]:Kn[i]="on"+i}function $a(i,o){if(i.da)i=!0;else{o=new X(o,this);const a=i.listener,l=i.ha||i.src;i.fa&&Jn(i),i=a.call(l,o)}return i}function Xn(i){return i=i[zn],i instanceof an?i:null}var Yn="__closure_events_fn_"+(Math.random()*1e9>>>0);function fr(i){return typeof i=="function"?i:(i[Yn]||(i[Yn]=function(o){return i.handleEvent(o)}),i[Yn])}function H(){y.call(this),this.i=new an(this),this.M=this,this.G=null}b(H,y),H.prototype[Ge]=!0,H.prototype.removeEventListener=function(i,o,a,l){ur(this,i,o,a,l)};function W(i,o){var a,l=i.G;if(l)for(a=[];l;l=l.G)a.push(l);if(i=i.M,l=o.type||o,typeof o=="string")o=new g(o,i);else if(o instanceof g)o.target=o.target||i;else{var w=o;o=new g(l,i),hr(o,w)}w=!0;let T,S;if(a)for(S=a.length-1;S>=0;S--)T=o.g=a[S],w=cn(T,l,!0,o)&&w;if(T=o.g=i,w=cn(T,l,!0,o)&&w,w=cn(T,l,!1,o)&&w,a)for(S=0;S<a.length;S++)T=o.g=a[S],w=cn(T,l,!1,o)&&w}H.prototype.N=function(){if(H.Z.N.call(this),this.i){var i=this.i;for(const o in i.g){const a=i.g[o];for(let l=0;l<a.length;l++)sn(a[l]);delete i.g[o],i.h--}}this.G=null},H.prototype.J=function(i,o,a,l){return this.i.add(String(i),o,!1,a,l)},H.prototype.K=function(i,o,a,l){return this.i.add(String(i),o,!0,a,l)};function cn(i,o,a,l){if(o=i.i.g[String(o)],!o)return!0;o=o.concat();let w=!0;for(let T=0;T<o.length;++T){const S=o[T];if(S&&!S.da&&S.capture==a){const R=S.listener,$=S.ha||S.src;S.fa&&qn(i.i,S),w=R.call($,l)!==!1&&w}}return w&&!l.defaultPrevented}function Ba(i,o){if(typeof i!="function")if(i&&typeof i.handleEvent=="function")i=E(i.handleEvent,i);else throw Error("Invalid listener argument");return Number(o)>2147483647?-1:h.setTimeout(i,o||0)}function pr(i){i.g=Ba(()=>{i.g=null,i.i&&(i.i=!1,pr(i))},i.l);const o=i.h;i.h=null,i.m.apply(null,o)}class Ha extends y{constructor(o,a){super(),this.m=o,this.l=a,this.h=null,this.i=!1,this.g=null}j(o){this.h=arguments,this.g?this.i=!0:pr(this)}N(){super.N(),this.g&&(h.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function At(i){y.call(this),this.h=i,this.g={}}b(At,y);var gr=[];function mr(i){on(i.g,function(o,a){this.g.hasOwnProperty(a)&&Jn(o)},i),i.g={}}At.prototype.N=function(){At.Z.N.call(this),mr(this)},At.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Qn=h.JSON.stringify,Wa=h.JSON.parse,qa=class{stringify(i){return h.JSON.stringify(i,void 0)}parse(i){return h.JSON.parse(i,void 0)}};function yr(){}function Ga(){}var St={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Zn(){g.call(this,"d")}b(Zn,g);function ei(){g.call(this,"c")}b(ei,g);var lt={},_r=null;function ti(){return _r=_r||new H}lt.Ia="serverreachability";function wr(i){g.call(this,lt.Ia,i)}b(wr,g);function bt(i){const o=ti();W(o,new wr(o))}lt.STAT_EVENT="statevent";function Ir(i,o){g.call(this,lt.STAT_EVENT,i),this.stat=o}b(Ir,g);function q(i){const o=ti();W(o,new Ir(o,i))}lt.Ja="timingevent";function Er(i,o){g.call(this,lt.Ja,i),this.size=o}b(Er,g);function Ct(i,o){if(typeof i!="function")throw Error("Fn must not be null and must be a function");return h.setTimeout(function(){i()},o)}function Rt(){this.g=!0}Rt.prototype.ua=function(){this.g=!1};function za(i,o,a,l,w,T){i.info(function(){if(i.g)if(T){var S="",R=T.split("&");for(let M=0;M<R.length;M++){var $=R[M].split("=");if($.length>1){const B=$[0];$=$[1];const pe=B.split("_");S=pe.length>=2&&pe[1]=="type"?S+(B+"="+$+"&"):S+(B+"=redacted&")}}}else S=null;else S=T;return"XMLHTTP REQ ("+l+") [attempt "+w+"]: "+o+`
`+a+`
`+S})}function Ka(i,o,a,l,w,T,S){i.info(function(){return"XMLHTTP RESP ("+l+") [ attempt "+w+"]: "+o+`
`+a+`
`+T+" "+S})}function ut(i,o,a,l){i.info(function(){return"XMLHTTP TEXT ("+o+"): "+Xa(i,a)+(l?" "+l:"")})}function Ja(i,o){i.info(function(){return"TIMEOUT: "+o})}Rt.prototype.info=function(){};function Xa(i,o){if(!i.g)return o;if(!o)return null;try{const T=JSON.parse(o);if(T){for(i=0;i<T.length;i++)if(Array.isArray(T[i])){var a=T[i];if(!(a.length<2)){var l=a[1];if(Array.isArray(l)&&!(l.length<1)){var w=l[0];if(w!="noop"&&w!="stop"&&w!="close")for(let S=1;S<l.length;S++)l[S]=""}}}}return Qn(T)}catch{return o}}var ni={NO_ERROR:0,TIMEOUT:8},Ya={},Tr;function ii(){}b(ii,yr),ii.prototype.g=function(){return new XMLHttpRequest},Tr=new ii;function Pt(i){return encodeURIComponent(String(i))}function Qa(i){var o=1;i=i.split(":");const a=[];for(;o>0&&i.length;)a.push(i.shift()),o--;return i.length&&a.push(i.join(":")),a}function Pe(i,o,a,l){this.j=i,this.i=o,this.l=a,this.S=l||1,this.V=new At(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new vr}function vr(){this.i=null,this.g="",this.h=!1}var Ar={},ri={};function si(i,o,a){i.M=1,i.A=ln(fe(o)),i.u=a,i.R=!0,Sr(i,null)}function Sr(i,o){i.F=Date.now(),hn(i),i.B=fe(i.A);var a=i.B,l=i.S;Array.isArray(l)||(l=[String(l)]),Fr(a.i,"t",l),i.C=0,a=i.j.L,i.h=new vr,i.g=ns(i.j,a?o:null,!i.u),i.P>0&&(i.O=new Ha(E(i.Y,i,i.g),i.P)),o=i.V,a=i.g,l=i.ba;var w="readystatechange";Array.isArray(w)||(w&&(gr[0]=w.toString()),w=gr);for(let T=0;T<w.length;T++){const S=lr(a,w[T],l||o.handleEvent,!1,o.h||o);if(!S)break;o.g[S.key]=S}o=i.J?ar(i.J):{},i.u?(i.v||(i.v="POST"),o["Content-Type"]="application/x-www-form-urlencoded",i.g.ea(i.B,i.v,i.u,o)):(i.v="GET",i.g.ea(i.B,i.v,null,o)),bt(),za(i.i,i.v,i.B,i.l,i.S,i.u)}Pe.prototype.ba=function(i){i=i.target;const o=this.O;o&&Oe(i)==3?o.j():this.Y(i)},Pe.prototype.Y=function(i){try{if(i==this.g)e:{const R=Oe(this.g),$=this.g.ya(),M=this.g.ca();if(!(R<3)&&(R!=3||this.g&&(this.h.h||this.g.la()||qr(this.g)))){this.K||R!=4||$==7||($==8||M<=0?bt(3):bt(2)),oi(this);var o=this.g.ca();this.X=o;var a=Za(this);if(this.o=o==200,Ka(this.i,this.v,this.B,this.l,this.S,R,o),this.o){if(this.U&&!this.L){t:{if(this.g){var l,w=this.g;if((l=w.g?w.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!f(l)){var T=l;break t}}T=null}if(i=T)ut(this.i,this.l,i,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,ai(this,i);else{this.o=!1,this.m=3,q(12),ze(this),kt(this);break e}}if(this.R){i=!0;let B;for(;!this.K&&this.C<a.length;)if(B=ec(this,a),B==ri){R==4&&(this.m=4,q(14),i=!1),ut(this.i,this.l,null,"[Incomplete Response]");break}else if(B==Ar){this.m=4,q(15),ut(this.i,this.l,a,"[Invalid Chunk]"),i=!1;break}else ut(this.i,this.l,B,null),ai(this,B);if(br(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),R!=4||a.length!=0||this.h.h||(this.m=1,q(16),i=!1),this.o=this.o&&i,!i)ut(this.i,this.l,a,"[Invalid Chunked Response]"),ze(this),kt(this);else if(a.length>0&&!this.W){this.W=!0;var S=this.j;S.g==this&&S.aa&&!S.P&&(S.j.info("Great, no buffering proxy detected. Bytes received: "+a.length),gi(S),S.P=!0,q(11))}}else ut(this.i,this.l,a,null),ai(this,a);R==4&&ze(this),this.o&&!this.K&&(R==4?Qr(this.j,this):(this.o=!1,hn(this)))}else pc(this.g),o==400&&a.indexOf("Unknown SID")>0?(this.m=3,q(12)):(this.m=0,q(13)),ze(this),kt(this)}}}catch{}finally{}};function Za(i){if(!br(i))return i.g.la();const o=qr(i.g);if(o==="")return"";let a="";const l=o.length,w=Oe(i.g)==4;if(!i.h.i){if(typeof TextDecoder>"u")return ze(i),kt(i),"";i.h.i=new h.TextDecoder}for(let T=0;T<l;T++)i.h.h=!0,a+=i.h.i.decode(o[T],{stream:!(w&&T==l-1)});return o.length=0,i.h.g+=a,i.C=0,i.h.g}function br(i){return i.g?i.v=="GET"&&i.M!=2&&i.j.Aa:!1}function ec(i,o){var a=i.C,l=o.indexOf(`
`,a);return l==-1?ri:(a=Number(o.substring(a,l)),isNaN(a)?Ar:(l+=1,l+a>o.length?ri:(o=o.slice(l,l+a),i.C=l+a,o)))}Pe.prototype.cancel=function(){this.K=!0,ze(this)};function hn(i){i.T=Date.now()+i.H,Cr(i,i.H)}function Cr(i,o){if(i.D!=null)throw Error("WatchDog timer not null");i.D=Ct(E(i.aa,i),o)}function oi(i){i.D&&(h.clearTimeout(i.D),i.D=null)}Pe.prototype.aa=function(){this.D=null;const i=Date.now();i-this.T>=0?(Ja(this.i,this.B),this.M!=2&&(bt(),q(17)),ze(this),this.m=2,kt(this)):Cr(this,this.T-i)};function kt(i){i.j.I==0||i.K||Qr(i.j,i)}function ze(i){oi(i);var o=i.O;o&&typeof o.dispose=="function"&&o.dispose(),i.O=null,mr(i.V),i.g&&(o=i.g,i.g=null,o.abort(),o.dispose())}function ai(i,o){try{var a=i.j;if(a.I!=0&&(a.g==i||ci(a.h,i))){if(!i.L&&ci(a.h,i)&&a.I==3){try{var l=a.Ba.g.parse(o)}catch{l=null}if(Array.isArray(l)&&l.length==3){var w=l;if(w[0]==0){e:if(!a.v){if(a.g)if(a.g.F+3e3<i.F)gn(a),fn(a);else break e;pi(a),q(18)}}else a.xa=w[1],0<a.xa-a.K&&w[2]<37500&&a.F&&a.A==0&&!a.C&&(a.C=Ct(E(a.Va,a),6e3));kr(a.h)<=1&&a.ta&&(a.ta=void 0)}else Je(a,11)}else if((i.L||a.g==i)&&gn(a),!f(o))for(w=a.Ba.g.parse(o),o=0;o<w.length;o++){let M=w[o];const B=M[0];if(!(B<=a.K))if(a.K=B,M=M[1],a.I==2)if(M[0]=="c"){a.M=M[1],a.ba=M[2];const pe=M[3];pe!=null&&(a.ka=pe,a.j.info("VER="+a.ka));const Xe=M[4];Xe!=null&&(a.za=Xe,a.j.info("SVER="+a.za));const De=M[5];De!=null&&typeof De=="number"&&De>0&&(l=1.5*De,a.O=l,a.j.info("backChannelRequestTimeoutMs_="+l)),l=a;const Le=i.g;if(Le){const mn=Le.g?Le.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(mn){var T=l.h;T.g||mn.indexOf("spdy")==-1&&mn.indexOf("quic")==-1&&mn.indexOf("h2")==-1||(T.j=T.l,T.g=new Set,T.h&&(hi(T,T.h),T.h=null))}if(l.G){const mi=Le.g?Le.g.getResponseHeader("X-HTTP-Session-Id"):null;mi&&(l.wa=mi,U(l.J,l.G,mi))}}a.I=3,a.l&&a.l.ra(),a.aa&&(a.T=Date.now()-i.F,a.j.info("Handshake RTT: "+a.T+"ms")),l=a;var S=i;if(l.na=ts(l,l.L?l.ba:null,l.W),S.L){Nr(l.h,S);var R=S,$=l.O;$&&(R.H=$),R.D&&(oi(R),hn(R)),l.g=S}else Xr(l);a.i.length>0&&pn(a)}else M[0]!="stop"&&M[0]!="close"||Je(a,7);else a.I==3&&(M[0]=="stop"||M[0]=="close"?M[0]=="stop"?Je(a,7):fi(a):M[0]!="noop"&&a.l&&a.l.qa(M),a.A=0)}}bt(4)}catch{}}var tc=class{constructor(i,o){this.g=i,this.map=o}};function Rr(i){this.l=i||10,h.PerformanceNavigationTiming?(i=h.performance.getEntriesByType("navigation"),i=i.length>0&&(i[0].nextHopProtocol=="hq"||i[0].nextHopProtocol=="h2")):i=!!(h.chrome&&h.chrome.loadTimes&&h.chrome.loadTimes()&&h.chrome.loadTimes().wasFetchedViaSpdy),this.j=i?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Pr(i){return i.h?!0:i.g?i.g.size>=i.j:!1}function kr(i){return i.h?1:i.g?i.g.size:0}function ci(i,o){return i.h?i.h==o:i.g?i.g.has(o):!1}function hi(i,o){i.g?i.g.add(o):i.h=o}function Nr(i,o){i.h&&i.h==o?i.h=null:i.g&&i.g.has(o)&&i.g.delete(o)}Rr.prototype.cancel=function(){if(this.i=Or(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const i of this.g.values())i.cancel();this.g.clear()}};function Or(i){if(i.h!=null)return i.i.concat(i.h.G);if(i.g!=null&&i.g.size!==0){let o=i.i;for(const a of i.g.values())o=o.concat(a.G);return o}return O(i.i)}var Dr=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function nc(i,o){if(i){i=i.split("&");for(let a=0;a<i.length;a++){const l=i[a].indexOf("=");let w,T=null;l>=0?(w=i[a].substring(0,l),T=i[a].substring(l+1)):w=i[a],o(w,T?decodeURIComponent(T.replace(/\+/g," ")):"")}}}function ke(i){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let o;i instanceof ke?(this.l=i.l,Nt(this,i.j),this.o=i.o,this.g=i.g,Ot(this,i.u),this.h=i.h,li(this,Vr(i.i)),this.m=i.m):i&&(o=String(i).match(Dr))?(this.l=!1,Nt(this,o[1]||"",!0),this.o=Dt(o[2]||""),this.g=Dt(o[3]||"",!0),Ot(this,o[4]),this.h=Dt(o[5]||"",!0),li(this,o[6]||"",!0),this.m=Dt(o[7]||"")):(this.l=!1,this.i=new Mt(null,this.l))}ke.prototype.toString=function(){const i=[];var o=this.j;o&&i.push(Lt(o,Lr,!0),":");var a=this.g;return(a||o=="file")&&(i.push("//"),(o=this.o)&&i.push(Lt(o,Lr,!0),"@"),i.push(Pt(a).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a=this.u,a!=null&&i.push(":",String(a))),(a=this.h)&&(this.g&&a.charAt(0)!="/"&&i.push("/"),i.push(Lt(a,a.charAt(0)=="/"?sc:rc,!0))),(a=this.i.toString())&&i.push("?",a),(a=this.m)&&i.push("#",Lt(a,ac)),i.join("")},ke.prototype.resolve=function(i){const o=fe(this);let a=!!i.j;a?Nt(o,i.j):a=!!i.o,a?o.o=i.o:a=!!i.g,a?o.g=i.g:a=i.u!=null;var l=i.h;if(a)Ot(o,i.u);else if(a=!!i.h){if(l.charAt(0)!="/")if(this.g&&!this.h)l="/"+l;else{var w=o.h.lastIndexOf("/");w!=-1&&(l=o.h.slice(0,w+1)+l)}if(w=l,w==".."||w==".")l="";else if(w.indexOf("./")!=-1||w.indexOf("/.")!=-1){l=w.lastIndexOf("/",0)==0,w=w.split("/");const T=[];for(let S=0;S<w.length;){const R=w[S++];R=="."?l&&S==w.length&&T.push(""):R==".."?((T.length>1||T.length==1&&T[0]!="")&&T.pop(),l&&S==w.length&&T.push("")):(T.push(R),l=!0)}l=T.join("/")}else l=w}return a?o.h=l:a=i.i.toString()!=="",a?li(o,Vr(i.i)):a=!!i.m,a&&(o.m=i.m),o};function fe(i){return new ke(i)}function Nt(i,o,a){i.j=a?Dt(o,!0):o,i.j&&(i.j=i.j.replace(/:$/,""))}function Ot(i,o){if(o){if(o=Number(o),isNaN(o)||o<0)throw Error("Bad port number "+o);i.u=o}else i.u=null}function li(i,o,a){o instanceof Mt?(i.i=o,cc(i.i,i.l)):(a||(o=Lt(o,oc)),i.i=new Mt(o,i.l))}function U(i,o,a){i.i.set(o,a)}function ln(i){return U(i,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),i}function Dt(i,o){return i?o?decodeURI(i.replace(/%25/g,"%2525")):decodeURIComponent(i):""}function Lt(i,o,a){return typeof i=="string"?(i=encodeURI(i).replace(o,ic),a&&(i=i.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i):null}function ic(i){return i=i.charCodeAt(0),"%"+(i>>4&15).toString(16)+(i&15).toString(16)}var Lr=/[#\/\?@]/g,rc=/[#\?:]/g,sc=/[#\?]/g,oc=/[#\?@]/g,ac=/#/g;function Mt(i,o){this.h=this.g=null,this.i=i||null,this.j=!!o}function Ke(i){i.g||(i.g=new Map,i.h=0,i.i&&nc(i.i,function(o,a){i.add(decodeURIComponent(o.replace(/\+/g," ")),a)}))}n=Mt.prototype,n.add=function(i,o){Ke(this),this.i=null,i=dt(this,i);let a=this.g.get(i);return a||this.g.set(i,a=[]),a.push(o),this.h+=1,this};function Mr(i,o){Ke(i),o=dt(i,o),i.g.has(o)&&(i.i=null,i.h-=i.g.get(o).length,i.g.delete(o))}function Ur(i,o){return Ke(i),o=dt(i,o),i.g.has(o)}n.forEach=function(i,o){Ke(this),this.g.forEach(function(a,l){a.forEach(function(w){i.call(o,w,l,this)},this)},this)};function xr(i,o){Ke(i);let a=[];if(typeof o=="string")Ur(i,o)&&(a=a.concat(i.g.get(dt(i,o))));else for(i=Array.from(i.g.values()),o=0;o<i.length;o++)a=a.concat(i[o]);return a}n.set=function(i,o){return Ke(this),this.i=null,i=dt(this,i),Ur(this,i)&&(this.h-=this.g.get(i).length),this.g.set(i,[o]),this.h+=1,this},n.get=function(i,o){return i?(i=xr(this,i),i.length>0?String(i[0]):o):o};function Fr(i,o,a){Mr(i,o),a.length>0&&(i.i=null,i.g.set(dt(i,o),O(a)),i.h+=a.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const i=[],o=Array.from(this.g.keys());for(let l=0;l<o.length;l++){var a=o[l];const w=Pt(a);a=xr(this,a);for(let T=0;T<a.length;T++){let S=w;a[T]!==""&&(S+="="+Pt(a[T])),i.push(S)}}return this.i=i.join("&")};function Vr(i){const o=new Mt;return o.i=i.i,i.g&&(o.g=new Map(i.g),o.h=i.h),o}function dt(i,o){return o=String(o),i.j&&(o=o.toLowerCase()),o}function cc(i,o){o&&!i.j&&(Ke(i),i.i=null,i.g.forEach(function(a,l){const w=l.toLowerCase();l!=w&&(Mr(this,l),Fr(this,w,a))},i)),i.j=o}function hc(i,o){const a=new Rt;if(h.Image){const l=new Image;l.onload=A(Ne,a,"TestLoadImage: loaded",!0,o,l),l.onerror=A(Ne,a,"TestLoadImage: error",!1,o,l),l.onabort=A(Ne,a,"TestLoadImage: abort",!1,o,l),l.ontimeout=A(Ne,a,"TestLoadImage: timeout",!1,o,l),h.setTimeout(function(){l.ontimeout&&l.ontimeout()},1e4),l.src=i}else o(!1)}function lc(i,o){const a=new Rt,l=new AbortController,w=setTimeout(()=>{l.abort(),Ne(a,"TestPingServer: timeout",!1,o)},1e4);fetch(i,{signal:l.signal}).then(T=>{clearTimeout(w),T.ok?Ne(a,"TestPingServer: ok",!0,o):Ne(a,"TestPingServer: server error",!1,o)}).catch(()=>{clearTimeout(w),Ne(a,"TestPingServer: error",!1,o)})}function Ne(i,o,a,l,w){try{w&&(w.onload=null,w.onerror=null,w.onabort=null,w.ontimeout=null),l(a)}catch{}}function uc(){this.g=new qa}function ui(i){this.i=i.Sb||null,this.h=i.ab||!1}b(ui,yr),ui.prototype.g=function(){return new un(this.i,this.h)};function un(i,o){H.call(this),this.H=i,this.o=o,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}b(un,H),n=un.prototype,n.open=function(i,o){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=i,this.D=o,this.readyState=1,xt(this)},n.send=function(i){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const o={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};i&&(o.body=i),(this.H||h).fetch(new Request(this.D,o)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Ut(this)),this.readyState=0},n.Pa=function(i){if(this.g&&(this.l=i,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=i.headers,this.readyState=2,xt(this)),this.g&&(this.readyState=3,xt(this),this.g)))if(this.responseType==="arraybuffer")i.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof h.ReadableStream<"u"&&"body"in i){if(this.j=i.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;jr(this)}else i.text().then(this.Oa.bind(this),this.ga.bind(this))};function jr(i){i.j.read().then(i.Ma.bind(i)).catch(i.ga.bind(i))}n.Ma=function(i){if(this.g){if(this.o&&i.value)this.response.push(i.value);else if(!this.o){var o=i.value?i.value:new Uint8Array(0);(o=this.B.decode(o,{stream:!i.done}))&&(this.response=this.responseText+=o)}i.done?Ut(this):xt(this),this.readyState==3&&jr(this)}},n.Oa=function(i){this.g&&(this.response=this.responseText=i,Ut(this))},n.Na=function(i){this.g&&(this.response=i,Ut(this))},n.ga=function(){this.g&&Ut(this)};function Ut(i){i.readyState=4,i.l=null,i.j=null,i.B=null,xt(i)}n.setRequestHeader=function(i,o){this.A.append(i,o)},n.getResponseHeader=function(i){return this.h&&this.h.get(i.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const i=[],o=this.h.entries();for(var a=o.next();!a.done;)a=a.value,i.push(a[0]+": "+a[1]),a=o.next();return i.join(`\r
`)};function xt(i){i.onreadystatechange&&i.onreadystatechange.call(i)}Object.defineProperty(un.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(i){this.m=i?"include":"same-origin"}});function $r(i){let o="";return on(i,function(a,l){o+=l,o+=":",o+=a,o+=`\r
`}),o}function di(i,o,a){e:{for(l in a){var l=!1;break e}l=!0}l||(a=$r(a),typeof i=="string"?a!=null&&Pt(a):U(i,o,a))}function F(i){H.call(this),this.headers=new Map,this.L=i||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}b(F,H);var dc=/^https?$/i,fc=["POST","PUT"];n=F.prototype,n.Fa=function(i){this.H=i},n.ea=function(i,o,a,l){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+i);o=o?o.toUpperCase():"GET",this.D=i,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Tr.g(),this.g.onreadystatechange=v(E(this.Ca,this));try{this.B=!0,this.g.open(o,String(i),!0),this.B=!1}catch(T){Br(this,T);return}if(i=a||"",a=new Map(this.headers),l)if(Object.getPrototypeOf(l)===Object.prototype)for(var w in l)a.set(w,l[w]);else if(typeof l.keys=="function"&&typeof l.get=="function")for(const T of l.keys())a.set(T,l.get(T));else throw Error("Unknown input type for opt_headers: "+String(l));l=Array.from(a.keys()).find(T=>T.toLowerCase()=="content-type"),w=h.FormData&&i instanceof h.FormData,!(Array.prototype.indexOf.call(fc,o,void 0)>=0)||l||w||a.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[T,S]of a)this.g.setRequestHeader(T,S);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(i),this.v=!1}catch(T){Br(this,T)}};function Br(i,o){i.h=!1,i.g&&(i.j=!0,i.g.abort(),i.j=!1),i.l=o,i.o=5,Hr(i),dn(i)}function Hr(i){i.A||(i.A=!0,W(i,"complete"),W(i,"error"))}n.abort=function(i){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=i||7,W(this,"complete"),W(this,"abort"),dn(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),dn(this,!0)),F.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?Wr(this):this.Xa())},n.Xa=function(){Wr(this)};function Wr(i){if(i.h&&typeof c<"u"){if(i.v&&Oe(i)==4)setTimeout(i.Ca.bind(i),0);else if(W(i,"readystatechange"),Oe(i)==4){i.h=!1;try{const T=i.ca();e:switch(T){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var o=!0;break e;default:o=!1}var a;if(!(a=o)){var l;if(l=T===0){let S=String(i.D).match(Dr)[1]||null;!S&&h.self&&h.self.location&&(S=h.self.location.protocol.slice(0,-1)),l=!dc.test(S?S.toLowerCase():"")}a=l}if(a)W(i,"complete"),W(i,"success");else{i.o=6;try{var w=Oe(i)>2?i.g.statusText:""}catch{w=""}i.l=w+" ["+i.ca()+"]",Hr(i)}}finally{dn(i)}}}}function dn(i,o){if(i.g){i.m&&(clearTimeout(i.m),i.m=null);const a=i.g;i.g=null,o||W(i,"ready");try{a.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function Oe(i){return i.g?i.g.readyState:0}n.ca=function(){try{return Oe(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(i){if(this.g){var o=this.g.responseText;return i&&o.indexOf(i)==0&&(o=o.substring(i.length)),Wa(o)}};function qr(i){try{if(!i.g)return null;if("response"in i.g)return i.g.response;switch(i.F){case"":case"text":return i.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in i.g)return i.g.mozResponseArrayBuffer}return null}catch{return null}}function pc(i){const o={};i=(i.g&&Oe(i)>=2&&i.g.getAllResponseHeaders()||"").split(`\r
`);for(let l=0;l<i.length;l++){if(f(i[l]))continue;var a=Qa(i[l]);const w=a[0];if(a=a[1],typeof a!="string")continue;a=a.trim();const T=o[w]||[];o[w]=T,T.push(a)}Fa(o,function(l){return l.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ft(i,o,a){return a&&a.internalChannelParams&&a.internalChannelParams[i]||o}function Gr(i){this.za=0,this.i=[],this.j=new Rt,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Ft("failFast",!1,i),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Ft("baseRetryDelayMs",5e3,i),this.Za=Ft("retryDelaySeedMs",1e4,i),this.Ta=Ft("forwardChannelMaxRetries",2,i),this.va=Ft("forwardChannelRequestTimeoutMs",2e4,i),this.ma=i&&i.xmlHttpFactory||void 0,this.Ua=i&&i.Rb||void 0,this.Aa=i&&i.useFetchStreams||!1,this.O=void 0,this.L=i&&i.supportsCrossDomainXhr||!1,this.M="",this.h=new Rr(i&&i.concurrentRequestLimit),this.Ba=new uc,this.S=i&&i.fastHandshake||!1,this.R=i&&i.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=i&&i.Pb||!1,i&&i.ua&&this.j.ua(),i&&i.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&i&&i.detectBufferingProxy||!1,this.ia=void 0,i&&i.longPollingTimeout&&i.longPollingTimeout>0&&(this.ia=i.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=Gr.prototype,n.ka=8,n.I=1,n.connect=function(i,o,a,l){q(0),this.W=i,this.H=o||{},a&&l!==void 0&&(this.H.OSID=a,this.H.OAID=l),this.F=this.X,this.J=ts(this,null,this.W),pn(this)};function fi(i){if(zr(i),i.I==3){var o=i.V++,a=fe(i.J);if(U(a,"SID",i.M),U(a,"RID",o),U(a,"TYPE","terminate"),Vt(i,a),o=new Pe(i,i.j,o),o.M=2,o.A=ln(fe(a)),a=!1,h.navigator&&h.navigator.sendBeacon)try{a=h.navigator.sendBeacon(o.A.toString(),"")}catch{}!a&&h.Image&&(new Image().src=o.A,a=!0),a||(o.g=ns(o.j,null),o.g.ea(o.A)),o.F=Date.now(),hn(o)}es(i)}function fn(i){i.g&&(gi(i),i.g.cancel(),i.g=null)}function zr(i){fn(i),i.v&&(h.clearTimeout(i.v),i.v=null),gn(i),i.h.cancel(),i.m&&(typeof i.m=="number"&&h.clearTimeout(i.m),i.m=null)}function pn(i){if(!Pr(i.h)&&!i.m){i.m=!0;var o=i.Ea;Re||d(),re||(Re(),re=!0),m.add(o,i),i.D=0}}function gc(i,o){return kr(i.h)>=i.h.j-(i.m?1:0)?!1:i.m?(i.i=o.G.concat(i.i),!0):i.I==1||i.I==2||i.D>=(i.Sa?0:i.Ta)?!1:(i.m=Ct(E(i.Ea,i,o),Zr(i,i.D)),i.D++,!0)}n.Ea=function(i){if(this.m)if(this.m=null,this.I==1){if(!i){this.V=Math.floor(Math.random()*1e5),i=this.V++;const w=new Pe(this,this.j,i);let T=this.o;if(this.U&&(T?(T=ar(T),hr(T,this.U)):T=this.U),this.u!==null||this.R||(w.J=T,T=null),this.S)e:{for(var o=0,a=0;a<this.i.length;a++){t:{var l=this.i[a];if("__data__"in l.map&&(l=l.map.__data__,typeof l=="string")){l=l.length;break t}l=void 0}if(l===void 0)break;if(o+=l,o>4096){o=a;break e}if(o===4096||a===this.i.length-1){o=a+1;break e}}o=1e3}else o=1e3;o=Jr(this,w,o),a=fe(this.J),U(a,"RID",i),U(a,"CVER",22),this.G&&U(a,"X-HTTP-Session-Id",this.G),Vt(this,a),T&&(this.R?o="headers="+Pt($r(T))+"&"+o:this.u&&di(a,this.u,T)),hi(this.h,w),this.Ra&&U(a,"TYPE","init"),this.S?(U(a,"$req",o),U(a,"SID","null"),w.U=!0,si(w,a,null)):si(w,a,o),this.I=2}}else this.I==3&&(i?Kr(this,i):this.i.length==0||Pr(this.h)||Kr(this))};function Kr(i,o){var a;o?a=o.l:a=i.V++;const l=fe(i.J);U(l,"SID",i.M),U(l,"RID",a),U(l,"AID",i.K),Vt(i,l),i.u&&i.o&&di(l,i.u,i.o),a=new Pe(i,i.j,a,i.D+1),i.u===null&&(a.J=i.o),o&&(i.i=o.G.concat(i.i)),o=Jr(i,a,1e3),a.H=Math.round(i.va*.5)+Math.round(i.va*.5*Math.random()),hi(i.h,a),si(a,l,o)}function Vt(i,o){i.H&&on(i.H,function(a,l){U(o,l,a)}),i.l&&on({},function(a,l){U(o,l,a)})}function Jr(i,o,a){a=Math.min(i.i.length,a);const l=i.l?E(i.l.Ka,i.l,i):null;e:{var w=i.i;let R=-1;for(;;){const $=["count="+a];R==-1?a>0?(R=w[0].g,$.push("ofs="+R)):R=0:$.push("ofs="+R);let M=!0;for(let B=0;B<a;B++){var T=w[B].g;const pe=w[B].map;if(T-=R,T<0)R=Math.max(0,w[B].g-100),M=!1;else try{T="req"+T+"_"||"";try{var S=pe instanceof Map?pe:Object.entries(pe);for(const[Xe,De]of S){let Le=De;u(De)&&(Le=Qn(De)),$.push(T+Xe+"="+encodeURIComponent(Le))}}catch(Xe){throw $.push(T+"type="+encodeURIComponent("_badmap")),Xe}}catch{l&&l(pe)}}if(M){S=$.join("&");break e}}S=void 0}return i=i.i.splice(0,a),o.G=i,S}function Xr(i){if(!i.g&&!i.v){i.Y=1;var o=i.Da;Re||d(),re||(Re(),re=!0),m.add(o,i),i.A=0}}function pi(i){return i.g||i.v||i.A>=3?!1:(i.Y++,i.v=Ct(E(i.Da,i),Zr(i,i.A)),i.A++,!0)}n.Da=function(){if(this.v=null,Yr(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var i=4*this.T;this.j.info("BP detection timer enabled: "+i),this.B=Ct(E(this.Wa,this),i)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,q(10),fn(this),Yr(this))};function gi(i){i.B!=null&&(h.clearTimeout(i.B),i.B=null)}function Yr(i){i.g=new Pe(i,i.j,"rpc",i.Y),i.u===null&&(i.g.J=i.o),i.g.P=0;var o=fe(i.na);U(o,"RID","rpc"),U(o,"SID",i.M),U(o,"AID",i.K),U(o,"CI",i.F?"0":"1"),!i.F&&i.ia&&U(o,"TO",i.ia),U(o,"TYPE","xmlhttp"),Vt(i,o),i.u&&i.o&&di(o,i.u,i.o),i.O&&(i.g.H=i.O);var a=i.g;i=i.ba,a.M=1,a.A=ln(fe(o)),a.u=null,a.R=!0,Sr(a,i)}n.Va=function(){this.C!=null&&(this.C=null,fn(this),pi(this),q(19))};function gn(i){i.C!=null&&(h.clearTimeout(i.C),i.C=null)}function Qr(i,o){var a=null;if(i.g==o){gn(i),gi(i),i.g=null;var l=2}else if(ci(i.h,o))a=o.G,Nr(i.h,o),l=1;else return;if(i.I!=0){if(o.o)if(l==1){a=o.u?o.u.length:0,o=Date.now()-o.F;var w=i.D;l=ti(),W(l,new Er(l,a)),pn(i)}else Xr(i);else if(w=o.m,w==3||w==0&&o.X>0||!(l==1&&gc(i,o)||l==2&&pi(i)))switch(a&&a.length>0&&(o=i.h,o.i=o.i.concat(a)),w){case 1:Je(i,5);break;case 4:Je(i,10);break;case 3:Je(i,6);break;default:Je(i,2)}}}function Zr(i,o){let a=i.Qa+Math.floor(Math.random()*i.Za);return i.isActive()||(a*=2),a*o}function Je(i,o){if(i.j.info("Error code "+o),o==2){var a=E(i.bb,i),l=i.Ua;const w=!l;l=new ke(l||"//www.google.com/images/cleardot.gif"),h.location&&h.location.protocol=="http"||Nt(l,"https"),ln(l),w?hc(l.toString(),a):lc(l.toString(),a)}else q(2);i.I=0,i.l&&i.l.pa(o),es(i),zr(i)}n.bb=function(i){i?(this.j.info("Successfully pinged google.com"),q(2)):(this.j.info("Failed to ping google.com"),q(1))};function es(i){if(i.I=0,i.ja=[],i.l){const o=Or(i.h);(o.length!=0||i.i.length!=0)&&(D(i.ja,o),D(i.ja,i.i),i.h.i.length=0,O(i.i),i.i.length=0),i.l.oa()}}function ts(i,o,a){var l=a instanceof ke?fe(a):new ke(a);if(l.g!="")o&&(l.g=o+"."+l.g),Ot(l,l.u);else{var w=h.location;l=w.protocol,o=o?o+"."+w.hostname:w.hostname,w=+w.port;const T=new ke(null);l&&Nt(T,l),o&&(T.g=o),w&&Ot(T,w),a&&(T.h=a),l=T}return a=i.G,o=i.wa,a&&o&&U(l,a,o),U(l,"VER",i.ka),Vt(i,l),l}function ns(i,o,a){if(o&&!i.L)throw Error("Can't create secondary domain capable XhrIo object.");return o=i.Aa&&!i.ma?new F(new ui({ab:a})):new F(i.ma),o.Fa(i.L),o}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function is(){}n=is.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function se(i,o){H.call(this),this.g=new Gr(o),this.l=i,this.h=o&&o.messageUrlParams||null,i=o&&o.messageHeaders||null,o&&o.clientProtocolHeaderRequired&&(i?i["X-Client-Protocol"]="webchannel":i={"X-Client-Protocol":"webchannel"}),this.g.o=i,i=o&&o.initMessageHeaders||null,o&&o.messageContentType&&(i?i["X-WebChannel-Content-Type"]=o.messageContentType:i={"X-WebChannel-Content-Type":o.messageContentType}),o&&o.sa&&(i?i["X-WebChannel-Client-Profile"]=o.sa:i={"X-WebChannel-Client-Profile":o.sa}),this.g.U=i,(i=o&&o.Qb)&&!f(i)&&(this.g.u=i),this.A=o&&o.supportsCrossDomainXhr||!1,this.v=o&&o.sendRawJson||!1,(o=o&&o.httpSessionIdParam)&&!f(o)&&(this.g.G=o,i=this.h,i!==null&&o in i&&(i=this.h,o in i&&delete i[o])),this.j=new ft(this)}b(se,H),se.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},se.prototype.close=function(){fi(this.g)},se.prototype.o=function(i){var o=this.g;if(typeof i=="string"){var a={};a.__data__=i,i=a}else this.v&&(a={},a.__data__=Qn(i),i=a);o.i.push(new tc(o.Ya++,i)),o.I==3&&pn(o)},se.prototype.N=function(){this.g.l=null,delete this.j,fi(this.g),delete this.g,se.Z.N.call(this)};function rs(i){Zn.call(this),i.__headers__&&(this.headers=i.__headers__,this.statusCode=i.__status__,delete i.__headers__,delete i.__status__);var o=i.__sm__;if(o){e:{for(const a in o){i=a;break e}i=void 0}(this.i=i)&&(i=this.i,o=o!==null&&i in o?o[i]:void 0),this.data=o}else this.data=i}b(rs,Zn);function ss(){ei.call(this),this.status=1}b(ss,ei);function ft(i){this.g=i}b(ft,is),ft.prototype.ra=function(){W(this.g,"a")},ft.prototype.qa=function(i){W(this.g,new rs(i))},ft.prototype.pa=function(i){W(this.g,new ss)},ft.prototype.oa=function(){W(this.g,"b")},se.prototype.send=se.prototype.o,se.prototype.open=se.prototype.m,se.prototype.close=se.prototype.close,ni.NO_ERROR=0,ni.TIMEOUT=8,ni.HTTP_ERROR=6,Ya.COMPLETE="complete",Ga.EventType=St,St.OPEN="a",St.CLOSE="b",St.ERROR="c",St.MESSAGE="d",H.prototype.listen=H.prototype.J,F.prototype.listenOnce=F.prototype.K,F.prototype.getLastError=F.prototype.Ha,F.prototype.getLastErrorCode=F.prototype.ya,F.prototype.getStatus=F.prototype.ca,F.prototype.getResponseJson=F.prototype.La,F.prototype.getResponseText=F.prototype.la,F.prototype.send=F.prototype.ea,F.prototype.setWithCredentials=F.prototype.Fa}).apply(typeof _n<"u"?_n:typeof self<"u"?self:typeof window<"u"?window:{});const Ms="@firebase/firestore",Us="4.9.2";/**
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
 */class G{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}G.UNAUTHENTICATED=new G(null),G.GOOGLE_CREDENTIALS=new G("google-credentials-uid"),G.FIRST_PARTY=new G("first-party-uid"),G.MOCK_USER=new G("mock-user");/**
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
 */let nn="12.3.0";/**
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
 */const It=new Fn("@firebase/firestore");function ue(n,...e){if(It.logLevel<=L.DEBUG){const t=e.map(Xi);It.debug(`Firestore (${nn}): ${n}`,...t)}}function ra(n,...e){if(It.logLevel<=L.ERROR){const t=e.map(Xi);It.error(`Firestore (${nn}): ${n}`,...t)}}function Zu(n,...e){if(It.logLevel<=L.WARN){const t=e.map(Xi);It.warn(`Firestore (${nn}): ${n}`,...t)}}function Xi(n){if(typeof n=="string")return n;try{/**
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
*/return(function(t){return JSON.stringify(t)})(n)}catch{return n}}/**
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
 */function Xt(n,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,sa(n,r,t)}function sa(n,e,t){let r=`FIRESTORE (${nn}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw ra(r),new Error(r)}function Wt(n,e,t,r){let s="Unexpected state";typeof t=="string"?s=t:r=t,n||sa(e,s,r)}/**
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
 */const k={CANCELLED:"cancelled",INVALID_ARGUMENT:"invalid-argument",FAILED_PRECONDITION:"failed-precondition"};class N extends ce{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
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
 */class qt{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
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
 */class oa{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class ed{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(G.UNAUTHENTICATED)))}shutdown(){}}class td{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class nd{constructor(e){this.t=e,this.currentUser=G.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){Wt(this.o===void 0,42304);let r=this.i;const s=_=>this.i!==r?(r=this.i,t(_)):Promise.resolve();let c=new qt;this.o=()=>{this.i++,this.currentUser=this.u(),c.resolve(),c=new qt,e.enqueueRetryable((()=>s(this.currentUser)))};const h=()=>{const _=c;e.enqueueRetryable((async()=>{await _.promise,await s(this.currentUser)}))},u=_=>{ue("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=_,this.o&&(this.auth.addAuthTokenListener(this.o),h())};this.t.onInit((_=>u(_))),setTimeout((()=>{if(!this.auth){const _=this.t.getImmediate({optional:!0});_?u(_):(ue("FirebaseAuthCredentialsProvider","Auth not yet detected"),c.resolve(),c=new qt)}}),0),h()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((r=>this.i!==e?(ue("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(Wt(typeof r.accessToken=="string",31837,{l:r}),new oa(r.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return Wt(e===null||typeof e=="string",2055,{h:e}),new G(e)}}class id{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=G.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class rd{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new id(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(G.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class xs{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class sd{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Y(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){Wt(this.o===void 0,3512);const r=c=>{c.error!=null&&ue("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${c.error.message}`);const h=c.token!==this.m;return this.m=c.token,ue("FirebaseAppCheckTokenProvider",`Received ${h?"new":"existing"} token.`),h?t(c.token):Promise.resolve()};this.o=c=>{e.enqueueRetryable((()=>r(c)))};const s=c=>{ue("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=c,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((c=>s(c))),setTimeout((()=>{if(!this.appCheck){const c=this.V.getImmediate({optional:!0});c?s(c):ue("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new xs(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(Wt(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new xs(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
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
 */function od(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}/**
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
 */class ad{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=od(40);for(let c=0;c<s.length;++c)r.length<20&&s[c]<t&&(r+=e.charAt(s[c]%62))}return r}}function Be(n,e){return n<e?-1:n>e?1:0}function cd(n,e){const t=Math.min(n.length,e.length);for(let r=0;r<t;r++){const s=n.charAt(r),c=e.charAt(r);if(s!==c)return Ei(s)===Ei(c)?Be(s,c):Ei(s)?1:-1}return Be(n.length,e.length)}const hd=55296,ld=57343;function Ei(n){const e=n.charCodeAt(0);return e>=hd&&e<=ld}/**
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
 */const Fs="__name__";class ge{constructor(e,t,r){t===void 0?t=0:t>e.length&&Xt(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&Xt(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return ge.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ge?e.forEach((r=>{t.push(r)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let s=0;s<r;s++){const c=ge.compareSegments(e.get(s),t.get(s));if(c!==0)return c}return Be(e.length,t.length)}static compareSegments(e,t){const r=ge.isNumericId(e),s=ge.isNumericId(t);return r&&!s?-1:!r&&s?1:r&&s?ge.extractNumericId(e).compare(ge.extractNumericId(t)):cd(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Ji.fromString(e.substring(4,e.length-2))}}class he extends ge{construct(e,t,r){return new he(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new N(k.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter((s=>s.length>0)))}return new he(t)}static emptyPath(){return new he([])}}const ud=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Qe extends ge{construct(e,t,r){return new Qe(e,t,r)}static isValidIdentifier(e){return ud.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Qe.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Fs}static keyField(){return new Qe([Fs])}static fromServerFormat(e){const t=[];let r="",s=0;const c=()=>{if(r.length===0)throw new N(k.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let h=!1;for(;s<e.length;){const u=e[s];if(u==="\\"){if(s+1===e.length)throw new N(k.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const _=e[s+1];if(_!=="\\"&&_!=="."&&_!=="`")throw new N(k.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=_,s+=2}else u==="`"?(h=!h,s++):u!=="."||h?(r+=u,s++):(c(),s++)}if(c(),h)throw new N(k.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Qe(t)}static emptyPath(){return new Qe([])}}/**
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
 */class Ze{constructor(e){this.path=e}static fromPath(e){return new Ze(he.fromString(e))}static fromName(e){return new Ze(he.fromString(e).popFirst(5))}static empty(){return new Ze(he.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&he.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return he.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new Ze(new he(e.slice()))}}function dd(n,e,t,r){if(e===!0&&r===!0)throw new N(k.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function fd(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function pd(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=(function(r){return r.constructor?r.constructor.name:null})(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":Xt(12329,{type:typeof n})}function gd(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new N(k.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=pd(n);throw new N(k.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}/**
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
 */function j(n,e){const t={typeString:n};return e&&(t.value=e),t}function rn(n,e){if(!fd(n))throw new N(k.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const s=e[r].typeString,c="value"in e[r]?{value:e[r].value}:void 0;if(!(r in n)){t=`JSON missing required field: '${r}'`;break}const h=n[r];if(s&&typeof h!==s){t=`JSON field '${r}' must be a ${s}.`;break}if(c!==void 0&&h!==c.value){t=`Expected '${r}' field to equal '${c.value}'`;break}}if(t)throw new N(k.INVALID_ARGUMENT,t);return!0}/**
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
 */const Vs=-62135596800,js=1e6;class me{static now(){return me.fromMillis(Date.now())}static fromDate(e){return me.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*js);return new me(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new N(k.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new N(k.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Vs)throw new N(k.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new N(k.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/js}_compareTo(e){return this.seconds===e.seconds?Be(this.nanoseconds,e.nanoseconds):Be(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:me._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(rn(e,me._jsonSchema))return new me(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Vs;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}me._jsonSchemaVersion="firestore/timestamp/1.0",me._jsonSchema={type:j("string",me._jsonSchemaVersion),seconds:j("number"),nanoseconds:j("number")};function md(n){return n.name==="IndexedDbTransactionError"}/**
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
 */class yd extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */class st{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(c){throw typeof DOMException<"u"&&c instanceof DOMException?new yd("Invalid base64 string: "+c):c}})(e);return new st(t)}static fromUint8Array(e){const t=(function(s){let c="";for(let h=0;h<s.length;++h)c+=String.fromCharCode(s[h]);return c})(e);return new st(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return Be(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}st.EMPTY_BYTE_STRING=new st("");const Di="(default)";class Dn{constructor(e,t){this.projectId=e,this.database=t||Di}static empty(){return new Dn("","")}get isDefaultDatabase(){return this.database===Di}isEqual(e){return e instanceof Dn&&e.projectId===this.projectId&&e.database===this.database}}/**
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
 */class _d{constructor(e,t=null,r=[],s=[],c=null,h="F",u=null,_=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=s,this.limit=c,this.limitType=h,this.startAt=u,this.endAt=_,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function wd(n){return new _d(n)}/**
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
 */var $s,P;(P=$s||($s={}))[P.OK=0]="OK",P[P.CANCELLED=1]="CANCELLED",P[P.UNKNOWN=2]="UNKNOWN",P[P.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",P[P.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",P[P.NOT_FOUND=5]="NOT_FOUND",P[P.ALREADY_EXISTS=6]="ALREADY_EXISTS",P[P.PERMISSION_DENIED=7]="PERMISSION_DENIED",P[P.UNAUTHENTICATED=16]="UNAUTHENTICATED",P[P.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",P[P.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",P[P.ABORTED=10]="ABORTED",P[P.OUT_OF_RANGE=11]="OUT_OF_RANGE",P[P.UNIMPLEMENTED=12]="UNIMPLEMENTED",P[P.INTERNAL=13]="INTERNAL",P[P.UNAVAILABLE=14]="UNAVAILABLE",P[P.DATA_LOSS=15]="DATA_LOSS";/**
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
 */new Ji([4294967295,4294967295],0);/**
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
 */const Id=41943040;/**
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
 */const Ed=1048576;function Ti(){return typeof document<"u"?document:null}/**
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
 */class Td{constructor(e,t,r=1e3,s=1.5,c=6e4){this.Mi=e,this.timerId=t,this.d_=r,this.A_=s,this.R_=c,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),s=Math.max(0,t-r);s>0&&ue("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,s,(()=>(this.f_=Date.now(),e()))),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
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
 */class Yi{constructor(e,t,r,s,c){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=s,this.removalCallback=c,this.deferred=new qt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((h=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,s,c){const h=Date.now()+r,u=new Yi(e,t,h,s,c);return u.start(r),u}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new N(k.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}var Bs,Hs;(Hs=Bs||(Bs={})).Ma="default",Hs.Cache="cache";/**
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
 */function vd(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
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
 */const Ws=new Map;/**
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
 */const aa="firestore.googleapis.com",qs=!0;class Gs{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new N(k.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=aa,this.ssl=qs}else this.host=e.host,this.ssl=e.ssl??qs;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Id;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Ed)throw new N(k.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}dd("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=vd(e.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new N(k.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new N(k.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new N(k.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(r,s){return r.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class ca{constructor(e,t,r,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Gs({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new N(k.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new N(k.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Gs(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new ed;switch(r.type){case"firstParty":return new rd(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new N(k.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const r=Ws.get(t);r&&(ue("ComponentProvider","Removing Datastore"),Ws.delete(t),r.terminate())})(this),Promise.resolve()}}function Ad(n,e,t,r={}){n=gd(n,ca);const s=ct(e),c=n._getSettings(),h={...c,emulatorOptions:n._getEmulatorOptions()},u=`${e}:${t}`;s&&(xi(`https://${u}`),Fi("Firestore",!0)),c.host!==aa&&c.host!==u&&Zu("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const _={...c,host:u,ssl:s,emulatorOptions:r};if(!$e(_,h)&&(n._setSettings(_),r.mockUserToken)){let E,A;if(typeof r.mockUserToken=="string")E=r.mockUserToken,A=G.MOCK_USER;else{E=Sc(r.mockUserToken,n._app?.options.projectId);const b=r.mockUserToken.sub||r.mockUserToken.user_id;if(!b)throw new N(k.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");A=new G(b)}n._authCredentials=new td(new oa(E,A))}}/**
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
 */class Qi{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Qi(this.firestore,e,this._query)}}class ye{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Zi(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ye(this.firestore,e,this._key)}toJSON(){return{type:ye._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(rn(t,ye._jsonSchema))return new ye(e,r||null,new Ze(he.fromString(t.referencePath)))}}ye._jsonSchemaVersion="firestore/documentReference/1.0",ye._jsonSchema={type:j("string",ye._jsonSchemaVersion),referencePath:j("string")};class Zi extends Qi{constructor(e,t,r){super(e,t,wd(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ye(this.firestore,null,new Ze(e))}withConverter(e){return new Zi(this.firestore,e,this._path)}}/**
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
 */const zs="AsyncQueue";class Ks{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Td(this,"async_queue_retry"),this._c=()=>{const r=Ti();r&&ue(zs,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const t=Ti();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=Ti();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new qt;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Xu.push(e),this.lc())))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!md(e))throw e;ue(zs,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((r=>{throw this.nc=r,this.rc=!1,ra("INTERNAL UNHANDLED ERROR: ",Js(r)),r})).then((r=>(this.rc=!1,r))))));return this.ac=t,t}enqueueAfterDelay(e,t,r){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const s=Yi.createAndSchedule(this,e,t,r,(c=>this.hc(c)));return this.tc.push(s),s}uc(){this.nc&&Xt(47125,{Pc:Js(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,r)=>t.targetTimeMs-r.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function Js(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),e}class Sd extends ca{constructor(e,t,r,s){super(e,t,r,s),this.type="firestore",this._queue=new Ks,this._persistenceKey=s?.name||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Ks(e),this._firestoreClient=void 0,await e}}}function Sp(n,e){const t=typeof n=="object"?n:Vn(),r=typeof n=="string"?n:Di,s=He(t,"firestore").getImmediate({identifier:r});if(!s._initialized){const c=po("firestore");c&&Ad(s,...c)}return s}/**
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
 */class Ee{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Ee(st.fromBase64String(e))}catch(t){throw new N(k.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Ee(st.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Ee._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(rn(e,Ee._jsonSchema))return Ee.fromBase64String(e.bytes)}}Ee._jsonSchemaVersion="firestore/bytes/1.0",Ee._jsonSchema={type:j("string",Ee._jsonSchemaVersion),bytes:j("string")};/**
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
 */class ha{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new N(k.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Qe(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
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
 */class tt{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new N(k.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new N(k.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return Be(this._lat,e._lat)||Be(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:tt._jsonSchemaVersion}}static fromJSON(e){if(rn(e,tt._jsonSchema))return new tt(e.latitude,e.longitude)}}tt._jsonSchemaVersion="firestore/geoPoint/1.0",tt._jsonSchema={type:j("string",tt._jsonSchemaVersion),latitude:j("number"),longitude:j("number")};/**
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
 */class nt{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(r,s){if(r.length!==s.length)return!1;for(let c=0;c<r.length;++c)if(r[c]!==s[c])return!1;return!0})(this._values,e._values)}toJSON(){return{type:nt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(rn(e,nt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new nt(e.vectorValues);throw new N(k.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}nt._jsonSchemaVersion="firestore/vectorValue/1.0",nt._jsonSchema={type:j("string",nt._jsonSchemaVersion),vectorValues:j("object")};const bd=new RegExp("[~\\*/\\[\\]]");function Cd(n,e,t){if(e.search(bd)>=0)throw Xs(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n);try{return new ha(...e.split("."))._internalPath}catch{throw Xs(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n)}}function Xs(n,e,t,r,s){let c=`Function ${e}() called with invalid data`;c+=". ";let h="";return new N(k.INVALID_ARGUMENT,c+n+h)}/**
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
 */class la{constructor(e,t,r,s,c){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=s,this._converter=c}get id(){return this._key.path.lastSegment()}get ref(){return new ye(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new Rd(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(ua("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class Rd extends la{data(){return super.data()}}function ua(n,e){return typeof e=="string"?Cd(n,e):e instanceof ha?e._internalPath:e._delegate._internalPath}class wn{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class _t extends la{constructor(e,t,r,s,c,h){super(e,t,r,s,h),this._firestore=e,this._firestoreImpl=e,this.metadata=c}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new An(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field(ua("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new N(k.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=_t._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}_t._jsonSchemaVersion="firestore/documentSnapshot/1.0",_t._jsonSchema={type:j("string",_t._jsonSchemaVersion),bundleSource:j("string","DocumentSnapshot"),bundleName:j("string"),bundle:j("string")};class An extends _t{data(e={}){return super.data(e)}}class Gt{constructor(e,t,r,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new wn(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((r=>{e.call(t,new An(this._firestore,this._userDataWriter,r.key,r,new wn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new N(k.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,c){if(s._snapshot.oldDocs.isEmpty()){let h=0;return s._snapshot.docChanges.map((u=>{const _=new An(s._firestore,s._userDataWriter,u.doc.key,u.doc,new wn(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);return u.doc,{type:"added",doc:_,oldIndex:-1,newIndex:h++}}))}{let h=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((u=>c||u.type!==3)).map((u=>{const _=new An(s._firestore,s._userDataWriter,u.doc.key,u.doc,new wn(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);let E=-1,A=-1;return u.type!==0&&(E=h.indexOf(u.doc.key),h=h.delete(u.doc.key)),u.type!==1&&(h=h.add(u.doc),A=h.indexOf(u.doc.key)),{type:Pd(u.type),doc:_,oldIndex:E,newIndex:A}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new N(k.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Gt._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=ad.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],s=[];return this.docs.forEach((c=>{c._document!==null&&(t.push(c._document),r.push(this._userDataWriter.convertObjectMap(c._document.data.value.mapValue.fields,"previous")),s.push(c.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function Pd(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return Xt(61501,{type:n})}}Gt._jsonSchemaVersion="firestore/querySnapshot/1.0",Gt._jsonSchema={type:j("string",Gt._jsonSchemaVersion),bundleSource:j("string","QuerySnapshot"),bundleName:j("string"),bundle:j("string")};(function(e,t=!0){(function(s){nn=s})(Tt),de(new oe("firestore",((r,{instanceIdentifier:s,options:c})=>{const h=r.getProvider("app").getImmediate(),u=new Sd(new nd(r.getProvider("auth-internal")),new sd(h,r.getProvider("app-check-internal")),(function(E,A){if(!Object.prototype.hasOwnProperty.apply(E.options,["projectId"]))throw new N(k.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Dn(E.options.projectId,A)})(h,s),h);return c={useFetchStreams:t,...c},u._setSettings(c),u}),"PUBLIC").setMultipleInstances(!0)),Z(Ms,Us,e),Z(Ms,Us,"esm2020")})();const da="@firebase/installations",er="0.6.19";/**
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
 */const fa=1e4,pa=`w:${er}`,ga="FIS_v2",kd="https://firebaseinstallations.googleapis.com/v1",Nd=3600*1e3,Od="installations",Dd="Installations";/**
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
 */const Ld={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},ot=new ht(Od,Dd,Ld);function ma(n){return n instanceof ce&&n.code.includes("request-failed")}/**
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
 */function ya({projectId:n}){return`${kd}/projects/${n}/installations`}function _a(n){return{token:n.token,requestStatus:2,expiresIn:Ud(n.expiresIn),creationTime:Date.now()}}async function wa(n,e){const r=(await e.json()).error;return ot.create("request-failed",{requestName:n,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function Ia({apiKey:n}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":n})}function Md(n,{refreshToken:e}){const t=Ia(n);return t.append("Authorization",xd(e)),t}async function Ea(n){const e=await n();return e.status>=500&&e.status<600?n():e}function Ud(n){return Number(n.replace("s","000"))}function xd(n){return`${ga} ${n}`}/**
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
 */async function Fd({appConfig:n,heartbeatServiceProvider:e},{fid:t}){const r=ya(n),s=Ia(n),c=e.getImmediate({optional:!0});if(c){const E=await c.getHeartbeatsHeader();E&&s.append("x-firebase-client",E)}const h={fid:t,authVersion:ga,appId:n.appId,sdkVersion:pa},u={method:"POST",headers:s,body:JSON.stringify(h)},_=await Ea(()=>fetch(r,u));if(_.ok){const E=await _.json();return{fid:E.fid||t,registrationStatus:2,refreshToken:E.refreshToken,authToken:_a(E.authToken)}}else throw await wa("Create Installation",_)}/**
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
 */function Ta(n){return new Promise(e=>{setTimeout(e,n)})}/**
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
 */function Vd(n){return btoa(String.fromCharCode(...n)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const jd=/^[cdef][\w-]{21}$/,Li="";function $d(){try{const n=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(n),n[0]=112+n[0]%16;const t=Bd(n);return jd.test(t)?t:Li}catch{return Li}}function Bd(n){return Vd(n).substr(0,22)}/**
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
 */function Hn(n){return`${n.appName}!${n.appId}`}/**
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
 */const va=new Map;function Aa(n,e){const t=Hn(n);Sa(t,e),Hd(t,e)}function Sa(n,e){const t=va.get(n);if(t)for(const r of t)r(e)}function Hd(n,e){const t=Wd();t&&t.postMessage({key:n,fid:e}),qd()}let et=null;function Wd(){return!et&&"BroadcastChannel"in self&&(et=new BroadcastChannel("[Firebase] FID Change"),et.onmessage=n=>{Sa(n.data.key,n.data.fid)}),et}function qd(){va.size===0&&et&&(et.close(),et=null)}/**
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
 */const Gd="firebase-installations-database",zd=1,at="firebase-installations-store";let vi=null;function tr(){return vi||(vi=co(Gd,zd,{upgrade:(n,e)=>{switch(e){case 0:n.createObjectStore(at)}}})),vi}async function Ln(n,e){const t=Hn(n),s=(await tr()).transaction(at,"readwrite"),c=s.objectStore(at),h=await c.get(t);return await c.put(e,t),await s.done,(!h||h.fid!==e.fid)&&Aa(n,e.fid),e}async function ba(n){const e=Hn(n),r=(await tr()).transaction(at,"readwrite");await r.objectStore(at).delete(e),await r.done}async function Wn(n,e){const t=Hn(n),s=(await tr()).transaction(at,"readwrite"),c=s.objectStore(at),h=await c.get(t),u=e(h);return u===void 0?await c.delete(t):await c.put(u,t),await s.done,u&&(!h||h.fid!==u.fid)&&Aa(n,u.fid),u}/**
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
 */async function nr(n){let e;const t=await Wn(n.appConfig,r=>{const s=Kd(r),c=Jd(n,s);return e=c.registrationPromise,c.installationEntry});return t.fid===Li?{installationEntry:await e}:{installationEntry:t,registrationPromise:e}}function Kd(n){const e=n||{fid:$d(),registrationStatus:0};return Ca(e)}function Jd(n,e){if(e.registrationStatus===0){if(!navigator.onLine){const s=Promise.reject(ot.create("app-offline"));return{installationEntry:e,registrationPromise:s}}const t={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},r=Xd(n,t);return{installationEntry:t,registrationPromise:r}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:Yd(n)}:{installationEntry:e}}async function Xd(n,e){try{const t=await Fd(n,e);return Ln(n.appConfig,t)}catch(t){throw ma(t)&&t.customData.serverCode===409?await ba(n.appConfig):await Ln(n.appConfig,{fid:e.fid,registrationStatus:0}),t}}async function Yd(n){let e=await Ys(n.appConfig);for(;e.registrationStatus===1;)await Ta(100),e=await Ys(n.appConfig);if(e.registrationStatus===0){const{installationEntry:t,registrationPromise:r}=await nr(n);return r||t}return e}function Ys(n){return Wn(n,e=>{if(!e)throw ot.create("installation-not-found");return Ca(e)})}function Ca(n){return Qd(n)?{fid:n.fid,registrationStatus:0}:n}function Qd(n){return n.registrationStatus===1&&n.registrationTime+fa<Date.now()}/**
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
 */async function Zd({appConfig:n,heartbeatServiceProvider:e},t){const r=ef(n,t),s=Md(n,t),c=e.getImmediate({optional:!0});if(c){const E=await c.getHeartbeatsHeader();E&&s.append("x-firebase-client",E)}const h={installation:{sdkVersion:pa,appId:n.appId}},u={method:"POST",headers:s,body:JSON.stringify(h)},_=await Ea(()=>fetch(r,u));if(_.ok){const E=await _.json();return _a(E)}else throw await wa("Generate Auth Token",_)}function ef(n,{fid:e}){return`${ya(n)}/${e}/authTokens:generate`}/**
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
 */async function ir(n,e=!1){let t;const r=await Wn(n.appConfig,c=>{if(!Ra(c))throw ot.create("not-registered");const h=c.authToken;if(!e&&rf(h))return c;if(h.requestStatus===1)return t=tf(n,e),c;{if(!navigator.onLine)throw ot.create("app-offline");const u=of(c);return t=nf(n,u),u}});return t?await t:r.authToken}async function tf(n,e){let t=await Qs(n.appConfig);for(;t.authToken.requestStatus===1;)await Ta(100),t=await Qs(n.appConfig);const r=t.authToken;return r.requestStatus===0?ir(n,e):r}function Qs(n){return Wn(n,e=>{if(!Ra(e))throw ot.create("not-registered");const t=e.authToken;return af(t)?{...e,authToken:{requestStatus:0}}:e})}async function nf(n,e){try{const t=await Zd(n,e),r={...e,authToken:t};return await Ln(n.appConfig,r),t}catch(t){if(ma(t)&&(t.customData.serverCode===401||t.customData.serverCode===404))await ba(n.appConfig);else{const r={...e,authToken:{requestStatus:0}};await Ln(n.appConfig,r)}throw t}}function Ra(n){return n!==void 0&&n.registrationStatus===2}function rf(n){return n.requestStatus===2&&!sf(n)}function sf(n){const e=Date.now();return e<n.creationTime||n.creationTime+n.expiresIn<e+Nd}function of(n){const e={requestStatus:1,requestTime:Date.now()};return{...n,authToken:e}}function af(n){return n.requestStatus===1&&n.requestTime+fa<Date.now()}/**
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
 */async function cf(n){const e=n,{installationEntry:t,registrationPromise:r}=await nr(e);return r?r.catch(console.error):ir(e).catch(console.error),t.fid}/**
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
 */async function hf(n,e=!1){const t=n;return await lf(t),(await ir(t,e)).token}async function lf(n){const{registrationPromise:e}=await nr(n);e&&await e}/**
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
 */function uf(n){if(!n||!n.options)throw Ai("App Configuration");if(!n.name)throw Ai("App Name");const e=["projectId","apiKey","appId"];for(const t of e)if(!n.options[t])throw Ai(t);return{appName:n.name,projectId:n.options.projectId,apiKey:n.options.apiKey,appId:n.options.appId}}function Ai(n){return ot.create("missing-app-config-values",{valueName:n})}/**
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
 */const Pa="installations",df="installations-internal",ff=n=>{const e=n.getProvider("app").getImmediate(),t=uf(e),r=He(e,"heartbeat");return{app:e,appConfig:t,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},pf=n=>{const e=n.getProvider("app").getImmediate(),t=He(e,Pa).getImmediate();return{getId:()=>cf(t),getToken:s=>hf(t,s)}};function gf(){de(new oe(Pa,ff,"PUBLIC")),de(new oe(df,pf,"PRIVATE"))}gf();Z(da,er);Z(da,er,"esm2020");/**
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
 */const Mn="analytics",mf="firebase_id",yf="origin",_f=60*1e3,wf="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig",rr="https://www.googletagmanager.com/gtag/js";/**
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
 */const z=new Fn("@firebase/analytics");/**
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
 */const If={"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."},ne=new ht("analytics","Analytics",If);/**
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
 */function Ef(n){if(!n.startsWith(rr)){const e=ne.create("invalid-gtag-resource",{gtagURL:n});return z.warn(e.message),""}return n}function ka(n){return Promise.all(n.map(e=>e.catch(t=>t)))}function Tf(n,e){let t;return window.trustedTypes&&(t=window.trustedTypes.createPolicy(n,e)),t}function vf(n,e){const t=Tf("firebase-js-sdk-policy",{createScriptURL:Ef}),r=document.createElement("script"),s=`${rr}?l=${n}&id=${e}`;r.src=t?t?.createScriptURL(s):s,r.async=!0,document.head.appendChild(r)}function Af(n){let e=[];return Array.isArray(window[n])?e=window[n]:window[n]=e,e}async function Sf(n,e,t,r,s,c){const h=r[s];try{if(h)await e[h];else{const _=(await ka(t)).find(E=>E.measurementId===s);_&&await e[_.appId]}}catch(u){z.error(u)}n("config",s,c)}async function bf(n,e,t,r,s){try{let c=[];if(s&&s.send_to){let h=s.send_to;Array.isArray(h)||(h=[h]);const u=await ka(t);for(const _ of h){const E=u.find(b=>b.measurementId===_),A=E&&e[E.appId];if(A)c.push(A);else{c=[];break}}}c.length===0&&(c=Object.values(e)),await Promise.all(c),n("event",r,s||{})}catch(c){z.error(c)}}function Cf(n,e,t,r){async function s(c,...h){try{if(c==="event"){const[u,_]=h;await bf(n,e,t,u,_)}else if(c==="config"){const[u,_]=h;await Sf(n,e,t,r,u,_)}else if(c==="consent"){const[u,_]=h;n("consent",u,_)}else if(c==="get"){const[u,_,E]=h;n("get",u,_,E)}else if(c==="set"){const[u]=h;n("set",u)}else n(c,...h)}catch(u){z.error(u)}}return s}function Rf(n,e,t,r,s){let c=function(...h){window[r].push(arguments)};return window[s]&&typeof window[s]=="function"&&(c=window[s]),window[s]=Cf(c,n,e,t),{gtagCore:c,wrappedGtag:window[s]}}function Pf(n){const e=window.document.getElementsByTagName("script");for(const t of Object.values(e))if(t.src&&t.src.includes(rr)&&t.src.includes(n))return t;return null}/**
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
 */const kf=30,Nf=1e3;class Of{constructor(e={},t=Nf){this.throttleMetadata=e,this.intervalMillis=t}getThrottleMetadata(e){return this.throttleMetadata[e]}setThrottleMetadata(e,t){this.throttleMetadata[e]=t}deleteThrottleMetadata(e){delete this.throttleMetadata[e]}}const Na=new Of;function Df(n){return new Headers({Accept:"application/json","x-goog-api-key":n})}async function Lf(n){const{appId:e,apiKey:t}=n,r={method:"GET",headers:Df(t)},s=wf.replace("{app-id}",e),c=await fetch(s,r);if(c.status!==200&&c.status!==304){let h="";try{const u=await c.json();u.error?.message&&(h=u.error.message)}catch{}throw ne.create("config-fetch-failed",{httpStatus:c.status,responseMessage:h})}return c.json()}async function Mf(n,e=Na,t){const{appId:r,apiKey:s,measurementId:c}=n.options;if(!r)throw ne.create("no-app-id");if(!s){if(c)return{measurementId:c,appId:r};throw ne.create("no-api-key")}const h=e.getThrottleMetadata(r)||{backoffCount:0,throttleEndTimeMillis:Date.now()},u=new Ff;return setTimeout(async()=>{u.abort()},_f),Oa({appId:r,apiKey:s,measurementId:c},h,u,e)}async function Oa(n,{throttleEndTimeMillis:e,backoffCount:t},r,s=Na){const{appId:c,measurementId:h}=n;try{await Uf(r,e)}catch(u){if(h)return z.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${h} provided in the "measurementId" field in the local Firebase config. [${u?.message}]`),{appId:c,measurementId:h};throw u}try{const u=await Lf(n);return s.deleteThrottleMetadata(c),u}catch(u){const _=u;if(!xf(_)){if(s.deleteThrottleMetadata(c),h)return z.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${h} provided in the "measurementId" field in the local Firebase config. [${_?.message}]`),{appId:c,measurementId:h};throw u}const E=Number(_?.customData?.httpStatus)===503?hs(t,s.intervalMillis,kf):hs(t,s.intervalMillis),A={throttleEndTimeMillis:Date.now()+E,backoffCount:t+1};return s.setThrottleMetadata(c,A),z.debug(`Calling attemptFetch again in ${E} millis`),Oa(n,A,r,s)}}function Uf(n,e){return new Promise((t,r)=>{const s=Math.max(e-Date.now(),0),c=setTimeout(t,s);n.addEventListener(()=>{clearTimeout(c),r(ne.create("fetch-throttle",{throttleEndTimeMillis:e}))})})}function xf(n){if(!(n instanceof ce)||!n.customData)return!1;const e=Number(n.customData.httpStatus);return e===429||e===500||e===503||e===504}class Ff{constructor(){this.listeners=[]}addEventListener(e){this.listeners.push(e)}abort(){this.listeners.forEach(e=>e())}}async function Vf(n,e,t,r,s){if(s&&s.global){n("event",t,r);return}else{const c=await e,h={...r,send_to:c};n("event",t,h)}}async function jf(n,e,t,r){if(r&&r.global){const s={};for(const c of Object.keys(t))s[`user_properties.${c}`]=t[c];return n("set",s),Promise.resolve()}else{const s=await e;n("config",s,{update:!0,user_properties:t})}}/**
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
 */async function $f(){if(_o())try{await wo()}catch(n){return z.warn(ne.create("indexeddb-unavailable",{errorInfo:n?.toString()}).message),!1}else return z.warn(ne.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;return!0}async function Bf(n,e,t,r,s,c,h){const u=Mf(n);u.then(v=>{t[v.measurementId]=v.appId,n.options.measurementId&&v.measurementId!==n.options.measurementId&&z.warn(`The measurement ID in the local Firebase config (${n.options.measurementId}) does not match the measurement ID fetched from the server (${v.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)}).catch(v=>z.error(v)),e.push(u);const _=$f().then(v=>{if(v)return r.getId()}),[E,A]=await Promise.all([u,_]);Pf(c)||vf(c,E.measurementId),s("js",new Date);const b=h?.config??{};return b[yf]="firebase",b.update=!0,A!=null&&(b[mf]=A),s("config",E.measurementId,b),E.measurementId}/**
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
 */class Hf{constructor(e){this.app=e}_delete(){return delete wt[this.app.options.appId],Promise.resolve()}}let wt={},Zs=[];const eo={};let Si="dataLayer",Wf="gtag",to,sr,no=!1;function qf(){const n=[];if(yo()&&n.push("This is a browser extension environment."),Oc()||n.push("Cookies are not available."),n.length>0){const e=n.map((r,s)=>`(${s+1}) ${r}`).join(" "),t=ne.create("invalid-analytics-context",{errorInfo:e});z.warn(t.message)}}function Gf(n,e,t){qf();const r=n.options.appId;if(!r)throw ne.create("no-app-id");if(!n.options.apiKey)if(n.options.measurementId)z.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${n.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);else throw ne.create("no-api-key");if(wt[r]!=null)throw ne.create("already-exists",{id:r});if(!no){Af(Si);const{wrappedGtag:c,gtagCore:h}=Rf(wt,Zs,eo,Si,Wf);sr=c,to=h,no=!0}return wt[r]=Bf(n,Zs,eo,e,to,Si,t),new Hf(n)}function bp(n=Vn()){n=J(n);const e=He(n,Mn);return e.isInitialized()?e.getImmediate():zf(n)}function zf(n,e={}){const t=He(n,Mn);if(t.isInitialized()){const s=t.getImmediate();if($e(e,t.getOptions()))return s;throw ne.create("already-initialized")}return t.initialize({options:e})}function Kf(n,e,t){n=J(n),jf(sr,wt[n.app.options.appId],e,t).catch(r=>z.error(r))}function Jf(n,e,t,r){n=J(n),Vf(sr,wt[n.app.options.appId],e,t,r).catch(s=>z.error(s))}const io="@firebase/analytics",ro="0.10.19";function Xf(){de(new oe(Mn,(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("installations-internal").getImmediate();return Gf(r,s,t)},"PUBLIC")),de(new oe("analytics-internal",n,"PRIVATE")),Z(io,ro),Z(io,ro,"esm2020");function n(e){try{const t=e.getProvider(Mn).getImmediate();return{logEvent:(r,s,c)=>Jf(t,r,s,c),setUserProperties:(r,s)=>Kf(t,r,s)}}catch(t){throw ne.create("interop-component-reg-failed",{reason:t})}}}Xf();/**
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
 */const Yf="type.googleapis.com/google.protobuf.Int64Value",Qf="type.googleapis.com/google.protobuf.UInt64Value";function Da(n,e){const t={};for(const r in n)n.hasOwnProperty(r)&&(t[r]=e(n[r]));return t}function Un(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(e=>Un(e));if(typeof n=="function"||typeof n=="object")return Da(n,e=>Un(e));throw new Error("Data cannot be encoded in JSON: "+n)}function Et(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case Yf:case Qf:{const e=Number(n.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+n);return e}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(e=>Et(e)):typeof n=="function"||typeof n=="object"?Da(n,e=>Et(e)):n}/**
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
 */const or="functions";/**
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
 */const so={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class Q extends ce{constructor(e,t,r){super(`${or}/${e}`,t||""),this.details=r,Object.setPrototypeOf(this,Q.prototype)}}function Zf(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function xn(n,e){let t=Zf(n),r=t,s;try{const c=e&&e.error;if(c){const h=c.status;if(typeof h=="string"){if(!so[h])return new Q("internal","internal");t=so[h],r=h}const u=c.message;typeof u=="string"&&(r=u),s=c.details,s!==void 0&&(s=Et(s))}}catch{}return t==="ok"?null:new Q(t,r,s)}/**
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
 */class ep{constructor(e,t,r,s){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,Y(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||t.get().then(c=>this.auth=c,()=>{}),this.messaging||r.get().then(c=>this.messaging=c,()=>{}),this.appCheck||s?.get().then(c=>this.appCheck=c,()=>{})}async getAuthToken(){if(this.auth)try{return(await this.auth.getToken())?.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),r=await this.getMessagingToken(),s=await this.getAppCheckToken(e);return{authToken:t,messagingToken:r,appCheckToken:s}}}/**
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
 */const Mi="us-central1",tp=/^data: (.*?)(?:\n|$)/;function np(n){let e=null;return{promise:new Promise((t,r)=>{e=setTimeout(()=>{r(new Q("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{e&&clearTimeout(e)}}}class ip{constructor(e,t,r,s,c=Mi,h=(...u)=>fetch(...u)){this.app=e,this.fetchImpl=h,this.emulatorOrigin=null,this.contextProvider=new ep(e,t,r,s),this.cancelAllRequests=new Promise(u=>{this.deleteService=()=>Promise.resolve(u())});try{const u=new URL(c);this.customDomain=u.origin+(u.pathname==="/"?"":u.pathname),this.region=Mi}catch{this.customDomain=null,this.region=c}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function rp(n,e,t){const r=ct(e);n.emulatorOrigin=`http${r?"s":""}://${e}:${t}`,r&&(xi(n.emulatorOrigin+"/backends"),Fi("Functions",!0))}function sp(n,e,t){const r=s=>ap(n,e,s,{});return r.stream=(s,c)=>hp(n,e,s,c),r}function La(n){return n.emulatorOrigin&&ct(n.emulatorOrigin)?"include":void 0}async function op(n,e,t,r,s){t["Content-Type"]="application/json";let c;try{c=await r(n,{method:"POST",body:JSON.stringify(e),headers:t,credentials:La(s)})}catch{return{status:0,json:null}}let h=null;try{h=await c.json()}catch{}return{status:c.status,json:h}}async function Ma(n,e){const t={},r=await n.contextProvider.getContext(e.limitedUseAppCheckTokens);return r.authToken&&(t.Authorization="Bearer "+r.authToken),r.messagingToken&&(t["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=r.appCheckToken),t}function ap(n,e,t,r){const s=n._url(e);return cp(n,s,t,r)}async function cp(n,e,t,r){t=Un(t);const s={data:t},c=await Ma(n,r),h=r.timeout||7e4,u=np(h),_=await Promise.race([op(e,s,c,n.fetchImpl,n),u.promise,n.cancelAllRequests]);if(u.cancel(),!_)throw new Q("cancelled","Firebase Functions instance was deleted.");const E=xn(_.status,_.json);if(E)throw E;if(!_.json)throw new Q("internal","Response is not valid JSON object.");let A=_.json.data;if(typeof A>"u"&&(A=_.json.result),typeof A>"u")throw new Q("internal","Response is missing data field.");return{data:Et(A)}}function hp(n,e,t,r){const s=n._url(e);return lp(n,s,t,r||{})}async function lp(n,e,t,r){t=Un(t);const s={data:t},c=await Ma(n,r);c["Content-Type"]="application/json",c.Accept="text/event-stream";let h;try{h=await n.fetchImpl(e,{method:"POST",body:JSON.stringify(s),headers:c,signal:r?.signal,credentials:La(n)})}catch(v){if(v instanceof Error&&v.name==="AbortError"){const D=new Q("cancelled","Request was cancelled.");return{data:Promise.reject(D),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(D)}}}}}}const O=xn(0,null);return{data:Promise.reject(O),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(O)}}}}}}let u,_;const E=new Promise((v,O)=>{u=v,_=O});r?.signal?.addEventListener("abort",()=>{const v=new Q("cancelled","Request was cancelled.");_(v)});const A=h.body.getReader(),b=up(A,u,_,r?.signal);return{stream:{[Symbol.asyncIterator](){const v=b.getReader();return{async next(){const{value:O,done:D}=await v.read();return{value:O,done:D}},async return(){return await v.cancel(),{done:!0,value:void 0}}}}},data:E}}function up(n,e,t,r){const s=(h,u)=>{const _=h.match(tp);if(!_)return;const E=_[1];try{const A=JSON.parse(E);if("result"in A){e(Et(A.result));return}if("message"in A){u.enqueue(Et(A.message));return}if("error"in A){const b=xn(0,A);u.error(b),t(b);return}}catch(A){if(A instanceof Q){u.error(A),t(A);return}}},c=new TextDecoder;return new ReadableStream({start(h){let u="";return _();async function _(){if(r?.aborted){const E=new Q("cancelled","Request was cancelled");return h.error(E),t(E),Promise.resolve()}try{const{value:E,done:A}=await n.read();if(A){u.trim()&&s(u.trim(),h),h.close();return}if(r?.aborted){const v=new Q("cancelled","Request was cancelled");h.error(v),t(v),await n.cancel();return}u+=c.decode(E,{stream:!0});const b=u.split(`
`);u=b.pop()||"";for(const v of b)v.trim()&&s(v.trim(),h);return _()}catch(E){const A=E instanceof Q?E:xn(0,null);h.error(A),t(A)}}},cancel(){return n.cancel()}})}const oo="@firebase/functions",ao="0.13.1";/**
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
 */const dp="auth-internal",fp="app-check-internal",pp="messaging-internal";function gp(n){const e=(t,{instanceIdentifier:r})=>{const s=t.getProvider("app").getImmediate(),c=t.getProvider(dp),h=t.getProvider(pp),u=t.getProvider(fp);return new ip(s,c,h,u,r)};de(new oe(or,e,"PUBLIC").setMultipleInstances(!0)),Z(oo,ao,n),Z(oo,ao,"esm2020")}/**
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
 */function Cp(n=Vn(),e=Mi){const r=He(J(n),or).getImmediate({identifier:e}),s=po("functions");return s&&mp(r,...s),r}function mp(n,e,t){rp(J(n),e,t)}function Rp(n,e,t){return sp(J(n),e)}gp();export{xe as G,Sp as a,Cp as b,bp as c,vp as d,Tp as e,wp as f,Ap as g,_p as h,Nh as i,Rp as j,Ip as o,Ep as s};
