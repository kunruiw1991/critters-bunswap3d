import * as THREE from '../models/three.module.min.js';
import { buildCatNapPlushModel } from '../models/catnap_model.js';
import { buildDogDayPlushModel } from '../models/dogday_model.js';
import { buildBabaChopsPlushModel } from '../models/baba_chops_model.js';
import { buildHoppyHopscotchPlushModel } from '../models/hoppy_hopscotch_model.js';
import { buildCraftyCornPlushModel } from '../models/craftycorn_model.js';
import { buildPickyPiggyPlushModel } from '../models/picky_piggy_model.js';
import { buildBubbaBubbaphantPlushModel } from '../models/bubba_bubbaphant_model.js';
import { buildKickinChickenPlushModel } from '../models/kickin_chicken_model.js';
import { enforceNonIblMaterialHygiene, createBunswapHelperAndEvents } from './helper_and_events.js';

export const EMBLEM_TYPES = ['star', 'moon', 'ruby', 'clover'];

const CRITTER_MODEL_BUILDERS = {
  dogday: buildDogDayPlushModel,
  catnap: buildCatNapPlushModel,
  baba: buildBabaChopsPlushModel,
  hoppy: buildHoppyHopscotchPlushModel,
  craftycorn: buildCraftyCornPlushModel,
  picky: buildPickyPiggyPlushModel,
  bubba: buildBubbaBubbaphantPlushModel,
  kickin: buildKickinChickenPlushModel,
};

export const STATION_IDS = [
  'mound_0',
  'mound_1',
  'mound_2',
  'mound_3',
  'magic_lens',
  'garden_gong',
  'golden_shovel',
  'sauce_pot',
  'bun_steamer',
  'helper_buddy',
  'explorer_0',
  'explorer_1',
];

export const STATION_COORDS = {
  mound_0: new THREE.Vector3(-2.65, 0.24, 0.32),
  mound_1: new THREE.Vector3(-0.88, 0.24, 0.32),
  mound_2: new THREE.Vector3(0.88, 0.24, 0.32),
  mound_3: new THREE.Vector3(2.65, 0.24, 0.32),
  magic_lens: new THREE.Vector3(-2.35, 0.56, 1.82),
  garden_gong: new THREE.Vector3(-1.18, 0.42, 1.85),
  golden_shovel: new THREE.Vector3(0.0, 0.48, 1.88),
  sauce_pot: new THREE.Vector3(1.18, 0.34, 1.85),
  bun_steamer: new THREE.Vector3(2.35, 0.28, 1.82),
  helper_buddy: new THREE.Vector3(0.0, 0.55, -1.65),
  explorer_0: new THREE.Vector3(-1.55, 0.78, -1.72),
  explorer_1: new THREE.Vector3(1.55, 0.78, -1.72),
};

export const CRITTER_CROP_BOXES = {
  baba: [0.04, 0.02, 0.92, 0.96],
  craftycorn: [0.12, 0.03, 0.76, 0.92],
  dogday: [0.49, 0.11, 0.25, 0.43],
  catnap: [0.51, 0.17, 0.20, 0.51],
  hoppy: [0.25, 0.06, 0.26, 0.58],
  picky: [0.24, 0.20, 0.24, 0.43],
  bubba: [0.22, 0.10, 0.25, 0.56],
  kickin: [0.31, 0.22, 0.18, 0.58],
};

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createCritterStandeeTexture(critterId) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  function drawFrame(img) {
    ctx.clearRect(0, 0, 256, 256);
    ctx.save();
    drawRoundedRectPath(ctx, 12, 10, 232, 236, 56);
    ctx.fillStyle = '#3f6212';
    ctx.fill();

    drawRoundedRectPath(ctx, 18, 16, 220, 224, 50);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    drawRoundedRectPath(ctx, 25, 23, 206, 210, 44);
    ctx.fillStyle = '#fffbeb';
    ctx.fill();
    ctx.clip();

    const grad = ctx.createRadialGradient(128, 122, 16, 128, 128, 110);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(25, 23, 206, 210);

    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const [ux, uy, uw, uh] = CRITTER_CROP_BOXES[critterId] || [0.1, 0.05, 0.8, 0.85];
      const sx = Math.max(0, Math.floor(ux * img.naturalWidth));
      const sy = Math.max(0, Math.floor(uy * img.naturalHeight));
      const sw = Math.max(1, Math.floor(uw * img.naturalWidth));
      const sh = Math.max(1, Math.floor(uh * img.naturalHeight));

      ctx.save();
      ctx.filter = 'brightness(1.22) contrast(1.12) saturate(1.32)';
      ctx.drawImage(img, sx, sy, sw, sh, 25, 23, 206, 210);
      ctx.restore();
    }
    ctx.restore();
    tex.needsUpdate = true;
  }

  drawFrame(null);
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawFrame(img);
    img.src = `./assets/${critterId}.png`;
  }
  return tex;
}

/**
 * Builds one of the 4 unmistakable 3D Mound Emblems: 'star', 'moon', 'ruby', 'clover'
 */
export function buildEmblemMesh(emblemType) {
  const group = new THREE.Group();

  if (emblemType === 'star') {
    // Golden Sun-Star Crystal
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.20,
    });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), mat);
    group.add(core);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 8), mat);
      ray.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0);
      ray.rotation.z = a - Math.PI * 0.5;
      group.add(ray);
    }
  } else if (emblemType === 'moon') {
    // Purple Crescent-Moon Crystal
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.5,
      roughness: 0.24,
      metalness: 0.18,
    });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.075, 14, 24, Math.PI * 1.35), mat);
    arc.rotation.z = 0.4;
    group.add(arc);
  } else if (emblemType === 'ruby') {
    // Crimson Heart-Ruby Gem
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      emissiveIntensity: 0.48,
      roughness: 0.16,
      metalness: 0.16,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), mat);
    gem.scale.set(0.95, 1.25, 0.78);
    group.add(gem);
  } else {
    // Emerald Four-Leaf Clover Crystal
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x15803d,
      emissiveIntensity: 0.45,
      roughness: 0.24,
      metalness: 0.15,
    });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), mat);
      leaf.scale.set(1.1, 1.1, 0.55);
      leaf.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
      group.add(leaf);
    }
  }

  return group;
}

/**
 * Builds the 3D Golden Imperial Treasure Chest ("帝兵金宝箱")
 */
export function buildTreasureChestMesh() {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.38,
    roughness: 0.25,
    metalness: 0.22,
  });
  const redWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.42,
    metalness: 0.18,
  });
  const gemCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.30, 0.38), redWoodMat);
  box.position.y = 0.15;
  box.castShadow = true;
  group.add(box);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.52, 16, 1, false, 0, Math.PI), goldMat);
  lid.rotation.z = Math.PI * 0.5;
  lid.position.y = 0.30;
  group.add(lid);

  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.06), goldMat);
  lock.position.set(0, 0.26, 0.20);
  group.add(lock);

  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), gemCyanMat);
  gem.position.set(0, 0.26, 0.24);
  group.add(gem);

  return group;
}

/**
 * Builds the Plump 3D Steamed Bun ("热腾腾大包子") with pleated top folds and optional Golden Honey-Berry Glaze!
 */
export function buildSteamedBunMesh(isGolden = false) {
  const group = new THREE.Group();
  const bunMat = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xfde047 : 0xfffbeb,
    emissive: isGolden ? 0xca8a04 : 0xfef3c7,
    emissiveIntensity: 0.18,
    roughness: 0.46,
    metalness: 0.02,
  });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 16), bunMat);
  body.scale.set(1.18, 0.78, 1.18);
  body.position.y = 0.18;
  body.castShadow = true;
  group.add(body);

  // Cute top swirl pleats
  const topKnob = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.08, 8), bunMat);
  topKnob.position.y = 0.39;
  group.add(topKnob);

  // Cute pink cheek dot on top of the bun
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), blushMat);
  dot.position.set(0, 0.42, 0);
  group.add(dot);

  // Deluxe Golden Honey & Sakura Berry Glaze Swirl Overlay (shown when glazed!)
  const glazeGroup = new THREE.Group();
  glazeGroup.visible = false;
  const glazeHoneyMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.18,
  });
  const glazeBerryMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.45,
    roughness: 0.22,
    metalness: 0.12,
  });
  const glazeRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.042, 12, 24), glazeHoneyMat);
  glazeRing.rotation.x = Math.PI * 0.5;
  glazeRing.position.y = 0.33;
  glazeGroup.add(glazeRing);

  for (let s = 0; s < 4; s++) {
    const a = (s / 4) * Math.PI * 2;
    const starGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.048, 0),
      s % 2 === 0 ? glazeHoneyMat : glazeBerryMat
    );
    starGem.position.set(Math.cos(a) * 0.19, 0.36, Math.sin(a) * 0.19);
    glazeGroup.add(starGem);
  }
  group.add(glazeGroup);
  group.userData = { bunMat, glazeGroup, defaultGolden: isGolden };

  return group;
}

/**
 * Builds the 3D Golden Honey & Sakura Berry Glaze Pot ("蜜汁樱花酱点心壶") at sauce_pot
 */
function buildSaucePotMesh() {
  const group = new THREE.Group();
  const coasterMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.62, metalness: 0.08 });
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0x881337,
    emissiveIntensity: 0.28,
    roughness: 0.26,
    metalness: 0.16,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xb45309,
    emissiveIntensity: 0.42,
    roughness: 0.22,
    metalness: 0.22,
  });
  const honeyPoolMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.14,
  });
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xdb2777,
    emissiveIntensity: 0.48,
    roughness: 0.22,
    metalness: 0.10,
  });

  // Woven bamboo coaster base
  const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.54, 0.08, 24), coasterMat);
  coaster.position.y = -0.22;
  coaster.receiveShadow = true;
  group.add(coaster);

  // Plump ceramic honey pot belly
  const potBelly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 22, 16), ceramicMat);
  potBelly.scale.set(1.12, 0.86, 1.12);
  potBelly.position.y = 0.02;
  potBelly.castShadow = true;
  group.add(potBelly);

  // Golden rim collar
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.055, 14, 28), goldTrimMat);
  potRim.rotation.x = Math.PI * 0.5;
  potRim.position.y = 0.26;
  group.add(potRim);

  // Bubbling golden honey surface inside pot
  const honeySurface = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 22), honeyPoolMat);
  honeySurface.position.y = 0.25;
  group.add(honeySurface);

  // Dripping golden honey droplets around rim
  for (let d = 0; d < 6; d++) {
    const ang = (d / 6) * Math.PI * 2;
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), honeyPoolMat);
    drop.scale.set(0.85, 1.35, 0.85);
    drop.position.set(Math.cos(ang) * 0.34, 0.19 - (d % 2) * 0.04, Math.sin(ang) * 0.34);
    group.add(drop);
  }

  // Honey dipper wand + orbiting sakura berry & star sparkles
  const dipperGroup = new THREE.Group();
  dipperGroup.position.set(0, 0.34, 0);
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.48, 10),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.48, metalness: 0.05 })
  );
  stick.rotation.z = -0.38;
  stick.position.set(0.08, 0.14, 0);
  dipperGroup.add(stick);

  const dipperHead = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), honeyPoolMat);
  dipperHead.scale.set(1.0, 1.25, 1.0);
  dipperHead.position.set(-0.02, 0.02, 0);
  dipperGroup.add(dipperHead);

  const sparkleRingGroup = new THREE.Group();
  sparkleRingGroup.position.y = 0.16;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const sp = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.065, 0),
      i % 2 === 0 ? goldTrimMat : berryMat
    );
    sp.position.set(Math.cos(a) * 0.28, (i % 2) * 0.05, Math.sin(a) * 0.28);
    sparkleRingGroup.add(sp);
  }
  dipperGroup.add(sparkleRingGroup);
  group.add(dipperGroup);

  group.userData = { dipperGroup, sparkleRingGroup, honeyPoolMat };
  return group;
}

/**
 * Builds the 3D Lucky Garden Windbell & Temple Gong ("祈福金锣") at garden_gong
 */
function buildGardenGongMesh() {
  const group = new THREE.Group();
  const redLacquerMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.25,
    roughness: 0.32,
    metalness: 0.14,
  });
  const gongGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.48,
    roughness: 0.20,
    metalness: 0.22,
  });
  const jadeMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x059669,
    emissiveIntensity: 0.38,
    roughness: 0.24,
    metalness: 0.15,
  });

  // Base pedestal
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.09, 0.46), redLacquerMat);
  basePlate.position.y = -0.32;
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;
  group.add(basePlate);

  // Two vertical vermilion pillars
  for (const px of [-0.34, 0.34]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.84, 12), redLacquerMat);
    pillar.position.set(px, 0.10, 0);
    pillar.castShadow = true;
    group.add(pillar);
  }

  // Curved top crossbeams (Torii style)
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.075, 0.12), redLacquerMat);
  topBeam.position.set(0, 0.52, 0);
  group.add(topBeam);

  const subBeam = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, 0.09), gongGoldMat);
  subBeam.position.set(0, 0.41, 0);
  group.add(subBeam);

  // Suspended Golden Gong Disc + Central Sun Boss
  const gongDiscGroup = new THREE.Group();
  gongDiscGroup.position.set(0, 0.08, 0);
  const gongDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.045, 28), gongGoldMat);
  gongDisc.rotation.x = Math.PI * 0.5;
  gongDisc.castShadow = true;
  gongDiscGroup.add(gongDisc);

  const gongRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.032, 12, 28), gongGoldMat);
  gongDiscGroup.add(gongRim);

  const centerBoss = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), jadeMat);
  centerBoss.scale.set(1.0, 1.0, 0.55);
  centerBoss.position.z = 0.025;
  gongDiscGroup.add(centerBoss);
  group.add(gongDiscGroup);

  // Two Jade Windbell Chimes hanging on sides
  for (const wx of [-0.26, 0.26]) {
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.11, 10), jadeMat);
    bell.position.set(wx, 0.31, 0.04);
    group.add(bell);
  }

  // Swinging Padded Striker Mallet
  const malletPivot = new THREE.Group();
  malletPivot.position.set(0.20, 0.40, 0.14);
  const malletStick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 8), redLacquerMat);
  malletStick.position.set(-0.06, -0.14, 0);
  malletStick.rotation.z = -0.35;
  malletPivot.add(malletStick);
  const malletHead = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), gongGoldMat);
  malletHead.position.set(-0.12, -0.26, 0);
  malletPivot.add(malletHead);
  group.add(malletPivot);

  group.userData = { gongDiscGroup, malletPivot, gongGoldMat };
  return group;
}

/**
 * Builds the 3D Crystal X-Ray Magnifying Lens ("隐藏信息读心镜")
 */
function buildMagicLensMesh() {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xa16207,
    emissiveIntensity: 0.35,
    roughness: 0.24,
    metalness: 0.22,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x7c2d12,
    roughness: 0.45,
  });

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.068, 16, 36), goldMat);
  rim.rotation.x = -Math.PI * 0.5;
  group.add(rim);

  // RingGeometry(0, r, 32, 8) so interior crystal lens vertices ripple in 3D
  const lensGeo = new THREE.RingGeometry(0, 0.44, 32, 8);
  const lensMesh = new THREE.Mesh(
    lensGeo,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.58,
    })
  );
  lensMesh.rotation.x = -Math.PI * 0.5;
  group.add(lensMesh);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.072, 0.62, 14), handleMat);
  handle.rotation.x = Math.PI * 0.5;
  handle.position.set(0, 0, 0.72);
  group.add(handle);

  group.userData = { lensGeo, rim };
  return group;
}

/**
 * Builds the 3D Golden Shovel ("后山工兵铲")
 */
function buildGoldenShovelMesh() {
  const group = new THREE.Group();
  const goldBladeMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.35,
    roughness: 0.24,
    metalness: 0.22,
  });
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.55 });

  // Spade scoop blade
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.44, 4), goldBladeMat);
  blade.rotation.x = -Math.PI * 0.5;
  blade.rotation.z = Math.PI * 0.25;
  blade.scale.set(1.15, 1.0, 0.35);
  blade.position.set(0, 0.06, -0.22);
  blade.castShadow = true;
  group.add(blade);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.68, 12), shaftMat);
  shaft.rotation.x = Math.PI * 0.5;
  shaft.position.set(0, 0.08, 0.26);
  group.add(shaft);

  const grip = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 10, 18), goldBladeMat);
  grip.rotation.x = Math.PI * 0.5;
  grip.position.set(0, 0.08, 0.64);
  group.add(grip);

  return group;
}

export function createBunSwapScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x132a1c);
  scene.fog = new THREE.FogExp2(0x132a1c, 0.02);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 60);
  const cameraBasePos = new THREE.Vector3(0, 6.20, 6.50);
  const cameraLookTarget = new THREE.Vector3(0, 0.25, -0.10);

  function updateCameraAspect() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 800;
    const aspect = w / h;
    camera.aspect = aspect;
    if (aspect < 0.75) {
      camera.fov = 52;
      cameraBasePos.set(0, 8.2, 8.6);
    } else if (aspect < 1.15) {
      camera.fov = 45;
      cameraBasePos.set(0, 7.1, 7.4);
    } else {
      camera.fov = 39;
      cameraBasePos.set(0, 6.15, 6.45);
    }
    camera.position.copy(cameraBasePos);
    camera.lookAt(cameraLookTarget);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  updateCameraAspect();
  window.addEventListener('resize', updateCameraAspect);

  // Physically-correct Three.js r161 lighting
  const hemiLight = new THREE.HemisphereLight(0xfef9c3, 0x365314, 1.38);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.55);
  dirLight.position.set(4.0, 9.5, 5.5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 1.0;
  dirLight.shadow.camera.far = 24.0;
  const d = 6.2;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0008;
  scene.add(dirLight);

  const lensLight = new THREE.PointLight(0x38bdf8, 14.5, 7.5, 1.2);
  lensLight.position.copy(STATION_COORDS.magic_lens).add(new THREE.Vector3(0, 0.8, 0));
  scene.add(lensLight);

  // ============================================================================
  // 1. Secret Back-Mountain Garden Stage (>= 65% Viewport)
  // ============================================================================
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const meadowMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.72 });
  const stoneTrimMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.55 });
  const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.58 });

  const gardenPlatform = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.36, 4.9), meadowMat);
  gardenPlatform.position.set(0, -0.18, 0.35);
  gardenPlatform.receiveShadow = true;
  worldGroup.add(gardenPlatform);

  const stoneBorder = new THREE.Mesh(new THREE.BoxGeometry(9.9, 0.20, 5.2), stoneTrimMat);
  stoneBorder.position.set(0, -0.26, 0.35);
  worldGroup.add(stoneBorder);

  // Foreground wooden tool deck
  const toolDeck = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.08, 1.35), woodDeckMat);
  toolDeck.position.set(0, 0.02, 1.85);
  toolDeck.receiveShadow = true;
  worldGroup.add(toolDeck);

  // Back-Mountain Bamboo Fence, Cherry Blossom Trees & Golden Garden Lanterns
  const bambooFenceMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.52 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.75 });
  const blossomPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.55 });
  const lanternGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.75,
    roughness: 0.25,
  });

  for (let bx = -4.2; bx <= 4.2; bx += 0.6) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.35, 10), bambooFenceMat);
    pole.position.set(bx, 0.52, -2.55);
    pole.castShadow = true;
    worldGroup.add(pole);
  }
  const railTop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 9.0, 10), bambooFenceMat);
  railTop.rotation.z = Math.PI * 0.5;
  railTop.position.set(0, 0.92, -2.52);
  worldGroup.add(railTop);

  // Two lush 3D Cherry Blossom Trees flanking the secret garden
  for (const tx of [-3.85, 3.85]) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0.0, -2.15);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.45, 12), trunkMat);
    trunk.position.y = 0.72;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const canopyOffsets = [
      [0, 1.65, 0, 0.62],
      [-0.38, 1.45, 0.18, 0.46],
      [0.38, 1.48, 0.16, 0.46],
      [0, 1.52, 0.35, 0.42],
    ];
    for (const [cx, cy, cz, cr] of canopyOffsets) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(cr, 16, 14), blossomPinkMat);
      puff.position.set(cx, cy, cz);
      puff.castShadow = true;
      treeGroup.add(puff);
    }

    // Hanging Golden Lantern
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), lanternGoldMat);
    lantern.scale.set(0.85, 1.2, 0.85);
    lantern.position.set(tx < 0 ? 0.42 : -0.42, 1.05, 0.32);
    treeGroup.add(lantern);

    worldGroup.add(treeGroup);
  }

  // ============================================================================
  // 2. 4 Large 3D Emblem Dirt Mounds (mound_0 .. mound_3)
  // ============================================================================
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.82 });
  const pitRimMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.78 });
  const pitVoidMat = new THREE.MeshBasicMaterial({ color: 0x271206 });

  const moundViews = [];
  for (let i = 0; i < 4; i++) {
    const sid = `mound_${i}`;
    const pos = STATION_COORDS[sid];
    const emblemType = EMBLEM_TYPES[i];

    const root = new THREE.Group();
    root.position.copy(pos);
    worldGroup.add(root);

    // Intact soil dome
    const intactDome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), soilMat);
    intactDome.scale.set(1.12, 0.72, 1.05);
    intactDome.castShadow = true;
    intactDome.receiveShadow = true;
    root.add(intactDome);

    // Dug pit ring + dark hole
    const dugPitGroup = new THREE.Group();
    const pitRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.14, 14, 28), pitRimMat);
    pitRing.rotation.x = Math.PI * 0.5;
    pitRing.position.y = 0.06;
    dugPitGroup.add(pitRing);

    const pitDisc = new THREE.Mesh(new THREE.CircleGeometry(0.52, 24), pitVoidMat);
    pitDisc.rotation.x = -Math.PI * 0.5;
    pitDisc.position.y = 0.02;
    dugPitGroup.add(pitDisc);
    dugPitGroup.visible = false;
    root.add(dugPitGroup);

    // Emblem Floating Above Mound
    const emblemMount = new THREE.Group();
    emblemMount.position.set(0, 0.68, 0);
    emblemMount.add(buildEmblemMesh(emblemType));
    root.add(emblemMount);

    // Treasure Chest Inside Pit
    const chestMount = new THREE.Group();
    chestMount.position.set(0, 0.06, 0);
    chestMount.add(buildTreasureChestMesh());
    chestMount.visible = false;
    root.add(chestMount);

    // Swapped Steamed Bun Inside Pit
    const bunMount = new THREE.Group();
    bunMount.position.set(0, 0.05, 0);
    const swappedBunMesh = buildSteamedBunMesh(false);
    bunMount.add(swappedBunMesh);
    bunMount.visible = false;
    root.add(bunMount);

    // Target Highlight Ring around mound
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.78, 32),
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
    );
    targetRing.rotation.x = -Math.PI * 0.5;
    targetRing.position.y = 0.03;
    root.add(targetRing);

    // Wave 3 & Fever Rainbow Starlight Aura Ring around mound
    const starlightRing = new THREE.Mesh(
      new THREE.RingGeometry(0.80, 0.90, 36),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
    );
    starlightRing.rotation.x = -Math.PI * 0.5;
    starlightRing.position.y = 0.04;
    root.add(starlightRing);

    moundViews.push({
      index: i,
      id: sid,
      emblemType,
      root,
      intactDome,
      dugPitGroup,
      emblemMount,
      chestMount,
      bunMount,
      swappedBunMesh,
      targetRing,
      starlightRing,
    });
  }

  // ============================================================================
  // 3. Foreground Interactive Tools: Magic Lens, Lucky Gong, Golden Shovel, Honey Glaze Pot, Steaming Bun Basket
  // ============================================================================
  const magicLensGroup = buildMagicLensMesh();
  magicLensGroup.position.copy(STATION_COORDS.magic_lens);
  worldGroup.add(magicLensGroup);

  const gardenGongGroup = buildGardenGongMesh();
  gardenGongGroup.position.copy(STATION_COORDS.garden_gong);
  worldGroup.add(gardenGongGroup);

  // Expanding 3D Golden Soundwave Ring from Lucky Garden Gong
  const gongWaveRingMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
  });
  const gongWaveRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.52, 40), gongWaveRingMat);
  gongWaveRing.rotation.x = -Math.PI * 0.5;
  gongWaveRing.position.set(STATION_COORDS.garden_gong.x, 0.14, STATION_COORDS.garden_gong.z);
  gongWaveRing.visible = false;
  worldGroup.add(gongWaveRing);

  const goldenShovelGroup = buildGoldenShovelMesh();
  goldenShovelGroup.position.copy(STATION_COORDS.golden_shovel);
  worldGroup.add(goldenShovelGroup);

  const saucePotGroup = buildSaucePotMesh();
  saucePotGroup.position.copy(STATION_COORDS.sauce_pot);
  worldGroup.add(saucePotGroup);

  // Bamboo Steamer Basket filled with 4 plump Steamed Buns (+ Wave 2 Double-Decker Jade & Gold Steamer Tower!)
  const steamerGroup = new THREE.Group();
  steamerGroup.position.copy(STATION_COORDS.bun_steamer);
  worldGroup.add(steamerGroup);

  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55, metalness: 0.08 });
  const steamerWall = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.24, 28), bambooMat);
  steamerWall.castShadow = true;
  steamerWall.receiveShadow = true;
  steamerGroup.add(steamerWall);

  const steamerBuns = [];
  const bunOffsets = [
    [-0.24, 0.12, -0.18, false],
    [0.24, 0.12, -0.18, true],
    [-0.22, 0.12, 0.22, true],
    [0.22, 0.12, 0.22, false],
  ];
  for (const [bx, by, bz, isGold] of bunOffsets) {
    const b = buildSteamedBunMesh(isGold);
    b.scale.setScalar(0.76);
    b.position.set(bx, by, bz);
    steamerGroup.add(b);
    steamerBuns.push(b);
  }

  // Wave 2 Upgrade: Double-Decker Jade & Gold Steamer Tower
  const steamerTier2Group = new THREE.Group();
  steamerTier2Group.position.y = 0.26;
  steamerTier2Group.visible = false;
  const jadeSteamerMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x047857,
    emissiveIntensity: 0.32,
    roughness: 0.28,
    metalness: 0.16,
  });
  const goldRimMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xb45309,
    emissiveIntensity: 0.42,
    roughness: 0.22,
    metalness: 0.22,
  });
  const tier2Wall = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.58, 0.22, 26), jadeSteamerMat);
  tier2Wall.castShadow = true;
  steamerTier2Group.add(tier2Wall);
  const tier2Rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 12, 28), goldRimMat);
  tier2Rim.rotation.x = Math.PI * 0.5;
  tier2Rim.position.y = 0.11;
  steamerTier2Group.add(tier2Rim);
  for (const [bx, by, bz] of [[-0.17, 0.11, -0.12], [0.17, 0.11, -0.12], [0.0, 0.11, 0.16]]) {
    const tb = buildSteamedBunMesh(true);
    tb.scale.setScalar(0.64);
    tb.position.set(bx, by, bz);
    steamerTier2Group.add(tb);
    steamerBuns.push(tb);
  }
  steamerGroup.add(steamerTier2Group);

  // ============================================================================
  // 3B. Wave 2 & Wave 3 Stage-by-Stage Environment Evolutions + Helper & Fever
  // ============================================================================
  const wave2PropsGroup = new THREE.Group();
  wave2PropsGroup.visible = false;
  worldGroup.add(wave2PropsGroup);

  const lotusPetalMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xdb2777,
    emissiveIntensity: 0.48,
    roughness: 0.26,
    metalness: 0.12,
  });
  const lotusCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.82,
    roughness: 0.18,
    metalness: 0.18,
  });
  const jadeStepMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x065f46,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    metalness: 0.14,
  });

  const lotusLanternMeshes = [];
  const lanternCoords = [
    [-4.15, 0.12, 1.05],
    [4.15, 0.12, 1.05],
    [-4.15, 0.12, -0.55],
    [4.15, 0.12, -0.55],
    [-2.85, 0.12, -1.65],
    [2.85, 0.12, -1.65],
  ];
  for (const [lx, ly, lz] of lanternCoords) {
    const lGroup = new THREE.Group();
    lGroup.position.set(lx, ly, lz);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 18), jadeStepMat);
    lGroup.add(pad);
    for (let p = 0; p < 6; p++) {
      const ang = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 8), lotusPetalMat);
      petal.position.set(Math.cos(ang) * 0.18, 0.12, Math.sin(ang) * 0.18);
      petal.rotation.z = -Math.cos(ang) * 0.42;
      petal.rotation.x = Math.sin(ang) * 0.42;
      lGroup.add(petal);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), lotusCoreMat);
    core.position.y = 0.16;
    lGroup.add(core);
    wave2PropsGroup.add(lGroup);
    lotusLanternMeshes.push(lGroup);
  }

  // Glowing Jade Stepping Stones along the courtyard path
  for (const [sx, sz] of [[-1.75, 1.08], [0.0, 1.08], [1.75, 1.08], [-1.75, -0.62], [0.0, -0.62], [1.75, -0.62]]) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.31, 0.05, 16), jadeStepMat);
    stone.position.set(sx, 0.02, sz);
    stone.receiveShadow = true;
    wave2PropsGroup.add(stone);
  }

  // Wave 3 Props: 3D Royal Moon-Gate / Torii Archway & Floating Starlight Crystals
  const wave3PropsGroup = new THREE.Group();
  wave3PropsGroup.visible = false;
  worldGroup.add(wave3PropsGroup);

  const royalRedMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0x881337,
    emissiveIntensity: 0.35,
    roughness: 0.28,
    metalness: 0.18,
  });
  const starCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.72,
    roughness: 0.16,
    metalness: 0.20,
  });

  // Grand Torii / Moon-Gate Archway behind the bamboo fence
  const archGroup = new THREE.Group();
  archGroup.position.set(0, 0.0, -2.72);
  for (const ax of [-1.85, 1.85]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 2.75, 16), royalRedMat);
    col.position.set(ax, 1.35, 0);
    col.castShadow = true;
    archGroup.add(col);
    const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.22, 16), goldRimMat);
    colBase.position.set(ax, 0.11, 0);
    archGroup.add(colBase);
  }
  const kasagiBeam = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.18, 0.26), royalRedMat);
  kasagiBeam.position.set(0, 2.68, 0);
  archGroup.add(kasagiBeam);
  const shimakiBeam = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.12, 0.22), goldRimMat);
  shimakiBeam.position.set(0, 2.52, 0);
  archGroup.add(shimakiBeam);
  const nukiBeam = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.13, 0.18), royalRedMat);
  nukiBeam.position.set(0, 2.12, 0);
  archGroup.add(nukiBeam);
  const moonRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.065, 14, 36), goldRimMat);
  moonRing.position.set(0, 1.55, 0.05);
  archGroup.add(moonRing);
  wave3PropsGroup.add(archGroup);

  const starlightCrystals = [];
  for (let c = 0; c < 8; c++) {
    const ang = (c / 8) * Math.PI * 2;
    const crys = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      c % 2 === 0 ? starCrystalMat : lotusCoreMat
    );
    crys.position.set(Math.cos(ang) * 3.4, 1.55 + (c % 2) * 0.35, -1.95 + Math.sin(ang) * 0.45);
    wave3PropsGroup.add(crys);
    starlightCrystals.push({ mesh: crys, phase: c * 0.85, basePos: crys.position.clone() });
  }

  // Instantiate Pillar 2 Helper Buddy & Surprise Fever Event 3D actors
  const helperAndEventsApi = createBunswapHelperAndEvents(THREE, scene, worldGroup);

  // ============================================================================
  // 4. 2 Critter Explorers (Dynamic 8-Critter 3D Plush Models & Hidden Thoughts!)
  // ============================================================================
  const standeeTextures = {};
  const explorerActors = [];

  // Pre-allocated RingGeometry cache (quantized 1..32 steps) to prevent GC churn & memory leaks
  const PATIENCE_RING_GEOMS = [];
  for (let q = 1; q <= 32; q++) {
    const theta = q * (Math.PI * 2 / 32);
    PATIENCE_RING_GEOMS[q] = new THREE.RingGeometry(0.49, 0.58, 32, 1, Math.PI * 0.5, theta);
  }

  for (let i = 0; i < 2; i++) {
    const sid = `explorer_${i}`;
    const pos = STATION_COORDS[sid];
    const root = new THREE.Group();
    root.position.copy(pos);
    worldGroup.add(root);

    const charHolder = new THREE.Group();
    root.add(charHolder);

    const critterModels = {};
    const initialFriend = i === 0 ? 'dogday' : 'catnap';
    const initBuilder = CRITTER_MODEL_BUILDERS[initialFriend] || buildDogDayPlushModel;
    const initModel = initBuilder(THREE);
    if (initModel.fartCloudGroup) initModel.fartCloudGroup.visible = false;
    initModel.root.scale.setScalar(0.72);
    initModel.root.position.set(0, -0.45, 0);
    enforceNonIblMaterialHygiene(initModel.root);
    charHolder.add(initModel.root);
    critterModels[initialFriend] = initModel;

    // Golden Chosen-One Halo ("天命主角光环") spinning above head
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.035, 12, 28),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    halo.rotation.x = Math.PI * 0.5;
    halo.position.set(0, 1.28, 0);
    charHolder.add(halo);

    // Portrait medallion badge
    const badgeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
      fog: false,
      transparent: true,
    });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), badgeMat);
    badge.position.set(-0.82, 0.35, 0.35);
    root.add(badge);

    // 3D Thought Bubble (Unrevealed Mystery Cloud vs Revealed Target Emblem!)
    const bubbleGroup = new THREE.Group();
    bubbleGroup.position.set(0.82, 0.98, 0.25);
    root.add(bubbleGroup);

    const cloudBg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.50, 0.50, 0.10, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false })
    );
    cloudBg.rotation.x = Math.PI * 0.5;
    bubbleGroup.add(cloudBg);

    const patienceRingMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const patienceRing = new THREE.Mesh(PATIENCE_RING_GEOMS[32], patienceRingMat);
    patienceRing.position.z = 0.06;
    bubbleGroup.add(patienceRing);

    // Mystery Purple Cloud (shown when revealed === false)
    const mysteryCloud = new THREE.Group();
    mysteryCloud.position.z = 0.12;
    const mystMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.25,
    });
    const mystCrystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), mystMat);
    mysteryCloud.add(mystCrystal);
    const mystRing = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.36, 24),
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
    );
    mysteryCloud.add(mystRing);
    bubbleGroup.add(mysteryCloud);

    // Revealed Emblem Mount (shown when revealed === true)
    const revealedMount = new THREE.Group();
    revealedMount.position.z = 0.14;
    revealedMount.visible = false;
    bubbleGroup.add(revealedMount);

    explorerActors.push({
      slotIndex: i,
      id: sid,
      root,
      charHolder,
      critterModels,
      halo,
      badgeMat,
      bubbleGroup,
      patienceRing,
      patienceRingMat,
      mysteryCloud,
      mystCrystal,
      revealedMount,
      renderedCritter: '',
      renderedEmblem: '',
      currentQuant: 32,
      cheerTimer: 0,
    });
  }

  // ============================================================================
  // 5. Substepped 1/120s Dirt Clod Particles, Glaze Sparkles, Chest Flights & Drag Bun Proxy
  // ============================================================================
  const dragBunProxy = buildSteamedBunMesh(false);
  dragBunProxy.visible = false;
  worldGroup.add(dragBunProxy);

  const sharedDirtClodGeo = new THREE.DodecahedronGeometry(0.085, 0);
  const sharedSparkleGeo = new THREE.OctahedronGeometry(0.075, 0);
  const sparkleGoldMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const sparklePinkMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
  const dirtClods = [];
  const glazeSparkles = [];
  const chestPopFlights = [];
  let gongWaveTimer = 0;

  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();

  const hitSpheres = [];
  for (const sid of STATION_IDS) {
    const p = STATION_COORDS[sid];
    const radius = sid.startsWith('mound_')
      ? 0.84
      : sid.startsWith('explorer_')
        ? 1.05
        : sid === 'helper_buddy'
          ? 0.88
          : 0.78;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    m.position.copy(p);
    if (sid.startsWith('mound_')) m.position.y = 0.42; // Encompasses mound dome, dug pit, and floating crystal emblem
    m.userData.stationId = sid;
    worldGroup.add(m);
    hitSpheres.push(m);

    // Dedicated hit sphere for Explorer Thought Bubble & Halo (where 5yo kids naturally tap)
    if (sid.startsWith('explorer_')) {
      const bubbleSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 10, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      bubbleSphere.position.copy(p).add(new THREE.Vector3(0.82, 0.98, 0.25));
      bubbleSphere.userData.stationId = sid;
      worldGroup.add(bubbleSphere);
      hitSpheres.push(bubbleSphere);
    }
  }

  function screenToWorldOnTable(clientX, clientY, targetVec = hitPoint) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    ndc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(dragPlane, targetVec);
    targetVec.x = Math.max(-4.3, Math.min(4.3, targetVec.x));
    targetVec.z = Math.max(-2.6, Math.min(2.3, targetVec.z));
    return targetVec;
  }

  function pickStationAtClientPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    ndc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const pt = screenToWorldOnTable(clientX, clientY);
    const hits = raycaster.intersectObjects(hitSpheres, false);
    if (hits.length === 1) {
      return hits[0].object.userData.stationId;
    }
    if (hits.length > 1) {
      let closestSid = hits[0].object.userData.stationId;
      let closestDist = Infinity;
      for (const h of hits) {
        const sid = h.object.userData.stationId;
        const c = STATION_COORDS[sid];
        if (!c) continue;
        const d = Math.hypot(pt.x - c.x, pt.z - c.z);
        if (d < closestDist) {
          closestDist = d;
          closestSid = sid;
        }
      }
      return closestSid;
    }
    let bestId = null;
    let bestDist = 1.25;
    for (const sid of STATION_IDS) {
      const d2 = pt.distanceTo(STATION_COORDS[sid]);
      if (d2 < bestDist) {
        bestDist = d2;
        bestId = sid;
      }
    }
    return bestId;
  }

  function getStationScreenRect(stationId) {
    const pos = STATION_COORDS[stationId];
    if (!pos) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const projected = pos.clone().project(camera);
    return {
      x: (projected.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  function spawnDirtBurst(moundIdx) {
    const center = STATION_COORDS[`mound_${moundIdx}`];
    if (!center) return;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const clod = new THREE.Mesh(sharedDirtClodGeo, soilMat);
      clod.position.copy(center).add(new THREE.Vector3(0, 0.25, 0));
      worldGroup.add(clod);
      dirtClods.push({
        mesh: clod,
        vel: new THREE.Vector3(Math.cos(a) * 1.9, 2.8 + (i % 3) * 0.4, Math.sin(a) * 1.9),
        elapsed: 0,
        duration: 0.48,
      });
    }

    // Substepped 1/120s Treasure Chest Pop Trajectory
    chestPopFlights.push({
      moundIdx,
      y: -0.22,
      vy: 2.85,
      scale: 0.55,
      elapsed: 0,
      duration: 0.52,
    });
  }

  function spawnGlazeSparkleBurst(moundIdx = -1) {
    const center =
      moundIdx >= 0 && STATION_COORDS[`mound_${moundIdx}`]
        ? STATION_COORDS[`mound_${moundIdx}`]
        : STATION_COORDS.sauce_pot;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const sp = new THREE.Mesh(
        sharedSparkleGeo,
        i % 2 === 0 ? sparkleGoldMat : sparklePinkMat
      );
      sp.position.copy(center).add(new THREE.Vector3(0, 0.38, 0));
      worldGroup.add(sp);
      glazeSparkles.push({
        mesh: sp,
        vel: new THREE.Vector3(Math.cos(a) * 1.65, 2.4 + (i % 3) * 0.35, Math.sin(a) * 1.65),
        elapsed: 0,
        duration: 0.56,
      });
    }
  }

  function triggerGongWave() {
    gongWaveTimer = 0.72;
    gongWaveRing.visible = true;
    gongWaveRing.scale.setScalar(1.0);
    gongWaveRingMat.opacity = 0.85;
  }

  function syncAndRender(state, dt, elapsed) {
    // 1. Substepped 1/120s physics for flying dirt clods, glaze sparkles & treasure chest pop
    const substeps = Math.max(1, Math.min(8, Math.ceil(dt / (1 / 120))));
    const subDt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      for (let i = dirtClods.length - 1; i >= 0; i--) {
        const c = dirtClods[i];
        c.elapsed += subDt;
        c.vel.y -= 9.8 * subDt;
        c.mesh.position.addScaledVector(c.vel, subDt);
        c.mesh.rotation.x += 6.0 * subDt;
        c.mesh.rotation.y += 5.0 * subDt;
        if (c.elapsed >= c.duration) {
          worldGroup.remove(c.mesh);
          dirtClods.splice(i, 1);
        }
      }

      for (let i = glazeSparkles.length - 1; i >= 0; i--) {
        const s = glazeSparkles[i];
        s.elapsed += subDt;
        s.vel.y -= 6.2 * subDt;
        s.mesh.position.addScaledVector(s.vel, subDt);
        s.mesh.rotation.y += 8.0 * subDt;
        s.mesh.rotation.z += 5.5 * subDt;
        const sc = Math.max(0.1, 1.0 - (s.elapsed / s.duration) * 0.7);
        s.mesh.scale.setScalar(sc);
        if (s.elapsed >= s.duration) {
          worldGroup.remove(s.mesh);
          glazeSparkles.splice(i, 1);
        }
      }

      for (let i = chestPopFlights.length - 1; i >= 0; i--) {
        const f = chestPopFlights[i];
        f.elapsed += subDt;
        f.vy -= 9.8 * subDt;
        f.y += f.vy * subDt;
        if (f.y <= 0.12 && f.vy < 0) {
          f.y = 0.12;
          f.vy = -f.vy * 0.32; // restitution ground bounce
        }
        f.scale = Math.min(1.0, f.scale + subDt * 2.2);
        if (f.elapsed >= f.duration) {
          chestPopFlights.splice(i, 1);
        }
      }
    }

    // 1B. Stage-by-Stage Wave 1 / 2 / 3 Props & Lighting Evolution
    const waveNum = state.wave || 1;
    wave2PropsGroup.visible = waveNum >= 2;
    steamerTier2Group.visible = waveNum >= 2;
    wave3PropsGroup.visible = waveNum >= 3;

    if (waveNum === 1) {
      hemiLight.color.setHex(0xfef9c3);
      hemiLight.groundColor.setHex(0x365314);
      dirLight.color.setHex(0xfffbeb);
    } else if (waveNum === 2) {
      hemiLight.color.setHex(0xfde68a);
      hemiLight.groundColor.setHex(0x3f6212);
      dirLight.color.setHex(0xfef08a);
      for (let l = 0; l < lotusLanternMeshes.length; l++) {
        const lg = lotusLanternMeshes[l];
        lg.rotation.y = elapsed * 0.9 + l;
        lg.position.y = 0.12 + Math.sin(elapsed * 3.0 + l) * 0.03;
      }
    } else {
      hemiLight.color.setHex(0xe0f2fe);
      hemiLight.groundColor.setHex(0x312e81);
      dirLight.color.setHex(0xfef9c3);
      for (let l = 0; l < lotusLanternMeshes.length; l++) {
        const lg = lotusLanternMeshes[l];
        lg.rotation.y = elapsed * 1.1 + l;
      }
      for (const sc of starlightCrystals) {
        sc.mesh.position.y = sc.basePos.y + Math.sin(elapsed * 3.2 + sc.phase) * 0.12;
        sc.mesh.rotation.y = elapsed * 2.4 + sc.phase;
        sc.mesh.rotation.x = elapsed * 1.6;
      }
    }

    // 1C. Animate Honey-Berry Glaze Pot & Steamer Buns Glaze Status
    const isGlazedActive = (state.bunGlazeCharges || 0) > 0 || Boolean(state.feverActive);
    const { dipperGroup, sparkleRingGroup } = saucePotGroup.userData;
    dipperGroup.rotation.y = elapsed * (isGlazedActive ? 4.2 : 1.6);
    dipperGroup.position.y = 0.34 + Math.sin(elapsed * 4.5) * 0.04;
    sparkleRingGroup.rotation.y = -elapsed * 3.5;
    sparkleRingGroup.scale.setScalar(isGlazedActive ? 1.25 + Math.sin(elapsed * 8.0) * 0.12 : 0.9);

    for (const sb of steamerBuns) {
      if (sb.userData && sb.userData.glazeGroup) {
        sb.userData.glazeGroup.visible = isGlazedActive;
        sb.userData.glazeGroup.rotation.y = elapsed * 3.2;
      }
    }

    // 1D. Animate Lucky Garden Gong & Soundwave Ring
    const { gongDiscGroup, malletPivot } = gardenGongGroup.userData;
    if (gongWaveTimer > 0) {
      gongWaveTimer = Math.max(0, gongWaveTimer - dt);
      const prog = 1.0 - gongWaveTimer / 0.72;
      gongWaveRing.visible = true;
      gongWaveRing.scale.setScalar(1.0 + prog * 9.5);
      gongWaveRingMat.opacity = Math.max(0, (1.0 - prog) * 0.82);
      malletPivot.rotation.x = Math.sin(prog * Math.PI * 4) * 0.45;
      gongDiscGroup.scale.setScalar(1.0 + Math.sin(prog * Math.PI * 6) * 0.08);
    } else {
      gongWaveRing.visible = false;
      malletPivot.rotation.x = Math.sin(elapsed * 2.4) * 0.06;
      gongDiscGroup.scale.setScalar(1.0);
    }

    // 2. Animate Magic Lens Crystal Vertices & Drag Position
    const lensGeo = magicLensGroup.userData.lensGeo;
    const lensPos = lensGeo.attributes.position;
    for (let i = 0; i < lensPos.count; i++) {
      const lx = lensPos.getX(i);
      const ly = lensPos.getY(i);
      const r = Math.hypot(lx, ly);
      lensPos.setZ(i, Math.sin(r * 15.0 - elapsed * 8.5) * 0.035);
    }
    lensPos.needsUpdate = true;

    if (state.activeTool === 'lens' && state.toolWorldPos) {
      magicLensGroup.position.lerp(state.toolWorldPos, 0.45);
      magicLensGroup.position.y = 0.85;
      magicLensGroup.scale.setScalar(1.22);
    } else {
      magicLensGroup.position.lerp(STATION_COORDS.magic_lens, 0.2);
      magicLensGroup.position.y = STATION_COORDS.magic_lens.y + Math.sin(elapsed * 3.5) * 0.05;
      magicLensGroup.scale.setScalar(1.0);
    }
    lensLight.position.x = magicLensGroup.position.x;
    lensLight.position.z = magicLensGroup.position.z;

    // 3. Animate Golden Shovel Drag Position
    if (state.activeTool === 'shovel' && state.toolWorldPos) {
      goldenShovelGroup.position.lerp(state.toolWorldPos, 0.45);
      goldenShovelGroup.position.y = 0.72;
      goldenShovelGroup.rotation.x = -0.35 + Math.sin(elapsed * 14.0) * 0.18;
      goldenShovelGroup.scale.setScalar(1.18);
    } else {
      goldenShovelGroup.position.lerp(STATION_COORDS.golden_shovel, 0.2);
      goldenShovelGroup.position.y = STATION_COORDS.golden_shovel.y + Math.sin(elapsed * 3.0 + 1.0) * 0.04;
      goldenShovelGroup.rotation.x = 0;
      goldenShovelGroup.scale.setScalar(1.0);
    }

    // 4. Animate Floating Steamed Bun Drag Proxy
    if (state.activeTool === 'bun' && state.toolWorldPos) {
      dragBunProxy.visible = true;
      dragBunProxy.position.copy(state.toolWorldPos);
      dragBunProxy.position.y = 0.65;
      dragBunProxy.scale.setScalar(1.15);
      if (dragBunProxy.userData && dragBunProxy.userData.glazeGroup) {
        dragBunProxy.userData.glazeGroup.visible = isGlazedActive;
        dragBunProxy.userData.glazeGroup.rotation.y = elapsed * 4.0;
      }
    } else {
      dragBunProxy.visible = false;
    }

    // 5. Sync 4 Emblem Dirt Mounds
    const wantedEmblems = new Set(
      state.explorers.filter((e) => e.active && e.revealed).map((e) => e.targetEmblem)
    );

    const rainbowColors = [0xfacc15, 0xf472b6, 0x38bdf8, 0x4ade80];
    for (let i = 0; i < 4; i++) {
      const mState = state.mounds[i];
      const view = moundViews[i];

      view.emblemMount.rotation.y = elapsed * 1.8 + i;
      view.emblemMount.position.y = 0.68 + Math.sin(elapsed * 3.5 + i) * 0.05;

      const isWanted = wantedEmblems.has(view.emblemType);
      view.targetRing.material.opacity = isWanted ? 0.55 + Math.sin(elapsed * 8.0) * 0.35 : 0.0;

      if (waveNum >= 3 || state.feverActive) {
        view.starlightRing.material.opacity = 0.48 + Math.sin(elapsed * 6.5 + i) * 0.25;
        view.starlightRing.material.color.setHex(
          rainbowColors[(i + Math.floor(elapsed * 3)) % rainbowColors.length]
        );
      } else {
        view.starlightRing.material.opacity = 0.0;
      }

      if (view.swappedBunMesh && view.swappedBunMesh.userData?.glazeGroup) {
        view.swappedBunMesh.userData.glazeGroup.visible = Boolean(mState.glazed) || isGlazedActive;
        view.swappedBunMesh.userData.glazeGroup.rotation.y = elapsed * 3.5;
      }

      if (mState.state === 'intact') {
        view.intactDome.visible = true;
        view.dugPitGroup.visible = false;
        view.chestMount.visible = false;
        view.bunMount.visible = false;
      } else if (mState.state === 'dug_chest') {
        view.intactDome.visible = false;
        view.dugPitGroup.visible = true;
        view.chestMount.visible = true;
        view.bunMount.visible = false;

        const activeFlight = chestPopFlights.find((f) => f.moundIdx === i);
        if (activeFlight) {
          view.chestMount.position.y = activeFlight.y;
          view.chestMount.scale.setScalar(activeFlight.scale);
        } else {
          view.chestMount.position.y = 0.12 + Math.abs(Math.sin(elapsed * 6.0)) * 0.08;
          view.chestMount.scale.setScalar(1.0);
        }
      } else if (mState.state === 'empty_pit') {
        view.intactDome.visible = false;
        view.dugPitGroup.visible = true;
        view.chestMount.visible = false;
        view.bunMount.visible = false;
      } else if (mState.state === 'bun_swapped') {
        view.intactDome.visible = false;
        view.dugPitGroup.visible = true;
        view.chestMount.visible = false;
        view.bunMount.visible = true;
        view.bunMount.scale.setScalar(1.0 + Math.sin(elapsed * 8.0) * 0.08);
      }
    }

    // 6. Sync 2 Critter Explorers (Dynamic 8-Critter 3D Plush Model Swapping)
    for (let i = 0; i < 2; i++) {
      const exp = state.explorers[i];
      const actor = explorerActors[i];
      if (!exp || !exp.active) {
        actor.root.visible = false;
        continue;
      }
      actor.root.visible = true;
      actor.charHolder.position.y = Math.abs(Math.sin(elapsed * 4.2 + i * 1.5)) * 0.06;
      actor.halo.rotation.z = elapsed * 2.5;

      if (actor.renderedCritter !== exp.friend) {
        actor.renderedCritter = exp.friend;
        if (!standeeTextures[exp.friend]) {
          standeeTextures[exp.friend] = createCritterStandeeTexture(exp.friend);
        }
        actor.badgeMat.map = standeeTextures[exp.friend];
        actor.badgeMat.needsUpdate = true;

        // Dynamically build/swap the 3D Critter plush model for exp.friend
        if (!actor.critterModels[exp.friend]) {
          const builder = CRITTER_MODEL_BUILDERS[exp.friend] || buildDogDayPlushModel;
          const built = builder(THREE);
          if (built.fartCloudGroup) built.fartCloudGroup.visible = false;
          built.root.scale.setScalar(0.72);
          built.root.position.set(0, -0.45, 0);
          enforceNonIblMaterialHygiene(built.root);
          actor.charHolder.add(built.root);
          actor.critterModels[exp.friend] = built;
        }
        for (const [k, mdl] of Object.entries(actor.critterModels)) {
          mdl.root.visible = k === exp.friend;
        }
      }

      if (!exp.revealed) {
        actor.mysteryCloud.visible = true;
        actor.revealedMount.visible = false;
        actor.mystCrystal.rotation.y = elapsed * 3.2;
        actor.mystCrystal.rotation.x = elapsed * 2.1;
      } else {
        actor.mysteryCloud.visible = false;
        actor.revealedMount.visible = true;
        if (actor.renderedEmblem !== exp.targetEmblem) {
          actor.renderedEmblem = exp.targetEmblem;
          actor.revealedMount.clear();
          const embMesh = buildEmblemMesh(exp.targetEmblem);
          embMesh.scale.setScalar(1.08);
          actor.revealedMount.add(embMesh);
        }
        actor.revealedMount.rotation.y = elapsed * 2.2;
      }

      const patRatio = Math.max(0.04, Math.min(1, exp.patience / Math.max(1, exp.maxPatience)));
      actor.patienceRingMat.color.setHex(
        patRatio > 0.5 ? 0x22c55e : patRatio > 0.25 ? 0xf59e0b : 0xef4444
      );
      const quantIdx = Math.max(1, Math.min(32, Math.round(patRatio * 32)));
      if (actor.currentQuant !== quantIdx) {
        actor.currentQuant = quantIdx;
        actor.patienceRing.geometry = PATIENCE_RING_GEOMS[quantIdx];
      }
    }

    // 7. Sync Pillar 2 Helper Buddy & Surprise Fever Event + Enforce Non-IBL Material Hygiene
    if (helperAndEventsApi && typeof helperAndEventsApi.syncHelperAndEvents === 'function') {
      helperAndEventsApi.syncHelperAndEvents(state, dt, elapsed);
    }
    enforceNonIblMaterialHygiene(scene);

    renderer.render(scene, camera);
  }

  // Enforce non-IBL material hygiene before initial shader compile
  enforceNonIblMaterialHygiene(scene);

  // Pre-warm WebGL shaders so first spawn/burst never hitches
  renderer.compile(scene, camera);

  return {
    scene,
    camera,
    renderer,
    syncAndRender,
    screenToWorldOnTable,
    pickStationAtClientPos,
    getStationScreenRect,
    spawnDirtBurst,
    spawnGlazeSparkleBurst,
    triggerGongWave,
  };
}
