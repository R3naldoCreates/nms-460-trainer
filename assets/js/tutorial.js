/* ============================================================
   tutorial.js — guided walkthrough engine
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';
  const U = N.util;

  /* Lesson 1 — set up safely, then treat.
     The unit boots at 0.2 ms / 10 Hz on purpose: the trainee has to bring it
     down before the patient is connected. Once the safe values are set, the
     pulse width and frequency drop out of the lesson entirely — from there it
     is about the patient, and those two controls stay untouched. */
  const STEPS = [
    {
      id: 'power',
      title: 'Power on the device',
      body: 'Press and <strong>hold</strong> the power button for about one second. The unit boots and shows its model and firmware version.',
      hint: 'The power button is the burgundy button at the bottom of the device.',
      target: 'power',
      check: s => s.phase === 'main'
    },
    {
      id: 'cable',
      title: 'Insert the treatment cable',
      body: 'Plug the treatment cable into the connector at the top of the unit. Until it is inserted the screen reads <em>INSERT CABLE</em> and stimulation is blocked.',
      hint: 'Tap the connector at the top of the device.',
      target: 'cable',
      check: s => s.cable
    },
    {
      id: 'electrode',
      title: 'Place the reference electrode',
      body: 'Apply the reference (grounding) electrode <strong>contralaterally</strong> — on the opposite side of the body from the treatment area.',
      hint: 'The Procedure buttons are in the Patient panel.',
      target: 'electrode',
      look: 'patient',
      check: s => s.electrode
    },
    {
      id: 'gel',
      title: 'Apply conductive gel',
      body: 'Apply a fair amount of conductive gel to the treatment area. Dry skin pushes impedance past 13&nbsp;kΩ, the delivered current drops and the unit warns.',
      hint: 'Watch the skin impedance in the Patient panel — gel drops it sharply.',
      target: 'gel',
      look: 'patient',
      check: s => s.gel
    },
    {
      id: 'probe',
      title: 'Place the treatment probe',
      body: 'Place the probe on the skin over the treatment site. The probe and the reference electrode now form a closed circuit.',
      hint: 'The circuit badge turns green when the probe is on skin.',
      target: 'probe',
      look: 'patient',
      check: s => s.probe
    },
    {
      id: 'pw',
      title: 'Set the pulse width to 0.1 ms',
      body: 'The unit has booted at <strong>0.2&nbsp;ms</strong>. Press the <strong>Menu</strong> button once so the screen reads 0.1&nbsp;ms. At 0.2&nbsp;ms every pulse carries twice the charge, so this comes down before the patient is stimulated.',
      hint: 'One press of Menu takes 0.2 ms to 0.1 ms — check the chip in the bottom-left of the screen.',
      target: 'menu',
      check: s => s.pw === 0.1
    },
    {
      id: 'freq',
      title: 'Drop the frequency to 2 Hz',
      body: 'The unit has booted at <strong>10&nbsp;Hz</strong>. Press <strong>Enter / Hz</strong> until the screen reads 2&nbsp;Hz. Slower stimulation lets you judge each response before the next pulse arrives.',
      hint: 'Keep pressing Enter — the unit cycles 1, 2, 5 and 10 Hz.',
      target: 'enter',
      check: s => s.freq === 2
    },
    {
      id: 'start',
      title: 'Start stimulation',
      body: '0.1&nbsp;ms and 2&nbsp;Hz are set. Press the <strong>play</strong> button in the centre of the wheel to start.',
      hint: 'From here the settings stay put — the rest of this lesson is about the patient.',
      target: 'play',
      check: s => s.stimulating
    },
    {
      id: 'nerve',
      title: 'Find the nerve',
      body: 'Turn the wheel to raise the current slowly. Watch the <strong>fasciculation</strong> bar — a motor nerve twitches once the current passes its threshold.',
      hint: 'Do not touch the pulse width or frequency now. Raise the current one step at a time.',
      target: 'wheel',
      check: s => s.stimulating && s.circuit && s.fasc.active
    },
    {
      id: 'therapeutic',
      title: 'Settle into the therapeutic band',
      body: 'Adjust the current until the patient is tolerating it — comfort in the green band (40–59). That is your treatment level for this session.',
      hint: 'Watch the pain bar: if it climbs, ease the current back down one step.',
      target: 'wheel',
      dwell: 1.6,
      look: 'coach',
      check: s => s.stimulating && s.circuit && s.comfort >= 40 && s.comfort <= 59
    },
    {
      id: 'finish',
      title: 'Stop and note the values',
      body: 'Press play to stop. <strong>Lesson 1 complete</strong> — you set the unit up safely and found the nerve. Next up: the 0.2&nbsp;ms / 15&nbsp;mA rule, then the setup menu and waveform.',
      hint: 'Leave the pulse width and frequency alone from here.',
      target: 'play',
      check: s => !s.stimulating && s.everStarted
    }
  ];

  const el = {};
  let index = 0;
  let done = [];
  let comfortEma = null;
  let stepAcc = 0;
  let stepStart = { current: 0, time: 0 };
  let lastCheck = 0;
  let advanceTimer = 0;
  let active = true;

  const TOTAL = STEPS.length;

  // Saved progress is versioned: bump LESSON whenever STEPS changes shape, so
  // an in-flight run from an older lesson is discarded instead of resumed
  // into the wrong step.
  const LESSON = 2;
  const STORE_KEY = 'tutorial';

  function snapshot() {
    const d = N.device.state;
    const circuit = N.device.circuit();
    const load = N.device.load();
    const c = N.patient.comfort(load);
    if (comfortEma == null) comfortEma = c.score;
    else comfortEma += (c.score - comfortEma) * 0.06;

    return {
      phase: d.phase,
      power: d.power,
      cable: d.cable,
      electrode: d.electrode,
      gel: d.gel,
      probe: d.probe,
      stimulating: d.stimulating,
      everStarted: d.everStarted,
      completed: d.completed,
      circuit,
      pw: d.pw,
      freq: d.freq,
      current: d.current,
      counts: d.counts || { pw: 0, freq: 0, current: 0 },
      load,
      comfort: Math.round(comfortEma),
      comfortRaw: c,
      fasc: N.patient.fasciculation(load)
    };
  }

  function step() { return STEPS[index]; }

  function enterStep(i, silent) {
    index = U.clamp(i, 0, TOTAL - 1);
    stepAcc = 0;
    comfortEma = null;
    const s = N.device.state;
    stepStart = { current: s.current, time: U.now() };
    render();
    hintTarget(step().target);
    persist();
    if (!silent) N.audio.click();
  }

  function complete(manual) {
    const st = step();
    const first = !done.includes(st.id);
    if (first) {
      done.push(st.id);
      if (!manual) N.audio.success();
    }
    persist();
    if (index < TOTAL - 1) {
      enterStep(index + 1, true);
    } else {
      render();
      clearLook();
      // only ever announce the ending once, however often the last check passes
      if (first) {
        U.toast('Lesson 1 complete — 0.1 ms · 2 Hz · nerve found', 'ok', 3600);
        N.audio.success();
      }
    }
  }

  /** highlight the bottom-nav panel the current step needs (mobile only)
      step.look uses human names; the nav buttons key off data-panel */
  function applyLook() {
    const map = { patient: 'left', coach: 'right' };
    const look = step().look || '';
    const need = map[look] || look;
    U.$$('#mobileNav button').forEach(b => {
      b.classList.toggle('is-attention', !!need && b.dataset.panel === need);
    });
  }

  function clearLook() {
    U.$$('#mobileNav button').forEach(b => b.classList.remove('is-attention'));
  }

  function hintTarget(key) {
    U.$$('.is-hinted').forEach(e => e.classList.remove('is-hinted'));
    if (!key) return;
    const map = {
      power: '#btnPower',
      cable: '#cableSocket',
      electrode: '#btnElectrode',
      gel: '#btnGel',
      probe: '#btnProbe',
      menu: '#btnMenu',
      enter: '#btnEnter',
      play: '#btnPlay',
      wheel: '#wheel'
    };
    const node = U.$(map[key] || '');
    if (node) node.classList.add('is-hinted');
  }

  function persist() {
    U.store.set(STORE_KEY, { v: LESSON, index, done });
  }

  function restore() {
    const saved = U.store.get(STORE_KEY, null);
    // A saved run from an older step list must never be resumed: the old ids
    // do not exist any more, the index points into a different step, and the
    // done count can exceed the new total (which freezes the lesson).
    if (!saved || saved.v !== LESSON || !Array.isArray(saved.done)) {
      done = [];
      index = 0;
      return;
    }
    done = saved.done.filter(id => STEPS.some(s => s.id === id));
    index = U.clamp(saved.index || 0, 0, TOTAL - 1);
  }

  function render() {
    if (!el.title) return;
    const st = step();

    el.eyebrow.textContent = 'Step ' + (index + 1) + ' of ' + TOTAL;
    el.title.textContent = st.title;
    el.body.innerHTML = st.body;
    el.hint.innerHTML = '<b>Tip</b><span>' + st.hint + '</span>';

    const pct = Math.round((done.length / TOTAL) * 100);
    el.bar.style.width = pct + '%';
    el.ring.style.setProperty('--p', pct);
    el.pct.textContent = pct + '%';
    el.doneCount.textContent = done.length + '/' + TOTAL;

    el.next.textContent = st.manual ? 'Mark as done' : 'Next step';
    el.prev.disabled = index === 0;

    // mirror the step into the strip shown above the device on phones,
    // where the coach panel is behind its own tab
    if (el.stripTitle) {
      el.stripCount.textContent = (index + 1) + '/' + TOTAL;
      el.stripTitle.textContent = st.title;
      el.stripBar.style.width = pct + '%';
      el.strip.setAttribute('aria-label',
        'Step ' + (index + 1) + ' of ' + TOTAL + ': ' + st.title + ' — show the coach panel');
    }

    applyLook();

    el.list.innerHTML = STEPS.map((s, i) => {
      const cls = done.includes(s.id) ? 'is-done' : (i === index ? 'is-current' : '');
      return '<li class="' + cls + '" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span>' + s.title + '</span></li>';
    }).join('');

    U.$$('#tutList li').forEach(li => {
      li.addEventListener('click', () => enterStep(parseInt(li.dataset.i, 10)));
    });
  }

  function tick(dt) {
    if (!active || !el.title) return;
    // a finished lesson stops evaluating; Restart clears `done` and re-arms it
    if (done.length >= TOTAL) return;

    // wait for a pending advance
    if (advanceTimer > 0) {
      advanceTimer -= dt;
      if (advanceTimer <= 0) { advanceTimer = 0; complete(false); }
      return;
    }

    const now = U.now();
    if (now - lastCheck < 90) return;
    lastCheck = now;

    const s = snapshot();
    const st = step();

    if (st.manual) return;

    if (st.check(s, stepStart)) {
      stepAcc += 0.09;
      if (stepAcc >= (st.dwell || 0.6)) {
        advanceTimer = 0.55;
        el.hint.classList.add('is-ok');
      }
    } else {
      stepAcc = 0;
      el.hint.classList.remove('is-ok');
    }
  }

  function next() {
    if (step().manual) { complete(true); return; }
    complete(true);
  }

  function prev() { if (index > 0) enterStep(index - 1); }

  function restart() {
    done = [];
    comfortEma = null;
    N.device.prepareLesson();
    enterStep(0);
    persist();
    U.toast('Lesson 1 restarted — the unit is back at 0.2 ms / 10 Hz', 'ok', 2400);
  }

  function init() {
    el.eyebrow = U.$('#tutEyebrow');
    el.title = U.$('#tutTitle');
    el.body = U.$('#tutBody');
    el.hint = U.$('#tutHint');
    el.bar = U.$('#tutBar');
    el.ring = U.$('#tutRing');
    el.pct = U.$('#tutPct');
    el.doneCount = U.$('#tutDoneCount');
    el.list = U.$('#tutList');
    el.next = U.$('#tutNext');
    el.prev = U.$('#tutPrev');

    // step strip (visible <= 899px only; harmless elsewhere)
    el.strip = U.$('#stepStrip');
    el.stripCount = U.$('#stepStripCount');
    el.stripTitle = U.$('#stepStripTitle');
    el.stripBar = U.$('#stepStripBar');

    U.$('#tutNext').addEventListener('click', next);
    U.$('#tutPrev').addEventListener('click', prev);
    U.$('#tutRestart').addEventListener('click', restart);

    if (el.strip) {
      el.strip.addEventListener('click', () => {
        const coach = U.$('#mobileNav button[data-panel="right"]');
        if (coach) coach.click();
      });
    }

    restore();
    // a lesson that has not started yet always begins from 0.2 ms / 10 Hz,
    // even if an earlier session saved friendlier defaults
    if (index === 0 && done.length === 0) N.device.prepareLesson();
    render();
    hintTarget(step().target);
  }

  N.tutorial = {
    init,
    tick,
    next,
    prev,
    restart,
    render,
    setActive(v) { active = !!v; },
    get index() { return index; },
    get total() { return TOTAL; },
    steps: STEPS
  };
})(window.NMS);
