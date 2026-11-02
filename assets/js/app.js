/* ============================================================
   app.js — wiring, UI rendering, input and the main loop
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';

  const U = N.util;
  const $ = U.$;
  const $$ = U.$$;

  const el = {};
  let activeView = 'sim';
  let comfortSmooth = null;
  let lastLive = 0;
  let lastTwitch = 0;
  let twitchTimer = 0;
  let lastOpenToast = 0;
  let modalOverflow = '';

  const LANG_NAMES = { en: 'English', fr: 'Français', it: 'Italiano', nl: 'Nederlands', es: 'Español' };
  const VOLUME_NAMES = { off: 'Off', low: 'Low', medium: 'Medium', high: 'High' };
  const BACKLIGHT_NAMES = { off: 'Off', '5s': '5 sec', '60s': '60 sec', always: 'Always on' };

  /* ── branding & artwork ─────────────────────────────── */

  function applyBrand() {
    const b = N.config.brand;

    const nameEl = $('[data-brand="name"]');
    if (nameEl) {
      const textNode = Array.from(nameEl.childNodes).find(n => n.nodeType === 3);
      if (textNode) textNode.nodeValue = b.name;
      else nameEl.insertBefore(document.createTextNode(b.name), nameEl.firstChild);
    }

    $$('[data-brand]').forEach(node => {
      const key = node.getAttribute('data-brand');
      if (key === 'name') return;
      if (b[key] != null) node.textContent = b[key];
    });

    document.title = b.name + ' ' + b.model + ' — Training Simulator';
  }

  function applyArt() {
    const art = N.config.device.art || {};
    const fallback = 'assets/svg/device-body.svg';
    const wanted = art.enabled && art.src ? art.src : fallback;
    if (!el.deviceBodyArt) return;

    function use(src) {
      el.deviceBodyArt.style.display = '';
      el.deviceBodyArt.setAttribute('href', src);
      el.device.classList.add('has-art');
    }

    function probe(src, isFallback) {
      const img = new Image();
      img.onload = () => use(src);
      img.onerror = () => {
        if (isFallback) {
          el.device.classList.remove('has-art');
          el.deviceBodyArt.style.display = 'none';
          U.toast('Device body artwork could not be loaded — using the built-in fallback', 'warn', 3600);
          return;
        }
        U.toast('Device artwork could not be loaded — using the built-in body', 'warn', 3600);
        probe(fallback, true);
      };
      img.src = src;
    }

    probe(wanted, wanted === fallback);
  }

  /* ── hold / tap gesture helper ──────────────────────── */

  function bindHold(btn, opts) {
    if (!btn) return;
    const holdMs = opts.hold || 650;
    let timer = 0;
    let down = false;
    let held = false;

    function start(e) {
      if (e.button != null && e.button !== 0) return;
      down = true;
      held = false;
      btn.classList.add('is-pressed');
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      timer = setTimeout(() => {
        timer = 0;
        held = true;
        btn.classList.remove('is-pressed');
        if (opts.onHold) opts.onHold();
      }, holdMs);
    }

    function end() {
      if (!down) return;
      down = false;
      if (timer) { clearTimeout(timer); timer = 0; }
      btn.classList.remove('is-pressed');
      if (!held && opts.onTap) opts.onTap();
      held = false;
      btn.blur();
    }

    function cancel() {
      down = false;
      held = false;
      if (timer) { clearTimeout(timer); timer = 0; }
      btn.classList.remove('is-pressed');
    }

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', cancel);

    // keyboard activation (detail === 0 means it came from Enter / Space)
    btn.addEventListener('click', e => {
      if (e.detail !== 0) return;
      e.preventDefault();
      (opts.onKeyboard || opts.onTap || opts.onHold || function () {})();
    });
  }

  function onTap(node, fn) {
    if (!node) return;
    node.addEventListener('click', fn);
  }

  /* ── patient card ───────────────────────────────────── */

  function updatePatient() {
    const p = N.patient.current();

    el.patientAvatar.textContent = p.initials;
    el.patientName.textContent = p.name;
    el.patientMeta.textContent = p.age + ' y · ' + p.caseLabel;
    el.patientSite.textContent = p.site;
    el.patientChipName.textContent = p.name;

    if (!el.revealBox.hidden) {
      el.revealTolerance.textContent = p.tolerance.toFixed(1) + ' (0.1 ms eq.)';
      el.revealFasc.textContent = p.fascThreshold.toFixed(1) + ' load';
    }

    updatePatientLive();
  }

  function updatePatientLive() {
    const p = N.patient.current();
    const s = N.device.state;

    const z = p.baseZ + (s.gel ? 0 : 11.2);
    el.patientZ.textContent = z.toFixed(1) + ' kΩ';
    el.patientZ.style.color = z > 13 ? 'var(--amber)' : '';

    let text;
    if (!s.power) text = 'Device off';
    else if (s.completed) text = 'Complete';
    else if (s.stimulating) text = 'Running · ' + U.fmtTime(s.timer);
    else if (s.paused) text = 'Paused · ' + U.fmtTime(s.timer);
    else if (s.everStarted) text = 'Stopped · ' + U.fmtTime(s.timer);
    else text = s.cable ? 'Ready' : 'Not started';
    el.patientSession.textContent = text;
  }

  /* ── procedure panel ────────────────────────────────── */

  function updateProcedure() {
    const s = N.device.state;
    const circuit = N.device.circuit();

    el.btnElectrode.classList.toggle('is-done', s.electrode);
    el.stateElectrode.textContent = s.electrode ? 'Placed' : 'Not placed';

    el.btnGel.classList.toggle('is-done', s.gel);
    el.stateGel.textContent = s.gel ? 'Applied' : 'Dry';

    el.btnProbe.classList.toggle('is-done', s.probe);
    el.btnProbe.classList.toggle('is-warn', s.stimulating && !s.probe);
    el.stateProbe.textContent = s.probe ? 'On skin' : 'Off skin';

    el.badgeCircuit.className = 'badge' + (circuit ? ' is-ok' : ' is-warn');
    el.badgeCircuit.innerHTML = '<i></i>' + (circuit ? 'Circuit closed' : s.cable ? 'Circuit open' : 'No cable');

    el.badgeContact.className = 'badge' + (s.probe ? ' is-ok' : '');
    el.badgeContact.innerHTML = '<i></i>' + (s.probe ? 'Probe on skin' : 'Probe off skin');

    let label = 'Setup';
    let tone = '';
    if (!s.power) label = 'Off';
    else if (s.phase === 'boot') { label = 'Starting'; tone = 'ok'; }
    else if (s.phase === 'menu') { label = 'Setup'; tone = 'ok'; }
    else if (s.completed) { label = 'Complete'; tone = 'ok'; }
    else if (s.stimulating) { label = 'Treating'; tone = 'ok'; }
    else if (s.paused) { label = 'Paused'; tone = 'warn'; }
    else if (!s.cable) { label = 'No cable'; tone = 'warn'; }
    else { label = 'Ready'; tone = 'ok'; }

    el.procPill.className = 'pill pill--state' + (tone ? ' pill--' + tone : '');
    el.procPill.textContent = label;
  }

  /* ── comfort meter ──────────────────────────────────── */

  function updateComfort() {
    const s = N.device.state;
    const load = N.device.load();
    const active = s.stimulating && N.device.circuit();
    const c = N.patient.comfort(load);

    if (active) {
      comfortSmooth = comfortSmooth == null ? c.score : comfortSmooth + (c.score - comfortSmooth) * 0.16;
    } else {
      comfortSmooth = null;
    }

    const score = active ? Math.round(comfortSmooth) : 0;

    el.gaugeFill.style.strokeDashoffset = String(258 * (1 - score / 100));
    el.gaugeNeedle.style.transform = 'rotate(' + (score * 1.8 - 90) + 'deg)';

    let pill = 'Idle';
    let tone = '';
    let caption = 'Start stimulation to read comfort';

    if (active) {
      pill = c.label;
      tone = c.tone;
      caption = c.label + ' · ' + (c.score >= 40 && c.score <= 59
        ? 'hold this level'
        : c.score > 59
          ? 'room to increase'
          : 'ease off');
      el.comfortValue.textContent = score;
      el.comfortValue.style.color = tone === 'ok' ? 'var(--ink)' : tone === 'warn' ? 'var(--amber)' : 'var(--red)';
      el.comfortHint.textContent = c.hint;
    } else {
      el.comfortValue.textContent = '—';
      el.comfortValue.style.color = 'var(--ink-4)';
      if (s.completed) caption = 'Session complete';
      else if (s.paused) caption = 'Paused — press play to resume';
      else if (s.stimulating && !N.device.circuit()) caption = 'Open circuit — no current delivered';
      else if (s.stimulating) caption = 'Waiting for a closed circuit';
      el.comfortHint.textContent = 'Comfort is a simulated patient response. Increase current until the meter reaches the therapeutic band, then stop before it turns red.';
    }

    el.comfortCaption.textContent = caption;
    el.comfortPill.className = 'pill pill--state' + (tone ? ' pill--' + tone : '');
    el.comfortPill.textContent = pill;

    el.roSet.textContent = s.current + ' mA';
    el.roDelivered.textContent = active && s.actual != null ? s.actual.toFixed(2) + ' mA' : '—';
    el.roLoad.textContent = load.toFixed(1);
  }

  /* ── fasciculation ──────────────────────────────────── */

  function updateFasc() {
    const s = N.device.state;
    const active = s.stimulating && N.device.circuit();
    const f = active ? N.patient.fasciculation(N.device.load()) : { level: 'None', index: 0 };

    el.fascValue.textContent = active ? f.level : 'None';
    el.fascValue.classList.toggle('is-live', active && f.index > 0);

    Array.from(el.fascBars.children).forEach((bar, i) => {
      bar.classList.toggle('is-on', active && i < f.index);
      bar.classList.toggle('is-hot', active && f.index >= 4 && i === 4);
    });

    el.fascRef.classList.toggle('is-on', s.electrode);
    el.fascProbe.classList.toggle('is-on', s.probe);

    const live = active && f.index > 0;
    el.ripple1.classList.toggle('is-live', live);
    el.ripple2.classList.toggle('is-live', live);
    el.fascSpark.classList.toggle('is-live', live);
  }

  function twitch() {
    const s = N.device.state;
    if (!s.stimulating || !N.device.circuit()) return;
    const f = N.patient.fasciculation(N.device.load());
    if (f.index < 1) return;

    const now = U.now();
    if (now - lastTwitch < 260) return;
    lastTwitch = now;

    el.fascArm.classList.remove('is-twitch');
    void el.fascArm.offsetWidth;
    el.fascArm.classList.add('is-twitch');

    clearTimeout(twitchTimer);
    twitchTimer = setTimeout(() => el.fascArm.classList.remove('is-twitch'), 470);
  }

  /* ── session panel ──────────────────────────────────── */

  function updateSession() {
    const s = N.device.state;
    el.setWave.textContent = s.wave === 'hybrid' ? 'Hybrid RF' : 'Square wave';
    el.setPw.textContent = s.pw.toFixed(1) + ' ms';
    el.setFreq.textContent = s.freq + ' Hz';
    el.setTimer.textContent = U.fmtTime(s.timerSet);
    el.setVol.textContent = VOLUME_NAMES[s.volume] || s.volume;
    el.setBacklight.textContent = BACKLIGHT_NAMES[s.backlight] || s.backlight;
    el.setLang.textContent = LANG_NAMES[s.lang] || s.lang;
    el.setUser.textContent = [s.user1, s.user2].filter(Boolean).join(' / ') || '—';
  }

  function updateAll() {
    updatePatient();
    updateProcedure();
    updateSession();
    updateComfort();
    updateFasc();
  }

  function updateLive() {
    updatePatientLive();
    updateComfort();
    updateFasc();
  }

  /* ── event log ──────────────────────────────────────── */

  function addLog(msg, time) {
    if (!el.eventLog) return;
    const empty = el.eventLog.querySelector('.log__empty');
    if (empty) empty.remove();

    const t = time instanceof Date ? time : new Date();
    const stamp = U.pad2(t.getHours()) + ':' + U.pad2(t.getMinutes()) + ':' + U.pad2(t.getSeconds());

    const li = document.createElement('li');
    li.innerHTML = '<time>' + stamp + '</time><span>' + U.esc(msg) + '</span>';

    if (/open circuit|warning|not recognised|depleted|fail|error|too high|dry/i.test(msg)) li.className = 'is-warn';
    else if (/complete|saved|started|placed|inserted|applied|powered on/i.test(msg)) li.className = 'is-ok';

    el.eventLog.appendChild(li);
    while (el.eventLog.children.length > 80) el.eventLog.removeChild(el.eventLog.firstChild);
    el.eventLog.scrollTop = el.eventLog.scrollHeight;
  }

  function clearLog() {
    el.eventLog.innerHTML = '<li class="log__empty">No events yet — power on the device to begin.</li>';
  }

  /* ── sound ──────────────────────────────────────────── */

  function updateSound() {
    el.btnSound.setAttribute('aria-pressed', N.audio.enabled ? 'true' : 'false');
    el.btnSound.title = N.audio.enabled ? 'Sound on' : 'Sound off';
  }

  /* ── view switching ─────────────────────────────────── */

  function switchView(view) {
    activeView = view;
    const sim = $('#view-sim');
    const guide = $('#view-guide');

    sim.hidden = view !== 'sim';
    sim.classList.toggle('is-active', view === 'sim');
    guide.hidden = view !== 'guide';
    guide.classList.toggle('is-active', view === 'guide');

    $$('.topnav__btn').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));

    if (view === 'guide') N.guide.show(N.guide.current);
    else updateLive();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── modal ──────────────────────────────────────────── */

  function openAbout() {
    modalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    el.modalAbout.hidden = false;
    const close = el.modalAbout.querySelector('.modal__close');
    if (close) close.focus();
  }

  function closeAbout() {
    el.modalAbout.hidden = true;
    document.body.style.overflow = modalOverflow;
  }

  /* ── bindings ───────────────────────────────────────── */

  function bindControls() {
    bindHold(el.btnPower, {
      hold: 700,
      onHold: () => N.device.togglePower(),
      onKeyboard: () => N.device.togglePower(),
      onTap: () => U.toast('Press and hold the power button to switch on or off', 'warn', 2200)
    });

    bindHold(el.btnMenu, {
      hold: 700,
      onTap: () => {
        const s = N.device.state;
        if (s.phase === 'menu') N.device.menuBack();
        else N.device.togglePulseWidth();
      },
      onHold: () => {
        const s = N.device.state;
        if (s.phase === 'menu') N.device.closeMenu();
        else N.device.openMenu();
      }
    });

    bindHold(el.btnEnter, {
      hold: 900,
      onTap: () => {
        const s = N.device.state;
        if (s.phase === 'menu') N.device.menuEnter();
        else N.device.cycleFrequency();
      }
    });

    bindHold(el.btnPlay, {
      hold: 2000,
      onTap: () => {
        const s = N.device.state;
        if (s.phase === 'menu') {
          U.toast('Exit the setup menu before starting stimulation', 'warn');
          return;
        }
        N.device.toggleStim();
      },
      onHold: () => {
        if (N.device.state.phase !== 'menu') {
          N.device.resetTimer();
          U.toast('Countdown reset', 'ok', 1600);
        }
      }
    });

    // cable socket
    function cableClick() {
      N.device.setCable(!N.device.state.cable);
    }
    if (el.cableSocket) {
      el.cableSocket.addEventListener('click', cableClick);
      el.cableSocket.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cableClick(); }
      });
    }

    onTap(el.btnElectrode, () => N.device.setElectrode(!N.device.state.electrode));
    onTap(el.btnGel, () => N.device.setGel(!N.device.state.gel));
    onTap(el.btnProbe, () => N.device.setProbe(!N.device.state.probe));

    onTap(el.btnNewPatient, () => {
      const s = N.device.state;
      if (s.probe) N.device.setProbe(false);
      if (s.gel) N.device.setGel(false);
      if (s.electrode) N.device.setElectrode(false);
      N.device.resetTimer();
      N.patient.newPatient();
      comfortSmooth = null;
      updateAll();
      U.toast('New patient loaded — settings and tolerance randomised', 'ok', 2600);
    });

    el.chkReveal.addEventListener('change', () => {
      el.revealBox.hidden = !el.chkReveal.checked;
      updatePatient();
    });

    el.btnResetTimer.addEventListener('click', () => {
      N.device.resetTimer();
      U.toast('Countdown reset', 'ok', 1500);
    });

    el.btnEndSession.addEventListener('click', () => {
      if (!N.device.state.power) { U.toast('The device is switched off', 'warn'); return; }
      N.device.endSession();
      U.toast('Session ended', 'ok', 1800);
    });

    el.btnResetSettings.addEventListener('click', () => {
      N.device.resetDefaults();
      comfortSmooth = null;
      updateAll();
      U.toast('Factory settings restored', 'ok', 2200);
    });

    el.btnClearLog.addEventListener('click', clearLog);

    el.btnSound.addEventListener('click', () => {
      N.audio.setEnabled(!N.audio.enabled);
      updateSound();
      N.audio.click();
    });

    el.btnAbout.addEventListener('click', openAbout);
    $$('[data-close]', el.modalAbout).forEach(b => b.addEventListener('click', closeAbout));

    // tabs
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const name = tab.dataset.tab;
        $$('.tab').forEach(t => {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $$('.tabpanel').forEach(p => {
          const on = p.dataset.panel === name;
          p.hidden = !on;
          p.classList.toggle('is-active', on);
        });
        N.tutorial.setActive(name === 'tutorial');
        if (name === 'log') el.eventLog.scrollTop = el.eventLog.scrollHeight;
      });
    });

    // trainer speed
    $$('#segSpeed button').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#segSpeed button').forEach(b => b.classList.toggle('is-active', b === btn));
        N.device.state.speed = Number(btn.dataset.speed) || 1;
        U.toast('Trainer speed ' + N.device.state.speed + '× — countdown and accommodation only', 'ok', 2200);
      });
    });

    // view navigation
    $$('[data-view]').forEach(node => {
      node.addEventListener('click', e => {
        e.preventDefault();
        switchView(node.dataset.view);
      });
    });

    // mobile panels
    $$('#mobileNav button').forEach(btn => {
      btn.addEventListener('click', () => {
        el.sim.dataset.mobile = btn.dataset.panel;
        $$('#mobileNav button').forEach(b => b.classList.toggle('is-active', b === btn));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // keyboard
    document.addEventListener('keydown', e => {
      if (!el.modalAbout.hidden) {
        if (e.key === 'Escape') closeAbout();
        return;
      }

      const target = e.target;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;

      if (activeView !== 'sim') {
        if (e.key === 'Escape') switchView('sim');
        return;
      }

      const s = N.device.state;

      // typing into user information takes priority
      if (s.phase === 'menu' && s.menu.screen === 'userinfo') {
        if (e.key === 'Enter') { e.preventDefault(); N.device.typeChar('Enter'); return; }
        if (e.key === 'Backspace' || e.key.length === 1) {
          if (N.device.typeChar(e.key)) { e.preventDefault(); return; }
        }
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (s.phase !== 'menu') N.device.toggleStim();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        N.device.nudgeCurrent(1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        N.device.nudgeCurrent(-1);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        N.device.togglePulseWidth();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        N.device.cycleFrequency();
      } else if (e.key === 'Enter') {
        if (s.phase === 'menu') { e.preventDefault(); N.device.menuEnter(); }
      } else if (e.key === 'Escape') {
        if (s.phase === 'menu') {
          if (s.menu.screen === 'root') N.device.closeMenu();
          else N.device.menuBack();
        }
      }
    });

    // unlock WebAudio on the first gesture
    document.addEventListener('pointerdown', () => N.audio.unlock(), { once: true });
    document.addEventListener('keydown', () => N.audio.unlock(), { once: true });

    window.addEventListener('beforeunload', () => N.device.persistDefaults());
  }

  /* ── event subscriptions ────────────────────────────── */

  function bindEvents() {
    const persist = U.debounce(() => N.device.persistDefaults(), 600);

    U.on('device:change', () => {
      updateAll();
      persist();
    });

    U.on('device:log', data => addLog(data.msg, data.time));

    U.on('device:stimulus', () => twitch());

    U.on('device:open', () => {
      const now = U.now();
      if (now - lastOpenToast > 4000) {
        lastOpenToast = now;
        U.toast('Open circuit — check the probe, reference electrode and gel', 'warn', 2600);
      }
    });

    U.on('session:complete', () => {
      U.toast('Treatment complete — stimulation stopped and timer reset', 'ok', 3200);
    });
  }

  /* ── main loop ──────────────────────────────────────── */

  function loop(now) {
    const dt = Math.min(0.1, Math.max(0, (now - loop.last) / 1000));
    loop.last = now;

    N.device.update(dt);
    N.tutorial.tick(dt);

    if (now - lastLive > 90) {
      lastLive = now;
      updateLive();
    }

    requestAnimationFrame(loop);
  }

  /* ── init ───────────────────────────────────────────── */

  function cache() {
    el.sim = $('#sim');
    el.device = $('#device');
    el.deviceBodyArt = $('#deviceBodyArt');
    el.btnPower = $('#btnPower');
    el.btnMenu = $('#btnMenu');
    el.btnEnter = $('#btnEnter');
    el.btnPlay = $('#btnPlay');
    el.cableSocket = $('#cableSocket');

    el.btnElectrode = $('#btnElectrode');
    el.btnGel = $('#btnGel');
    el.btnProbe = $('#btnProbe');
    el.stateElectrode = $('#stateElectrode');
    el.stateGel = $('#stateGel');
    el.stateProbe = $('#stateProbe');
    el.procPill = $('#procPill');
    el.badgeCircuit = $('#badgeCircuit');
    el.badgeContact = $('#badgeContact');

    el.patientAvatar = $('#patientAvatar');
    el.patientName = $('#patientName');
    el.patientMeta = $('#patientMeta');
    el.patientSite = $('#patientSite');
    el.patientZ = $('#patientZ');
    el.patientSession = $('#patientSession');
    el.patientChipName = $('#patientChipName');
    el.chkReveal = $('#chkReveal');
    el.revealBox = $('#revealBox');
    el.revealTolerance = $('#revealTolerance');
    el.revealFasc = $('#revealFasc');
    el.btnNewPatient = $('#btnNewPatient');

    el.comfortPill = $('#comfortPill');
    el.comfortValue = $('#comfortValue');
    el.comfortCaption = $('#comfortCaption');
    el.gaugeFill = $('#gaugeFill');
    el.gaugeNeedle = $('#gaugeNeedle');
    el.roSet = $('#roSet');
    el.roDelivered = $('#roDelivered');
    el.roLoad = $('#roLoad');
    el.comfortHint = $('#comfortHint');

    el.setWave = $('#setWave');
    el.setPw = $('#setPw');
    el.setFreq = $('#setFreq');
    el.setTimer = $('#setTimer');
    el.setVol = $('#setVol');
    el.setBacklight = $('#setBacklight');
    el.setLang = $('#setLang');
    el.setUser = $('#setUser');

    el.btnResetTimer = $('#btnResetTimer');
    el.btnEndSession = $('#btnEndSession');
    el.btnResetSettings = $('#btnResetSettings');
    el.btnClearLog = $('#btnClearLog');
    el.eventLog = $('#eventLog');

    el.btnSound = $('#btnSound');
    el.btnAbout = $('#btnAbout');
    el.modalAbout = $('#modalAbout');

    el.fascArm = $('#fascArm');
    el.fascRef = $('#fascRef');
    el.fascProbe = $('#fascProbe');
    el.fascValue = $('#fascValue');
    el.fascBars = $('#fascBars');
    el.ripple1 = $('#ripple1');
    el.ripple2 = $('#ripple2');
    el.fascSpark = $('#fascSpark');
  }

  function init() {
    cache();
    applyBrand();
    applyArt();

    N.patient.newPatient();
    N.device.init();
    N.wheel.init();
    N.guide.init();
    N.tutorial.init();

    bindControls();
    bindEvents();

    el.sim.dataset.mobile = 'stage';
    updateSound();
    updateAll();
    clearLog();
    addLog('Simulator ready — hold the power button to begin');

    loop.last = performance.now();
    requestAnimationFrame(loop);
  }

  N.app = {
    init,
    switchView,
    updateAll,
    updateLive,
    get view() { return activeView; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.NMS);
