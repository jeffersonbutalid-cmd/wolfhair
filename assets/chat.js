/* =========================================================================
   Wolf Hair Restoration - chat widget ("Ashley")
   Floating assistant that posts to the /api/chat serverless function.
   No external dependencies. The API key never touches the browser.
   ========================================================================= */
(function () {
  "use strict";
  if (window.__wolfChat) return;
  window.__wolfChat = true;

  var ENDPOINT = window.WOLF_CHAT_ENDPOINT || "/api/chat";
  var AVATAR = window.WOLF_AVATAR || "assets/img/ashley.jpg";
  var GREETING =
    "Hi there, I'm Ashley, your friendly assistant here at Wolf Hair Restoration. So glad you stopped by! Whether you're curious about our doctors, the procedures, pricing, or booking a free consultation, I'm here to help. What can I do for you today?";

  var doc = document;
  var history = []; // {role, content} for the API
  var busy = false;

  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // photo avatar with a graceful monogram fallback if the image is missing
  function avatar(extra) {
    return (
      '<span class="wav ' + (extra || "") + '">' +
      '<img src="' + AVATAR + '" alt="Ashley" onerror="this.remove()">' +
      '<span class="wav__i">A</span></span>'
    );
  }

  // escape, then linkify phone numbers and urls
  function format(text) {
    var s = String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
    s = s.replace(/\b(513-774-0400)\b/g, '<a href="tel:+15137740400">$1</a>');
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\n/g, "<br>");
  }

  // ---- launcher ----
  var launch = el("button", "wchat-launch", avatar("wav--sm") + "<span>Chat with Ashley</span>");
  launch.setAttribute("aria-label", "Open chat with Ashley, the Wolf Hair Restoration assistant");

  // ---- teaser bubble ----
  var tease = el(
    "div",
    "wtease",
    avatar("wav--sm") +
      '<div class="wtease__body"><b>Ashley</b>Hi! Have a question about hair restoration or pricing? I\'m happy to help.</div>' +
      '<button class="wtease__x" type="button" aria-label="Dismiss">&times;</button>'
  );

  // ---- panel ----
  var panel = el("section", "wchat");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with Ashley, the Wolf Hair Restoration assistant");
  panel.setAttribute("aria-modal", "false");
  panel.innerHTML =
    '<div class="wchat__head">' +
    avatar() +
    "<div><h4>Ashley</h4><p>Wolf Hair Restoration assistant</p></div>" +
    '<button class="wchat__x" aria-label="Close chat">' +
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
    "</button></div>" +
    '<div class="wchat__body" aria-live="polite"></div>' +
    '<div class="wchat__foot">' +
    '<div class="wchat__row">' +
    '<textarea rows="1" placeholder="Type your question..." aria-label="Type your message"></textarea>' +
    '<button class="wchat__send" aria-label="Send message"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
    "</div>" +
    '<p class="wchat__note">Assistant can make mistakes. This is not medical advice. Individual results vary.</p>' +
    "</div>";

  doc.body.appendChild(tease);
  doc.body.appendChild(launch);
  doc.body.appendChild(panel);

  var body = panel.querySelector(".wchat__body");
  var input = panel.querySelector("textarea");
  var sendBtn = panel.querySelector(".wchat__send");
  var closeBtn = panel.querySelector(".wchat__x");

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addBubble(role, text) {
    var b = el("div", "wmsg " + (role === "user" ? "wmsg--user" : "wmsg--bot"), format(text));
    body.appendChild(b);
    scrollDown();
    return b;
  }

  function showTyping() {
    var t = el("div", "wtyping", "<span></span><span></span><span></span>");
    body.appendChild(t);
    scrollDown();
    return t;
  }

  // ---- teaser logic: pops up, disappears when the chat is clicked/opened ----
  var teaseTimer, teaseHideTimer;
  function hideTease() {
    tease.classList.remove("is-show");
    clearTimeout(teaseTimer);
    clearTimeout(teaseHideTimer);
  }
  function maybeShowTease() {
    try {
      if (sessionStorage.getItem("wolf_tease_done")) return;
    } catch (e) {}
    teaseTimer = setTimeout(function () {
      if (!opened) tease.classList.add("is-show");
      teaseHideTimer = setTimeout(hideTease, 14000);
    }, 3500);
  }

  var opened = false;
  function open() {
    hideTease();
    try { sessionStorage.setItem("wolf_tease_done", "1"); } catch (e) {}
    panel.classList.add("is-open");
    launch.classList.add("is-hidden");
    if (!opened) {
      opened = true;
      addBubble("bot", GREETING);
    }
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() {
    panel.classList.remove("is-open");
    launch.classList.remove("is-hidden");
  }

  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  async function send() {
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    autosize();
    addBubble("user", text);
    history.push({ role: "user", content: text });

    var typing = showTyping();
    try {
      var res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      var data = await res.json().catch(function () { return {}; });
      typing.remove();
      var reply =
        data && data.reply
          ? data.reply
          : "Sorry, something went wrong. Please call 513-774-0400 and our team will help.";
      addBubble("bot", reply);
      history.push({ role: "assistant", content: reply });
      if (window.dataLayer) window.dataLayer.push({ event: "chat_message" });
    } catch (e) {
      typing.remove();
      addBubble("bot", "Sorry, I could not reach our assistant. Please call 513-774-0400.");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ---- events ----
  launch.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  sendBtn.addEventListener("click", send);
  tease.addEventListener("click", function (e) {
    if (e.target.closest(".wtease__x")) {
      hideTease();
      try { sessionStorage.setItem("wolf_tease_done", "1"); } catch (err) {}
      return;
    }
    open();
  });
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) close();
  });

  maybeShowTease();
})();
