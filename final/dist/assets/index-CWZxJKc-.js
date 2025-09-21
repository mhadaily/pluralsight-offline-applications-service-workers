(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();const C="modulepreload",I=function(i){return"/"+i},f={},p=function(e,t,s){let r=Promise.resolve();if(t&&t.length>0){let b=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),c=n?.nonce||n?.getAttribute("nonce");r=b(t.map(d=>{if(d=I(d),d in f)return;f[d]=!0;const u=d.endsWith(".css"),m=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${m}`))return;const l=document.createElement("link");if(l.rel=u?"stylesheet":C,u||(l.as="script"),l.crossOrigin="",l.href=d,c&&l.setAttribute("nonce",c),document.head.appendChild(l),u)return new Promise((S,A)=>{l.addEventListener("load",S),l.addEventListener("error",()=>A(new Error(`Unable to preload CSS for ${d}`)))})}))}function a(n){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=n,window.dispatchEvent(c),!c.defaultPrevented)throw n}return r.then(n=>{for(const c of n||[])c.status==="rejected"&&a(c.reason);return e().catch(a)})},v={M1_C3_LIFECYCLE:!1,M1_C4_REGISTER_ACTIVATE:!1,M1_C5_INTERCEPT:!1,M2_C1_CACHE_API:!1,M2_C2_CACHING_STRATEGIES:!1,M2_C3_APPLY_STRATEGIES:!1,M2_C4_INDEXEDDB_INTRO:!1,M2_C5_INDEXEDDB_DEMO:!1,M3_C1_APP_SHELL:!1,M3_C2_NAV_PRELOAD:!1,M3_C3_OFFLINE_FALLBACK:!1,M3_C4_UPDATES_BROADCAST:!1,M3_C5_CLEANUP_UNREGISTER:!1,M4_C1_WHY_WORKBOX:!1,M4_C2_WB_PRECACHING:!1,M4_C3_WB_RUNTIME:!1,M4_C4_WB_NAV_FALLBACK:!1,M5_C1_BACKGROUND_SYNC:!1,M5_C2_PERIODIC_SYNC:!1,M5_C3_STREAMS:!1},g={APP_NAME:"Travel Planner",VERSION:"1.0.0",API_BASE:"/api",CACHE_PREFIX:"tp",IDB_NAME:"travel-planner-db",IDB_VERSION:1,SW_ENABLED:!1},w=Object.freeze(Object.defineProperty({__proto__:null,CONFIG:g,FEATURES:v},Symbol.toStringTag,{value:"Module"}));let D=0;function o(i,e="info",t=4e3){const s=document.getElementById("toast-container");if(!s)return;const r=`toast-${++D}`,a={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"},n=document.createElement("div");return n.id=r,n.className=`toast toast-${e}`,n.innerHTML=`
    <span class="toast-icon">${a[e]||a.info}</span>
    <div class="toast-content">
      <div class="toast-message">${i}</div>
    </div>
  `,s.appendChild(n),setTimeout(()=>{y(r)},t),n.addEventListener("click",()=>{y(r)}),r}function y(i){const e=document.getElementById(i);e&&(e.style.animation="toast-enter 0.3s ease reverse",setTimeout(()=>{e.remove()},300))}function L(){const i=document.getElementById("loading");i&&i.classList.remove("hidden")}function E(){const i=document.getElementById("loading");i&&i.classList.add("hidden")}function k(i){document.querySelectorAll(".nav-link").forEach(t=>{t.classList.remove("active"),(t.dataset.route===i||i==="home"&&t.dataset.route==="home"||i===""&&t.dataset.route==="home")&&t.classList.add("active")})}function _(i){const e=document.getElementById("main-content");e&&(e.innerHTML=i)}class R{constructor(){this.routes={"":"home",home:"home",ideas:"ideas",deals:"deals",streams:"streams",settings:"settings"},this.appReady=!1,window.addEventListener("app-ready",()=>{this.appReady=!0})}async waitForApp(){if(this.appReady&&window.travelApp)return;if(window.travelApp&&Array.isArray(window.travelApp.ideas)){this.appReady=!0;return}console.log("⏳ Waiting for app to be ready...");const e=5e3,t=Date.now();for(;!this.appReady||!window.travelApp;){if(Date.now()-t>e){console.warn("⚠️ App initialization timeout");break}if(await new Promise(s=>setTimeout(s,100)),window.travelApp&&Array.isArray(window.travelApp.ideas)){this.appReady=!0,console.log("✅ App found and ready with data");break}}}navigate(e){e=e.replace(/^\//,""),window.history.pushState({},"",`#/${e}`),this.handleRoute()}async handleRoute(){const t=window.location.hash.substring(1).replace(/^\//,"")||"home";k(t),await this.loadView(t)}async loadView(e){const t=this.routes[e]||"home";try{const s=`/views/${t}.html`,r=await fetch(s);if(!r.ok)throw new Error(`Failed to load view: ${s}`);let a=await r.text();a=await this.processViewContent(t,a),_(a),await this.setupViewEvents(t)}catch(s){console.error("❌ Failed to load view:",s),this.renderErrorView(e)}}async processViewContent(e,t){switch(e){case"home":return this.processHomeView(t);case"ideas":return this.processIdeasView(t);case"deals":return this.processDealsView(t);case"streams":return this.processStreamsView(t);case"settings":return this.processSettingsView(t);default:return t}}async processHomeView(e){return e.replace("{{STATS}}",`
      <div class="grid grid-cols-3">
        <div class="card text-center">
          <div class="card-content">
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;">🌍</h3>
            <p style="font-size: 0.875rem; color: var(--text-secondary);">Countries Explored</p>
            <p style="font-size: 1.5rem; font-weight: 600;">12</p>
          </div>
        </div>
        <div class="card text-center">
          <div class="card-content">
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;">✈️</h3>
            <p style="font-size: 0.875rem; color: var(--text-secondary);">Trips Planned</p>
            <p style="font-size: 1.5rem; font-weight: 600;">28</p>
          </div>
        </div>
        <div class="card text-center">
          <div class="card-content">
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;">💰</h3>
            <p style="font-size: 0.875rem; color: var(--text-secondary);">Money Saved</p>
            <p style="font-size: 1.5rem; font-weight: 600;">$2,450</p>
          </div>
        </div>
      </div>
    `)}async processIdeasView(e){console.log("🔄 Processing ideas view..."),await this.waitForApp();const t=window.travelApp;let s=[],r="💾 Stored locally with offline access";if(t)try{console.log("📋 Getting ideas from app..."),console.log("📊 App ideas array:",t.ideas),s=await t.getIdeas(),console.log(`✅ Got ${s.length} ideas:`,s);const{FEATURES:n}=await p(async()=>{const{FEATURES:c}=await Promise.resolve().then(()=>w);return{FEATURES:c}},void 0);n.M2_C5_INDEXEDDB_DEMO?r="🗄️ Stored in IndexedDB with advanced features":r="💾 Stored locally with offline access"}catch(n){console.error("❌ Failed to get ideas:",n),s=[],r="⚠️ Storage unavailable"}else console.warn("⚠️ App not available in processIdeasView"),r="⏳ Loading storage...";const a=s.length>0?s.map((n,c)=>`
          <div class="card fade-in" style="animation-delay: ${c*.1}s;">
            <div class="card-content">
              <p style="color: var(--text-primary); font-weight: 500; margin-bottom: 0.5rem;">${n.text}</p>
            </div>
            <div class="card-footer" style="border-top: 1px solid var(--border-light); padding-top: 0.75rem;">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Added ${this.formatDate(n.timestamp)}</small>
            </div>
          </div>
        `).join(""):`<div class="card text-center high-contrast fade-in">
               <div class="card-content">
                 <div style="font-size: 3rem; margin-bottom: 1rem;">💡</div>
                 <h3 style="color: var(--text-primary); margin-bottom: 1rem;">No travel ideas yet</h3>
                 <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Start planning your next adventure by adding your first travel idea above!</p>
                 <div style="background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1rem; font-size: 0.875rem;">
                   <strong style="color: var(--text-primary);">💭 Need inspiration?</strong><br>
                   <span style="color: var(--text-secondary);">Try: "Weekend getaway to mountains", "Food tour in Tokyo", or "Beach vacation in Greece"</span>
                 </div>
               </div>
             </div>`;return e.replace("{{IDEAS}}",a).replace("{{STORAGE_INFO}}",r)}async processDealsView(e){try{const{default:t}=await p(async()=>{const{default:a}=await import("./deals-DRAHnOZP.js");return{default:a}},[]),s=await t.getDeals(),r=s.length>0?s.map((a,n)=>`
            <div class="card card-interactive fade-in" style="animation-delay: ${n*.1}s;">
              <div class="card-header">
                <h3 class="card-title">${a.title}</h3>
                ${a.discountPercentage>0?`<span style="background: var(--error); color: white; padding: 0.25rem 0.5rem; border-radius: var(--border-radius); font-size: 0.75rem; font-weight: 600;">
                    ${a.discountPercentage}% OFF
                  </span>`:""}
              </div>
              <div class="card-content">
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${a.description}</p>
                ${a.destination?`<p style="color: var(--text-primary); font-weight: 500; margin-bottom: 0.5rem;">📍 ${a.destination}</p>`:""}
                ${a.rating>0?`<p style="color: var(--text-muted); font-size: 0.875rem;">⭐ ${a.rating}/5 (${a.reviewCount} reviews)</p>`:""}
              </div>
              <div class="card-footer">
                <div>
                  ${a.originalPrice&&a.originalPrice>a.price?`<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.875rem;">$${a.originalPrice}</span><br>`:""}
                  <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">$${a.price}</span>
                </div>
                <button class="btn btn-primary btn-sm">Book Now</button>
              </div>
            </div>
          `).join(""):`<div class="card text-center high-contrast fade-in">
               <div class="card-content">
                 <div style="font-size: 3rem; margin-bottom: 1rem;">🏝️</div>
                 <h3 style="color: var(--text-primary); margin-bottom: 1rem;">No deals available</h3>
                 <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Check back later for amazing travel deals!</p>
                 <div style="background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1rem; font-size: 0.875rem;">
                   <strong style="color: var(--text-primary);">🔔 Want notifications?</strong><br>
                   <span style="color: var(--text-secondary);">We'll notify you when new deals are available</span>
                 </div>
               </div>
             </div>`;return e.replace("{{DEALS}}",r)}catch(t){console.error("❌ Failed to load deals:",t);const s=`
        <div class="card text-center high-contrast">
          <div class="card-content">
            <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--error);">⚠️</div>
            <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Unable to load deals</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
              ${navigator.onLine?"There was a problem connecting to our servers. Please try again.":"You appear to be offline. Please check your connection and try again."}
            </p>
            <button class="btn btn-primary" onclick="window.location.reload()">
              🔄 Try Again
            </button>
          </div>
        </div>`;return e.replace("{{DEALS}}",s)}}async processStreamsView(e){return e.replace("{{STREAM_EXAMPLES}}",`
      <div class="grid grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">HTML Streaming</h3>
          </div>
          <div class="card-content">
            <p>Experience server-side rendering with streaming HTML responses.</p>
          </div>
          <div class="card-footer">
            <a href="/stream/html" class="btn btn-primary btn-sm" target="_blank">Try Demo</a>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Data Streaming</h3>
          </div>
          <div class="card-content">
            <p>Watch data load progressively with streaming APIs.</p>
          </div>
          <div class="card-footer">
            <button class="btn btn-secondary btn-sm" disabled>Coming Soon</button>
          </div>
        </div>
      </div>
    `)}async processSettingsView(e){await this.waitForApp();const t=window.travelApp,s=t?t.getStatus():{online:navigator.onLine},r=`
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">App Status</h3>
        </div>
        <div class="card-content">
          <p><strong>Online:</strong> ${s.online?"✅ Yes":"❌ No"}</p>
          <p><strong>Service Worker:</strong> ${s.serviceWorker?.registered?"✅ Registered":"❌ Not registered"}</p>
          ${s.serviceWorker?.scope?`<p><strong>SW Scope:</strong> ${s.serviceWorker.scope}</p>`:""}
          <p><strong>Ideas Count:</strong> ${s.ideas||0}</p>
        </div>
      </div>
    `;return e.replace("{{STATUS}}",r)}async setupViewEvents(e){switch(e){case"ideas":this.setupIdeasEvents();break;case"deals":this.setupDealsEvents();break;case"settings":this.setupSettingsEvents();break}}setupDealsEvents(){const e=document.getElementById("connection-status");if(e&&e.classList.contains("loading-text")){let t=function(){navigator.onLine?e.textContent="Online - Fresh deals":e.textContent="Offline - Cached deals"};e.classList.remove("loading-text"),t(),window.addEventListener("online",t),window.addEventListener("offline",t)}}setupIdeasEvents(){this.updateStorageInfo();const e=document.getElementById("idea-form"),t=document.getElementById("idea-input");e&&t&&e.addEventListener("submit",async r=>{r.preventDefault();const a=t.value.trim();if(a)try{const n=window.travelApp;n&&(await n.addIdea(a),t.value="",await this.loadView("ideas"))}catch(n){console.error("❌ Failed to add idea:",n)}});const s=document.getElementById("clear-ideas");s&&s.addEventListener("click",async()=>{if(confirm("Are you sure you want to clear all ideas?"))try{const r=window.travelApp;r&&(await r.clearIdeas(),await this.loadView("ideas"))}catch(r){console.error("❌ Failed to clear ideas:",r)}})}async updateStorageInfo(){const e=document.getElementById("storage-info");if(e)try{const{FEATURES:t}=await p(async()=>{const{FEATURES:s}=await Promise.resolve().then(()=>w);return{FEATURES:s}},void 0);t.M2_C5_INDEXEDDB_DEMO?e.textContent="🗄️ Stored in IndexedDB with advanced features":e.textContent="💾 Stored locally with offline access"}catch(t){console.error("❌ Failed to update storage info:",t),e.textContent="💾 Stored locally with offline access"}}setupSettingsEvents(){}renderErrorView(e){const t=`
      <div class="container">
        <div class="card text-center">
          <div class="card-content">
            <h2>Page Not Found</h2>
            <p>The page "${e}" could not be found.</p>
            <a href="#/" class="btn btn-primary">Go Home</a>
          </div>
        </div>
      </div>
    `;_(t)}formatDate(e){const t=new Date(e),r=new Date-t,a=Math.floor(r/(1e3*60*60*24));return a===0?"today":a===1?"yesterday":a<7?`${a} days ago`:t.toLocaleDateString()}}const h=new R;class B{constructor(){this.swRegistration=null,this.updateChannel=null,this.ideas=[],this.isOnline=navigator.onLine,this.init()}async init(){try{L(),await this.setupEventListeners(),g.SW_ENABLED?(console.log("🚀 Service Worker enabled, registering..."),await this.registerServiceWorker(),await this.setupBroadcastChannel()):console.log("⏸️ Service Worker disabled in config, starting without offline functionality"),await this.loadInitialData(),await this.initializeRouter(),E(),console.log("✅ Travel Planner initialized successfully (SW enabled:",g.SW_ENABLED,")")}catch(e){console.error("❌ App initialization failed:",e),E()}}async registerServiceWorker(){if(!("serviceWorker"in navigator)){console.warn("⚠️ Service Worker not supported");return}try{const e=await navigator.serviceWorker.register("/sw.js",{scope:"/"});this.swRegistration=e,console.log("✅ Service Worker registered:",{scope:e.scope,active:!!e.active,waiting:!!e.waiting,installing:!!e.installing}),e.addEventListener("updatefound",()=>{console.log("🔄 Service Worker update found");const t=e.installing;t&&t.addEventListener("statechange",()=>{t.state==="installed"&&navigator.serviceWorker.controller&&(console.log("📦 New Service Worker installed, waiting to activate"),this.showUpdateBanner())})}),e.waiting&&this.showUpdateBanner()}catch(e){console.error("❌ Service Worker registration failed:",e)}}async setupBroadcastChannel(){if(!("BroadcastChannel"in window)){console.warn("⚠️ BroadcastChannel not supported");return}this.updateChannel=new BroadcastChannel("sw-updates"),this.updateChannel.addEventListener("message",e=>{const{type:t,data:s}=e.data;switch(t){case"SW_UPDATED":console.log("📡 Received SW update notification"),this.showUpdateBanner();break;case"CACHE_UPDATED":console.log("📡 Cache updated:",s);break;case"OFFLINE_READY":o("App is ready for offline use","success");break;default:console.log("📡 Unknown message:",e.data)}})}async setupEventListeners(){window.addEventListener("online",()=>{this.isOnline=!0,o("You are back online","success"),console.log("🌐 App is online")}),window.addEventListener("offline",()=>{this.isOnline=!1,o("You are now offline","warning"),console.log("📴 App is offline")}),document.getElementById("update-btn")?.addEventListener("click",()=>{this.activateUpdate()}),document.getElementById("dismiss-update")?.addEventListener("click",()=>{this.hideUpdateBanner()}),document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#update-btn")){e.preventDefault(),this.activateUpdate();return}e.target.closest&&e.target.closest("#dismiss-update")&&(e.preventDefault(),this.hideUpdateBanner())}),this.setupSettingsControls()}setTheme(e){try{e==="dark"?(document.documentElement.setAttribute("data-theme","dark"),localStorage.setItem("theme","dark")):e==="light"?(document.documentElement.setAttribute("data-theme","light"),localStorage.setItem("theme","light")):(document.documentElement.removeAttribute("data-theme"),localStorage.removeItem("theme"))}catch{}}toggleTheme(){const e=document.documentElement.getAttribute("data-theme")==="dark";this.setTheme(e?"light":"dark"),o(e?"Switched to light theme":"Switched to dark theme","info")}setupSettingsControls(){document.addEventListener("click",async e=>{e.target.id==="clear-caches"&&(e.preventDefault(),await this.clearCaches()),e.target.id==="unregister-sw"&&(e.preventDefault(),await this.unregisterServiceWorker())})}async initializeRouter(){await h.handleRoute(),window.addEventListener("popstate",()=>{h.handleRoute()}),document.addEventListener("click",e=>{const t=e.target.closest('a[href^="#"]');if(t){e.preventDefault();const s=t.getAttribute("href").substring(1);h.navigate(s)}})}async loadInitialData(){try{this.ideas=[{id:1,text:"Weekend in Paris",timestamp:Date.now()-864e5},{id:2,text:"Hiking in the Alps",timestamp:Date.now()-1728e5},{id:3,text:"Beach vacation in Bali",timestamp:Date.now()-2592e5}],console.log("📊 Initial data loaded")}catch(e){console.error("❌ Failed to load initial data:",e)}}async getIdeas(){if(v.M2_C5_INDEXEDDB_DEMO){const{getAllIdeas:e}=await p(async()=>{const{getAllIdeas:t}=await import("./idb-CsRoBHlt.js");return{getAllIdeas:t}},[]);return await e()}return this.ideas}async addIdea(e){if(v.M2_C5_INDEXEDDB_DEMO){const{addIdea:s}=await p(async()=>{const{addIdea:r}=await import("./idb-CsRoBHlt.js");return{addIdea:r}},[]);return await s(e)}const t={id:Date.now(),text:e,timestamp:Date.now()};return this.ideas.unshift(t),t}async clearIdeas(){if(v.M2_C5_INDEXEDDB_DEMO){const{clearIdeas:e}=await p(async()=>{const{clearIdeas:t}=await import("./idb-CsRoBHlt.js");return{clearIdeas:t}},[]);await e()}else this.ideas=[]}showUpdateBanner(){const e=document.getElementById("update-banner");e&&e.classList.remove("hidden")}hideUpdateBanner(){const e=document.getElementById("update-banner");e&&e.classList.add("hidden")}async activateUpdate(){try{const e=document.getElementById("update-btn"),t=document.getElementById("update-banner");if(e&&(e.disabled=!0,e.textContent="Activating..."),t&&t.classList.add("animate-pulse"),this.swRegistration?.waiting){this.swRegistration.waiting.postMessage({type:"SKIP_WAITING"});const s=5e3;let r=!1;await Promise.race([new Promise(a=>{function n(){navigator.serviceWorker.removeEventListener("controllerchange",n),a()}navigator.serviceWorker.addEventListener("controllerchange",n)}),new Promise(a=>setTimeout(()=>{r=!0,a()},s))]),r?(console.warn("⚠️ Controller change timed out, reloading as fallback"),o("Activated update (fallback reload)","info")):o("Update activated — reloading","success"),t&&t.classList.add("hidden"),window.location.reload()}else t&&t.classList.add("hidden"),window.location.reload()}catch(e){console.error("❌ Failed to activate update:",e),o("Failed to activate update — reloading","error"),window.location.reload()}}async clearCaches(){try{if(this.swRegistration?.active)this.swRegistration.active.postMessage({type:"CLEAR_CACHES"}),o("All caches cleared successfully","success"),console.log("🧹 Caches cleared");else{const e=await caches.keys();await Promise.all(e.map(t=>caches.delete(t))),o("Caches cleared (direct)","success")}}catch(e){console.error("❌ Failed to clear caches:",e),o("Failed to clear caches","error")}}async enableServiceWorker(){if(this.swRegistration){console.log("⚠️ Service Worker already registered"),o("Service Worker already enabled","info");return}try{console.log("🚀 Enabling Service Worker..."),await this.registerServiceWorker(),await this.setupBroadcastChannel(),g.SW_ENABLED=!0,o("Service Worker enabled successfully","success"),console.log("✅ Service Worker enabled")}catch(e){console.error("❌ Failed to enable Service Worker:",e),o("Failed to enable Service Worker","error")}}async unregisterServiceWorker(){try{this.swRegistration&&(await this.swRegistration.unregister(),o("Service Worker unregistered","success"),console.log("🗑️ Service Worker unregistered"),setTimeout(()=>window.location.reload(),1e3))}catch(e){console.error("❌ Failed to unregister SW:",e),o("Failed to unregister Service Worker","error")}}getStatus(){return{online:this.isOnline,serviceWorker:{registered:!!this.swRegistration,scope:this.swRegistration?.scope,state:this.swRegistration?.active?.state},features:v,ideas:this.ideas.length}}}document.addEventListener("DOMContentLoaded",async()=>{try{window.travelApp=new B,console.log("✅ App initialization complete"),window.dispatchEvent(new CustomEvent("app-ready"))}catch(i){console.error("❌ Failed to initialize app:",i)}});export{g as C};
