/* ============================================================
   wheel.js — rotary dial interaction
   Drag in a circle to turn the wheel; tap a quadrant to step.
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';
  const U = N.util;

  const STEP_DEG = 20;       // degrees of rotation per 1 mA detent
  const TAP_MOVE = 9;        // px of movement still counted as a tap
  const TAP_TIME = 420;      // ms

  let el, center, ring, valueEl, valueNum;
  let dragging = false;
  let pointerId = null;
  let lastAngle = 0;
  let accum = 0;
  let moved = 0;
  let downTime = 0;
  let downX = 0, downY = 0;
  let rotation = 0;
  let hideTimer = 0;

  function angleAt(e) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
  }

  function haptic() {
    if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
  }

  function showValue() {
    if (!valueEl) return;
    if (N.device.state.phase === 'menu') return;
    valueNum.textContent = N.device.current;
    valueEl.classList.add('is-on');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => valueEl.classList.remove('is-on'), 1200);
  }

  function spinRing(deg) {
    rotation += deg;
    if (ring) ring.style.transform = 'rotate(' + rotation.toFixed(1) + 'deg)';
    if (ring) ring.style.transformOrigin = '200px 356px';
  }

  function onDown(e) {
    if (e.target.closest('.wheel__center')) return;
    if (e.button != null && e.button !== 0) return;

    el.setPointerCapture(e.pointerId);
    pointerId = e.pointerId;
    dragging = true;
    lastAngle = angleAt(e);
    accum = 0;
    moved = 0;
    downTime = U.now();
    downX = e.clientX;
    downY = e.clientY;
    el.classList.add('is-turning');
    N.device.touch();
    showValue();
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    moved = Math.max(moved, Math.hypot(dx, dy));

    const a = angleAt(e);
    let d = a - lastAngle;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastAngle = a;
    accum += d;

    if (Math.abs(accum) >= STEP_DEG) {
      const steps = Math.trunc(accum / STEP_DEG);
      accum -= steps * STEP_DEG;
      N.device.nudgeCurrent(Math.sign(steps));
      spinRing(steps * STEP_DEG * 0.55);
      haptic();
      showValue();
    }
  }

  function finish(e) {
    if (!dragging) return;
    if (e && e.pointerId != null && e.pointerId !== pointerId) return;

    dragging = false;
    pointerId = null;
    el.classList.remove('is-turning');

    const elapsed = U.now() - downTime;
    if (moved <= TAP_MOVE && elapsed <= TAP_TIME) {
      tap(e);
    }
    accum = 0;
  }

  function tap(e) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e ? e.clientX : downX) - cx;
    const dy = (e ? e.clientY : downY) - cy;

    let dir;
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';

    if (N.device.state.phase === 'menu') {
      N.device.menuNav(dir === 'up' || dir === 'left' ? -1 : 1);
    } else {
      N.device.nudgeCurrent(dir === 'up' || dir === 'right' ? 1 : -1);
      spinRing(dir === 'up' || dir === 'right' ? 8 : -8);
    }
    haptic();
    showValue();
  }

  function init() {
    el = U.$('#wheel');
    center = U.$('#btnPlay');
    ring = U.$('#wheelRing');
    valueEl = U.$('#wheelValue');
    valueNum = U.$('#wheelValueNum');
    if (!el) return;

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
    el.addEventListener('lostpointercapture', finish);

    // prevent page scroll while turning on touch
    el.addEventListener('touchmove', e => {
      if (dragging) e.preventDefault();
    }, { passive: false });

    // double-click the wheel ring = coarse jump of 5 mA (desktop convenience)
    el.addEventListener('dblclick', e => {
      if (e.target.closest('.wheel__center')) return;
      N.device.setCurrent(N.device.current + (e.shiftKey ? -5 : 5));
      showValue();
    });
  }

  N.wheel = { init };
})(window.NMS);
