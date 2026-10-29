/* ==================================================================
   PARAMETRIC MOTHERBOARD PREVIEW
   A vertical board inside the case. The long dimension runs along X
   (case depth), the short dimension along Y (case height). The GPU
   PCIe slot is placed at local Y = 0 so the assembly can align it
   with the case GPU mount. The CPU socket is above it.
   ================================================================== */
const T = window.ATX_LIB.THREE;

const FORM_FACTORS = {
  "ITX": [170, 170],
  "MINI-ITX": [170, 170],
  "M-ATX": [244, 244],
  "MATX": [244, 244],
  "MICRO-ATX": [244, 244],
  "ATX": [305, 244],
  "E-ATX": [305, 267],
  "EATX": [305, 267]
};

function material(color, metalness = 0.45, roughness = 0.5, extra = {}) {
  return new T.MeshStandardMaterial(Object.assign({
    color,
    metalness,
    roughness
  }, extra));
}

function roundedPanelGeometry(w, h, depth, radius, bevel) {
  const shape = new T.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const r = Math.min(radius, Math.min(w, h) / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const b = bevel === undefined ? 0.006 : bevel;
  const geo = new T.ExtrudeGeometry(shape, {
    depth: Math.max(0.005, depth - b * 2),
    steps: 1,
    curveSegments: 8,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 1
  });
  geo.translate(0, 0, -depth / 2 + b);
  geo.computeVertexNormals();
  return geo;
}

function addBox(parent, w, h, d, mat, x, y, z) {
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export function createMotherboardPreview(motherboard) {
  const params = motherboard.modelParams || {};
  const formFactor = String(params.formFactor || "ATX").toUpperCase();
  const fallback = FORM_FACTORS[formFactor] || FORM_FACTORS.ATX;
  const lengthMm = Number(params.length) || fallback[0];
  const widthMm = Number(params.width) || fallback[1];
  const D = lengthMm / 100;
  const H = widthMm / 100;
  const thickness = 0.022;

  const group = new T.Group();
  group.name = `motherboard-preview-${motherboard.id}`;

  const boardMat = material(0x0a241d, 0.22, 0.55);
  const darkMat = material(0x11191c, 0.45, 0.45);
  const metalMat = material(0x8a969a, 0.72, 0.3);
  const slotMat = material(0x2d3d42, 0.5, 0.42);
  const goldMat = material(0xc6a15b, 0.75, 0.28);
  const accentMat = material(0x5fe7ff, 0.4, 0.3, { emissive: 0x5fe7ff, emissiveIntensity: 0.35 });
  const vrmMat = material(0x202b2f, 0.4, 0.45);

  const board = new T.Mesh(roundedPanelGeometry(D, H, thickness, 0.018, 0.005), boardMat);
  group.add(board);

  // CPU socket above the PCIe slot.
  const cpuX = -D * 0.08;
  const cpuY = H * 0.28;
  addBox(group, 0.19, 0.19, 0.018, metalMat, cpuX, cpuY, thickness / 2 + 0.009);
  addBox(group, 0.15, 0.15, 0.012, material(0x293234, 0.55, 0.4), cpuX, cpuY, thickness / 2 + 0.021);
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.032, 0.032, 0.012, metalMat, cpuX - 0.06 + i * 0.04, cpuY - 0.075, thickness / 2 + 0.02);
  }

  // Four RAM slots to the right of the CPU.
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.022, H * 0.34, 0.014, slotMat, D * 0.18 + i * 0.036, H * 0.20, thickness / 2 + 0.009);
  }

  // PCIe x16 slot at local Y = 0, aligned with the case GPU mount.
  addBox(group, D * 0.56, 0.052, 0.022, slotMat, 0, 0, thickness / 2 + 0.012);
  addBox(group, D * 0.52, 0.012, 0.008, goldMat, 0, 0, thickness / 2 + 0.027);
  addBox(group, D * 0.06, 0.10, 0.028, darkMat, D * 0.28, 0, thickness / 2 + 0.014);

  // VRM, chipset and M.2 shields.
  addBox(group, D * 0.30, 0.14, 0.035, vrmMat, cpuX, H * 0.44, thickness / 2 + 0.026);
  addBox(group, D * 0.15, H * 0.18, 0.045, vrmMat, D * 0.31, -H * 0.32, thickness / 2 + 0.03);
  addBox(group, D * 0.45, 0.16, 0.025, metalMat, -D * 0.04, -H * 0.34, thickness / 2 + 0.026);
  addBox(group, D * 0.025, H * 0.19, 0.012, accentMat, D * 0.41, -H * 0.02, thickness / 2 + 0.014);

  // Rear I/O strip and power connectors (also used as cable endpoints).
  addBox(group, D * 0.06, H * 0.42, 0.04, darkMat, -D / 2 + 0.035, H * 0.16, thickness / 2 + 0.023);
  addBox(group, 0.10, 0.20, 0.035, darkMat, D * 0.40, -H * 0.22, thickness / 2 + 0.024);
  addBox(group, 0.16, 0.08, 0.035, darkMat, -D * 0.22, H * 0.46, thickness / 2 + 0.024);

  const ramSlots = [];
  for (let i = 0; i < 4; i++) {
    ramSlots.push({ x: D * 0.18 + i * 0.036, y: H * 0.20, z: thickness / 2 + 0.009 });
  }

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      formFactor,
      length: D,
      height: H,
      thickness,
      cpu: { x: cpuX, y: cpuY, z: thickness / 2 + 0.018 },
      pcie: { x: 0, y: 0, z: thickness / 2 + 0.02 },
      ramSlots,
      connectors: {
        atx24: { x: D * 0.40, y: -H * 0.22, z: thickness / 2 + 0.04 },
        cpu8: { x: -D * 0.22, y: H * 0.46, z: thickness / 2 + 0.04 }
      }
    }
  };
}
