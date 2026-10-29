/* ==================================================================
   PARAMETRIC CASE PREVIEW MODEL — L1
   Only the chassis and the GPU bay are modeled. Dimensions and tier
   come from case modelParams; CPU / PSU / radiator are placeholders.
   Coordinate convention:
     X = case depth (rear -X, front +X)
     Y = case height
     Z = case width (glass side +Z)
   ================================================================== */
const T = window.ATX_LIB.THREE;

const TIER_FALLBACK = {
  itx: [300, 220, 330],
  mid: [450, 220, 470],
  full: [580, 250, 600]
};

const TIER_LABEL = {
  itx: "ITX",
  mid: "中塔",
  full: "全塔"
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function material(color, metalness = 0.55, roughness = 0.42, extra = {}) {
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

function makeTagTexture(text, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 96);
  ctx.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, 246, 86);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(210,232,236,0.78)";
  ctx.font = "600 30px Bahnschrift, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 48);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function addTag(parent, text, accent, w, h, x, y, z) {
  const texture = makeTagTexture(text, accent);
  const mesh = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function resolveTier(modelParams) {
  const source = String(modelParams?.tier || "").toLowerCase();
  if (TIER_FALLBACK[source]) return source;
  if (String(modelParams?.formFactor || "").toUpperCase() === "ITX") return "itx";
  if (String(modelParams?.formFactor || "").toUpperCase() === "E-ATX") return "full";
  return "mid";
}

export function createCasePreview(pcCase, options = {}) {
  const params = pcCase.modelParams || {};
  const tier = resolveTier(params);
  const fallback = TIER_FALLBACK[tier];
  const depthMm = Number(params.length) || fallback[0];
  const widthMm = Number(params.width) || fallback[1];
  const heightMm = Number(params.height) || fallback[2];
  const D = depthMm / 100;
  const W = widthMm / 100;
  const H = heightMm / 100;
  const maxGpuMm = Number(pcCase.compat?.maxGpuLength ?? params.maxGpuLength ?? 0);
  const maxGpu = maxGpuMm / 100;

  const group = new T.Group();
  group.name = `case-preview-${pcCase.id}`;

  const frameMat = material(0x1a2328, 0.55, 0.4);
  const panelMat = material(0x0f171b, 0.45, 0.5);
  const interiorMat = material(0x0b1114, 0.35, 0.55);
  const accentMat = material(0xffb15a, 0.55, 0.3, { emissive: 0xffb15a, emissiveIntensity: 0.5 });
  const cyanMat = material(0x5fe7ff, 0.5, 0.3, { emissive: 0x5fe7ff, emissiveIntensity: 0.35 });
  const greenMat = material(0x7ce7b5, 0.4, 0.35, { emissive: 0x7ce7b5, emissiveIntensity: 0.25 });
  const glassMat = new T.MeshPhysicalMaterial({
    color: 0x9fdfea,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.17,
    side: T.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.15
  });

  // Outer shell: floor, top, rear, solid side and glass side.
  addBox(group, D, 0.03, W, frameMat, 0, -H / 2 + 0.015, 0);
  addBox(group, D, 0.03, W, frameMat, 0, H / 2 - 0.015, 0);
  addBox(group, 0.03, H - 0.04, W - 0.04, panelMat, -D / 2 + 0.015, 0, 0);
  addBox(group, D - 0.04, H - 0.04, 0.024, panelMat, 0, 0, -W / 2 + 0.012);
  addBox(group, D - 0.06, H - 0.06, 0.012, glassMat, 0, 0, W / 2 - 0.016);

  // Glass frame.
  addBox(group, D - 0.03, 0.035, 0.04, frameMat, 0, H / 2 - 0.03, W / 2 - 0.004);
  addBox(group, D - 0.03, 0.035, 0.04, frameMat, 0, -H / 2 + 0.03, W / 2 - 0.004);
  addBox(group, 0.04, H - 0.06, 0.04, frameMat, -D / 2 + 0.03, 0, W / 2 - 0.004);
  addBox(group, 0.04, H - 0.06, 0.04, frameMat, D / 2 - 0.03, 0, W / 2 - 0.004);
  addBox(group, D - 0.08, 0.008, 0.014, cyanMat, 0, H / 2 - 0.052, W / 2 + 0.012);

  // Front is a frame rather than a solid wall, so a too-long GPU can
  // visibly pass through / stick out of it.
  const frontSlatCount = tier === "full" ? 6 : tier === "mid" ? 4 : 3;
  addBox(group, 0.035, 0.06, W, frameMat, D / 2 - 0.018, H / 2 - 0.03, 0);
  addBox(group, 0.035, 0.06, W, frameMat, D / 2 - 0.018, -H / 2 + 0.03, 0);
  addBox(group, 0.035, H - 0.06, 0.04, frameMat, D / 2 - 0.018, 0, -W / 2 + 0.02);
  addBox(group, 0.035, H - 0.06, 0.04, frameMat, D / 2 - 0.018, 0, W / 2 - 0.02);
  for (let i = 0; i < frontSlatCount; i++) {
    const t = frontSlatCount === 1 ? 0 : i / (frontSlatCount - 1);
    const y = -H * 0.24 + t * H * 0.48;
    addBox(group, 0.025, 0.012, W - 0.13, tier === "itx" ? panelMat : frameMat, D / 2 - 0.012, y, 0);
  }
  addBox(group, 0.05, 0.045, W * 0.3, panelMat, D / 2 + 0.006, H / 2 - 0.065, 0);

  // Top vents and feet.
  const topSlats = tier === "full" ? 5 : 3;
  for (let i = 0; i < topSlats; i++) {
    addBox(group, D * 0.45, 0.008, 0.018, panelMat, -D * 0.1, H / 2 + 0.006, -W * 0.3 + i * (W * 0.15));
  }
  const foot = 0.08;
  [[-D / 2 + 0.11, -W / 2 + 0.11], [D / 2 - 0.11, -W / 2 + 0.11], [-D / 2 + 0.11, W / 2 - 0.11], [D / 2 - 0.11, W / 2 - 0.11]]
    .forEach(([x, z]) => addBox(group, foot, 0.035, foot, panelMat, x, -H / 2 - 0.018, z));

  // Motherboard tray. A real motherboard gets mounted by the configurator;
  // otherwise the case supplies a simplified placeholder board.
  const trayZ = -W / 2 + 0.075;
  const boardZ = -W / 2 + 0.12;
  addBox(group, D * 0.64, H * 0.64, 0.02, interiorMat, 0, H * 0.02, trayZ);
  if (options.showMotherboardPlaceholder !== false) {
    const boardW = Math.min(D * 0.48, 0.42);
    const boardH = Math.min(H * 0.46, 0.48);
    addBox(group, boardW, boardH, 0.018, material(0x0b3025, 0.18, 0.58), -D * 0.04, H * 0.04, trayZ + 0.025);
    addBox(group, 0.12, 0.12, 0.018, material(0x202a2c, 0.5, 0.35), -D * 0.09, H * 0.12, trayZ + 0.04);
    for (let i = 0; i < 4; i++) {
      addBox(group, 0.018, boardH * 0.38, 0.012, material(0x172327, 0.3, 0.5), -D * 0.04 + boardW * 0.36, H * 0.04, trayZ + 0.042);
    }
    addBox(group, boardW * 0.62, 0.018, 0.014, material(0x7a6540, 0.75, 0.25), -D * 0.04, -H * 0.015, trayZ + 0.045);
    addTag(group, "MB", 0x5fe7ff, 0.18, 0.068, -D * 0.28, H * 0.29, trayZ + 0.04);
  }

  // GPU bay: rear bracket, support rails, and the max-length limit.
  const rearX = -D / 2 + 0.12;
  const halfCard = 0.36;
  const desiredY = -H / 2 + H * 0.47;
  const gpuY = clamp(desiredY, -H / 2 + halfCard + 0.03, H / 2 - halfCard - 0.03);
  const gpuZ = boardZ + 0.30;
  const limitX = rearX + maxGpu;
  addBox(group, 0.022, 0.82, 0.1, material(0x7c878c, 0.75, 0.3), rearX - 0.025, gpuY, gpuZ);
  addBox(group, 0.022, 0.045, 0.54, material(0x9aa3a6, 0.7, 0.28), rearX - 0.025, gpuY + 0.38, gpuZ);
  addBox(group, 0.022, 0.045, 0.54, material(0x9aa3a6, 0.7, 0.28), rearX - 0.025, gpuY - 0.38, gpuZ);
  addBox(group, D * 0.55, 0.018, 0.018, material(0x303a3f, 0.55, 0.4), -D * 0.16, gpuY + 0.4, trayZ + 0.08);
  addBox(group, D * 0.55, 0.018, 0.018, material(0x303a3f, 0.55, 0.4), -D * 0.16, gpuY - 0.4, trayZ + 0.08);
  addTag(group, "GPU BAY", 0xffb15a, 0.22, 0.07, rearX + 0.3, gpuY + 0.52, trayZ + 0.08);

  // PSU bay placeholder (skip in the ultra-small Velka 3 where it would
  // intersect the GPU bay; L1 is about case + GPU).
  if (H > 1.05 && options.showPsuPlaceholder !== false) {
    const psuH = Math.min(0.3, H * 0.16);
    const psuY = -H / 2 + psuH / 2 + 0.04;
    addBox(group, D * 0.56, psuH, W * 0.64, interiorMat, 0, psuY, -W * 0.08);
    addBox(group, D * 0.6, 0.018, W * 0.68, frameMat, 0, psuY + psuH / 2 + 0.01, -W * 0.08);
    for (let i = 0; i < 4; i++) {
      addBox(group, D * 0.44, 0.008, 0.014, panelMat, 0, psuY + psuH / 2 + 0.022, -W * 0.25 + i * W * 0.1);
    }
    addTag(group, "PSU", 0x7ce7b5, 0.16, 0.06, -D * 0.18, psuY + 0.01, -W / 2 + 0.09);
  }

  // Rear exhaust vent lines.
  for (let i = 0; i < 5; i++) {
    addBox(group, 0.01, 0.012, W * 0.55, panelMat, -D / 2 + 0.032, H * 0.32 - i * 0.045, 0);
  }

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      tier,
      tierLabel: TIER_LABEL[tier],
      length: D,
      width: W,
      height: H,
      depthMm,
      widthMm,
      heightMm,
      maxGpuMm,
      maxGpuLength: maxGpu,
      maxCoolerMm: Number(pcCase.compat?.maxCoolerHeight ?? 0),
      boardZ,
      gpuMount: {
        rearX,
        y: gpuY,
        z: gpuZ,
        limitX
      }
    }
  };
}
