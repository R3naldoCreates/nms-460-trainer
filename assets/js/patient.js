/* ============================================================
   patient.js — simulated patient physiology
   Comfort + fasciculation + skin impedance models.
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';
  const U = N.util;

  const NAMES = [
    'Jordan D.', 'Aisha M.', 'Pieter v. W.', 'Lerato K.', 'Marcus B.',
    'Sofia R.', 'Chen W.', 'Nomvula S.', 'Elena P.', 'Thabo N.',
    'Hannah F.', 'Riaan J.', 'Priya S.', 'Daniel O.', 'Zanele M.'
  ];

  const CASES = [
    { label: 'Chronic lumbar radiculopathy', site: 'Left L5 distribution' },
    { label: 'Carpal tunnel syndrome',       site: 'Right median nerve, wrist' },
    { label: 'Diabetic peripheral neuropathy', site: 'Bilateral feet' },
    { label: 'Post-surgical knee pain',      site: 'Right anterior knee' },
    { label: 'Cervical radiculopathy',       site: 'Left C6 distribution' },
    { label: 'Sciatica',                     site: 'Right posterior thigh' },
    { label: 'Post-herpetic neuralgia',      site: 'Left T8 dermatome' },
    { label: 'Tennis elbow',                 site: 'Right lateral epicondyle' },
    { label: 'Frozen shoulder',              site: 'Left deltoid region' },
    { label: 'Meralgia paraesthetica',       site: 'Right lateral thigh' },
    { label: 'Post-traumatic wrist pain',    site: 'Left ulnar distribution' },
    { label: 'Chronic neck pain',            site: 'Right C4–C5 distribution' }
  ];

  const state = {
    name: '',
    initials: '',
    age: 40,
    caseLabel: '',
    site: '',
    tolerance: 22,       // 0.1 ms equivalent load ceiling, 15–30
    fascThreshold: 5,    // load at which a twitch first appears
    baseZ: 3,            // kΩ with good contact
    accommodation: 0,    // 0..1 nerve accommodation
    noise: 0,
    noiseTarget: 0,
    seeded: false
  };

  function initialsOf(name) {
    return name
      .replace(/[^A-Za-z. ]/g, '')
      .split(/[\s.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('');
  }

  function newPatient() {
    const c = U.pick(CASES);
    state.name = U.pick(NAMES);
    state.initials = initialsOf(state.name);
    state.age = U.randInt(26, 74);
    state.caseLabel = c.label;
    state.site = c.site;

    // the comfort ceiling: random 15.0 – 30.0 in 0.1 steps
    state.tolerance = Math.round(U.rand(15, 30) * 10) / 10;
    // where a visible twitch begins (lower = easier to find the nerve)
    state.fascThreshold = Math.round(U.rand(3.0, 8.0) * 10) / 10;
    // baseline skin impedance
    state.baseZ = Math.round(U.rand(1.6, 4.4) * 10) / 10;

    state.accommodation = 0;
    state.noise = 0;
    state.noiseTarget = 0;
    state.seeded = true;

    U.emit('patient:new', state);
    return state;
  }

  function ensure() { if (!state.seeded) newPatient(); }

  /** charge load: 0.2 ms delivers twice the charge of 0.1 ms at the same mA */
  function load(current, pulseWidth) {
    return current * (pulseWidth >= 0.2 ? 2 : 1);
  }

  /** slow drift so the meter never looks frozen */
  function advance(dt, active) {
    if (!state.seeded) return;

    if (active) {
      // accommodation: nerve adapts over ~3 minutes of continuous stimulation
      state.accommodation = U.clamp(state.accommodation + dt / 180, 0, 1);
    } else {
      state.accommodation = Math.max(0, state.accommodation - dt / 420);
    }

    // random-walk noise, retargeted every ~1.4 s
    if (Math.random() < dt / 1.4) {
      state.noiseTarget = U.rand(-2.6, 2.6);
    }
    state.noise += (state.noiseTarget - state.noise) * Math.min(1, dt * 1.6);
  }

  /**
   * Comfort index 0–100.
   * stress = load / effective tolerance.
   * stress 0.5 → ~69, 0.75 → ~53, 1.0 → ~38, 1.5 → 0
   */
  function comfort(loadValue) {
    ensure();
    const effT = state.tolerance * (1 + 0.12 * state.accommodation);
    const stress = loadValue / Math.max(0.1, effT);

    let score;
    if (stress <= 1) score = 100 - 62 * stress;
    else score = 38 - 76 * (stress - 1);

    score = U.clamp(score + state.noise, 0, 100);
    score = Math.round(score);

    let label, tone, hint;
    if (score >= 80)      { label = 'Very comfortable'; tone = 'ok';    hint = 'Plenty of headroom — you can increase current.'; }
    else if (score >= 60) { label = 'Comfortable';      tone = 'ok';    hint = 'Comfortable. Increase slowly toward the therapeutic band.'; }
    else if (score >= 40) { label = 'Therapeutic';      tone = 'ok';    hint = 'Therapeutic window — strong but tolerated. Hold here.'; }
    else if (score >= 22) { label = 'Strong';           tone = 'warn';  hint = 'At the patient\'s limit. Do not increase further.'; }
    else if (score >= 8)  { label = 'Uncomfortable';    tone = 'bad';   hint = 'Too intense — reduce current now.'; }
    else                  { label = 'Too intense';      tone = 'bad';   hint = 'Stop and reduce current immediately.'; }

    return { score, label, tone, hint, stress };
  }

  /** Fasciculation response — motor nerves twitch once load passes threshold */
  function fasciculation(loadValue) {
    ensure();
    const T = state.tolerance;
    const F = state.fascThreshold;

    if (loadValue < F) {
      return { level: 'None', intensity: 0, index: 0, active: false };
    }

    const span = Math.max(1, T - F);
    const raw = (loadValue - F) / span;           // 0 → 1 at tolerance
    const intensity = U.clamp(raw, 0, 1.25);

    let level, index;
    if (intensity < 0.22)      { level = 'Mild';     index = 1; }
    else if (intensity < 0.52) { level = 'Moderate'; index = 2; }
    else if (intensity < 0.84) { level = 'Strong';   index = 3; }
    else                       { level = 'Maximal';  index = 4; }

    return { level, intensity, index, active: true };
  }

  /** circuit impedance in kΩ; gel is the big lever */
  function impedance(gelApplied) {
    ensure();
    let z = state.baseZ;
    if (!gelApplied) z += 11.2;      // dry skin pushes well past the 13 kΩ limit
    z += U.rand(-0.15, 0.15);
    return Math.max(0.8, z);
  }

  function tolerance() { ensure(); return state.tolerance; }
  function fascThreshold() { ensure(); return state.fascThreshold; }
  function current() { ensure(); return state; }
  function accommodation() { return state.accommodation; }

  function resetSession() {
    state.accommodation = 0;
    state.noise = 0;
    state.noiseTarget = 0;
  }

  N.patient = {
    newPatient,
    current,
    tolerance,
    fascThreshold,
    accommodation,
    load,
    comfort,
    fasciculation,
    impedance,
    advance,
    resetSession
  };
})(window.NMS);
