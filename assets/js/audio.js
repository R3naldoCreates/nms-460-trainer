/* ============================================================
   audio.js — synthesized UI sounds (no audio files needed)
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';

  let ctx = null;
  let master = null;
  let enabled = N.util.store.get('sound', true);

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(opts) {
    if (!enabled) return;
    const c = ensure();
    if (!c) return;
    resume();

    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime;

    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(opts.freq || 1000, t);

    const peak = Math.max(0.0001, opts.gain == null ? 0.06 : opts.gain);
    const dur = opts.dur || 0.04;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.01);
  }

  const VOLUME = { off: 0, low: 0.028, medium: 0.065, high: 0.13 };

  const API = {
    get enabled() { return enabled; },

    setEnabled(v) {
      enabled = !!v;
      N.util.store.set('sound', enabled);
      if (enabled) { ensure(); resume(); }
    },

    unlock() { ensure(); resume(); },

    /** short click for wheel detents / buttons */
    click() { tone({ freq: 2100, dur: 0.012, gain: 0.018, type: 'square' }); },

    /** stimulus tick — volume follows the device speaker setting */
    stimulus(volume) {
      const g = VOLUME[volume] == null ? VOLUME.medium : VOLUME[volume];
      if (!g) return;
      tone({ freq: 1180, dur: 0.026, gain: g, type: 'square' });
    },

    /** power on / off */
    power(on) {
      tone({ freq: on ? 520 : 380, dur: 0.09, gain: 0.05, type: 'sine' });
      setTimeout(() => tone({ freq: on ? 780 : 260, dur: 0.12, gain: 0.045, type: 'sine' }), 90);
    },

    /** countdown complete alarm */
    alarm() {
      [0, 220, 440, 660].forEach((d, i) => {
        setTimeout(() => tone({ freq: i % 2 ? 880 : 1180, dur: 0.14, gain: 0.08, type: 'square' }), d);
      });
    },

    success() {
      [660, 880, 1320].forEach((f, i) => {
        setTimeout(() => tone({ freq: f, dur: 0.11, gain: 0.05, type: 'sine' }), i * 85);
      });
    },

    error() {
      tone({ freq: 220, dur: 0.18, gain: 0.06, type: 'sawtooth' });
    }
  };

  N.audio = API;
})(window.NMS);
