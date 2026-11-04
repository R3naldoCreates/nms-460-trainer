/* ============================================================
   compat.js — pointer events for browsers that lack them

   iOS ≤ 12 (and old macOS Safari) have no window.PointerEvent,
   so every pointerdown/up/cancel in the simulator would silently
   never fire: power, menu, enter, play and the wheel all dead.
   This file teaches those browsers just enough PointerEvent:

   - synthesizes pointerdown / pointermove / pointerup / pointercancel
     from touch and mouse events (with pointerId / pointerType /
     isPrimary);
   - provides setPointerCapture / releasePointerCapture /
     hasPointerCapture on Element.prototype;
   - once a control captures a pointer, touch moves anywhere are
     prevented from scrolling the page (like touch-action: none);
   - on browsers that DO support PointerEvent it does nothing.

   Deliberately written in ES5 (var, no arrow functions, no
   for...of, document.createEvent instead of constructors) so the
   shim itself parses on every browser going back years.

   Test: open index.html?compat-touch=1 to force the shim on for
   development and automated checks, even in PointerEvent browsers.
   ============================================================ */
window.NMS = window.NMS || {};

(function () {
  'use strict';

  var forced = /[?&]compat-touch=1/.test(location.search);
  if (window.PointerEvent && !forced) return;

  // pointerId -> element that captured it (ids are small integers / touch ids)
  var capture = {};
  var captureCount = 0;
  function captureSet(id, el) { if (!capture[id]) captureCount++; capture[id] = el; }
  function captureDelete(id) { if (capture[id]) { captureCount--; delete capture[id]; } }
  function capturedBy(id) { return capture[id] || null; }

  var MouseEventCtor = window.MouseEvent;
  var primaryTouchId = null;

  function makePointerEvent(name, init) {
    var e;
    if (MouseEventCtor) {
      e = new MouseEventCtor(name, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: init.clientX || 0,
        clientY: init.clientY || 0,
        button: init.button != null ? init.button : 0,
        buttons: init.buttons != null ? init.buttons : 1,
        detail: 1
      });
    } else {
      // absolute fallback: initMouseEvent works everywhere old browsers do
      e = document.createEvent('MouseEvents');
      e.initMouseEvent(name, true, true, window, 1,
        init.screenX || 0, init.screenY || 0,
        init.clientX || 0, init.clientY || 0,
        false, false, false, false,
        init.button != null ? init.button : 0, null);
      try { e.buttons = init.buttons != null ? init.buttons : 1; } catch (err) {}
    }
    e.pointerId = init.pointerId;
    e.pointerType = init.pointerType;
    e.isPrimary = !!init.isPrimary;
    e._compat = true;
    return e;
  }

  function targetFor(id, fallback) {
    return capturedBy(id) || fallback;
  }

  function fire(el, evt) {
    el.dispatchEvent(evt);
  }

  function loop(list, cb) {
    // TouchList / NodeList are not reliably iterable on old Safari — index it
    for (var i = 0; i < list.length; i++) cb(list[i], i);
  }

  /* ── Element.prototype capture methods ───────────────────
     Install whenever the shim is active (including forced test mode): a
     synthetic pointerId must be accepted by them, so a native
     setPointerCapture cannot be trusted with our ids. */

  Element.prototype.setPointerCapture = function (pointerId) {
    captureSet(pointerId, this);
  };
  Element.prototype.releasePointerCapture = function (pointerId) {
    captureDelete(pointerId);
  };
  Element.prototype.hasPointerCapture = function (pointerId) {
    return capturedBy(pointerId) === this;
  };

  /* ── touch path ────────────────────────────────────────── */

  document.addEventListener('touchstart', function (e) {
    loop(e.changedTouches, function (t) {
      if (captureCount === 0) primaryTouchId = t.identifier;
      fire(t.target, makePointerEvent('pointerdown', {
        pointerId: t.identifier,
        pointerType: 'touch',
        isPrimary: t.identifier === primaryTouchId,
        clientX: t.clientX,
        clientY: t.clientY,
        screenX: t.screenX,
        screenY: t.screenY,
        button: 0
      }));
    });
  }, false);

  document.addEventListener('touchmove', function (e) {
    // once any control owns a pointer, stop the page scrolling under it
    if (captureCount > 0) e.preventDefault();
    loop(e.changedTouches, function (t) {
      var dest = targetFor(t.identifier, t.target);
      fire(dest, makePointerEvent('pointermove', {
        pointerId: t.identifier,
        pointerType: 'touch',
        isPrimary: t.identifier === primaryTouchId,
        clientX: t.clientX,
        clientY: t.clientY,
        screenX: t.screenX,
        screenY: t.screenY,
        buttons: 1
      }));
    });
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    loop(e.changedTouches, function (t) {
      var dest = targetFor(t.identifier, t.target);
      fire(dest, makePointerEvent('pointerup', {
        pointerId: t.identifier,
        pointerType: 'touch',
        isPrimary: t.identifier === primaryTouchId,
        clientX: t.clientX,
        clientY: t.clientY,
        screenX: t.screenX,
        screenY: t.screenY,
        buttons: 0
      }));
      captureDelete(t.identifier);
      if (t.identifier === primaryTouchId) primaryTouchId = null;
    });
  }, false);

  document.addEventListener('touchcancel', function (e) {
    loop(e.changedTouches, function (t) {
      var dest = targetFor(t.identifier, t.target);
      fire(dest, makePointerEvent('pointercancel', {
        pointerId: t.identifier,
        pointerType: 'touch',
        isPrimary: t.identifier === primaryTouchId,
        clientX: t.clientX,
        clientY: t.clientY,
        screenX: t.screenX,
        screenY: t.screenY,
        buttons: 0
      }));
      captureDelete(t.identifier);
      if (t.identifier === primaryTouchId) primaryTouchId = null;
    });
  }, false);

  /* ── mouse path ────────────────────────────────────────── */

  var MOUSE_ID = 1;
  var mouseDown = false;

  document.addEventListener('mousedown', function (e) {
    if (e.button > 0) return;
    mouseDown = true;
    fire(e.target, makePointerEvent('pointerdown', {
      pointerId: MOUSE_ID,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      button: e.button
    }));
  }, true);

  document.addEventListener('mousemove', function (e) {
    if (!mouseDown) return;
    var dest = targetFor(MOUSE_ID, e.target);
    fire(dest, makePointerEvent('pointermove', {
      pointerId: MOUSE_ID,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      buttons: 1
    }));
  }, true);

  function mouseEnd(e, cancel) {
    if (!mouseDown) return;
    mouseDown = false;
    var dest = targetFor(MOUSE_ID, e.target);
    fire(dest, makePointerEvent(cancel ? 'pointercancel' : 'pointerup', {
      pointerId: MOUSE_ID,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      buttons: 0
    }));
    captureDelete(MOUSE_ID);
  }

  document.addEventListener('mouseup', function (e) { mouseEnd(e, false); }, true);
  document.addEventListener('mousecancel', function (e) { mouseEnd(e, true); }, true);
})();
