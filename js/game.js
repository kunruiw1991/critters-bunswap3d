import * as THREE from '../models/three.module.min.js';
import { createBunSwapScene, EMBLEM_TYPES, STATION_IDS, CRITTER_CROP_BOXES } from './scene3d.js';
import { BunSwapAudio } from './audio.js';

const RIVAL_SCORES = [220, 165, 110, 55];
const RIVAL_CRITTERS = ['dogday', 'catnap', 'craftycorn', 'hoppy'];
const PLAYER_CRITTER = 'baba';

function getCritterCropStyle(critterId) {
  const [ux, uy, uw, uh] = CRITTER_CROP_BOXES[critterId] || [0, 0, 1, 1];
  const wPct = (100 / uw).toFixed(2);
  const hPct = (100 / uh).toFixed(2);
  const leftPct = (-(ux / uw) * 100).toFixed(2);
  const topPct = (-(uy / uh) * 100).toFixed(2);
  return `left:${leftPct}%;top:${topPct}%;width:${wPct}%;height:${hPct}%;filter:brightness(1.22) contrast(1.12) saturate(1.32);`;
}

const COMBO_WINDOW = 5.5;

const WAVE_PATIENCE = {
  1: 26.0,
  2: 23.0,
  3: 20.0,
};

const WAVE_SCHEDULES = {
  1: [
    { friend: 'dogday', emblem: 'star' },
    { friend: 'catnap', emblem: 'moon' },
    { friend: 'hoppy', emblem: 'ruby' },
    { friend: 'craftycorn', emblem: 'clover' },
    { friend: 'baba', emblem: 'star' },
    { friend: 'picky', emblem: 'ruby' },
    { friend: 'bubba', emblem: 'moon' },
    { friend: 'kickin', emblem: 'clover' },
  ],
  2: [
    { friend: 'catnap', emblem: 'moon' },
    { friend: 'dogday', emblem: 'ruby' },
    { friend: 'picky', emblem: 'star' },
    { friend: 'hoppy', emblem: 'clover' },
    { friend: 'craftycorn', emblem: 'moon' },
    { friend: 'baba', emblem: 'ruby' },
    { friend: 'kickin', emblem: 'star' },
    { friend: 'bubba', emblem: 'clover' },
  ],
  3: [
    { friend: 'dogday', emblem: 'ruby' },
    { friend: 'catnap', emblem: 'clover' },
    { friend: 'baba', emblem: 'star' },
    { friend: 'picky', emblem: 'moon' },
    { friend: 'hoppy', emblem: 'ruby' },
    { friend: 'craftycorn', emblem: 'star' },
    { friend: 'bubba', emblem: 'clover' },
    { friend: 'kickin', emblem: 'moon' },
  ],
};

function createMoundSlot(index) {
  return {
    index,
    id: `mound_${index}`,
    emblemType: EMBLEM_TYPES[index],
    state: 'intact', // 'intact' | 'dug_chest' | 'empty_pit' | 'bun_swapped'
    resetTimer: 0,
  };
}

function createExplorerSlot(slotIndex) {
  return {
    slotIndex,
    id: `explorer_${slotIndex}`,
    active: false,
    orderIndex: -1,
    friend: 'dogday',
    targetEmblem: 'star',
    revealed: false,
    patience: 26.0,
    maxPatience: 26.0,
  };
}

const canvas = document.getElementById('gameCanvas');
const sceneApi = createBunSwapScene(canvas);

const state = {
  wave: 1,
  coins: 0,
  totalCoinsAllWaves: 0,
  comboCount: 0,
  comboTimer: 0,
  mounds: [
    createMoundSlot(0),
    createMoundSlot(1),
    createMoundSlot(2),
    createMoundSlot(3),
  ],
  explorers: [createExplorerSlot(0), createExplorerSlot(1)],
  nextOrderIndex: 0,
  orderOutcomes: new Array(8).fill('pending'),
  waveFinished: false,
  modalOpen: false,
  canAdvance: false,
  playerRank: 5,
  earnedStars: 0,
  activeTool: null, // null | 'lens' | 'shovel' | 'bun'
  toolWorldPos: new THREE.Vector3(),
  guideTimer: 0,
  elapsed: 0,
};

// DOM Elements
const waveCrowns = [
  document.getElementById('crownWave1'),
  document.getElementById('crownWave2'),
  document.getElementById('crownWave3'),
];
const customerPipsEl = document.getElementById('customerPips');
const coinBarFillEl = document.getElementById('coinBarFill');
const coinEmblemEl = document.getElementById('coinEmblem');
const starMarkers = [
  document.getElementById('starMark1'),
  document.getElementById('starMark2'),
  document.getElementById('starMark3'),
];
const comboFlameEl = document.getElementById('comboFlameIcon');
const comboPips = [
  document.getElementById('comboPip1'),
  document.getElementById('comboPip2'),
  document.getElementById('comboPip3'),
];
const comboTimerFillEl = document.getElementById('comboTimerFill');
const fxLayerEl = document.getElementById('fxLayer');
const guideHandEl = document.getElementById('guideHand');
const btnMuteEl = document.getElementById('btnMute');
const iconSoundOnEl = document.getElementById('iconSoundOn');
const iconSoundOffEl = document.getElementById('iconSoundOff');
const btnRestartWaveEl = document.getElementById('btnRestartWave');
const wavePillEl = document.getElementById('wavePill');
const waveModalBackdropEl = document.getElementById('waveModalBackdrop');
const modalStars = [
  document.getElementById('modalStar1'),
  document.getElementById('modalStar2'),
  document.getElementById('modalStar3'),
];
const modalPodiumRowEl = document.getElementById('modalPodiumRow');
const btnModalReplayEl = document.getElementById('btnModalReplay');
const btnModalNextEl = document.getElementById('btnModalNext');

const pipEls = [];
for (let i = 0; i < 8; i++) {
  const d = document.createElement('div');
  d.className = 'cust-pip';
  customerPipsEl.appendChild(d);
  pipEls.push(d);
}

function updateTopHud() {
  for (let w = 0; w < 3; w++) {
    const el = waveCrowns[w];
    if (!el) continue;
    el.classList.toggle('active', state.wave === w + 1);
    el.classList.toggle('done', state.wave > w + 1);
  }

  for (let i = 0; i < 8; i++) {
    const pip = pipEls[i];
    if (!pip) continue;
    pip.className = 'cust-pip';
    if (state.orderOutcomes[i] === 'served') pip.classList.add('served');
    else if (state.orderOutcomes[i] === 'missed') pip.classList.add('missed');
  }

  const pct = Math.max(0, Math.min(100, (state.coins / 260) * 100));
  coinBarFillEl.style.width = `${pct.toFixed(1)}%`;

  starMarkers[0].classList.toggle('earned', state.coins >= RIVAL_SCORES[2]);
  starMarkers[1].classList.toggle('earned', state.coins >= RIVAL_SCORES[1]);
  starMarkers[2].classList.toggle('earned', state.coins >= RIVAL_SCORES[0]);

  const hot = state.comboCount >= 2;
  comboFlameEl.classList.toggle('hot', hot);
  for (let c = 0; c < 3; c++) {
    comboPips[c].classList.toggle('lit', state.comboCount > c);
  }
  const timerPct = state.comboTimer > 0 ? Math.min(100, (state.comboTimer / COMBO_WINDOW) * 100) : 0;
  comboTimerFillEl.style.width = `${timerPct.toFixed(1)}%`;
}

function spawnFlyingCoins(fromStationId, count = 3) {
  const start = sceneApi.getStationScreenRect(fromStationId);
  const targetRect = coinEmblemEl.getBoundingClientRect();
  const tx = targetRect.left + targetRect.width * 0.5;
  const ty = targetRect.top + targetRect.height * 0.5;

  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div');
    coin.className = 'flying-coin';
    coin.innerHTML = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><path d="M18 8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z" fill="#fef08a"/></svg>`;
    const sx = start.x + (i - 1) * 18;
    const sy = start.y - 12;
    coin.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(0.9)`;
    fxLayerEl.appendChild(coin);

    setTimeout(() => {
      coin.style.transition = 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.52s ease';
      coin.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(0.55)`;
      coin.style.opacity = '0.2';
    }, 20 + i * 55);

    setTimeout(() => {
      coin.remove();
      coinEmblemEl.classList.add('pulse');
      setTimeout(() => coinEmblemEl.classList.remove('pulse'), 180);
    }, 580 + i * 55);
  }
}

function spawnNextExplorerIntoSlot(slotIndex) {
  const schedule = WAVE_SCHEDULES[state.wave] || WAVE_SCHEDULES[1];
  if (state.nextOrderIndex >= schedule.length) return false;
  const spec = schedule[state.nextOrderIndex];
  const orderIdx = state.nextOrderIndex;
  state.nextOrderIndex += 1;

  const maxPat = WAVE_PATIENCE[state.wave] || 26.0;
  const exp = state.explorers[slotIndex];
  exp.active = true;
  exp.orderIndex = orderIdx;
  exp.friend = spec.friend;
  exp.targetEmblem = spec.emblem;
  // First explorer starts unrevealed so the child can use the X-Ray Magic Lens!
  exp.revealed = false;
  exp.maxPatience = maxPat;
  exp.patience = maxPat;

  // Ensure the target mound is intact or ready
  const mIdx = EMBLEM_TYPES.indexOf(spec.emblem);
  if (mIdx >= 0 && state.mounds[mIdx].state === 'bun_swapped') {
    state.mounds[mIdx].state = 'intact';
    state.mounds[mIdx].resetTimer = 0;
  }
  return true;
}

function fillEmptyExplorerSeats() {
  for (let i = 0; i < 2; i++) {
    if (!state.explorers[i].active && state.nextOrderIndex < 8) {
      spawnNextExplorerIntoSlot(i);
    }
  }
}

function startWave(waveNum) {
  state.wave = Math.max(1, Math.min(3, waveNum));
  state.coins = 0;
  state.comboCount = 0;
  state.comboTimer = 0;
  state.nextOrderIndex = 0;
  state.orderOutcomes = new Array(8).fill('pending');
  state.waveFinished = false;
  state.modalOpen = false;
  state.canAdvance = false;
  state.playerRank = 5;
  state.earnedStars = 0;
  state.activeTool = null;

  state.mounds = [
    createMoundSlot(0),
    createMoundSlot(1),
    createMoundSlot(2),
    createMoundSlot(3),
  ];
  state.explorers = [createExplorerSlot(0), createExplorerSlot(1)];

  waveModalBackdropEl.classList.remove('open');
  fillEmptyExplorerSeats();
  updateTopHud();
}

// ============================================================================
// Core 3-Step Novel Loop:
// 1. Scan Explorer with X-Ray Magic Lens ("隐藏信息读心镜")
// 2. Scoop Mound with Golden Shovel ("后山工兵铲挖走帝兵宝箱")
// 3. Drop Plump Steamed Bun into the Pit ("掉包热腾腾大包子")!
// ============================================================================

function scanExplorerWithLens(expIdx = -1) {
  if (state.waveFinished) return false;
  let target = null;
  if (expIdx >= 0 && state.explorers[expIdx]?.active && !state.explorers[expIdx].revealed) {
    target = state.explorers[expIdx];
  } else {
    target = state.explorers.find((e) => e.active && !e.revealed);
  }
  if (!target) return false;

  target.revealed = true;
  state.guideTimer = 0;
  BunSwapAudio.playLensScan(target.slotIndex);
  updateTopHud();
  return true;
}

function digMoundWithShovel(moundIdx = -1) {
  if (state.waveFinished) return false;
  let m = null;
  if (moundIdx >= 0 && state.mounds[moundIdx]) {
    m = state.mounds[moundIdx];
  } else {
    // Find mound matching a revealed explorer
    const revExp = state.explorers.find((e) => e.active && e.revealed) || state.explorers.find((e) => e.active);
    if (revExp) {
      revExp.revealed = true;
      const idx = EMBLEM_TYPES.indexOf(revExp.targetEmblem);
      if (idx >= 0) m = state.mounds[idx];
    }
  }
  if (!m) return false;

  // Forgiving for 5yo: if the Explorer wanting this mound wasn't scanned yet, auto-reveal!
  for (const exp of state.explorers) {
    if (exp.active && exp.targetEmblem === m.emblemType && !exp.revealed) {
      exp.revealed = true;
    }
  }

  if (m.state === 'intact' || m.state === 'bun_swapped') {
    m.state = 'dug_chest';
    m.resetTimer = 0;
    state.coins += 12;
    state.totalCoinsAllWaves += 12;
    state.guideTimer = 0;
    BunSwapAudio.playShovelScoop(m.index);
    sceneApi.spawnDirtBurst(m.index);
    spawnFlyingCoins(m.id, 2);
    updateTopHud();
    return true;
  }
  return false;
}

function swapBunIntoMound(moundIdx = -1) {
  if (state.waveFinished) return false;
  let m = null;
  if (moundIdx >= 0 && state.mounds[moundIdx]) {
    m = state.mounds[moundIdx];
  } else {
    m = state.mounds.find((md) => md.state === 'dug_chest' || md.state === 'empty_pit');
  }
  if (!m) return false;

  // Forgiving: if child drags a bun directly onto an intact mound that an explorer wants, dig + swap!
  if (m.state === 'intact' || m.state === 'bun_swapped') {
    const wantedBy = state.explorers.find((e) => e.active && e.targetEmblem === m.emblemType);
    if (!wantedBy) return false;
    digMoundWithShovel(m.index);
  }

  if (m.state !== 'dug_chest' && m.state !== 'empty_pit') return false;

  const matchingExp = state.explorers.find((e) => e.active && e.targetEmblem === m.emblemType);
  m.state = 'bun_swapped';
  m.resetTimer = 0.85;

  if (matchingExp) {
    const speedBonus = Math.round((matchingExp.patience / matchingExp.maxPatience) * 10);
    state.comboCount = Math.min(3, state.comboCount + 1);
    state.comboTimer = COMBO_WINDOW;
    const comboBonus = (state.comboCount - 1) * 5;
    const earned = 24 + speedBonus + comboBonus;

    state.coins += earned;
    state.totalCoinsAllWaves += earned;
    state.orderOutcomes[matchingExp.orderIndex] = 'served';

    BunSwapAudio.playBunSwap(state.comboCount);
    spawnFlyingCoins(m.id, 3);

    matchingExp.active = false;
    fillEmptyExplorerSeats();
    checkWaveEndCondition();
  } else {
    BunSwapAudio.playBunSwap(1);
  }

  state.guideTimer = 0;
  updateTopHud();
  return true;
}

function checkWaveEndCondition() {
  if (state.waveFinished) return;
  const allDone = state.orderOutcomes.every((o) => o === 'served' || o === 'missed');
  if (!allDone) return;

  state.waveFinished = true;
  state.modalOpen = true;

  const board = [
    { id: PLAYER_CRITTER, score: state.coins, isPlayer: true },
    ...RIVAL_CRITTERS.map((id, idx) => ({ id, score: RIVAL_SCORES[idx], isPlayer: false })),
  ];
  board.sort((a, b) => b.score - a.score || (a.isPlayer ? -1 : 1));
  const playerIdx = board.findIndex((e) => e.isPlayer);
  state.playerRank = playerIdx + 1;
  state.canAdvance = state.playerRank <= 3;

  if (state.coins >= RIVAL_SCORES[0]) state.earnedStars = 3;
  else if (state.coins >= RIVAL_SCORES[1]) state.earnedStars = 2;
  else if (state.coins >= RIVAL_SCORES[2]) state.earnedStars = 1;
  else state.earnedStars = 0;

  BunSwapAudio.playWaveEnd(state.canAdvance);
  renderWaveModal(board);
}

function renderWaveModal(board) {
  for (let s = 0; s < 3; s++) {
    modalStars[s].classList.toggle('lit', s < state.earnedStars);
  }
  modalPodiumRowEl.innerHTML = '';

  const medalColors = ['#fbbf24', '#cbd5e1', '#d97706', '#64748b', '#475569'];
  board.forEach((entry, idx) => {
    const rank = idx + 1;
    const col = document.createElement('div');
    col.className = `podium-slot rank-${rank}` + (entry.isPlayer ? (state.canAdvance ? ' player-slot' : ' player-defeat') : '');

    const avatar = document.createElement('div');
    avatar.className = 'podium-avatar-wrap';
    const img = document.createElement('img');
    img.src = `./assets/${entry.id}.png`;
    img.style.cssText = getCritterCropStyle(entry.id);
    avatar.appendChild(img);

    const pillar = document.createElement('div');
    pillar.className = 'podium-pillar';
    pillar.innerHTML = `<svg class="podium-medal-svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="${medalColors[idx]}" stroke="#3f6212" stroke-width="2.5"/><path d="M18 9l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8z" fill="#fffbeb"/></svg>`;

    col.appendChild(avatar);
    col.appendChild(pillar);
    modalPodiumRowEl.appendChild(col);
  });

  btnModalNextEl.disabled = !state.canAdvance;
  waveModalBackdropEl.classList.add('open');
}

// ============================================================================
// Pointer & Touch 1:1 Direct Manipulation (Lens Drag, Shovel Drag, Bun Drag + Tap)
// ============================================================================

function handleStationTap(stationId) {
  if (!stationId || state.waveFinished) return false;
  if (stationId === 'magic_lens') {
    return scanExplorerWithLens(-1);
  }
  if (stationId.startsWith('explorer_')) {
    const idx = Number(stationId.replace('explorer_', ''));
    const exp = state.explorers[idx];
    if (!exp || !exp.active) return false;
    if (!exp.revealed) return scanExplorerWithLens(idx);
    // If already revealed and mound is dug, swap bun!
    const mIdx = EMBLEM_TYPES.indexOf(exp.targetEmblem);
    if (mIdx >= 0 && state.mounds[mIdx].state === 'dug_chest') {
      return swapBunIntoMound(mIdx);
    }
    if (mIdx >= 0 && state.mounds[mIdx].state === 'intact') {
      return digMoundWithShovel(mIdx);
    }
    return false;
  }
  if (stationId === 'golden_shovel') {
    return digMoundWithShovel(-1);
  }
  if (stationId === 'bun_steamer') {
    return swapBunIntoMound(-1);
  }
  if (stationId.startsWith('mound_')) {
    const idx = Number(stationId.replace('mound_', ''));
    const m = state.mounds[idx];
    if (m.state === 'intact') {
      return digMoundWithShovel(idx);
    }
    if (m.state === 'dug_chest' || m.state === 'empty_pit') {
      return swapBunIntoMound(idx);
    }
  }
  return false;
}

canvas.addEventListener('pointerdown', (e) => {
  if (state.waveFinished || state.modalOpen) return;
  BunSwapAudio.init();
  const stationId = sceneApi.pickStationAtClientPos(e.clientX, e.clientY);
  sceneApi.screenToWorldOnTable(e.clientX, e.clientY, state.toolWorldPos);

  if (stationId === 'magic_lens') {
    state.activeTool = 'lens';
    return;
  }
  if (stationId === 'golden_shovel') {
    state.activeTool = 'shovel';
    return;
  }
  if (stationId === 'bun_steamer') {
    state.activeTool = 'bun';
    return;
  }

  handleStationTap(stationId);
});

window.addEventListener('pointermove', (e) => {
  if (!state.activeTool) return;
  sceneApi.screenToWorldOnTable(e.clientX, e.clientY, state.toolWorldPos);
  const overStation = sceneApi.pickStationAtClientPos(e.clientX, e.clientY);

  if (state.activeTool === 'lens' && overStation && overStation.startsWith('explorer_')) {
    const idx = Number(overStation.replace('explorer_', ''));
    scanExplorerWithLens(idx);
  } else if (state.activeTool === 'shovel' && overStation && overStation.startsWith('mound_')) {
    const idx = Number(overStation.replace('mound_', ''));
    digMoundWithShovel(idx);
  }
});

window.addEventListener('pointerup', (e) => {
  if (!state.activeTool) return;
  const tool = state.activeTool;
  state.activeTool = null;
  const dropStation = sceneApi.pickStationAtClientPos(e.clientX, e.clientY);

  if (tool === 'lens') {
    if (dropStation && dropStation.startsWith('explorer_')) {
      scanExplorerWithLens(Number(dropStation.replace('explorer_', '')));
    } else {
      scanExplorerWithLens(-1);
    }
  } else if (tool === 'shovel') {
    if (dropStation && dropStation.startsWith('mound_')) {
      digMoundWithShovel(Number(dropStation.replace('mound_', '')));
    } else {
      digMoundWithShovel(-1);
    }
  } else if (tool === 'bun') {
    if (dropStation && dropStation.startsWith('mound_')) {
      swapBunIntoMound(Number(dropStation.replace('mound_', '')));
    } else {
      swapBunIntoMound(-1);
    }
  }
});

// UI Buttons
btnMuteEl.addEventListener('click', () => {
  const isMuted = BunSwapAudio.toggleMute();
  iconSoundOnEl.style.display = isMuted ? 'none' : 'block';
  iconSoundOffEl.style.display = isMuted ? 'block' : 'none';
});

btnRestartWaveEl.addEventListener('click', () => {
  startWave(state.wave);
});

wavePillEl.addEventListener('click', () => {
  scanExplorerWithLens(-1);
});

btnModalReplayEl.addEventListener('click', () => {
  startWave(state.wave);
});

btnModalNextEl.addEventListener('click', () => {
  if (!state.canAdvance) return;
  const nextW = state.wave < 3 ? state.wave + 1 : 1;
  startWave(nextW);
});

// ============================================================================
// Simulation Step & Guide Hand Loop
// ============================================================================

function stepSimulation(dt) {
  state.elapsed += dt;
  if (state.waveFinished) return;

  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) state.comboCount = 0;
  }

  for (const m of state.mounds) {
    if (m.state === 'bun_swapped' && m.resetTimer > 0) {
      m.resetTimer -= dt;
      if (m.resetTimer <= 0) {
        m.state = 'intact';
      }
    }
  }

  // Explorer patience countdown
  for (let i = 0; i < 2; i++) {
    const exp = state.explorers[i];
    if (!exp.active) continue;
    exp.patience -= dt;
    if (exp.patience <= 0) {
      state.orderOutcomes[exp.orderIndex] = 'missed';
      state.comboCount = 0;
      state.comboTimer = 0;
      exp.active = false;
      fillEmptyExplorerSeats();
      checkWaveEndCondition();
    }
  }

  // Animated Guide Hand for idle 5yo assistance
  state.guideTimer += dt;
  if (state.guideTimer > 3.2 && !state.activeTool) {
    const unrev = state.explorers.find((e) => e.active && !e.revealed);
    const dugMound = state.mounds.find((m) => m.state === 'dug_chest');
    let targetSid = 'magic_lens';
    if (dugMound) targetSid = 'bun_steamer';
    else if (!unrev) targetSid = 'golden_shovel';
    const pt = sceneApi.getStationScreenRect(targetSid);
    guideHandEl.style.transform = `translate3d(${pt.x - 12}px, ${pt.y - 8}px, 0)`;
    guideHandEl.classList.add('visible');
  } else {
    guideHandEl.classList.remove('visible');
  }

  updateTopHud();
}

let lastFrameTs = performance.now();
function animate(now) {
  const dt = Math.max(0.001, Math.min(0.05, (now - lastFrameTs) / 1000));
  lastFrameTs = now;
  stepSimulation(dt);
  sceneApi.syncAndRender(state, dt, state.elapsed);
  requestAnimationFrame(animate);
}

startWave(1);
requestAnimationFrame(animate);

// ============================================================================
// Automated Verification & Bot Balance Harness (window.__gameTest)
// ============================================================================
window.__gameTest = {
  getState() {
    return {
      wave: state.wave,
      coins: state.coins,
      comboCount: state.comboCount,
      waveFinished: state.waveFinished,
      modalOpen: state.modalOpen,
      canAdvance: state.canAdvance,
      playerRank: state.playerRank,
      earnedStars: state.earnedStars,
      orderOutcomes: [...state.orderOutcomes],
      mounds: state.mounds.map((m) => ({
        id: m.id,
        emblemType: m.emblemType,
        state: m.state,
      })),
      explorers: state.explorers.map((e) => ({
        id: e.id,
        active: e.active,
        friend: e.friend,
        targetEmblem: e.targetEmblem,
        revealed: e.revealed,
        patience: Number(e.patience.toFixed(1)),
      })),
    };
  },
  stepTime(ms = 1000) {
    const step = 1 / 60;
    let rem = ms / 1000;
    while (rem > 0) {
      const d = Math.min(step, rem);
      stepSimulation(d);
      rem -= d;
    }
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return this.getState();
  },
  scanExplorer(expIdx = 0) {
    const ok = scanExplorerWithLens(expIdx);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  digMound(moundIdx = 0) {
    const ok = digMoundWithShovel(moundIdx);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  swapBunIntoMound(moundIdx = 0) {
    const ok = swapBunIntoMound(moundIdx);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  autoPlayExplorer(expSlot = 0) {
    const exp = (state.explorers[expSlot] && state.explorers[expSlot].active)
      ? state.explorers[expSlot]
      : state.explorers.find((e) => e.active);
    if (!exp || !exp.active) return false;
    scanExplorerWithLens(exp.slotIndex);
    const mIdx = EMBLEM_TYPES.indexOf(exp.targetEmblem);
    if (mIdx < 0) return false;
    digMoundWithShovel(mIdx);
    return swapBunIntoMound(mIdx);
  },
  forceWaveComplete(mockCoins = 260) {
    state.coins = mockCoins;
    state.orderOutcomes = new Array(8).fill('served');
    checkWaveEndCondition();
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return this.getState();
  },
  restartWave(waveNum = 1) {
    startWave(waveNum);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return this.getState();
  },
};
