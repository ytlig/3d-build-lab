/* ==================================================================
   PARAMETRIC GPU PREVIEW MODEL
   Built entirely from modelParams:
   - length   → card length on X
   - thickness → shroud depth / slot thickness on Z
   - fanCount → 1 / 2 / 3 front fans
   - hasBackplate → rear metal backplate
   No external meshes, textures or HDRIs.
   ================================================================== */
const T = window.ATX_LIB.THREE;
const TAU = Math.PI * 2;

const ACCENTS = {
  nvidia: 0x86e6b0,
  amd: 0xff6a55,
  asus: 0xffb15a,
  msi: 0xff5c3f,
  sapphire: 0xff7665,
  powercolor: 0xff5c3f,
  zotac: 0xffd166,
  gigabyte: 0xffb15a,
  asrock: 0x76d8ef,
  default: 0x5fe7ff
};

function accentFor(brand) {
  return ACCENTS[String(brand || "").toLowerCase()] || ACCENTS.default;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundedRectShape(w, h, r) {
  const shape = new T.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const radius = Math.min(r, Math.min(w, h) / 2);
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function roundedPanelGeometry(w, h, depth, radius, bevel) {
  const b = bevel === undefined ? 0.008 : bevel;
  const shape = roundedRectShape(Math.max(0.01, w - b * 2), Math.max(0.01, h - b * 2), Math.max(0.01, radius - b));
  const geo = new T.ExtrudeGeometry(shape, {
    depth: Math.max(0.005, depth - b * 2),
    steps: 1,
    curveSegments: 10,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2
  });
  geo.translate(0, 0, -depth / 2 + b);
  geo.computeVertexNormals();
  return geo;
}

function material(color, metalness = 0.6, roughness = 0.4, extra = {}) {
  return new T.MeshStandardMaterial(Object.assign({
    color,
    metalness,
    roughness
  }, extra));
}

function addBox(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addCylinderZ(parent, radius, height, mat, x, y, z, seg = 24) {
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, seg, 1, false), mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function makeTopLabel(gpu, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 1024, 160);
  ctx.fillStyle = "rgba(5,10,12,0.7)";
  ctx.fillRect(24, 34, 976, 86);
  ctx.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 34, 976, 86);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(235,246,248,0.92)";
  ctx.font = "600 34px Bahnschrift, Arial, sans-serif";
  ctx.fillText(String(gpu.brand || "").toUpperCase(), 48, 78);
  ctx.fillStyle = "rgba(180,200,205,0.7)";
  ctx.font = "400 21px Bahnschrift, Arial, sans-serif";
  ctx.fillText(String(gpu.name || "").toUpperCase(), 48, 107);
  ctx.fillStyle = `#${accent.toString(16).padStart(6, "0")}`;
  ctx.fillRect(860, 59, 112, 5);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function buildFan(radius, depth, accent) {
  const group = new T.Group();
  const frameMat = material(0x263139, 0.42, 0.46);
  const bladeMat = material(0x4a565e, 0.35, 0.5, { side: T.DoubleSide });
  const hubMat = material(0x151c21, 0.55, 0.35);
  const accentMat = material(accent, 0.5, 0.3, { emissive: accent, emissiveIntensity: 0.7 });

  const ring = new T.Mesh(new T.TorusGeometry(radius, 0.018, 8, 32), frameMat);
  ring.castShadow = false;
  ring.receiveShadow = false;
  group.add(ring);
  const innerRing = new T.Mesh(new T.TorusGeometry(radius * 0.9, 0.01, 6, 24), frameMat);
  innerRing.castShadow = false;
  innerRing.receiveShadow = false;
  group.add(innerRing);
  addCylinderZ(group, radius * 0.24, depth * 0.38, hubMat, 0, 0, 0.012, 24);
  addCylinderZ(group, radius * 0.12, depth * 0.42, frameMat, 0, 0, 0.03, 20);

  const bladeGeo = new T.BoxGeometry(0.055, radius * 0.63, 0.012);
  const blades = new T.InstancedMesh(bladeGeo, bladeMat, 7);
  const dummy = new T.Object3D();
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * TAU + 0.2;
    dummy.position.set(Math.sin(angle) * radius * 0.33, Math.cos(angle) * radius * 0.33, 0.022);
    dummy.rotation.set(0, 0, -angle + 0.55);
    dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix);
  }
  blades.instanceMatrix.needsUpdate = true;
  blades.castShadow = false;
  blades.receiveShadow = false;
  group.add(blades);

  const accentRing = new T.Mesh(new T.TorusGeometry(radius * 0.985, 0.007, 6, 32), accentMat);
  accentRing.position.z = depth * 0.28;
  accentRing.castShadow = false;
  accentRing.receiveShadow = false;
  group.add(accentRing);
  return group;
}

export function createGpuPreview(gpu) {
  const params = gpu.modelParams || {};
  const length = clamp(Number(params.length || 244) / 100, 1.2, 4.2);
  const slots = clamp(Number(params.thickness || 2), 1, 4);
  const depth = 0.22 + slots * 0.11;
  const height = 0.72;
  const fanCount = clamp(Number(params.fanCount || 2), 1, 3);
  const accent = accentFor(gpu.brand);
  const group = new T.Group();
  group.name = `gpu-preview-${gpu.id}`;

  const shroudMat = material(0x2a353d, 0.42, 0.4);
  const darkMat = material(0x10161a, 0.35, 0.58);
  const pcbMat = material(0x0a2a20, 0.18, 0.62);
  const metalMat = material(0x87949a, 0.7, 0.3);
  const goldMat = material(0xd5a651, 0.85, 0.24);
  const accentMat = material(accent, 0.55, 0.28, { emissive: accent, emissiveIntensity: 0.65 });

  // PCB / shroud / backplate
  addBox(group, length - 0.04, height - 0.14, 0.032, pcbMat, 0, 0, -depth / 2 + 0.005);
  addBox(group, length, 0.035, depth * 0.9, shroudMat, 0, height / 2 - 0.035, 0);
  addBox(group, length, 0.035, depth * 0.9, shroudMat, 0, -height / 2 + 0.035, 0);
  addBox(group, 0.035, height - 0.02, depth, shroudMat, -length / 2 + 0.017, 0, 0);
  addBox(group, 0.035, height - 0.02, depth, shroudMat, length / 2 - 0.017, 0, 0);
  const shroud = new T.Mesh(roundedPanelGeometry(length - 0.02, height, depth, 0.045, 0.008), shroudMat);
  shroud.castShadow = false;
  shroud.receiveShadow = false;
  group.add(shroud);
  if (params.hasBackplate !== false) {
    const backplate = new T.Mesh(roundedPanelGeometry(length - 0.05, height - 0.055, 0.025, 0.04, 0.006), metalMat);
    backplate.position.z = -depth / 2 - 0.018;
    backplate.castShadow = false;
    backplate.receiveShadow = false;
    group.add(backplate);
    for (let i = 0; i < 5; i++) {
      addBox(group, length * 0.52, 0.012, 0.012, darkMat, 0.1, -0.16 + i * 0.075, -depth / 2 - 0.034);
    }
  }

  // Fan positions along the card length.
  const fanRadius = Math.min(0.225, height * 0.31);
  const centers = fanCount === 1
    ? [0]
    : fanCount === 2
      ? [-length * 0.22, length * 0.22]
      : [-length * 0.29, 0, length * 0.29];
  centers.forEach((x) => {
    const fan = buildFan(fanRadius, depth, accent);
    fan.position.set(x, 0, depth / 2 + 0.025);
    group.add(fan);
  });

  // Top accent rail and power connector.
  addBox(group, length * 0.86, 0.018, 0.025, accentMat, 0, height / 2 + 0.01, 0.08);
  addBox(group, 0.18, 0.075, 0.11, darkMat, length / 2 - 0.26, height / 2 - 0.015, depth * 0.12);
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.026, 0.032, 0.012, goldMat, length / 2 - 0.34 + i * 0.045, height / 2 + 0.012, depth * 0.2);
  }

  // PCIe fingers along the bottom.
  addBox(group, length * 0.58, 0.035, 0.055, darkMat, -length * 0.16, -height / 2 - 0.035, -depth * 0.2);
  for (let i = 0; i < 16; i++) {
    addBox(group, 0.028, 0.05, 0.018, goldMat, -length * 0.35 + i * 0.034, -height / 2 - 0.032, -depth * 0.2);
  }

  // Small top/brand decals.
  const topTexture = makeTopLabel(gpu, accent);
  const topLabel = new T.Mesh(
    new T.PlaneGeometry(length * 0.72, 0.11),
    new T.MeshBasicMaterial({ map: topTexture, transparent: true, depthWrite: false, toneMapped: false })
  );
  topLabel.rotation.x = -Math.PI / 2;
  topLabel.position.set(0, height / 2 + 0.022, 0);
  group.add(topLabel);

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      length,
      depth,
      height,
      fanCount,
      thickness: slots,
      hasBackplate: params.hasBackplate !== false,
      power: {
        x: length / 2 - 0.26,
        y: height / 2 + 0.04,
        z: depth * 0.12
      }
    }
  };
}
