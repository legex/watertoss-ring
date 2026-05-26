/* ── AudioManager ──────────────────────────────────────────────────────────
 * Procedural Web Audio API sounds — no external files required.
 * Settings are persisted in localStorage under 'wt_music' / 'wt_sfx'.
 */
const AudioManager = (() => {
  let ctx      = null;
  let bgNodes  = [];    // all nodes belonging to the running bg track
  let bgGain   = null;  // master gain for bg — used for fade
  let seqTimer = null;  // melodic arpeggio scheduler handle

  let musicOn = localStorage.getItem('wt_music') !== 'false';
  let sfxOn   = localStorage.getItem('wt_sfx')   !== 'false';

  // ── Lazy AudioContext ─────────────────────────────────────────
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Background music ──────────────────────────────────────────
  // Aquatic ambient pad: sine drones + slow LFO + pentatonic arpeggio
  const ARP_NOTES = [261.63, 329.63, 392, 493.88, 523.25]; // C4 E4 G4 B4 C5

  function startBg() {
    stopBg();
    if (!musicOn) return;
    const c = ac();

    const master = c.createGain();
    master.gain.setValueAtTime(0, c.currentTime);
    master.gain.linearRampToValueAtTime(0.18, c.currentTime + 2); // fade in
    master.connect(c.destination);
    bgGain = master;
    bgNodes.push(master);

    // Ambient drone — 4 layered sines
    [110, 165, 220, 330].forEach((freq, i) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      const lfo  = c.createOscillator();
      const lg   = c.createGain();

      osc.type  = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.10 / (i * 0.6 + 1);

      lfo.type  = 'sine';
      lfo.frequency.value = 0.06 + i * 0.025;
      lg.gain.value = 0.025;

      lfo.connect(lg);  lg.connect(gain.gain);
      osc.connect(gain); gain.connect(master);
      osc.start(); lfo.start();
      bgNodes.push(osc, lfo, gain, lg);
    });

    // Pentatonic arpeggio — schedules itself recursively
    let step = 0;
    function tick() {
      if (!musicOn) return;
      const c2 = ac();
      const freq = ARP_NOTES[step % ARP_NOTES.length] * (step >= ARP_NOTES.length ? 2 : 1);
      step = (step + 1) % (ARP_NOTES.length * 2);

      const osc  = c2.createOscillator();
      const gain = c2.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, c2.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.9);
      osc.connect(gain); gain.connect(master);
      osc.start(); osc.stop(c2.currentTime + 0.9);

      seqTimer = setTimeout(tick, 480 + Math.random() * 240);
    }
    tick();
  }

  function stopBg() {
    clearTimeout(seqTimer);
    seqTimer = null;
    if (bgGain) {
      try {
        bgGain.gain.setValueAtTime(bgGain.gain.value, ctx.currentTime);
        bgGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      } catch(e) {}
    }
    setTimeout(() => {
      bgNodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(e){} });
      bgNodes = [];
      bgGain  = null;
    }, 600);
  }

  // ── Sound effects ─────────────────────────────────────────────
  function playTap() {
    if (!sfxOn) return;
    const c  = ac();
    const len = Math.floor(c.sampleRate * 0.04);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const src = c.createBufferSource();
    const g   = c.createGain();
    src.buffer = buf;
    g.gain.value = 0.22;
    src.connect(g); g.connect(c.destination);
    src.start();
  }

  function playScore() {
    if (!sfxOn) return;
    const c = ac(), t = c.currentTime;
    [880, 1174.66, 1760].forEach((freq, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type  = 'sine';
      osc.frequency.value = freq;
      const st = t + i * 0.07;
      g.gain.setValueAtTime(0.28, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
      osc.connect(g); g.connect(c.destination);
      osc.start(st); osc.stop(st + 0.3);
    });
  }

  function playLevelComplete() {
    if (!sfxOn) return;
    const c = ac(), t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type  = 'sine';
      osc.frequency.value = freq;
      const st = t + i * 0.13;
      g.gain.setValueAtTime(0.35, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.45);
      osc.connect(g); g.connect(c.destination);
      osc.start(st); osc.stop(st + 0.45);
    });
  }

  function playRetry() {
    if (!sfxOn) return;
    const c = ac(), t = c.currentTime;
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type  = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(330, t + 0.25);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + 0.35);
  }

  function playGameOver() {
    if (!sfxOn) return;
    const c = ac(), t = c.currentTime;
    [392, 349.23, 293.66, 220].forEach((freq, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type  = 'sawtooth';
      osc.frequency.value = freq;
      const st = t + i * 0.18;
      g.gain.setValueAtTime(0.18, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.38);
      osc.connect(g); g.connect(c.destination);
      osc.start(st); osc.stop(st + 0.38);
    });
  }

  // ── Jet bubble sound (continuous while held) ──────────────────
  let jetCount  = 0;
  let jetTimer  = null;

  function _bubblePop() {
    if (!sfxOn) return;
    const c = ac(), t = c.currentTime;
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 + Math.random() * 160, t);
    osc.frequency.exponentialRampToValueAtTime(700 + Math.random() * 300, t + 0.11);
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + 0.13);
  }

  function _scheduleBubble() {
    if (jetCount === 0) return;
    _bubblePop();
    jetTimer = setTimeout(_scheduleBubble, 75 + Math.random() * 55);
  }

  function startJetSound() {
    jetCount++;
    if (jetCount === 1) _scheduleBubble();
  }

  function stopJetSound() {
    jetCount = Math.max(0, jetCount - 1);
    if (jetCount === 0) { clearTimeout(jetTimer); jetTimer = null; }
  }

  // ── Settings ──────────────────────────────────────────────────
  function setMusic(on) {
    musicOn = on;
    localStorage.setItem('wt_music', on);
    on ? startBg() : stopBg();
  }

  function setSfx(on) {
    sfxOn = on;
    localStorage.setItem('wt_sfx', on);
  }

  function isMusicOn() { return musicOn; }
  function isSfxOn()   { return sfxOn; }

  // Pause/resume bg when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    document.hidden ? ctx.suspend() : (musicOn && ctx.resume());
  });

  return { startBg, stopBg, playTap, playScore, playLevelComplete, playRetry, playGameOver, startJetSound, stopJetSound, setMusic, setSfx, isMusicOn, isSfxOn };
})();
