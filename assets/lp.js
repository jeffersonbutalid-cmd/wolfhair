/* =========================================================================
   Wolf Hair Restoration - Paid-search LP behavior
   - city token fill, static direct phone, neutral analytics events (NO PHI)
   - lead form post to BAA-covered FORM_ENDPOINT
   - MEDIA-gated before/after + testimonials (placeholder when empty)
   - sticky mobile call bar, FAQ, service emphasis
   ========================================================================= */
(function () {
  "use strict";
  var CFG = window.WOLF_LP || {};
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  window.dataLayer = window.dataLayer || [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // Neutral event push only - never includes form-field PHI.
  function track(name, extra) {
    var ev = { event: name };
    if (extra) for (var k in extra) ev[k] = extra[k];
    window.dataLayer.push(ev);
  }

  /* ---------- analytics loaders (placeholders -> no-op until set) ---------- */
  function gtag() { window.dataLayer.push(arguments); }
  if (CFG.GA4_ID) {
    var g = doc.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.GA4_ID);
    doc.head.appendChild(g);
    gtag("js", new Date());
    gtag("config", CFG.GA4_ID);
  }
  if (CFG.AW_CONVERSION_ID) gtag("config", CFG.AW_CONVERSION_ID);
  function fireAdsConversion() {
    if (CFG.AW_CONVERSION_ID && CFG.AW_CONVERSION_LABEL) {
      gtag("event", "conversion", { send_to: CFG.AW_CONVERSION_ID + "/" + CFG.AW_CONVERSION_LABEL });
    }
  }

  /* ---------- city token (?city=) ---------- */
  var qs = new URLSearchParams(location.search);
  var city = (qs.get("city") || "").replace(/[<>]/g, "").trim().slice(0, 40) || CFG.CITY_DEFAULT || "Cincinnati";
  $$("[data-city]").forEach(function (el) { el.textContent = city; });

  /* ---------- ad attribution (gclid/UTMs) -> CRM ONLY, never to tracking ----------
     Captured at landing, persisted across the visit, and appended to the BAA-covered
     form post so Google Ads can attribute the offline conversion. These are NOT PHI
     and are NEVER pushed to dataLayer/gtag. ?service / ?city are intentionally excluded. */
  var ATTR_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid",
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var STORE = "wolf_lp_attr";
  function readAttr() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } }
  function saveAttr() {
    var a = readAttr(), changed = false;
    ATTR_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) { a[k] = String(v).slice(0, 256); changed = true; }
    });
    if (changed) { try { localStorage.setItem(STORE, JSON.stringify(a)); } catch (e) {} }
    return a;
  }
  var ATTR = saveAttr();

  /* ---------- phone (static direct line; no DNI) + neutral call event ---------- */
  $$("[data-phone-display]").forEach(function (el) { el.textContent = CFG.PHONE || el.textContent; });
  $$('a[data-call]').forEach(function (a) {
    if (CFG.PHONE_TEL) a.setAttribute("href", "tel:" + CFG.PHONE_TEL);
    a.addEventListener("click", function () { track("call_click"); });
  });

  /* ---------- legal links ---------- */
  $$("[data-privacy-url]").forEach(function (a) { if (CFG.PRIVACY_URL) a.setAttribute("href", CFG.PRIVACY_URL); });
  $$("[data-npp-url]").forEach(function (a) { if (CFG.NPP_URL) a.setAttribute("href", CFG.NPP_URL); });

  /* ---------- service emphasis (?service=cost|artas) ---------- */
  var svc = (doc.documentElement.getAttribute("data-service") || "core");
  if (svc === "cost") { var fin = $("#financing"); if (fin) fin.classList.add("is-emphasis"); }
  if (svc === "artas") { var art = $("#artas-card"); if (art) art.classList.add("is-emphasis"); }

  /* ---------- MEDIA: before/after (HIPAA-authorized only) ---------- */
  var baWrap = $("[data-media='beforeafter']");
  if (baWrap) {
    var ba = (CFG.MEDIA && CFG.MEDIA.beforeAfter) || [];
    if (ba.length) {
      baWrap.innerHTML = ba.map(function (m) {
        return '<figure class="lp-ba"><div class="lp-ba__imgs">' +
          '<img loading="lazy" src="' + esc(m.before) + '" alt="' + esc(m.alt || "Before") + ' - before" />' +
          '<img loading="lazy" src="' + esc(m.after) + '" alt="' + esc(m.alt || "After") + ' - after" />' +
          '</div>' + (m.caption ? '<figcaption>' + esc(m.caption) + '</figcaption>' : '') + '</figure>';
      }).join("");
    } else {
      baWrap.innerHTML = '<div class="lp-placeholder">Patient before-and-after photos will appear here once available. ' +
        'We only show real, HIPAA-authorized patient results, never stock images. Individual results vary.</div>';
    }
  }

  /* ---------- MEDIA: testimonials ---------- */
  var tWrap = $("[data-media='testimonials']");
  if (tWrap) {
    var ts = (CFG.MEDIA && CFG.MEDIA.testimonials) || [];
    if (ts.length) {
      tWrap.innerHTML = ts.map(function (t) {
        var mc = t.compensated ? '<p class="lp-quote__mc">This patient received compensation for their story.</p>' : '';
        return '<figure class="lp-quote"><blockquote>' + esc(t.quote) + '</blockquote>' +
          '<figcaption>' + esc(t.name || "") + (t.detail ? ', ' + esc(t.detail) : '') + '</figcaption>' +
          mc + '</figure>';
      }).join("");
    } else {
      tWrap.innerHTML = '<div class="lp-placeholder">Verified patient stories will appear here once available. ' +
        'We do not display invented reviews or review counts. Individual results vary.</div>';
    }
  }

  /* ---------- lead form (minimal PHI, no PHI to tracking) ---------- */
  $$("form[data-lp-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = $('button[type="submit"]', form);
      var endpoint = CFG.FORM_ENDPOINT || "";

      // Build payload for the BAA-covered endpoint only.
      var payload = new URLSearchParams();
      new FormData(form).forEach(function (v, k) { payload.append(k, v); });
      payload.append("page", location.pathname);
      // Ad attribution (gclid/UTMs) -> CRM only, so the offline conversion can attribute.
      // Always send the keys (blank if absent) so the CRM field schema stays consistent.
      ATTR_KEYS.forEach(function (k) { payload.append(k, ATTR[k] || ""); });

      var done = function () {
        form.classList.add("is-sent");
        // NEUTRAL conversion signal only - no name/email/phone/interest.
        track("lead_submit");
        fireAdsConversion();
      };

      if (!endpoint) { done(); return; } // preview mode
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending..."; }
      fetch(endpoint, { method: "POST", mode: "no-cors", body: payload })
        .then(function () { done(); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Request my free consultation"; }
          alert("Sorry, something went wrong. Please call " + (CFG.PHONE || "our office") + ".");
        });
    });
  });

  /* ---------- FAQ accordions ---------- */
  $$(".lp-faq__item").forEach(function (item) {
    var q = $(".lp-faq__q", item), a = $(".lp-faq__a", item);
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      a.style.height = open ? a.scrollHeight + "px" : "0px";
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- mobile nav toggle ---------- */
  var tgl = $(".lp-nav-toggle"), drawer = $("#lp-mobile-nav");
  if (tgl && drawer) tgl.addEventListener("click", function () { drawer.toggleAttribute("hidden"); });
})();
