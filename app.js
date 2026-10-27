import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ========== i18n ========== */
const I = {
  he: {
    start:'התחל', tag:'סימולטור עגלת קמפינג אוטונומית — שתי תצורות הנעה, חיישנים, מעקב וניווט',
    dims:'מידות אמבט: 88 × 51 × 35 ס״מ · גלגלים Ø17 × 10 ס״מ',
    drive:'הנעה', sim:'סימולציה', calc:'מחשבון', wire:'חיווט', bom:'BOM',
    cfgA:'תצורה A — מנוע אחד', cfgB:'תצורה B — 4 מנועים',
    cfgAdesc:'מנוע אחורי + תיבת הילוכים + דיפרנציאל/שרשרת, הגה Ackermann בקדמי',
    cfgBdesc:'מנוע לכל גלגל (hub/geared), היגוי skid-steer',
    xray:'X-RAY', cut:'חתך', labels:'תוויות', tour:'סיור מודרך',
    spd:'מהירות', batt:'סוללה', range:'טווח', cur:'זרם', trq:'מומנט', rpm:'סל״ד',
    payload:'מטען (ק״ג)', slope:'שיפוע (°)', maxSpd:'מהירות מקס׳', simSpd:'מהירות סימ׳',
    modeIdle:'IDLE', modeFollow:'FOLLOW-ME', modeWay:'WAYPOINTS', modeAvoid:'AVOID',
    startFollow:'התחל עקיבה', startWay:'נקודות דרך', stopSim:'עצור', resetSim:'איפוס',
    addObs:'הוסף מכשול', clearObs:'נקה מכשולים',
    calcTitle:'מחשבון מומנט / הספק',
    needT:'מומנט דרוש', needP:'הספק דרוש', perMotor:'למנוע', suggest:'המלצת מנוע',
    estNote:'מחירים משוערים — להשוואה בלבד', exportXls:'ייצוא Excel',
    total:'סה״כ', tourNext:'הבא', tourPrev:'הקודם', tourClose:'סגור',
    hintOrbit:'גרור לסיבוב · גלגלת לזום · לחצן ימני להזזה',
    loadBom:'טוען BOM…',
    mech:'מנגנון הנעה', mechClose:'סגור מנגנון',
    foldWarn:'שים לב: לוחית תחתית מקבעת את הקיפול — או תושבות על רגלי הקסטר בלבד (שומר קיפול, פחות קשיחות).',
  },
  en: {
    start:'Start', tag:'Autonomous camping-wagon simulator — dual drivetrains, sensors, follow & navigate',
    dims:'Tub: 88 × 51 × 35 cm · Wheels Ø17 × 10 cm',
    drive:'Drivetrain', sim:'Simulation', calc:'Calculator', wire:'Wiring', bom:'BOM',
    cfgA:'Config A — single motor', cfgB:'Config B — 4 motors',
    cfgAdesc:'Rear geared motor + diff/chain, front Ackermann steering',
    cfgBdesc:'One motor per wheel (hub/geared), skid-steer',
    xray:'X-RAY', cut:'Section', labels:'Labels', tour:'Guided tour',
    spd:'Speed', batt:'Battery', range:'Range', cur:'Current', trq:'Torque', rpm:'RPM',
    payload:'Payload (kg)', slope:'Slope (°)', maxSpd:'Max speed', simSpd:'Sim speed',
    modeIdle:'IDLE', modeFollow:'FOLLOW-ME', modeWay:'WAYPOINTS', modeAvoid:'AVOID',
    startFollow:'Start follow-me', startWay:'Waypoints', stopSim:'Stop', resetSim:'Reset',
    addObs:'Add obstacle', clearObs:'Clear obstacles',
    calcTitle:'Torque / power calculator',
    needT:'Required torque', needP:'Required power', perMotor:'per motor', suggest:'Motor suggestion',
    estNote:'Prices are estimates — for comparison only', exportXls:'Export Excel',
    total:'Total', tourNext:'Next', tourPrev:'Prev', tourClose:'Close',
    hintOrbit:'Drag to orbit · scroll to zoom · right-drag to pan',
    loadBom:'Loading BOM…',
    mech:'Drivetrain mechanism', mechClose:'Close mechanism',
    foldWarn:'Note: undercarriage plate locks folding — or mount only on caster legs (keeps folding, less stiffness).',
  }
};
let lang = 'he';
const L = (he, en) => (lang === 'he' ? he : en);
const T = (k) => I[lang][k] || I.he[k] || k;

/* ========== State ========== */
const S = {
  cfg: 'A', // A | B
  xray: false, cut: false, labels: false, hq: false,
  payload: 25, slope: 5, maxSpd: 1.2, simMul: 1,
  mode: 'idle', // idle | follow | way | avoid
  batt: 100, distM: 0,
  running: false,
  tab: 'drive',
  tourIdx: -1,
  mechView: false,
  mechFocus: 'overview', // overview | motor | axle | wheelFL | wheelRL
};

/* ========== Scene ========== */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f5f7);
scene.fog = new THREE.Fog(0xf4f5f7, 14, 40);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.02, 80);
camera.position.set(1.6, 1.1, 1.8);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.25, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.4;
controls.maxDistance = 12;

/* lights */
const hemi = new THREE.HemisphereLight(0xffffff, 0xd8dce2, 0.85);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfffaf0, 1.15);
key.position.set(2.5, 6, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
key.shadow.camera.left = -4; key.shadow.camera.right = 4;
key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
key.shadow.bias = -0.00015;
key.shadow.radius = 2;
scene.add(key);
const fill = new THREE.DirectionalLight(0xdde4f0, 0.45);
fill.position.set(-4, 3, -2);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe0c0, 0.3);
rim.position.set(0, 2, -4);
scene.add(rim);
const soft = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(soft);

/* ground */
const groundMat = new THREE.MeshStandardMaterial({ color: 0xe8eaee, metalness: 0.05, roughness: 0.88 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 64), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(16, 32, 0xb8bec8, 0xd0d4dc);
grid.position.y = 0.002;
scene.add(grid);

/* Materials */
const M = {
  aluBrown: new THREE.MeshPhysicalMaterial({ color: 0x8a6a3e, metalness: 0.85, roughness: 0.38, clearcoat: 0.15 }),
  aluDark: new THREE.MeshPhysicalMaterial({ color: 0x5c4a32, metalness: 0.8, roughness: 0.42 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0xd4c4a8, metalness: 0, roughness: 0.85, side: THREE.DoubleSide }),
  fabricDark: new THREE.MeshStandardMaterial({ color: 0xb8a888, metalness: 0, roughness: 0.9 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x1a1b1d, metalness: 0.05, roughness: 0.92 }),
  plasticBlk: new THREE.MeshPhysicalMaterial({ color: 0x1e2024, metalness: 0.15, roughness: 0.55, clearcoat: 0.3 }),
  steel: new THREE.MeshPhysicalMaterial({ color: 0xb8bec6, metalness: 1, roughness: 0.28 }),
  motor: new THREE.MeshPhysicalMaterial({ color: 0x2a2e36, metalness: 0.7, roughness: 0.35 }),
  copper: new THREE.MeshPhysicalMaterial({ color: 0xb87333, metalness: 1, roughness: 0.35 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1a4a2a, metalness: 0.2, roughness: 0.6 }),
  batt: new THREE.MeshPhysicalMaterial({ color: 0x1f3a2a, metalness: 0.4, roughness: 0.45 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff6a00, emissiveIntensity: 0.45, roughness: 0.4 }),
  sensor: new THREE.MeshPhysicalMaterial({ color: 0x3a4050, metalness: 0.5, roughness: 0.4 }),
  lidar: new THREE.MeshPhysicalMaterial({ color: 0xc0c4ca, metalness: 0.9, roughness: 0.25 }),
  glow: new THREE.MeshBasicMaterial({ color: 0x3ecf8e }),
  xrayShell: null,
};
M.xrayShell = M.fabric.clone();
M.xrayShell.transparent = true;
M.xrayShell.opacity = 0.22;
M.xrayShell.depthWrite = false;

/* ========== Dimensions (meters) ========== */
const Lx = 0.88, Wy = 0.51, Hz = 0.35; // tub L W H
const wheelR = 0.085, wheelW = 0.10;
const groundClear = 0.10; // approx under tub
const axleY = wheelR;
const tubBottomY = axleY + 0.02; // approx
const tubTopY = tubBottomY + Hz;
const WHEEL_TRACK = Wy + 0.04;
const WHEELBASE = Lx - 0.16;
const SHAFT_D = 0.012; // Ø12 keyed axle

const root = new THREE.Group();
scene.add(root);
const wagon = new THREE.Group();
root.add(wagon);

const labelDefs = []; // {id, he, en, obj, group}
const parts = {}; // named groups for xray/cut/cfg
const driveAnim = { sprocketMotor: null, sprocketAxle: null, chain: null, chainOffset: 0, gears: [], hubs: [] };

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(r, h, mat, radSeg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radSeg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function addLabel(id, he, en, obj) {
  labelDefs.push({ id, he, en, obj });
}

/* ========== Build wagon body (from photo) ========== */
function buildWagonBody() {
  const body = new THREE.Group();
  body.name = 'body';

  // Corner vertical posts
  const postH = Hz + 0.04;
  const tube = 0.022;
  const posts = [
    [ Lx/2 - 0.02,  Wy/2 - 0.02],
    [ Lx/2 - 0.02, -Wy/2 + 0.02],
    [-Lx/2 + 0.02,  Wy/2 - 0.02],
    [-Lx/2 + 0.02, -Wy/2 + 0.02],
  ];
  posts.forEach(([x, z]) => {
    const p = box(tube, postH, tube, M.aluBrown);
    p.position.set(x, tubBottomY + postH/2, z);
    body.add(p);
  });

  // Top rails
  const topY = tubTopY;
  [[0, Wy/2 - 0.02, Lx - 0.04, tube, tube], [0, -Wy/2 + 0.02, Lx - 0.04, tube, tube]].forEach(([x,z,w,h,d]) => {
    const r = box(w, h, d, M.aluBrown); r.position.set(x, topY, z); body.add(r);
  });
  [[Lx/2 - 0.02, 0, tube, tube, Wy - 0.04], [-Lx/2 + 0.02, 0, tube, tube, Wy - 0.04]].forEach(([x,z,w,h,d]) => {
    const r = box(w, h, d, M.aluBrown); r.position.set(x, topY, z); body.add(r);
  });

  // Bottom rails (frame)
  const botY = tubBottomY;
  [[0, Wy/2 - 0.02, Lx - 0.04, tube, tube], [0, -Wy/2 + 0.02, Lx - 0.04, tube, tube]].forEach(([x,z,w,h,d]) => {
    const r = box(w, h, d, M.aluDark); r.position.set(x, botY, z); body.add(r);
  });

  // X-scissor side frames (3 X's per side) — schematic but photo-like
  function addScissor(zSide) {
    const g = new THREE.Group();
    const segs = 3;
    const span = Lx - 0.08;
    const segW = span / segs;
    for (let i = 0; i < segs; i++) {
      const cx = -Lx/2 + 0.04 + segW * (i + 0.5);
      const barLen = Math.hypot(segW * 0.92, Hz * 0.92);
      const ang = Math.atan2(Hz * 0.92, segW * 0.92);
      for (const sign of [1, -1]) {
        const b = box(barLen, 0.014, 0.018, M.aluBrown);
        b.position.set(cx, (tubBottomY + tubTopY) / 2, zSide);
        b.rotation.z = sign * ang;
        g.add(b);
      }
      // pivot
      const piv = cyl(0.012, 0.02, M.plasticBlk, 12);
      piv.rotation.x = Math.PI/2;
      piv.position.set(cx, (tubBottomY + tubTopY) / 2, zSide);
      g.add(piv);
    }
    body.add(g);
  }
  addScissor(Wy/2 - 0.02);
  addScissor(-Wy/2 + 0.02);

  // Cross members under tub for mounting plate
  for (let i = -1; i <= 1; i++) {
    const c = box(0.018, 0.014, Wy - 0.06, M.aluDark);
    c.position.set(i * 0.28, tubBottomY - 0.01, 0);
    body.add(c);
  }

  // Fabric tub (beige)
  const fabricG = new THREE.Group();
  fabricG.name = 'fabric';
  const wallT = 0.008;
  // floor
  const floor = box(Lx - 0.06, wallT, Wy - 0.06, M.fabric);
  floor.position.set(0, tubBottomY + 0.01, 0);
  fabricG.add(floor);
  // walls
  const wh = Hz - 0.02;
  const walls = [
    [0, Wy/2 - 0.035, Lx - 0.08, wh, wallT],
    [0, -Wy/2 + 0.035, Lx - 0.08, wh, wallT],
    [Lx/2 - 0.035, 0, wallT, wh, Wy - 0.08],
    [-Lx/2 + 0.035, 0, wallT, wh, Wy - 0.08],
  ];
  walls.forEach(([x,z,w,h,d]) => {
    const wmesh = box(w, h, d, M.fabric);
    wmesh.position.set(x, tubBottomY + 0.015 + h/2, z);
    fabricG.add(wmesh);
  });
  // front mesh pockets (schematic)
  for (const zz of [-0.12, 0.12]) {
    const pocket = box(0.004, 0.14, 0.10, M.fabricDark);
    pocket.position.set(Lx/2 - 0.01, tubBottomY + 0.12, zz);
    fabricG.add(pocket);
  }
  body.add(fabricG);
  parts.fabric = fabricG;

  // Handle (front, +X) telescoping with D-grip
  const handle = new THREE.Group();
  handle.name = 'handle';
  const shaft = cyl(0.012, 0.55, M.aluBrown, 16);
  shaft.position.set(Lx/2 + 0.02, tubTopY + 0.15, 0);
  handle.add(shaft);
  const grip = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 12, 24, Math.PI), M.plasticBlk);
  grip.rotation.z = Math.PI/2;
  grip.rotation.y = Math.PI/2;
  grip.position.set(Lx/2 + 0.02, tubTopY + 0.15 + 0.28, 0);
  handle.add(grip);
  const gripBar = cyl(0.014, 0.11, M.plasticBlk, 12);
  gripBar.rotation.z = Math.PI/2;
  gripBar.position.set(Lx/2 + 0.02, tubTopY + 0.15 + 0.335, 0);
  handle.add(gripBar);
  body.add(handle);
  addLabel('handle', 'ידית משיכה', 'Pull handle', shaft);

  wagon.add(body);
  parts.body = body;
  return body;
}

/* Wheels */
const wheelMeshes = [];

/** Wheel hierarchy:
 *  holder @ hub center
 *    yawPivot (kingpin / caster yaw about +Y)
 *      fork
 *      spinGroup (rolls about local +Z = axle axis)
 *        tire + visible tread lugs + hub
 */
function makeWheel() {
  const spin = new THREE.Group();
  // Cylinder default axis = Y; rotate X so axle = Z (lateral)
  const tire = cyl(wheelR, wheelW * 0.92, M.rubber, 36);
  tire.rotation.x = Math.PI / 2;
  spin.add(tire);
  // Sidewall rings (do NOT use as spin markers — fixed on tire)
  for (const side of [-1, 1]) {
    const wall = cyl(wheelR * 0.72, 0.008, M.plasticBlk, 24);
    wall.rotation.x = Math.PI / 2;
    wall.position.z = side * (wheelW * 0.42);
    spin.add(wall);
  }
  // Visible tread lugs around circumference — show rotation clearly
  const lugMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.95 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const lug = box(0.022, 0.014, 0.028, lugMat);
    lug.position.set(Math.sin(a) * (wheelR - 0.004), Math.cos(a) * (wheelR - 0.004), 0);
    lug.rotation.z = -a;
    spin.add(lug);
  }
  // Orange paint mark on sidewall for visual spin reference
  const mark = box(0.01, 0.04, 0.006, M.accent);
  mark.position.set(0, wheelR * 0.55, wheelW * 0.48);
  spin.add(mark);
  const hub = cyl(0.028, wheelW * 0.45, M.steel, 16);
  hub.rotation.x = Math.PI / 2;
  spin.add(hub);
  // Hex adapter / keyed hub face
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 6), M.steel);
  hex.rotation.x = Math.PI / 2;
  hex.position.z = wheelW * 0.28;
  spin.add(hex);
  return spin;
}
function makeFork() {
  const g = new THREE.Group();
  const u = box(0.04, 0.055, wheelW + 0.045, M.aluBrown);
  u.position.y = 0.028;
  g.add(u);
  const legL = box(0.016, 0.075, 0.014, M.aluBrown);
  legL.position.set(0, -0.015, wheelW / 2 + 0.008);
  g.add(legL);
  const legR = box(0.016, 0.075, 0.014, M.aluBrown);
  legR.position.set(0, -0.015, -wheelW / 2 - 0.008);
  g.add(legR);
  // Flanged bearing housings on legs (UCFL-style schematic)
  for (const zs of [wheelW / 2 + 0.008, -wheelW / 2 - 0.008]) {
    const brg = cyl(0.014, 0.012, M.steel, 12);
    brg.rotation.x = Math.PI / 2;
    brg.position.set(0, 0, zs);
    g.add(brg);
  }
  return g;
}

function buildWheels() {
  const wg = new THREE.Group();
  const positions = [
    { id: 'FL', x:  Lx / 2 - 0.08, z:  Wy / 2 + 0.02, caster: true, side: 1 },
    { id: 'FR', x:  Lx / 2 - 0.08, z: -Wy / 2 - 0.02, caster: true, side: -1 },
    { id: 'RL', x: -Lx / 2 + 0.08, z:  Wy / 2 + 0.02, caster: false, side: 1 },
    { id: 'RR', x: -Lx / 2 + 0.08, z: -Wy / 2 - 0.02, caster: false, side: -1 },
  ];
  positions.forEach(p => {
    const holder = new THREE.Group();
    holder.position.set(p.x, axleY, p.z);
    const yawPivot = new THREE.Group();
    holder.add(yawPivot);
    const fork = makeFork();
    yawPivot.add(fork);
    const spin = makeWheel();
    yawPivot.add(spin);
    if (p.caster) {
      const swivel = cyl(0.018, 0.022, M.plasticBlk, 12);
      swivel.position.y = 0.055;
      yawPivot.add(swivel);
      const br = box(0.03, 0.012, 0.04, M.plasticBlk);
      br.position.set(0.02, -0.02, 0);
      yawPivot.add(br);
    }
    wg.add(holder);
    wheelMeshes.push({
      id: p.id, holder, yawPivot, wheel: spin, caster: p.caster,
      side: p.side, x: p.x, z: p.z, spinAngle: 0, steerAngle: 0, omega: 0
    });
    addLabel('wheel_' + p.id, 'גלגל ' + p.id, 'Wheel ' + p.id, spin);
  });
  wagon.add(wg);
  parts.wheels = wg;
}

/* Mounting plate under tub */
function buildBasePlate() {
  const plate = box(Lx - 0.12, 0.006, Wy - 0.12, M.steel);
  plate.position.set(0, tubBottomY - 0.035, 0);
  wagon.add(plate);
  parts.plate = plate;
  addLabel('plate', 'לוחית הרכבה', 'Mounting plate', plate);
}

function makeSprocket(teeth, pitchR, thick, mat) {
  const g = new THREE.Group();
  const disc = cyl(pitchR * 0.85, thick, mat, Math.max(16, teeth));
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = box(0.006, 0.01, thick * 0.9, mat);
    t.position.set(Math.sin(a) * pitchR, Math.cos(a) * pitchR, 0);
    t.rotation.z = -a;
    g.add(t);
  }
  const bore = cyl(SHAFT_D * 0.55, thick + 0.004, M.steel, 10);
  bore.rotation.x = Math.PI / 2;
  g.add(bore);
  g.userData.teeth = teeth;
  g.userData.pitchR = pitchR;
  return g;
}

function makePillowBlock(x, y, z, parent) {
  const g = new THREE.Group();
  const base = box(0.055, 0.012, 0.032, M.aluDark);
  base.position.y = -0.02;
  g.add(base);
  const house = cyl(0.018, 0.022, M.steel, 14);
  house.rotation.x = Math.PI / 2;
  g.add(house);
  // Bolt heads
  for (const dx of [-0.018, 0.018]) {
    const bolt = cyl(0.004, 0.01, M.steel, 8);
    bolt.position.set(dx, -0.012, 0);
    g.add(bolt);
  }
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/* ========== Drivetrain A: motor→GB→sprocket→chain→axle + Ackermann ========== */
function buildCfgA() {
  const g = new THREE.Group();
  g.name = 'cfgA';
  const axleX = -Lx / 2 + 0.08;
  const axleY0 = axleY;

  // Rear axle Ø12 through pillow blocks
  const axle = cyl(SHAFT_D / 2, Wy + 0.12, M.steel, 14);
  axle.rotation.x = Math.PI / 2;
  axle.position.set(axleX, axleY0, 0);
  g.add(axle);
  driveAnim.axleA = axle;
  makePillowBlock(axleX, axleY0, Wy / 2 - 0.04, g);
  makePillowBlock(axleX, axleY0, -Wy / 2 + 0.04, g);
  addLabel('axle', 'ציר אחורי Ø12 + UCFL', 'Rear axle Ø12 + UCFL', axle);

  // Open differential housing (or explain one-wheel option)
  const diff = box(0.10, 0.075, 0.12, M.motor);
  diff.position.set(axleX, axleY0 + 0.015, 0);
  g.add(diff);
  // Internal bevel hint (visible in xray/section)
  const bevel = cyl(0.028, 0.02, M.steel, 16);
  bevel.rotation.x = Math.PI / 2;
  bevel.position.set(axleX, axleY0 + 0.015, 0);
  g.add(bevel);
  addLabel('diff', 'דיפרנציאל פתוח', 'Open differential', diff);

  // Axle sprocket (#25, 42T schematic)
  const sprocketAxle = makeSprocket(42, 0.048, 0.012, M.steel);
  sprocketAxle.position.set(axleX, axleY0, 0.10);
  g.add(sprocketAxle);
  driveAnim.sprocketAxle = sprocketAxle;
  addLabel('sprocketA', 'גלגל שיניים 42T #25', 'Sprocket 42T #25', sprocketAxle);

  // Motor mount bracket bolted to plate
  const bracket = box(0.09, 0.05, 0.08, M.aluDark);
  bracket.position.set(-0.12, tubBottomY - 0.055, 0.14);
  g.add(bracket);
  for (const [dx, dz] of [[-0.03, -0.025], [0.03, -0.025], [-0.03, 0.025], [0.03, 0.025]]) {
    const bolt = cyl(0.004, 0.012, M.steel, 6);
    bolt.position.set(-0.12 + dx, tubBottomY - 0.028, 0.14 + dz);
    g.add(bolt);
  }
  addLabel('mBracket', 'תושבת מנוע (ברגים M5)', 'Motor bracket (M5)', bracket);

  // Geared motor body + gearbox
  const motor = cyl(0.036, 0.11, M.motor, 20);
  motor.rotation.x = Math.PI / 2;
  motor.position.set(-0.20, tubBottomY - 0.055, 0.14);
  g.add(motor);
  const gb = box(0.075, 0.058, 0.072, M.aluBrown);
  gb.position.set(-0.11, tubBottomY - 0.055, 0.14);
  g.add(gb);
  // Output shaft
  const outShaft = cyl(SHAFT_D / 2, 0.04, M.steel, 10);
  outShaft.rotation.x = Math.PI / 2;
  outShaft.position.set(-0.11, tubBottomY - 0.055, 0.10);
  g.add(outShaft);
  addLabel('motorA', 'מנוע 24V 250W + תיבה 30:1', '24V 250W + GB 30:1', motor);

  // Motor sprocket 14T
  const sprocketMotor = makeSprocket(14, 0.018, 0.01, M.steel);
  sprocketMotor.position.set(-0.11, tubBottomY - 0.055, 0.10);
  g.add(sprocketMotor);
  driveAnim.sprocketMotor = sprocketMotor;
  addLabel('sprocketM', 'גלגל מנוע 14T', 'Motor sprocket 14T', sprocketMotor);

  // Chain (#25) as linked boxes between sprocket centers + tensioner
  const chainG = new THREE.Group();
  const c0 = new THREE.Vector3(-0.11, tubBottomY - 0.055, 0.10);
  const c1 = new THREE.Vector3(axleX, axleY0, 0.10);
  const nLinks = 28;
  driveAnim.chainLinks = [];
  for (let i = 0; i < nLinks; i++) {
    const t = i / nLinks;
    // Ellipse-ish loop around both centers
    const ang = t * Math.PI * 2;
    const mid = c0.clone().lerp(c1, 0.5);
    const along = c1.clone().sub(c0);
    const len = along.length();
    const ux = along.clone().normalize();
    const uy = new THREE.Vector3(0, 1, 0);
    const rx = len / 2 + 0.025;
    const ry = 0.045;
    const pos = mid.clone().add(ux.clone().multiplyScalar(Math.cos(ang) * rx)).add(uy.clone().multiplyScalar(Math.sin(ang) * ry));
    const link = box(0.012, 0.006, 0.008, M.steel);
    link.position.copy(pos);
    chainG.add(link);
    driveAnim.chainLinks.push({ mesh: link, ang0: ang, mid, ux, uy, rx, ry });
  }
  g.add(chainG);
  driveAnim.chain = chainG;
  addLabel('chain', 'שרשרת #25 + מותחן', 'Chain #25 + tensioner', chainG.children[0]);

  // Tensioner idler
  const tensArm = box(0.04, 0.008, 0.012, M.aluDark);
  tensArm.position.set(-0.02, tubBottomY - 0.08, 0.10);
  g.add(tensArm);
  const idler = cyl(0.012, 0.01, M.plasticBlk, 12);
  idler.rotation.x = Math.PI / 2;
  idler.position.set(-0.005, tubBottomY - 0.09, 0.10);
  g.add(idler);
  driveAnim.idler = idler;

  // Driver
  const drv = box(0.06, 0.018, 0.045, M.pcb);
  drv.position.set(-0.05, tubBottomY - 0.048, 0.20);
  g.add(drv);
  addLabel('drvA', 'BTS7960 43A', 'BTS7960 43A', drv);

  // ---- Front Ackermann ----
  const servo = box(0.055, 0.038, 0.028, M.accent);
  servo.position.set(Lx / 2 - 0.20, tubBottomY - 0.048, 0);
  g.add(servo);
  const horn = box(0.045, 0.008, 0.014, M.steel);
  horn.position.set(Lx / 2 - 0.165, tubBottomY - 0.042, 0);
  g.add(horn);
  driveAnim.servoHorn = horn;
  addLabel('servo', 'סרבו 20kg·cm', 'Servo 20kg·cm', servo);

  // Tie rod
  const tie = cyl(0.005, Wy * 0.72, M.steel, 10);
  tie.rotation.x = Math.PI / 2;
  tie.position.set(Lx / 2 - 0.14, axleY0 + 0.035, 0);
  g.add(tie);
  driveAnim.tieRod = tie;
  addLabel('tierod', 'מוט הגה (tie rod)', 'Tie rod', tie);

  // Ackermann arms / kingpin stubs at front wheel holders (visual)
  for (const zs of [Wy / 2 + 0.02, -Wy / 2 - 0.02]) {
    const arm = box(0.05, 0.01, 0.012, M.steel);
    arm.position.set(Lx / 2 - 0.12, axleY0 + 0.035, zs * 0.55);
    g.add(arm);
    const king = cyl(0.008, 0.04, M.steel, 10);
    king.position.set(Lx / 2 - 0.08, axleY0 + 0.03, zs);
    g.add(king);
  }
  addLabel('kingpin', 'קינגפין + זרוע Ackermann', 'Kingpin + Ackermann arm', g.children[g.children.length - 1]);

  // Folding note plate
  const foldNote = box(0.08, 0.002, 0.04, M.accent);
  foldNote.position.set(-0.25, tubBottomY - 0.038, 0.18);
  g.add(foldNote);

  wagon.add(g);
  parts.cfgA = g;
  return g;
}

/* ========== Drivetrain B: 4× geared/hub with bearing support ========== */
function buildCfgB() {
  const g = new THREE.Group();
  g.name = 'cfgB';
  driveAnim.hubs = [];
  const positions = [
    { id: 'FL', x: Lx / 2 - 0.08, z: Wy / 2 + 0.02 },
    { id: 'FR', x: Lx / 2 - 0.08, z: -Wy / 2 - 0.02 },
    { id: 'RL', x: -Lx / 2 + 0.08, z: Wy / 2 + 0.02 },
    { id: 'RR', x: -Lx / 2 + 0.08, z: -Wy / 2 - 0.02 },
  ];
  positions.forEach((p, i) => {
    const unit = new THREE.Group();
    // Mount plate to folding leg / fork bracket
    const mount = box(0.05, 0.04, 0.06, M.aluDark);
    mount.position.set(p.x - 0.02, axleY + 0.02, p.z);
    unit.add(mount);
    // Geared motor body (inboard of wheel) — shaft not carrying radial tire load
    const mot = cyl(0.028, 0.07, M.motor, 18);
    mot.rotation.z = Math.PI / 2;
    mot.position.set(p.x - 0.05, axleY, p.z);
    unit.add(mot);
    // Output D-shaft / hex
    const shaft = cyl(0.006, 0.035, M.steel, 10);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(p.x - 0.01, axleY, p.z);
    unit.add(shaft);
    // Coupler / hub adapter
    const cpl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6), M.steel);
    cpl.rotation.z = Math.PI / 2;
    cpl.position.set(p.x + 0.01, axleY, p.z);
    unit.add(cpl);
    // Bearing carrier (radial load path: wheel → bearing → bracket, not motor bearings)
    const brgCarrier = box(0.03, 0.045, 0.045, M.aluBrown);
    brgCarrier.position.set(p.x + 0.005, axleY + 0.005, p.z);
    unit.add(brgCarrier);
    const brg = cyl(0.016, 0.012, M.steel, 12);
    brg.rotation.z = Math.PI / 2;
    brg.position.set(p.x + 0.005, axleY, p.z);
    unit.add(brg);
    // Hub motor disk (outer, visible)
    const hubDisk = cyl(0.048, 0.04, M.motor, 20);
    hubDisk.rotation.z = Math.PI / 2;
    hubDisk.position.set(p.x, axleY, p.z);
    unit.add(hubDisk);
    const band = cyl(0.05, 0.01, M.accent, 20);
    band.rotation.z = Math.PI / 2;
    band.position.set(p.x, axleY, p.z);
    unit.add(band);
    g.add(unit);
    driveAnim.hubs.push({ unit, mot, hubDisk, band, id: p.id });
    if (i === 0) {
      addLabel('hub', 'מנוע+תושבת+מיסב 6204', 'Motor+bracket+6204 brg', hubDisk);
      addLabel('couple', 'מחבר Hex / D-shaft', 'Hex / D-shaft coupler', cpl);
      addLabel('brgB', 'מיסב נושא עומס רדיאלי', 'Radial load bearing', brg);
    }
  });
  // Dual drivers
  for (let i = 0; i < 2; i++) {
    const drv = box(0.07, 0.018, 0.05, M.pcb);
    drv.position.set(-0.05 + i * 0.12, tubBottomY - 0.048, 0.16);
    g.add(drv);
    if (i === 0) addLabel('drvB', 'דרייברים כפולים MDD10A', 'Dual drivers MDD10A', drv);
  }
  wagon.add(g);
  parts.cfgB = g;
  return g;
}

/* ========== Shared electronics ========== */
function buildElectronics() {
  const g = new THREE.Group();
  g.name = 'elec';

  // Battery pack 24V LiFePO4 under center
  const batt = box(0.22, 0.07, 0.14, M.batt);
  batt.position.set(0.05, tubBottomY - 0.06, -0.05);
  g.add(batt);
  // terminal posts
  const tp1 = cyl(0.006, 0.015, M.copper, 8); tp1.position.set(0.14, tubBottomY - 0.035, -0.02); g.add(tp1);
  const tp2 = cyl(0.006, 0.015, M.steel, 8); tp2.position.set(0.14, tubBottomY - 0.035, -0.08); g.add(tp2);
  addLabel('batt', 'סוללת LiFePO4 24V 20Ah', 'LiFePO4 24V 20Ah', batt);

  // BMS
  const bms = box(0.06, 0.012, 0.04, M.pcb);
  bms.position.set(0.18, tubBottomY - 0.048, -0.05);
  g.add(bms);
  addLabel('bms', 'BMS', 'BMS', bms);

  // Fuse
  const fuse = box(0.035, 0.02, 0.018, M.plasticBlk);
  fuse.position.set(0.22, tubBottomY - 0.05, 0.02);
  g.add(fuse);
  addLabel('fuse', 'נתיך 40A', 'Fuse 40A', fuse);

  // Main switch
  const sw = cyl(0.018, 0.025, M.plasticBlk, 12);
  sw.position.set(0.22, tubBottomY - 0.03, 0.08);
  g.add(sw);
  addLabel('switch', 'מפסק ראשי', 'Main switch', sw);

  // E-stop on top rail front
  const estop = cyl(0.022, 0.02, new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.4 }), 16);
  estop.position.set(Lx/2 - 0.05, tubTopY + 0.025, Wy/2 - 0.05);
  g.add(estop);
  addLabel('estop', 'עצירת חירום', 'E-stop', estop);

  // ESP32 board
  const esp = box(0.055, 0.01, 0.028, M.pcb);
  esp.position.set(-0.15, tubBottomY - 0.045, -0.14);
  g.add(esp);
  addLabel('esp32', 'ESP32', 'ESP32', esp);

  // Optional Pi / Jetson
  const pi = box(0.09, 0.018, 0.06, M.plasticBlk);
  pi.position.set(-0.28, tubBottomY - 0.05, -0.12);
  g.add(pi);
  addLabel('pi', 'RPi / Jetson (אופציונלי)', 'RPi / Jetson (optional)', pi);

  // DC-DC
  const dcdc = box(0.05, 0.025, 0.03, M.aluDark);
  dcdc.position.set(0.05, tubBottomY - 0.055, -0.18);
  g.add(dcdc);
  addLabel('dcdc', 'DC-DC 24→5/12V', 'DC-DC 24→5/12V', dcdc);

  // Wiring harness (schematic cable runs)
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.7 });
  const runs = [
    [[0.05, tubBottomY - 0.07, -0.05], [-0.15, tubBottomY - 0.05, -0.14]],
    [[0.05, tubBottomY - 0.07, -0.05], [-0.05, tubBottomY - 0.05, 0.16]],
    [[-0.15, tubBottomY - 0.05, -0.14], [Lx/2 - 0.1, tubBottomY - 0.02, 0]],
  ];
  runs.forEach(([a, b]) => {
    const dir = new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a));
    const len = dir.length();
    const c = cyl(0.004, len, cableMat, 6);
    c.position.fromArray([(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2]);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    g.add(c);
  });

  wagon.add(g);
  parts.elec = g;
}

/* Sensors */
function buildSensors() {
  const g = new THREE.Group();
  g.name = 'sensors';

  // Ultrasonic / ToF bumpers front + sides
  const usPos = [
    [Lx/2 + 0.01, tubBottomY + 0.08, 0],
    [Lx/2 - 0.05, tubBottomY + 0.08, Wy/2],
    [Lx/2 - 0.05, tubBottomY + 0.08, -Wy/2],
    [-Lx/2 - 0.01, tubBottomY + 0.08, 0],
  ];
  usPos.forEach((p, i) => {
    const us = box(0.022, 0.018, 0.04, M.sensor);
    us.position.set(...p);
    g.add(us);
    // eyes
    for (const dz of [-0.01, 0.01]) {
      const eye = cyl(0.006, 0.008, M.glow, 8);
      eye.rotation.z = Math.PI/2;
      eye.position.set(p[0] + 0.012, p[1], p[2] + dz);
      g.add(eye);
    }
    if (i === 0) addLabel('us', 'אולטרסוניק / ToF', 'Ultrasonic / ToF', us);
  });

  // 2D LiDAR on front top
  const lidarBase = cyl(0.035, 0.025, M.lidar, 24);
  lidarBase.position.set(Lx/2 - 0.12, tubTopY + 0.04, 0);
  g.add(lidarBase);
  const lidarSpin = cyl(0.028, 0.02, M.plasticBlk, 16);
  lidarSpin.position.set(Lx/2 - 0.12, tubTopY + 0.06, 0);
  g.add(lidarSpin);
  parts.lidarSpin = lidarSpin;
  addLabel('lidar', 'LiDAR 2D', '2D LiDAR', lidarBase);

  // IMU (small cube near ESP)
  const imu = box(0.02, 0.008, 0.015, M.accent);
  imu.position.set(-0.12, tubBottomY - 0.042, -0.14);
  g.add(imu);
  addLabel('imu', 'IMU', 'IMU', imu);

  // GPS puck
  const gps = cyl(0.025, 0.012, M.plasticBlk, 16);
  gps.position.set(-0.2, tubTopY + 0.02, -Wy/2 + 0.08);
  g.add(gps);
  addLabel('gps', 'GPS', 'GPS', gps);

  // Camera front
  const cam = box(0.03, 0.025, 0.03, M.plasticBlk);
  cam.position.set(Lx/2 - 0.02, tubTopY + 0.02, 0.12);
  g.add(cam);
  const lens = cyl(0.01, 0.01, M.steel, 12);
  lens.rotation.z = Math.PI/2;
  lens.position.set(Lx/2 + 0.005, tubTopY + 0.02, 0.12);
  g.add(lens);
  addLabel('cam', 'מצלמה', 'Camera', cam);

  // UWB/BLE antenna
  const ant = cyl(0.004, 0.08, M.steel, 6);
  ant.position.set(-Lx/2 + 0.05, tubTopY + 0.05, Wy/2 - 0.05);
  g.add(ant);
  addLabel('uwb', 'אנטנת UWB/BLE', 'UWB/BLE antenna', ant);

  // Wheel encoders (on rear)
  for (const zs of [Wy/2 + 0.02, -Wy/2 - 0.02]) {
    const enc = cyl(0.02, 0.015, M.sensor, 12);
    enc.rotation.z = Math.PI/2;
    enc.position.set(-Lx/2 + 0.08, axleY, zs - Math.sign(zs) * 0.06);
    g.add(enc);
  }
  addLabel('enc', 'אנקודי גלגל', 'Wheel encoders', g.children[g.children.length - 1]);

  wagon.add(g);
  parts.sensors = g;
}

/* Follow-me target (person tag) */
let followTarget = null;
function buildFollowTarget() {
  const g = new THREE.Group();
  // simple person marker
  const body = cyl(0.08, 0.5, new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.6 }), 16);
  body.position.y = 0.35;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe8c4a0 }));
  head.position.y = 0.68;
  g.add(head);
  // BLE tag glow
  const tag = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshStandardMaterial({ color: 0x3ecf8e, emissive: 0x1a8a4a, emissiveIntensity: 0.8 }));
  tag.position.set(0.1, 0.5, 0);
  g.add(tag);
  g.position.set(2.5, 0, 0.5);
  g.visible = false;
  scene.add(g);
  followTarget = g;
  addLabel('follow', 'תג Follow-Me', 'Follow-Me tag', tag);
}

/* Obstacles */
const obstacles = [];
function addObstacle(x, z) {
  const o = box(0.35, 0.4, 0.35, new THREE.MeshStandardMaterial({ color: 0x6a3a2a, roughness: 0.8 }));
  o.position.set(x, 0.2, z);
  o.castShadow = true;
  scene.add(o);
  obstacles.push(o);
}
function clearObstacles() {
  obstacles.forEach(o => scene.remove(o));
  obstacles.length = 0;
}

/* Waypoints */
const waypoints = [];
const wpGroup = new THREE.Group();
scene.add(wpGroup);
function setDefaultWaypoints() {
  wpGroup.clear();
  waypoints.length = 0;
  const pts = [[2, 0], [2, 2], [0, 2.5], [-1.5, 1], [-1, -1], [1.5, -1.5]];
  pts.forEach((p, i) => {
    waypoints.push(new THREE.Vector3(p[0], 0, p[1]));
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff6a00, emissiveIntensity: 0.4 })
    );
    m.position.set(p[0], 0.06, p[1]);
    wpGroup.add(m);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.13, 24),
      new THREE.MeshBasicMaterial({ color: 0xff7a1a, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = -Math.PI/2;
    ring.position.set(p[0], 0.01, p[1]);
    wpGroup.add(ring);
  });
  wpGroup.visible = false;
}

/* Build all */
buildWagonBody();
buildWheels();
buildBasePlate();
buildCfgA();
buildCfgB();
buildElectronics();
buildSensors();
buildFollowTarget();
setDefaultWaypoints();

function applyCfg() {
  if (parts.cfgA) parts.cfgA.visible = S.cfg === 'A';
  if (parts.cfgB) parts.cfgB.visible = S.cfg === 'B';
  // In config A front casters steer; in B all wheels fixed for skid
  wheelMeshes.forEach(w => {
    if (w.yawPivot) w.yawPivot.rotation.y = 0;
    w.steerAngle = 0;
  });
  syncLabels();
  renderPanel();
  if (S.mechView) openMechView(S.cfg === 'A' ? 'motor' : 'hub');
  toast(S.cfg === 'A' ? T('cfgA') : T('cfgB'));
}

function applyXray() {
  const fab = parts.fabric;
  if (!fab) return;
  fab.traverse(o => {
    if (o.isMesh) {
      if (!o.userData._mat) o.userData._mat = o.material;
      o.material = S.xray ? M.xrayShell : o.userData._mat;
    }
  });
  // also faintly show body tubes when xray
  if (parts.body) {
    parts.body.traverse(o => {
      if (o.isMesh && o.parent && o.parent.name !== 'fabric') {
        if (!o.userData._mat) o.userData._mat = o.material;
        if (S.xray) {
          const xm = o.userData._mat.clone();
          xm.transparent = true; xm.opacity = 0.35; xm.depthWrite = false;
          o.material = xm;
        } else {
          o.material = o.userData._mat;
        }
      }
    });
  }
}

function applyCut() {
  // section plane: hide +Z half of wagon contents
  wagon.traverse(o => {
    if (!o.isMesh) return;
    if (!o.userData._cutChecked) {
      o.userData._origPos = true;
      o.userData._cutChecked = true;
    }
  });
  // Use clipping plane
  if (S.cut) {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    renderer.clippingPlanes = [plane];
    renderer.localClippingEnabled = true;
  } else {
    renderer.clippingPlanes = [];
    renderer.localClippingEnabled = false;
  }
}

/* Labels DOM */
const labelsEl = document.getElementById('labels');
const labelEls = {};
function syncLabels() {
  labelsEl.innerHTML = '';
  labelDefs.forEach(d => {
    // skip cfg-specific when hidden
    const onlyA = ['hub','drvB','couple','brgB'];
    const onlyB = ['motorA','diff','drvA','servo','axle','sprocketA','sprocketM','chain','mBracket','tierod','kingpin'];
    // note: onlyA = hide when cfg A (these are B-only ids)
    if (S.cfg === 'A' && ['hub','drvB','couple','brgB'].includes(d.id)) return;
    if (S.cfg === 'B' && ['motorA','diff','drvA','servo','axle','sprocketA','sprocketM','chain','mBracket','tierod','kingpin'].includes(d.id)) return;
    if (!S.labels) return;
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = `<span class="dot"></span>${lang==='he'?d.he:d.en}`;
    el.onclick = () => focusPart(d);
    labelsEl.appendChild(el);
    labelEls[d.id] = { el, def: d };
  });
}
function updateLabelPositions() {
  if (!S.labels) { labelsEl.style.display = 'none'; return; }
  labelsEl.style.display = 'block';
  const v = new THREE.Vector3();
  Object.values(labelEls).forEach(({ el, def }) => {
    if (!def.obj) return;
    def.obj.getWorldPosition(v);
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * innerWidth;
    const y = (-v.y * 0.5 + 0.5) * innerHeight;
    if (v.z > 1) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  });
}
function focusPart(d) {
  const v = new THREE.Vector3();
  d.obj.getWorldPosition(v);
  controls.target.lerp(v, 0.6);
  showTourCard(d);
}

/* Tour */
const tourOrder = ['handle','wheel_FL','plate','batt','bms','esp32','motorA','diff','servo','hub','drvB','us','lidar','imu','gps','cam','uwb','enc','estop','follow'];
function showTourCard(d) {
  const card = document.getElementById('tourCard');
  card.classList.remove('hidden');
  const desc = {
    handle: L('ידית טלסקופית עם אחיזת D — נשארת לשימוש ידני / דחיפה.', 'Telescoping D-grip handle — kept for manual push.'),
    wheel_FL: L('גלגל רחב Ø17×10 ס״מ — מתאים לחול/שטח. קדמיים על קסטר 360°.', 'Fat tire Ø17×10 cm — sand/rough terrain. Front on 360° casters.'),
    plate: L('לוחית אלומיניום תחתונה — בסיס לכל הרכיבים החשמליים וההנעה.', 'Aluminum undercarriage plate — mounts all electronics & drivetrain.'),
    batt: L('סוללת LiFePO4 24V 20Ah — בטוחה יותר מליטיום רגיל, ~480Wh.', 'LiFePO4 24V 20Ah — safer chemistry, ~480Wh.'),
    bms: L('BMS מגן מפני טעינת-יתר, פריקה עמוקה וזרם יתר.', 'BMS protects against overcharge, deep discharge, overcurrent.'),
    esp32: L('בקר ראשי — WiFi/BLE, קורא חיישנים ושולט בדרייברים.', 'Main MCU — WiFi/BLE, reads sensors, drives motor controllers.'),
    motorA: L('מנוע יחיד 24V ~250W + תיבת הילוכים — מניע את הציר האחורי.', 'Single 24V ~250W geared motor — drives the rear axle.'),
    diff: L('דיפרנציאל מאפשר סיבוב חלק בפניות בלי גלגל מחליק.', 'Differential allows smooth turns without wheel scrub.'),
    servo: L('סרבו/מפעיל להיגוי Ackermann בגלגלים הקדמיים.', 'Servo/actuator for front Ackermann steering.'),
    hub: L('מנוע רכזת/ממוכפל לכל גלגל — שליטה עצמאית (skid-steer).', 'Hub/geared motor per wheel — independent skid-steer control.'),
    drvB: L('דרייברים כפולים (למשל 2×BTS7960) — שמאל/ימין.', 'Dual drivers (e.g. 2×BTS7960) — left/right banks.'),
    us: L('חיישני מרחק לפגושים — עצירה לפני מכשולים קרובים.', 'Range sensors on bumpers — stop before near obstacles.'),
    lidar: L('LiDAR דו-ממדי — מפת סביבה והימנעות ממכשולים.', '2D LiDAR — environment map & obstacle avoidance.'),
    imu: L('IMU לייצוב כיוון והערכת שיפוע.', 'IMU for heading fusion and slope estimate.'),
    gps: L('GPS לניווט חיצוני ונקודות דרך.', 'GPS for outdoor navigation & waypoints.'),
    cam: L('מצלמה לזיהוי אדם / כביש / תיעוד.', 'Camera for person/path detection or logging.'),
    uwb: L('אנטנה לתג UWB/BLE — מצב Follow-Me אחרי המשתמש.', 'Antenna for UWB/BLE tag — Follow-Me mode.'),
    enc: L('אנקודי גלגל — מדידת מהירות/מרחק (odometry).', 'Wheel encoders — speed/distance odometry.'),
    estop: L('כפתור חירום מנתק הספק למנועים מיד.', 'E-stop cuts motor power immediately.'),
    follow: L('תג על המשתמש — העגלה שומרת מרחק ועוקבת.', 'User-worn tag — wagon keeps distance and follows.'),
  };
  card.innerHTML = `<h3>${lang==='he'?d.he:d.en}</h3><p>${desc[d.id]||''}</p>
    <div class="nav"><button class="btn" id="tPrev">${T('tourPrev')}</button>
    <button class="btn primary" id="tNext">${T('tourNext')}</button>
    <button class="btn ghost" id="tClose">${T('tourClose')}</button></div>`;
  document.getElementById('tClose').onclick = () => { card.classList.add('hidden'); S.tourIdx = -1; };
  document.getElementById('tNext').onclick = () => tourStep(1);
  document.getElementById('tPrev').onclick = () => tourStep(-1);
}
function tourStep(dir) {
  let idx = S.tourIdx;
  const avail = tourOrder.filter(id => {
    if (S.cfg === 'A' && ['hub','drvB','couple','brgB'].includes(id)) return false;
    if (S.cfg === 'B' && ['motorA','diff','servo','drvA','axle','sprocketA','sprocketM','chain','mBracket','tierod','kingpin'].includes(id)) return false;
    return labelDefs.some(d => d.id === id);
  });
  if (idx < 0) idx = 0;
  else idx = (idx + dir + avail.length) % avail.length;
  S.tourIdx = idx;
  const d = labelDefs.find(x => x.id === avail[idx]);
  if (d) { focusPart(d); }
}
function startTour() {
  setLabels(true);
  S.tourIdx = 0;
  const avail = tourOrder.filter(id => labelDefs.some(d => d.id === id));
  const d = labelDefs.find(x => x.id === avail[0]);
  if (d) focusPart(d);
}

/* ========== Physics / sim (schematic) ========== */
const wagonPose = { x: 0, z: 0, yaw: 0, v: 0, steer: 0 };
let wpIdx = 0;
const gAccel = 9.81;
const wagonMassEmpty = 9 + 8 + 4; // from doc approx: wagon+batt+electronics
const wheelRadius = wheelR;
const mu = 0.08; // rolling

function calcEngineering() {
  const m = wagonMassEmpty + S.payload;
  const theta = S.slope * Math.PI / 180;
  const F_roll = mu * m * gAccel * Math.cos(theta);
  const F_grade = m * gAccel * Math.sin(theta);
  const F = F_roll + F_grade;
  const T_total = F * wheelRadius; // N·m at wheels
  const P = F * S.maxSpd; // Watts mechanical
  const nMotors = S.cfg === 'A' ? 1 : 4;
  const T_per = T_total / nMotors;
  const P_per = P / nMotors;
  // suggest with 1.5 safety
  const T_need = T_per * 1.5;
  const P_need = P_per * 1.5;
  let suggest;
  if (S.cfg === 'A') {
    suggest = T_need < 8 && P_need < 300
      ? '24V 250W geared ~30:1 (≈200 rpm)'
      : '24V 350–500W geared + stronger axle';
  } else {
    suggest = T_need < 3 && P_need < 150
      ? '4× 24V 150W hub / 37mm gearmotors'
      : '4× 24V 200–250W hub motors';
  }
  // electrical rough: 85% drivetrain, 90% driver
  const P_elec = P / 0.85 / 0.9;
  const I = P_elec / 24;
  const Wh = 24 * 20; // 480
  const rangeKm = S.maxSpd > 0.05 ? (Wh * 0.85 / Math.max(P_elec, 1)) * S.maxSpd / 1000 * 1000 : 0; // hours * m/s -> km? 
  // hours = Wh/P, distance_m = hours * maxSpd, /1000 = km
  const hours = Wh * 0.85 / Math.max(P_elec, 40);
  const range = hours * S.maxSpd / 1000 * 3600 / 1000; // wait
  // hours * m/s = meters of range at continuous max; /1000 = km
  const rangeEst = hours * S.maxSpd / 1000; // wrong: hours*m/s = m? hours is in hours, need seconds
  // Fix: hours * 3600 * maxSpd / 1000 = km
  const rangeKmFix = (hours * 3600 * S.maxSpd) / 1000;
  return { m, F, T_total, P, T_per, P_per, T_need, P_need, suggest, I, rangeKm: rangeKmFix, P_elec };
}

function simStep(dt) {
  if (!S.running) {
    wagonPose.v *= 0.9;
    wagonPose.yawRate = (wagonPose.yawRate || 0) * 0.85;
    wheelMeshes.forEach(wm => { wm.omega = wagonPose.v / wheelRadius; });
    updateWagonTransform(dt);
    return;
  }
  const eng = calcEngineering();
  const maxV = S.maxSpd;
  let targetYaw = wagonPose.yaw;
  let targetV = maxV * 0.7;

  if (S.mode === 'follow' && followTarget) {
    followTarget.visible = true;
    // move target slowly on a path
    const t = performance.now() * 0.00015;
    followTarget.position.x = 2.2 + Math.cos(t) * 1.5;
    followTarget.position.z = Math.sin(t * 0.7) * 1.2;
    const dx = followTarget.position.x - wagonPose.x;
    const dz = followTarget.position.z - wagonPose.z;
    const dist = Math.hypot(dx, dz);
    targetYaw = Math.atan2(dx, dz); // wait: our forward is +X
    targetYaw = Math.atan2(dz, dx); // yaw 0 = +X
    const desired = 1.2; // m follow distance
    if (dist > desired + 0.3) targetV = Math.min(maxV, (dist - desired) * 0.8);
    else if (dist < desired - 0.2) targetV = -0.3;
    else targetV = 0.15;
  } else if (S.mode === 'way') {
    wpGroup.visible = true;
    followTarget.visible = false;
    const wp = waypoints[wpIdx];
    if (wp) {
      const dx = wp.x - wagonPose.x;
      const dz = wp.z - wagonPose.z;
      const dist = Math.hypot(dx, dz);
      targetYaw = Math.atan2(dz, dx);
      if (dist < 0.25) { wpIdx = (wpIdx + 1) % waypoints.length; }
      targetV = Math.min(maxV, dist * 0.9 + 0.2);
    }
  } else {
    followTarget.visible = false;
    wpGroup.visible = false;
  }

  // Obstacle avoidance (simple repulsive)
  let avoidYaw = 0, avoidV = 1;
  obstacles.forEach(o => {
    const dx = o.position.x - wagonPose.x;
    const dz = o.position.z - wagonPose.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.2) {
      const away = Math.atan2(-dz, -dx);
      const w = (1.2 - dist) / 1.2;
      avoidYaw += (away - targetYaw) * w;
      if (dist < 0.7) avoidV = Math.min(avoidV, dist / 0.7);
      S.mode === 'idle' || (document.getElementById('modeTag').dataset.avoid = '1');
    }
  });
  targetYaw += avoidYaw * 0.8;
  targetV *= avoidV;

  // Integrate
  let dyaw = targetYaw - wagonPose.yaw;
  while (dyaw > Math.PI) dyaw -= Math.PI * 2;
  while (dyaw < -Math.PI) dyaw += Math.PI * 2;

  // Yaw rate / steer targets
  let yawRate = 0; // rad/s
  if (S.cfg === 'A') {
    const steer = Math.max(-0.55, Math.min(0.55, dyaw * 1.2));
    wagonPose.steer = steer;
    // Bicycle model: yawRate = v * tan(steer) / wheelbase
    yawRate = wagonPose.v * Math.tan(steer) / Math.max(WHEELBASE, 0.3);
  } else {
    // Skid-steer: yaw from heading error
    yawRate = Math.max(-2.0, Math.min(2.0, dyaw * 2.8));
    wagonPose.steer = 0;
  }
  wagonPose.yawRate = yawRate;

  const a = (targetV - wagonPose.v) * 2.5;
  wagonPose.v += a * dt;
  wagonPose.v = Math.max(-maxV * 0.45, Math.min(maxV, wagonPose.v));
  wagonPose.yaw += yawRate * dt;

  wagonPose.x += Math.cos(wagonPose.yaw) * wagonPose.v * dt;
  wagonPose.z += Math.sin(wagonPose.yaw) * wagonPose.v * dt;
  S.distM += Math.abs(wagonPose.v) * dt;

  // Per-wheel ground speeds (body frame: +X forward, +Z left)
  const halfT = WHEEL_TRACK / 2;
  const v = wagonPose.v;
  const wYaw = yawRate;
  // v_y lateral ~ 0; point velocity = v_forward ± w*z
  wagonPose.wheelSpeed = {};
  wheelMeshes.forEach(wm => {
    let vWheel;
    if (S.cfg === 'B') {
      // skid: each side speed
      vWheel = v - wYaw * wm.z; // z>0 left → when yaw+, left slower if turning left? 
      // yaw+ = CCW = toward +Z from +X → left side ( +z) moves backward relative → v - w*z with z>0 gives smaller/negative when w>0. Good for spin-in-place.
    } else {
      // Config A: rear driven via diff; front free-rolling along steered heading
      if (!wm.caster) {
        // differential: approximate with same yaw kinematics
        vWheel = v - wYaw * wm.z;
      } else {
        // front: speed along wheel plane after Ackermann steer
        const d = WHEELBASE;
        let delta = 0;
        if (Math.abs(Math.tan(wagonPose.steer)) > 1e-4) {
          const R = d / Math.tan(wagonPose.steer);
          // Ackermann: inner/outer
          const sign = wm.side; // +1 left
          delta = Math.atan(d / (R - sign * halfT));
        } else {
          delta = wagonPose.steer;
        }
        wm.steerAngle = delta;
        vWheel = v / Math.cos(delta || 1e-6); // approx path speed
        // better: v_wheel = yawRate * sqrt(R_i^2) ... use body velocity projected
        vWheel = v - wYaw * wm.z;
      }
    }
    wm.omega = vWheel / wheelRadius; // rad/s about axle
    wagonPose.wheelSpeed[wm.id] = vWheel;
  });

  // Battery drain
  const P = Math.abs(eng.P_elec) * (Math.abs(wagonPose.v) / Math.max(maxV, 0.1));
  const Wh = 480;
  S.batt = Math.max(0, S.batt - (P * dt / 3600) / Wh * 100);

  updateWagonTransform(dt);
  updateDash(eng);
}

function updateWagonTransform(dt) {
  root.position.x = wagonPose.x;
  root.position.z = wagonPose.z;
  // Model forward = +X; yaw 0 → +X world; Three.js Y-up: rotation.y = -yaw
  root.rotation.y = -wagonPose.yaw;

  // Wheel spin about axle (+Z local) and steer about kingpin (+Y)
  wheelMeshes.forEach(wm => {
    // Ensure omega exists even when idle coasting
    if (wm.omega === undefined) wm.omega = wagonPose.v / wheelRadius;
    wm.spinAngle = (wm.spinAngle || 0) + wm.omega * dt;
    // Axle = local Z → spin about Z
    wm.wheel.rotation.z = wm.spinAngle;

    if (S.cfg === 'A' && wm.caster) {
      // Ackermann / caster yaw about vertical
      let delta = wm.steerAngle;
      if (delta === undefined) {
        const halfT = WHEEL_TRACK / 2;
        const d = WHEELBASE;
        if (Math.abs(wagonPose.steer) > 1e-4) {
          const R = d / Math.tan(wagonPose.steer);
          delta = Math.atan(d / (R - wm.side * halfT));
        } else delta = 0;
      }
      wm.yawPivot.rotation.y = delta;
    } else if (S.cfg === 'B') {
      wm.yawPivot.rotation.y = 0; // skid: wheels fixed forward
    } else {
      // rear fixed in A
      wm.yawPivot.rotation.y = 0;
    }
  });

  // Animate chain / sprockets (config A)
  if (S.cfg === 'A' && parts.cfgA && parts.cfgA.visible) {
    // Motor shaft speed: wheel omega * (teeth_axle / teeth_motor) / after gearbox visual on output
    const rear = wheelMeshes.find(w => w.id === 'RL') || wheelMeshes[2];
    const wAxle = rear ? rear.omega : 0;
    const ratio = 42 / 14; // sprocket reduction after GB
    const wMotorOut = wAxle * ratio; // output sprocket faster than axle
    if (driveAnim.sprocketAxle) driveAnim.sprocketAxle.rotation.z = (driveAnim.sprocketAxle.rotation.z || 0) + wAxle * dt;
    if (driveAnim.sprocketMotor) driveAnim.sprocketMotor.rotation.z = (driveAnim.sprocketMotor.rotation.z || 0) + wMotorOut * dt;
    if (driveAnim.idler) driveAnim.idler.rotation.z += wMotorOut * 0.5 * dt;
    if (driveAnim.axleA) driveAnim.axleA.rotation.z += wAxle * dt;
    // Chain links orbit
    if (driveAnim.chainLinks) {
      const pitchR = 0.018;
      const chainOmega = wMotorOut; // approx tangential match at motor sprocket
      driveAnim.chainOffset = (driveAnim.chainOffset || 0) + chainOmega * dt;
      driveAnim.chainLinks.forEach(L => {
        const ang = L.ang0 + driveAnim.chainOffset;
        L.mesh.position.copy(L.mid).add(L.ux.clone().multiplyScalar(Math.cos(ang) * L.rx)).add(L.uy.clone().multiplyScalar(Math.sin(ang) * L.ry));
      });
    }
    if (driveAnim.servoHorn) {
      driveAnim.servoHorn.rotation.y = wagonPose.steer * 0.8;
    }
  }
  // Hub disks spin with wheels in B (cylinder axis = world-local X after z=PI/2 bake → spin about X)
  if (S.cfg === 'B' && driveAnim.hubs) {
    driveAnim.hubs.forEach(h => {
      const wm = wheelMeshes.find(w => w.id === h.id);
      if (!wm) return;
      // Rebuild orientation: axle along X, then roll about X
      if (h.hubDisk) {
        h.hubDisk.rotation.set(wm.spinAngle, 0, Math.PI / 2);
      }
      if (h.band) {
        h.band.rotation.set(wm.spinAngle, 0, Math.PI / 2);
      }
    });
  }

  if (parts.lidarSpin) parts.lidarSpin.rotation.y += dt * 4;
}

function updateDash(eng) {
  eng = eng || calcEngineering();
  document.getElementById('dvSpd').textContent = wagonPose.v.toFixed(2);
  document.getElementById('dvBatt').textContent = S.batt.toFixed(0);
  document.getElementById('dvRange').textContent = (eng.rangeKm * S.batt / 100).toFixed(2);
  const I = eng.I * Math.abs(wagonPose.v) / Math.max(S.maxSpd, 0.1);
  document.getElementById('dvCur').textContent = I.toFixed(1);
  document.getElementById('dvTrq').textContent = (eng.T_total * Math.abs(wagonPose.v) / Math.max(S.maxSpd, 0.1)).toFixed(1);
  const rpm = Math.abs(wagonPose.v / wheelRadius) * 60 / (2 * Math.PI);
  document.getElementById('dvRpm').textContent = rpm.toFixed(0);
  const tag = document.getElementById('modeTag');
  const modeMap = { idle: T('modeIdle'), follow: T('modeFollow'), way: T('modeWay'), avoid: T('modeAvoid') };
  tag.textContent = modeMap[S.mode] || S.mode;
}

/* ========== UI Panel ========== */
let BOM = null;
async function loadBom() {
  try {
    BOM = await (await fetch('./bom.json')).json();
  } catch (e) {
    console.warn(e);
    BOM = { items: [], note: '', currency: 'ILS' };
  }
}

function renderPanel() {
  const pb = document.getElementById('pbody');
  // tabs labels
  document.querySelectorAll('.ptab').forEach(t => {
    const k = t.dataset.t;
    t.textContent = T(k);
    t.classList.toggle('on', S.tab === k);
  });

  if (S.tab === 'drive') {
    pb.innerHTML = `
      <h3>${T('drive')}</h3>
      <div class="seg">
        <button data-cfg="A" class="${S.cfg==='A'?'on':''}">A</button>
        <button data-cfg="B" class="${S.cfg==='B'?'on':''}">B</button>
      </div>
      <p class="note">${S.cfg==='A'?T('cfgAdesc'):T('cfgBdesc')}</p>
      <h4>${L('רכיבים בתצורה','Components in config')}</h4>
      <div id="cfgChips"></div>
      <p class="note">${L('לחץ X-RAY כדי לראות את הרכיבים מתחת לאמבט.','Click X-RAY to see components under the tub.')}</p>
    `;
    const chips = pb.querySelector('#cfgChips');
    const items = (BOM?.items || []).filter(i => i.configs.includes(S.cfg));
    items.forEach(i => {
      const c = document.createElement('span');
      c.className = 'chip on';
      c.textContent = lang==='he' ? i.nameHe : i.nameEn;
      chips.appendChild(c);
    });
    pb.querySelectorAll('[data-cfg]').forEach(b => b.onclick = () => { S.cfg = b.dataset.cfg; applyCfg(); syncLabels(); });
  } else if (S.tab === 'sim') {
    pb.innerHTML = `
      <h3>${T('sim')}</h3>
      <div class="row2"><label>${T('payload')}</label><input type="range" id="rPay" min="0" max="60" value="${S.payload}"><span class="val" id="vPay">${S.payload}</span></div>
      <div class="row2"><label>${T('slope')}</label><input type="range" id="rSlope" min="0" max="20" value="${S.slope}"><span class="val" id="vSlope">${S.slope}</span></div>
      <div class="row2"><label>${T('maxSpd')}</label><input type="range" id="rSpd" min="0.3" max="2.5" step="0.1" value="${S.maxSpd}"><span class="val" id="vSpd">${S.maxSpd}</span></div>
      <div class="row2"><label>${T('simSpd')}</label><input type="range" id="rMul" min="0.25" max="4" step="0.25" value="${S.simMul}"><span class="val" id="vMul">${S.simMul}×</span></div>
      <button class="btn primary block" id="bFollow">${T('startFollow')}</button>
      <button class="btn block" id="bWay">${T('startWay')}</button>
      <button class="btn block" id="bStop">${T('stopSim')}</button>
      <button class="btn ghost block" id="bReset">${T('resetSim')}</button>
      <button class="btn block" id="bObs">${T('addObs')}</button>
      <button class="btn ghost block" id="bClrObs">${T('clearObs')}</button>
    `;
    const bind = (id, key, elV, fmt) => {
      const el = document.getElementById(id);
      el.oninput = () => { S[key] = parseFloat(el.value); elV.textContent = fmt ? fmt(S[key]) : S[key]; updateDash(); if (S.tab==='calc') renderPanel(); };
    };
    bind('rPay','payload', document.getElementById('vPay'));
    bind('rSlope','slope', document.getElementById('vSlope'));
    bind('rSpd','maxSpd', document.getElementById('vSpd'));
    bind('rMul','simMul', document.getElementById('vMul'), v => v + '×');
    document.getElementById('bFollow').onclick = () => { S.mode = 'follow'; S.running = true; followTarget.visible = true; wpGroup.visible = false; toast(T('modeFollow')); };
    document.getElementById('bWay').onclick = () => { S.mode = 'way'; S.running = true; wpIdx = 0; wpGroup.visible = true; followTarget.visible = false; toast(T('modeWay')); };
    document.getElementById('bStop').onclick = () => { S.running = false; S.mode = 'idle'; toast(T('modeIdle')); };
    document.getElementById('bReset').onclick = () => {
      wagonPose.x = wagonPose.z = wagonPose.yaw = wagonPose.v = 0;
      S.batt = 100; S.distM = 0; S.running = false; S.mode = 'idle';
      followTarget.visible = false; wpGroup.visible = false;
      root.position.set(0,0,0); root.rotation.set(0,0,0);
      updateDash(); toast(T('resetSim'));
    };
    document.getElementById('bObs').onclick = () => {
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 2;
      addObstacle(wagonPose.x + Math.cos(a)*r, wagonPose.z + Math.sin(a)*r);
    };
    document.getElementById('bClrObs').onclick = clearObstacles;
  } else if (S.tab === 'calc') {
    const e = calcEngineering();
    pb.innerHTML = `
      <h3>${T('calcTitle')}</h3>
      <div class="note">${L('מטען','Payload')} ${S.payload} kg · ${L('שיפוע','Slope')} ${S.slope}° · ${L('תצורה','Config')} ${S.cfg}</div>
      <div class="calcbox">
        <div class="line"><span>${L('מסה כוללת','Total mass')}</span><span>${e.m.toFixed(1)} kg</span></div>
        <div class="line"><span>${L('כוח התנגדות','Resistive force')}</span><span>${e.F.toFixed(1)} N</span></div>
        <div class="line"><span>${T('needT')}</span><span>${e.T_total.toFixed(2)} N·m</span></div>
        <div class="line"><span>${T('needT')} (${T('perMotor')})</span><span>${e.T_need.toFixed(2)} N·m</span></div>
        <div class="line"><span>${T('needP')} (${T('perMotor')})</span><span>${e.P_need.toFixed(0)} W</span></div>
        <div class="line"><span>${L('זרם משוער','Est. current')}</span><span>${e.I.toFixed(1)} A</span></div>
        <div class="line"><span>${L('טווח משוער','Est. range')}</span><span>${e.rangeKm.toFixed(2)} km</span></div>
        <div class="line"><span>${T('suggest')}</span><span>${e.suggest}</span></div>
      </div>
      <p class="note">${L('כולל מקדם בטיחות ×1.5. חישוב סכמטי לרכיבה רציפה במהירות המקס׳.','Includes ×1.5 safety factor. Schematic calc at continuous max speed.')}</p>
    `;
  } else if (S.tab === 'wire') {
    pb.innerHTML = `<h3>${T('wire')}</h3><div class="note">${L('סכמת בלוקים — לא שרטוט חיווט מפורט','Block schematic — not a full wiring drawing')}</div>
      <svg id="wireSvg" viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg"></svg>`;
    drawWiring(pb.querySelector('#wireSvg'));
  } else if (S.tab === 'bom') {
    const items = (BOM?.items || []).filter(i => i.configs.includes(S.cfg));
    let total = 0;
    let rows = items.map(i => {
      const p = (i.price || 0) * (i.qty || 1);
      total += p;
      return `<tr><td>${lang==='he'?i.nameHe:i.nameEn}<br><span class="note">${i.model||''}</span></td>
        <td>${i.qty}</td><td class="p">₪${p}</td></tr>`;
    }).join('');
    pb.innerHTML = `
      <h3>BOM — ${S.cfg==='A'?T('cfgA'):T('cfgB')}</h3>
      <p class="note">${BOM?.note || T('estNote')}</p>
      <table class="bom"><thead><tr><th>${L('פריט','Item')}</th><th>${L('כמות','Qty')}</th><th>₪</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2"><b>${T('total')}</b></td><td class="p"><b>₪${total}</b></td></tr></tfoot></table>
      <button class="btn primary block" id="bXls">${T('exportXls')}</button>
    `;
    document.getElementById('bXls').onclick = exportExcel;
  }
}

function drawWiring(svg) {
  const boxes = S.cfg === 'A' ? [
    [20,20,90,36,'Battery 24V'],[130,20,80,36,'BMS'],[230,20,70,36,'Fuse'],
    [20,80,90,36,'Main SW'],[130,80,80,36,'E-Stop'],[230,80,70,36,'DC-DC'],
    [20,140,100,40,'ESP32'],[140,140,100,40,'RPi / Jetson'],
    [20,210,120,40,'BTS7960 Driver'],[160,210,120,40,'Motor 250W'],
    [20,280,120,40,'Steering Servo'],[160,280,120,40,'Diff / Axle'],
    [20,350,70,36,'LiDAR'],[100,350,70,36,'IMU'],[180,350,60,36,'US×4'],[250,350,50,36,'UWB'],
  ] : [
    [20,20,90,36,'Battery 24V'],[130,20,80,36,'BMS'],[230,20,70,36,'Fuse'],
    [20,80,90,36,'Main SW'],[130,80,80,36,'E-Stop'],[230,80,70,36,'DC-DC'],
    [20,140,100,40,'ESP32'],[140,140,100,40,'RPi / Jetson'],
    [20,210,130,40,'Dual Drivers ×2'],[170,210,120,40,'4× Hub Motors'],
    [20,290,70,36,'LiDAR'],[100,290,70,36,'IMU'],[180,290,60,36,'US×4'],[250,290,50,36,'UWB'],
    [20,350,80,36,'Encoders'],[120,350,80,36,'GPS'],[220,350,80,36,'Camera'],
  ];
  let html = `<rect width="320" height="420" fill="#0c0e12"/>`;
  // connections
  const lines = [[65,56,65,80],[175,56,175,80],[265,56,265,80],[65,116,70,140],[265,116,250,140],[70,180,80,210],[190,180,220,210]];
  lines.forEach(([x1,y1,x2,y2]) => {
    html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff7a1a" stroke-width="1.5" opacity="0.7"/>`;
  });
  boxes.forEach(([x,y,w,h,t]) => {
    html += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#ffffff" stroke="#c0c6d0" stroke-width="1.2"/>
      <text x="${x+w/2}" y="${y+h/2+4}" fill="#1a1d24" font-size="10" text-anchor="middle" font-family="system-ui">${t}</text>`;
  });
  svg.innerHTML = html;
}

function exportExcel() {
  const items = (BOM?.items || []).filter(i => i.configs.includes(S.cfg));
  // Simple XML Spreadsheet (Excel-readable) without external libs
  let rows = items.map(i => {
    const p = (i.price||0)*(i.qty||1);
    return `<Row><Cell><Data ss:Type="String">${esc(lang==='he'?i.nameHe:i.nameEn)}</Data></Cell>
      <Cell><Data ss:Type="String">${esc(i.model||'')}</Data></Cell>
      <Cell><Data ss:Type="Number">${i.qty}</Data></Cell>
      <Cell><Data ss:Type="Number">${i.price||0}</Data></Cell>
      <Cell><Data ss:Type="Number">${p}</Data></Cell>
      <Cell><Data ss:Type="String">${esc(i.notes||'')}</Data></Cell></Row>`;
  }).join('');
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="BOM_${S.cfg}"><Table>
<Row>
 <Cell><Data ss:Type="String">Item</Data></Cell>
 <Cell><Data ss:Type="String">Model</Data></Cell>
 <Cell><Data ss:Type="String">Qty</Data></Cell>
 <Cell><Data ss:Type="String">Unit ILS</Data></Cell>
 <Cell><Data ss:Type="String">Total ILS</Data></Cell>
 <Cell><Data ss:Type="String">Notes</Data></Cell>
</Row>
${rows}
</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `auto-wagon-BOM-cfg${S.cfg}.xls`;
  a.click();
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }


/* ========== Mechanism close-up view ========== */
const MECH_FOCI = {
  overview: { he: 'סקירת מנגנון', en: 'Mechanism overview', pos: [1.1, 0.55, 0.9], tgt: [-0.1, 0.12, 0.05] },
  motor: { he: 'מנוע + תיבה + שרשרת', en: 'Motor + GB + chain', pos: [0.15, 0.35, 0.55], tgt: [-0.14, 0.08, 0.12] },
  axle: { he: 'ציר + דיפרנציאל + מיסבים', en: 'Axle + diff + bearings', pos: [-0.55, 0.35, 0.55], tgt: [-0.36, 0.09, 0] },
  wheelFL: { he: 'גלגל קדמי + Ackermann', en: 'Front wheel + Ackermann', pos: [0.75, 0.35, 0.55], tgt: [0.36, 0.09, 0.28] },
  hub: { he: 'מנוע רכזת + מיסב עומס', en: 'Hub motor + load bearing', pos: [0.7, 0.32, 0.55], tgt: [0.36, 0.09, 0.28] },
};

function mechStages() {
  if (S.cfg === 'A') {
    return [
      { he: 'מנוע 24V ~250W', en: '24V ~250W motor', detail: L('מומנט יציאה אחרי תיבה', 'Gearbox output torque') + ': ×30' },
      { he: 'תיבת הילוכים 30:1', en: 'Gearbox 30:1', detail: '≈200 rpm @ 24V no-load after GB' },
      { he: 'שרשרת #25 · 14T→42T', en: 'Chain #25 · 14T→42T', detail: L('יחס', 'Ratio') + ' 3:1 · ' + L('מומנט נוסף ×3', 'extra torque ×3') },
      { he: 'ציר Ø12 + UCFL/6204', en: 'Ø12 axle + UCFL/6204', detail: L('מיסבי אוגן נושאים עומס רדיאלי', 'Flange bearings take radial load') },
      { he: 'דיפרנציאל פתוח', en: 'Open differential', detail: L('חלופה: הנעת גלגל אחד + freewheel בצד השני', 'Alt: one-wheel drive + freewheel other side') },
      { he: 'היגוי Ackermann', en: 'Ackermann steering', detail: L('סרבו → horn → tie-rod → זרועות קינגפין', 'Servo → horn → tie-rod → kingpin arms') },
    ];
  }
  return [
    { he: '4× מנוע ממוכפל/רכזת 150W', en: '4× 150W geared/hub', detail: L('שליטה שמאל/ימין ל-skid-steer', 'L/R control for skid-steer') },
    { he: 'תושבת לרגל הקסטר', en: 'Mount to caster leg', detail: L('ברגים M5 לתושבת החום שבתמונה', 'M5 into photo bracket') },
    { he: 'מיסב 6204 נושא עומס', en: '6204 load bearing', detail: L('ציר המנוע לא נושא עומס רדיאלי של הגלגל', 'Motor shaft does not carry tire radial load') },
    { he: 'מחבר Hex / D-shaft', en: 'Hex / D-shaft coupler', detail: L('בורג לחץ + דבק חוזק', 'Set screw + Loctite') },
    { he: 'דרייברים כפולים', en: 'Dual drivers', detail: '2× MDD10A / BTS7960' },
  ];
}

function openMechView(focus) {
  S.mechView = true;
  S.mechFocus = focus || (S.cfg === 'A' ? 'motor' : 'hub');
  S.xray = true; applyXray();
  document.getElementById('bXray').classList.add('on');
  document.getElementById('bMech').classList.add('on');
  const f = MECH_FOCI[S.mechFocus] || MECH_FOCI.overview;
  camera.position.set(...f.pos);
  controls.target.set(...f.tgt);
  controls.update();
  renderMechPanel();
  toast(T('mech'));
}

function renderMechPanel() {
  const el = document.getElementById('mechPanel');
  if (!S.mechView) { el.classList.remove('show'); return; }
  el.classList.add('show');
  const e = calcEngineering();
  const stages = mechStages();
  const fociBtns = Object.keys(MECH_FOCI).filter(k => {
    if (S.cfg === 'B' && (k === 'motor' || k === 'axle' || k === 'wheelFL')) return false;
    if (S.cfg === 'A' && k === 'hub') return false;
    return true;
  }).map(k => `<button class="btn ${S.mechFocus===k?'primary':''}" data-f="${k}">${lang==='he'?MECH_FOCI[k].he:MECH_FOCI[k].en}</button>`).join(' ');
  el.innerHTML = `
    <h3>⚙ ${T('mech')} — ${S.cfg}</h3>
    <div class="note">${L('תקריב הנדסי — חלקים מוצעים לבנייה','Buildable close-up — suggested parts')}</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0">${fociBtns}</div>
    ${stages.map(st => `<div class="stage"><b>${lang==='he'?st.he:st.en}</b><br>${st.detail}</div>`).join('')}
    <div class="stage"><b>${L('מומנט גלגל דרוש','Req. wheel torque')}</b><br>${e.T_need.toFixed(2)} N·m ${T('perMotor')} · ${e.P_need.toFixed(0)} W</div>
    <div class="stage"><b>${L('קיפול העגלה','Folding')}</b><br>${T('foldWarn')}</div>
    <button class="btn block" id="bMechCut">${T('cut')}</button>
    <button class="btn ghost block" id="bMechClose">${T('mechClose')}</button>
  `;
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => openMechView(b.dataset.f));
  document.getElementById('bMechClose').onclick = closeMechView;
  document.getElementById('bMechCut').onclick = () => {
    S.cut = !S.cut; applyCut();
    document.getElementById('bCut').classList.toggle('on', S.cut);
  };
}

function closeMechView() {
  S.mechView = false;
  document.getElementById('mechPanel').classList.remove('show');
  document.getElementById('bMech').classList.remove('on');
  camera.position.set(1.6, 1.1, 1.8);
  controls.target.set(0, 0.25, 0);
  controls.update();
}

/* ========== Toast / i18n UI ========== */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.getElementById('bPlay').textContent = T('start');
  document.getElementById('sTag').textContent = T('tag');
  document.getElementById('sDims').textContent = T('dims');
  document.getElementById('bLang').textContent = lang === 'he' ? 'EN' : 'עב';
  document.getElementById('bLang2').textContent = lang === 'he' ? 'English' : 'עברית';
  document.getElementById('bXray').textContent = T('xray');
  document.getElementById('bCut').textContent = T('cut');
  document.getElementById('bLabels').textContent = '🏷 ' + T('labels');
  document.getElementById('bLabels').classList.toggle('on', S.labels);
  document.getElementById('dkSpd').textContent = T('spd');
  document.getElementById('dkBatt').textContent = T('batt');
  document.getElementById('dkRange').textContent = T('range');
  document.getElementById('dkCur').textContent = T('cur');
  document.getElementById('dkTrq').textContent = T('trq');
  document.getElementById('dkRpm').textContent = T('rpm');
  syncLabels();
  renderPanel();
  updateDash();
}

function setHQ(on) {
  S.hq = on;
  renderer.setPixelRatio(on ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, 1.25));
  document.getElementById('bHQ').classList.toggle('on', on);
  document.getElementById('bHQ2').textContent = on ? 'HQ ✓' : 'HQ';
}

/* Events */
document.getElementById('bPlay').onclick = () => {
  document.getElementById('start').classList.remove('show');
  const h = document.getElementById('hint');
  h.textContent = T('hintOrbit');
  h.classList.add('show');
  setTimeout(() => h.classList.remove('show'), 4000);
};
document.getElementById('bLang').onclick = document.getElementById('bLang2').onclick = () => {
  lang = lang === 'he' ? 'en' : 'he'; applyLang();
};
document.getElementById('bHQ').onclick = () => setHQ(!S.hq);
document.getElementById('bHQ2').onclick = () => setHQ(!S.hq);
document.getElementById('bXray').onclick = () => {
  S.xray = !S.xray;
  document.getElementById('bXray').classList.toggle('on', S.xray);
  applyXray();
};
document.getElementById('bCut').onclick = () => {
  S.cut = !S.cut;
  document.getElementById('bCut').classList.toggle('on', S.cut);
  applyCut();
};
function setLabels(on) {
  S.labels = !!on;
  const b = document.getElementById('bLabels');
  b.classList.toggle('on', S.labels);
  b.textContent = '🏷 ' + T('labels');
  syncLabels();
  updateLabelPositions();
}
document.getElementById('bLabels').onclick = () => {
  setLabels(!S.labels);
  toast(S.labels ? ('🏷 ' + T('labels') + ' ON') : ('🏷 ' + T('labels') + ' OFF'));
};
addEventListener('keydown', (e) => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'l' || e.key === 'L' || e.code === 'KeyL') {
    e.preventDefault();
    setLabels(!S.labels);
    toast(S.labels ? ('🏷 ' + T('labels') + ' ON') : ('🏷 ' + T('labels') + ' OFF'));
  }
});
document.getElementById('bTour').onclick = startTour;
document.getElementById('bMech').onclick = () => {
  if (S.mechView) closeMechView();
  else openMechView(S.cfg === 'A' ? 'motor' : 'hub');
};
document.getElementById('bMenu').onclick = () => {
  document.getElementById('panel').classList.toggle('open');
};
document.querySelectorAll('.ptab').forEach(t => {
  t.onclick = () => { S.tab = t.dataset.t; renderPanel(); };
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* Fixed-timestep loop (sim speed independent of device) */
const SIM_DT = 1/60;
let acc = 0, last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += raw * S.simMul;
  while (acc >= SIM_DT) {
    simStep(SIM_DT);
    acc -= SIM_DT;
  }
  controls.update();
  updateLabelPositions();
  renderer.render(scene, camera);
}

/* Init */
await loadBom();
applyCfg();
applyLang();
setLabels(false);
syncLabels();
updateDash();
requestAnimationFrame(frame);

// Expose for headless tests / screenshots
window.__AW = { S, wagonPose, applyCfg, applyXray, applyCut, startTour, calcEngineering, addObstacle, scene, camera, renderer, controls, parts, wheelMeshes, driveAnim, openMechView, closeMechView, setLabels, syncLabels, setMode: (m) => { S.mode = m; S.running = m !== 'idle'; } };
console.info('AutoWagon ready');
