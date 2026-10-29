/* ==================================================================
   PARAMETRIC CASE FAN PREVIEW
   One fan in the XY plane, normal +Z. The assembly rotates it into
   front / top / rear positions. RGB rings and blades are emissive.
   ================================================================== */
const T = window.ATX_LIB.THREE;

function material(color, metalness = 0.45, roughness = 0.5, extra = {}) {
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

function addCylinderZ(parent, radius, depth, mat, x, y, z, seg = 24) {
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, depth, seg, 1), mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export function createCaseFanPreview(fan) {
  const params = fan.modelParams || {};
  const sizeMm = Number(params.size) || 120;
  const size = sizeMm / 100;
  const hasRgb = params.hasRgb === true;
  const radius = size / 2 - 0.035;
  const group = new T.Group();
  group.name = `case-fan-${fan.id}`;

  const frameMat = material(0x1b2329, 0.45, 0.45);
  const bladeMat = material(hasRgb ? 0x6f8790 : 0x4b575e, 0.35, 0.5, { side: T.DoubleSide });
  const hubMat = material(0x11171b, 0.55, 0.35);
  const rgbMat = material(0x5fe7ff, 0.3, 0.25, {
    emissive: 0x5fe7ff,
    emissiveIntensity: 2.6
  });
  const rgbPink = material(0xff6aa8, 0.3, 0.25, {
    emissive: 0xff6aa8,
    emissiveIntensity: 1.8
  });

  // Square frame + circular shroud.
  const frameHalf = size / 2 - 0.025;
  addBox(group, size - 0.02, 0.04, 0.045, frameMat, 0, frameHalf, 0);
  addBox(group, size - 0.02, 0.04, 0.045, frameMat, 0, -frameHalf, 0);
  addBox(group, 0.04, size - 0.02, 0.045, frameMat, frameHalf, 0, 0);
  addBox(group, 0.04, size - 0.02, 0.045, frameMat, -frameHalf, 0, 0);
  const ring = new T.Mesh(new T.TorusGeometry(radius, 0.022, 6, 32), frameMat);
  group.add(ring);

  // Rotor.
  addCylinderZ(group, radius * 0.23, 0.05, hubMat, 0, 0, 0.02, 24);
  addCylinderZ(group, radius * 0.10, 0.06, frameMat, 0, 0, 0.045, 18);
  const bladeGeo = new T.BoxGeometry(0.052, radius * 0.63, 0.012);
  const blades = new T.InstancedMesh(bladeGeo, bladeMat, 8);
  const dummy = new T.Object3D();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.18;
    dummy.position.set(Math.sin(angle) * radius * 0.33, Math.cos(angle) * radius * 0.33, 0.028);
    dummy.rotation.set(0, 0, -angle + 0.5);
    dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix);
  }
  blades.instanceMatrix.needsUpdate = true;
  group.add(blades);

  if (hasRgb) {
    const ringLight = new T.Mesh(new T.TorusGeometry(radius * 0.99, 0.014, 6, 36), rgbMat);
    ringLight.position.z = 0.05;
    group.add(ringLight);
    const innerLight = new T.Mesh(new T.TorusGeometry(radius * 0.80, 0.008, 5, 36), rgbPink);
    innerLight.position.z = 0.052;
    group.add(innerLight);
    addCylinderZ(group, radius * 0.25, 0.018, rgbMat, 0, 0, 0.065, 24);
  } else {
    const innerRing = new T.Mesh(new T.TorusGeometry(radius * 0.82, 0.006, 5, 28), frameMat);
    group.add(innerRing);
  }

  // Corner screws.
  const corner = size / 2 - 0.09;
  [[-corner, -corner], [corner, -corner], [-corner, corner], [corner, corner]].forEach(([x, y]) => {
    addCylinderZ(group, 0.018, 0.025, frameMat, x, y, 0.02, 10);
  });

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      sizeMm,
      size,
      hasRgb,
      quantity: Number(params.quantity) || 1
    }
  };
}
