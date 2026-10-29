/* ==================================================================
   PARAMETRIC CPU COOLER PREVIEW
   The base sits on the CPU socket; the cooler height is generated along
   +Z (from the motherboard toward the side glass). This is the same
   direction a tower cooler occupies in a real vertical case.
   ================================================================== */
const T = window.ATX_LIB.THREE;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function material(color, metalness = 0.55, roughness = 0.4, extra = {}) {
  return new T.MeshStandardMaterial(Object.assign({
    color,
    metalness,
    roughness
  }, extra));
}

function addBox(parent, w, h, d, mat, x, y, z) {
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addCylinderAlongZ(parent, radius, height, mat, x, y, z, seg = 20) {
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, seg, 1), mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function buildFan(radius, accent, thickness = 0.035) {
  const group = new T.Group();
  const frameMat = material(0x20282d, 0.4, 0.5);
  const bladeMat = material(0x4b585f, 0.3, 0.5, { side: T.DoubleSide });
  const hubMat = material(0x12181c, 0.55, 0.35);
  const accentMat = material(accent, 0.4, 0.3, { emissive: accent, emissiveIntensity: 0.65 });
  const ring = new T.Mesh(new T.TorusGeometry(radius, 0.016, 6, 28), frameMat);
  group.add(ring);
  addCylinderAlongZ(group, radius * 0.24, thickness * 0.8, hubMat, 0, 0, 0.008, 20);
  const bladeGeo = new T.BoxGeometry(0.045, radius * 0.62, 0.01);
  const blades = new T.InstancedMesh(bladeGeo, bladeMat, 7);
  const dummy = new T.Object3D();
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + 0.2;
    dummy.position.set(Math.sin(angle) * radius * 0.32, Math.cos(angle) * radius * 0.32, 0.012);
    dummy.rotation.set(0, 0, -angle + 0.5);
    dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix);
  }
  blades.instanceMatrix.needsUpdate = true;
  group.add(blades);
  const accentRing = new T.Mesh(new T.TorusGeometry(radius * 0.985, 0.006, 5, 28), accentMat);
  accentRing.position.z = 0.026;
  group.add(accentRing);
  return group;
}

export function createCoolerPreview(cooler) {
  const params = cooler.modelParams || {};
  const heightMm = clamp(Number(params.height ?? cooler.compat?.height) || 155, 30, 220);
  const height = heightMm / 100;
  const type = String(params.type || "tower");
  const fanCount = clamp(Number(params.fanCount) || 1, 0, 3);
  const accent = type === "liquid" ? 0x5fe7ff : 0xffb15a;
  const group = new T.Group();
  group.name = `cooler-preview-${cooler.id}`;

  const baseMat = material(0x6c777c, 0.75, 0.28);
  const finMat = material(0x9aa4a7, 0.68, 0.3);
  const darkMat = material(0x151b1f, 0.45, 0.45);
  const accentMat = material(accent, 0.45, 0.3, { emissive: accent, emissiveIntensity: 0.5 });

  // Cold plate / mounting base on the CPU.
  addBox(group, 0.42, 0.42, 0.035, baseMat, 0, 0, 0.018);

  if (type === "liquid") {
    addCylinderAlongZ(group, 0.22, height - 0.035, darkMat, 0, 0, (height + 0.035) / 2, 28);
    const top = new T.Mesh(new T.CylinderGeometry(0.225, 0.225, 0.025, 28), baseMat);
    top.rotation.x = Math.PI / 2;
    top.position.set(0, 0, height - 0.012);
    group.add(top);
    const ring = new T.Mesh(new T.TorusGeometry(0.19, 0.009, 6, 28), accentMat);
    ring.position.z = height + 0.002;
    group.add(ring);
    const cap = new T.Mesh(new T.CircleGeometry(0.10, 24), material(0x0b1114, 0.4, 0.35));
    cap.position.z = height + 0.006;
    group.add(cap);
    // Two short tube stubs make the block read as an AIO pump.
    const tubeMat = material(0x0a0e10, 0.35, 0.55);
    [-0.10, 0.10].forEach((x) => {
      const tube = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.22, 10), tubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(x, 0.13, height - 0.06);
      group.add(tube);
    });
  } else if (type === "low-profile") {
    addBox(group, 0.44, 0.44, 0.075, darkMat, 0, 0, 0.055);
    for (let i = 0; i < 5; i++) {
      addBox(group, 0.46, 0.46, 0.008, finMat, 0, 0, 0.10 + i * 0.025);
    }
    const fan = buildFan(0.20, accent, 0.035);
    fan.position.set(0, 0, height - 0.045);
    group.add(fan);
    addBox(group, 0.40, 0.40, 0.018, darkMat, 0, 0, height - 0.012);
  } else {
    // Tower: fin stack along Z, one or two fans on the X sides.
    for (let i = 0; i < 11; i++) {
      const t = 11 === 1 ? 0 : i / 10;
      const z = 0.09 + t * Math.max(0.02, height - 0.18);
      addBox(group, 0.48, 0.54, 0.009, finMat, 0, 0, z);
    }
    addBox(group, 0.14, 0.50, 0.04, baseMat, 0, 0, height - 0.035);
    for (let i = 0; i < 6; i++) {
      addCylinderAlongZ(group, 0.010, Math.max(0.03, height - 0.08), baseMat, -0.10 + i * 0.04, 0.0, height / 2, 8);
    }
    const fanRadius = Math.min(0.21, height * 0.16 + 0.13);
    const sides = fanCount >= 2 ? [-1, 1] : [1];
    sides.forEach((side) => {
      const fan = buildFan(fanRadius, accent, 0.035);
      fan.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      fan.position.set(side * 0.285, 0, height * 0.56);
      group.add(fan);
    });
    addBox(group, 0.52, 0.58, 0.018, accentMat, 0, 0, height - 0.004);
    addBox(group, 0.06, 0.58, 0.10, darkMat, 0, 0, height - 0.06);
  }

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      height,
      heightMm,
      type,
      fanCount,
      topZ: height
    }
  };
}
