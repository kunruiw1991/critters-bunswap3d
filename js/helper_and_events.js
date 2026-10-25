/**
 * Critter Treasure Scoop 3D: Magic Lens & Bun Swap!
 * Pillar 2 Module: Friendly Hoppy Hopscotch Garden Helper Buddy,
 * Golden Bun Party Fever Surprise Treasure Event, & Non-IBL Material Hygiene.
 */

import { buildHoppyHopscotchPlushModel } from '../models/hoppy_hopscotch_model.js';
import { BunSwapAudio } from './audio.js';

export const HELPER_BUDDY_POS = { x: 0.0, y: 0.55, z: -1.65 };

/**
 * Traverses a Three.js Object3D hierarchy and clamps all material metalness <= 0.22
 * when scene.environment === null (including asynchronously loaded GLB meshes).
 */
export function enforceNonIblMaterialHygiene(root) {
  if (!root || typeof root.traverse !== 'function') return;
  root.traverse((obj) => {
    if (!obj || !obj.isMesh || !obj.material) return;
    if (Array.isArray(obj.material)) {
      for (const m of obj.material) {
        if (m && typeof m.metalness === 'number' && m.metalness > 0.22) {
          m.metalness = 0.22;
        }
      }
    } else if (typeof obj.material.metalness === 'number' && obj.material.metalness > 0.22) {
      obj.material.metalness = 0.22;
    }
  });
}

/**
 * Creates the initial Pillar 2 state fields to merge into game state.
 */
export function createHelperAndEventsState() {
  return {
    helperTimer: 0,
    helperAssists: 0,
    helperCooldown: 0,
    helperCheerTimer: 0,
    feverTimer: 0,
    feverActive: false,
    feverTriggeredCount: 0,
  };
}

/**
 * Builds the 3D Hoppy Hopscotch Garden Helper Buddy (`helperGroup` at (0.0, 0.55, -1.65))
 * and the 3D Golden Bun Party Fever Floating Treasure Chest & Rainbow Aura (`feverGroup`).
 */
export function createBunswapHelperAndEvents(THREE, scene, stageGroup) {
  const parentGroup = stageGroup || scene;

  // ==========================================================================
  // 1. 3D Hoppy Hopscotch Garden Helper Buddy at (0.0, 0.55, -1.65)
  // ==========================================================================
  const helperGroup = new THREE.Group();
  helperGroup.name = 'BunSwap_HelperBuddy_Group';
  helperGroup.position.set(HELPER_BUDDY_POS.x, HELPER_BUDDY_POS.y, HELPER_BUDDY_POS.z);
  if (parentGroup) parentGroup.add(helperGroup);

  const jadeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x047857,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    metalness: 0.16,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xb45309,
    emissiveIntensity: 0.38,
    roughness: 0.26,
    metalness: 0.22,
  });
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.52,
    metalness: 0.08,
  });
  const bunCreamMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xca8a04,
    emissiveIntensity: 0.26,
    roughness: 0.42,
    metalness: 0.04,
  });

  // Jade & Gold Lotus Pedestal Cushion under Helper Buddy
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 0.16, 24), jadeMat);
  pedestal.position.set(0, -0.46, 0);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  helperGroup.add(pedestal);

  const pedestalTrim = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.045, 12, 28), goldMat);
  pedestalTrim.rotation.x = Math.PI * 0.5;
  pedestalTrim.position.set(0, -0.39, 0);
  helperGroup.add(pedestalTrim);

  // Character pivot for cheerful hop & spin animations
  const charPivot = new THREE.Group();
  helperGroup.add(charPivot);

  const hoppyModel = buildHoppyHopscotchPlushModel(THREE);
  hoppyModel.root.scale.setScalar(0.58);
  hoppyModel.root.position.set(0, -0.42, 0);
  charPivot.add(hoppyModel.root);

  // Miniature Bamboo Steamer Hat with Golden Bun on Hoppy's Head
  const steamerHat = new THREE.Group();
  steamerHat.position.set(0, 0.92, 0.02);
  charPivot.add(steamerHat);

  const hatBasket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.10, 20), bambooMat);
  steamerHat.add(hatBasket);

  const hatRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 10, 24), goldMat);
  hatRim.rotation.x = Math.PI * 0.5;
  hatRim.position.y = 0.05;
  steamerHat.add(hatRim);

  const miniBun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), bunCreamMat);
  miniBun.scale.set(1.15, 0.78, 1.15);
  miniBun.position.y = 0.08;
  steamerHat.add(miniBun);

  // Glowing Golden Helper Halo & Orbiting Starlight Orbs
  const helperHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.032, 12, 28),
    new THREE.MeshBasicMaterial({ color: 0xfde047 })
  );
  helperHalo.rotation.x = Math.PI * 0.5;
  helperHalo.position.set(0, 1.18, 0);
  charPivot.add(helperHalo);

  const orbGroup = new THREE.Group();
  orbGroup.position.set(0, 0.35, 0);
  helperGroup.add(orbGroup);

  const orbColors = [0xfacc15, 0x38bdf8, 0xf472b6];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085, 0),
      new THREE.MeshBasicMaterial({ color: orbColors[i] })
    );
    orb.position.set(Math.cos(a) * 0.62, 0.12 * (i % 2), Math.sin(a) * 0.62);
    orbGroup.add(orb);
  }

  // Expanding Assist Pulse Ring around Helper Buddy
  const assistWaveMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
  });
  const assistWaveRing = new THREE.Mesh(new THREE.RingGeometry(0.52, 0.66, 32), assistWaveMat);
  assistWaveRing.rotation.x = -Math.PI * 0.5;
  assistWaveRing.position.set(0, -0.36, 0);
  helperGroup.add(assistWaveRing);

  // ==========================================================================
  // 2. 3D Golden Bun Party Fever Floating Treasure Chest & Rainbow Aura
  // ==========================================================================
  const feverGroup = new THREE.Group();
  feverGroup.name = 'BunSwap_PartyFever_Group';
  feverGroup.position.set(0.0, 1.72, -0.45);
  feverGroup.visible = false;
  if (parentGroup) parentGroup.add(feverGroup);

  const chestGroup = new THREE.Group();
  feverGroup.add(chestGroup);

  const redLacquerMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.28,
    roughness: 0.35,
    metalness: 0.18,
  });

  const chestBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.32, 0.42), redLacquerMat);
  chestBase.castShadow = true;
  chestGroup.add(chestBase);

  const chestLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.21, 0.58, 16, 1, false, 0, Math.PI),
    goldMat
  );
  chestLid.rotation.z = Math.PI * 0.5;
  chestLid.position.set(0, 0.18, -0.04);
  chestLid.rotation.x = -0.35;
  chestGroup.add(chestLid);

  const chestStarCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  chestStarCore.position.set(0, 0.28, 0.04);
  chestGroup.add(chestStarCore);

  // 4 Orbiting Golden Deluxe Buns around the Fever Treasure Chest
  const feverBunCarousel = new THREE.Group();
  feverGroup.add(feverBunCarousel);

  const rainbowRingColors = [0xfacc15, 0xf472b6, 0x38bdf8, 0x4ade80];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const fb = new THREE.Group();
    fb.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
    const bunBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), bunCreamMat);
    bunBody.scale.set(1.18, 0.78, 1.18);
    fb.add(bunBody);
    const bunGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      new THREE.MeshBasicMaterial({ color: rainbowRingColors[i] })
    );
    bunGem.position.y = 0.16;
    fb.add(bunGem);
    feverBunCarousel.add(fb);
  }

  // Concentric Rainbow Aura Rings
  const feverOuterRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.04, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.85 })
  );
  feverOuterRing.rotation.x = Math.PI * 0.5;
  feverGroup.add(feverOuterRing);

  const feverInnerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.032, 12, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.80 })
  );
  feverInnerRing.rotation.x = Math.PI * 0.5;
  feverGroup.add(feverInnerRing);

  enforceNonIblMaterialHygiene(helperGroup);
  enforceNonIblMaterialHygiene(feverGroup);

  function syncHelperAndEvents(state, dt, elapsed) {
    // 1. Animate Hoppy Hopscotch Helper Buddy
    const cheerBoost = (state.helperCheerTimer || 0) > 0 ? 1.0 : 0.0;
    const hopFreq = cheerBoost > 0 ? 12.0 : 4.6;
    const hopAmp = cheerBoost > 0 ? 0.18 : 0.065;
    charPivot.position.y = Math.abs(Math.sin(elapsed * hopFreq)) * hopAmp;
    charPivot.rotation.y = cheerBoost > 0
      ? Math.sin(elapsed * 10.0) * 0.45
      : Math.sin(elapsed * 2.2) * 0.18;

    helperHalo.rotation.z = elapsed * 3.0;
    orbGroup.rotation.y = elapsed * (cheerBoost > 0 ? 4.8 : 2.1);

    if (cheerBoost > 0) {
      const p = 1.0 - Math.min(1.0, (state.helperCheerTimer || 0) / 1.4);
      assistWaveRing.scale.setScalar(1.0 + p * 1.4);
      assistWaveMat.opacity = Math.max(0, (1.0 - p) * 0.75);
    } else {
      assistWaveRing.scale.setScalar(1.0 + Math.sin(elapsed * 4.0) * 0.06);
      assistWaveMat.opacity = 0.22;
    }

    // 2. Animate Golden Bun Party Fever Treasure Chest & Rainbow Aura
    const isFever = Boolean(state.feverActive && (state.feverTimer || 0) > 0);
    feverGroup.visible = isFever;
    if (isFever) {
      feverGroup.position.y = 1.68 + Math.sin(elapsed * 5.0) * 0.12;
      chestGroup.rotation.y = Math.sin(elapsed * 2.6) * 0.35;
      chestStarCore.rotation.y = elapsed * 4.5;
      chestStarCore.rotation.x = elapsed * 3.2;
      feverBunCarousel.rotation.y = -elapsed * 3.2;
      feverOuterRing.rotation.z = elapsed * 2.5;
      feverInnerRing.rotation.z = -elapsed * 3.5;
      const pulse = 1.0 + Math.sin(elapsed * 8.0) * 0.08;
      feverOuterRing.scale.setScalar(pulse);
    }

    enforceNonIblMaterialHygiene(scene || parentGroup);
  }

  return {
    helperGroup,
    feverGroup,
    syncHelperAndEvents,
  };
}

/**
 * Helper utility to execute the single most helpful next action for a 5yo player.
 */
function performHelpfulAssistStep(state, callbacks = {}) {
  if (!state || state.waveFinished) return false;

  // Priority 1: If any active explorer is unrevealed, scan & reveal them + boost patience!
  const unrevealedExp = (state.explorers || []).find((e) => e && e.active && !e.revealed);
  if (unrevealedExp) {
    unrevealedExp.patience = Math.min(unrevealedExp.maxPatience || 26, unrevealedExp.patience + 2.5);
    if (typeof callbacks.onScanExplorer === 'function') {
      callbacks.onScanExplorer(unrevealedExp.slotIndex);
    } else {
      unrevealedExp.revealed = true;
    }
    return true;
  }

  // Priority 2: If any mound is already dug ('dug_chest'), glaze & swap a deluxe bun into it!
  const dugMound = (state.mounds || []).find((m) => m && m.state === 'dug_chest');
  if (dugMound) {
    state.bunGlazeCharges = Math.max(state.bunGlazeCharges || 0, 1);
    state.deluxeBunReady = true;
    if (typeof callbacks.onSwapBun === 'function') {
      callbacks.onSwapBun(dugMound.index);
    }
    return true;
  }

  // Priority 3: If an active revealed explorer wants an intact mound, scoop it with the Golden Shovel!
  const activeExp = (state.explorers || []).find((e) => e && e.active);
  if (activeExp) {
    activeExp.patience = Math.min(activeExp.maxPatience || 26, activeExp.patience + 2.5);
    const targetMound = (state.mounds || []).find(
      (m) => m && m.emblemType === activeExp.targetEmblem && m.state === 'intact'
    );
    if (targetMound && typeof callbacks.onDigMound === 'function') {
      callbacks.onDigMound(targetMound.index);
      return true;
    }
  }

  return false;
}

/**
 * Steps the Helper Buddy auto-assist timer and Golden Bun Party Fever countdown.
 * Every 6.5s (or when any active explorer's patience ratio < 0.65), Hoppy auto-assists!
 */
export function stepHelperAndEvents(state, dt, callbacks = {}) {
  if (!state || state.waveFinished) return;

  state.helperTimer = (state.helperTimer || 0) + dt;
  state.helperCooldown = Math.max(0, (state.helperCooldown || 0) - dt);
  state.helperCheerTimer = Math.max(0, (state.helperCheerTimer || 0) - dt);

  // Update Party Fever timer & halve explorer patience decay while Fever is active
  if ((state.feverTimer || 0) > 0) {
    state.feverTimer = Math.max(0, state.feverTimer - dt);
    state.feverActive = state.feverTimer > 0;
    if (state.feverActive && Array.isArray(state.explorers)) {
      for (const exp of state.explorers) {
        if (exp && exp.active) {
          exp.patience = Math.min(exp.maxPatience || 26, exp.patience + dt * 0.5);
        }
      }
    }
  } else {
    state.feverActive = false;
  }

  // Check if any active explorer has patience ratio < 0.65
  const lowPatienceExp = (state.explorers || []).find(
    (e) => e && e.active && (e.patience / Math.max(1, e.maxPatience || 26)) < 0.65
  );

  const shouldAssist =
    state.helperTimer >= 6.5 || (Boolean(lowPatienceExp) && state.helperCooldown <= 0);

  if (shouldAssist) {
    state.helperTimer = 0;
    state.helperCooldown = 3.2;
    const isIdleOrUrgent = (state.guideTimer === undefined || state.guideTimer >= 1.8) || Boolean(lowPatienceExp);
    let assisted = false;
    if (isIdleOrUrgent) {
      assisted = performHelpfulAssistStep(state, callbacks);
    } else {
      // Player is actively tapping rapidly (< 1.8s between taps): cheer, refill glaze charges, and boost patience without stealing their active mound mid-tap!
      state.bunGlazeCharges = Math.max(state.bunGlazeCharges || 0, 2);
      state.deluxeBunReady = true;
      for (const exp of state.explorers || []) {
        if (exp && exp.active) {
          exp.patience = Math.min(exp.maxPatience || 26, exp.patience + 2.5);
          assisted = true;
        }
      }
    }
    if (assisted) {
      state.helperAssists = (state.helperAssists || 0) + 1;
      state.helperCheerTimer = 1.1;
      if (BunSwapAudio && typeof BunSwapAudio.playHelperCheer === 'function') {
        BunSwapAudio.playHelperCheer();
      }
    }
  }
}

/**
 * Direct tap on Helper Buddy (or window.__gameTest.triggerHelperBuddy()):
 * Grants +15 bonus coins, charges 3 Glazed Deluxe Buns, performs an immediate
 * helpful scan/dig/bun assist, increments state.helperAssists, and plays cheer audio.
 */
export function triggerHelperBuddyTap(state, callbacks = {}) {
  if (!state || state.waveFinished) return false;

  state.bunGlazeCharges = 3;
  state.deluxeBunReady = true;
  state.helperAssists = (state.helperAssists || 0) + 1;
  state.helperTimer = 0;
  state.helperCooldown = 2.5;
  state.helperCheerTimer = 1.4;

  if (Array.isArray(state.explorers)) {
    for (const exp of state.explorers) {
      if (exp && exp.active) {
        exp.patience = Math.min(exp.maxPatience || 26, exp.patience + 3.0);
      }
    }
  }

  if (typeof callbacks.onAddCoins === 'function') {
    callbacks.onAddCoins(15, 'helper_buddy');
  } else {
    state.coins = (state.coins || 0) + 15;
    state.totalCoinsAllWaves = (state.totalCoinsAllWaves || 0) + 15;
  }
  if (typeof callbacks.onSpawnCoins === 'function') {
    callbacks.onSpawnCoins('helper_buddy', 3);
  }

  performHelpfulAssistStep(state, callbacks);

  if (BunSwapAudio && typeof BunSwapAudio.playHelperCheer === 'function') {
    BunSwapAudio.playHelperCheer();
  }
  return true;
}

/**
 * Triggers the Golden Bun Party Fever Surprise Event:
 * Sets feverTimer = 6.0s, feverActive = true, increments feverTriggeredCount,
 * grants +20 surprise bonus coins, charges 3 Glazed Deluxe Buns, and plays fever chime.
 */
export function triggerSurpriseFeverEvent(state, callbacks = {}) {
  if (!state || state.waveFinished) return false;

  state.feverTimer = 6.0;
  state.feverActive = true;
  state.feverTriggeredCount = (state.feverTriggeredCount || 0) + 1;
  state.bunGlazeCharges = 3;
  state.deluxeBunReady = true;
  state.helperCheerTimer = 1.4;

  if (Array.isArray(state.explorers)) {
    for (const exp of state.explorers) {
      if (exp && exp.active) {
        exp.patience = Math.min(exp.maxPatience || 26, exp.patience + 3.5);
      }
    }
  }

  if (typeof callbacks.onAddCoins === 'function') {
    callbacks.onAddCoins(20, 'helper_buddy');
  } else {
    state.coins = (state.coins || 0) + 20;
    state.totalCoinsAllWaves = (state.totalCoinsAllWaves || 0) + 20;
  }
  if (typeof callbacks.onSpawnCoins === 'function') {
    callbacks.onSpawnCoins('helper_buddy', 4);
  }

  if (BunSwapAudio && typeof BunSwapAudio.playFeverChime === 'function') {
    BunSwapAudio.playFeverChime();
  }
  return true;
}
