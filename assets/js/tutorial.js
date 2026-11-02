/* ============================================================
   tutorial.js — guided walkthrough engine
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';
  const U = N.util;

  const STEPS = [
    {
      id: 'power',
      title: 'Power on the device',
      body: 'Press and <strong>hold</strong> the power button for about one second. The device boots in under five seconds and shows the model and firmware version.',
      hint: 'The power button is the round burgundy button at the bottom of the device.',
      target: 'power',
      check: s => s.phase === 'main'
    },
    {
      id: 'cable',
      title: 'Insert the treatment cable',
      body: 'Plug the treatment cable into the connector at the top of the device. Until it is inserted the screen shows <em>INSERT CABLE</em> and stimulation is blocked.',
      hint: 'Tap the cable socket at the top of the device, or use the Connect cable button.',
      target: 'cable',
      check: s => s.cable
    },
    {
      id: 'electrode',
      title: 'Place the reference electrode',
      body: 'Apply the reference (grounding) electrode <strong>contralaterally</strong> — on the opposite side of the body from the treatment area. Connect the red clip to the electrode.',
      hint: 'Use the Procedure panel on the left. Contralateral placement is the recommended default.',
      target: 'electrode',
      check: s => s.electrode
    },
    {
      id: 'gel',
      title: 'Apply conductive gel',
      body: 'Apply a fair amount of conductive gel to the treatment area. Dry skin pushes circuit impedance above 13&nbsp;kΩ, so the delivered current drops and the device shows an impedance warning.',
      hint: 'Watch the Skin impedance value in the Patient card — gel drops it sharply.',
      target: 'gel',
      check: s => s.gel
    },
    {
      id: 'probe',
      title: 'Place the treatment probe',
      body: 'Place the probe tip on the skin over the treatment site. The probe and the reference electrode now form a closed circuit.',
      hint: 'The circuit badge turns green when the probe is on skin.',
      target: 'probe',
      check: s => s.probe
    },
    {
      id: 'pulse',
      title: 'Set the pulse width to 0.1 ms',
      body: 'Press the <strong>Menu / Pulse Width</strong> button to toggle between 0.1&nbsp;ms and 0.2&nbsp;ms. Finish with the screen showing 0.1&nbsp;ms.',
      hint: 'From 0.1 ms one press shows 0.2 — press again to return. 0.2 ms delivers twice the charge at the same current, so always halve the current if you switch up.',
      target: 'menu',
      check: s => s.pw === 0.1 && s.counts.pw > 0
    },
    {
      id: 'freq',
      title: 'Check the stimulation frequency',
      body: 'Press the <strong>Enter / Hz</strong> button to cycle 1 → 2 → 5 → 10 Hz. Most treatments start at 2&nbsp;Hz.',
      hint: 'Higher frequencies feel sharper and recruit more fibres per second.',
      target: 'enter',
      check: s => s.counts.freq > 0
    },
    {
      id: 'start',
      title: 'Start stimulation',
      body: 'Press the <strong>play/pause</strong> button in the centre of the wheel. The countdown starts and the screen shows <em>OPEN CIRCUIT DETECTED</em> until the probe completes the circuit.',
      hint: 'You can also press Space on a keyboard.',
      target: 'play',
      check: s => s.stimulating
    },
    {
      id: 'contact',
      title: 'Complete the circuit',
      body: 'With the probe on skin the LED flashes <strong>green</strong>, the device beeps with every stimulus and the screen shows the actual current delivered.',
      hint: 'If the LED flashes red, the probe is not making contact or the electrode has lifted.',
      target: 'play',
      check: s => s.stimulating && s.circuit
    },
    {
      id: 'nerve',
      title: 'Locate the nerve',
      body: 'Turn the wheel to raise the current slowly. Watch the fasciculation indicator — a motor nerve will twitch once the current passes its threshold.',
      hint: 'Drag around the wheel, or tap its upper half. Each 20° of rotation = 1 mA.',
      target: 'wheel',
      check: s => s.stimulating && s.circuit && s.fasc.active
    },
    {
      id: 'therapeutic',
      title: 'Find the therapeutic level',
      body: 'Keep increasing until the comfort meter enters the <strong>therapeutic band</strong> (40–59). That is the strongest stimulus the patient tolerates comfortably.',
      hint: 'Hold the level for a moment — the meter is smoothed so it will settle.',
      target: 'wheel',
      dwell: 1.6,
      check: s => s.stimulating && s.circuit && s.comfort >= 40 && s.comfort <= 59
    },
    {
      id: 'hold',
      title: 'Hold the site',
      body: 'Keep the probe on the stimulation site. In a real session you would hold it for <strong>5–10 minutes</strong>. Stay in the therapeutic band while the timer runs down.',
      hint: 'Use Trainer speed in the Session tab if you want to fast-forward the countdown.',
      target: 'wheel',
      dwell: 6,
      check: s => s.stimulating && s.circuit && s.comfort >= 32 && s.comfort <= 68
    },
    {
      id: 'accommodate',
      title: 'Manage accommodation',
      body: 'Nerves accommodate: the same current starts to feel weaker. When comfort drifts up, increase the current slightly to stay in the therapeutic band.',
      hint: 'Increase by 1–2 mA and watch the meter come back down into the band.',
      target: 'wheel',
      check: (s, step) => s.current > step.current && s.comfort <= 62
    },
    {
      id: 'rule',
      title: 'Know the 0.2 ms rule',
      body: 'If you reach <strong>30 mA at 0.1 ms</strong>, switch the pulse width to 0.2&nbsp;ms and turn the current down to <strong>15 mA</strong>, then increase again. The charge per pulse is the same — you have twice the headroom.',
      hint: 'Charge = current × pulse width. Doubling the width doubles the charge.',
      target: 'menu',
      manual: true
    },
    {
      id: 'finish',
      title: 'Finish the session',
      body: 'Press play/pause to stop, or hold it for two seconds to reset the countdown. When the timer reaches 00:00 stimulation stops, an alarm sounds and the timer resets.',
      hint: 'You can now keep practising freely — the tutorial stays available.',
      target: 'play',
      manual: true
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
    if (!done.includes(st.id)) {
      done.push(st.id);
      if (!manual) {
        N.audio.success();
        U.toast('Step complete — ' + st.title, 'ok', 1800);
      }
    }
    persist();
    if (index < TOTAL - 1) {
      enterStep(index + 1, true);
    } else {
      render();
      U.toast('Tutorial complete. Free practice unlocked.', 'ok', 3200);
      N.audio.success();
    }
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
    U.store.set('tutorial', { index, done });
  }

  function restore() {
    const saved = U.store.get('tutorial', null);
    if (saved && Array.isArray(saved.done)) {
      done = saved.done;
      index = U.clamp(saved.index || 0, 0, TOTAL - 1);
    }
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
    enterStep(0);
    persist();
    U.toast('Tutorial restarted', 'ok', 1600);
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
