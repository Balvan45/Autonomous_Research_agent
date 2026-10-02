import * as THREE from "three";

export interface IntroSceneHandle {
  dispose: () => void;
}

interface Neuron {
  theta: number;
  phi: number;
  radius: number;
  speed: number;
  spiral: number;
  colorSeed: number;
}

const NEURON_COUNT = 170;
const CONNECT_DISTANCE = 58;
const MAX_CONNECTIONS_PER_NODE = 3;

/**
 * Builds a self-contained Three.js scene: a starfield, a black event horizon,
 * a glowing accretion disk, and a field of orbiting "neuron" particles that
 * spiral inward and connect with synapse lines when close together — then
 * respawn at the outer edge. Call dispose() to tear everything down.
 */
export function createIntroScene(container: HTMLDivElement): IntroSceneHandle {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.0011);

  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 4000);
  camera.position.set(0, 70, 520);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // ---- starfield ----
  const starCount = 1400;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 1200 + Math.random() * 1500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xedeff7, size: 1.6, transparent: true, opacity: 0.55 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- event horizon ----
  const horizonGeo = new THREE.SphereGeometry(46, 48, 48);
  const horizonMat = new THREE.MeshBasicMaterial({ color: 0x020103 });
  const horizon = new THREE.Mesh(horizonGeo, horizonMat);
  scene.add(horizon);

  // ---- accretion disk ----
  const diskTexture = createDiskTexture();
  const diskGeo = new THREE.RingGeometry(52, 220, 128, 1);
  const diskMat = new THREE.MeshBasicMaterial({
    map: diskTexture,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.rotation.x = Math.PI / 2.3;
  scene.add(disk);

  // ---- neuron particle field ----
  const neuronData: Neuron[] = Array.from({ length: NEURON_COUNT }, () => spawnNeuron());
  const neuronGeo = new THREE.BufferGeometry();
  const neuronPositions = new Float32Array(NEURON_COUNT * 3);
  const neuronColors = new Float32Array(NEURON_COUNT * 3);
  neuronGeo.setAttribute("position", new THREE.BufferAttribute(neuronPositions, 3));
  neuronGeo.setAttribute("color", new THREE.BufferAttribute(neuronColors, 3));
  const neuronMat = new THREE.PointsMaterial({
    size: 4.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const neuronPoints = new THREE.Points(neuronGeo, neuronMat);
  scene.add(neuronPoints);

  // ---- synapse lines between nearby neurons ----
  const maxLines = NEURON_COUNT * MAX_CONNECTIONS_PER_NODE;
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = new Float32Array(maxLines * 2 * 3);
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setDrawRange(0, 0);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x8caaff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  function spawnNeuron(): Neuron {
    return {
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1) * 0.5 + Math.PI / 4, // flattened toward the disk plane
      radius: 90 + Math.random() * 260,
      speed: 0.001 + Math.random() * 0.003,
      spiral: 0.02 + Math.random() * 0.09,
      colorSeed: Math.random(),
    };
  }

  const tmpColor = new THREE.Color();
  function colorForSeed(seed: number) {
    if (seed < 0.62) tmpColor.setHSL(0.653, 0.85, 0.72); // plasma violet
    else if (seed < 0.85) tmpColor.setHSL(0.46, 0.8, 0.63); // cyan
    else tmpColor.setHSL(0.06, 0.9, 0.65); // ember
    return tmpColor;
  }

  let raf = 0;
  let t = 0;
  const clock = new THREE.Clock();
  const scratch: THREE.Vector3[] = Array.from({ length: NEURON_COUNT }, () => new THREE.Vector3());

  function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);
    t += delta;

    camera.position.x = Math.sin(t * 0.07) * 520;
    camera.position.z = Math.cos(t * 0.07) * 520;
    camera.position.y = 70 + Math.sin(t * 0.05) * 30;
    camera.lookAt(0, 0, 0);

    disk.rotation.z += delta * 0.15;
    stars.rotation.y += delta * 0.003;
    horizon.rotation.y += delta * 0.1;

    const posAttr = neuronGeo.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = neuronGeo.getAttribute("color") as THREE.BufferAttribute;

    for (let i = 0; i < NEURON_COUNT; i++) {
      const n = neuronData[i];
      if (!reduceMotion) {
        n.theta += n.speed * (1 + 90 / n.radius);
        n.radius -= n.spiral;
      }
      if (n.radius < 55) Object.assign(n, spawnNeuron(), { radius: 350 });

      const x = n.radius * Math.sin(n.phi) * Math.cos(n.theta);
      const y = n.radius * Math.cos(n.phi) * 0.42;
      const z = n.radius * Math.sin(n.phi) * Math.sin(n.theta);

      posAttr.setXYZ(i, x, y, z);
      scratch[i].set(x, y, z);
      const c = colorForSeed(n.colorSeed);
      colorAttr.setXYZ(i, c.r, c.g, c.b);
    }
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    // synapse lines: connect nearby points, capped per node and in total
    const linePosAttr = lineGeo.getAttribute("position") as THREE.BufferAttribute;
    let lineIdx = 0;
    for (let i = 0; i < NEURON_COUNT && lineIdx < maxLines; i++) {
      let connections = 0;
      for (let j = i + 1; j < NEURON_COUNT && connections < MAX_CONNECTIONS_PER_NODE && lineIdx < maxLines; j++) {
        if (scratch[i].distanceTo(scratch[j]) < CONNECT_DISTANCE) {
          linePosAttr.setXYZ(lineIdx * 2, scratch[i].x, scratch[i].y, scratch[i].z);
          linePosAttr.setXYZ(lineIdx * 2 + 1, scratch[j].x, scratch[j].y, scratch[j].z);
          lineIdx++;
          connections++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    linePosAttr.needsUpdate = true;

    renderer.render(scene, camera);
    if (!reduceMotion) raf = requestAnimationFrame(animate);
  }
  animate();
  if (reduceMotion) renderer.render(scene, camera);

  function handleResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", handleResize);

  return {
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      diskTexture.dispose();
      starGeo.dispose();
      starMat.dispose();
      neuronGeo.dispose();
      neuronMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      diskGeo.dispose();
      diskMat.dispose();
      horizonGeo.dispose();
      horizonMat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    },
  };
}

// Vertical gradient so the ring's v-coordinate (inner→outer) maps to a
// clean radial falloff regardless of angle.
function createDiskTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "rgba(255,205,165,0.95)");
  gradient.addColorStop(0.22, "rgba(255,148,90,0.75)");
  gradient.addColorStop(0.55, "rgba(124,156,255,0.4)");
  gradient.addColorStop(1, "rgba(124,156,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
