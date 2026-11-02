/* ============================================================
   guide.js — Reference content (device, screens, menus,
   treatment workflow, nerve protocols, troubleshooting, safety)
   ============================================================ */
window.NMS = window.NMS || {};

(function (N) {
  'use strict';
  const U = N.util;

  const SECTIONS = [
    /* ─────────────────────────── DEVICE ─────────────────────────── */
    {
      id: 'layout',
      group: 'The device',
      nav: 'Device layout',
      title: 'Device layout',
      lede: 'The NMS 460 is a hand-held peripheral nerve stimulator. Every control you need during a treatment is on the front face — the screen, two buttons, the wheel and the power button.',
      html: `
        <div class="screenmap">
          <figure>
            <div class="mock" style="aspect-ratio:4/5;align-items:center;justify-content:flex-start;gap:7px;padding:12px">
              <div class="box" style="width:100%;padding:14px 4px">LCD</div>
              <div style="display:flex;gap:16px;margin-top:2px">
                <div style="width:26px;height:26px;border-radius:50%;background:#6b1c50"></div>
                <div style="width:26px;height:26px;border-radius:50%;background:#6b1c50"></div>
              </div>
              <div style="width:52px;height:52px;border-radius:50%;background:#9aa0a2;border:3px solid #6f7577;display:grid;place-items:center;margin-top:2px">
                <div style="width:16px;height:16px;border-radius:50%;background:#c2c7c8"></div>
              </div>
              <div style="width:24px;height:24px;border-radius:50%;background:#6b1c50;margin-top:4px"></div>
            </div>
            <figcaption>Front face, top to bottom: screen, Menu and Enter buttons, adjustment wheel with centre play/pause, power.</figcaption>
          </figure>
        </div>

        <h3>Controls at a glance</h3>
        <table>
          <thead><tr><th>Control</th><th>What it does</th></tr></thead>
          <tbody>
            <tr><td>Power button</td><td>Press and hold to switch on or off. The device starts in under five seconds.</td></tr>
            <tr><td>Menu / Pulse Width</td><td>Short press toggles 0.1&nbsp;ms ↔ 0.2&nbsp;ms. Press and hold (about one second) opens the Setup Menu.</td></tr>
            <tr><td>Enter / Hz</td><td>Short press cycles 1 → 2 → 5 → 10&nbsp;Hz. In a menu it selects the highlighted item.</td></tr>
            <tr><td>Wheel</td><td>Turn clockwise / anticlockwise to raise or lower current in 1&nbsp;mA steps. In a menu it moves the highlight.</td></tr>
            <tr><td>Play / pause (wheel centre)</td><td>Starts or pauses stimulation and the countdown. Hold for more than two seconds to reset the timer.</td></tr>
            <tr><td>Treatment cable socket</td><td>At the top edge. The device will not stimulate until the cable is inserted.</td></tr>
            <tr><td>LED</td><td>Flashes green for every delivered stimulus, red when the circuit is open.</td></tr>
          </tbody>
        </table>

        <div class="callout callout--mint">
          <div><b>Trainer tip</b>Use a light touch on the wheel. On the real unit it is a rotary encoder, not a touch surface — it clicks through detents. In this simulator you can drag around the ring, or tap the top / right half to step up and the bottom / left half to step down.</div>
        </div>

        <h3>What is in the box</h3>
        <ul class="bullets">
          <li>NMS 460 stimulator (4 × AAA batteries).</li>
          <li>Treatment cable with a probe and an ECG-style electrode clip.</li>
          <li>Reference / grounding electrodes and conductive gel.</li>
          <li>Quick Start Guide and Instructions for Use.</li>
        </ul>
      `
    },
    {
      id: 'screen',
      group: 'The device',
      nav: 'Reading the screen',
      title: 'Reading the screen',
      lede: 'The monochrome LCD shows only what matters during a treatment: the current setting, the countdown, the actual delivered current and any warning. The icons down the right edge tell you the waveform, speaker and battery state.',
      html: `
        <div class="screenmap">
          <figure>
            <div class="mock">
              <div class="row"><span class="big">12</span><span class="big">09:58</span></div>
              <div class="box">~11.86mA</div>
              <div class="row"><span class="chip">0.1ms</span><span class="chip">2Hz</span></div>
            </div>
            <figcaption>Stimulating: set current 12&nbsp;mA, 9:58 left, actual delivered ~11.86&nbsp;mA.</figcaption>
          </figure>
          <figure>
            <div class="mock">
              <div class="row"><span class="big">0</span><span class="big">10:00</span></div>
              <div class="box">INSERT CABLE</div>
              <div class="row"><span class="chip">0.1ms</span><span class="chip">2Hz</span></div>
            </div>
            <figcaption>First prompt after power-on: the cable is not inserted.</figcaption>
          </figure>
          <figure>
            <div class="mock">
              <div class="row"><span class="big">15</span><span class="big">04:12</span></div>
              <div class="box">OPEN CIRCUIT DETECTED</div>
              <div class="row"><span class="chip">0.1ms</span><span class="chip">2Hz</span></div>
            </div>
            <figcaption>Open circuit: probe or reference electrode is not completing the circuit.</figcaption>
          </figure>
          <figure>
            <div class="mock">
              <div class="row"><span class="big">18</span><span class="big">07:30</span></div>
              <div class="box">PAUSE</div>
              <div class="row"><span class="chip">0.2ms</span><span class="chip">5Hz</span></div>
            </div>
            <figcaption>Paused: stimulation and the countdown are stopped until play is pressed again.</figcaption>
          </figure>
        </div>

        <h3>Screen regions</h3>
        <table>
          <thead><tr><th>Region</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>Large number, left</td><td>Current setting in mA (0–30). Adjust with the wheel.</td></tr>
            <tr><td>Large number, right</td><td>Countdown timer. Default 10:00; resets when it reaches 00:00.</td></tr>
            <tr><td>Boxed message</td><td>Actual delivered current while stimulating, or a warning screen. A warning triangle appears if measured current differs from the setting by more than 10%.</td></tr>
            <tr><td>0.1ms / 0.2ms chip</td><td>Pulse width. 0.2&nbsp;ms delivers twice the charge of 0.1&nbsp;ms at the same current.</td></tr>
            <tr><td>1Hz / 2Hz / 5Hz / 10Hz chip</td><td>Stimulating frequency.</td></tr>
            <tr><td>Right-edge icons</td><td>Waveform (Hybrid RF or square), speaker volume, battery state.</td></tr>
          </tbody>
        </table>

        <div class="callout">
          <div><b>Actual vs set current</b>While stimulating, the boxed value is the <strong>measured average current</strong>. If it differs from your setting by more than 10%, the circuit impedance is above 13&nbsp;kΩ — usually a lifted reference electrode, dry skin or too little gel. The device reduces the delivered current rather than forcing it through a poor connection.</div>
        </div>
      `
    },
    {
      id: 'menus',
      group: 'The device',
      nav: 'Setup menu map',
      title: 'Setup menu map',
      lede: 'Press and hold Menu / Pulse Width to open the Setup Menu. Turn the wheel to move the highlight, press Enter to select. Every list ends with EXIT MENU; a confirmation screen asks you to accept YES or NO before a setting is saved.',
      html: `
        <div class="menutree"><b>SETUP MENU</b>
├─ LANGUAGE            <i>English · Français · Italiano · Nederlands · Español</i>
├─ STIMULATION MODE     <i>Hybrid RF · Square Wave</i>
├─ PULSE WIDTH          <i>0.1 ms · 0.2 ms</i>
├─ FREQUENCY            <i>1 Hz · 2 Hz · 5 Hz · 10 Hz</i>
├─ COUNTDOWN TIMER      <i>00:01 – 59:59, default 10:00</i>
├─ SPEAKER VOLUME       <i>Off · Low · Medium · High</i>
├─ BACKLIGHT            <i>Off · 5 sec · 60 sec · Always on</i>
├─ USER INFORMATION     <i>two lines × 20 characters</i>
└─ EXIT MENU</div>

        <h3>How each screen behaves</h3>
        <table>
          <thead><tr><th>Screen</th><th>Interaction</th></tr></thead>
          <tbody>
            <tr><td>List screen</td><td>Wheel moves the radio highlight. Enter selects the value and opens the confirmation screen. Scroll to EXIT MENU and press Enter to leave.</td></tr>
            <tr><td>Confirmation</td><td><em>YOU HAVE SELECTED</em> shows the new value. Wheel toggles YES / NO, Enter accepts. YES saves and returns to the Setup Menu; NO returns to the previous screen.</td></tr>
            <tr><td>Countdown timer</td><td>Minutes are highlighted first: turn the wheel, press Enter to move to seconds, turn again, Enter to confirm.</td></tr>
            <tr><td>User information</td><td>Turn the wheel through the character set, Enter inserts the character. A space character moves to the next position; the device shows the characters left. Two lines of 20 characters are shown briefly at power-on.</td></tr>
          </tbody>
        </table>

        <div class="callout callout--mint">
          <div><b>Default settings</b>Language English · Hybrid RF · 0.1&nbsp;ms · 2&nbsp;Hz · 10:00 countdown · Medium volume · 5-second backlight. Backlight <em>Always on</em> drastically shortens battery life.</div>
        </div>
      `
    },

    /* ────────────────────────── TREATMENT ───────────────────────── */
    {
      id: 'workflow',
      group: 'Treatment',
      nav: 'Treatment workflow',
      title: 'Treatment workflow',
      lede: 'The order matters: prepare the circuit, confirm the settings, start stimulation, then find the nerve and settle at a therapeutic intensity the patient can tolerate.',
      html: `
        <ol class="steps">
          <li>
            <h3>Place the reference electrode</h3>
            <p>Stick the grounding pad <strong>contralaterally</strong> — on the opposite side of the body from the treatment area. Connect the electrode clip from the treatment cable to the pad.</p>
          </li>
          <li>
            <h3>Apply conductive gel</h3>
            <p>Apply a fair amount of gel to the treatment area. Dry skin can push impedance above 13&nbsp;kΩ, which triggers the mismatch warning and reduces delivered current.</p>
          </li>
          <li>
            <h3>Place the probe</h3>
            <p>Place the treatment probe on the skin over the target nerve. Probe plus reference electrode now form a closed circuit.</p>
          </li>
          <li>
            <h3>Confirm settings</h3>
            <p>Start at <strong>0.1&nbsp;ms</strong> and <strong>2&nbsp;Hz</strong>. Check the countdown is the intended treatment time. Use the Setup Menu if you need to change defaults.</p>
          </li>
          <li>
            <h3>Start stimulation</h3>
            <p>Press play/pause. The countdown starts. If the circuit is open, the LED flashes red and the screen shows <em>OPEN CIRCUIT DETECTED</em>.</p>
          </li>
          <li>
            <h3>Locate the nerve</h3>
            <p>Increase current slowly from 0&nbsp;mA. Watch for the characteristic motor response (fasciculation) at the treatment site. Note the current at which it first appears.</p>
          </li>
          <li>
            <h3>Settle at a therapeutic level</h3>
            <p>Continue to a strong-but-tolerated intensity. In this trainer, aim for the green <strong>therapeutic band (40–59)</strong> on the comfort meter. On a real patient, titrate to their reported comfort and your protocol.</p>
          </li>
          <li>
            <h3>Hold and monitor</h3>
            <p>Keep the probe still for the treatment duration. Re-check the site, comfort and delivered current. If comfort climbs as the nerve accommodates, increase by 1–2&nbsp;mA.</p>
          </li>
          <li>
            <h3>Finish</h3>
            <p>Press play/pause to stop, or let the countdown reach 00:00 — stimulation stops, an alarm sounds and the timer resets. Remove the probe, then the electrode, and clean the skin.</p>
          </li>
        </ol>

        <div class="callout">
          <div><b>The 0.2 ms rule</b>If you reach 30&nbsp;mA at 0.1&nbsp;ms, switch to 0.2&nbsp;ms and turn the current down to 15&nbsp;mA, then titrate again. Charge per pulse is current × pulse width, so 30&nbsp;mA × 0.1&nbsp;ms ≈ 15&nbsp;mA × 0.2&nbsp;ms. You gain headroom without increasing charge.</div>
        </div>

        <h3>Pulse width and charge</h3>
        <table>
          <thead><tr><th>Setting</th><th>Relative charge</th><th>When to use</th></tr></thead>
          <tbody>
            <tr><td>0.1 ms</td><td>1×</td><td>Default starting width. Finer control at low currents.</td></tr>
            <tr><td>0.2 ms</td><td>2×</td><td>When more charge is needed at a lower current, or when 30&nbsp;mA at 0.1&nbsp;ms is reached.</td></tr>
          </tbody>
        </table>
      `
    },
    {
      id: 'nerves',
      group: 'Treatment',
      nav: 'Nerve locations',
      title: 'Nerve locations & motor responses',
      lede: 'Use the motor response to confirm you are on the intended nerve, not just near it. The responses below are the ones described in the NMS 460 treatment playbook.',
      html: `
        <div class="nerves">
          <div class="nerve">
            <h4>Median nerve</h4>
            <div class="row"><b>Site</b><span>Anterior wrist</span></div>
            <div class="row"><b>Response</b><span>All fingers curl toward the palm; hand flexes toward the centre of the palm.</span></div>
            <div class="row"><b>Tip</b><span>Midline between the palmaris longus and flexor carpi radialis tendons.</span></div>
          </div>
          <div class="nerve">
            <h4>Ulnar nerve</h4>
            <div class="row"><b>Site</b><span>Anterior medial wrist</span></div>
            <div class="row"><b>Response</b><span>Fingers curl toward the palm; hand flexes toward the little finger.</span></div>
            <div class="row"><b>Tip</b><span>Radial side of the flexor carpi ulnaris tendon.</span></div>
          </div>
          <div class="nerve">
            <h4>Radial nerve</h4>
            <div class="row"><b>Site</b><span>Posterior lateral wrist</span></div>
            <div class="row"><b>Response</b><span>Fingers curl toward the palm; hand flexes up toward the thumb.</span></div>
            <div class="row"><b>Tip</b><span>Anatomical snuffbox region; keep current low.</span></div>
          </div>
          <div class="nerve">
            <h4>Brachial plexus</h4>
            <div class="row"><b>Site</b><span>Interscalene groove of the neck</span></div>
            <div class="row"><b>Response</b><span>Biceps and shoulder flex; the whole arm follows.</span></div>
            <div class="row"><b>Tip</b><span>Advanced site — only with appropriate training and supervision.</span></div>
          </div>
          <div class="nerve">
            <h4>Sciatic nerve</h4>
            <div class="row"><b>Site</b><span>Gluteal fold</span></div>
            <div class="row"><b>Response</b><span>Plantar flexion of the foot (foot twitches downward).</span></div>
            <div class="row"><b>Tip</b><span>Deep nerve — response may need more current; increase slowly.</span></div>
          </div>
          <div class="nerve">
            <h4>Lateral femoral cutaneous</h4>
            <div class="row"><b>Site</b><span>Anterior pelvis, inguinal groove</span></div>
            <div class="row"><b>Response</b><span>Sensory response in the thigh (tingling), little or no motor twitch.</span></div>
            <div class="row"><b>Tip</b><span>Purely sensory — rely on the patient's report, not fasciculation.</span></div>
          </div>
          <div class="nerve">
            <h4>Common peroneal nerve</h4>
            <div class="row"><b>Site</b><span>Inferior fibular head (lateral knee)</span></div>
            <div class="row"><b>Response</b><span>Eversion of the foot (foot twitches outward).</span></div>
            <div class="row"><b>Tip</b><span>Superficial at the fibular head — start at low current.</span></div>
          </div>
          <div class="nerve">
            <h4>Tibial nerve</h4>
            <div class="row"><b>Site</b><span>Medial ankle</span></div>
            <div class="row"><b>Response</b><span>Plantar flexion of the foot (foot twitches downward).</span></div>
            <div class="row"><b>Tip</b><span>Posterior to the medial malleolus.</span></div>
          </div>
        </div>

        <div class="callout">
          <div><b>Not a protocol</b>These are landmark and response reminders for practice. Current thresholds, treatment duration and site selection must follow your local protocol, the current IFU and the patient's presentation. Never stimulate over the neck, head, chest, open wounds or areas of impaired sensation.</div>
        </div>
      `
    },

    /* ────────────────────────── REFERENCE ───────────────────────── */
    {
      id: 'troubleshooting',
      group: 'Reference',
      nav: 'Warnings & troubleshooting',
      title: 'Warnings & troubleshooting',
      lede: 'Most problems during a treatment are circuit problems, not device failures. Read the warning, check the patient end of the circuit first, then the cable and device.',
      html: `
        <h3>Warning screens</h3>
        <table>
          <thead><tr><th>Screen</th><th>Meaning</th><th>What to do</th></tr></thead>
          <tbody>
            <tr><td>INSERT CABLE</td><td>No treatment cable detected.</td><td>Insert the correct NMS 460 cable fully into the top socket. If it persists, try another cable.</td></tr>
            <tr><td>OPEN CIRCUIT DETECTED</td><td>Probe and reference electrode do not form a closed circuit.</td><td>Check the electrode is adhered and the clip is attached; re-gel and reposition the probe. The LED flashes red with each attempt.</td></tr>
            <tr><td>PAUSE</td><td>Play/pause was pressed.</td><td>Press play/pause again to resume. Hold it for more than two seconds to reset the timer.</td></tr>
            <tr><td>CABLE NOT RECOGNISED</td><td>The inserted cable is not compatible.</td><td>Use only the supplied NMS 460 treatment cable.</td></tr>
            <tr><td>REPLACE BATTERIES</td><td>Battery depleted beyond a reliable level.</td><td>Replace with 4 × AAA alkaline batteries. The warning flashes for about four seconds before the device switches off.</td></tr>
            <tr><td>Warning triangle beside actual current</td><td>Measured current differs from the setting by more than 10% (impedance above 13&nbsp;kΩ).</td><td>Improve the circuit: re-seat the electrode, add gel, reduce current and re-check. Do not keep increasing current to compensate.</td></tr>
          </tbody>
        </table>

        <h3>If something does not work</h3>
        <table>
          <thead><tr><th>Problem</th><th>Checks</th></tr></thead>
          <tbody>
            <tr><td>Blank screen on power-on</td><td>Batteries flat or inserted the wrong way. Replace all four. If still blank, contact your representative.</td></tr>
            <tr><td>Device will not switch on</td><td>Hold the power button for about one second — a quick tap is not enough. Check the battery contacts.</td></tr>
            <tr><td>No stimulation, LED flashes red</td><td>Open circuit: electrode lifted, clip detached, probe off skin, or insufficient gel. Rebuild the circuit.</td></tr>
            <tr><td>Current display lower than setting</td><td>High impedance. Re-gel, press the electrode down, move the probe to a better site. If it persists, stop and check the cable.</td></tr>
            <tr><td>Garbled display</td><td>Electromagnetic interference. Move away from high-frequency surgical or shortwave equipment and restart the device.</td></tr>
            <tr><td>Keypad unresponsive</td><td>If the keypad is visibly damaged, do not use the device. Otherwise restart; if it persists, contact your representative.</td></tr>
            <tr><td>Device switches off by itself</td><td>10-minute auto-shutdown after no interaction, or depleted batteries. A running treatment should not auto-shutdown.</td></tr>
          </tbody>
        </table>
      `
    },
    {
      id: 'safety',
      group: 'Reference',
      nav: 'Safety & specifications',
      title: 'Safety & specifications',
      lede: 'The NMS 460 is a Class IIa, Type BF device. These are the safety points that matter most in day-to-day use, followed by the published technical specifications.',
      html: `
        <div class="callout">
          <div><b>Contraindications</b>Do not use on patients with a cardiac pacemaker, implanted defibrillator or other implanted metallic/electronic device. Do not use where pain is undiagnosed or in patients with known neurological disorders. Do not apply stimulation across the head, directly on the eyes, over the front of the neck (especially the carotid sinus), over the chest/heart, over open wounds, rashes, infected or inflamed skin, or over cancerous lesions. Do not use while the patient is bathing, sleeping, or driving/operating machinery.</div>
        </div>

        <h3>Everyday safety</h3>
        <ul class="bullets">
          <li>Read the full Instructions for Use before treating with a real device.</li>
          <li>Use only the cables and accessories supplied by the manufacturer.</li>
          <li>Place the reference electrode contralaterally, away from the treatment area.</li>
          <li>Keep cables away from the patient's skin and from other equipment leads.</li>
          <li>Do not remove electrodes while stimulation is being applied.</li>
          <li>Do not use near high-frequency surgical equipment, shortwave/microwave therapy equipment, or other strong electromagnetic sources.</li>
          <li>Check the skin before and after treatment; stop if the patient reports irritation, burning or unusual discomfort.</li>
          <li>Use caution with impaired skin sensation, bleeding tendency, recent surgery, epilepsy and pregnancy. The safety of stimulation during pregnancy has not been established.</li>
        </ul>

        <h3>Specifications</h3>
        <div class="specs">
          <div class="spec"><span>Current range</span><strong>0 – 30 mA, 1 mA steps</strong></div>
          <div class="spec"><span>Accuracy</span><strong>± 5%</strong></div>
          <div class="spec"><span>Pulse widths</span><strong>0.1 ms / 0.2 ms</strong></div>
          <div class="spec"><span>Frequency</span><strong>1 / 2 / 5 / 10 Hz ± 5%</strong></div>
          <div class="spec"><span>Waveform</span><strong>Monophasic square / Hybrid RF</strong></div>
          <div class="spec"><span>Maximum voltage</span><strong>220 V</strong></div>
          <div class="spec"><span>Load impedance</span><strong>0 – 5 kΩ</strong></div>
          <div class="spec"><span>Classification</span><strong>Class IIa, Type BF</strong></div>
          <div class="spec"><span>Power</span><strong>4 × AAA alkaline</strong></div>
          <div class="spec"><span>Consumption</span><strong>17 mA</strong></div>
          <div class="spec"><span>Weight</span><strong>130 g</strong></div>
          <div class="spec"><span>Dimensions</span><strong>145 × 90 × 30 mm</strong></div>
          <div class="spec"><span>Operating temp.</span><strong>10 – 40 °C</strong></div>
          <div class="spec"><span>Storage temp.</span><strong>0 – 50 °C</strong></div>
        </div>

        <h3>Cleaning</h3>
        <p>Wipe the housing with a soft cloth dampened with a mild detergent or a compatible disinfectant. Do not immerse the device, autoclave it, or allow liquid into the battery compartment or cable socket. The enclosure must not be opened — opening it voids the warranty.</p>

        <h3>Performance test</h3>
        <p>Before clinical use, the IFU describes a performance test: insert the batteries, switch on, short-circuit the probe and ECG connector, and confirm the LED flashes green with an audible beep at the set frequency. Increase to 20&nbsp;mA and confirm the displayed waveform is square and reaches the dotted current line. Then remove the short and confirm the LED flashes red with no audible feedback and the open-circuit screen appears.</p>

        <div class="callout callout--mint">
          <div><b>About this simulator</b>This is an educational model, not a medical device. The comfort meter and fasciculation response are simulated. Nothing here replaces the current IFU, your training, or your local protocols.</div>
        </div>
      `
    }
  ];

  const el = {};
  let current = 'layout';

  function groups() {
    const out = [];
    SECTIONS.forEach(s => {
      let g = out.find(x => x.name === s.group);
      if (!g) { g = { name: s.group, items: [] }; out.push(g); }
      g.items.push(s);
    });
    return out;
  }

  function renderNav() {
    el.nav.innerHTML = groups().map(g =>
      '<div class="navgroup">' + U.esc(g.name) + '</div>' +
      g.items.map(s =>
        '<button data-guide="' + s.id + '"' + (s.id === current ? ' class="is-active"' : '') + '>' +
        U.esc(s.nav) + '</button>'
      ).join('')
    ).join('');

    U.$$('[data-guide]', el.nav).forEach(b => {
      b.addEventListener('click', () => show(b.dataset.guide));
    });
  }

  function renderBody() {
    el.body.innerHTML = SECTIONS.map(s =>
      '<section class="guide__section" data-gsection="' + s.id + '"' + (s.id === current ? '' : ' hidden') + '>' +
        '<h1>' + U.esc(s.title) + '</h1>' +
        '<p class="lede">' + s.lede + '</p>' +
        s.html +
      '</section>'
    ).join('');
  }

  function show(id) {
    if (!SECTIONS.some(s => s.id === id)) id = SECTIONS[0].id;
    current = id;
    renderNav();
    U.$$('[data-gsection]', el.body).forEach(sec => {
      sec.hidden = sec.dataset.gsection !== id;
    });
    if (window.matchMedia('(max-width: 899px)').matches) {
      el.nav.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function init() {
    el.nav = U.$('#guideNav');
    el.body = U.$('#guideBody');
    if (!el.nav || !el.body) return;

    const hash = (location.hash || '').replace(/^#\/?/, '');
    if (SECTIONS.some(s => s.id === hash)) current = hash;

    renderNav();
    renderBody();
    show(current);
  }

  N.guide = {
    init,
    show,
    sections: SECTIONS,
    get current() { return current; }
  };
})(window.NMS);
