(function () {
  "use strict";
  var PIXEL_ID = "1177058371863384";
  var KEY = "pt_privacy_choice_v1";
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  function loadPixel() {
    if (window.__ptPixelLoaded) return;
    window.__ptPixelLoaded = true;
    !function(f,b,e,v,n,t,s) {
      if(f.fbq)return;
      n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];
      t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function schedulePixel() {
    // Let the page finish responding to the visitor before loading third-party tracking.
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadPixel, { timeout: 4000 });
    } else {
      window.setTimeout(loadPixel, 1800);
    }
  }

  function addStyles() {
    if (document.getElementById("pt-privacy-styles")) return;
    var style = document.createElement("style");
    style.id = "pt-privacy-styles";
    style.textContent = [
      "#pt-cookie-banner{position:fixed;z-index:99999;left:22px;bottom:22px;width:min(510px,calc(100vw - 28px));padding:22px 22px 18px;background:rgba(12,13,16,.97);color:#f7f7f8;border:1px solid rgba(255,255,255,.13);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.32);font-family:Arial,Helvetica,sans-serif;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}",
      "#pt-cookie-banner[hidden]{display:none}",
      "#pt-cookie-banner .pt-cookie-top{display:flex;align-items:center;gap:9px;margin-bottom:10px}",
      "#pt-cookie-banner .pt-cookie-mark{width:9px;height:9px;border-radius:50%;background:#e00000;box-shadow:0 0 0 5px rgba(224,0,0,.13)}",
      "#pt-cookie-banner .pt-cookie-brand{font-size:10px;font-weight:900;letter-spacing:1.7px;color:#ff5a5a;text-transform:uppercase}",
      "#pt-cookie-banner h2{margin:0 0 8px;color:#fff;font-size:19px;line-height:1.25;font-weight:800;letter-spacing:-.3px}",
      "#pt-cookie-banner p{margin:0;color:#c5c7cc;font-size:13px;line-height:1.55}",
      "#pt-cookie-banner a{color:#fff;text-decoration:underline;text-underline-offset:3px}",
      "#pt-cookie-banner .pt-cookie-actions{display:flex;gap:9px;margin-top:17px}",
      "#pt-cookie-banner button,#pt-cookie-settings{min-height:42px;border-radius:8px;padding:0 15px;font-size:12px;font-weight:800;cursor:pointer}",
      "#pt-cookie-banner .pt-cookie-accept{background:#e00000;border:1px solid #e00000;color:#fff;flex:1}",
      "#pt-cookie-banner .pt-cookie-accept:hover{background:#bd0000}",
      "#pt-cookie-banner .pt-cookie-reject{background:transparent;border:1px solid #555;color:#f2f2f2;flex:1}",
      "#pt-cookie-banner .pt-cookie-reject:hover{background:#25272b}",
      "#pt-cookie-settings{position:fixed;z-index:99998;left:18px;bottom:16px;min-height:34px;padding:0 12px;background:#111;color:#ddd;border:1px solid #444;border-radius:999px;font-size:10px;box-shadow:0 4px 16px rgba(0,0,0,.18)}",
      "#pt-cookie-settings:hover{border-color:#e00000;color:#fff}",
      "@media(max-width:560px){#pt-cookie-banner{left:10px;bottom:10px;width:calc(100vw - 20px);padding:18px;border-radius:14px}#pt-cookie-banner h2{font-size:17px}#pt-cookie-banner p{font-size:12px}#pt-cookie-banner .pt-cookie-actions{gap:7px}#pt-cookie-banner button{padding:0 9px;font-size:11px}#pt-cookie-settings{left:10px;bottom:10px}}",
      "@media(prefers-reduced-motion:no-preference){#pt-cookie-banner{animation:ptCookieIn .22s ease-out}@keyframes ptCookieIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}}"
    ].join("");
    document.head.appendChild(style);
  }

  function save(value) {
    choice = value;
    try { localStorage.setItem(KEY, value); } catch (e) {}
    var banner = document.getElementById("pt-cookie-banner");
    if (banner) banner.hidden = true;
    var settings = document.getElementById("pt-cookie-settings");
    if (settings) settings.hidden = false;
    if (value === "accepted") schedulePixel();
  }

  function showBanner() {
    addStyles();
    if (document.getElementById("pt-cookie-banner")) {
      document.getElementById("pt-cookie-banner").hidden = false;
      return;
    }
    var banner = document.createElement("section");
    banner.id = "pt-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Privacy and cookie choices");
    banner.innerHTML =
      '<div class="pt-cookie-top"><span class="pt-cookie-mark"></span><span class="pt-cookie-brand">PoundTech privacy</span></div>' +
      '<h2>Your privacy. Your choice.</h2>' +
      '<p>We use essential storage to make the website work. With your permission, we also use Meta advertising technology to understand visits and improve our adverts. You can change your choice at any time. <a href="/privacy.html">Read our privacy policy</a>.</p>' +
      '<div class="pt-cookie-actions"><button type="button" class="pt-cookie-reject" data-pt-choice="rejected">Reject optional</button><button type="button" class="pt-cookie-accept" data-pt-choice="accepted">Accept all</button></div>';
    document.body.appendChild(banner);
    banner.addEventListener("click", function (event) {
      var button = event.target.closest("[data-pt-choice]");
      if (button) save(button.getAttribute("data-pt-choice"));
    });
    var settings = document.getElementById("pt-cookie-settings");
    if (settings) settings.hidden = true;
  }

  function mount() {
    addStyles();
    var settings = document.createElement("button");
    settings.id = "pt-cookie-settings";
    settings.type = "button";
    settings.textContent = "Privacy choices";
    settings.setAttribute("aria-label", "Reopen privacy and cookie choices");
    settings.addEventListener("click", showBanner);
    document.body.appendChild(settings);
    if (choice === "accepted") {
      schedulePixel();
    } else if (choice !== "rejected") {
      showBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();