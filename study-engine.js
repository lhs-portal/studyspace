/**
 * study-engine.js - Studyspace Study Hub (version 2)
 * L. Hithadhoo School
 *
 * What it does
 *  - Draws the full-screen Study Hub inside #studyHubContainer (the page only needs that one empty box).
 *  - Reads notes/notes-index.json and shows the syllabus in a collapsible sidebar (edge arrows to hide/show it).
 *  - Cleans each note's HTML (it comes from Google Docs) and re-styles it: Montserrat body text, Roboto Mono
 *    headings, proper spacing, bullets, tables, pictures that open larger, and YouTube/Vimeo/Drive/Slides links
 *    that become embedded players.
 *
 * Everything in a note is treated as untrusted: scripts, styles, event handlers and unknown links are removed
 * before anything is shown.
 *
 * Settings you may want to change are in the SETTINGS block just below.
 */
(function () {
  'use strict';

  /* ======================================================================= */
  /* SETTINGS                                                                */
  /* ======================================================================= */
  var INDEX_URL = 'notes/notes-index.json';
  var FONT_URL = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Roboto+Mono:wght@500;600;700&display=swap';
  var BODY_FONT = "'Montserrat', 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
  var HEADING_FONT = "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var SIDEBAR_KEY = 'lhs_hub_sidebar';           // remembers whether the sidebar was left open or closed
  var SIDEBAR_WIDTH = 330;                       // pixels

  /* ======================================================================= */
  /* STATE                                                                   */
  /* ======================================================================= */
  var state = {
    index: [],
    indexLoaded: false,
    indexError: false,
    subject: '',
    current: null,        // the index entry being read
    query: '',
    sidebarOpen: true,
    openUnits: {},        // unit name -> true
    container: null
  };
  var noteCache = {};     // filePath -> html text
  var loadToken = 0;      // protects against slow notes arriving after the student clicked another one

  /* ======================================================================= */
  /* SMALL HELPERS                                                           */
  /* ======================================================================= */
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isTeacher() {
    try { return typeof userRole !== 'undefined' && userRole === 'teacher'; } catch (e) { return false; }
  }

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }
  function recall(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  var ICON = {
    left: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V5.5"/></svg>'
  };

  /* ======================================================================= */
  /* STYLES (written once, scoped to #studyHubContainer so nothing leaks)    */
  /* ======================================================================= */
  var R = '#studyHubContainer';
  function rule(sel, decl) {
    return sel.split(',').map(function (s) { return R + ' ' + s.trim(); }).join(',') + '{' + decl + '}';
  }
  function dark(sel, decl) {
    return sel.split(',').map(function (s) { return 'html.dark ' + R + ' ' + s.trim(); }).join(',') + '{' + decl + '}';
  }

  function buildCss() {
    var c = [];
    c.push(R + '{--sh-bg:#f6f8fb;--sh-panel:#ffffff;--sh-side:#eef2f7;--sh-text:#1e293b;--sh-muted:#64748b;--sh-line:#dde4ee;' +
      '--sh-accent:#059669;--sh-accent-fg:#022c22;--sh-accent-soft:rgba(16,185,129,.13);--sh-strong:#047857;--sh-mark:#fde68a;' +
      '--sh-code:#eef2f7;--sh-shadow:0 12px 34px rgba(15,23,42,.14);--sh-head:' + HEADING_FONT + ';--sh-body:' + BODY_FONT + ';}');
    c.push('html.dark ' + R + '{--sh-bg:#030712;--sh-panel:#0b1220;--sh-side:#090f1c;--sh-text:#dbe4f0;--sh-muted:#8b9bb2;--sh-line:#1c2638;' +
      '--sh-accent:#34d399;--sh-accent-soft:rgba(52,211,153,.14);--sh-strong:#6ee7b7;--sh-mark:rgba(250,204,21,.26);' +
      '--sh-code:#0f1829;--sh-shadow:0 12px 34px rgba(0,0,0,.55);}');

    c.push(rule('*, *::before, *::after', 'box-sizing:border-box;'));
    c.push(R + '{position:relative;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:var(--sh-text);}');
    c.push(rule('.sh-root', 'display:flex;flex-direction:column;height:100%;width:100%;background:var(--sh-bg);overflow:hidden;'));
    c.push(rule('button', 'font-family:inherit;cursor:pointer;'));
    c.push(rule('button:focus-visible, input:focus-visible, a:focus-visible', 'outline:2px solid var(--sh-accent);outline-offset:2px;'));

    /* scrollbars */
    c.push(rule('*', 'scrollbar-width:thin;scrollbar-color:var(--sh-line) transparent;'));
    c.push(rule('*::-webkit-scrollbar', 'width:7px;height:7px;'));
    c.push(rule('*::-webkit-scrollbar-thumb', 'background:var(--sh-line);border-radius:99px;'));
    c.push(rule('*::-webkit-scrollbar-thumb:hover', 'background:var(--sh-accent);'));

    /* top bar */
    c.push(rule('.sh-top', 'flex:0 0 auto;display:flex;align-items:center;gap:12px;height:54px;padding:0 14px;background:var(--sh-panel);border-bottom:1px solid var(--sh-line);'));
    c.push(rule('.sh-brand', 'display:flex;align-items:center;gap:9px;font-weight:800;font-size:14px;white-space:nowrap;'));
    c.push(rule('.sh-brand-ico', 'width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--sh-accent-soft);color:var(--sh-accent);'));
    c.push(rule('.sh-tabs', 'flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;padding:2px 2px;scrollbar-width:none;'));
    c.push(rule('.sh-tabs::-webkit-scrollbar', 'display:none;'));
    c.push(rule('.sh-tab', 'flex:0 0 auto;border:1px solid transparent;border-radius:999px;padding:7px 15px;font-size:12px;font-weight:700;color:var(--sh-muted);background:transparent;transition:background .15s,color .15s;'));
    c.push(rule('.sh-tab:hover', 'background:var(--sh-accent-soft);color:var(--sh-text);'));
    c.push(rule('.sh-tab[aria-selected="true"]', 'background:var(--sh-accent);color:var(--sh-accent-fg, #022c22);font-weight:800;box-shadow:0 4px 14px rgba(16,185,129,.28);'));
    c.push(dark('.sh-tab[aria-selected="true"]', 'color:#022c22;'));
    c.push(rule('.sh-close', 'flex:0 0 auto;display:flex;align-items:center;gap:7px;border:1px solid var(--sh-line);background:var(--sh-panel);color:var(--sh-text);border-radius:12px;padding:7px 12px;font-size:12px;font-weight:700;transition:border-color .15s,color .15s;'));
    c.push(rule('.sh-close:hover', 'border-color:var(--sh-accent);color:var(--sh-accent);'));

    /* body, sidebar and the edge arrow */
    c.push(rule('.sh-body', 'position:relative;flex:1;min-height:0;display:flex;overflow:hidden;'));
    c.push(rule('.sh-side', 'flex:0 0 ' + SIDEBAR_WIDTH + 'px;width:' + SIDEBAR_WIDTH + 'px;background:var(--sh-side);border-right:1px solid var(--sh-line);overflow:hidden;transition:width .28s ease,flex-basis .28s ease,border-color .28s;'));
    c.push(rule('.sh-closed .sh-side', 'width:0;flex-basis:0;border-right-width:0;'));
    c.push(rule('.sh-side-inner', 'width:' + SIDEBAR_WIDTH + 'px;height:100%;display:flex;flex-direction:column;'));
    c.push(rule('.sh-edge', 'position:absolute;z-index:40;top:50%;left:' + (SIDEBAR_WIDTH - 16) + 'px;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'border:1px solid var(--sh-line);background:var(--sh-panel);color:var(--sh-muted);box-shadow:0 4px 14px rgba(15,23,42,.16);transition:left .28s ease,color .15s,border-color .15s,background .15s;'));
    c.push(rule('.sh-edge:hover', 'color:var(--sh-accent-fg, #022c22);background:var(--sh-accent);border-color:var(--sh-accent);'));
    c.push(rule('.sh-closed .sh-edge', 'left:0;width:22px;height:64px;border-radius:0 14px 14px 0;border-left-width:0;'));

    /* search + syllabus tree */
    c.push(rule('.sh-search', 'position:relative;flex:0 0 auto;padding:14px 14px 10px;'));
    c.push(rule('.sh-search svg', 'position:absolute;left:26px;top:25px;color:var(--sh-muted);pointer-events:none;'));
    c.push(rule('.sh-search input', 'width:100%;padding:10px 12px 10px 36px;border:1px solid var(--sh-line);border-radius:12px;background:var(--sh-panel);color:var(--sh-text);font:600 12.5px "Plus Jakarta Sans",system-ui,sans-serif;'));
    c.push(rule('.sh-search input::placeholder', 'color:var(--sh-muted);font-weight:500;'));
    c.push(rule('.sh-search input:focus', 'outline:none;border-color:var(--sh-accent);box-shadow:0 0 0 3px var(--sh-accent-soft);'));
    c.push(rule('.sh-tree', 'flex:1;min-height:0;overflow-y:auto;padding:4px 10px 24px;'));
    c.push(rule('.sh-unit', 'margin:0 0 6px;'));
    c.push(rule('.sh-unit-head', 'width:100%;display:flex;align-items:center;gap:8px;text-align:left;border:0;background:transparent;color:var(--sh-muted);padding:9px 8px;border-radius:10px;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;'));
    c.push(rule('.sh-unit-head:hover', 'background:var(--sh-accent-soft);color:var(--sh-text);'));
    c.push(rule('.sh-unit-name', 'flex:1;min-width:0;'));
    c.push(rule('.sh-unit-count', 'font-size:10px;font-weight:700;background:var(--sh-panel);border:1px solid var(--sh-line);border-radius:99px;padding:1px 7px;color:var(--sh-muted);'));
    c.push(rule('.sh-unit-head svg', 'flex:0 0 auto;transition:transform .2s;'));
    c.push(rule('.sh-unit.sh-open .sh-unit-head svg', 'transform:rotate(180deg);'));
    c.push(rule('.sh-unit-body', 'display:none;padding:2px 0 6px 6px;'));
    c.push(rule('.sh-unit.sh-open .sh-unit-body', 'display:block;'));
    c.push(rule('.sh-item', 'display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--sh-text);padding:9px 12px;margin:1px 0;border-radius:10px;font-size:12.5px;font-weight:600;line-height:1.4;border-left:3px solid transparent;transition:background .12s;'));
    c.push(rule('.sh-item:hover', 'background:var(--sh-accent-soft);'));
    c.push(rule('.sh-item[aria-current="true"]', 'background:var(--sh-accent-soft);border-left-color:var(--sh-accent);color:var(--sh-accent);font-weight:800;'));
    c.push(rule('.sh-empty-tree', 'padding:26px 16px;text-align:center;font-size:12px;color:var(--sh-muted);line-height:1.6;'));

    /* reading area */
    c.push(rule('.sh-main', 'position:relative;flex:1;min-width:0;display:flex;flex-direction:column;background:var(--sh-bg);'));
    c.push(rule('.sh-progress', 'position:absolute;z-index:5;top:0;left:0;right:0;height:3px;'));
    c.push(rule('.sh-progress i', 'display:block;height:100%;width:0;background:linear-gradient(90deg,#10b981,#38bdf8);border-radius:0 3px 3px 0;transition:width .12s linear;'));
    c.push(rule('.sh-scroll', 'flex:1;min-height:0;overflow-y:auto;'));
    c.push(rule('.sh-reader', 'max-width:800px;margin:0 auto;padding:34px 34px 100px;'));
    c.push(rule('.sh-crumb', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 26px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sh-muted);'));
    c.push(rule('.sh-crumb b', 'color:var(--sh-accent);font-weight:800;'));
    c.push(rule('.sh-welcome', 'min-height:60%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;color:var(--sh-muted);padding:60px 20px;'));
    c.push(rule('.sh-welcome-ico', 'width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:var(--sh-accent-soft);color:var(--sh-accent);font-size:28px;'));
    c.push(rule('.sh-welcome h2', 'margin:6px 0 0;font:800 20px var(--sh-head);color:var(--sh-text);'));
    c.push(rule('.sh-welcome p', 'margin:0;max-width:340px;font-size:13px;line-height:1.7;'));
    c.push(rule('.sh-loading', 'display:flex;flex-direction:column;gap:14px;padding-top:6px;'));
    c.push(rule('.sh-skel', 'height:14px;border-radius:8px;background:linear-gradient(90deg,var(--sh-line),var(--sh-accent-soft),var(--sh-line));background-size:200% 100%;animation:shskel 1.2s linear infinite;'));
    c.push('@keyframes shskel{0%{background-position:200% 0}100%{background-position:-200% 0}}');
    c.push(rule('.sh-error', 'text-align:center;padding:70px 20px;color:var(--sh-muted);font-size:13px;line-height:1.7;'));
    c.push(rule('.sh-error button, .sh-welcome button', 'margin-top:12px;border:0;border-radius:12px;padding:10px 18px;background:var(--sh-accent);color:#022c22;font-weight:800;font-size:12.5px;'));

    /* previous / next */
    c.push(rule('.sh-pager', 'display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:64px;padding-top:26px;border-top:1px dashed var(--sh-line);'));
    c.push(rule('.sh-pager button', 'text-align:left;border:1px solid var(--sh-line);background:var(--sh-panel);color:var(--sh-text);border-radius:16px;padding:14px 16px;transition:border-color .15s,transform .15s;'));
    c.push(rule('.sh-pager button:hover', 'border-color:var(--sh-accent);transform:translateY(-1px);'));
    c.push(rule('.sh-pager small', 'display:block;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--sh-accent);margin-bottom:4px;'));
    c.push(rule('.sh-pager span', 'display:block;font-size:13px;font-weight:700;line-height:1.4;'));
    c.push(rule('.sh-pager .sh-next', 'text-align:right;grid-column:2;'));
    c.push(rule('.sh-pager .sh-prev', 'grid-column:1;'));

    /* ---- THE NOTE ITSELF ---- */
    c.push(rule('.sh-note', 'font-family:var(--sh-body);font-size:16px;line-height:1.85;font-weight:400;color:var(--sh-text);overflow-wrap:break-word;'));
    c.push(rule('.sh-note > :first-child', 'margin-top:0;'));
    c.push(rule('.sh-note h1, .sh-note h2, .sh-note h3, .sh-note h4, .sh-note h5, .sh-note h6', 'font-family:var(--sh-head);color:var(--sh-text);line-height:1.28;letter-spacing:-.015em;scroll-margin-top:20px;'));
    c.push(rule('.sh-note h1', 'font-size:clamp(1.8rem,3.6vw,2.55rem);font-weight:700;margin:0 0 1.6rem;padding-bottom:1.1rem;border-bottom:3px solid var(--sh-accent);'));
    c.push(rule('.sh-note h2', 'font-size:clamp(1.4rem,2.6vw,1.85rem);font-weight:700;margin:3.4rem 0 1.1rem;padding-top:1.7rem;border-top:1px dashed var(--sh-line);'));
    c.push(rule('.sh-note h1 + h2, .sh-note h2:first-child', 'margin-top:2rem;border-top:0;padding-top:0;'));
    c.push(rule('.sh-note h3', 'font-size:clamp(1.18rem,2vw,1.4rem);font-weight:700;margin:2.5rem 0 .85rem;color:var(--sh-accent);'));
    c.push(rule('.sh-note h4', 'font-size:1.08rem;font-weight:700;margin:2rem 0 .6rem;'));
    c.push(rule('.sh-note h5, .sh-note h6', 'font-size:.82rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:1.7rem 0 .5rem;color:var(--sh-muted);'));
    c.push(rule('.sh-note p', 'margin:0 0 1.15rem;'));
    c.push(rule('.sh-note [data-sh="lead"]', 'font-size:1.12rem;font-style:italic;color:var(--sh-muted);margin:-.6rem 0 1.8rem;'));
    c.push(rule('.sh-note strong, .sh-note b', 'font-weight:700;color:var(--sh-strong);'));
    c.push(rule('.sh-note em, .sh-note i', 'font-style:italic;'));
    c.push(rule('.sh-note mark', 'background:var(--sh-mark);color:inherit;padding:.05em .25em;border-radius:5px;'));
    c.push(rule('.sh-note a', 'color:var(--sh-accent);text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px;font-weight:600;'));
    c.push(rule('.sh-note a:hover', 'text-decoration-thickness:2.5px;'));
    c.push(rule('.sh-note ul, .sh-note ol', 'margin:0 0 1.3rem;padding-left:1.7rem;'));
    c.push(rule('.sh-note ul', 'list-style:disc;'));
    c.push(rule('.sh-note ul ul', 'list-style:circle;'));
    c.push(rule('.sh-note ul ul ul', 'list-style:square;'));
    c.push(rule('.sh-note ol', 'list-style:decimal;'));
    c.push(rule('.sh-note ol ol', 'list-style:lower-alpha;'));
    c.push(rule('.sh-note ol ol ol', 'list-style:lower-roman;'));
    c.push(rule('.sh-note li', 'margin:.55rem 0;padding-left:.25rem;'));
    c.push(rule('.sh-note li > ul, .sh-note li > ol', 'margin:.5rem 0 .3rem;'));
    c.push(rule('.sh-note li::marker', 'color:var(--sh-accent);font-weight:700;'));
    c.push(rule('.sh-note blockquote', 'margin:1.6rem 0;padding:1rem 1.3rem;border-left:4px solid var(--sh-accent);background:var(--sh-accent-soft);border-radius:0 14px 14px 0;'));
    c.push(rule('.sh-note blockquote p:last-child', 'margin-bottom:0;'));
    c.push(rule('.sh-note hr', 'border:0;border-top:1px dashed var(--sh-line);margin:2.4rem 0;'));
    c.push(rule('.sh-note code', 'font-family:var(--sh-head);font-size:.9em;background:var(--sh-code);padding:.15em .4em;border-radius:6px;'));
    c.push(rule('.sh-note pre', 'background:var(--sh-code);padding:1rem 1.2rem;border-radius:14px;overflow-x:auto;margin:1.4rem 0;'));
    c.push(rule('.sh-note pre code', 'background:transparent;padding:0;'));
    c.push(rule('.sh-note img', 'display:block;max-width:100%;height:auto;margin:1.6rem auto;border-radius:14px;cursor:zoom-in;box-shadow:0 6px 22px rgba(15,23,42,.12);'));
    c.push(dark('.sh-note img', 'background:#ffffff;box-shadow:0 6px 22px rgba(0,0,0,.5);'));
    c.push(rule('.sh-note p > img:only-child', 'margin:1.6rem auto;'));
    c.push(rule('.sh-note sup, .sh-note sub', 'font-size:.72em;line-height:0;'));
    c.push(rule('.sh-note ::selection', 'background:rgba(16,185,129,.35);'));
    c.push(rule('.sh-table-wrap', 'overflow-x:auto;margin:1.6rem 0;border:1px solid var(--sh-line);border-radius:14px;background:var(--sh-panel);'));
    c.push(rule('.sh-note table', 'width:100%;border-collapse:collapse;font-size:.93rem;line-height:1.6;'));
    c.push(rule('.sh-note td, .sh-note th', 'padding:.7rem .95rem;border-bottom:1px solid var(--sh-line);border-right:1px solid var(--sh-line);text-align:left;vertical-align:top;'));
    c.push(rule('.sh-note td:last-child, .sh-note th:last-child', 'border-right:0;'));
    c.push(rule('.sh-note tr:last-child td', 'border-bottom:0;'));
    c.push(rule('.sh-note table.sh-headrow tr:first-child td, .sh-note th', 'background:var(--sh-accent-soft);font-family:var(--sh-head);font-weight:700;font-size:.85rem;'));
    c.push(rule('.sh-note td p, .sh-note th p', 'margin:0 0 .4rem;'));
    c.push(rule('.sh-note td p:last-child, .sh-note th p:last-child', 'margin:0;'));

    /* embedded players */
    c.push(rule('.sh-embed', 'margin:1.8rem 0;'));
    c.push(rule('.sh-embed-frame', 'position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#0b1220;box-shadow:0 10px 30px rgba(15,23,42,.22);'));
    c.push(rule('.sh-embed-play', 'position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;background-color:#0f172a;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;color:#fff;'));
    c.push(rule('.sh-embed-play::before', 'content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,6,23,.05),rgba(2,6,23,.55));'));
    c.push(rule('.sh-embed-icon', 'position:relative;width:68px;height:68px;border-radius:50%;background:#10b981;color:#022c22;display:flex;align-items:center;justify-content:center;padding-left:4px;box-shadow:0 8px 24px rgba(16,185,129,.45);transition:transform .15s;'));
    c.push(rule('.sh-embed-play:hover .sh-embed-icon', 'transform:scale(1.09);'));
    c.push(rule('.sh-embed-kind', 'position:absolute;left:14px;top:12px;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#fff;background:rgba(2,6,23,.6);padding:4px 9px;border-radius:99px;'));
    c.push(rule('.sh-embed-frame iframe', 'position:absolute;inset:0;width:100%;height:100%;border:0;'));
    c.push(rule('.sh-embed figcaption', 'display:flex;justify-content:space-between;gap:12px;margin-top:.7rem;font-size:.82rem;font-weight:600;color:var(--sh-muted);line-height:1.5;'));
    c.push(rule('.sh-embed figcaption a', 'flex:0 0 auto;font-size:.78rem;'));
    c.push(rule('.sh-note video, .sh-note audio', 'display:block;width:100%;margin:1.6rem 0;border-radius:14px;'));
    c.push(rule('.sh-note video', 'background:#000;'));

    /* picture viewer */
    c.push(rule('.sh-lightbox', 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.93);display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out;'));
    c.push(rule('.sh-lightbox img', 'max-width:96vw;max-height:92vh;border-radius:12px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.6);'));

    /* small screens: the sidebar becomes a drawer over the note */
    c.push('@media (max-width:900px){' +
      rule('.sh-side', 'position:absolute;z-index:30;top:0;bottom:0;left:0;width:min(86vw,350px);flex-basis:auto;box-shadow:var(--sh-shadow);transition:transform .28s ease;') +
      rule('.sh-closed .sh-side', 'width:min(86vw,350px);transform:translateX(-104%);box-shadow:none;border-right-width:1px;') +
      rule('.sh-side-inner', 'width:100%;') +
      rule('.sh-edge', 'left:calc(min(86vw,350px) - 16px);') +
      rule('.sh-closed .sh-edge', 'left:0;') +
      rule('.sh-scrim', 'position:absolute;inset:0;z-index:20;background:rgba(2,6,23,.5);') +
      rule('.sh-closed .sh-scrim', 'display:none;') +
      rule('.sh-reader', 'padding:26px 22px 90px 26px;') +
      rule('.sh-close span', 'display:none;') +
      rule('.sh-brand span', 'display:none;') +
      rule('.sh-note', 'font-size:15.5px;') +
      rule('.sh-pager', 'grid-template-columns:1fr;') +
      rule('.sh-pager .sh-next, .sh-pager .sh-prev', 'grid-column:1;text-align:left;') +
      '}');
    c.push('@media (min-width:901px){' + rule('.sh-scrim', 'display:none;') + '}');
    c.push('@media (prefers-reduced-motion:reduce){' + rule('*', 'transition:none !important;animation:none !important;') + '}');
    return c.join('\n');
  }

  function ensureAssets() {
    if (!document.getElementById('studyHubStyles')) {
      var st = document.createElement('style');
      st.id = 'studyHubStyles';
      st.textContent = buildCss();
      document.head.appendChild(st);
    }
    if (!document.getElementById('studyHubFonts')) {
      var link = document.createElement('link');
      link.id = 'studyHubFonts';
      link.rel = 'stylesheet';
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
  }

  /* ======================================================================= */
  /* MEDIA LINKS (YouTube, Vimeo, Google Drive, Google Slides, direct files) */
  /* ======================================================================= */
  function parseTime(v) {
    if (!v) return 0;
    var s = String(v).trim();
    if (/^\d+$/.test(s)) return Math.min(parseInt(s, 10), 86400);
    var m = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
    if (!m) return 0;
    return Math.min((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0), 86400);
  }

  /** Returns { kind, id, src, thumb, label } for a link that can become a player, or null. */
  function parseMedia(rawUrl) {
    var u;
    try { u = new URL(rawUrl); } catch (e) { return null; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    var host = u.hostname.toLowerCase().replace(/^www\./, '');
    var path = u.pathname;

    // YouTube
    if (host === 'youtu.be' || /(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
      var id = '', list = '';
      if (host === 'youtu.be') {
        id = path.slice(1).split('/')[0];
      } else if (path === '/watch') {
        id = u.searchParams.get('v') || '';
      } else {
        var m = path.match(/^\/(?:shorts|embed|live|v)\/([\w-]+)/);
        if (m) id = m[1];
      }
      list = u.searchParams.get('list') || '';
      if (!/^[\w-]{11}$/.test(id)) id = '';
      if (!/^[\w-]{10,60}$/.test(list)) list = '';
      if (!id && !list) return null;
      var start = parseTime(u.searchParams.get('t') || u.searchParams.get('start') || (u.hash.match(/^#t=(.+)$/) || [])[1]);
      var src = id
        ? 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1' + (start ? '&start=' + start : '') + (list ? '&list=' + list : '')
        : 'https://www.youtube-nocookie.com/embed/videoseries?autoplay=1&rel=0&list=' + list;
      return { kind: 'YouTube', id: id || list, src: src, thumb: id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '', label: 'Video' };
    }

    // Vimeo
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      var vm = path.match(/^\/(?:video\/)?(\d{5,12})/);
      if (!vm) return null;
      var h = u.searchParams.get('h');
      return { kind: 'Vimeo', id: vm[1], src: 'https://player.vimeo.com/video/' + vm[1] + '?autoplay=1' + (h && /^[\w]{6,20}$/.test(h) ? '&h=' + h : ''), thumb: '', label: 'Video' };
    }

    // Google Drive file (video, pdf, image) - must be shared "anyone with the link"
    if (host === 'drive.google.com') {
      var dm = path.match(/^\/file\/d\/([\w-]{10,80})/) || null;
      var did = dm ? dm[1] : (path === '/open' ? u.searchParams.get('id') : '');
      if (!did || !/^[\w-]{10,80}$/.test(did)) return null;
      return { kind: 'Google Drive', id: did, src: 'https://drive.google.com/file/d/' + did + '/preview', thumb: '', label: 'File' };
    }

    // Google Slides - must be shared "anyone with the link"
    if (host === 'docs.google.com') {
      var sm = path.match(/^\/presentation\/d\/([\w-]{10,80})/);
      if (!sm) return null;
      return { kind: 'Slides', id: sm[1], src: 'https://docs.google.com/presentation/d/' + sm[1] + '/embed?start=false&loop=false&delayms=3000', thumb: '', label: 'Slides' };
    }

    // Files on any site
    var ext = (path.match(/\.([a-z0-9]{2,5})$/i) || [])[1];
    ext = ext ? ext.toLowerCase() : '';
    if (/^(mp4|webm|ogv|mov)$/.test(ext)) return { kind: 'video-file', src: u.href };
    if (/^(mp3|wav|ogg|m4a|aac)$/.test(ext)) return { kind: 'audio-file', src: u.href };
    if (/^(png|jpe?g|gif|webp|avif)$/.test(ext)) return { kind: 'image-file', src: u.href };
    return null;
  }

  function embedHtml(media, caption, originalUrl) {
    var cap = esc(caption || '');
    if (media.kind === 'video-file') return '<video controls preload="metadata" playsinline src="' + esc(media.src) + '"></video>';
    if (media.kind === 'audio-file') return '<audio controls preload="none" src="' + esc(media.src) + '"></audio>';
    if (media.kind === 'image-file') return '<img src="' + esc(media.src) + '" alt="' + cap + '" loading="lazy">';
    var style = media.thumb ? ' style="background-image:url(&quot;' + esc(media.thumb) + '&quot;)"' : '';
    return '<figure class="sh-embed" data-sh-embed="' + esc(media.src) + '" data-sh-title="' + cap + '">' +
      '<div class="sh-embed-frame">' +
      '<button type="button" class="sh-embed-play" aria-label="Play: ' + cap + '"' + style + '>' +
      '<span class="sh-embed-kind">' + esc(media.kind) + '</span>' +
      '<span class="sh-embed-icon">' + ICON.play + '</span></button></div>' +
      '<figcaption><span>' + cap + '</span><a href="' + esc(originalUrl) + '" target="_blank" rel="noopener noreferrer">Open &#8599;</a></figcaption></figure>';
  }

  /* ======================================================================= */
  /* NOTE CLEANING: Google Docs HTML  ->  tidy, safe, semantic HTML          */
  /* ======================================================================= */
  var DROP = 'script,style,link,meta,title,noscript,iframe,frame,frameset,object,embed,applet,form,input,button,textarea,select,option,base,svg,math,template,canvas,audio,video,source,track,head';

  function parseCssClasses(css) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;/g, '');
    var map = {}, order = 0;
    var re = /([^{}]+)\{([^{}]*)\}/g, m;
    while ((m = re.exec(css))) {
      order++;
      var decls = {};
      m[2].split(';').forEach(function (d) {
        var i = d.indexOf(':');
        if (i > 0) decls[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim().toLowerCase();
      });
      m[1].split(',').forEach(function (sel) {
        var s = sel.trim().match(/^(?:[a-z0-9]+)?\.([A-Za-z0-9_-]+)$/);
        if (!s) return;
        map[s[1]] = map[s[1]] || { props: {}, order: 0 };
        Object.assign(map[s[1]].props, decls);
        map[s[1]].order = order;
      });
    }
    return map;
  }

  function formatFlags(el, map) {
    var props = {};
    (el.getAttribute('class') || '').split(/\s+/).filter(function (cl) { return map[cl]; })
      .sort(function (a, b) { return map[a].order - map[b].order; })
      .forEach(function (cl) { Object.assign(props, map[cl].props); });
    var weight = props['font-weight'] || '';
    var deco = (props['text-decoration'] || '') + ' ' + (props['text-decoration-line'] || '');
    var bg = props['background-color'] || '';
    return {
      bold: weight === 'bold' || weight === 'bolder' || parseInt(weight, 10) >= 600,
      italic: props['font-style'] === 'italic',
      underline: /underline/.test(deco),
      strike: /line-through/.test(deco),
      sup: props['vertical-align'] === 'super',
      sub: props['vertical-align'] === 'sub',
      mark: !!bg && !/^(transparent|initial|inherit|none|#fff|#ffffff|white|rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(,\s*[\d.]+\s*)?\))$/.test(bg)
    };
  }

  function unwrap(el) {
    var parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  function unwrapGoogleRedirect(href) {
    try {
      var u = new URL(href, 'https://x.invalid/');
      if (/^(www\.)?google\.[a-z.]+$/.test(u.hostname) && u.pathname === '/url') {
        var q = u.searchParams.get('q') || u.searchParams.get('url');
        if (q) return q;
      }
    } catch (e) { /* fall through */ }
    return href;
  }

  function safeUrl(raw, base, allowData) {
    var v = String(raw || '').trim();
    if (!v) return '';
    if (v.charAt(0) === '#') return v;
    if (allowData && /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
    try {
      var u = new URL(v, base);
      if (/^https?:$/.test(u.protocol) || (!allowData && /^(mailto|tel):$/.test(u.protocol))) return u.href;
    } catch (e) { /* unsafe or broken */ }
    return '';
  }

  function isBlank(node) {
    if (node.nodeType === 3) return !/\S/.test(node.nodeValue.replace(/\u00a0/g, ' '));
    if (node.nodeType !== 1) return true;
    if (node.querySelector('img,table,ul,ol,hr,iframe,video,audio')) return false;
    return !/\S/.test((node.textContent || '').replace(/\u00a0/g, ' '));
  }

  /** Google Docs exports every list level as a separate sibling list. Put the levels back inside each other. */
  function rebuildLists(root) {
    var stack = [];
    Array.prototype.slice.call(root.children).forEach(function (node) {
      var isList = /^(UL|OL)$/.test(node.tagName);
      var m = isList ? (node.getAttribute('class') || '').match(/lst-kix_([A-Za-z0-9]+)-(\d+)/) : null;
      if (!m) { if (!isBlank(node) || isList) stack = []; return; }
      var info = { el: node, id: m[1], level: parseInt(m[2], 10) };
      if (stack.length && stack[0].id !== info.id) stack = [];
      while (stack.length && stack[stack.length - 1].level > info.level) stack.pop();
      var top = stack[stack.length - 1];
      if (!top) { stack.push(info); return; }
      if (top.level === info.level) {
        if (top.el.tagName === node.tagName) {
          while (node.firstChild) top.el.appendChild(node.firstChild);
          node.parentNode.removeChild(node);
        } else {
          top.el.parentNode.insertBefore(node, top.el.nextSibling);
          stack[stack.length - 1] = info;
        }
      } else {
        var lastLi = top.el.lastElementChild;
        if (lastLi && lastLi.tagName === 'LI') { lastLi.appendChild(node); stack.push(info); }
        else { stack = [info]; }
      }
    });
  }

  var KEEP_ATTRS = {
    A: ['href'], IMG: ['src', 'alt', 'title', 'loading', 'decoding', 'referrerpolicy'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'], OL: ['start'],
    H1: ['id'], H2: ['id'], H3: ['id'], H4: ['id'], H5: ['id'], H6: ['id']
  };

  function normalizeNote(htmlText, entry) {
    entry = entry || {};
    var baseHref = 'https://x.invalid/';
    try { baseHref = new URL(entry.filePath || '', document.baseURI).href; } catch (e) { /* keep default */ }

    var doc = new DOMParser().parseFromString(String(htmlText || ''), 'text/html');
    var classMap = parseCssClasses(Array.prototype.map.call(doc.querySelectorAll('style'), function (s) { return s.textContent || ''; }).join('\n'));
    var body = doc.body;

    // 1. remove anything that can run code or restyle the page
    Array.prototype.slice.call(body.querySelectorAll(DROP)).forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });

    // 2. headings that Google calls "Title" and "Subtitle"
    Array.prototype.slice.call(body.querySelectorAll('p')).forEach(function (p) {
      var cls = ' ' + (p.getAttribute('class') || '') + ' ';
      var role = / title /.test(cls) ? 'h1' : (/ subtitle /.test(cls) ? 'lead' : '');
      if (!role) return;
      if (role === 'h1') {
        var h = doc.createElement('h1');
        while (p.firstChild) h.appendChild(p.firstChild);
        p.parentNode.replaceChild(h, p);
      } else {
        p.setAttribute('data-sh', 'lead');
      }
    });

    // 3. bold / italic / underline / highlight stored as CSS classes -> real tags
    Array.prototype.slice.call(body.querySelectorAll('span')).forEach(function (span) {
      var f = formatFlags(span, classMap);
      var chain = [];
      if (f.bold) chain.push('strong');
      if (f.italic) chain.push('em');
      if (f.underline && !span.closest('a')) chain.push('u');
      if (f.strike) chain.push('s');
      if (f.mark) chain.push('mark');
      if (f.sup) chain.push('sup');
      if (f.sub) chain.push('sub');
      if (!chain.length) { unwrap(span); return; }
      var outer = null, inner = null;
      chain.forEach(function (tag) {
        var e = doc.createElement(tag);
        if (!outer) outer = e; else inner.appendChild(e);
        inner = e;
      });
      while (span.firstChild) inner.appendChild(span.firstChild);
      span.parentNode.replaceChild(outer, span);
    });
    Array.prototype.slice.call(body.querySelectorAll('h1,h2,h3,h4,h5,h6')).forEach(function (h) {
      Array.prototype.slice.call(h.querySelectorAll('strong,b')).forEach(unwrap);   // headings are styled by the page, not by the doc
    });

    // 4. flat Google Docs lists -> properly nested lists
    rebuildLists(body);

    // 5. links
    Array.prototype.slice.call(body.querySelectorAll('a')).forEach(function (a) {
      var href = a.getAttribute('href');
      if (href == null) { unwrap(a); return; }
      var clean = safeUrl(unwrapGoogleRedirect(href), baseHref, false);
      if (!clean) { unwrap(a); return; }
      a.setAttribute('href', clean);
    });

    // 6. pictures
    Array.prototype.slice.call(body.querySelectorAll('img')).forEach(function (img) {
      var src = safeUrl(img.getAttribute('src'), baseHref, true);
      if (!src) { img.parentNode.removeChild(img); return; }
      img.setAttribute('src', src);
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('referrerpolicy', 'no-referrer');
      if (!img.getAttribute('alt')) img.setAttribute('alt', 'Picture from the notes');
    });

    // 7. strip every attribute that is not on the list (this removes all inline styles, classes and event handlers)
    Array.prototype.slice.call(body.querySelectorAll('*')).forEach(function (el) {
      var keep = (KEEP_ATTRS[el.tagName] || []).concat(el.getAttribute('data-sh') === 'lead' ? ['data-sh'] : []);
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        if (keep.indexOf(attr.name) === -1) el.removeAttribute(attr.name);
      });
    });

    // 8. tidy: empty paragraphs, stray line breaks, wrapper elements
    Array.prototype.slice.call(body.querySelectorAll('font,center,div,section,article,main,header,footer,nav,aside')).forEach(unwrap);
    Array.prototype.slice.call(body.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6')).forEach(function (el) {
      while (el.firstChild && el.firstChild.nodeName === 'BR') el.removeChild(el.firstChild);
      while (el.lastChild && el.lastChild.nodeName === 'BR') el.removeChild(el.lastChild);
    });
    Array.prototype.slice.call(body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,ul,ol,strong,em,u,s,mark,sup,sub')).forEach(function (el) {
      if (el.parentNode && isBlank(el) && !el.querySelector('br')) el.parentNode.removeChild(el);
    });
    Array.prototype.slice.call(body.querySelectorAll('p')).forEach(function (p) { if (p.parentNode && isBlank(p)) p.parentNode.removeChild(p); });

    // 9. players for video / slides / files that were pasted as links
    Array.prototype.slice.call(body.querySelectorAll('a[href]')).forEach(function (a) {
      var media = parseMedia(a.getAttribute('href'));
      if (!media) return;
      var block = a.closest('li,p,h1,h2,h3,h4,h5,h6,td,th') || null;
      if (!block || !body.contains(block)) return;
      var caption = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!caption || /^https?:\/\//i.test(caption)) caption = media.kind === 'YouTube' || media.kind === 'Vimeo' ? 'Watch the video' : 'Open';
      var holder = doc.createElement('div');
      holder.innerHTML = embedHtml(media, caption, a.getAttribute('href'));
      var player = holder.firstChild;

      var prev = a.previousSibling, next = a.nextSibling;
      // "alone" = on its own line: nothing but a line break, blank space, the end of the block, or a block-level
      // neighbour (such as a nested list) on either side
      var edge = function (n) { return !n || n.nodeName === 'BR' || (n.nodeType === 3 && !/\S/.test(n.nodeValue)) || /^(UL|OL|TABLE|FIGURE|P|H[1-6]|DIV)$/.test(n.nodeName); };
      var alone = edge(prev) && edge(next);
      if (alone) {
        var lineBreak = prev && prev.nodeName === 'BR' ? prev : null;     // the line break that held the link on its own line
        if (a.parentNode) a.parentNode.removeChild(a);
        if (lineBreak && lineBreak.parentNode) lineBreak.parentNode.removeChild(lineBreak);
      } else {
        unwrap(a);
      }

      if (block.tagName === 'LI' || block.tagName === 'TD' || block.tagName === 'TH') {
        var nestedList = block.querySelector(':scope > ul, :scope > ol');       // keep the player with its own sentence, above the sub-points
        if (nestedList) block.insertBefore(player, nestedList); else block.appendChild(player);
      } else {
        block.parentNode.insertBefore(player, block.nextSibling);
      }
      if (block.tagName === 'P' && isBlank(block)) block.parentNode.removeChild(block);
    });
    Array.prototype.slice.call(body.querySelectorAll('li,td,th,p')).forEach(function (el) {
      while (el.lastChild && el.lastChild.nodeName === 'BR') el.removeChild(el.lastChild);
    });

    // 10. tables get a scrolling frame, and the first row looks like a header
    Array.prototype.slice.call(body.querySelectorAll('table')).forEach(function (t) {
      if (!t.querySelector('th')) t.className = 'sh-headrow';
      var wrap = doc.createElement('div');
      wrap.className = 'sh-table-wrap';
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    // 11. every note starts with a heading
    var first = body.firstElementChild;
    if (!first || !/^H[1-2]$/.test(first.tagName)) {
      var h1 = doc.createElement('h1');
      h1.textContent = entry.title || 'Notes';
      body.insertBefore(h1, body.firstChild);
    }

    // links that leave the site open in a new tab
    Array.prototype.slice.call(body.querySelectorAll('a[href]')).forEach(function (a) {
      if (/^https?:/i.test(a.getAttribute('href'))) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
    });

    return body.innerHTML;
  }

  /* ======================================================================= */
  /* THE INDEX (list of notes)                                               */
  /* ======================================================================= */
  function cleanIndex(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (n) { return n && typeof n.filePath === 'string' && n.filePath && typeof n.title === 'string'; }).map(function (n) {
      return {
        subject: String(n.subject || 'Notes'),
        unit: String(n.unit || 'General'),
        title: n.title,
        filePath: n.filePath,
        keywords: Array.isArray(n.keywords) ? n.keywords.map(String) : []
      };
    });
  }

  async function fetchIndex() {
    try {
      var res = await fetch(INDEX_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.index = cleanIndex(await res.json());
      state.indexLoaded = true;
      state.indexError = false;
    } catch (err) {
      console.error('Study Hub: could not load the notes list.', err);
      state.indexError = true;
    }
    return state.indexLoaded;
  }

  function subjects() {
    var seen = {}, out = [];
    state.index.forEach(function (n) { if (!seen[n.subject]) { seen[n.subject] = true; out.push(n.subject); } });
    return out;
  }

  function notesOfSubject(subject) { return state.index.filter(function (n) { return n.subject === subject; }); }

  /* ======================================================================= */
  /* DRAWING THE HUB                                                         */
  /* ======================================================================= */
  function q(sel) { return state.container ? state.container.querySelector(sel) : null; }

  function buildShell(container) {
    container.innerHTML =
      '<div class="sh-root">' +
        '<div class="sh-top">' +
          '<div class="sh-brand"><div class="sh-brand-ico">' + ICON.book + '</div><span>Study Hub</span></div>' +
          '<div class="sh-tabs" role="tablist" aria-label="Subjects"></div>' +
          '<button type="button" class="sh-close" aria-label="Close Study Hub" title="Close (Esc)">' + ICON.close + '<span>Close</span></button>' +
        '</div>' +
        '<div class="sh-body">' +
          '<aside class="sh-side" aria-label="Syllabus">' +
            '<div class="sh-side-inner">' +
              '<div class="sh-search">' + ICON.search + '<input type="search" class="sh-search-input" placeholder="Search topics or keywords" aria-label="Search topics" autocomplete="off"></div>' +
              '<div class="sh-tree"></div>' +
            '</div>' +
          '</aside>' +
          '<div class="sh-scrim"></div>' +
          '<button type="button" class="sh-edge" aria-label="Hide the topic list" title="Hide the topic list"></button>' +
          '<main class="sh-main">' +
            '<div class="sh-progress"><i></i></div>' +
            '<div class="sh-scroll"><div class="sh-reader"></div></div>' +
          '</main>' +
        '</div>' +
      '</div>';
  }

  function applySidebar() {
    var body = q('.sh-body');
    var edge = q('.sh-edge');
    if (!body || !edge) return;
    body.classList.toggle('sh-closed', !state.sidebarOpen);
    edge.innerHTML = state.sidebarOpen ? ICON.left : ICON.right;
    var label = state.sidebarOpen ? 'Hide the topic list' : 'Show the topic list';
    edge.setAttribute('aria-label', label);
    edge.setAttribute('title', label);
    edge.setAttribute('aria-expanded', state.sidebarOpen ? 'true' : 'false');
  }

  function setSidebar(open, remember) {
    state.sidebarOpen = !!open;
    applySidebar();
    if (remember) store(SIDEBAR_KEY, open ? '1' : '0');
  }

  function renderTabs() {
    var tabs = q('.sh-tabs');
    if (!tabs) return;
    tabs.innerHTML = subjects().map(function (s) {
      return '<button type="button" class="sh-tab" role="tab" data-subject="' + esc(s) + '" aria-selected="' + (s === state.subject ? 'true' : 'false') + '">' + esc(s) + '</button>';
    }).join('');
  }

  function renderTree() {
    var tree = q('.sh-tree');
    if (!tree) return;
    var query = state.query.trim().toLowerCase();
    var list = notesOfSubject(state.subject);

    if (!state.indexLoaded) {
      tree.innerHTML = '<div class="sh-empty-tree">' + (state.indexError ? 'Could not load the topics.<br>Check your connection.' : 'Loading topics...') + '</div>';
      return;
    }
    if (query) {
      list = list.filter(function (n) {
        return n.title.toLowerCase().indexOf(query) !== -1 ||
               n.unit.toLowerCase().indexOf(query) !== -1 ||
               n.keywords.some(function (k) { return k.toLowerCase().indexOf(query) !== -1; });
      });
    }
    if (!list.length) {
      tree.innerHTML = '<div class="sh-empty-tree">' + (query ? 'No topics match "' + esc(state.query.trim()) + '".' : 'No topics here yet.') + '</div>';
      return;
    }

    var units = [], byUnit = {};
    list.forEach(function (n) {
      if (!byUnit[n.unit]) { byUnit[n.unit] = []; units.push(n.unit); }
      byUnit[n.unit].push(n);
    });

    tree.innerHTML = units.map(function (u) {
      var open = !!query || !!state.openUnits[u] || (state.current && state.current.unit === u && state.current.subject === state.subject);
      return '<section class="sh-unit' + (open ? ' sh-open' : '') + '" data-unit="' + esc(u) + '">' +
        '<button type="button" class="sh-unit-head" aria-expanded="' + (open ? 'true' : 'false') + '"><span class="sh-unit-name">' + esc(u) + '</span><span class="sh-unit-count">' + byUnit[u].length + '</span>' + ICON.down + '</button>' +
        '<div class="sh-unit-body">' + byUnit[u].map(function (n) {
          var current = state.current && state.current.filePath === n.filePath;
          return '<button type="button" class="sh-item" data-path="' + esc(n.filePath) + '"' + (current ? ' aria-current="true"' : '') + '>' + esc(n.title) + '</button>';
        }).join('') + '</div></section>';
    }).join('');
  }

  function renderWelcome() {
    var reader = q('.sh-reader');
    if (!reader) return;
    if (state.indexLoaded && !state.index.length) {
      reader.innerHTML = '<div class="sh-welcome"><div class="sh-welcome-ico">&#128214;</div><h2>Notes are on their way</h2><p>' +
        (isTeacher() ? 'No notes have been published yet. In Apps Script, run <code>syncAllNotesToGitHub</code>, then reopen the Study Hub.' : 'Your teacher has not published notes here yet. Please check back soon.') + '</p></div>';
      return;
    }
    if (state.indexError && !state.indexLoaded) {
      reader.innerHTML = '<div class="sh-error">Could not load the topics.<br>Please check your connection.<br><button type="button" data-act="retry-index">Try again</button></div>';
      return;
    }
    reader.innerHTML = '<div class="sh-welcome"><div class="sh-welcome-ico">&#128214;</div><h2>Pick a topic to start</h2><p>Choose a subject at the top, then a topic from the list. Use the arrow on the edge of the list to hide or show it.</p></div>';
  }

  function crumb(entry) {
    return '<div class="sh-crumb"><b>' + esc(entry.subject) + '</b><span>&rsaquo;</span><span>' + esc(entry.unit) + '</span></div>';
  }

  function pagerHtml(entry) {
    var list = notesOfSubject(entry.subject);
    var i = list.findIndex(function (n) { return n.filePath === entry.filePath; });
    var prev = i > 0 ? list[i - 1] : null, next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
    if (!prev && !next) return '';
    return '<nav class="sh-pager" aria-label="Previous and next topic">' +
      (prev ? '<button type="button" class="sh-prev" data-path="' + esc(prev.filePath) + '"><small>&larr; Previous</small><span>' + esc(prev.title) + '</span></button>' : '') +
      (next ? '<button type="button" class="sh-next" data-path="' + esc(next.filePath) + '"><small>Next &rarr;</small><span>' + esc(next.title) + '</span></button>' : '') +
      '</nav>';
  }

  async function fetchNote(entry) {
    if (noteCache[entry.filePath]) return noteCache[entry.filePath];
    var url = new URL(entry.filePath, document.baseURI).href;
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var text = await res.text();
    noteCache[entry.filePath] = text;
    return text;
  }

  async function openNote(entry, opts) {
    opts = opts || {};
    var reader = q('.sh-reader');
    if (!reader || !entry) return;
    state.current = entry;
    var token = ++loadToken;

    reader.innerHTML = crumb(entry) + '<div class="sh-loading"><div class="sh-skel" style="width:62%;height:30px"></div><div class="sh-skel" style="width:100%"></div><div class="sh-skel" style="width:94%"></div><div class="sh-skel" style="width:97%"></div><div class="sh-skel" style="width:70%"></div></div>';
    var scroller = q('.sh-scroll');
    if (scroller) scroller.scrollTop = 0;
    updateProgress();
    renderTree();

    try {
      var raw = await fetchNote(entry);
      if (token !== loadToken) return;               // the student already clicked something else
      var html = normalizeNote(raw, entry);
      reader.innerHTML = crumb(entry) + '<article class="sh-note">' + html + '</article>' + pagerHtml(entry);
    } catch (err) {
      if (token !== loadToken) return;
      console.error('Study Hub: could not load a note.', err);
      reader.innerHTML = crumb(entry) + '<div class="sh-error">Could not load this note.<br>Please check your connection.<br><button type="button" data-act="retry-note" data-path="' + esc(entry.filePath) + '">Try again</button></div>';
    }
    if (scroller) scroller.scrollTop = 0;
    updateProgress();
    if (opts.closeDrawer && window.matchMedia && window.matchMedia('(max-width:900px)').matches) setSidebar(false, false);
  }

  // Nothing is open yet for this subject: open the first unit so there is something to click
  function openFirstUnit(subject) {
    var list = notesOfSubject(subject);
    if (!list.length) return;
    var decided = list.some(function (n) { return state.openUnits[n.unit] !== undefined; });
    if (!decided) state.openUnits[list[0].unit] = true;
  }

  function selectSubject(subject) {
    state.subject = subject;
    openFirstUnit(subject);
    state.query = '';
    var input = q('.sh-search-input');
    if (input) input.value = '';
    renderTabs();
    renderTree();
  }

  function updateProgress() {
    var s = q('.sh-scroll'), bar = q('.sh-progress i');
    if (!s || !bar) return;
    var max = s.scrollHeight - s.clientHeight;
    bar.style.width = (max > 0 ? Math.min(100, Math.max(0, (s.scrollTop / max) * 100)) : 0) + '%';
  }

  function openLightbox(src, alt) {
    var box = document.createElement('div');
    box.className = 'sh-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Picture');
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    box.appendChild(img);
    box.addEventListener('click', function () { if (box.parentNode) box.parentNode.removeChild(box); });
    (state.container || document.body).appendChild(box);
  }

  function playEmbed(figure) {
    var src = figure.getAttribute('data-sh-embed') || '';
    if (!/^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|drive\.google\.com\/file\/d\/|docs\.google\.com\/presentation\/d\/)/.test(src)) return;
    var frame = figure.querySelector('.sh-embed-frame');
    if (!frame) return;
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = figure.getAttribute('data-sh-title') || 'Embedded media';
    iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.innerHTML = '';
    frame.appendChild(iframe);
  }

  /* ======================================================================= */
  /* EVENTS                                                                  */
  /* ======================================================================= */
  function wire(container) {
    container.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;

      if (t.closest('.sh-close')) { if (typeof closeStudyHubModal === 'function') closeStudyHubModal(); return; }
      if (t.closest('.sh-edge')) { setSidebar(!state.sidebarOpen, true); return; }
      if (t.closest('.sh-scrim')) { setSidebar(false, false); return; }

      var tab = t.closest('.sh-tab');
      if (tab) { selectSubject(tab.getAttribute('data-subject')); return; }

      var head = t.closest('.sh-unit-head');
      if (head) {
        var unit = head.parentNode;
        var name = unit.getAttribute('data-unit');
        var nowOpen = !unit.classList.contains('sh-open');
        unit.classList.toggle('sh-open', nowOpen);
        head.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
        state.openUnits[name] = nowOpen;
        return;
      }

      var item = t.closest('.sh-item, .sh-prev, .sh-next');
      if (item) {
        var entry = state.index.find(function (n) { return n.filePath === item.getAttribute('data-path'); });
        if (entry) {
          if (state.subject !== entry.subject) { state.subject = entry.subject; renderTabs(); }
          state.openUnits[entry.unit] = true;
          openNote(entry, { closeDrawer: true });
        }
        return;
      }

      var act = t.closest('[data-act]');
      if (act) {
        var what = act.getAttribute('data-act');
        if (what === 'retry-index') {
          fetchIndex().then(function () { renderTabs(); if (!state.subject && subjects().length) state.subject = subjects()[0]; renderTabs(); renderTree(); renderWelcome(); });
        } else if (what === 'retry-note') {
          var again = state.index.find(function (n) { return n.filePath === act.getAttribute('data-path'); });
          if (again) { delete noteCache[again.filePath]; openNote(again); }
        }
        return;
      }

      var play = t.closest('.sh-embed-play');
      if (play) { playEmbed(play.closest('.sh-embed')); return; }

      var img = t.closest('.sh-note img');
      if (img) { openLightbox(img.currentSrc || img.src, img.alt); return; }

      var anchor = t.closest('.sh-note a[href^="#"]');
      if (anchor) {
        e.preventDefault();
        var id = (anchor.getAttribute('href') || '').slice(1);
        var target = id ? container.querySelector('.sh-note [id="' + id.replace(/"/g, '') + '"]') : null;
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    container.addEventListener('input', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('sh-search-input')) {
        state.query = e.target.value;
        renderTree();
      }
    });

    var scroller = container.querySelector('.sh-scroll');
    if (scroller) scroller.addEventListener('scroll', updateProgress, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !state.container) return;
    var modal = document.getElementById('studyHubModal');
    if (modal && modal.classList.contains('hidden')) return;
    var box = state.container.querySelector('.sh-lightbox');
    if (box) { box.parentNode.removeChild(box); return; }
    if (typeof closeStudyHubModal === 'function') closeStudyHubModal();
  });

  /* ======================================================================= */
  /* PUBLIC ENTRY POINTS (the page already calls these)                      */
  /* ======================================================================= */
  async function loadStudyHub(containerId) {
    var container = document.getElementById(containerId || 'studyHubContainer');
    if (!container) return;
    ensureAssets();

    var firstTime = state.container !== container || !container.querySelector('.sh-root');
    state.container = container;

    if (firstTime) {
      var saved = recall(SIDEBAR_KEY);
      state.sidebarOpen = saved === null ? true : saved === '1';
      buildShell(container);
      wire(container);
      applySidebar();
      renderTabs();
      renderTree();
      renderWelcome();
    }

    // look for new or updated notes every time the hub is opened
    if (!state.indexLoaded || !state.index.length || state.indexError) await fetchIndex();
    if (!state.subject || subjects().indexOf(state.subject) === -1) state.subject = subjects()[0] || '';
    openFirstUnit(state.subject);
    renderTabs();
    renderTree();
    if (!state.current) renderWelcome();
    updateProgress();
  }

  function initStudyEngine() {
    ensureAssets();
    return fetchIndex();
  }

  window.loadStudyHub = loadStudyHub;
  window.initStudyEngine = initStudyEngine;
  window.StudyHub = { normalizeNote: normalizeNote, parseMedia: parseMedia, state: state, version: 2 };

  document.addEventListener('DOMContentLoaded', initStudyEngine);
})();
