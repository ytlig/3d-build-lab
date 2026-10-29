/* ==================================================================
   DESKTOP / FULL PC BUILD MODEL
   Reuses the untouched ATX motherboard factory and wraps it in a
   chassis, PSU, four case fans and four sleeved power cables.
   All new parts are independent scene groups so the shared engine can
   pick, explode and focus them individually.
   ================================================================== */
(function () {
  "use strict";

  const T = window.ATX_LIB.THREE;
  const TAU = Math.PI * 2;
  const BOARD_OFFSET = new T.Vector3(0, 0.15, 0.05);
  const ACCENT = 0xffb15a;
  const CYAN = 0x5fe7ff;

  /* ----------------------------------------------------------------
     01. MATERIALS / SMALL HELPERS
     ---------------------------------------------------------------- */
  function standard(color, metalness, roughness, extra) {
    return new T.MeshStandardMaterial(Object.assign({
      color,
      metalness: metalness === undefined ? 0.55 : metalness,
      roughness: roughness === undefined ? 0.4 : roughness
    }, extra || {}));
  }

  function addBox(parent, w, h, d, material, x, y, z, rx, ry, rz) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx || 0, ry || 0, rz || 0);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radius, height, material, x, y, z, axis) {
    const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, 24, 1, false), material);
    mesh.position.set(x, y, z);
    if (axis === "z") mesh.rotation.x = Math.PI / 2;
    else if (axis === "x") mesh.rotation.z = Math.PI / 2;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  function addTorus(parent, radius, tube, material, x, y, z, rx, ry) {
    const mesh = new T.Mesh(new T.TorusGeometry(radius, tube, 8, 32), material);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  function roundedRectShape(w, h, r) {
    const s = new T.Shape();
    const x = -w / 2;
    const y = -h / 2;
    const rad = Math.min(r, Math.min(w, h) / 2);
    s.moveTo(x + rad, y);
    s.lineTo(x + w - rad, y);
    s.quadraticCurveTo(x + w, y, x + w, y + rad);
    s.lineTo(x + w, y + h - rad);
    s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    s.lineTo(x + rad, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - rad);
    s.lineTo(x, y + rad);
    s.quadraticCurveTo(x, y, x + rad, y);
    return s;
  }

  function makeTexture(w, h, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext("2d"), w, h);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  function makeVentTexture() {
    return makeTexture(512, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(3,7,8,0.86)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(154,198,207,0.15)";
      for (let y = 12; y < h; y += 20) {
        for (let x = 12; x < w; x += 20) {
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, TAU);
          ctx.fill();
        }
      }
      ctx.strokeStyle = "rgba(95,231,255,0.12)";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);
    });
  }

  function makePsuLabel() {
    return makeTexture(1024, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0b1114");
      g.addColorStop(1, "#151d21");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,177,90,0.45)";
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.fillStyle = "#ffb15a";
      ctx.font = "600 150px Bahnschrift, Arial, sans-serif";
      ctx.fillText("850", 52, 250);
      ctx.fillStyle = "#dbe9ec";
      ctx.font = "400 92px Bahnschrift, Arial, sans-serif";
      ctx.fillText("W", 350, 250);
      ctx.fillStyle = "rgba(223,236,238,0.72)";
      ctx.font = "500 42px Bahnschrift, Arial, sans-serif";
      ctx.fillText("80 PLUS GOLD", 54, 330);
      ctx.fillStyle = "rgba(120,160,170,0.6)";
      ctx.font = "400 26px Bahnschrift, Arial, sans-serif";
      ctx.fillText("FULLY MODULAR / ATX 3.0 / PCIe 5.0", 54, 382);
      ctx.fillStyle = "rgba(95,231,255,0.6)";
      ctx.fillRect(54, 410, 250, 3);
      ctx.fillStyle = "rgba(255,177,90,0.35)";
      ctx.font = "400 22px Bahnschrift, Arial, sans-serif";
      ctx.fillText("BUILD SERIES / 850", 54, 458);
    });
  }

  function makeFabricTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#171d21";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(155,185,193,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 32; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8, 0);
        ctx.lineTo(i * 8 + 90, h);
        ctx.stroke();
      }
    });
  }

  /* ----------------------------------------------------------------
     02. PART MATERIAL ISOLATION
     ---------------------------------------------------------------- */
  function collectPart(id, group, parts, pickables) {
    const cloneMap = new Map();
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      object.userData.partId = id;
      const cloneOne = (material) => {
        if (!material || material.isMaterial === false) return material;
        if (!cloneMap.has(material)) cloneMap.set(material, material.clone());
        return cloneMap.get(material);
      };
      if (Array.isArray(object.material)) object.material = object.material.map(cloneOne);
      else object.material = cloneOne(object.material);
    });

    const states = [];
    const seen = new Set();
    group.traverse((object) => {
      if (!object.isMesh) return;
      pickables.push(object);
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      mats.forEach((material) => {
        if (!material || seen.has(material)) return;
        seen.add(material);
        const emissive = material.emissive ? material.emissive.clone() : null;
        states.push({
          material,
          baseColor: material.color ? material.color.clone() : null,
          baseEmissive: emissive,
          baseEmissiveIntensity: material.emissiveIntensity === undefined ? 1 : material.emissiveIntensity,
          baseEmissiveLum: emissive ? emissive.r + emissive.g + emissive.b : 0
        });
      });
    });
    parts[id] = { group, materials: states };
    return { group, materials: states };
  }

  /* 一排 LED 灯珠：沿 axis 方向均布 count 颗 */
  function addLedStrip(parent, length, count, beadRadius, material, x, y, z, axis) {
    const geometry = new T.SphereGeometry(beadRadius, 6, 5);
    const beads = new T.InstancedMesh(geometry, material, count);
    const dummy = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const offset = (i / Math.max(count - 1, 1) - 0.5) * length;
      if (axis === "x") dummy.position.set(x + offset, y, z);
      else if (axis === "y") dummy.position.set(x, y + offset, z);
      else dummy.position.set(x, y, z + offset);
      dummy.updateMatrix();
      beads.setMatrixAt(i, dummy.matrix);
    }
    beads.instanceMatrix.needsUpdate = true;
    beads.castShadow = false;
    beads.receiveShadow = false;
    parent.add(beads);
    return beads;
  }

  /* ----------------------------------------------------------------
     03. CASE FAN
     ---------------------------------------------------------------- */
  function buildCaseFan(radius, depth, accentMaterial) {
    const group = new T.Group();
    const frameMat = standard(0x171e23, 0.62, 0.42);
    const bladeMat = standard(0x303b42, 0.45, 0.48, { side: T.DoubleSide });
    const hubMat = standard(0x0e1316, 0.55, 0.32);
    const frameR = radius * 1.24;
    const shape = roundedRectShape(frameR * 2, frameR * 2, frameR * 0.25);
    const hole = new T.Path();
    hole.absarc(0, 0, radius * 1.02, 0, TAU, true);
    shape.holes.push(hole);
    const frameGeo = new T.ExtrudeGeometry(shape, {
      depth: depth * 0.7,
      steps: 1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 1
    });
    frameGeo.translate(0, 0, -depth * 0.35);
    const frame = new T.Mesh(frameGeo, frameMat);
    group.add(frame);
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sy = -1; sy <= 1; sy += 2) {
        addCylinder(group, 0.018, 0.022, standard(0x0a0d10, 0.8, 0.35),
          sx * frameR * 0.8, sy * frameR * 0.8, depth * 0.4, "z");
      }
    }
    addCylinder(group, radius * 0.21, depth * 0.46, hubMat, 0, 0, 0, "z");
    addCylinder(group, radius * 0.11, depth * 0.5, standard(0x26333a, 0.8, 0.25), 0, 0, depth * 0.04, "z");

    const blade = new T.Shape();
    blade.moveTo(radius * 0.08, radius * 0.02);
    blade.bezierCurveTo(radius * 0.28, radius * 0.2, radius * 0.63, radius * 0.17, radius * 0.94, -radius * 0.02);
    blade.bezierCurveTo(radius * 0.6, -radius * 0.18, radius * 0.26, -radius * 0.12, radius * 0.08, -radius * 0.02);
    const bladeGeo = new T.ExtrudeGeometry(blade, {
      depth: 0.012, steps: 1, curveSegments: 8, bevelEnabled: false
    });
    const blades = new T.InstancedMesh(bladeGeo, bladeMat, 7);
    const dummy = new T.Object3D();
    for (let i = 0; i < 7; i++) {
      dummy.position.set(0, 0, 0.018);
      dummy.rotation.set(0, 0, (i / 7) * TAU + 0.2);
      dummy.updateMatrix();
      blades.setMatrixAt(i, dummy.matrix);
    }
    blades.instanceMatrix.needsUpdate = true;
    group.add(blades);

    // 灯珠：一圈独立小颗粒 + 一层很淡的扩散环。
    // 原来是一条连续发光圆环，近看像画上去的一条线；真实灯带是"颗颗分明"的
    // LED 加一层磨砂扩散。这里用 InstancedMesh 排一圈小球（1 个 draw call）。
    addLedRing(group, radius * 1.01, 28, 0.015, accentMaterial, depth * 0.38);
    addTorus(group, radius * 1.01, 0.006, new T.MeshBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0.16,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    }), 0, 0, depth * 0.38);
    addTorus(group, radius * 0.86, 0.006, standard(0x101518, 0.7, 0.4), 0, 0, depth * 0.4);
    return group;
  }

  /* 一圈 LED 灯珠：半径 radius 的圆上均布 count 颗，朝 z 方向排布 */
  function addLedRing(parent, radius, count, beadRadius, material, z) {
    const geometry = new T.SphereGeometry(beadRadius, 6, 5);
    const beads = new T.InstancedMesh(geometry, material, count);
    const dummy = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      dummy.updateMatrix();
      beads.setMatrixAt(i, dummy.matrix);
    }
    beads.instanceMatrix.needsUpdate = true;
    beads.castShadow = false;
    beads.receiveShadow = false;
    parent.add(beads);
    return beads;
  }

  /* ----------------------------------------------------------------
     04. CASE SHELL / PANELS / PSU
     ---------------------------------------------------------------- */
  function buildCaseFrame() {
    const group = new T.Group();
    const shell = standard(0x10171b, 0.72, 0.36);
    const inner = standard(0x1c252a, 0.55, 0.42);
    const rubber = standard(0x070a0c, 0.15, 0.86);

    addBox(group, 3.95, 0.08, 2.16, shell, 0, -2.08, 0.45);
    // 大面积背板/托架是低优先级拾取目标：隔着玻璃点击空白处时优先选中
    // 玻璃侧板，而不是直接选中机箱内部的大块背板。
    const backPanel = addBox(group, 3.95, 4.2, 0.07, shell, 0, 0.02, -0.64);
    backPanel.userData.noPick = true;
    const rearPanel = addBox(group, 0.07, 4.2, 2.16, shell, -1.96, 0.02, 0.45);
    rearPanel.userData.noPick = true;
    // 前面框只保留上下横梁，正面交给可拆 frontPanel，风扇从网孔露出。
    addBox(group, 0.07, 0.1, 2.12, shell, 1.94, 1.98, 0.45);
    addBox(group, 0.07, 0.1, 2.12, shell, 1.94, -1.98, 0.45);
    addBox(group, 0.1, 4.0, 0.1, shell, 1.9, 0.02, 1.51);
    addBox(group, 0.1, 4.0, 0.1, shell, 1.9, 0.02, -0.61);
    const tray = addBox(group, 3.55, 3.1, 0.045, inner, 0, 0.2, -0.28);
    tray.userData.noPick = true;

    // 主板铜柱，保持现有主板模型悬空安装在机箱内
    const standoffs = [
      [-1.4, 1.1], [-1.4, 0.1], [-1.4, -0.92], [-0.9, -1.12],
      [0.25, -1.12], [1.4, -1.03], [1.4, -0.12], [1.4, 0.92], [-0.35, 1.13]
    ];
    standoffs.forEach(([x, y]) => {
      addCylinder(group, 0.045, 0.26, standard(0xb08a54, 0.9, 0.25), x, y + BOARD_OFFSET.y, -0.14, "z");
    });

    // 走线孔与理线环
    [-0.7, 0.0, 0.7].forEach((x) => {
      addTorus(group, 0.12, 0.022, rubber, x, 0.9, -0.24, Math.PI / 2, 0);
    });
    addTorus(group, 0.13, 0.022, rubber, 1.2, -0.1, -0.24, Math.PI / 2, 0);

    // 后部扩展槽与脚垫
    for (let i = 0; i < 7; i++) {
      addBox(group, 0.03, 0.06, 0.42, standard(0x313c42, 0.75, 0.3), -1.91, -0.55 + i * 0.15, 0.62);
    }
    [[-1.75, -1.75], [1.55, -1.75], [-1.75, 1.25], [1.55, 1.25]].forEach(([x, z]) => {
      addCylinder(group, 0.13, 0.08, rubber, x, -2.14, z, "y");
    });

    // 底部铭牌
    addBox(group, 0.7, 0.012, 0.34, standard(0xb08a54, 0.8, 0.3), 0.4, -2.03, 0.5);
    return group;
  }

  function buildSidePanel() {
    const group = new T.Group();
    const frameMat = standard(0x171f24, 0.78, 0.3);
    // 钢化玻璃：用 physical 的 clearcoat 做一层掠射反光，比单纯低不透明度更"像玻璃"
    const glassMat = new T.MeshPhysicalMaterial({
      color: 0x9fe8f4,
      metalness: 0.0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
      ior: 1.52,
      reflectivity: 0.9,
      depthWrite: false,
      side: T.DoubleSide
    });
    addBox(group, 3.9, 0.075, 0.075, frameMat, 0, 1.94, 0);
    addBox(group, 3.9, 0.075, 0.075, frameMat, 0, -1.94, 0);
    addBox(group, 0.075, 3.86, 0.075, frameMat, 1.9, 0, 0);
    addBox(group, 0.075, 3.86, 0.075, frameMat, -1.9, 0, 0);
    const glass = new T.Mesh(new T.PlaneGeometry(3.72, 3.78), glassMat);
    glass.position.set(0, 0, 0.002);
    glass.userData.noPick = true;
    group.add(glass);
    addBox(group, 2.4, 0.012, 0.012, new T.MeshBasicMaterial({
      color: CYAN, transparent: true, opacity: 0.12, blending: T.AdditiveBlending,
      depthWrite: false, toneMapped: false
    }), 0.3, 0.7, 0.012, 0, 0, -0.22);
    for (let i = 0; i < 4; i++) {
      addCylinder(group, 0.035, 0.024, standard(0x0b0f11, 0.85, 0.3),
        i < 2 ? -1.82 : 1.82, i % 2 ? -1.82 : 1.82, 0.02, "z");
    }
    return group;
  }

  function buildFrontPanel() {
    const group = new T.Group();
    const metal = standard(0x202a30, 0.78, 0.33);
    const vent = new T.MeshBasicMaterial({
      map: makeVentTexture(), transparent: true, opacity: 0.72, side: T.DoubleSide,
      depthWrite: false, toneMapped: false
    });
    addBox(group, 0.065, 4.0, 0.1, metal, 0, 0, 0.93);
    addBox(group, 0.065, 4.0, 0.1, metal, 0, 0, -0.93);
    addBox(group, 0.065, 0.1, 1.9, metal, 0, 1.95, 0);
    addBox(group, 0.065, 0.1, 1.9, metal, 0, -1.95, 0);
    const ventPlate = new T.Mesh(new T.PlaneGeometry(1.8, 3.8), vent);
    ventPlate.position.set(-0.005, 0, 0);
    ventPlate.rotation.y = Math.PI / 2;
    group.add(ventPlate);
    // 前面板灯条同样处理：一条很淡的扩散底 + 一排灯珠
    const frontStripMat = new T.MeshBasicMaterial({
      color: CYAN, transparent: true, opacity: 0.18, blending: T.AdditiveBlending,
      depthWrite: false, toneMapped: false
    });
    addBox(group, 0.02, 0.035, 1.75, frontStripMat, 0.035, 1.55, 0);
    addLedStrip(group, 1.75, 26, 0.014, frontStripMat, 0.035, 1.55, 0, "z");
    addBox(group, 0.22, 0.08, 0.15, standard(0x080c0e, 0.4, 0.6), 0.06, 1.7, 0.62);
    addCylinder(group, 0.045, 0.035, standard(0x8a949a, 0.9, 0.2), 0.06, 1.7, 0.8, "x");
    addBox(group, 0.035, 0.09, 0.22, standard(0x080c0e, 0.3, 0.6), 0.06, -1.7, 0.45);
    return group;
  }

  function buildTopPanel() {
    const group = new T.Group();
    const metal = standard(0x202a30, 0.78, 0.33);
    const vent = new T.MeshBasicMaterial({
      map: makeVentTexture(), transparent: true, opacity: 0.68, side: T.DoubleSide,
      depthWrite: false, toneMapped: false
    });
    addBox(group, 3.95, 0.06, 0.1, metal, 0, 0, 0.95);
    addBox(group, 3.95, 0.06, 0.1, metal, 0, 0, -0.95);
    addBox(group, 0.1, 0.06, 2.0, metal, 1.92, 0, 0);
    addBox(group, 0.1, 0.06, 2.0, metal, -1.92, 0, 0);
    const ventPlate = new T.Mesh(new T.PlaneGeometry(3.7, 1.8), vent);
    ventPlate.rotation.x = -Math.PI / 2;
    ventPlate.position.y = 0.033;
    group.add(ventPlate);
    addBox(group, 0.85, 0.025, 0.25, standard(0x080c0e, 0.3, 0.6), 1.0, 0.045, 0.72);
    addCylinder(group, 0.035, 0.03, standard(0x8a949a, 0.9, 0.2), 1.28, 0.065, 0.72, "y");
    return group;
  }

  function buildPSU() {
    const group = new T.Group();
    const shell = standard(0x0d1215, 0.65, 0.38);
    const dark = standard(0x050809, 0.3, 0.7);
    addBox(group, 1.82, 0.55, 0.95, shell, 0, 0, 0);
    addBox(group, 1.68, 0.025, 0.82, dark, 0, 0.285, 0);
    addTorus(group, 0.29, 0.018, standard(0x303b42, 0.8, 0.3), 0, 0.3, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      addBox(group, 0.38, 0.008, 0.035, standard(0x3d4a51, 0.6, 0.5),
        0, 0.315, -0.2 + i * 0.067, 0, 0.3, 0);
    }
    addTorus(group, 0.31, 0.012, standard(0x101618, 0.6, 0.55), 0, 0.305, 0, 0, 0);
    const label = new T.Mesh(
      new T.PlaneGeometry(1.55, 0.78),
      new T.MeshBasicMaterial({ map: makePsuLabel(), transparent: false, toneMapped: false })
    );
    label.position.set(0, 0, 0.481);
    group.add(label);
    for (let i = 0; i < 4; i++) {
      addBox(group, 0.19, 0.11, 0.06, dark, 0.58, 0.15 - i * 0.15, 0.49);
      addBox(group, 0.12, 0.035, 0.02, standard(0xb08a54, 0.8, 0.3), 0.58, 0.15 - i * 0.15, 0.525);
    }
    addCylinder(group, 0.035, 0.025, standard(0x2b343a, 0.8, 0.3), -0.72, 0.29, 0.28, "y");
    return group;
  }

  /* ----------------------------------------------------------------
     05. CABLES
     ---------------------------------------------------------------- */
  function buildCable(points, radius, color) {
    const group = new T.Group();
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p[0], p[1], p[2])), false, "catmullrom", 0.34);
    const geo = new T.TubeGeometry(curve, 32, radius, 8, false);
    const sleeve = standard(color || 0x20282d, 0.1, 0.8);
    const tube = new T.Mesh(geo, sleeve);
    group.add(tube);
    const connector = standard(0x0b0f12, 0.35, 0.55);
    const start = curve.getPoint(0);
    const end = curve.getPoint(1);
    addBox(group, radius * 4.2, radius * 2.4, radius * 5.0, connector, start.x, start.y, start.z);
    addBox(group, radius * 4.2, radius * 2.4, radius * 5.0, connector, end.x, end.y, end.z);
    [0.3, 0.62].forEach((t) => {
      const p = curve.getPoint(t);
      addBox(group, radius * 3.8, radius * 1.5, radius * 1.8, standard(0x0b1013, 0.3, 0.7), p.x, p.y, p.z);
    });
    return group;
  }

  function buildCables(root, parts, pickables) {
    const psu = new T.Vector3(0.55, -1.38, 0.62);
    const atx = new T.Vector3(1.3, 0.28, 0.24);
    const cpu8 = new T.Vector3(-0.52, 1.26, 0.24);
    const gpu = new T.Vector3(0.79, -0.11, 0.42);
    const sata = new T.Vector3(0.82, -0.84, 0.22);

    const specs = [
      ["cable24", [[psu.x, psu.y, psu.z], [1.2, -1.2, 0.82], [1.74, -0.15, 0.82], [1.58, 0.25, 0.48], [atx.x, atx.y, atx.z]], 0.045, [1.32, 0.28, 0.45]],
      ["cable8", [[0.35, psu.y, psu.z], [-0.7, -1.12, 0.82], [-1.15, 0.28, 0.72], [-0.85, 1.08, 0.44], [cpu8.x, cpu8.y, cpu8.z]], 0.035, [-0.55, 1.26, 0.5]],
      ["cableGpu", [[0.72, psu.y, psu.z], [1.12, -1.02, 0.78], [1.22, -0.48, 0.65], [0.96, -0.18, 0.5], [gpu.x, gpu.y, gpu.z]], 0.035, [0.9, -0.25, 0.7]],
      ["cableSata", [[0.6, psu.y, psu.z], [1.2, -1.12, 0.78], [1.1, -0.7, 0.48], [sata.x, sata.y, sata.z]], 0.024, [0.75, -0.7, 0.5]]
    ];
    specs.forEach(([id, pts, radius, label]) => {
      const group = buildCable(pts, radius, id === "cable24" ? 0x273138 : 0x1b2226);
      group.userData.labelAnchor = label;
      root.add(group);
      collectPart(id, group, parts, pickables);
    });
  }

  /* ----------------------------------------------------------------
     06. BOARD ASSEMBLY + FULL BUILD
     ---------------------------------------------------------------- */
  function buildDesktop(renderer) {
    if (!window.MotherboardModel) throw new Error("MotherboardModel is not loaded");
    const board = window.MotherboardModel.build(renderer);
    const root = new T.Group();
    root.name = "atx-full-build";
    const parts = {};
    const pickables = [];

    // Reuse the untouched motherboard part groups. Only the root placement
    // is shifted; geometry, materials and per-part internals are unchanged.
    Object.entries(board.parts).forEach(([id, part]) => {
      part.group.position.add(BOARD_OFFSET);
      root.add(part.group);
      parts[id] = part;
    });

    const caseFrame = buildCaseFrame();
    root.add(caseFrame);
    collectPart("case", caseFrame, parts, pickables);

    const sidePanel = buildSidePanel();
    sidePanel.position.set(0, 0.05, 1.55);
    root.add(sidePanel);
    collectPart("sidePanel", sidePanel, parts, pickables);

    const frontPanel = buildFrontPanel();
    frontPanel.position.set(1.98, 0, 0.45);
    root.add(frontPanel);
    collectPart("frontPanel", frontPanel, parts, pickables);

    const topPanel = buildTopPanel();
    topPanel.position.set(0, 2.08, 0.45);
    root.add(topPanel);
    collectPart("topPanel", topPanel, parts, pickables);

    const psu = buildPSU();
    psu.position.set(0.55, -1.68, 0.35);
    root.add(psu);
    collectPart("psu", psu, parts, pickables);

    const fanAccent = new T.MeshBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0.72,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const fanSpecs = [
      ["frontFan1", [1.67, 1.02, 0.53], [0, -Math.PI / 2, 0], 0.4],
      ["frontFan2", [1.67, -0.02, 0.53], [0, -Math.PI / 2, 0], 0.4],
      ["topFan", [0.55, 1.92, 0.53], [-Math.PI / 2, 0, 0], 0.44],
      ["rearFan", [-1.68, 0.55, 0.53], [0, Math.PI / 2, 0], 0.42]
    ];
    fanSpecs.forEach(([id, pos, rot, radius]) => {
      const fan = buildCaseFan(radius, 0.1, fanAccent);
      fan.position.fromArray(pos);
      fan.rotation.set(rot[0], rot[1], rot[2]);
      root.add(fan);
      collectPart(id, fan, parts, pickables);
    });

    buildCables(root, parts, pickables);

    root.traverse((object) => {
      object.castShadow = false;
      object.receiveShadow = false;
    });
    root.updateMatrixWorld(true);
    return {
      root,
      parts,
      pickables,
      envMap: board.envMap
    };
  }

  window.DesktopModel = { build: buildDesktop };
})();


