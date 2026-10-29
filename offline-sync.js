/**
 * Studyspace - Offline queue and voice praise (offline-sync.js)
 * L. Hithadhoo School
 *
 * If a finished quiz cannot be sent (no connection, or the sign-in has just ended), the result waits on this
 * device and is sent automatically later. Every result carries a unique id, so sending it twice can never
 * save it twice. Results wait per student: another person signing in on the same device never sends them.
 *
 * Only results that were already worked out on this device wait here. Things that need the server right now
 * (opening a quiz, AI marking, the streak-restore challenge) simply tell the student to try again.
 */
(function (window) {
  'use strict';

  const QUEUE_KEY = 'lhs_pending_v2';
  const MAX_QUEUE = 50;
  const MAX_AGE_MS = 14 * 24 * 3600 * 1000;   // results older than two weeks are dropped
  const MAX_ATTEMPTS = 5;                     // a result the server keeps refusing is dropped after 5 tries
  const FLUSH_EVERY_MS = 60000;

  let flushing = false;
  let timer = null;

  /* ---------------- storage ---------------- */

  function load() {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      return Array.isArray(q) ? q.filter(function (it) { return it && it.id && it.email && it.payload; }) : [];
    } catch (e) { return []; }
  }

  function save(q) {
    try {
      if (q.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
      else localStorage.removeItem(QUEUE_KEY);
    } catch (e) { /* storage full or blocked: nothing more can be done */ }
  }

  function newId() {
    let rand = '';
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        const a = new Uint32Array(3);
        window.crypto.getRandomValues(a);
        rand = Array.prototype.map.call(a, function (n) { return n.toString(36); }).join('');
      }
    } catch (e) { rand = ''; }
    if (!rand) rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    return ('s' + Date.now().toString(36) + '-' + rand).slice(0, 60);
  }

  function currentEmail() {
    try { return typeof currentUser !== 'undefined' ? String(currentUser || '') : ''; } catch (e) { return ''; }
  }

  function normalise(email) { return String(email || currentEmail() || '').trim().toLowerCase(); }

  function pending(email) {
    const who = normalise(email);
    return load().filter(function (it) { return it.email === who; }).length;
  }

  /* ---------------- the small "waiting to send" note ---------------- */

  function refreshIndicator() {
    try {
      const n = pending();
      let el = document.getElementById('syncPending');
      if (!el) {
        if (!n) return;
        el = document.createElement('div');
        el.id = 'syncPending';
        el.className = 'fixed bottom-4 left-4 z-50 px-3 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow-lg';
        document.body.appendChild(el);
      }
      el.innerText = n ? ('⏳ ' + n + ' result' + (n === 1 ? '' : 's') + ' waiting to send') : '';
      el.style.display = n ? '' : 'none';
    } catch (e) { /* the note is only a courtesy */ }
  }

  /* ---------------- sending ---------------- */

  function enqueue(item) {
    let q = load().filter(function (it) { return it.id !== item.id; });
    q.push(item);
    if (q.length > MAX_QUEUE) q = q.slice(q.length - MAX_QUEUE);
    save(q);
    refreshIndicator();
    startTimer();
  }

  /**
   * Sends a finished quiz result. Resolves with { status, response? }:
   *   "saved"    - the server has it
   *   "queued"   - it could not be sent now; it is kept on this device and will be sent later
   *   "rejected" - the server answered with a refusal (response.error says why); it is not kept
   */
  async function submit(email, payload) {
    const item = {
      id: newId(),
      email: normalise(email),
      action: 'submitResult',
      payload: Object.assign({}, payload),
      queuedAt: Date.now(),
      attempts: 0
    };

    // results that are already waiting go first, so attempts and medals are counted in the order they happened
    try { await flush(item.email); } catch (e) { /* ignore */ }

    try {
      const res = await API.call(item.action, Object.assign({}, item.payload, { submissionId: item.id }));
      if (res && res.error) return { status: 'rejected', response: res };
      return { status: 'saved', response: res };
    } catch (err) {
      enqueue(item);
      return { status: 'queued', reason: err && err.code ? 'session' : 'network' };
    }
  }

  /** Sends whatever is waiting for this student, oldest first. Stops quietly at the first sign of no connection. */
  async function flush(email) {
    if (flushing) return { sent: 0 };
    flushing = true;
    const who = normalise(email);
    const done = {};      // ids to remove
    const tries = {};     // id -> attempts so far
    let sent = 0;

    try {
      const snapshot = load();
      for (let i = 0; i < snapshot.length; i++) {
        const it = snapshot[i];
        if (it.email !== who) continue;
        if (Date.now() - it.queuedAt >= MAX_AGE_MS) { done[it.id] = true; continue; }

        let res;
        try {
          res = await API.call(it.action, Object.assign({}, it.payload, { submissionId: it.id, retry: true }));
        } catch (err) {
          break;                                   // still offline, or the sign-in has ended: leave the rest for later
        }

        if (res && !res.error) { done[it.id] = true; sent++; continue; }

        const n = (it.attempts || 0) + 1;
        if (n >= MAX_ATTEMPTS) {
          console.warn('Dropping a result the server keeps refusing:', res && res.error);
          done[it.id] = true;
        } else {
          tries[it.id] = n;
        }
      }
    } finally {
      // work from what is stored NOW, in case something was added while we were sending
      const current = load()
        .filter(function (it) { return !done[it.id]; })
        .map(function (it) { return tries[it.id] ? Object.assign({}, it, { attempts: tries[it.id] }) : it; });
      save(current);
      flushing = false;
      refreshIndicator();
    }

    if (sent && typeof window.onQueueSynced === 'function') {
      try { window.onQueueSynced(sent); } catch (e) { /* ignore */ }
    }
    return { sent: sent };
  }

  function startTimer() {
    if (timer || !window.setInterval) return;
    timer = window.setInterval(function () {
      if (!load().length) { window.clearInterval(timer); timer = null; return; }
      flush();
    }, FLUSH_EVERY_MS);
  }

  window.OfflineQueue = { submit: submit, flush: flush, pending: pending, refresh: refreshIndicator };

  if (window.addEventListener) {
    window.addEventListener('online', function () { flush(); });
    if (window.document && window.document.addEventListener) {
      window.document.addEventListener('visibilitychange', function () {
        if (!window.document.hidden) flush();
      });
    }
  }
  if (load().length) startTimer();

  /* ---------------- voice praise (unchanged) ---------------- */

  window.playQuizPraise = function (textToRead) {
    if (!('speechSynthesis' in window) || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead || 'Well done!');
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(function (v) { return v.lang.startsWith('en'); });
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  };

})(window);
