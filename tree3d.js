import * as THREE from "./vendor/three/build/three.module.js";
import { Tree } from "./vendor/ez-tree/build/ez-tree.es.js";

let activeScene = null;

window.addEventListener("emotion-tree:render", () => {
  window.requestAnimationFrame(initTreeScene);
});

window.addEventListener("load", initTreeScene);

function initTreeScene() {
  const host = document.querySelector(".tree-scene.three-dimensional");
  if (!host) {
    disposeActiveScene();
    return;
  }

  const data = parseSceneData(host);
  const dataKey = JSON.stringify(data);

  if (activeScene?.host === host && activeScene.dataKey === dataKey) return;

  if (activeScene?.host === host) {
    refreshSceneContent(activeScene, data, dataKey);
    return;
  }

  disposeActiveScene();

  const canvas = host.querySelector(".tree-3d-canvas");
  const loading = host.querySelector(".tree-scene-loading");
  const scene = new THREE.Scene();
  scene.background = null;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const root = new THREE.Group();
  scene.add(root);

  const lights = buildLights(scene);
  buildGround(scene);

  const content = new THREE.Group();
  content.name = "scene-content";
  root.add(content);

  const built = populateSceneContent(content, data, lights);

  const pointer = { x: 0, y: 0 };
  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
  };
  canvas.addEventListener("pointermove", onPointerMove);

  const resizeObserver = new ResizeObserver(() => resizeRenderer(host, renderer, camera));
  resizeObserver.observe(host);
  resizeRenderer(host, renderer, camera);

  let frameId = 0;
  const startedAt = performance.now();
  const fireflies = built.fireflies;
  const animate = (time) => {
    const seconds = (time - startedAt) / 1000;
    content.rotation.y = Math.sin(seconds * 0.16) * 0.035 + pointer.x * 0.05;
    content.rotation.x = pointer.y * 0.012;
    content.position.y = Math.sin(seconds * 0.55) * 0.01;

    built.ezTree?.update(seconds);

    const soulPulse = 0.88 + Math.sin(seconds * 1.1) * 0.14;
    if (lights.soul) lights.soul.intensity = lights.soulBase * soulPulse;

    if (fireflies) {
      const positions = fireflies.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const seed = fireflies.userData.seeds[i / 3];
        positions[i] = fireflies.userData.base[i] + Math.sin(seconds * 0.7 + seed) * 0.35;
        positions[i + 1] =
          fireflies.userData.base[i + 1] + Math.sin(seconds * 1.1 + seed * 1.7) * 0.22;
        positions[i + 2] = fireflies.userData.base[i + 2] + Math.cos(seconds * 0.85 + seed) * 0.28;
      }
      fireflies.geometry.attributes.position.needsUpdate = true;
      fireflies.material.opacity = 0.45 + Math.sin(seconds * 2.2) * 0.12;
    }

    content.traverse((object) => {
      if (object.userData.floatSpeed) {
        object.position.y =
          object.userData.baseY +
          Math.sin(seconds * object.userData.floatSpeed + object.userData.phase) * object.userData.floatAmp;
        object.rotation.y += object.userData.spin || 0;
      }
    });

    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(animate);
  };

  loading?.classList.add("hidden");
  frameId = window.requestAnimationFrame(animate);

  activeScene = {
    host,
    scene,
    renderer,
    camera,
    root,
    content,
    lights,
    ezTree: built.ezTree,
    frameId,
    resizeObserver,
    onPointerMove,
    canvas,
    dataKey,
  };
}

function refreshSceneContent(active, data, dataKey) {
  disposeGroup(active.content);
  const built = populateSceneContent(active.content, data, active.lights);
  active.ezTree = built.ezTree;
  active.dataKey = dataKey;
}

function populateSceneContent(content, data, lights) {
  const treeWrap = new THREE.Group();
  treeWrap.name = "tree-wrap";
  content.add(treeWrap);

  const ezTree = buildRealisticTree(treeWrap, data);
  const crown = measureCrown(treeWrap);
  buildTreeSoul(content, data, crown, lights);
  buildFruit(treeWrap, data, crown);
  buildBugs(treeWrap, data, crown);
  const fireflies = buildFireflies(content);

  return { ezTree, fireflies };
}

function parseSceneData(host) {
  try {
    return JSON.parse(host.dataset.scene || "{}");
  } catch {
    return {};
  }
}

function growthRatio(data) {
  return clampNumber(data.growthRatio ?? data.growth / 100 ?? 0.55, 0.22, 1);
}

function presetForShape(shape, ratio) {
  const size = ratio < 0.42 ? "Small" : ratio < 0.72 ? "Medium" : "Large";
  const map = {
    heritage: `Oak ${size}`,
    sentinel: `Pine ${size}`,
    willow: `Aspen ${size}`,
    bloom: `Oak ${size}`,
  };
  return map[shape] || `Oak ${size}`;
}

function buildRealisticTree(group, data) {
  const ratio = growthRatio(data);
  const shape = data.treeShape || "heritage";
  const tree = new Tree();

  tree.loadPreset(presetForShape(shape, ratio));
  customizeTreeOptions(tree, shape, data);
  tree.generate();

  tree.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(tree);
  const size = box.getSize(new THREE.Vector3());
  const targetHeight = 2.4 + ratio * 5.2;
  const scale = targetHeight / Math.max(0.001, size.y);
  tree.scale.setScalar(scale);

  box.setFromObject(tree);
  tree.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  group.add(tree);
  return tree;
}

function customizeTreeOptions(tree, shape, data) {
  const hp = data.hp ?? 100;
  const ratio = growthRatio(data);

  if (shape === "willow") {
    tree.options.bark.type = "willow";
    tree.options.leaves.type = "aspen";
    tree.options.branch.force.strength = -0.018;
    tree.options.branch.angle[1] = 68;
    tree.options.branch.length[1] = (tree.options.branch.length[1] || 8) * 1.15;
  }

  if (shape === "bloom") {
    tree.options.leaves.tint = hp <= 35 ? 0xc8a0a8 : hp <= 68 ? 0xd8b0b8 : 0xf0b8c4;
    tree.options.leaves.count = Math.floor((tree.options.leaves.count || 14) * 1.12);
  } else if (hp <= 35) {
    tree.options.leaves.tint = 0x8a7a48;
    tree.options.bark.tint = 0xb8a078;
  } else if (hp <= 68) {
    tree.options.leaves.tint = 0x98a860;
  } else {
    tree.options.leaves.tint = shape === "sentinel" ? 0xffffff : 0xd8f0c8;
  }

  tree.options.seed = Math.floor(1000 + ratio * 9000 + (shape === "sentinel" ? 777 : shape === "willow" ? 333 : 111));
}

function measureCrown(treeWrap) {
  const box = new THREE.Box3().setFromObject(treeWrap);
  const size = box.getSize(new THREE.Vector3());
  return {
    minY: box.min.y,
    maxY: box.max.y,
    centerY: (box.min.y + box.max.y) * 0.5,
    crownY: box.min.y + size.y * 0.72,
    radius: Math.max(size.x, size.z) * 0.34,
  };
}

function buildTreeSoul(parent, data, crown, lights) {
  const hp = data.hp ?? 100;
  const ratio = growthRatio(data);
  const soulColor = hp <= 35 ? 0xf0c878 : hp <= 68 ? 0xd8e878 : 0xfff0b0;
  const soul = new THREE.PointLight(soulColor, 0.9 + ratio * 0.7, 18);
  soul.position.set(0, crown.crownY * 0.95, 0);
  parent.add(soul);
  lights.soul = soul;
  lights.soulBase = soul.intensity;

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.55 + ratio * 0.65, 18, 14),
    new THREE.MeshBasicMaterial({
      color: soulColor,
      transparent: true,
      opacity: 0.06 + ratio * 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  aura.position.copy(soul.position);
  parent.add(aura);
}

function buildFireflies(parent) {
  const count = 28;
  const positions = new Float32Array(count * 3);
  const base = new Float32Array(count * 3);
  const seeds = [];

  for (let i = 0; i < count; i += 1) {
    const seed = pseudo(i + 88);
    seeds.push(seed * 20);
    const angle = seed * Math.PI * 2;
    const radius = 1.2 + pseudo(i + 19) * 2.4;
    const x = Math.cos(angle) * radius;
    const y = 1.2 + pseudo(i + 29) * 4.2;
    const z = Math.sin(angle) * radius * 0.55;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    base[i * 3] = x;
    base[i * 3 + 1] = y;
    base[i * 3 + 2] = z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xfff6c8,
    size: 0.07,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.seeds = seeds;
  points.userData.base = base;
  parent.add(points);
  return points;
}

function buildLights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x8ec878, 2.4));

  const sun = new THREE.DirectionalLight(0xfff0cc, 4.2);
  sun.position.set(-4, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -2;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd4f0ff, 1.15);
  fill.position.set(5, 6, -2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffe8a8, 0.65);
  rim.position.set(0, 3, 6);
  scene.add(rim);

  return { sun, fill, rim, soul: null, soulBase: 0 };
}

function buildGround(scene) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(10, 64),
    new THREE.MeshStandardMaterial({ color: 0x7cb356, roughness: 0.88, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.position.y = -0.02;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 2.0, 48),
    new THREE.MeshStandardMaterial({ color: 0x8fcc62, roughness: 1, transparent: true, opacity: 0.72 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);

  const mossMat = new THREE.MeshStandardMaterial({ color: 0x9ed66a, roughness: 1 });
  for (let i = 0; i < 24; i += 1) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.028 + pseudo(i) * 0.02, 0.12 + pseudo(i + 1) * 0.1, 5), mossMat);
    const angle = pseudo(i + 2) * Math.PI * 2;
    const radius = 1.6 + pseudo(i + 3) * 4.8;
    tuft.position.set(Math.cos(angle) * radius, 0.04, Math.sin(angle) * radius);
    tuft.rotation.y = angle;
    tuft.castShadow = true;
    scene.add(tuft);
  }
}

function buildFruit(group, data, crown) {
  const count = Math.min(7, Math.max(0, data.fruitCount || 0));
  const mature = Math.min(count, data.matureFruitCount || 0);
  const ripeMat = new THREE.MeshStandardMaterial({ color: 0xe6a83a, emissive: 0x5c3706, emissiveIntensity: 0.18, roughness: 0.48 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x9fba58, roughness: 0.65 });

  for (let i = 0; i < count; i += 1) {
    const [x, y, z] = crownPoint(crown, i, 0.42, 0.78);
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), i < mature ? ripeMat : greenMat);
    fruit.position.set(x, y, z);
    fruit.castShadow = true;
    addFloat(fruit, 1.0, 0.03, i, 0.004);
    group.add(fruit);
  }
}

function buildBugs(group, data, crown) {
  (data.bugs || []).slice(0, 5).forEach((bug, index) => {
    const color = new THREE.Color(bug.color || "#bd6a58");
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: bug.urgent || bug.damaged ? 0.38 : 0.12,
      roughness: 0.4,
    });
    const [x, y, z] = crownPoint(crown, index + 11, 0.35, 0.68);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), material);
    body.scale.set(1.15, 0.75, 0.9);
    body.position.set(x, y, z);
    body.castShadow = true;
    addFloat(body, 1.3, 0.045, index, 0.007);
    group.add(body);
  });
}

function crownPoint(crown, index, minT, maxT) {
  const angle = index * 1.47 + pseudo(index + 3) * 0.8;
  const t = minT + pseudo(index + 7) * (maxT - minT);
  const r = crown.radius * (0.35 + pseudo(index + 13) * 0.55);
  const y = crown.minY + (crown.maxY - crown.minY) * t;
  return [Math.cos(angle) * r, y, Math.sin(angle) * r * 0.72];
}

function addFloat(object, speed, amp, phase, spin = 0) {
  object.userData.floatSpeed = speed;
  object.userData.floatAmp = amp;
  object.userData.baseY = object.position.y;
  object.userData.phase = phase;
  object.userData.spin = spin;
}

function resizeRenderer(host, renderer, camera) {
  const rect = host.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const isMobile = width < 560;
  camera.fov = isMobile ? 52 : 42;
  camera.position.set(0, isMobile ? 3.2 : 3.9, isMobile ? 12.2 : 10.8);
  camera.lookAt(0, isMobile ? 1.55 : 2.15, 0);
  camera.updateProjectionMatrix();
}

function disposeGroup(group) {
  if (!group) return;
  group.traverse((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose?.());
    else object.material?.dispose?.();
  });
  while (group.children.length) group.remove(group.children[0]);
}

function disposeActiveScene() {
  if (!activeScene) return;
  window.cancelAnimationFrame(activeScene.frameId);
  activeScene.resizeObserver?.disconnect();
  activeScene.canvas?.removeEventListener("pointermove", activeScene.onPointerMove);
  disposeGroup(activeScene.content);
  activeScene.renderer?.dispose?.();
  activeScene = null;
}

function pseudo(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function clampNumber(value, min, max) {
  const numeric = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, numeric));
}
