/* =========================================================================
   Wolf Hair Restoration - chat widget
   Floating assistant that posts to the /api/chat serverless function.
   No external dependencies. The API key never touches the browser.
   ========================================================================= */
(function () {
  "use strict";
  if (window.__wolfChat) return;
  window.__wolfChat = true;

  var ENDPOINT = window.WOLF_CHAT_ENDPOINT || "/api/chat";
  var GREETING =
    "Hi! I'm the Wolf Hair Restoration assistant. Ask me about our doctors, procedures, pricing, or booking a free consultation.";

  var doc = document;
  var history = []; // {role, content} for the API
  var busy = false;

  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // Minimal, safe linkifier: escape text, then turn phone + urls into links.
  function format(text) {
    var s = String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
    s = s.replace(/\b(513-774-0400)\b/g, '<a href="tel:+15137740400">$1</a>');
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\n/g, "<br>");
  }

  // ---- build DOM ----
  var launch = el(
    "button",
    "wchat-launch",
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.9-.9L3 20l1-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg><span>Chat with us</span>'
  );
  launch.setAttribute("aria-label", "Open chat assistant");

  var panel = el("section", "wchat");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Wolf Hair Restoration chat assistant");
  panel.setAttribute("aria-modal", "false");
  panel.innerHTML =
    '<div class="wchat__head">' +
    '<span class="av"><svg viewBox="0 0 24 24" fill="none" stroke="#f0ede5" stroke-width="1.9" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.9-.9L3 20l1-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg></span>' +
    "<div><h4>Wolf Hair Assistant</h4><p>Typically replies in a few seconds</p></div>" +
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

  doc.body.appendChild(launch);
  doc.body.appendChild(panel);

  var body = panel.querySelector(".wchat__body");
  var input = panel.querySelector("textarea");
  var sendBtn = panel.querySelector(".wchat__send");
  var closeBtn = panel.querySelector(".wchat__x");

  function scrollDown() {
    body.scrollTop = body.scrollHeight;
  }

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

  var opened = false;
  function open() {
    panel.classList.add("is-open");
    launch.classList.add("is-hidden");
    if (!opened) {
      opened = true;
      addBubble("bot", GREETING);
    }
    setTimeout(function () {
      input.focus();
    }, 60);
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
      var data = await res.json().catch(function () {
        return {};
      });
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
})();
