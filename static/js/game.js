/* ─────────────────────────────────────────────────────────────
   Waterful Ring Toss — Game Engine
   ───────────────────────────────────────────────────────────── */

const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');

// ── Constants ──────────────────────────────────────────────────
const W = canvas.width  = 480;
const H = canvas.height = 620;

const RING_RADIUS      = 20;
const RING_THICKNESS   = 5;
const PEG_RADIUS       = 12;
const RING_SPAWN_Y_MIN = 0.70;  // rings start near bottom
const RING_SPAWN_Y_MAX = 0.90;
const GRAVITY          = 0.10;  // downward pull
const BUOYANCY         = 0.075; // net 0.025 downward → rings slowly sink without jets
const JET_UP_FORCE     = 0.55;  // upward column force when jet active
const WALL_JET_FORCE   = 0.32;  // horizontal push from side-wall jets
const WATER_TOP        = H * 0.12;
const WATER_BOT        = H * 0.96;
const DAMPING          = 0.95;  // water resistance per frame

// Colour palette for restricted rings + display names
const RING_COLORS = ['#f5c518','#ef4444','#22c55e','#a855f7','#f97316','#ec4899','#06b6d4','#84cc16'];
const COLOR_NAMES = ['YELLOW',  'RED',    'GREEN',  'PURPLE', 'ORANGE', 'PINK',   'CYAN',   'LIME'];
const FREE_RING_COLOR = '#b8cfe0'; // pale silver-blue for free/unrestricted rings

// ── Visual theme per 5-level band ─────────────────────────────
const THEMES = [
  { // 0 — Ocean (levels 1-5) — classic blue-teal
    name:'ocean',
    frame:['rgba(248,150,0,0.88)','rgba(220,70,0,0.72)','rgba(248,130,0,0.88)'],
    fShadow:'rgba(249,115,22,0.65)',
    bg:['#000d1a','#001428','#000810'],
    w:['rgba(0,190,240,0.45)','rgba(0,140,200,0.50)','rgba(0,90,160,0.58)','rgba(0,50,110,0.78)'],
    caus:'#80dfff', surf:'rgba(140,225,255,0.70)',
    sh:['rgba(160,240,255,0.13)','rgba(140,230,255,0.04)'],
    floor:['rgba(195,155,55,0)','rgba(195,155,55,0.16)','rgba(175,135,45,0.42)'],
    spark:['#ffd60a','#5ee7ff','#ffffff'],
  },
  { // 1 — Coral Reef (levels 6-10) — vivid EMERALD GREEN water
    name:'reef',
    frame:['rgba(255,80,120,0.88)','rgba(200,40,80,0.72)','rgba(255,80,120,0.88)'],
    fShadow:'rgba(255,80,140,0.65)',
    bg:['#001a0e','#00280f','#000e06'],
    w:['rgba(0,210,140,0.48)','rgba(0,180,110,0.53)','rgba(0,140,80,0.60)','rgba(0,90,50,0.80)'],
    caus:'#80ffcc', surf:'rgba(120,255,200,0.70)',
    sh:['rgba(160,255,210,0.13)','rgba(140,255,190,0.04)'],
    floor:['rgba(240,100,60,0)','rgba(220,80,40,0.18)','rgba(200,60,30,0.42)'],
    spark:['#ff6b8a','#00ffcc','#ffdd55'],
  },
  { // 2 — Sunset Lagoon (levels 11-15) — warm AMBER/ROSE water
    name:'sunset',
    frame:['rgba(200,40,240,0.88)','rgba(150,10,200,0.72)','rgba(220,60,255,0.88)'],
    fShadow:'rgba(200,40,240,0.60)',
    bg:['#1c0a10','#2a0c18','#140608'],
    w:['rgba(255,110,20,0.48)','rgba(240,70,30,0.54)','rgba(200,40,60,0.62)','rgba(130,10,40,0.82)'],
    caus:'#ffaa55', surf:'rgba(255,180,90,0.65)',
    sh:['rgba(255,180,80,0.16)','rgba(255,150,60,0.05)'],
    floor:['rgba(180,80,20,0)','rgba(160,60,10,0.18)','rgba(140,40,5,0.42)'],
    spark:['#ff6b35','#ff9f45','#ffd60a'],
  },
  { // 3 — Deep Sea (levels 16-20) — near-BLACK with cyan glow
    name:'deep',
    frame:['rgba(0,220,200,0.78)','rgba(0,160,160,0.62)','rgba(0,220,200,0.78)'],
    fShadow:'rgba(0,220,200,0.65)',
    bg:['#000005','#02020f','#000002'],
    w:['rgba(0,50,90,0.65)','rgba(0,30,70,0.72)','rgba(0,15,45,0.80)','rgba(0,5,20,0.92)'],
    caus:'#00ffee', surf:'rgba(0,200,180,0.45)',
    sh:['rgba(0,255,220,0.06)','rgba(0,200,180,0.02)'],
    floor:['rgba(20,5,30,0)','rgba(20,5,30,0.25)','rgba(10,2,20,0.58)'],
    spark:['#00ffee','#00ccff','#55ffaa'],
  },
  { // 4 — Arctic (levels 21-25) — bright ICY BLUE/WHITE water
    name:'arctic',
    frame:['rgba(200,240,255,0.88)','rgba(150,210,250,0.72)','rgba(220,248,255,0.88)'],
    fShadow:'rgba(200,240,255,0.65)',
    bg:['#061828','#0a2840','#041020'],
    w:['rgba(200,238,255,0.55)','rgba(165,215,250,0.58)','rgba(120,185,235,0.65)','rgba(70,140,200,0.82)'],
    caus:'#dff4ff', surf:'rgba(225,248,255,0.75)',
    sh:['rgba(230,248,255,0.18)','rgba(215,240,255,0.06)'],
    floor:['rgba(205,235,255,0)','rgba(185,225,255,0.20)','rgba(165,215,250,0.50)'],
    spark:['#ffffff','#b0e0ff','#e0f8ff'],
  },
  { // 5 — Space (levels 26-30) — deep COSMIC PURPLE water
    name:'space',
    frame:['rgba(210,150,255,0.88)','rgba(160,80,230,0.72)','rgba(230,160,255,0.88)'],
    fShadow:'rgba(190,100,255,0.70)',
    bg:['#050008','#0a0018','#030005'],
    w:['rgba(90,0,160,0.62)','rgba(60,0,130,0.68)','rgba(30,0,90,0.76)','rgba(8,0,35,0.92)'],
    caus:'#dd88ff', surf:'rgba(190,90,255,0.50)',
    sh:['rgba(210,140,255,0.10)','rgba(170,80,230,0.03)'],
    floor:['rgba(40,0,60,0)','rgba(35,0,55,0.22)','rgba(25,0,45,0.52)'],
    spark:['#ffffff','#dd88ff','#ffd700'],
  },
];

// Jet bubble colours per theme (lift = upward jets, wall = side jets)
const THEME_JET_COLORS = {
  ocean:  { lift: '#5ee7ff', wall: '#f97316' },
  reef:   { lift: '#00ffcc', wall: '#ff6088' },
  sunset: { lift: '#ffaa55', wall: '#cc44ff' },
  deep:   { lift: '#00ffee', wall: '#00ddcc' },
  arctic: { lift: '#dff4ff', wall: '#88ccff' },
  space:  { lift: '#dd88ff', wall: '#ffd700' },
};

// ── State ──────────────────────────────────────────────────────
let state = 'idle'; // idle | playing | paused | levelEnd | gameOver | complete
let level = 1;
let cfg   = {};
let rings = [];
let pegs  = [];
let particles = [];
let waterParticles = [];
let totalScore    = 0;
let levelScore    = 0;
let ringsScored   = 0;
let timeLeft      = 60;
let timerInterval = null;
let pressLeft      = false;
let pressRight     = false;
let pressWallLeft  = false;  // side-wall jet: push rings leftward
let pressWallRight = false;  // side-wall jet: push rings rightward
let levelConfigs  = {};
let animFrame     = null;
let lastTimestamp = 0;
let playerName    = '';
let pegPhase      = 0; // for oscillating peg movement

function getThemeIdx() {
  return Math.min(5, Math.floor((level - 1) / 25));
}

// ── Fetch level configs ────────────────────────────────────────
async function loadLevels() {
  try {
    const res = await fetch('/api/levels');
    const data = await res.json();
    levelConfigs = data.levels;
  } catch (e) {
    console.error('Failed to load levels', e);
  }
}

// ── Initialise a level ─────────────────────────────────────────
function initLevel(lvl) {
  level    = lvl;
  cfg      = levelConfigs[String(lvl)] || levelConfigs['1'];
  document.body.dataset.theme = THEMES[getThemeIdx()].name;
  rings    = [];
  pegs     = [];
  particles = [];
  ringsScored = 0;
  levelScore  = 0;
  timeLeft    = cfg.time;
  pegPhase    = 0;

  // ── Create pegs ────────────────────────────────────────────────
  const pegCount       = cfg.pegs;
  const restrictedCount = Math.min(cfg.restricted_pegs || 0, pegCount);
  const cpp            = cfg.colors_per_peg || 1;
  const margin  = 60;
  const spacing = (W - margin * 2) / (pegCount - 1 || 1);
  const pegYBase = H * 0.28;

  for (let i = 0; i < pegCount; i++) {
    // acceptedColors: empty = any ring welcome; populated = strict matching
    const acceptedColors = [];
    if (i < restrictedCount) {
      for (let c = 0; c < cpp; c++) {
        acceptedColors.push(RING_COLORS[(i * cpp + c) % RING_COLORS.length]);
      }
    }
    pegs.push({
      x:              margin + i * spacing,
      y:              pegYBase + (i % 2 === 0 ? -20 : 20),
      baseX:          margin + i * spacing,
      baseY:          pegYBase + (i % 2 === 0 ? -20 : 20),
      phase:          (Math.PI * 2 / pegCount) * i,
      ringCount:      0,      // how many rings have landed here (replaces scored bool)
      wobble:         0,
      rejectFlash:    0,
      acceptedColors,
    });
  }

  // ── Create rings ──────────────────────────────────────────────
  // Rings that map to restricted pegs get that peg's specific color.
  // Rings mapping to free pegs get the FREE_RING_COLOR (any peg accepts them).
  for (let i = 0; i < cfg.rings; i++) {
    const pegIdx = i % pegCount;
    if (pegIdx < restrictedCount) {
      // For cpp=2 alternate between the two accepted colors each pass
      const colorSlot = cpp === 2 ? Math.floor(i / pegCount) % 2 : 0;
      spawnRing(i, pegs[pegIdx].acceptedColors[colorSlot], false);
    } else {
      spawnRing(i, FREE_RING_COLOR, true);
    }
  }

  updateUI();
  startTimer();
}

function spawnRing(idx, color, isFree) {
  const x = 60 + Math.random() * (W - 120);
  const y = H * RING_SPAWN_Y_MIN + Math.random() * (H * (RING_SPAWN_Y_MAX - RING_SPAWN_Y_MIN));
  rings.push({
    id:          idx,
    x, y,
    vx:          (Math.random() - 0.5) * 0.8,
    vy:          0,
    color:       color || RING_COLORS[idx % RING_COLORS.length],
    isFree:      isFree || false,   // free rings bypass color-match check
    onPeg:       -1,
    angle:       Math.random() * Math.PI * 2,
    landed:      false,
    rejectFlash: 0,
    stackOffset: 0,                 // vertical offset when stacked on a peg
  });
}

// ── Timer ──────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (state !== 'playing') return;
    timeLeft -= 0.25;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endLevel(false);
    }
    updateTimerBar();
  }, 250);
}

// ── Physics tick ───────────────────────────────────────────────
function tick(ts) {
  const dt = Math.min((ts - lastTimestamp) / 16.67, 3); // normalise to ~60fps
  lastTimestamp = ts;

  if (state !== 'playing') {
    animFrame = requestAnimationFrame(tick);
    render();
    return;
  }

  pegPhase += 0.015 * dt;

  // Decay reject-flash counters
  pegs.forEach(p  => { if (p.rejectFlash  > 0) p.rejectFlash  -= dt; });
  rings.forEach(r => { if (r.rejectFlash  > 0) r.rejectFlash  -= dt; });

  // Move pegs if level has moving pegs
  if (cfg.peg_moving) {
    pegs.forEach((peg, i) => {
      peg.x = peg.baseX + Math.sin(pegPhase + peg.phase) * 32;
      peg.wobble *= 0.9;
    });
  }

  // Water jet forces
  const jetForce = cfg.water_power * 1.8;
  rings.forEach(ring => {
    if (ring.onPeg >= 0) return;

    // Gravity & buoyancy — net slight downward so rings rest at bottom without jets
    ring.vy += (GRAVITY - BUOYANCY) * dt;

    // ── BOTTOM-LEFT jet: pure upward column — left 75% of screen ──
    if (pressLeft) {
      const xInf = Math.max(0, 1 - ring.x / (W * 0.80));
      ring.vy -= cfg.water_power * JET_UP_FORCE * xInf * dt;
    }

    // ── BOTTOM-RIGHT jet: pure upward column — right 75% of screen ──
    if (pressRight) {
      const xInf = Math.max(0, (ring.x - W * 0.20) / (W * 0.80));
      ring.vy -= cfg.water_power * JET_UP_FORCE * xInf * dt;
    }

    // ── WALL jets: pure horizontal force on ALL rings ──────────
    if (pressWallLeft)  ring.vx -= cfg.water_power * WALL_JET_FORCE * dt;
    if (pressWallRight) ring.vx += cfg.water_power * WALL_JET_FORCE * dt;

    // Natural turbulence / water drift
    ring.vx += (Math.random() - 0.5) * cfg.ring_drift * dt;
    ring.vy += (Math.random() - 0.5) * cfg.ring_drift * 0.4 * dt;

    // Water resistance (damping)
    ring.vx *= Math.pow(DAMPING, dt);
    ring.vy *= Math.pow(DAMPING, dt);

    // Clamp max speed so rings don't fly too fast
    const speed = Math.sqrt(ring.vx * ring.vx + ring.vy * ring.vy);
    const maxSpeed = 10;
    if (speed > maxSpeed) { ring.vx *= maxSpeed / speed; ring.vy *= maxSpeed / speed; }

    // Integrate
    ring.x += ring.vx * dt;
    ring.y += ring.vy * dt;
    ring.angle += ring.vx * 0.04;

    // Wall bounces
    if (ring.x - RING_RADIUS < 10)        { ring.x = 10 + RING_RADIUS; ring.vx = Math.abs(ring.vx) * 0.6; }
    if (ring.x + RING_RADIUS > W - 10)    { ring.x = W - 10 - RING_RADIUS; ring.vx = -Math.abs(ring.vx) * 0.6; }
    if (ring.y - RING_RADIUS < WATER_TOP) { ring.y = WATER_TOP + RING_RADIUS; ring.vy = Math.abs(ring.vy) * 0.4; }
    if (ring.y + RING_RADIUS > WATER_BOT) { ring.y = WATER_BOT - RING_RADIUS; ring.vy = -Math.abs(ring.vy) * 0.4; }

    // Check peg collision — capture when ring passes close enough and is slow enough
    pegs.forEach((peg, pi) => {
      const dx = ring.x - peg.x;
      const dy = ring.y - peg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.sqrt(ring.vx * ring.vx + ring.vy * ring.vy);
      // Capture if close AND speed is low (ring is arcing over the peg)
      if (dist < PEG_RADIUS + RING_RADIUS * 0.8 && speed < 5) {
        landRingOnPeg(ring, pi);
      }
    });
  });

  // Rising bubbles for bottom jets
  if (pressLeft)      emitJetParticles(30 + Math.random() * W * 0.45, WATER_BOT - 20, 0, -1);
  if (pressRight)     emitJetParticles(W * 0.55 + Math.random() * W * 0.42, WATER_BOT - 20, 0, -1);
  // Horizontal bubbles for wall jets
  if (pressWallLeft)  emitJetParticles(18, WATER_TOP + Math.random() * (WATER_BOT - WATER_TOP), 1, 0);
  if (pressWallRight) emitJetParticles(W - 18, WATER_TOP + Math.random() * (WATER_BOT - WATER_TOP), -1, 0);

  // Update particles
  updateParticles(dt);

  render();
  animFrame = requestAnimationFrame(tick);
}

function bounceFail(ring, peg, flashRed) {
  const dx = ring.x - peg.x || 1;
  const dy = ring.y - peg.y || -1;
  const mag = Math.sqrt(dx * dx + dy * dy) || 1;
  ring.vx = (dx / mag) * 4;
  ring.vy = (dy / mag) * 4 - 2;
  if (flashRed) {
    peg.rejectFlash  = 18;
    ring.rejectFlash = 18;
    for (let i = 0; i < 8; i++) emitScoreParticle(ring.x, ring.y, '#ef4444');
  }
}

function landRingOnPeg(ring, pegIdx) {
  const peg = pegs[pegIdx];

  // ── Type + color match check ──────────────────────────────────
  const pegIsFree    = peg.acceptedColors.length === 0;
  const colorMatches = peg.acceptedColors.includes(ring.color);

  if (!ring.isFree && (pegIsFree || !colorMatches)) {
    // Colored ring → must go to its exact colored peg (not a free peg)
    const flashRed = !pegIsFree; // only flash when it's the right type but wrong color
    bounceFail(ring, peg, flashRed);
    return;
  }
  if (ring.isFree && !pegIsFree) {
    // Free ring → must go to a free peg, not a colored one
    bounceFail(ring, peg, false);
    return;
  }

  // ── Land ring — stack it on the peg ─────────────────────────
  ring.onPeg      = pegIdx;
  ring.landed     = true;
  ring.vx = 0; ring.vy = 0;
  ring.stackOffset = peg.ringCount * 8;  // each subsequent ring stacks lower
  peg.ringCount++;
  peg.wobble  = 8;
  ringsScored++;
  AudioManager.playScore();

  for (let i = 0; i < 18; i++) emitScoreParticle(ring.x, ring.y, ring.color);

  if (ringsScored >= cfg.rings) {
    setTimeout(() => endLevel(true), 600);
  }

  updateUI();
}

// ── Particles ─────────────────────────────────────────────────
function emitJetParticles(x, y, dirX, dirY) {
  for (let i = 0; i < 3; i++) {
    const sz = 1.5 + Math.random() * 3.5;
    waterParticles.push({
      x: x + (Math.random() - 0.5) * 22,
      y: y + (Math.random() - 0.5) * 12,
      vx: dirX * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.8,
      vy: dirY * (2 + Math.random() * 3),
      life: 1,
      size: sz,
      baseSize: sz,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.3 + Math.random() * 0.8,
      isWall: dirY === 0,
    });
  }
}

function emitScoreParticle(x, y, color) {
  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 4,
    vy: -2 - Math.random() * 3,
    color,
    life: 1,
    size: 3 + Math.random() * 5,
    type: 'score',
  });
}

function updateParticles(dt) {
  waterParticles = waterParticles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Slight buoyancy — rising bubbles decelerate less; wall bubbles drift up
    p.vy += (p.isWall ? -0.015 : 0.02) * dt;
    // Side-to-side wobble (grows as bubble rises / travels)
    p.x += Math.sin(p.wobblePhase + (1 - p.life) * 9) * p.wobbleAmp * dt;
    // Bubbles grow slightly as surrounding pressure drops
    if (!p.isWall) p.size = p.baseSize * (1 + (1 - p.life) * 0.55);
    p.life -= 0.05 * dt;
    return p.life > 0;
  });
  particles = particles.filter(p => {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 0.1 * dt;
    p.life -= 0.03 * dt;
    return p.life > 0;
  });
}

// ── Rendering ─────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawWater();
  drawPegLegend();
  drawPegs();
  drawRings();
  drawParticles();
  drawJetButtons();
  if (pressLeft)      drawJetStream('left');
  if (pressRight)     drawJetStream('right');
  if (pressWallLeft)  drawJetStream('wallLeft');
  if (pressWallRight) drawJetStream('wallRight');
}

function drawBackground() {
  const th = THEMES[getThemeIdx()];

  // Background gradient from theme
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   th.bg[0]);
  grad.addColorStop(0.4, th.bg[1]);
  grad.addColorStop(1,   th.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Theme-specific background extras (stars for space, snow for arctic)
  const tBg = Date.now() * 0.001;
  if (th.name === 'space') {
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const sx = (i * 73 + 17) % W;
      const sy = (i * 47 + 31) % (H * 0.94);
      const pulse = 0.3 + 0.7 * Math.abs(Math.sin(tBg * 1.5 + i * 0.8));
      ctx.globalAlpha = pulse * 0.65;
      ctx.fillStyle = i % 3 === 0 ? '#cc88ff' : i % 3 === 1 ? '#ffd700' : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, i % 5 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (th.name === 'arctic') {
    ctx.save();
    const tSnow = tBg * 0.5;
    for (let i = 0; i < 22; i++) {
      const sx = (i * 67 + tSnow * 12) % W;
      const sy = (i * 37 + tSnow * 18 * (i % 3 + 0.5)) % (WATER_TOP * 1.3);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#e8f6ff';
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 * 0.7 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Toy-style frame using theme colours
  ctx.save();
  const frameGrad = ctx.createLinearGradient(0, 0, W, H);
  frameGrad.addColorStop(0,   th.frame[0]);
  frameGrad.addColorStop(0.5, th.frame[1]);
  frameGrad.addColorStop(1,   th.frame[2]);
  ctx.strokeStyle = frameGrad;
  ctx.lineWidth   = 7;
  ctx.shadowColor = th.fShadow;
  ctx.shadowBlur  = 14;
  ctx.beginPath();
  ctx.roundRect(4, 4, W - 8, H - 8, 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(13, 13, W - 26, H - 26, 13);
  ctx.stroke();
  ctx.restore();

  // Twinkling sparkles using theme spark colours
  const sparkDefs = [[0.13,0.45],[0.32,0.60],[0.56,0.38],[0.74,0.65],[0.87,0.42],[0.46,0.72],[0.21,0.74]];
  sparkDefs.forEach(([fx, fy], idx) => {
    const sy = WATER_TOP * fy;
    if (sy > WATER_TOP - 8) return;
    const pulse = 0.30 + 0.70 * Math.abs(Math.sin(tBg * 0.85 + idx * 1.9));
    ctx.save();
    ctx.globalAlpha = pulse * 0.60;
    ctx.fillStyle   = th.spark[idx % th.spark.length];
    const sx = fx * W, sr = 2.8;
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2 - Math.PI / 2;
      const r   = p % 2 === 0 ? sr : sr * 0.38;
      p === 0
        ? ctx.moveTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r)
        : ctx.lineTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawWater() {
  const th = THEMES[getThemeIdx()];

  const wGrad = ctx.createLinearGradient(0, WATER_TOP, 0, WATER_BOT);
  wGrad.addColorStop(0,    th.w[0]);
  wGrad.addColorStop(0.25, th.w[1]);
  wGrad.addColorStop(0.65, th.w[2]);
  wGrad.addColorStop(1,    th.w[3]);
  ctx.fillStyle = wGrad;
  ctx.fillRect(0, WATER_TOP, W, WATER_BOT - WATER_TOP);

  // Light shafts (skip for deep/space — no sunlight down there)
  if (th.name !== 'deep' && th.name !== 'space') {
    const tShaft = Date.now() * 0.00038;
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const sx = (Math.sin(tShaft + i * 1.15) * 0.5 + 0.5) * W;
      const shGrad = ctx.createLinearGradient(sx, WATER_TOP, sx + 38, WATER_BOT);
      shGrad.addColorStop(0,   th.sh[0]);
      shGrad.addColorStop(0.5, th.sh[1]);
      shGrad.addColorStop(1,   'transparent');
      ctx.fillStyle   = shGrad;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(sx - 8,  WATER_TOP);
      ctx.lineTo(sx + 28, WATER_TOP);
      ctx.lineTo(sx + 56, WATER_BOT);
      ctx.lineTo(sx + 20, WATER_BOT);
      ctx.fill();
    }
    ctx.restore();
  }

  // Caustic shimmer ellipses
  const tCaus = Date.now() * 0.0007;
  ctx.save();
  ctx.globalAlpha = (th.name === 'deep' || th.name === 'space') ? 0.12 : 0.07;
  ctx.strokeStyle = th.caus;
  ctx.lineWidth   = 1.5;
  for (let i = 0; i < 10; i++) {
    const cx = (Math.sin(tCaus * 0.75 + i * 0.95) * 0.45 + 0.5) * W;
    const cy = WATER_TOP + Math.abs(Math.cos(tCaus * 0.55 + i * 1.1)) * (WATER_BOT - WATER_TOP) * 0.68;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20 + i * 7, (8 + i * 2.5), tCaus * 0.4 + i * 0.38, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Theme flora and creatures
  drawFlora(th);
  drawCreatures(th);

  // Floor gradient
  const sandGrad = ctx.createLinearGradient(0, WATER_BOT - 30, 0, WATER_BOT);
  sandGrad.addColorStop(0,   th.floor[0]);
  sandGrad.addColorStop(0.5, th.floor[1]);
  sandGrad.addColorStop(1,   th.floor[2]);
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, WATER_BOT - 30, W, 30);

  // Surface ripple
  const tRipple = Date.now() / 800;
  ctx.strokeStyle = th.surf;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 2) {
    const y = WATER_TOP + Math.sin(x * 0.04 + tRipple) * 3.5 + Math.sin(x * 0.08 - tRipple * 1.3) * 1.8;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ── Theme flora (bottom decorations) ──────────────────────────
function drawFlora(th) {
  const t = Date.now() * 0.001;

  if (th.name === 'ocean' || th.name === 'reef') {
    // Seaweed / coral stalks
    const plants = th.name === 'ocean'
      ? [{x:36,h:58,c:'#00d68f',w:3.8,s:5},{x:88,h:36,c:'#00b870',w:3.0,s:4},
         {x:W-40,h:68,c:'#00e090',w:4.2,s:6},{x:W-92,h:42,c:'#00c878',w:3.2,s:4},
         {x:W*0.37,h:30,c:'#00b068',w:2.6,s:3},{x:W*0.63,h:46,c:'#00c878',w:3.0,s:4}]
      : [{x:38,h:48,c:'#ff6b8a',w:3.8,s:4},{x:84,h:32,c:'#ff4060',w:3.0,s:3},
         {x:W-40,h:58,c:'#ff8050',w:4.0,s:5},{x:W-86,h:40,c:'#ffb040',w:3.2,s:4},
         {x:W*0.38,h:30,c:'#ff6b8a',w:2.8,s:3},{x:W*0.61,h:44,c:'#ff8060',w:3.0,s:4}];
    plants.forEach(p => {
      ctx.save();
      ctx.strokeStyle = p.c; ctx.lineWidth = p.w;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.68;
      ctx.beginPath();
      let px = p.x, py = WATER_BOT - 8;
      ctx.moveTo(px, py);
      const segH = p.h / p.s;
      for (let i = 0; i < p.s; i++) {
        const sway = Math.sin(t * 1.7 + p.x * 0.042 + i * 0.82) * 9;
        const cpx = px + sway + 10, cpy = py - segH * 0.5;
        px += sway * 0.28; py -= segH;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
      ctx.stroke();
      if (th.name === 'reef') {
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.50;
        ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

  } else if (th.name === 'sunset') {
    // Palm tree silhouettes
    [{x:52,h:90},{x:W-56,h:80},{x:W*0.40,h:70}].forEach(p => {
      const lean = Math.sin(t * 0.7 + p.x * 0.02) * 4;
      ctx.save();
      ctx.strokeStyle = '#1a0a04'; ctx.lineWidth = 5;
      ctx.lineCap = 'round'; ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(p.x, WATER_BOT - 6);
      ctx.quadraticCurveTo(p.x + lean, WATER_BOT - p.h * 0.5, p.x + lean * 2, WATER_BOT - p.h);
      ctx.stroke();
      const tx = p.x + lean * 2, ty = WATER_BOT - p.h;
      const frondSway = Math.sin(t * 1.2 + p.x * 0.03) * 6;
      ctx.strokeStyle = '#0d2006'; ctx.lineWidth = 2.5;
      for (let f = 0; f < 5; f++) {
        const ang = (f / 5) * Math.PI + 0.1 + frondSway * 0.04;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + Math.cos(ang)*25, ty + Math.sin(ang)*10,
                             tx + Math.cos(ang)*42, ty + Math.sin(ang)*22);
        ctx.stroke();
      }
      ctx.restore();
    });

  } else if (th.name === 'deep') {
    // Hydrothermal vents + glowing sea fans
    [{x:46},{x:W-50},{x:W*0.42},{x:W*0.60}].forEach((v, vi) => {
      ctx.save();
      const tV = (t + vi * 1.5) % 100;
      for (let p = 0; p < 6; p++) {
        const phase = ((p / 6) + tV * 0.04) % 1;
        const py = WATER_BOT - 8 - phase * 65;
        const px = v.x + Math.sin(phase * Math.PI * 3 + vi) * 5;
        ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.65;
        ctx.fillStyle = '#00ffee';
        ctx.beginPath(); ctx.arc(px, py, (1 - phase) * 3 + 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#0d0618'; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.ellipse(v.x, WATER_BOT - 4, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    [{x:82,c:'#00c8a0'},{x:W-76,c:'#00a0c8'},{x:W*0.52,c:'#7030ff'}].forEach(f => {
      const sway = Math.sin(t * 1.2 + f.x * 0.03) * 4;
      ctx.save();
      ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
      ctx.shadowColor = f.c; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.moveTo(f.x, WATER_BOT - 6); ctx.lineTo(f.x + sway, WATER_BOT - 48); ctx.stroke();
      for (let b = 0; b < 5; b++) {
        const by = WATER_BOT - 16 - b * 7, blen = (5 - b) * 6;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(f.x + sway * 0.5, by);
        ctx.lineTo(f.x + sway * 0.5 - blen, by - 8);
        ctx.moveTo(f.x + sway * 0.5, by);
        ctx.lineTo(f.x + sway * 0.5 + blen, by - 8);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    });

  } else if (th.name === 'arctic') {
    // Ice crystal spikes
    [{x:38,h:46},{x:88,h:30},{x:W-42,h:54},{x:W-88,h:36},{x:W*0.41,h:28},{x:W*0.62,h:40}].forEach(c => {
      const sway = Math.sin(t * 0.5 + c.x * 0.03) * 2;
      ctx.save();
      ctx.strokeStyle = '#b8e8ff'; ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(200,240,255,0.24)';
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.moveTo(c.x - 8, WATER_BOT - 6);
      ctx.lineTo(c.x + sway, WATER_BOT - c.h);
      ctx.lineTo(c.x + 8, WATER_BOT - 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.48;
      ctx.beginPath();
      ctx.moveTo(c.x - 4, WATER_BOT - 6);
      ctx.lineTo(c.x + sway * 0.7 + 11, WATER_BOT - c.h * 0.56);
      ctx.lineTo(c.x + 13, WATER_BOT - 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    // Snowflakes drifting through water
    const tF = t * 1.0;
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const fx = (i * 67 + 13) % W;
      const fy = WATER_TOP + ((tF * (12 + i % 5) + i * 41) % (WATER_BOT - WATER_TOP - 20));
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#e0f8ff';
      ctx.beginPath(); ctx.arc(fx, fy, i % 3 === 0 ? 2 : 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

  } else if (th.name === 'space') {
    // Asteroid formations + drifting star particles
    [{x:38,r:14},{x:85,r:9},{x:W-42,r:16},{x:W-88,r:11},{x:W*0.40,r:8},{x:W*0.62,r:12}].forEach(r => {
      ctx.save();
      ctx.fillStyle = '#12082a'; ctx.strokeStyle = '#3a1070';
      ctx.lineWidth = 1.5; ctx.globalAlpha = 0.82;
      ctx.beginPath();
      for (let p = 0; p < 7; p++) {
        const ang = (p / 7) * Math.PI * 2;
        const rv = r.r * (0.68 + Math.sin(p * 2.3 + r.x) * 0.32);
        p === 0 ? ctx.moveTo(r.x + Math.cos(ang)*rv, WATER_BOT - 5 + Math.sin(ang)*rv*0.5)
                : ctx.lineTo(r.x + Math.cos(ang)*rv, WATER_BOT - 5 + Math.sin(ang)*rv*0.5);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const rGl = ctx.createRadialGradient(r.x, WATER_BOT - r.r*0.5, 0, r.x, WATER_BOT - r.r, r.r*1.6);
      rGl.addColorStop(0, '#cc88ff'); rGl.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.28; ctx.fillStyle = rGl;
      ctx.beginPath(); ctx.arc(r.x, WATER_BOT - r.r*0.5, r.r*1.6, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
    const tSt = t * 0.4;
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const sx = (i * 71 + 19) % W;
      const sy = WATER_TOP + (i * 53 + 31) % (WATER_BOT - WATER_TOP);
      const pulse = 0.2 + 0.8 * Math.abs(Math.sin(tSt * 3 + i * 1.1));
      ctx.globalAlpha = pulse * 0.55;
      ctx.fillStyle = i % 3 === 0 ? '#cc88ff' : i % 3 === 1 ? '#ffd700' : '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, i % 5 === 0 ? 1.5 : 0.8, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// ── Theme creatures (fish, jellyfish, planets, etc.) ──────────
function drawCreatures(th) {
  const t = Date.now() * 0.001;

  if (th.name === 'ocean' || th.name === 'reef') {
    const defs = th.name === 'ocean'
      ? [{speed:0.34,offset:0,  depth:0.58,scale:0.85,body:'#ff9f0a',fin:'#c85e00'},
         {speed:0.24,offset:3.3,depth:0.74,scale:0.62,body:'#ff3fa4',fin:'#b5005e'},
         {speed:0.46,offset:6.2,depth:0.65,scale:0.73,body:'#00d4f5',fin:'#007ba8'}]
      : [{speed:0.34,offset:0,  depth:0.55,scale:0.90,body:'#ffee00',fin:'#cc8800'},
         {speed:0.24,offset:3.3,depth:0.72,scale:0.70,body:'#00ff88',fin:'#008844'},
         {speed:0.46,offset:6.2,depth:0.62,scale:0.80,body:'#ff60ff',fin:'#990099'}];
    defs.forEach(f => _drawFish(f, t));

  } else if (th.name === 'sunset') {
    [{speed:0.28,offset:0,  depth:0.60,scale:0.90,body:'#ffaa00',fin:'#cc5500'},
     {speed:0.20,offset:2.8,depth:0.76,scale:0.65,body:'#ff6644',fin:'#cc1100'}].forEach(f => _drawFish(f, t));
    _drawTurtle(t);

  } else if (th.name === 'deep') {
    for (let i = 0; i < 3; i++) {
      const jx = (Math.sin(t * 0.3 + i * 2.1) * 0.35 + 0.5) * W;
      const jy = WATER_TOP + (((t * 15 * (0.5 + i * 0.3)) + i * 80) % (WATER_BOT - WATER_TOP - 40)) + 20;
      _drawJellyfish(jx, jy, i, t);
    }
    const lx = 44 + Math.sin(t * 0.4) * 16;
    const ly = WATER_BOT - 80 + Math.sin(t * 0.7) * 10;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 2));
    ctx.fillStyle = '#00ffee'; ctx.shadowColor = '#00ffee'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(lx, ly, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

  } else if (th.name === 'arctic') {
    [{speed:0.32,offset:0,  depth:0.57,scale:0.80,body:'#dff4ff',fin:'#88c8e8'},
     {speed:0.22,offset:2.5,depth:0.73,scale:0.60,body:'#b8e8ff',fin:'#60a8cc'}].forEach(f => _drawFish(f, t));
    _drawIceberg(t);

  } else if (th.name === 'space') {
    [{speed:0.18,offset:0,  depth:0.55,r:18,body:'#cc88ff',ring:true, ringCol:'rgba(180,80,255,0.45)'},
     {speed:0.12,offset:4.0,depth:0.72,r:12,body:'#ff8844',ring:false,ringCol:null},
     {speed:0.25,offset:7.5,depth:0.62,r:10,body:'#44aaff',ring:false,ringCol:null}].forEach(p => _drawPlanet(p, t));
  }
}

function _drawFish(fish, t) {
  const cycle    = t * fish.speed + fish.offset;
  const tripNum  = Math.floor(cycle / (Math.PI * 2));
  const progress = (cycle % (Math.PI * 2)) / (Math.PI * 2);
  const goRight  = tripNum % 2 === 0;
  const fx = goRight ? -55 + progress * (W + 110) : (W + 55) - progress * (W + 110);
  const fy = WATER_TOP + fish.depth * (WATER_BOT - WATER_TOP) + Math.sin(t * 2.2 + fish.offset) * 13;
  ctx.save();
  ctx.translate(fx, fy);
  if (!goRight) ctx.scale(-1, 1);
  ctx.scale(fish.scale, fish.scale);
  ctx.globalAlpha = 0.70;
  const tw = Math.sin(t * 9 + fish.offset) * 0.22;
  ctx.fillStyle = fish.fin;
  ctx.beginPath();
  ctx.moveTo(-13,0); ctx.lineTo(-25,-12+tw*24); ctx.lineTo(-29,0); ctx.lineTo(-25,12+tw*24);
  ctx.closePath(); ctx.fill();
  const bg = ctx.createRadialGradient(-2,-3,2,0,0,15);
  bg.addColorStop(0,fish.body+'ff'); bg.addColorStop(1,fish.fin+'cc');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0,0,15,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = fish.fin; ctx.globalAlpha = 0.80;
  ctx.beginPath(); ctx.moveTo(-2,-8); ctx.quadraticCurveTo(5,-17,11,-8); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(10,-2,3.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a2e'; ctx.beginPath(); ctx.arc(11,-2,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(12,-3,0.8,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function _drawJellyfish(x, y, idx, t) {
  const cols = ['#00ffee','#00ccff','#8840ff'];
  const c    = cols[idx % 3];
  const pulse = 0.78 + 0.22 * Math.sin(t * 2 + idx * 1.5);
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.ellipse(x, y, 14*pulse, 10, 0, Math.PI, Math.PI*2); ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, 14*pulse, 10, 0, 0, Math.PI); ctx.stroke();
  ctx.shadowBlur = 5; ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    const bx = x + i * 4 * pulse;
    const sw = Math.sin(t * 2.5 + i + idx) * 7;
    ctx.beginPath();
    ctx.moveTo(bx, y + 10);
    ctx.quadraticCurveTo(bx + sw, y + 22, bx + sw * 1.5, y + 36);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function _drawTurtle(t) {
  const tx = (Math.sin(t * 0.15) * 0.30 + 0.50) * W;
  const ty = WATER_TOP + 0.68 * (WATER_BOT - WATER_TOP) + Math.sin(t * 0.4) * 12;
  const goRight = Math.cos(t * 0.15) > 0;
  ctx.save();
  ctx.translate(tx, ty);
  if (!goRight) ctx.scale(-1, 1);
  ctx.scale(0.90, 0.90);
  ctx.globalAlpha = 0.70;
  const sg = ctx.createRadialGradient(0,0,2,0,0,16);
  sg.addColorStop(0,'#608a28'); sg.addColorStop(1,'#284808');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.ellipse(0,0,16,12,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#1a3008'; ctx.lineWidth=1; ctx.globalAlpha=0.45;
  ctx.beginPath(); ctx.ellipse(0,0,8,6,0,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=0.70; ctx.fillStyle='#486420';
  ctx.beginPath(); ctx.ellipse(17,0,7,5,0.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(21,-1,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(22,-1,1,0,Math.PI*2); ctx.fill();
  const fw = Math.sin(t * 2) * 0.3;
  [[-10,9],[-10,-9],[10,9],[10,-9]].forEach(([dx,dy],i) => {
    ctx.fillStyle='#486420';
    ctx.save(); ctx.translate(dx,dy); ctx.rotate(fw*(i<2?1:-1));
    ctx.beginPath(); ctx.ellipse(0,0,9,4,Math.PI*0.15*(dy>0?1:-1),0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function _drawIceberg(t) {
  const ibx = W * 0.50 + Math.sin(t * 0.08) * 28;
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = 'rgba(215,238,255,0.72)'; ctx.strokeStyle = '#a8d8f5'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ibx-36,WATER_BOT-26); ctx.lineTo(ibx-18,WATER_BOT-70);
  ctx.lineTo(ibx-4, WATER_BOT-80); ctx.lineTo(ibx+10,WATER_BOT-62);
  ctx.lineTo(ibx+30,WATER_BOT-30); ctx.lineTo(ibx+38,WATER_BOT-26);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha=0.22; ctx.strokeStyle='#fff'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(ibx-12,WATER_BOT-32); ctx.lineTo(ibx-4,WATER_BOT-72); ctx.stroke();
  ctx.restore();
}

function _drawPlanet(p, t) {
  const cycle    = t * p.speed + p.offset;
  const tripNum  = Math.floor(cycle / (Math.PI * 2));
  const progress = (cycle % (Math.PI * 2)) / (Math.PI * 2);
  const goRight  = tripNum % 2 === 0;
  const px = goRight ? -p.r*3 + progress*(W+p.r*6) : (W+p.r*3) - progress*(W+p.r*6);
  const py = WATER_TOP + p.depth*(WATER_BOT-WATER_TOP) + Math.sin(t*1.8+p.offset)*15;
  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = 0.78;
  const glow = ctx.createRadialGradient(0,0,0,0,0,p.r*2.2);
  glow.addColorStop(0,p.body+'55'); glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(0,0,p.r*2.2,0,Math.PI*2); ctx.fill();
  const bg = ctx.createRadialGradient(-p.r*0.3,-p.r*0.35,p.r*0.08,0,0,p.r);
  bg.addColorStop(0,p.body+'ff'); bg.addColorStop(1,p.body+'88');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
  if (p.ring) {
    ctx.strokeStyle=p.ringCol; ctx.lineWidth=4;
    ctx.beginPath(); ctx.ellipse(0,0,p.r*1.95,p.r*0.52,0.3,0,Math.PI*2); ctx.stroke();
  }
  ctx.fillStyle='rgba(255,255,255,0.48)';
  ctx.beginPath(); ctx.arc(-p.r*0.3,-p.r*0.32,p.r*0.22,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPegLegend() {
  if (!pegs.length) return;

  const stripY = 10;
  const stripH = WATER_TOP - 16;
  const iconY  = stripY + stripH * 0.40;
  const lblY   = stripY + stripH * 0.84;
  const R      = 11;

  ctx.save();

  // Panel background
  ctx.fillStyle = 'rgba(4,10,22,0.80)';
  ctx.beginPath();
  ctx.roundRect(12, stripY, W - 24, stripH, 6);
  ctx.fill();

  // Mode label (left edge)
  const isAllFree = (cfg.restricted_pegs || 0) === 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isAllFree ? FREE_RING_COLOR : '#f5c518';
  ctx.font = 'bold 7px system-ui';
  ctx.fillText(isAllFree ? 'ALL'   : 'MATCH', 22, iconY - 5);
  ctx.fillText(isAllFree ? 'FREE'  : 'RINGS', 22, iconY + 5);

  pegs.forEach((peg, i) => {
    const lx   = peg.baseX;
    const ac   = peg.acceptedColors;
    const done = peg.ringCount > 0;

    // Faint dashed guide line
    ctx.save();
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, stripY + stripH + 2);
    ctx.lineTo(lx, WATER_TOP);
    ctx.stroke();
    ctx.restore();

    // Ring icon — always show the color; dim slightly when scored
    ctx.save();
    ctx.globalAlpha = done ? 0.55 : 1.0;
    if (ac.length === 0) {
      ctx.strokeStyle = FREE_RING_COLOR; ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(lx, iconY, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', lx, iconY + 1);
    } else if (ac.length === 1) {
      ctx.strokeStyle = ac[0]; ctx.lineWidth = 5;
      ctx.shadowColor = ac[0]; ctx.shadowBlur = done ? 4 : 8;
      ctx.beginPath(); ctx.arc(lx, iconY, R, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = ac[0]; ctx.lineWidth = 4;
      ctx.shadowColor = ac[0]; ctx.shadowBlur = done ? 3 : 6;
      ctx.beginPath(); ctx.arc(lx, iconY, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = ac[1]; ctx.lineWidth = 3; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(lx, iconY, 5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // Small green ✓ badge in the top-right corner when scored
    if (done) {
      const bx = lx + R * 0.68, by = iconY - R * 0.68;
      ctx.save();
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5;
      ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✓', bx, by);
      ctx.restore();
    }

    // Color name label — always visible (dimmed when scored)
    ctx.save();
    ctx.globalAlpha = done ? 0.50 : 1.0;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (ac.length === 0) {
      ctx.fillStyle = FREE_RING_COLOR;
      ctx.font = 'bold 7px system-ui';
      ctx.fillText('FREE', lx, lblY);
    } else if (ac.length === 1) {
      ctx.fillStyle = ac[0];
      ctx.font = 'bold 7px system-ui';
      ctx.fillText(COLOR_NAMES[RING_COLORS.indexOf(ac[0])] || '?', lx, lblY);
    } else {
      ac.forEach((col, ci) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(lx + (ci === 0 ? -5 : 5), lblY, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  });

  // Bottom separator
  ctx.strokeStyle = 'rgba(41,171,226,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, stripY + stripH + 1);
  ctx.lineTo(W - 14, stripY + stripH + 1);
  ctx.stroke();

  ctx.restore();
}

function drawPegs() {
  pegs.forEach((peg, i) => {
    const wobbleOff = peg.wobble * Math.sin(Date.now() * 0.04) * 0.5;
    peg.wobble *= 0.92;
    const px  = peg.x + wobbleOff;
    const py  = peg.y;
    const ac  = peg.acceptedColors;
    const has = peg.ringCount > 0;
    const rej = peg.rejectFlash > 0;

    // Glow
    const glowBase = has ? 'rgba(34,197,94,0.55)'
                   : rej ? 'rgba(239,68,68,0.55)'
                   : ac.length ? hexToRgba(ac[0], 0.35)
                   :             'rgba(41,171,226,0.35)';
    const glow = ctx.createRadialGradient(px, py, 0, px, py, PEG_RADIUS * 3.5);
    glow.addColorStop(0, glowBase);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(px - PEG_RADIUS * 4, py - PEG_RADIUS * 4, PEG_RADIUS * 8, PEG_RADIUS * 8);

    // Post
    ctx.strokeStyle = has ? '#22c55e' : (ac.length ? ac[0] : '#29abe2');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py + PEG_RADIUS);
    ctx.lineTo(px, py + 30);
    ctx.stroke();

    // Peg cap
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, PEG_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    if (has) {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(px - PEG_RADIUS, py - PEG_RADIUS, PEG_RADIUS * 2, PEG_RADIUS * 2);
    } else if (rej) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - PEG_RADIUS, py - PEG_RADIUS, PEG_RADIUS * 2, PEG_RADIUS * 2);
    } else if (ac.length === 0) {
      const rg = ctx.createLinearGradient(px - PEG_RADIUS, py, px + PEG_RADIUS, py);
      RING_COLORS.forEach((c, ci) => rg.addColorStop(ci / (RING_COLORS.length - 1), c));
      ctx.fillStyle = rg;
      ctx.fillRect(px - PEG_RADIUS, py - PEG_RADIUS, PEG_RADIUS * 2, PEG_RADIUS * 2);
    } else if (ac.length === 1) {
      ctx.fillStyle = ac[0];
      ctx.fillRect(px - PEG_RADIUS, py - PEG_RADIUS, PEG_RADIUS * 2, PEG_RADIUS * 2);
    } else {
      ctx.fillStyle = ac[0];
      ctx.fillRect(px - PEG_RADIUS, py - PEG_RADIUS, PEG_RADIUS, PEG_RADIUS * 2);
      ctx.fillStyle = ac[1];
      ctx.fillRect(px, py - PEG_RADIUS, PEG_RADIUS, PEG_RADIUS * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py - PEG_RADIUS);
      ctx.lineTo(px, py + PEG_RADIUS);
      ctx.stroke();
    }
    ctx.restore();

    // Cap border
    ctx.strokeStyle = has ? '#16a34a' : rej ? '#b91c1c' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, PEG_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Star for free unrestricted pegs
    if (peg.ringCount === 0 && ac.length === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', px, py);
    }

    // Ring count badge when more than 1 ring stacked
    if (peg.ringCount > 1) {
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#0a1628';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + PEG_RADIUS - 2, py - PEG_RADIUS + 2, 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(peg.ringCount, px + PEG_RADIUS - 2, py - PEG_RADIUS + 2);
    }
  });
}


// Convert hex color to rgba string
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRings() {
  rings.forEach(ring => {
    if (ring.onPeg >= 0) {
      drawLandedRing(ring);
    } else {
      drawFloatingRing(ring);
    }
  });
}

function drawFloatingRing(ring) {
  ctx.save();
  ctx.translate(ring.x, ring.y);
  ctx.rotate(ring.angle);

  // Shadow / depth
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = RING_THICKNESS + 4;
  ctx.beginPath();
  ctx.arc(2, 3, RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Ring — flash red on rejection, otherwise use ring's color
  const drawColor = ring.rejectFlash > 0
    ? `rgba(239,68,68,${Math.min(1, ring.rejectFlash / 8)})`
    : ring.color;
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = RING_THICKNESS;
  ctx.shadowColor = drawColor;
  ctx.shadowBlur = ring.rejectFlash > 0 ? 16 : 8;
  ctx.beginPath();
  ctx.arc(0, 0, RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Shine
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-4, -4, RING_RADIUS * 0.6, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();

  ctx.restore();
}

function drawLandedRing(ring) {
  const peg = pegs[ring.onPeg];
  if (!peg) return;
  ctx.save();
  ctx.translate(peg.x, peg.y + 14 + ring.stackOffset); // stack rings on the post

  ctx.strokeStyle = ring.color;
  ctx.lineWidth = RING_THICKNESS - 1;
  ctx.shadowColor = ring.color;
  ctx.shadowBlur = 12;
  // Draw as ellipse (perspective)
  ctx.beginPath();
  ctx.ellipse(0, 0, RING_RADIUS, RING_RADIUS * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawParticles() {
  const th = THEMES[getThemeIdx()];
  const jc = THEME_JET_COLORS[th.name];
  // Water jet particles — draw as realistic bubbles
  waterParticles.forEach(p => {
    const color = p.isWall ? jc.wall : jc.lift;
    drawRealisticBubble(p.x, p.y, p.size * p.life, p.life * 0.75, color);
  });

  // Score particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// Draw a single water bubble: faint interior + glowing rim + white specular dot
function drawRealisticBubble(x, y, r, alpha, color) {
  if (r < 0.5 || alpha < 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Transparent interior — refracted light effect
  const fill = ctx.createRadialGradient(x - r * 0.26, y - r * 0.28, 0, x, y, r);
  fill.addColorStop(0,    'rgba(255,255,255,0.16)');
  fill.addColorStop(0.55, 'rgba(255,255,255,0.04)');
  fill.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // Glowing colored rim
  ctx.strokeStyle = color;
  ctx.lineWidth   = Math.max(0.7, r * 0.22);
  ctx.shadowColor = color;
  ctx.shadowBlur  = r * 1.8;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

  // White specular highlight (upper-left crescent)
  if (r >= 2.5) {
    ctx.shadowBlur   = 0;
    ctx.globalAlpha  = alpha * 0.88;
    ctx.fillStyle    = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(x - r * 0.28, y - r * 0.33, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawJetButtons() {
  // Bottom jets (↑) at bottom corners
  [[30, H - 46, pressLeft], [W - 30, H - 46, pressRight]].forEach(([x, y, active]) => {
    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.015);
      ctx.strokeStyle = `rgba(41,171,226,${0.3 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 28 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = active ? 'rgba(41,171,226,0.55)' : 'rgba(13,110,168,0.30)';
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = active ? '#7ecff5' : 'rgba(41,171,226,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = active ? '#fff' : '#7ecff5';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('↑', x, y);
  });

  // Wall jets (← →) on left/right edges, centered vertically
  const wallY = H * 0.5;
  [[18, pressWallLeft, '→'], [W - 18, pressWallRight, '←']].forEach(([x, active, arrow]) => {
    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.018);
      ctx.strokeStyle = `rgba(249,115,22,${0.3 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, wallY, 22 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = active ? 'rgba(249,115,22,0.55)' : 'rgba(100,60,10,0.30)';
    ctx.beginPath(); ctx.arc(x, wallY, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = active ? '#f97316' : 'rgba(249,115,22,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, wallY, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = active ? '#fff' : '#f97316';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(arrow, x, wallY);
  });
}

function drawJetStream(side) {
  ctx.save();
  const t   = Date.now() / 600;
  const th  = THEMES[getThemeIdx()];
  const jc  = THEME_JET_COLORS[th.name];

  if (side === 'wallLeft' || side === 'wallRight') {
    const fromLeft = side === 'wallLeft';
    const wallX    = fromLeft ? 18 : W - 18;
    const color    = jc.wall;

    // ── 5 horizontal rows, bubbles travel inward + drift upward (buoyancy) ──
    const rows = [H * 0.28, H * 0.40, H * 0.52, H * 0.64, H * 0.76];
    rows.forEach((ry, ri) => {
      for (let i = 0; i < 9; i++) {
        const phase  = ((i / 9) + t * 0.85 + ri * 0.19) % 1;
        const travel = phase * 150;
        const bx     = fromLeft ? wallX + 8 + travel : wallX - 8 - travel;

        // Buoyancy: bubbles arc upward as they travel
        const lift   = phase * phase * 26;
        // Spread: alternate rows fan slightly up/down
        const spread = phase * 9 * (ri % 2 === 0 ? 1 : -1);
        const wobble = Math.sin(phase * Math.PI * 2.8 + ri * 0.9) * 3.5;
        const by     = ry - lift + spread + wobble;

        // Bubbles grow as pressure drops with distance from wall
        const r      = 1.5 + phase * 4.0;
        const alpha  = Math.sin(phase * Math.PI) * 0.82;
        drawRealisticBubble(bx, by, r, alpha, color);
      }
    });

    // ── Turbulent nozzle burst at wall source ──
    const burstY = H * 0.50;
    for (let i = 0; i < 14; i++) {
      const bt   = t * 4.5 + i * (Math.PI * 2 / 14);
      const dist = 7 + Math.sin(bt * 1.1 + i) * 5;
      const bx   = fromLeft
        ? wallX + 4 + Math.abs(Math.cos(bt * 0.6)) * dist * 0.7
        : wallX - 4 - Math.abs(Math.cos(bt * 0.6)) * dist * 0.7;
      const by   = burstY + Math.sin(bt) * dist * 0.55;
      const r    = 1.0 + Math.abs(Math.sin(bt * 1.4)) * 1.5;
      const a    = 0.35 + Math.abs(Math.sin(bt * 2)) * 0.4;
      drawRealisticBubble(bx, by, r, a, color);
    }

    // ── Gradient glow wedge from wall ──
    const wg = ctx.createLinearGradient(
      fromLeft ? 0 : W, 0,
      fromLeft ? 80 : W - 80, 0
    );
    wg.addColorStop(0,   `${color}22`);
    wg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle   = wg;
    ctx.fillRect(fromLeft ? 0 : W - 80, WATER_TOP, 80, WATER_BOT - WATER_TOP);

  } else {
    // ── Vertical rising bubbles for bottom lift jets ──
    const isLeft = side === 'left';
    const cols   = isLeft ? [52, 112, 172, 232] : [248, 308, 368, 428];
    const color  = jc.lift;

    cols.forEach((cx, ci) => {
      for (let i = 0; i < 9; i++) {
        const phase = ((i / 9) + t * 0.9 + ci * 0.23) % 1;
        const by    = WATER_BOT - 12 - phase * (WATER_BOT - WATER_TOP - 12);

        // Bubbles grow as they rise (lower pressure near surface)
        const r     = 1.8 + phase * 5.2;
        // Wobble amplitude and frequency both vary with bubble size
        const wAmp  = 5 + r * 1.4;
        const wFreq = 2.6 - phase * 0.7;
        const bx    = cx + Math.sin(phase * Math.PI * wFreq * 2 + ci * 1.35) * wAmp;

        const alpha = Math.sin(phase * Math.PI) * 0.88;
        drawRealisticBubble(bx, by, r, alpha, color);
      }
    });

    // ── Dense nozzle burst at jet source (bottom) ──
    const nozzleX = isLeft ? 30 : W - 30;
    const nozzleY = WATER_BOT - 8;
    for (let i = 0; i < 16; i++) {
      const bt   = t * 5 + i * (Math.PI * 2 / 16);
      const dist = 8 + Math.sin(bt * 1.3 + i * 0.4) * 7;
      const bx   = nozzleX + Math.cos(bt * 0.8 + i) * dist * 0.55;
      const by   = nozzleY - Math.abs(Math.sin(bt)) * dist * 0.9;
      const r    = 0.9 + Math.abs(Math.sin(bt * 1.6)) * 1.8;
      const a    = 0.30 + Math.abs(Math.sin(bt * 1.9)) * 0.45;
      drawRealisticBubble(bx, by, r, a, color);
    }

    // ── Half-screen glow column ──
    const gx   = isLeft ? 0 : W / 2;
    const grad = ctx.createLinearGradient(gx, 0, gx + W / 2, 0);
    grad.addColorStop(isLeft ? 0 : 1, `${color}1a`);
    grad.addColorStop(isLeft ? 1 : 0, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle   = grad;
    ctx.fillRect(gx, WATER_TOP, W / 2, WATER_BOT - WATER_TOP);
  }

  ctx.restore();
}

// ── Score formula (mirrors server-side game_config.py) ─────────
function calculateLevelScore(rings, total, timeRemaining) {
  const base      = rings * cfg.points_per_ring;
  const timeBonus = Math.floor(timeRemaining * 5);
  const perfect   = rings === total ? 500 : 0;
  return base + timeBonus + perfect;
}

// ── Level end logic ────────────────────────────────────────────
function endLevel(allScored) {
  state = 'levelEnd';
  clearInterval(timerInterval);

  levelScore = allScored ? calculateLevelScore(ringsScored, cfg.rings, timeLeft) : 0;
  totalScore += levelScore;

  document.getElementById('totalScoreDisplay').textContent = totalScore.toLocaleString();

  if (!allScored || level >= 150) {
    showGameOver(allScored && level >= 150);
  } else {
    showLevelComplete();
  }
}

function showLevelComplete() {
  AudioManager.playLevelComplete();
  const overlay = document.getElementById('levelEndOverlay');
  document.getElementById('lvlEndTitle').textContent = `Level ${level} Complete!`;
  document.getElementById('lvlEndScore').textContent  = `+${levelScore.toLocaleString()}`;
  document.getElementById('lvlEndRings').textContent  = `${ringsScored} / ${cfg.rings} rings`;
  document.getElementById('lvlEndTime').textContent   = `Time left: ${timeLeft.toFixed(1)}s`;
  overlay.classList.add('active');
}

function showGameOver(victory) {
  AudioManager.playGameOver();
  const overlay = document.getElementById('gameOverOverlay');
  document.getElementById('goTitle').textContent    = victory ? '🏆 You Win!' : (timeLeft <= 0 ? '⏰ Time Up!' : 'Level Failed');
  document.getElementById('goScore').textContent    = totalScore.toLocaleString();
  document.getElementById('goLevel').textContent    = `Reached Level ${level}`;
  document.getElementById('goRings').textContent    = `${ringsScored} / ${cfg.rings} rings on pegs`;
  overlay.classList.add('active');
}

// ── UI helpers ─────────────────────────────────────────────────
function updateUI() {
  document.getElementById('scoreVal').textContent = totalScore.toLocaleString();
  document.getElementById('levelVal').textContent = level;
  document.getElementById('ringsVal').textContent = `${ringsScored} / ${cfg.rings}`;

  // Ring dots
  const dotsEl = document.getElementById('ringDots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < cfg.rings; i++) {
    const dot = document.createElement('div');
    dot.className = 'ring-dot' + (i < ringsScored ? ' scored' : '');
    dotsEl.appendChild(dot);
  }

  // Level list
  for (let i = 1; i <= 150; i++) {
    const el = document.getElementById(`lvl-item-${i}`);
    if (!el) continue;
    el.className = 'level-item' +
      (i < level ? ' done' : i === level ? ' current' : '');
  }
}

function updateTimerBar() {
  const el = document.getElementById('timerBar');
  const pct = (timeLeft / cfg.time) * 100;
  el.style.width = pct + '%';
  document.getElementById('timerVal').textContent = Math.ceil(timeLeft) + 's';
  el.className = 'timer-bar' + (pct < 25 ? ' danger' : pct < 50 ? ' warning' : '');
}

// ── Input ──────────────────────────────────────────────────────
function bindBtn(id, setTrue, setFalse) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown',  () => { setTrue();  el.classList.add('pressed'); AudioManager.startJetSound(); });
  el.addEventListener('pointerup',    () => { setFalse(); el.classList.remove('pressed'); AudioManager.stopJetSound(); });
  el.addEventListener('pointerleave', () => { setFalse(); el.classList.remove('pressed'); AudioManager.stopJetSound(); });
}

bindBtn('btnLeft',      () => pressLeft = true,      () => pressLeft = false);
bindBtn('btnRight',     () => pressRight = true,     () => pressRight = false);
bindBtn('btnWallLeft',  () => pressWallLeft = true,  () => pressWallLeft = false);
bindBtn('btnWallRight', () => pressWallRight = true, () => pressWallRight = false);

// Keyboard — ← / A : bottom-left up-jet  |  → / D : bottom-right up-jet
//            Q / Z  : wall-left (push ←)  |  E / X  : wall-right (push →)
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') pressLeft      = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pressRight     = true;
  if (e.key === 'q' || e.key === 'Q' || e.key === 'z' || e.key === 'Z') pressWallLeft  = true;
  if (e.key === 'e' || e.key === 'E' || e.key === 'x' || e.key === 'X') pressWallRight = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') pressLeft      = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pressRight     = false;
  if (e.key === 'q' || e.key === 'Q' || e.key === 'z' || e.key === 'Z') pressWallLeft  = false;
  if (e.key === 'e' || e.key === 'E' || e.key === 'x' || e.key === 'X') pressWallRight = false;
});

// ── Next level button ──────────────────────────────────────────
document.getElementById('btnNextLevel').addEventListener('click', () => {
  document.getElementById('levelEndOverlay').classList.remove('active');
  initLevel(level + 1);
  state = 'playing';
});

// ── Submit score & restart ─────────────────────────────────────
document.getElementById('btnSubmitScore').addEventListener('click', async () => {
  const name = playerName || document.getElementById('goName').value.trim() || 'Anonymous';
  try {
    await fetch('/api/scores', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        player_name:    name,
        level,
        rings_scored:   ringsScored,
        rings_total:    cfg.rings,
        time_remaining: timeLeft,
        total_score:    totalScore,
      }),
    });
    showToast('Score saved! 🎉');
    setTimeout(() => { window.location.href = '/leaderboard'; }, 1200);
  } catch (e) {
    console.error(e);
  }
});

document.getElementById('btnRestart').addEventListener('click', () => {
  document.getElementById('gameOverOverlay').classList.remove('active');
  totalScore = 0;
  initLevel(1);
  state = 'playing';
});

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Boot ───────────────────────────────────────────────────────
async function boot() {
  playerName = sessionStorage.getItem('playerName') || '';
  await loadLevels();
  initLevel(1);
  state = 'playing';
  lastTimestamp = performance.now();
  animFrame = requestAnimationFrame(tick);

  document.addEventListener('pointerdown', () => AudioManager.startBg(), { once: true });
}

boot();
