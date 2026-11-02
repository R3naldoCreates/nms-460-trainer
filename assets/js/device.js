/* ============================================================
   device.js — NMS 460 state machine, LCD and menus
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';

  const U = N.util;
  const C = N.config;
  const el = {};

  /* ── state ──────────────────────────────────────────── */
  const D = {
    power: false,
    phase: 'off',          // off | boot | main | menu
    cable: false,
    electrode: false,
    gel: false,
    probe: false,

    stimulating: false,
    paused: false,
    everStarted: false,
    completed: false,
    completeUntil: 0,

    current: C.session.defaultCurrent,
    pw: C.session.defaultPulseWidth,
    freq: C.session.defaultFrequency,
    wave: 'hybrid',
    volume: 'medium',
    backlight: '5s',
    lang: 'en',
    user1: '',
    user2: '',

    timer: C.session.defaultCountdown,
    timerSet: C.session.defaultCountdown,
    battery: 88,

    actual: null,
    lastZ: null,

    // interaction counters used by the tutorial
    counts: { pw: 0, freq: 0, current: 0 },

    bootT: 0,
    bootStage: 0,
    stimAcc: 0,
    renderAcc: 0,
    idle: 0,
    speed: 1,

    ledUntil: 0,
    ledColor: null,

    menu: {
      open: false,
      screen: 'root',
      index: 0,
      listKey: null,
      pending: null,
      confirmIndex: 0,
      timerMin: 10,
      timerSec: 0,
      timerField: 'min',
      ui: { line: 0, text: ['', ''], charIndex: 0 }
    }
  };

  /* ── language ───────────────────────────────────────── */
  const I18N = {
    en: {
      setupMenu: 'SETUP MENU', language: 'LANGUAGE', stimMode: 'STIMULATION MODE',
      pulseWidth: 'PULSE WIDTH', frequency: 'FREQUENCY', countdown: 'COUNTDOWN TIMER',
      speaker: 'SPEAKER VOLUME', backlight: 'BACKLIGHT', userInfo: 'USER INFORMATION',
      exitMenu: 'EXIT MENU',
      insertCable: 'INSERT CABLE', pressToStim: 'PRESS &#9654;&#10074; KEY<br>TO STIMULATE',
      openCircuit: 'OPEN CIRCUIT<br>DETECTED', pause: 'PAUSE',
      replaceBatteries: 'REPLACE<br>BATTERIES', cableBad: 'CABLE NOT<br>RECOGNISED',
      complete: 'SESSION<br>COMPLETE',
      accept: 'ACCEPT:', youSelected: 'YOU HAVE SELECTED:',
      yes: 'YES', no: 'NO', minutes: 'MINUTES:', seconds: 'SECONDS:',
      charsLeft: 'CHARACTERS LEFT:', enterLine: 'ENTER TEXT LINE',
      hybrid: 'HYBRID RF', square: 'SQUARE WAVE',
      off: 'OFF', low: 'LOW', medium: 'MEDIUM', high: 'HIGH',
      b5: '5 sec', b60: '60 sec', bAlways: 'ALWAYS ON',
      adjustRange: 'ADJUST RANGE:', useWheel: 'USE WHEEL',
      startStim: 'PRESS PLAY TO START'
    },
    fr: {
      setupMenu: 'MENU REGLAGES', language: 'LANGUE', stimMode: 'MODE STIMULATION',
      pulseWidth: 'LARGEUR IMPULSION', frequency: 'FREQUENCE', countdown: 'MINUTEUR',
      speaker: 'VOLUME', backlight: 'RETROECLAIRAGE', userInfo: 'INFORMATIONS',
      exitMenu: 'QUITTER',
      insertCable: 'INSERER CABLE', pressToStim: 'APPUYEZ SUR<br>MARCHE',
      openCircuit: 'CIRCUIT<br>OUVERT', pause: 'PAUSE',
      replaceBatteries: 'REMPLACER<br>PILES', cableBad: 'CABLE NON<br>RECONNU',
      complete: 'SESSION<br>TERMINEE',
      accept: 'ACCEPTER:', youSelected: 'VOUS AVEZ CHOISI:',
      yes: 'OUI', no: 'NON', minutes: 'MINUTES:', seconds: 'SECONDES:',
      charsLeft: 'CARACTERES RESTANTS:', enterLine: 'TEXTE LIGNE',
      hybrid: 'HYBRIDE RF', square: 'ONDE CARREE',
      off: 'ARRET', low: 'BAS', medium: 'MOYEN', high: 'HAUT',
      b5: '5 sec', b60: '60 sec', bAlways: 'TOUJOURS',
      adjustRange: 'PLAGE:', useWheel: 'MOLETTE',
      startStim: 'APPUYEZ SUR PLAY'
    },
    it: {
      setupMenu: 'MENU IMPOSTAZIONI', language: 'LINGUA', stimMode: 'MODO STIMOLAZIONE',
      pulseWidth: 'LARGHEZZA IMPULSO', frequency: 'FREQUENZA', countdown: 'TIMER',
      speaker: 'VOLUME', backlight: 'RETROILLUMINAZIONE', userInfo: 'INFO UTENTE',
      exitMenu: 'ESCI',
      insertCable: 'INSERIRE CAVO', pressToStim: 'PREMI PLAY<br>PER STIMOLARE',
      openCircuit: 'CIRCUITO<br>APERTO', pause: 'PAUSA',
      replaceBatteries: 'SOSTITUIRE<br>BATTERIE', cableBad: 'CAVO NON<br>RICONOSCIUTO',
      complete: 'SESSIONE<br>COMPLETA',
      accept: 'ACCETTA:', youSelected: 'HAI SELEZIONATO:',
      yes: 'SI', no: 'NO', minutes: 'MINUTI:', seconds: 'SECONDI:',
      charsLeft: 'CARATTERI RIMASTI:', enterLine: 'TESTO RIGA',
      hybrid: 'IBRIDO RF', square: 'ONDA QUADRA',
      off: 'SPENTO', low: 'BASSO', medium: 'MEDIO', high: 'ALTO',
      b5: '5 sec', b60: '60 sec', bAlways: 'SEMPRE',
      adjustRange: 'INTERVALLO:', useWheel: 'MANOPOLA',
      startStim: 'PREMI PLAY'
    },
    nl: {
      setupMenu: 'INSTELLINGEN', language: 'TAAL', stimMode: 'STIMULATIEMODUS',
      pulseWidth: 'PULSBREEDTE', frequency: 'FREQUENTIE', countdown: 'AFTELTIMER',
      speaker: 'VOLUME', backlight: 'VERLICHTING', userInfo: 'GEBRUIKERSINFO',
      exitMenu: 'MENU VERLATEN',
      insertCable: 'KABEL INVOEREN', pressToStim: 'DRUK OP PLAY<br>OM TE STARTEN',
      openCircuit: 'OPEN<br>CIRCUIT', pause: 'PAUZE',
      replaceBatteries: 'VERVANG<br>BATTERIJEN', cableBad: 'KABEL NIET<br>HERKEND',
      complete: 'SESSIE<br>VOLTOOID',
      accept: 'ACCEPTEER:', youSelected: 'U KOOS:',
      yes: 'JA', no: 'NEE', minutes: 'MINUTEN:', seconds: 'SECONDEN:',
      charsLeft: 'TEKENS OVER:', enterLine: 'TEKST REGEL',
      hybrid: 'HYBRIDE RF', square: 'VIERKANTE GOLF',
      off: 'UIT', low: 'LAAG', medium: 'MIDDEL', high: 'HOOG',
      b5: '5 sec', b60: '60 sec', bAlways: 'ALTIJD AAN',
      adjustRange: 'BEREIK:', useWheel: 'WIEL',
      startStim: 'DRUK OP PLAY'
    },
    es: {
      setupMenu: 'MENU AJUSTES', language: 'IDIOMA', stimMode: 'MODO ESTIMULACION',
      pulseWidth: 'ANCHO DE PULSO', frequency: 'FRECUENCIA', countdown: 'TEMPORIZADOR',
      speaker: 'VOLUMEN', backlight: 'RETROILUMINACION', userInfo: 'INFO USUARIO',
      exitMenu: 'SALIR',
      insertCable: 'INSERTAR CABLE', pressToStim: 'PULSE PLAY<br>PARA ESTIMULAR',
      openCircuit: 'CIRCUITO<br>ABIERTO', pause: 'PAUSA',
      replaceBatteries: 'CAMBIAR<br>BATERIAS', cableBad: 'CABLE NO<br>RECONOCIDO',
      complete: 'SESION<br>COMPLETA',
      accept: 'ACEPTAR:', youSelected: 'HA SELECCIONADO:',
      yes: 'SI', no: 'NO', minutes: 'MINUTOS:', seconds: 'SEGUNDOS:',
      charsLeft: 'CARACTERES RESTANTES:', enterLine: 'TEXTO LINEA',
      hybrid: 'HIBRIDO RF', square: 'ONDA CUADRADA',
      off: 'APAGADO', low: 'BAJO', medium: 'MEDIO', high: 'ALTO',
      b5: '5 sec', b60: '60 sec', bAlways: 'SIEMPRE',
      adjustRange: 'RANGO:', useWheel: 'RUEDA',
      startStim: 'PULSE PLAY'
    }
  };

  const t = k => (I18N[D.lang] && I18N[D.lang][k]) || I18N.en[k] || k;

  /* ── menu definitions ───────────────────────────────── */
  const ROOT_ITEMS = [
    { key: 'language', label: 'language', type: 'list' },
    { key: 'mode',     label: 'stimMode', type: 'list' },
    { key: 'pulse',    label: 'pulseWidth', type: 'list' },
    { key: 'freq',     label: 'frequency', type: 'list' },
    { key: 'timer',    label: 'countdown', type: 'timer' },
    { key: 'volume',   label: 'speaker', type: 'list' },
    { key: 'backlight',label: 'backlight', type: 'list' },
    { key: 'userinfo', label: 'userInfo', type: 'userinfo' },
    { key: 'exit',     label: 'exitMenu', type: 'exit' }
  ];

  const LISTS = {
    language: {
      title: 'language',
      get: () => D.lang,
      options: [
        { value: 'en', label: 'ENGLISH' },
        { value: 'fr', label: 'FRANCAIS' },
        { value: 'it', label: 'ITALIANO' },
        { value: 'nl', label: 'NEDERLANDS' },
        { value: 'es', label: 'ESPANOL' }
      ]
    },
    mode: {
      title: 'stimMode',
      get: () => D.wave,
      options: [
        { value: 'hybrid', label: 'HYBRID RF' },
        { value: 'square', label: 'SQUARE WAVE' }
      ]
    },
    pulse: {
      title: 'pulseWidth',
      get: () => D.pw,
      options: [
        { value: 0.1, label: '0.1 ms' },
        { value: 0.2, label: '0.2 ms' }
      ]
    },
    freq: {
      title: 'frequency',
      get: () => D.freq,
      options: [
        { value: 1, label: '1 Hz' },
        { value: 2, label: '2 Hz' },
        { value: 5, label: '5 Hz' },
        { value: 10, label: '10 Hz' }
      ]
    },
    volume: {
      title: 'speaker',
      get: () => D.volume,
      options: [
        { value: 'off', label: 'OFF' },
        { value: 'low', label: 'LOW' },
        { value: 'medium', label: 'MEDIUM' },
        { value: 'high', label: 'HIGH' }
      ]
    },
    backlight: {
      title: 'backlight',
      get: () => D.backlight,
      options: [
        { value: 'off', label: 'OFF' },
        { value: '5s', label: '5 sec' },
        { value: '60s', label: '60 sec' },
        { value: 'always', label: 'ALWAYS ON' }
      ]
    }
  };

  // Character set for USER INFORMATION. The last two entries are the
  // device's special keys: backspace and "enter line".
  const CHARSET = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,-\'&/()'
  ).split('').map(ch => ({
    ch,
    label: ch === ' ' ? '␣' : ch,
    type: ch === ' ' ? 'space' : 'char'
  })).concat([
    { ch: '', label: '⌫', type: 'back' },
    { ch: '', label: '↵', type: 'line' }
  ]);

  /* ── icons ────────────────────────────────────────────
     LCD icons are editable files in assets/svg/. Replace a file to
     change its look; the filenames here are the only references. */
  const ICONS = {
    hybrid: '<img src="assets/svg/wave-hybrid.svg" alt="">',
    square: '<img src="assets/svg/wave-square.svg" alt="">',
    speakerOn: '<img src="assets/svg/speaker-on.svg" alt="">',
    speakerOff: '<img src="assets/svg/speaker-off.svg" alt="">',
    warn: '<img src="assets/svg/warn.svg" alt="">'
  };

  function batteryIcon(level) {
    const bars = level > 66 ? 3 : level > 33 ? 2 : level > 10 ? 1 : 0;
    let inner = '';
    for (let i = 0; i < 3; i++) {
      inner += `<rect x="${5 + i * 5.6}" y="9" width="4" height="6" rx="0.8" fill="currentColor" opacity="${i < bars ? 1 : 0.16}"/>`;
    }
    return `<svg viewBox="0 0 30 24" fill="none"><rect x="1.6" y="6.4" width="23" height="11.2" rx="2.2" stroke="currentColor" stroke-width="1.7"/><rect x="26" y="10" width="2.8" height="4" rx="1" fill="currentColor"/>${inner}</svg>`;
  }

  /* ── helpers ────────────────────────────────────────── */
  function circuit() {
    return D.cable && D.electrode && D.probe;
  }

  function load() {
    return N.patient.load(D.current, D.pw);
  }

  function computeActual() {
    const z = N.patient.impedance(D.gel);
    D.lastZ = z;
    let factor = 1;
    if (z > 13) factor = U.clamp(13 / z, 0.34, 0.9);
    const n = 1 + U.rand(-0.008, 0.008);
    return D.current * factor * n;
  }

  function mismatch() {
    if (D.actual == null || D.current === 0) return false;
    return Math.abs(D.actual - D.current) / D.current > 0.10;
  }

  function setLED(color, ms) {
    D.ledColor = color;
    D.ledUntil = U.now() + ms;
    applyLED();
  }

  function applyLED() {
    if (!el.led) return;
    const c = D.ledColor;
    el.led.setAttribute('fill', c === 'green' ? '#3dff9e' : c === 'red' ? '#ff4d4d' : '#1d2a24');
    el.ledGlow.setAttribute('fill', c === 'green' ? '#3dff9e' : c === 'red' ? '#ff4d4d' : '#3dff9e');
    el.ledGlow.setAttribute('opacity', c ? '0.85' : '0');
  }

  /* ── boot / power ───────────────────────────────────── */
  function powerOn() {
    if (D.power) return;
    D.power = true;
    D.phase = 'boot';
    D.bootT = 0;
    D.bootStage = -1;
    D.timer = D.timerSet;
    D.stimulating = false;
    D.paused = false;
    D.everStarted = false;
    D.completed = false;
    D.actual = null;
    D.idle = 0;
    D.menu.open = false;
    N.audio.power(true);
    log('Device powered on');
    renderAll();
    U.emit('device:change');
  }

  function powerOff() {
    if (!D.power) return;
    D.power = false;
    D.phase = 'off';
    D.stimulating = false;
    D.paused = false;
    D.completed = false;
    D.menu.open = false;
    D.actual = null;
    N.audio.power(false);
    log('Device powered off');
    renderAll();
    U.emit('device:change');
  }

  function togglePower() {
    if (D.power) powerOff(); else powerOn();
  }

  /* ── cable / procedure ──────────────────────────────── */
  function setCable(on) {
    D.cable = !!on;
    if (!D.cable) {
      D.stimulating = false;
      D.paused = false;
      D.everStarted = false;
    }
    N.audio.click();
    log(D.cable ? 'Treatment cable inserted' : 'Treatment cable removed');
    renderAll();
    U.emit('device:change');
  }

  function setElectrode(on) {
    D.electrode = !!on;
    N.audio.click();
    log(D.electrode ? 'Reference electrode placed (contralateral)' : 'Reference electrode removed');
    renderAll();
    U.emit('device:change');
  }

  function setGel(on) {
    D.gel = !!on;
    N.audio.click();
    log(D.gel ? 'Conductive gel applied' : 'Gel removed');
    renderAll();
    U.emit('device:change');
  }

  function setProbe(on) {
    D.probe = !!on;
    N.audio.click();
    log(D.probe ? 'Treatment probe on skin' : 'Treatment probe lifted');
    renderAll();
    U.emit('device:change');
  }

  /* ── stimulation ────────────────────────────────────── */
  function toggleStim() {
    if (!D.power || D.phase === 'off') {
      U.toast('Press and hold the power button to switch on', 'warn');
      return;
    }
    if (D.phase === 'menu') return;

    if (!D.cable) {
      U.toast('Insert the treatment cable first', 'warn');
      return;
    }

    if (D.completed) {
      D.completed = false;
      D.timer = D.timerSet;
    }

    if (D.stimulating) {
      D.stimulating = false;
      D.paused = true;
      log('Stimulation paused');
    } else {
      D.stimulating = true;
      D.paused = false;
      D.everStarted = true;
      D.stimAcc = 0;
      log('Stimulation started · ' + D.freq + ' Hz · ' + D.current + ' mA');
      N.audio.click();
    }
    renderAll();
    U.emit('device:change');
  }

  function resetTimer() {
    D.timer = D.timerSet;
    D.completed = false;
    D.paused = false;
    D.everStarted = false;
    D.stimulating = false;
    D.actual = null;
    log('Countdown timer reset');
    N.audio.click();
    renderAll();
    U.emit('device:change');
  }

  function endSession() {
    if (!D.power) return;
    D.stimulating = false;
    D.paused = false;
    D.completed = false;
    D.everStarted = false;
    D.timer = D.timerSet;
    D.actual = null;
    log('Session ended — timer reset');
    N.audio.click();
    renderAll();
    U.emit('device:change');
  }

  function completeSession() {
    D.stimulating = false;
    D.completed = true;
    D.timer = 0;
    D.actual = null;
    D.completeUntil = U.now() + 3200;
    N.audio.alarm();
    log('Countdown complete — stimulation stopped');
    U.emit('session:complete');
    renderAll();
    U.emit('device:change');
  }

  function fire() {
    if (circuit()) {
      D.actual = computeActual();
      setLED('green', 70);
      N.audio.stimulus(D.volume);
      U.emit('device:stimulus', {
        actual: D.actual,
        current: D.current,
        load: load(),
        mismatch: mismatch()
      });
    } else {
      D.actual = null;
      setLED('red', 95);
      U.emit('device:open', {});
    }
  }

  /* ── controls ───────────────────────────────────────── */
  function setCurrent(v, silent) {
    v = U.clamp(Math.round(v), 0, C.session.currentMax);
    if (v === D.current) return false;
    D.current = v;
    D.counts.current++;
    if (!silent) N.audio.click();
    renderLive();
    U.emit('device:change');
    return true;
  }

  function nudgeCurrent(delta) {
    if (!D.power) return;
    if (D.phase === 'menu') { menuNav(delta); return; }
    setCurrent(D.current + delta);
  }

  function togglePulseWidth() {
    if (!D.power) return;
    if (D.phase === 'menu') { menuBack(); return; }
    D.pw = D.pw >= 0.2 ? 0.1 : 0.2;
    D.counts.pw++;
    N.audio.click();
    log('Pulse width set to ' + D.pw.toFixed(1) + ' ms');
    renderAll();
    U.emit('device:change');
  }

  function cycleFrequency() {
    if (!D.power) return;
    if (D.phase === 'menu') { menuEnter(); return; }
    const arr = C.session.frequencies;
    const i = arr.indexOf(D.freq);
    D.freq = arr[(i + 1) % arr.length];
    D.counts.freq++;
    N.audio.click();
    log('Frequency set to ' + D.freq + ' Hz');
    renderAll();
    U.emit('device:change');
  }

  /* ── menu ───────────────────────────────────────────── */
  function openMenu() {
    if (!D.power || D.phase === 'boot') return;
    if (D.stimulating) {
      D.stimulating = false;
      D.paused = true;
      log('Stimulation paused for setup menu');
    }
    D.phase = 'menu';
    D.menu.open = true;
    D.menu.screen = 'root';
    D.menu.index = 0;
    D.menu.listKey = null;
    D.menu.pending = null;
    N.audio.click();
    renderAll();
    U.emit('device:change');
  }

  function closeMenu() {
    D.phase = 'main';
    D.menu.open = false;
    N.audio.click();
    renderAll();
    U.emit('device:change');
  }

  function menuBack() {
    const m = D.menu;
    if (m.screen === 'root') { closeMenu(); return; }
    if (m.screen === 'confirm') {
      m.screen = m.returnTo || 'root';
      N.audio.click();
      renderMenu();
      return;
    }
    m.screen = 'root';
    m.index = 0;
    m.pending = null;
    N.audio.click();
    renderMenu();
  }

  function menuNav(delta) {
    const m = D.menu;
    N.audio.click();

    if (m.screen === 'root') {
      m.index = (m.index + delta + ROOT_ITEMS.length) % ROOT_ITEMS.length;
    } else if (m.screen === 'list') {
      const n = LISTS[m.listKey].options.length + 1;
      m.index = (m.index + delta + n) % n;
    } else if (m.screen === 'confirm') {
      m.confirmIndex = m.confirmIndex === 0 ? 1 : 0;
    } else if (m.screen === 'timer') {
      if (m.timerField === 'min') {
        m.timerMin = (m.timerMin + delta + 60) % 60;
      } else {
        m.timerSec = (m.timerSec + delta + 60) % 60;
      }
    } else if (m.screen === 'userinfo') {
      const n = CHARSET.length;
      m.ui.charIndex = (m.ui.charIndex + delta + n) % n;
    }
    renderMenu();
  }

  function menuEnter() {
    const m = D.menu;
    N.audio.click();

    if (m.screen === 'root') {
      const item = ROOT_ITEMS[m.index];
      if (item.type === 'exit') { closeMenu(); return; }
      if (item.type === 'timer') {
        m.screen = 'timer';
        m.timerMin = Math.floor(D.timerSet / 60);
        m.timerSec = D.timerSet % 60;
        m.timerField = 'min';
        renderMenu();
        return;
      }
      if (item.type === 'userinfo') {
        m.screen = 'userinfo';
        m.ui.text = [D.user1, D.user2];
        m.ui.line = 0;
        m.ui.charIndex = 0;
        renderMenu();
        return;
      }
      m.screen = 'list';
      m.listKey = item.key;
      m.index = 0;
      const cur = LISTS[item.key].get();
      const idx = LISTS[item.key].options.findIndex(o => o.value === cur);
      if (idx > -1) m.index = idx;
      renderMenu();
      return;
    }

    if (m.screen === 'list') {
      const def = LISTS[m.listKey];
      if (m.index >= def.options.length) { m.screen = 'root'; m.index = 0; renderMenu(); return; }
      const opt = def.options[m.index];
      m.pending = { key: m.listKey, value: opt.value, label: opt.label };
      m.returnTo = 'list';
      m.screen = 'confirm';
      m.confirmIndex = 0;
      renderMenu();
      return;
    }

    if (m.screen === 'confirm') {
      if (m.confirmIndex === 0) applyPending();
      else {
        // NO on USER INFORMATION returns to the first line, as per the IFU
        if (m.returnTo === 'userinfo') { m.ui.line = 0; m.ui.charIndex = 0; }
        m.screen = m.returnTo || 'root';
        renderMenu();
      }
      return;
    }

    if (m.screen === 'timer') {
      if (m.timerField === 'min') {
        m.timerField = 'sec';
        renderMenu();
        return;
      }
      const secs = Math.max(1, m.timerMin * 60 + m.timerSec);
      m.pending = { key: 'timer', value: secs, label: U.fmtTime(secs) };
      m.returnTo = 'root';
      m.screen = 'confirm';
      m.confirmIndex = 0;
      renderMenu();
      return;
    }

    if (m.screen === 'userinfo') {
      const line = m.ui.line;
      const entry = CHARSET[m.ui.charIndex] || CHARSET[0];

      if (entry.type === 'back') {
        m.ui.text[line] = m.ui.text[line].slice(0, -1);
      } else if (entry.type === 'line') {
        if (line === 0) {
          m.ui.line = 1;
          m.ui.charIndex = 0;
        } else {
          m.pending = { key: 'userinfo', value: m.ui.text.slice(), label: m.ui.text.join('\n') || '—' };
          m.returnTo = 'userinfo';
          m.screen = 'confirm';
          m.confirmIndex = 0;
        }
      } else if (m.ui.text[line].length < 20) {
        m.ui.text[line] += entry.type === 'space' ? ' ' : entry.ch;
      }
      renderMenu();
      return;
    }
  }

  function applyPending() {
    const p = D.menu.pending;
    if (!p) { D.menu.screen = 'root'; renderMenu(); return; }

    if (p.key === 'language') D.lang = p.value;
    else if (p.key === 'mode') D.wave = p.value;
    else if (p.key === 'pulse') D.pw = p.value;
    else if (p.key === 'freq') D.freq = p.value;
    else if (p.key === 'volume') D.volume = p.value;
    else if (p.key === 'backlight') D.backlight = p.value;
    else if (p.key === 'timer') { D.timerSet = p.value; D.timer = p.value; }
    else if (p.key === 'userinfo') { D.user1 = p.value[0] || ''; D.user2 = p.value[1] || ''; }

    N.audio.success();
    log('Setting saved · ' + p.label);
    D.menu.screen = 'root';
    D.menu.index = 0;
    D.menu.pending = null;
    renderAll();
    U.emit('device:change');
  }

  /* ── user info keyboard (desktop shortcut) ──────────── */
  function typeChar(ch) {
    const m = D.menu;
    if (m.screen !== 'userinfo') return false;
    if (ch === 'Backspace') {
      m.ui.text[m.ui.line] = m.ui.text[m.ui.line].slice(0, -1);
      renderMenu(); return true;
    }
    if (ch === 'Enter') {
      if (m.ui.line === 0) {
        m.ui.line = 1;
        m.ui.charIndex = 0;
      } else {
        m.pending = { key: 'userinfo', value: m.ui.text.slice(), label: m.ui.text.join('\n') || '—' };
        m.returnTo = 'userinfo';
        m.screen = 'confirm';
        m.confirmIndex = 0;
      }
      renderMenu(); return true;
    }
    if (ch.length === 1 && m.ui.text[m.ui.line].length < 20) {
      m.ui.text[m.ui.line] += ch.toUpperCase();
      renderMenu(); return true;
    }
    return false;
  }

  /* ── rendering ──────────────────────────────────────── */
  function renderAll() {
    if (!el.device) return;
    el.device.dataset.power = D.power ? 'on' : 'off';
    el.device.dataset.cable = D.cable ? 'in' : 'out';
    el.device.dataset.stim = D.stimulating ? 'on' : 'off';
    el.device.dataset.backlight = D.backlight;
    renderLCD();
    renderStatus();
  }

  function renderLCD() {
    if (!el.lcdMain) return;

    const showBoot = D.phase === 'boot';
    const showMenu = D.phase === 'menu';

    el.lcdMain.hidden = showBoot || showMenu;
    el.lcdBoot.hidden = !showBoot;
    el.lcdMenu.hidden = !showMenu;

    if (showBoot) { renderBoot(); return; }
    if (showMenu) { renderMenu(); return; }

    el.lcdCurrent.textContent = D.current;
    el.lcdTimer.textContent = U.fmtTime(D.timer);
    el.lcdPw.textContent = D.pw.toFixed(1) + 'ms';
    el.lcdHz.textContent = D.freq + 'Hz';

    // icons
    const waveKey = D.wave;
    if (el.lcdWave.dataset.k !== waveKey) {
      el.lcdWave.dataset.k = waveKey;
      el.lcdWave.innerHTML = ICONS[D.wave === 'hybrid' ? 'hybrid' : 'square'];
    }
    const spkKey = D.volume === 'off' ? 'off' : 'on';
    if (el.lcdSpeaker.dataset.k !== spkKey) {
      el.lcdSpeaker.dataset.k = spkKey;
      el.lcdSpeaker.innerHTML = ICONS[D.volume === 'off' ? 'speakerOff' : 'speakerOn'];
      el.lcdSpeaker.classList.toggle('lcd__icon--dim', D.volume === 'off');
    }
    const batKey = Math.ceil(D.battery / 10);
    if (el.lcdBattery.dataset.k !== String(batKey)) {
      el.lcdBattery.dataset.k = String(batKey);
      el.lcdBattery.innerHTML = batteryIcon(D.battery);
    }

    // message
    const msg = mainMessage();
    if (el.lcdMsg.dataset.k !== msg.key) {
      el.lcdMsg.dataset.k = msg.key;
      el.lcdMsg.className = 'lcd__msg ' + (msg.cls || '');
      el.lcdMsg.innerHTML = msg.html;
    }
  }

  function mainMessage() {
    if (!D.power) return { key: 'off', html: '', cls: '' };

    if (!D.cable) return { key: 'cable', html: t('insertCable') + warn(), cls: 'is-warn is-big' };

    if (D.battery <= 3) return { key: 'bat', html: t('replaceBatteries') + warn(), cls: 'is-warn is-tiny' };

    if (D.completed) return { key: 'done', html: t('complete') + warn(), cls: 'is-warn is-tiny' };

    if (D.stimulating) {
      if (!circuit()) return { key: 'open', html: t('openCircuit') + warn(), cls: 'is-warn is-tiny' };
      const a = D.actual == null ? D.current : D.actual;
      const w = mismatch() ? warn() : '';
      return { key: 'actual' + (mismatch() ? '1' : '0') + ':' + a.toFixed(2), html: '~' + a.toFixed(2) + 'mA' + w, cls: 'is-plain is-big' };
    }

    if (D.paused) return { key: 'pause', html: t('pause') + warn(), cls: 'is-warn is-big' };

    return { key: 'press', html: t('pressToStim') + warn(), cls: 'is-warn is-tiny' };
  }

  function warn() {
    return '<span class="lcd__warn">' + ICONS.warn + '</span>';
  }

  function renderBoot() {
    const stage = D.bootT < 1.15 ? 0 : 1;
    if (stage === D.bootStage) return;
    D.bootStage = stage;

    if (stage === 0) {
      el.lcdBoot.innerHTML = '<div class="boot__logo"><i></i>' + (C.brand.deviceFooter || 'ALGIAMED') + '</div>';
    } else {
      const user = [D.user1, D.user2].filter(Boolean).join('\n');
      el.lcdBoot.innerHTML =
        '<div class="boot__model">' + C.device.model + '</div>' +
        '<div class="boot__ver">' + C.device.firmware + '</div>' +
        (user ? '<div class="boot__user">' + U.esc(user) + '</div>' : '');
    }
  }

  function renderMenu() {
    const m = D.menu;
    if (!el.lcdMenu) return;
    let html = '';

    if (m.screen === 'root') {
      html += '<div class="menu__title">' + t('setupMenu') + '</div><div class="menu__list">';
      ROOT_ITEMS.forEach((it, i) => {
        const label = t(it.label);
        const long = label.length > 16 ? ' is-long' : '';
        html += '<div class="menu__row' + (i === m.index ? ' is-sel' : '') + long +
                (it.key === 'exit' ? ' menu__row--exit' : '') + '">' +
                '<span>' + (i + 1) + '&nbsp; ' + label + '</span></div>';
      });
      html += '</div>';
    }

    else if (m.screen === 'list') {
      const def = LISTS[m.listKey];
      const cur = def.get();
      html += '<div class="menu__title">' + t(def.title) + '</div><div class="menu__list">';
      def.options.forEach((o, i) => {
        html += '<div class="menu__row' + (i === m.index ? ' is-sel' : '') + '">' +
                '<span class="menu__radio' + (o.value === cur ? ' is-on' : '') + '"></span>' +
                '<span>' + o.label + '</span></div>';
      });
      html += '<div class="menu__row menu__row--exit' + (m.index === def.options.length ? ' is-sel' : '') + '">' +
              t('exitMenu') + '</div>';
      html += '</div>';
    }

    else if (m.screen === 'confirm') {
      const confirmTitle = LISTS[m.pending.key]
        ? LISTS[m.pending.key].title
        : (m.pending.key === 'timer' ? 'countdown' : m.pending.key === 'userinfo' ? 'userInfo' : 'setupMenu');
      html += '<div class="menu__title">' + t(confirmTitle) + '</div>';
      html += '<div class="menu__confirm">';
      html += '<div class="menu__confirm-label">' + t('youSelected') + '</div>';
      html += '<div class="menu__confirm-value">' + U.esc(m.pending.label) + '</div>';
      html += '<div class="menu__accept">' + t('accept') +
              '<span class="opt' + (m.confirmIndex === 0 ? ' is-sel' : '') + '">' + t('yes') + '</span>' +
              '<span class="opt' + (m.confirmIndex === 1 ? ' is-sel' : '') + '">' + t('no') + '</span>' +
              '</div></div>';
    }

    else if (m.screen === 'timer') {
      html += '<div class="menu__title">' + t('countdown') + '</div>';
      html += '<div class="menu__editor">';
      html += '<div class="menu__field' + (m.timerField === 'min' ? ' is-active' : '') + '">' +
              '<span>' + t('minutes') + '</span><b>' + U.pad2(m.timerMin) + '</b></div>';
      html += '<div class="menu__field' + (m.timerField === 'sec' ? ' is-active' : '') + '">' +
              '<span>' + t('seconds') + '</span><b>' + U.pad2(m.timerSec) + '</b></div>';
      html += '<div class="menu__note">' + t('useWheel') + ' &middot; ENTER</div>';
      html += '</div>';
    }

    else if (m.screen === 'userinfo') {
      const line = m.ui.line;
      const text = m.ui.text[line];
      const caret = text.length < 20 ? '<span class="caret">&nbsp;</span>' : '';
      html += '<div class="menu__title">' + t('userInfo') + '</div>';
      html += '<div class="menu__editor">';
      html += '<div class="menu__text">' + (line === 0 ? '' : U.esc(m.ui.text[0]) + '\n') + U.esc(text) + caret + '</div>';
      html += '<div class="menu__charset">';
      CHARSET.forEach((c, i) => {
        const cls = (i === m.ui.charIndex ? 'is-sel' : '') +
                    (c.type === 'back' || c.type === 'line' ? ' is-special' : '');
        html += '<span' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + '>' + U.esc(c.label) + '</span>';
      });
      html += '</div>';
      html += '<div class="menu__note">' + t('charsLeft') + ' ' + (20 - text.length) + '</div>';
      html += '</div>';
    }

    el.lcdMenu.innerHTML = html;
  }

  function renderStatus() {
    if (!el.statusText) return;
    let text = '', tone = '';

    if (!D.power) {
      text = 'Device off — press and hold the power button';
    } else if (D.phase === 'boot') {
      text = 'Starting up…';
      tone = 'ok';
    } else if (D.phase === 'menu') {
      text = 'Setup menu — turn the wheel to navigate, press Enter to select';
      tone = 'ok';
    } else if (!D.cable) {
      text = 'Insert the treatment cable';
      tone = 'warn';
    } else if (D.stimulating && !circuit()) {
      text = 'Open circuit — touch the probe to the patient to complete the circuit';
      tone = 'bad';
    } else if (D.stimulating) {
      text = 'Stimulating · ' + D.freq + ' Hz · ' + D.current + ' mA' +
             (mismatch() ? ' · high impedance warning' : '');
      tone = mismatch() ? 'warn' : 'ok';
    } else if (D.paused) {
      text = 'Paused — press play to resume, or hold play to reset the timer';
      tone = 'warn';
    } else {
      text = 'Ready — press the centre button to start stimulation';
      tone = 'ok';
    }

    el.statusText.textContent = text;
    el.statusDot.className = 'statusbar__dot' +
      (tone ? ' is-' + tone : '') +
      (D.stimulating && circuit() ? ' is-live' : '');
  }

  function renderLive() {
    if (!el.lcdCurrent) return;
    if (D.phase === 'main') {
      el.lcdCurrent.textContent = D.current;
      el.lcdTimer.textContent = U.fmtTime(D.timer);
      renderLCD();
    }
    renderStatus();
  }

  /* ── log ────────────────────────────────────────────── */
  function log(msg) {
    U.emit('device:log', { msg, time: new Date() });
  }

  /* ── tick ───────────────────────────────────────────── */
  function update(dt) {
    if (!D.power) {
      if (D.ledColor) { D.ledColor = null; applyLED(); }
      return;
    }

    const now = U.now();

    if (D.ledColor && now > D.ledUntil) {
      D.ledColor = null;
      applyLED();
    }

    if (D.phase === 'boot') {
      D.bootT += dt;
      if (D.bootT >= 2.3) {
        D.phase = 'main';
        D.bootStage = -1;
        log('Ready');
        renderAll();
        U.emit('device:change');
      } else {
        renderBoot();
      }
      return;
    }

    if (D.completed && D.completeUntil && now > D.completeUntil) {
      D.completed = false;
      D.completeUntil = 0;
      D.timer = D.timerSet;
      D.everStarted = false;
      D.paused = false;
      renderAll();
      U.emit('device:change');
    }

    if (D.stimulating) {
      D.timer -= dt * D.speed;
      if (D.timer <= 0) {
        completeSession();
      } else {
        D.stimAcc += dt;
        const interval = 1 / D.freq;
        let guard = 0;
        while (D.stimAcc >= interval && guard++ < 10) {
          D.stimAcc -= interval;
          fire();
        }
        N.patient.advance(dt * D.speed, circuit());
      }
    } else {
      D.stimAcc = 0;
      N.patient.advance(dt, false);
    }

    // battery drain: roughly 1% per 18 min of operation
    D.battery = Math.max(0, D.battery - dt / 1080);

    // idle auto-shutdown (a running treatment counts as patient interaction)
    if (D.stimulating) D.idle = 0;
    else D.idle += dt;
    if (D.idle > C.session.autoShutdown) {
      D.idle = 0;
      U.toast('Auto shutdown after 10 minutes of inactivity', 'warn');
      powerOff();
      return;
    }

    D.renderAcc += dt;
    if (D.renderAcc >= 0.08) {
      D.renderAcc = 0;
      renderLive();
      U.emit('device:tick');
    }
  }

  function touch() { D.idle = 0; }

  /* ── init ───────────────────────────────────────────── */
  function cache() {
    el.device = U.$('#device');
    el.lcdMain = U.$('#lcdMain');
    el.lcdMenu = U.$('#lcdMenu');
    el.lcdBoot = U.$('#lcdBoot');
    el.lcdCurrent = U.$('#lcdCurrent');
    el.lcdTimer = U.$('#lcdTimer');
    el.lcdPw = U.$('#lcdPw');
    el.lcdHz = U.$('#lcdHz');
    el.lcdMsg = U.$('#lcdMsg');
    el.lcdWave = U.$('#lcdWave');
    el.lcdSpeaker = U.$('#lcdSpeaker');
    el.lcdBattery = U.$('#lcdBattery');
    el.led = U.$('#led');
    el.ledGlow = U.$('#ledGlow');
    el.statusText = U.$('#statusText');
    el.statusDot = U.$('#statusDot');
    el.wheelValue = U.$('#wheelValue');
    el.wheelValueNum = U.$('#wheelValueNum');
  }

  function init() {
    cache();
    const saved = U.store.get('defaults', null);
    if (saved) {
      if (saved.lang) D.lang = saved.lang;
      if (saved.wave) D.wave = saved.wave;
      if (typeof saved.pw === 'number') D.pw = saved.pw;
      if (typeof saved.freq === 'number') D.freq = saved.freq;
      if (typeof saved.timerSet === 'number') { D.timerSet = saved.timerSet; D.timer = saved.timerSet; }
      if (saved.volume) D.volume = saved.volume;
      if (saved.backlight) D.backlight = saved.backlight;
      if (saved.user1) D.user1 = saved.user1;
      if (saved.user2) D.user2 = saved.user2;
    }
    applyLED();
    renderAll();
  }

  function persistDefaults() {
    U.store.set('defaults', {
      lang: D.lang, wave: D.wave, pw: D.pw, freq: D.freq,
      timerSet: D.timerSet, volume: D.volume, backlight: D.backlight,
      user1: D.user1, user2: D.user2
    });
  }

  function resetDefaults() {
    D.lang = 'en';
    D.wave = 'hybrid';
    D.pw = C.session.defaultPulseWidth;
    D.freq = C.session.defaultFrequency;
    D.timerSet = C.session.defaultCountdown;
    D.timer = D.timerSet;
    D.volume = 'medium';
    D.backlight = '5s';
    D.user1 = '';
    D.user2 = '';
    D.current = 0;
    D.actual = null;
    D.stimulating = false;
    D.paused = false;
    D.everStarted = false;
    D.completed = false;
    D.counts = { pw: 0, freq: 0, current: 0 };
    D.menu.open = false;
    D.menu.screen = 'root';
    D.menu.index = 0;
    D.menu.listKey = null;
    D.menu.pending = null;
    if (D.phase === 'menu') D.phase = D.power ? 'main' : 'off';
    persistDefaults();
    log('Factory settings restored');
    renderAll();
    U.emit('device:change');
    return true;
  }

  N.device = {
    state: D,
    init,
    update,
    touch,
    powerOn,
    powerOff,
    togglePower,
    setCable,
    setElectrode,
    setGel,
    setProbe,
    toggleStim,
    resetTimer,
    endSession,
    setCurrent,
    nudgeCurrent,
    togglePulseWidth,
    cycleFrequency,
    openMenu,
    closeMenu,
    menuBack,
    menuNav,
    menuEnter,
    typeChar,
    circuit,
    load,
    renderAll,
    persistDefaults,
    resetDefaults,
    get current() { return D.current; },
    get timer() { return D.timer; }
  };
})(window.NMS);
