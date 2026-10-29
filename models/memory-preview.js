/* ==================================================================
   PARAMETRIC MEMORY PREVIEW
   Modules stand vertically in the motherboard RAM slots. The kit's
   moduleCount chooses populated slots; height and RGB come from
   modelParams.
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

export function createMemoryPreview(memory, slots = []) {
  const params = memory.modelParams || {};
  const moduleCount = Math.max(1, Math.min(4, Number(params.moduleCount) || 2));
  const height = Math.max(0.2, (Number(params.height) || 40) / 100);
  const hasRgb = params.hasRgb !== false;
  const group = new T.Group();
  group.name = `memory-preview-${memory.id}`;

  const pcbMat = material(0x0b211c, 0.25, 0.55);
  const metalMat = material(0x8b969a, 0.65, 0.32);
  const darkMat = material(0x161d21, 0.4, 0.5);
  const goldMat = material(0xc6a15b, 0.8, 0.25);
  const rgbMat = material(0x5fe7ff, 0.3, 0.25, {
    emissive: 0x5fe7ff,
    emissiveIntensity: 2.2
  });
  const rgbPink = material(0xff6aa8, 0.3, 0.25, {
    emissive: 0xff6aa8,
    emissiveIntensity: 1.6
  });

  const chosen = moduleCount >= 4 ? [0, 1, 2, 3] : moduleCount === 3 ? [0, 1, 2] : [1, 3];
  const useSlots = slots.length >= 4 ? chosen : Array.from({ length: moduleCount }, (_, i) => i);

  useSlots.forEach((slotIndex, index) => {
    const slot = slots[slotIndex] || { x: index * 0.08, y: 0.2, z: 0 };
    const moduleGroup = new T.Group();
    moduleGroup.position.set(slot.x, slot.y + height / 2, slot.z + 0.055);

    // PCB + heat spreader.
    addBox(moduleGroup, 0.014, height, 0.095, pcbMat, 0, 0, 0);
    addBox(moduleGroup, 0.024, height * 0.84, 0.105, metalMat, 0, 0.015, 0);
    addBox(moduleGroup, 0.027, height * 0.16, 0.108, darkMat, 0, -height * 0.4, 0);
    addBox(moduleGroup, 0.012, 0.045, 0.075, goldMat, 0, -height / 2 - 0.012, 0);

    if (hasRgb) {
      addBox(moduleGroup, 0.028, 0.022, 0.10, index % 2 ? rgbPink : rgbMat, 0, height / 2 - 0.006, 0);
      addBox(moduleGroup, 0.029, 0.008, 0.085, rgbMat, 0, height / 2 - 0.02, 0);
    } else {
      addBox(moduleGroup, 0.028, 0.012, 0.10, darkMat, 0, height / 2 - 0.006, 0);
    }
    group.add(moduleGroup);
  });

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return {
    group,
    meta: {
      moduleCount,
      height,
      heightMm: height * 100,
      hasRgb,
      populated: useSlots.length
    }
  };
}
