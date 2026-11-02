/* ============================================================
   core.js — helpers, event bus, storage, toasts
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';

  const U = {};

  U.$  = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  U.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  U.lerp  = (a, b, t) => a + (b - a) * t;
  U.round = (v, dp) => { const f = Math.pow(10, dp || 0); return Math.round(v * f) / f; };
  U.rand  = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick  = arr => arr[Math.floor(Math.random() * arr.length)];
  U.pad2  = n => String(Math.floor(n)).padStart(2, '0');

  U.fmtTime = secs => {
    secs = Math.max(0, Math.ceil(secs));
    return U.pad2(secs / 60) + ':' + U.pad2(secs % 60);
  };

  U.esc = str => String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  U.debounce = (fn, ms) => {
    let t;
    return function () {
      clearTimeout(t);
      const args = arguments, self = this;
      t = setTimeout(() => fn.apply(self, args), ms);
    };
  };

  U.el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /* ── tiny event bus ─────────────────────────────────── */
  const handlers = Object.create(null);

  U.on = (evt, fn) => {
    (handlers[evt] || (handlers[evt] = [])).push(fn);
    return () => {
      const a = handlers[evt];
      const i = a ? a.indexOf(fn) : -1;
      if (i > -1) a.splice(i, 1);
    };
  };

  U.emit = (evt, data) => {
    const a = handlers[evt];
    if (a) a.slice().forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });
    const b = handlers['*'];
    if (b) b.slice().forEach(fn => { try { fn(evt, data); } catch (e) { console.error(e); } });
  };

  /* ── storage ────────────────────────────────────────── */
  const PREFIX = 'nms460.';
  U.store = {
    get(key, def) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? def : JSON.parse(raw);
      } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
    },
    del(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) {}
    }
  };

  /* ── toasts ─────────────────────────────────────────── */
  U.toast = (msg, type, ms) => {
    const host = U.$('#toasts');
    if (!host) return;
    const t = U.el('div', 'toast' + (type ? ' toast--' + type : ''));
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => {
      t.classList.add('toast--out');
      setTimeout(() => t.remove(), 300);
    }, ms || 2800);
  };

  /* ── misc ───────────────────────────────────────────── */
  U.now = () => (performance && performance.now ? performance.now() : Date.now());

  U.uid = () => Math.random().toString(36).slice(2, 9);

  U.byId = id => document.getElementById(id);

  N.util = U;
})(window.NMS);
