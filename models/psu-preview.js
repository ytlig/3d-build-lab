/* ==================================================================
   PARAMETRIC PSU PREVIEW
   ATX-style box: length along X, width along Z, height along Y.
   Modular connector blocks sit on the top/interior face so the cable
   routes in the assembly have a believable origin.
   ================================================================== */
const T = window.ATX_LIB.THREE;

function material(color, metalness = 0.5, roughness = 0.42, extra = {}) {
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

export function createPsuPreview(psu) {
  const params = psu.modelParams || {};
  const length = Math.max(0.9, (Number(params.length) || 160) / 100);
  const width = Math.max(0.6, (Number(params.width) || 150) / 100);
  const height = Math.max(0.45, (Number(params.height) || 86) / 100);
  const fanSize = Math.max(0.7, (Number(params.fanSize) || 120) / 100);
  const modular = params.modularType || (params.modular ? "full" : "none");

  const group = new T.Group();
  group.name = `psu-preview-${psu.id}`;

  const bodyMat = material(0x161d21, 0.58, 0.42);
  const darkMat = material(0x090e11, 0.4, 0.5);
  const metalMat = material(0x6a777d, 0.72, 0.3);
  const accentMat = material(0xffb15a, 0.45, 0.3, { emissive: 0xffb15a, emissiveIntensity: 0.35 });
  const labelMat = material(0x283238, 0.4, 0.5);

  addBox(group, length, height, width, bodyMat, 0, 0, 0);
  addBox(group, length - 0.02, 0.012, width - 0.02, darkMat, 0, height / 2 + 0.004, 0);

  // Top fan grille.
  const grille = new T.Mesh(new T.TorusGeometry(fanSize * 0.33, 0.012, 6, 28), metalMat);
  grille.rotation.x = -Math.PI / 2;
  grille.position.set(0, height / 2 + 0.018, 0);
  group.add(grille);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bar = addBox(
      group,
      0.035,
      0.006,
      fanSize * 0.38,
      metalMat,
      Math.sin(angle) * fanSize * 0.26,
      height / 2 + 0.02,
      Math.cos(angle) * fanSize * 0.26
    );
    bar.rotation.y = angle;
  }

  // Modular connector panel on the top/interior face.
  const connectorY = height / 2 + 0.025;
  const connectorXs = [-length * 0.26, -length * 0.06, length * 0.14, length * 0.33];
  connectorXs.forEach((x, index) => {
    const block = addBox(group, 0.12, 0.055, 0.09, labelMat, x, connectorY, -width * 0.12);
    if (index === 0) block.material = accentMat;
  });
  addBox(group, 0.10, 0.03, 0.05, darkMat, -length * 0.36, connectorY, width * 0.18);
  addBox(group, 0.10, 0.03, 0.05, darkMat, length * 0.38, connectorY, width * 0.18);

  // Vent slats on the side.
  for (let i = 0; i < 5; i++) {
    addBox(group, length * 0.72, 0.008, 0.012, darkMat, 0, -height * 0.28 + i * 0.025, width / 2 + 0.004);
  }

  // Rear AC plate.
  addBox(group, 0.025, height * 0.62, width * 0.34, darkMat, -length / 2 - 0.012, 0, 0);
  addBox(group, 0.018, 0.10, 0.08, metalMat, -length / 2 - 0.025, 0, 0);

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      length,
      width,
      height,
      fanSize,
      modular,
      connectors: {
        atx24: { x: connectorXs[1], y: connectorY, z: -width * 0.12 },
        cpu8: { x: connectorXs[2], y: connectorY, z: -width * 0.12 },
        pcie: { x: connectorXs[3], y: connectorY, z: -width * 0.12 }
      }
    }
  };
}
