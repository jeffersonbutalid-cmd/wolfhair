// =========================================================================
// Wolf Hair Restoration - Google Ads offline conversion upload (server-side)
//
// gclid-only, NO PII. Each GHL pipeline-stage workflow POSTs:
//   { token, stage, gclid, value?, currency?, conversion_time?, order_id? }
// and this function uploads a click conversion to the Google Ads API.
//
// Stages map to four Google Ads conversion actions via env vars:
//   lead -> GADS_CA_LEAD, mql -> GADS_CA_MQL, sql -> GADS_CA_SQL, customer -> GADS_CA_CUSTOMER
//
// Required Netlify env vars:
//   WOLF_CONV_TOKEN            shared secret GHL must send (header X-Wolf-Token or body.token)
//   GOOGLE_ADS_DEVELOPER_TOKEN
//   GOOGLE_ADS_CLIENT_ID
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN   OAuth refresh token with scope https://www.googleapis.com/auth/adwords
//   GOOGLE_ADS_CUSTOMER_ID     account that owns the conversion actions (digits only)
//   GADS_CA_LEAD / GADS_CA_MQL / GADS_CA_SQL / GADS_CA_CUSTOMER   conversion action IDs (numeric)
// Optional:
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID   manager (MCC) id, digits only
//   GOOGLE_ADS_API_VERSION         defaults to v18; set to the current API version if needed
// =========================================================================

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v18";
const STAGE_ENV = { lead: "GADS_CA_LEAD", mql: "GADS_CA_MQL", sql: "GADS_CA_SQL", customer: "GADS_CA_CUSTOMER" };
const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

let TOKEN_CACHE = { value: "", exp: 0 };

async function getAccessToken() {
  const now = Date.now();
  if (TOKEN_CACHE.value && now < TOKEN_CACHE.exp) return TOKEN_CACHE.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("oauth_failed");
  TOKEN_CACHE = { value: data.access_token, exp: now + ((data.expires_in || 3600) - 120) * 1000 };
  return TOKEN_CACHE.value;
}

// Google Ads wants: yyyy-MM-dd HH:mm:ss+|-HH:mm  (here always UTC, +00:00)
function gAdsTime(input) {
  let d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) +
    " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + "+00:00"
  );
}

function parseBody(event) {
  const raw = event.body || "";
  try { return JSON.parse(raw || "{}"); } catch (e) {}
  const obj = {};
  try { new URLSearchParams(raw).forEach((v, k) => { obj[k] = v; }); } catch (e) {}
  return obj;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  const body = parseBody(event);
  const h = event.headers || {};
  const token = h["x-wolf-token"] || h["X-Wolf-Token"] || body.token || "";
  if (!process.env.WOLF_CONV_TOKEN || token !== process.env.WOLF_CONV_TOKEN) {
    return { statusCode: 401, headers: JSON_HEADERS, body: JSON.stringify({ error: "unauthorized" }) };
  }

  const stage = String(body.stage || "").toLowerCase().trim();
  const envKey = STAGE_ENV[stage];
  if (!envKey) return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "bad_stage", stage }) };
  const conversionActionId = process.env[envKey];
  if (!conversionActionId) {
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "missing_conversion_action_env", env: envKey }) };
  }

  const gclid = String(body.gclid || "").trim();
  const gbraid = String(body.gbraid || "").trim();
  const wbraid = String(body.wbraid || "").trim();
  if (!gclid && !gbraid && !wbraid) {
    // No click id (e.g. organic / direct lead) - nothing to attribute. Not an error.
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ skipped: "no_click_id", stage }) };
  }

  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/[^0-9]/g, "");
  if (!customerId) return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "missing_customer_id" }) };

  const conversion = {
    conversionAction: "customers/" + customerId + "/conversionActions/" + conversionActionId,
    conversionDateTime: gAdsTime(body.conversion_time),
  };
  if (gclid) conversion.gclid = gclid;
  else if (gbraid) conversion.gbraid = gbraid;
  else if (wbraid) conversion.wbraid = wbraid;

  if (body.value != null && body.value !== "") {
    const v = parseFloat(body.value);
    if (!isNaN(v)) { conversion.conversionValue = v; conversion.currencyCode = String(body.currency || "USD"); }
  }
  if (body.order_id) conversion.orderId = String(body.order_id);

  try {
    const accessToken = await getAccessToken();
    const headers = {
      Authorization: "Bearer " + accessToken,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      "Content-Type": "application/json",
    };
    if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
      headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/[^0-9]/g, "");
    }
    const url = "https://googleads.googleapis.com/" + API_VERSION + "/customers/" + customerId + ":uploadClickConversions";
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[gads] http", res.status);
      return { statusCode: 502, headers: JSON_HEADERS, body: JSON.stringify({ error: "google_ads_error", status: res.status, detail: data }) };
    }
    if (data.partialFailureError) {
      console.error("[gads] partial_failure");
      return { statusCode: 422, headers: JSON_HEADERS, body: JSON.stringify({ error: "partial_failure", detail: data.partialFailureError }) };
    }
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true, stage, results: data.results || [] }) };
  } catch (err) {
    console.error("[gads] error", err && err.message ? err.message : "unknown");
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "exception" }) };
  }
};
