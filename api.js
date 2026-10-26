/**
 * Studyspace - API client (api.js)
 * L. Hithadhoo School
 *
 * The ONE place where the website talks to the Apps Script backend.
 * - Sends every request as a private POST (nothing sensitive goes in the web address)
 * - Adds the signed session token to every request
 * - If the server says the session has ended, signs the person out once
 */
(function (window) {
  'use strict';

  const API_URL = "https://script.google.com/macros/s/AKfycbxp8krlvEmXQGeNp96G2ybXV9KjecxpCu61LuT34lMil2z4fklRAB9ge_K23FcOh1qFbg/exec";
  const TOKEN_KEY = "lhs_token";

  let expiredHandler = null;
  let expiredHandled = false;

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* storage unavailable */ }
    expiredHandled = false;
  }

  /**
   * Calls the backend. Resolves with the server's answer (already parsed).
   * Throws if the network fails or the session has ended.
   */
  async function call(action, params) {
    const body = Object.assign({}, params || {}, { action: action });
    const token = getToken();
    if (token) body.token = token;

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data && (data.code === "SESSION_EXPIRED" || data.code === "SESSION_REQUIRED")) {
      if (!expiredHandled && typeof expiredHandler === "function") {
        expiredHandled = true;
        expiredHandler(data);
      }
      const err = new Error(data.error || "Please sign in again.");
      err.code = data.code;
      throw err;
    }

    return data;
  }

  window.API = {
    call: call,
    getToken: getToken,
    setToken: setToken,
    setExpiredHandler: function (fn) { expiredHandler = fn; }
  };

})(window);
