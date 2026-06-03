/* =========================================================================
   Wolf Hair Restoration — shared behavior
   - gclid / UTM capture (persisted, appended to form + GHL iframes)
   - styled form submit -> GHL Inbound Webhook (window.WOLF_FORM_ENDPOINT)
   - before/after slider, FAQ accordions, scroll reveal, stat counters
   - sticky header state, mobile nav, smooth anchor
   - vanilla Tweaks panel (host edit-mode protocol)
   ========================================================================= */
(function () {
  "use strict";
  var doc = document;
  var on = function (el, ev, fn, o) { el && el.addEventListener(ev, fn, o || false); };
  var $  = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------- 1. tracking params ---------- */
  var TRACK_KEYS = ["gclid","gbraid","wbraid","fbclid","msclkid",
    "utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
  var STORE = "wolf_track";

  function captureParams() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) {}
    var qs = new URLSearchParams(location.search), changed = false;
    TRACK_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) { saved[k] = v; changed = true; }
    });
    if (!saved.landing_page) { saved.landing_page = location.pathname; }
    if (!saved.first_seen) { saved.first_seen = new Date().toISOString(); changed = true; }
    if (changed) { try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (e) {} }
    return saved;
  }
  var TRACK = captureParams();

  // hidden inputs on styled forms
  $$("form[data-wolf-form]").forEach(function (form) {
    Object.keys(TRACK).forEach(function (k) {
      if ($('input[name="' + k + '"]', form)) return;
      var i = doc.createElement("input");
      i.type = "hidden"; i.name = k; i.value = TRACK[k];
      form.appendChild(i);
    });
  });

  // append tracking to GHL / LeadConnector iframes (native embed path B)
  $$("iframe").forEach(function (f) {
    var src = f.getAttribute("src") || "";
    if (!/leadconnector|gohighlevel|msgsndr|\/widget\/form\//i.test(src)) return;
    try {
      var u = new URL(src, location.href);
      Object.keys(TRACK).forEach(function (k) {
        if (TRACK_KEYS.indexOf(k) >= 0 && !u.searchParams.has(k)) u.searchParams.set(k, TRACK[k]);
      });
      f.setAttribute("src", u.toString());
    } catch (e) {}
  });

  // thank-you page to redirect to after a successful submission
  var THANKYOU = (typeof window.WOLF_THANKYOU_URL === "string") ? window.WOLF_THANKYOU_URL : "/thank-you";

  // GHL / LeadConnector embed (path B): redirect to the thank-you page on submit.
  // Best effort from the parent. For guaranteed behavior also set the redirect URL
  // in the GHL form builder (On Submit -> Open URL). Only listen if a GHL form exists.
  var hasGHLForm = $$("iframe").some(function (f) {
    return /leadconnector|gohighlevel|msgsndr|\/widget\/form\//i.test(f.getAttribute("src") || "");
  });
  if (hasGHLForm && THANKYOU) {
    on(window, "message", function (e) {
      try {
        var d = e.data;
        var key = typeof d === "string" ? d : (d && (d.type || d.event || d.action || ""));
        if (key && /form[\s_-]?sub|formsubmit|submitted|submission.?success/i.test(String(key))) {
          window.location.assign(THANKYOU);
        }
      } catch (err) {}
    });
  }

  /* ---------- 2. styled form submit ---------- */
  $$("form[data-wolf-form]").forEach(function (form) {
    on(form, "submit", function (e) {
      e.preventDefault();
      var endpoint = form.getAttribute("data-endpoint") || window.WOLF_FORM_ENDPOINT || "";
      var btn = $('button[type="submit"]', form);
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page_title = doc.title;
      data.submitted_at = new Date().toISOString();

      var finish = function () {
        if (window.dataLayer) window.dataLayer.push({ event: "generate_lead" });
        if (THANKYOU) { window.location.assign(THANKYOU); return; }
        form.classList.add("is-sent");
      };

      if (!endpoint) {
        // no endpoint wired yet — show success state for design review
        console.info("[wolf] form submit (no endpoint set):", data);
        finish();
        return;
      }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending..."; }
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function () { finish(); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Request my consultation"; }
          alert("Sorry, something went wrong. Please call 513-774-0400.");
        });
    });
  });

  /* ---------- 3. before / after slider ---------- */
  $$(".ba").forEach(function (ba) {
    var clip = $(".ba__clip", ba);
    var handle = $(".ba__handle", ba);
    function set(p) {
      p = Math.max(2, Math.min(98, p));
      clip.style.width = p + "%";
      handle.style.left = p + "%";
    }
    function fromEvent(clientX) {
      var r = ba.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
    }
    var dragging = false;
    on(handle, "pointerdown", function (e) { dragging = true; handle.setPointerCapture(e.pointerId); });
    on(ba, "pointermove", function (e) { if (dragging) { fromEvent(e.clientX); e.preventDefault(); } });
    on(window, "pointerup", function () { dragging = false; });
    on(ba, "click", function (e) { if (!e.target.closest(".ba__handle")) fromEvent(e.clientX); });
    set(50);
  });

  /* ---------- 4. FAQ accordions ---------- */
  $$(".faq__item").forEach(function (item) {
    var q = $(".faq__q", item), a = $(".faq__a", item);
    on(q, "click", function () {
      var open = item.classList.contains("is-open");
      if (open) { a.style.height = a.scrollHeight + "px"; requestAnimationFrame(function () { a.style.height = "0px"; }); item.classList.remove("is-open"); }
      else { item.classList.add("is-open"); a.style.height = a.scrollHeight + "px"; on(a, "transitionend", function te() { if (item.classList.contains("is-open")) a.style.height = "auto"; a.removeEventListener("transitionend", te); }); }
    });
  });

  /* ---------- 4b. reviews carousel ---------- */
  $$(".reviews").forEach(function (root) {
    var vp = $(".reviews-vp", root), track = $(".reviews-track", root);
    var cards = $$(".review", track), dotsWrap = $(".reviews-dots", root);
    if (!track || !cards.length) return;
    var gap = 28, idx = 0, maxIdx = 0, perView = 3, timer = null;
    function per() { var w = window.innerWidth; return w <= 600 ? 1 : (w <= 980 ? 2 : 3); }
    function cardW() { return (vp.clientWidth - (perView - 1) * gap) / perView; }
    function go(i, instant) {
      idx = Math.max(0, Math.min(i, maxIdx));
      track.style.transition = instant ? "none" : "transform .6s cubic-bezier(.4,0,.2,1)";
      track.style.transform = "translateX(" + (-(idx * (cardW() + gap))) + "px)";
      if (instant) { void track.offsetWidth; }
      updateDots();
    }
    function layout() {
      perView = per();
      var cw = cardW();
      cards.forEach(function (c) { c.style.flex = "0 0 " + cw + "px"; c.style.maxWidth = cw + "px"; });
      track.style.gap = gap + "px";
      maxIdx = Math.max(0, cards.length - perView);
      if (idx > maxIdx) idx = maxIdx;
      buildDots();
      go(idx, true);
    }
    function next() { go(idx >= maxIdx ? 0 : idx + 1); }
    function prev() { go(idx <= 0 ? maxIdx : idx - 1); }
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (var i = 0; i <= maxIdx; i++) {
        var b = doc.createElement("button");
        b.type = "button";
        (function (n) { on(b, "click", function () { go(n); restart(); }); })(i);
        dotsWrap.appendChild(b);
      }
    }
    function updateDots() {
      if (!dotsWrap) return;
      $$("button", dotsWrap).forEach(function (b, i) { b.classList.toggle("on", i === idx); });
    }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(next, 5000); }
    on($(".reviews-next", root), "click", function () { next(); restart(); });
    on($(".reviews-prev", root), "click", function () { prev(); restart(); });
    on(window, "resize", layout);
    layout(); restart();
  });

  /* ---------- 5. scroll reveal ---------- */
  function revealAll() { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    var vh = window.innerHeight || 800;
    $$(".reveal").forEach(function (el) {
      // reveal anything already on/near screen immediately so first paint is filled
      if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add("in");
      else io.observe(el);
    });
    // safety net: never leave content hidden if the observer never fires
    setTimeout(revealAll, 1600);
    // hard fallback for non-painting contexts (print/PDF/offscreen): snap visible
    setTimeout(function () { doc.documentElement.classList.add("reveal-show"); }, 2600);
  } else { revealAll(); }

  /* ---------- 6. stat counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-dec") || "0") | 0;
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(function (el) { co.observe(el); });
    // safety net: show final values even if the observer never fires
    setTimeout(function () {
      $$("[data-count]").forEach(function (el) {
        if (el.textContent === "0") {
          var dec = (el.getAttribute("data-dec") || "0") | 0;
          el.textContent = parseFloat(el.getAttribute("data-count")).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
      });
    }, 2000);
  } else { $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); }); }

  /* ---------- 7. header + mobile nav ---------- */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 24); };
    on(window, "scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------- 7b. announcement bar (size + dismiss) ---------- */
  var annc = $("#annc");
  if (annc) {
    var setAnncH = function () {
      var h = annc.offsetParent === null ? 0 : annc.offsetHeight;
      doc.documentElement.style.setProperty("--annc-h", h + "px");
    };
    setAnncH();
    on(window, "resize", setAnncH, { passive: true });
    on(window, "load", setAnncH);
    on($(".annc__x", annc), "click", function () { annc.style.display = "none"; setAnncH(); });
  }
  var toggle = $(".nav-toggle"), drawer = $("#mobile-nav");
  on(toggle, "click", function () { if (drawer) drawer.toggleAttribute("hidden"); });
  $$("#mobile-nav a").forEach(function (a) { on(a, "click", function () { if (drawer) drawer.setAttribute("hidden", ""); }); });

  /* ---------- 8. year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* =========================================================================
     9. Tweaks panel (host edit-mode protocol)
     ========================================================================= */
  var TWK = window.WOLF_TWEAKS || {};
  var PALETTES = {
    yellow: { a: "#fef3bd", d: "#f4e392" },
    blue:   { a: "#bfdeeb", d: "#a6cfe0" },
    beige:  { a: "#d6bf93", d: "#c9ad77" }
  };
  var FONTS = {
    newsreader: '"Newsreader", Georgia, serif',
    fraunces:   '"Fraunces", Georgia, serif',
    playfair:   '"Playfair Display", Georgia, serif'
  };
  var RADII = { soft: { r: "16px", btn: "999px" }, sharp: { r: "4px", btn: "6px" }, round: { r: "22px", btn: "999px" } };

  function applyTweaks(t) {
    var root = doc.documentElement.style;
    if (t.accent && PALETTES[t.accent]) { var p = PALETTES[t.accent]; root.setProperty("--accent", p.a); root.setProperty("--accent-deep", p.d); }
    if (t.font && FONTS[t.font]) { root.setProperty("--font-display", FONTS[t.font]); }
    if (t.shape && RADII[t.shape]) { root.setProperty("--radius", RADII[t.shape].r); root.setProperty("--btn-radius", RADII[t.shape].btn); }
    if (t.heroLayout) { var h = $(".hero"); if (h) h.setAttribute("data-layout", t.heroLayout); }
  }
  applyTweaks(TWK);

  // build panel UI
  function buildTweaks() {
    if ($("#tweaks")) return;
    var panel = doc.createElement("div");
    panel.id = "tweaks";
    panel.innerHTML =
      '<button class="tk-x" title="Close" aria-label="Close">\u2715</button>' +
      '<h5>Tweaks</h5><div class="tk-sub">Live preview \u00b7 try a few directions</div>' +
      grp("Accent", seg("accent", [["yellow","Yellow"],["blue","Blue"],["beige","Beige"]])) +
      grp("Display font", seg("font", [["newsreader","Newsreader"],["fraunces","Fraunces"],["playfair","Playfair"]])) +
      grp("Hero layout", seg("heroLayout", [["split","Image"],["form","Form"],["centered","Centered"]])) +
      grp("Corners", seg("shape", [["soft","Soft"],["round","Round"],["sharp","Sharp"]]));
    doc.body.appendChild(panel);

    function grpSync() {
      $$("#tweaks .tk-seg button").forEach(function (b) {
        var key = b.parentNode.getAttribute("data-key");
        b.classList.toggle("on", (TWK[key] || defaultFor(key)) === b.getAttribute("data-val"));
      });
    }
    grpSync();
    on($(".tk-x", panel), "click", function () { panel.classList.remove("show"); window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); });
    $$("#tweaks .tk-seg").forEach(function (segEl) {
      on(segEl, "click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var key = segEl.getAttribute("data-key"), val = b.getAttribute("data-val");
        TWK[key] = val; applyTweaks(TWK); grpSync();
        window.parent.postMessage({ type: "__edit_mode_set_keys", edits: defObj(key, val) }, "*");
      });
    });
  }
  function grp(label, inner) { return '<div class="tk-grp"><div class="tk-lbl">' + label + '</div>' + inner + '</div>'; }
  function seg(key, opts) {
    return '<div class="tk-seg" data-key="' + key + '">' + opts.map(function (o) {
      return '<button data-val="' + o[0] + '">' + o[1] + '</button>';
    }).join("") + '</div>';
  }
  function defaultFor(k) { return ({ accent: "yellow", font: "newsreader", heroLayout: "split", shape: "soft" })[k]; }
  function defObj(k, v) { var o = {}; o[k] = v; return o; }

  // host protocol
  on(window, "message", function (e) {
    var t = e && e.data && e.data.type;
    if (t === "__activate_edit_mode") { buildTweaks(); var p = $("#tweaks"); if (p) p.classList.add("show"); }
    else if (t === "__deactivate_edit_mode") { var q = $("#tweaks"); if (q) q.classList.remove("show"); }
  });
  try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
})();
