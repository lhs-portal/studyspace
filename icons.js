/**
 * Studyspace - small inline SVG icon set (Version 16).
 *
 * Icons are solid, full-colour shapes rather than thin outlines. They need no
 * font or CDN, so they still work offline. Achievement-style symbols (streak
 * flame, broken heart, medals) stay as emoji by design.
 */
(function (global) {
  'use strict';

  var SHAPES = {
    gear: '<path fill="#9a9a9a" d="M9.25 2.1a.8.8 0 0 1 .78-.62h4.1a.8.8 0 0 1 .78.62l.47 2.12a7.4 7.4 0 0 1 1.25.72l2.06-.64a.8.8 0 0 1 .95.36l1.98 3.43a.8.8 0 0 1-.18.95l-1.62 1.44a7.6 7.6 0 0 1 0 1.44l1.62 1.44a.8.8 0 0 1 .18.95l-1.98 3.43a.8.8 0 0 1-.95.36l-2.06-.64a7.4 7.4 0 0 1-1.25.72l-.47 2.12a.8.8 0 0 1-.78.62H10a.8.8 0 0 1-.78-.62l-.47-2.12a7.4 7.4 0 0 1-1.25-.72l-2.06.64a.8.8 0 0 1-.95-.36l-1.98-3.43a.8.8 0 0 1 .18-.95l1.62-1.44a7.6 7.6 0 0 1 0-1.44l-1.62-1.44a.8.8 0 0 1-.18-.95L4.96 4.66a.8.8 0 0 1 .95-.36l2.06.64a7.4 7.4 0 0 1 1.25-.72L9.63 2.1Z"/><circle cx="12" cy="12" r="3.4" fill="#242424"/>',
    sun: '<circle cx="12" cy="12" r="4.7" fill="#fbbf24"/><g stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"><path d="M12 1.8v2.3M12 19.9v2.3M1.8 12h2.3M19.9 12h2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M19.2 4.8l-1.6 1.6M6.4 17.6l-1.6 1.6"/></g>',
    moon: '<path fill="#d4d4d4" d="M20.8 14.7A8.8 8.8 0 0 1 9.3 3.2 8.8 8.8 0 1 0 20.8 14.7Z"/>',
    refresh: '<path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8" fill="none" stroke="#9a9a9a" stroke-width="3.2" stroke-linecap="round"/><path fill="#9a9a9a" d="M20.2 2.1 23.6 8l-6.2 1.4 2.8-7.3Z"/>',
    signOut: '<path fill="#9a9a9a" d="M4 3h7v2H6v14h5v2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><rect x="9" y="11" width="10" height="2" rx="1" fill="#d4d4d4"/><path fill="#d4d4d4" d="m14.6 7.2 1.4-1.4 5.6 5.6-5.6 5.6-1.4-1.4 3.6-3.6H9.5v-2h8.7l-3.6-3.8Z"/>',
    bell: '<path fill="#fbbf24" d="M12 2.1a5.9 5.9 0 0 0-5.9 5.9c0 5.9-2.6 6.6-3.2 8.4-.2.6.2 1.2.9 1.2h16.4c.7 0 1.1-.6.9-1.2-.6-1.8-3.2-2.5-3.2-8.4A5.9 5.9 0 0 0 12 2.1Z"/><path fill="#b45309" d="M9.8 20.3a2.2 2.2 0 0 0 4.4 0H9.8Z"/>',
    close: '<path fill="#e0e0e0" d="M18.7 5.3a1 1 0 0 0-1.4 0L12 10.6 6.7 5.3a1 1 0 0 0-1.4 1.4l5.3 5.3-5.3 5.3a1 1 0 1 0 1.4 1.4L12 13.4l5.3 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.3-5.3a1 1 0 0 0 0-1.4Z"/>',
    book: '<path fill="#0ea5e9" d="M4 4.6A2.6 2.6 0 0 1 6.6 2H20v17.4H6.6A2.6 2.6 0 0 0 4 22V4.6Z"/><path fill="#bae6fd" d="M7.4 5.4h9.4v2.2H7.4zM7.4 9.2h9.4v2.2H7.4zM7.4 13h6.6v2.2H7.4z"/><path fill="#0284c7" d="M6.6 17H20v2H6.6a2.6 2.6 0 0 0-2.6 2.6V19.6A2.6 2.6 0 0 1 6.6 17Z"/>',
    bookOpen: '<path fill="#10b981" d="M12 5.6C10.1 4 7.8 3.6 4.5 3.6H3v14h1.5c3.3 0 5.6.4 7.5 2 1.9-1.6 4.2-2 7.5-2H21v-14h-1.5c-3.3 0-5.6.4-7.5 2Z"/><path fill="#a7f3d0" d="M5.5 6.2h4.2v1.9H5.5zM14.3 6.2h4.2v1.9h-4.2zM5.5 9.8h3.4v1.8H5.5zM14.3 9.8h4.2v1.8h-4.2z"/><path fill="#047857" d="M11.3 6h1.4v13.2h-1.4z"/>',
    lock: '<path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#9a9a9a" stroke-width="3" stroke-linecap="round"/><rect x="4" y="9.5" width="16" height="11.5" rx="2.5" fill="#717171"/><circle cx="12" cy="14.4" r="1.6" fill="#242424"/><path fill="#242424" d="M11.2 15.7h1.6l.5 3h-2.6l.5-3Z"/>',
    graduation: '<path fill="#34d399" d="m2 8 10-4.8L22 8l-10 4.8L2 8Z"/><path fill="#059669" d="M6 10.4v4.3c0 1.9 2.7 3.3 6 3.3s6-1.4 6-3.3v-4.3l-6 2.9-6-2.9Z"/><path fill="#fbbf24" d="M20.4 8.2h1.6v6h-1.6z"/><circle cx="21.2" cy="14.7" r="1.4" fill="#fbbf24"/>',
    rocket: '<path fill="#f43f5e" d="M12 2c3.6 2 5.3 5.6 5 10l-3.2 3.2h-3.6L7 12c-.3-4.4 1.4-8 5-10Z"/><circle cx="12" cy="9" r="2" fill="#fda4af"/><path fill="#fb923c" d="m9 12-4 2 1.5 3.5L10 16l-1-4Zm6 0 4 2-1.5 3.5L14 16l1-4Z"/><path fill="#fbbf24" d="M10.4 17h3.2L12 22l-1.6-5Z"/>',
    home: '<path fill="#9a9a9a" d="M11.2 2.8a1.3 1.3 0 0 1 1.6 0l8.2 6.5a1.3 1.3 0 0 1 .5 1v10a1.3 1.3 0 0 1-1.3 1.3h-5.1v-6.4H9v6.4H3.8A1.3 1.3 0 0 1 2.5 20.3v-10a1.3 1.3 0 0 1 .5-1l8.2-6.5Z"/><path fill="#d4d4d4" d="M12 5 5 10.4V19h2.7v-6.4h8.6V19H19v-8.6L12 5Z"/>',
    quiz: '<rect x="3" y="2.5" width="18" height="19" rx="2.5" fill="#9a9a9a"/><path fill="#e9e9e9" d="M6 5.8h12v2.4H6zM6 10h8v2.4H6zM6 14.2h5v2.4H6z"/><path fill="#34d399" d="m16.1 12.7 1.7 1.7 3.2-3.4-1.6-1.5-3.3 3.2Z"/>',
    trophy: '<path fill="#fbbf24" d="M7 2.5h10v2.2h3.2a1.3 1.3 0 0 1 1.3 1.3v2.4c0 3.1-2.2 5.3-5.2 5.5A5.4 5.4 0 0 1 13.2 15v2.4h3.1a1.3 1.3 0 0 1 0 2.6H7.7a1.3 1.3 0 0 1 0-2.6h3.1V15a5.4 5.4 0 0 1-3.1-1.1C4.7 13.7 2.5 11.5 2.5 8.4V6a1.3 1.3 0 0 1 1.3-1.3H7V2.5Z"/><path fill="#b45309" d="M7 5H4.9v3.2c0 2 1.2 3.2 3 3.4A6.8 6.8 0 0 1 7.5 8.4V5H7Zm10 0v3.4c0 1.9-.3 3.3-.9 4.2 1.8-.2 3-1.4 3-3.4V5H17Z"/><path fill="#92400e" d="M9.5 19.9h5v1.6h-5z"/>'
  };

  /* ------------------------------------------------------------------ */
  /* Subject tiles: same solid, full-colour style.                       */
  /* ------------------------------------------------------------------ */

  var SUBJECT_COLORS = {
    business: ['#34d399', '#0f766e'],
    economics: ['#fbbf24', '#b45309'],
    accounting: ['#60a5fa', '#1d4ed8'],
    'travel and tourism': ['#22d3ee', '#0e7490'],
    biology: ['#4ade80', '#15803d'],
    chemistry: ['#a78bfa', '#6d28d9'],
    physics: ['#f472b6', '#be185d'],
    english: ['#f87171', '#b91c1c'],
    mathematics: ['#818cf8', '#4338ca'],
    dhivehi: ['#2dd4bf', '#0f766e'],
    islam: ['#34d399', '#047857'],
    'computer science': ['#38bdf8', '#0369a1']
  };

  var SUBJECT_ALIASES = {
    'business studies': 'business',
    maths: 'mathematics',
    math: 'mathematics',
    'travel tourism': 'travel and tourism',
    tourism: 'travel and tourism',
    'islamic studies': 'islam',
    computer: 'computer science',
    cs: 'computer science'
  };

  var SUBJECT_SHAPES = {
    business: '<path fill="{b}" d="M9 5V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V5h3.5A2.5 2.5 0 0 1 21 7.5V10H3V7.5A2.5 2.5 0 0 1 5.5 5H9Z"/><rect x="2" y="9" width="20" height="12" rx="2.5" fill="{a}"/><path fill="{b}" d="M10 13h4v2.2h-4z"/>',
    economics: '<rect x="3" y="13" width="4" height="8" rx="1" fill="{b}"/><rect x="10" y="9" width="4" height="12" rx="1" fill="{a}"/><rect x="17" y="5" width="4" height="16" rx="1" fill="{b}"/><path fill="{a}" d="m3.5 11.5 6-5 4 2 6-6v3.2l-6 6-4-2-6 5v-3.2Z"/>',
    accounting: '<rect x="4" y="2" width="16" height="20" rx="2.5" fill="{b}"/><rect x="6.5" y="4.5" width="11" height="5" rx="1" fill="#d8f3dc"/><g fill="{a}"><rect x="6.5" y="11" width="3.2" height="2.6" rx=".8"/><rect x="10.4" y="11" width="3.2" height="2.6" rx=".8"/><rect x="14.3" y="11" width="3.2" height="2.6" rx=".8"/><rect x="6.5" y="15" width="3.2" height="2.6" rx=".8"/><rect x="10.4" y="15" width="3.2" height="2.6" rx=".8"/><rect x="14.3" y="15" width="3.2" height="2.6" rx=".8"/></g>',
    'travel and tourism': '<path fill="{a}" d="M21 15.5 13.5 13V6.2a1.5 1.5 0 0 0-3 0V13L3 15.5V18l7.5-2.2v3.4L8.4 21v1.5l3.6-1 3.6 1V21l-2.1-1.8v-3.4L21 18v-2.5Z"/>',
    biology: '<path fill="{a}" d="M20.5 3.5C10 3 4 8 4 15a5.5 5.5 0 0 0 5.5 5.5c7 0 12-6 11-17Z"/><path fill="{b}" d="M5 20c3-5 7-8.5 12-11l1.2 1.8C14 13.8 10.2 16.8 7.2 21H5v-1Z"/>',
    chemistry: '<path fill="{a}" d="M9 2h6v2h-1v5.2l5.7 9.6A2 2 0 0 1 18 22H6a2 2 0 0 1-1.7-3.2L10 9.2V4H9V2Z"/><path fill="{b}" d="M7.4 16h9.2l1.5 2.5H5.9l1.5-2.5Z"/><circle cx="10" cy="18.6" r="1" fill="#fff"/><circle cx="14" cy="19.2" r=".8" fill="#fff"/>',
    physics: '<g fill="{a}"><ellipse cx="12" cy="12" rx="10" ry="3.4"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(120 12 12)"/></g><circle cx="12" cy="12" r="3.2" fill="{b}"/>',
    english: '<path fill="{a}" d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z"/><path fill="{b}" d="M7.5 6h9v2h-9zM7.5 10h9v2h-9zM7.5 14h6v2h-6z"/>',
    mathematics: '<path fill="{a}" d="M4 5h16v2.6H9.8V10H19v2.6H9.8V19H6.8v-6.4H4V10h2.8V7.6H4V5Z"/>',
    dhivehi: '<path fill="{a}" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path fill="{b}" d="M7 8h10v2H7zM7 12h7v2H7z"/>',
    islam: '<path fill="{a}" d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/><path fill="{b}" d="m18 2.5 1.1 2.4 2.6.3-1.9 1.8.5 2.6-2.3-1.3-2.3 1.3.5-2.6-1.9-1.8 2.6-.3L18 2.5Z"/>',
    'computer science': '<rect x="4" y="4" width="16" height="11" rx="1.5" fill="{b}"/><rect x="6" y="6" width="12" height="7" rx=".6" fill="{a}"/><path fill="{b}" d="M2 17h20l-1.5 3h-17L2 17Z"/>',
    book: '<rect x="3" y="3" width="18" height="18" rx="4" fill="{a}"/><path fill="{b}" d="M7 7h10v2.4H7zM7 11h10v2.4H7zM7 15h6v2.4H7z"/>'
  };

  function subjectKey(value) {
    var key = String(value || '').trim().toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return SUBJECT_ALIASES[key] || key;
  }

  function subjectColors(key) {
    if (SUBJECT_COLORS[key]) return SUBJECT_COLORS[key];
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    var all = Object.keys(SUBJECT_COLORS);
    return SUBJECT_COLORS[all[hash % all.length]];
  }

  /** Solid subject icon in that subject's own colours. */
  function uiSubjectIcon(subject, size) {
    var key = subjectKey(subject);
    var colors = subjectColors(key);
    var shape = SUBJECT_SHAPES[key] || SUBJECT_SHAPES.book;
    var px = Number(size) || 22;
    return '<svg class="ui-icon" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      shape.split('{a}').join(colors[0]).split('{b}').join(colors[1]) + '</svg>';
  }

  function uiIcon(name, size, extraClass) {
    var shape = SHAPES[name];
    if (!shape) return '';
    var px = Number(size) || 16;
    var cls = extraClass ? ' ' + extraClass : '';
    return '<svg class="ui-icon' + cls + '" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" ' +
      'aria-hidden="true" focusable="false">' + shape + '</svg>';
  }

  /** Replace a placeholder or emoji with an SVG icon and stop the hydrator overwriting it. */
  function setIcon(el, name, size, extraClass) {
    if (!el) return;
    el.innerHTML = uiIcon(name, size, extraClass);
    el.setAttribute('data-ui-icon-done', '1');
  }

  /** Fill any `<span data-ui-icon="..." data-size="..."></span>` placeholders. */
  function hydrateIcons(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-ui-icon]:not([data-ui-icon-done])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.innerHTML = uiIcon(
        el.getAttribute('data-ui-icon'),
        Number(el.getAttribute('data-size')) || 16,
        el.getAttribute('data-icon-class') || ''
      );
      el.setAttribute('data-ui-icon-done', '1');
    }
  }

  global.uiIcon = uiIcon;
  global.uiSubjectIcon = uiSubjectIcon;
  global.setIcon = setIcon;
  global.hydrateIcons = hydrateIcons;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { hydrateIcons(document); });
  } else {
    hydrateIcons(document);
  }
})(window);
