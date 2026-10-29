/* ==================================================================
   PRODUCT VIEWER ENGINE
   Shared by every product. Scene, camera, controls, teardown state,
   focus choreography, highlight materials and the render loop live here.
   UI is deliberately not imported: engine emits state events only.
   ================================================================== */
const { THREE: T, OrbitControls, CSS2DRenderer, CSS2DObject } = window.ATX_LIB;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (v, target, lambda, dt) => v + (target - v) * (1 - Math.exp(-lambda * dt));
const isNarrow = () => window.innerWidth < 820;
const isTablet = () => window.innerWidth >= 820 && window.innerWidth < 1180;

function sphericalPosition(theta, phi, radius, target) {
  const sinPhi = Math.sin(phi);
  return new T.Vector3(
    target.x + radius * sinPhi * Math.sin(theta),
    target.y + radius * Math.cos(phi),
    target.z + radius * sinPhi * Math.cos(theta)
  );
}

export function createEngine(config, canvas) {
  /* ----------------------------------------------------------------
     01. RENDERER / SCENE / CAMERA / CONTROLS
     ---------------------------------------------------------------- */
  const viewportElement = config.viewportElement
    ? (typeof config.viewportElement === "string"
      ? document.querySelector(config.viewportElement)
      : config.viewportElement)
    : null;
  const viewWidth = () => Math.max(1, viewportElement?.clientWidth || window.innerWidth);
  const viewHeight = () => Math.max(1, viewportElement?.clientHeight || window.innerHeight);

  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(viewWidth(), viewHeight(), false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.render?.exposure ?? 1;
  renderer.shadowMap.enabled = false;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(config.camera.fov || 34, viewWidth() / viewHeight(), 0.06, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 0.9;
  controls.maxDistance = 46;
  controls.minPolarAngle = 0.26;
  controls.maxPolarAngle = 2.72;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.8;
  controls.autoRotateSpeed = 0.55;

  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();
  const accent = new T.Color(config.stage?.accent ?? 0xffb15a);
  const secondary = new T.Color(config.stage?.secondary ?? config.stage?.accent ?? 0x5fe7ff);

  const partMap = new Map();
  const pickables = [];
  const listeners = new Set();
  const hoverListeners = new Set();
  const blockListeners = new Set();
  const removed = new Set();
  let selectedId = null;
  let hoveredId = null;
  let autoRotate = false;
  let modelRoot = null;
  let labelsVisible = false;
  let labelsDirty = true;
  let lastLabelRender = 0;
  let cameraTween = null;
  let pointerDown = null;
  let lastPick = 0;
  let frameId = 0;
  let disposed = false;
  const outlineCache = new Map();
  let activeOutlineId = null;

  /* ----------------------------------------------------------------
     02. LABEL RENDERER
     ---------------------------------------------------------------- */
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(viewWidth(), viewHeight());
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.inset = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  labelRenderer.domElement.style.zIndex = "18";
  document.getElementById("css2d-layer")?.appendChild(labelRenderer.domElement);

  controls.addEventListener("change", () => { labelsDirty = true; });

  /* ----------------------------------------------------------------
     03. LIGHT RIG / STAGE
     ---------------------------------------------------------------- */
  let stageGroup = null;

  function addLights() {
    (config.lights || []).forEach((light) => {
      let object;
      if (light.type === "hemisphere") {
        object = new T.HemisphereLight(light.sky, light.ground, light.intensity);
      } else if (light.type === "directional") {
        object = new T.DirectionalLight(light.color, light.intensity);
        object.position.fromArray(light.position || [3, 5, 5]);
      } else if (light.type === "spot") {
        object = new T.SpotLight(
          light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay
        );
        object.position.fromArray(light.position || [3, 5, 6]);
        if (light.target) object.target.position.fromArray(light.target);
        scene.add(object.target);
      } else {
        object = new T.PointLight(light.color, light.intensity, light.distance || 0, light.decay ?? 2);
        object.position.fromArray(light.position || [0, 0, 4]);
      }
      object.castShadow = false;
      scene.add(object);
    });
  }

  function addStage() {
    const stage = new T.Group();
    stageGroup = stage;
    stage.visible = config.stage !== false;
    stage.position.y = config.stage?.y ?? -1.65;
    scene.add(stage);
    const radius = config.stage?.radius ?? 2.7;

    const platform = new T.Mesh(
      new T.CylinderGeometry(radius * 0.94, radius, 0.08, 32),
      new T.MeshStandardMaterial({
        color: 0x060b0e,
        roughness: 0.42,
        metalness: 0.72,
        envMapIntensity: 0.55
      })
    );
    platform.castShadow = false;
    platform.receiveShadow = false;
    stage.add(platform);

    const ringMatA = new T.MeshBasicMaterial({
      color: secondary,
      transparent: true,
      opacity: 0.3,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const ringMatB = new T.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.2,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const ringA = new T.Mesh(new T.RingGeometry(radius * 0.66, radius * 0.666, 32), ringMatA);
    ringA.rotation.x = -Math.PI / 2;
    ringA.position.y = 0.045;
    stage.add(ringA);
    const ringB = new T.Mesh(new T.RingGeometry(radius * 0.86, radius * 0.864, 32), ringMatB);
    ringB.rotation.x = -Math.PI / 2;
    ringB.position.y = 0.046;
    stage.add(ringB);

    const sweep = new T.Mesh(
      new T.RingGeometry(radius * 0.58, radius * 0.93, 32, 1, 0, 0.62),
      new T.MeshBasicMaterial({
        color: secondary,
        transparent: true,
        opacity: 0.06,
        side: T.DoubleSide,
        blending: T.AdditiveBlending,
        depthWrite: false
      })
    );
    sweep.rotation.x = -Math.PI / 2;
    sweep.position.y = 0.048;
    stage.add(sweep);

    const ticks = new T.InstancedMesh(
      new T.BoxGeometry(0.008, 0.005, 0.1),
      new T.MeshBasicMaterial({ color: secondary, transparent: true, opacity: 0.22 }),
      48
    );
    const dummy = new T.Object3D();
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const r = i % 6 === 0 ? radius * 0.9 : radius * 0.935;
      dummy.position.set(Math.cos(angle) * r, 0.05, Math.sin(angle) * r);
      dummy.rotation.set(0, -angle, 0);
      dummy.updateMatrix();
      ticks.setMatrixAt(i, dummy.matrix);
    }
    ticks.instanceMatrix.needsUpdate = true;
    stage.add(ticks);

    const halo = new T.Mesh(
      new T.CircleGeometry(radius * 1.35, 32),
      new T.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.035,
        blending: T.AdditiveBlending,
        depthWrite: false
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;
    stage.add(halo);
  }

  addLights();
  addStage();

  /* ----------------------------------------------------------------
     04. MODEL / PART REGISTRY
     ---------------------------------------------------------------- */
  function normalizeMaterialStates(part) {
    if (!part) return [];
    const states = [];
    if (Array.isArray(part.materialState) && Array.isArray(part.materials)) {
      part.materials.forEach((material, index) => {
        if (!material) return;
        const legacy = part.materialState[index] || {};
        const baseEmissive = material.emissive ? material.emissive.clone() : null;
        states.push({
          material,
          baseColor: material.color ? material.color.clone() : null,
          baseEmissive,
          baseEmissiveIntensity: material.emissiveIntensity === undefined ? 1 : material.emissiveIntensity,
          baseEmissiveLum: baseEmissive ? baseEmissive.r + baseEmissive.g + baseEmissive.b : 0
        });
      });
    } else if (Array.isArray(part.materials) && part.materials[0]?.material) {
      states.push(...part.materials);
    } else if (Array.isArray(part.materials)) {
      part.materials.forEach((material) => {
        if (!material) return;
        const baseEmissive = material.emissive ? material.emissive.clone() : null;
        states.push({
          material,
          baseColor: material.color ? material.color.clone() : null,
          baseEmissive,
          baseEmissiveIntensity: material.emissiveIntensity === undefined ? 1 : material.emissiveIntensity,
          baseEmissiveLum: baseEmissive ? baseEmissive.r + baseEmissive.g + baseEmissive.b : 0
        });
      });
    }
    return states;
  }

  function makeLabel(def) {
    const el = document.createElement("div");
    el.className = "part-label3d";
    el.dataset.part = def.id;
    el.innerHTML = `<span class="label-no">${def.number || ""}</span><span>${def.name}</span><span class="label-en">${def.en || ""}</span>`;
    const object = new CSS2DObject(el);
    object.position.fromArray(def.labelOffset || [0, 0.35, 0]);
    return { object, el };
  }

  function attachModel(model) {
    if (!model || !model.root) throw new Error("buildModel returned no model");
    modelRoot = model.root;
    scene.add(modelRoot);
    if (model.envMap) scene.environment = model.envMap;

    config.parts.forEach((def) => {
      const part = model.parts?.[def.id];
      if (!part || !part.group) return;
      const group = part.group;
      const states = normalizeMaterialStates(part);
      const basePos = group.position.clone();
      const baseQuat = group.quaternion.clone();
      const explodeQuat = baseQuat.clone().multiply(
        new T.Quaternion().setFromEuler(new T.Euler(
          def.explodeRot?.[0] || 0,
          def.explodeRot?.[1] || 0,
          def.explodeRot?.[2] || 0
        ))
      );
      const label = makeLabel(def);
      group.add(label.object);

      // Cache a group-local bounding box before any explode transform is
      // applied. The all-explode auto-fit uses it to frame the final layout.
      group.updateWorldMatrix(true, true);
      const localBox = new T.Box3().setFromObject(group);
      if (!localBox.isEmpty()) {
        localBox.applyMatrix4(group.matrixWorld.clone().invert());
      }

      const runtime = {
        def,
        group,
        states,
        basePos,
        currentPos: basePos.clone(),
        targetPos: basePos.clone(),
        baseQuat,
        currentQuat: baseQuat.clone(),
        targetQuat: baseQuat.clone(),
        explodeQuat,
        localBox,
        label: label.object,
        labelEl: label.el,
        glow: 0,
        targetGlow: 0,
        dim: 1,
        targetDim: 1,
        outline: null,
        meshCount: 0
      };
      group.traverse((object) => {
        if (!object.isMesh) return;
        runtime.meshCount++;
        object.userData.partId = def.id;
        object.castShadow = false;
        object.receiveShadow = false;
        // noPick is a priority marker, not an exclusion: glass is still in
        // the ray list and is chosen only when no normal part is behind it.
        pickables.push(object);
      });
      partMap.set(def.id, runtime);
    });

    if (!partMap.size) throw new Error("no parts registered");
    addContactShadow(modelRoot);
    // 灯效是产品级开关：只有 config.glow 显式打开的产品才收集发光材质，
    // 否则主板这类产品的 PCB 走线也会被一起改色（不真实）。
    if (config.glow === true) collectGlow();
    refreshLabels();
    setCameraImmediate(defaultView());
    broadcast();
    renderer.compile(scene, camera);
    startLoop();
  }

  /* ----------------------------------------------------------------
     04c. RGB GLOW
     灯效不是"把材质调亮"就完事：实物机箱里，灯带的颜色会溢到附近的
     金属、玻璃和内壁上。所以这里分三层来做：
       ① 材质本体：自发光材质换色 + 叠加片换色（灯的"本体"）
       ② 体积光晕：每个灯位一个加算精灵（近似 bloom，不引入后期管线）
       ③ 溢色：每个灯位一个点光源，把颜色打到周围表面
     ---------------------------------------------------------------- */
  let glowEntries = [];
  let glowLights = [];
  let glowSprites = [];
  let glowSources = [];
  let glowSpriteMap = null;
  let glowElapsed = 0;
  const glowState = { color: 0xffa04a, mode: "static", level: 0.85, hasSource: false, active: false };

  const GLOW_SOURCES_MAX = 2;

  function ensureGlowSprite() {
    if (glowSpriteMap) return glowSpriteMap;
    const surface = document.createElement("canvas");
    surface.width = surface.height = 128;
    const ctx = surface.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0.0, "rgba(255,255,255,0.92)");
    gradient.addColorStop(0.22, "rgba(255,255,255,0.34)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.1)");
    gradient.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    glowSpriteMap = new T.CanvasTexture(surface);
    glowSpriteMap.colorSpace = T.SRGBColorSpace;
    return glowSpriteMap;
  }

  function disposeGlow() {
    glowSprites.forEach((sprite) => {
      sprite.parent?.remove(sprite);
      sprite.material.dispose();
    });
    glowLights.forEach((light) => light.parent?.remove(light));
    glowSprites = [];
    glowLights = [];
    glowSources = [];
    glowEntries = [];
    glowState.hasSource = false;
  }

  function collectGlow() {
    disposeGlow();
    const center = new T.Vector3();
    const size = new T.Vector3();
    let sources = 0;

    partMap.forEach((runtime) => {
      let partHasGlow = false;
      runtime.states.forEach((state) => {
        const material = state.material;
        const isEmissive = state.baseEmissive && state.baseEmissiveLum > 0.002;
        const isAdditive = material.blending === T.AdditiveBlending && material.transparent;
        if (!isEmissive && !isAdditive) return;
        partHasGlow = true;
        glowEntries.push({
          runtime,
          state,
          kind: isEmissive ? "emissive" : "additive",
          baseEmissive: state.baseEmissive ? state.baseEmissive.clone() : null,
          baseEmissiveIntensity: state.baseEmissiveIntensity,
          baseLum: state.baseEmissiveLum,
          baseColor: state.baseColor ? state.baseColor.clone() : null,
          baseOpacity: material.opacity
        });
      });
      if (!partHasGlow || sources >= GLOW_SOURCES_MAX) return;
      if (runtime.localBox.isEmpty()) return;
      sources += 1;
      runtime.localBox.getCenter(center);
      runtime.localBox.getSize(size);
      // 只记下灯位，不立刻建光源：默认「原始」状态下不该让 4 个点光源
      // 一直参与每个材质的光照计算。
      glowSources.push({
        runtime,
        center: center.clone(),
        span: Math.max(size.x, size.y, size.z) * 1.0
      });
    });

    glowState.hasSource = glowEntries.length > 0;
    applyGlow();
  }

  /* 灯位只在真正点亮时才建，回到「原始」就拆掉 */
  function ensureGlowLights() {
    if (glowLights.length || !glowSources.length) return;
    const map = ensureGlowSprite();
    glowSources.forEach((source) => {
      const sprite = new T.Sprite(new T.SpriteMaterial({
        map,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        opacity: 0
      }));
      sprite.position.copy(source.center);
      sprite.scale.setScalar(source.span);
      source.runtime.group.add(sprite);
      glowSprites.push(sprite);

      const light = new T.PointLight(0xffffff, 0, 1.9, 2);
      light.position.copy(source.center);
      source.runtime.group.add(light);
      glowLights.push(light);
    });
  }

  function disposeGlowLights() {
    glowSprites.forEach((sprite) => {
      sprite.parent?.remove(sprite);
      sprite.material.dispose();
    });
    glowLights.forEach((light) => light.parent?.remove(light));
    glowSprites = [];
    glowLights = [];
  }

  function applyGlow(levelOverride) {
    const level = levelOverride === undefined ? glowState.level : levelOverride;
    const color = new T.Color(glowState.color);
    const touched = new Set();

    if (!glowState.active) {
      glowEntries.forEach((entry) => {
        const { state } = entry;
        if (entry.kind === "emissive") {
          if (entry.baseEmissive) state.baseEmissive.copy(entry.baseEmissive);
          state.baseEmissiveLum = entry.baseLum;
          state.baseEmissiveIntensity = entry.baseEmissiveIntensity;
        } else {
          if (entry.baseColor && state.baseColor) state.baseColor.copy(entry.baseColor);
          state.material.opacity = entry.baseOpacity;
        }
        touched.add(entry.runtime);
      });
      touched.forEach((runtime) => applyMaterials(runtime, selectedId === runtime.def.id));
      glowLights.forEach((light) => { light.intensity = 0; });
      glowSprites.forEach((sprite) => { sprite.material.opacity = 0; });
      return;
    }

    glowEntries.forEach((entry) => {
      const { state, kind } = entry;
      if (kind === "emissive") {
        state.baseEmissive.copy(color).multiplyScalar(1.5);
        state.baseEmissiveLum = Math.max(color.r + color.g + color.b, 0.002);
        state.baseEmissiveIntensity = Math.max(entry.baseEmissiveIntensity * level * 1.6, 0.02);
      } else {
        // 叠加片用"超过 1 的颜色"做灯芯：配合 ACES 压暗，中心会烧出一条亮芯，
        // 这是不引入后期泛光也能得到"发光"观感的关键
        if (state.baseColor) state.baseColor.copy(color).multiplyScalar(1.45);
        state.material.opacity = Math.min(entry.baseOpacity * (0.55 + 0.9 * level), 1);
      }
      touched.add(entry.runtime);
    });

    touched.forEach((runtime) => applyMaterials(runtime, selectedId === runtime.def.id));

    glowLights.forEach((light) => {
      light.color.copy(color);
      light.intensity = 3.4 * level * level;
    });

    glowSprites.forEach((sprite) => {
      sprite.material.color.copy(color);
      sprite.material.opacity = 0.46 * level;
    });
  }

  function setGlow(color, mode) {
    if (color === null || color === undefined) {
      // null = 回到材质原本的颜色（不是"关灯"，是"没有灯效"）
      glowState.active = false;
    } else {
      glowState.color = color;
      glowState.active = true;
      glowState.level = 0.85;
    }
    if (mode) glowState.mode = mode;
    if (glowState.active) ensureGlowLights();
    else disposeGlowLights();
    applyGlow();
    broadcast();
    return glowState.hasSource;
  }

  function glowInfo() {
    return {
      hasSource: glowState.hasSource,
      color: glowState.color,
      mode: glowState.mode,
      level: glowState.level,
      sources: glowSprites.length
    };
  }

  /* ----------------------------------------------------------------
     04b. CONTACT SHADOW
     不开 shadowMap（渲染预算），用一张跟随模型占地范围的软阴影贴片
     代替：物体有暗部支撑，装配关系才有"落地"的证据。
     ---------------------------------------------------------------- */
  let contactShadow = null;

  function disposeContactShadow() {
    if (!contactShadow) return;
    scene.remove(contactShadow);
    contactShadow.geometry.dispose();
    contactShadow.material.map?.dispose();
    contactShadow.material.dispose();
    contactShadow = null;
  }

  function addContactShadow(root) {
    disposeContactShadow();
    const box = new T.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const size = new T.Vector3();
    box.getSize(size);
    const center = new T.Vector3();
    box.getCenter(center);
    const radius = config.stage?.radius ?? 2.7;
    const span = Math.min(Math.max(size.x, size.z) * 1.2, radius * 1.7);
    if (!(span > 0)) return;

    const surface = document.createElement("canvas");
    surface.width = surface.height = 128;
    const ctx = surface.getContext("2d");
    // 乘算贴片：中心近黑、边缘纯白。白色不改变底色，黑色只压暗，
    // 因此在近乎全黑的展台上也能读出落影（叠加黑色做不出效果）。
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 63);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.45, "rgba(80,80,80,1)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new T.CanvasTexture(surface);
    texture.colorSpace = T.SRGBColorSpace;

    const plane = new T.Mesh(
      new T.PlaneGeometry(span, span),
      new T.MeshBasicMaterial({
        map: texture,
        blending: T.MultiplyBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(center.x, (config.stage?.y ?? -1.65) + 0.052, center.z);
    plane.renderOrder = 1;
    plane.name = "contact-shadow";
    scene.add(plane);
    contactShadow = plane;
  }

  /* ----------------------------------------------------------------
     05. VIEWS / FOCUS / CAMERA CHOREOGRAPHY
     ---------------------------------------------------------------- */
  function scaledView(position, target, scale = 1) {
    const t = new T.Vector3(...target);
    const p = new T.Vector3(...position);
    if (scale !== 1) p.sub(t).multiplyScalar(scale).add(t);
    return { position: p, target: t };
  }

  function defaultView() {
    let scale = 1;
    if (!config.previewMode) {
      if (isNarrow()) scale = 1.28;
      else if (isTablet()) scale = 1.04;
    }
    return scaledView(config.camera.position, config.camera.target, scale);
  }

  function explodedView() {
    const source = config.views?.exploded || {
      position: config.camera.position,
      target: config.camera.target
    };
    let scale = 1;
    if (isNarrow()) scale = 1.18;
    return scaledView(source.position, source.target, scale);
  }

  function focusView(def, runtime) {
    const focus = def.focus || {
      theta: 0.6, phi: 1.18, radius: (config.camera.position ? 6 : 5), target: [0, 0, 0]
    };
    const target = runtime.basePos.clone().add(new T.Vector3(...(focus.target || [0, 0, 0])));
    let radius = focus.radius || 5;
    if (isNarrow()) {
      radius *= 1.45;
      target.y -= radius * 0.14;
    } else if (isTablet()) {
      radius *= 1.08;
    }
    return {
      position: sphericalPosition(focus.theta, focus.phi, radius, target),
      target
    };
  }

  // Compute a camera position that frames the final exploded bounds of every
  // part. Called only from explodeAll; individual focus keeps its preset.
  function fitExplodedView() {
    if (!partMap.size) return explodedView();
    const union = new T.Box3();
    let hasBounds = false;
    partMap.forEach((runtime) => {
      if (!runtime.localBox || runtime.localBox.isEmpty()) return;
      const position = runtime.basePos.clone();
      const quaternion = runtime.baseQuat.clone();
      if (!runtime.def.fixed) {
        if (Array.isArray(runtime.def.explode)) {
          position.x += runtime.def.explode[0];
          position.y += runtime.def.explode[1];
          position.z += runtime.def.explode[2];
        } else {
          const dir = runtime.def.explodeDir || [0, 0, 0];
          const dist = runtime.def.explodeDist || 0;
          position.x += dir[0] * dist;
          position.y += dir[1] * dist;
          position.z += dir[2] * dist;
        }
        quaternion.copy(runtime.explodeQuat);
      }
      const matrix = new T.Matrix4().compose(position, quaternion, runtime.group.scale);
      const box = runtime.localBox.clone().applyMatrix4(matrix);
      if (hasBounds) union.union(box);
      else { union.copy(box); hasBounds = true; }
    });
    if (!hasBounds || union.isEmpty()) return explodedView();

    const sphere = union.getBoundingSphere(new T.Sphere());
    const preset = explodedView();
    const direction = new T.Vector3().subVectors(preset.position, preset.target);
    if (direction.lengthSq() < 1e-6) direction.set(0.6, 0.3, 1);
    direction.normalize();

    const vHalf = T.MathUtils.degToRad(camera.fov * 0.5);
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const halfFov = Math.max(0.08, Math.min(vHalf, hHalf));
    const margin = window.innerWidth > 1100 ? 1.32 : 1.16;
    const distance = clamp(sphere.radius / Math.sin(halfFov) * margin, 2.0, 46);
    return {
      position: sphere.center.clone().add(direction.multiplyScalar(distance)),
      target: sphere.center.clone()
    };
  }

  function setCameraImmediate(view) {
    camera.position.copy(view.position);
    controls.target.copy(view.target);
    camera.lookAt(controls.target);
    controls.update();
    labelsDirty = true;
  }

  function tweenCamera(view, duration = 900) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCameraImmediate(view);
      return;
    }
    cameraTween = {
      fromPos: camera.position.clone(),
      toPos: view.position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: view.target.clone(),
      start: performance.now(),
      duration
    };
    controls.enabled = false;
    controls.autoRotate = false;
  }

  function updateCameraTween(now) {
    if (!cameraTween) return;
    const t = clamp((now - cameraTween.start) / cameraTween.duration, 0, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(cameraTween.fromPos, cameraTween.toPos, e);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, e);
    camera.lookAt(controls.target);
    labelsDirty = true;
    if (t >= 1) {
      const auto = autoRotate;
      cameraTween = null;
      controls.enabled = true;
      controls.autoRotate = auto;
      controls.update();
    }
  }

  function focusPart(id) {
    const runtime = partMap.get(id);
    if (!runtime) return;
    tweenCamera(focusView(runtime.def, runtime), 880);
  }

  /* ----------------------------------------------------------------
     06. OUTLINE + MATERIAL HIGHLIGHT
     ---------------------------------------------------------------- */
  function ensureOutline(id) {
    const runtime = partMap.get(id);
    if (!runtime) return null;
    if (runtime.outline) return runtime.outline;
    const material = new T.MeshBasicMaterial({
      color: accent,
      side: T.BackSide,
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    const candidates = [];
    runtime.group.traverse((object) => {
      if (!object.isMesh || object.isInstancedMesh || object.userData.isOutline) return;
      const sourceMat = Array.isArray(object.material) ? object.material[0] : object.material;
      if (!sourceMat || sourceMat.transparent || sourceMat.map) return;
      if (!object.geometry) return;
      if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
      if (!object.geometry.boundingSphere || object.geometry.boundingSphere.radius < 0.045) return;
      candidates.push(object);
    });
    candidates.sort((a, b) => b.geometry.boundingSphere.radius - a.geometry.boundingSphere.radius);
    const meshes = [];
    candidates.slice(0, 26).forEach((source) => {
      const shell = new T.Mesh(source.geometry, material);
      shell.position.copy(source.position);
      shell.quaternion.copy(source.quaternion);
      shell.scale.copy(source.scale).multiplyScalar(1.016);
      shell.visible = false;
      shell.userData.isOutline = true;
      source.parent.add(shell);
      meshes.push(shell);
    });
    runtime.outline = { material, meshes };
    return runtime.outline;
  }

  function showOutline(id) {
    if (activeOutlineId === id) return;
    if (activeOutlineId) {
      const prev = partMap.get(activeOutlineId);
      prev?.outline?.meshes.forEach((mesh) => { mesh.visible = false; });
    }
    activeOutlineId = id;
    if (!id) return;
    const outline = ensureOutline(id);
    outline?.meshes.forEach((mesh) => { mesh.visible = true; });
  }

  function applyMaterials(runtime, selected) {
    const glow = runtime.glow;
    const dim = runtime.dim;
    const highlight = selected ? accent : secondary;
    runtime.states.forEach((state) => {
      const material = state.material;
      if (state.baseColor && material.color) {
        material.color.copy(state.baseColor).multiplyScalar(dim);
      }
      if (material.emissive) {
        if (state.baseEmissiveLum > 0.002) {
          material.emissive.copy(state.baseEmissive).lerp(highlight, glow * 0.24);
          material.emissiveIntensity = state.baseEmissiveIntensity + glow * 0.16;
        } else {
          material.emissive.copy(highlight);
          material.emissiveIntensity = glow * 0.06;
        }
      }
    });
    if (runtime.outline && activeOutlineId === runtime.def.id) {
      runtime.outline.material.opacity = glow * 0.66;
    }
  }

  function updateMaterials(dt) {
    let changed = false;
    partMap.forEach((runtime) => {
      const selected = selectedId === runtime.def.id;
      const hovered = !selectedId && hoveredId === runtime.def.id;
      const targetGlow = selected ? 1 : (hovered ? 0.5 : 0);
      const targetDim = selectedId && !selected ? 0.54 : 1;
      if (Math.abs(runtime.glow - targetGlow) < 0.0008 && Math.abs(runtime.dim - targetDim) < 0.0008) return;
      runtime.glow = damp(runtime.glow, targetGlow, 12, dt);
      runtime.dim = damp(runtime.dim, targetDim, 10, dt);
      if (Math.abs(runtime.glow - targetGlow) < 0.0008) runtime.glow = targetGlow;
      if (Math.abs(runtime.dim - targetDim) < 0.0008) runtime.dim = targetDim;
      applyMaterials(runtime, selected);
      changed = true;
    });
    return changed;
  }

  /* ----------------------------------------------------------------
     07. PART TRANSFORMS / TEARDOWN ANIMATION
     ---------------------------------------------------------------- */
  function updatePartTransforms(dt) {
    let moved = false;
    partMap.forEach((runtime) => {
      const def = runtime.def;
      const isOut = !def.fixed && removed.has(def.id);
      runtime.targetPos.copy(runtime.basePos);
      runtime.targetQuat.copy(runtime.baseQuat);
      if (isOut) {
        if (Array.isArray(def.explode)) {
          runtime.targetPos.x += def.explode[0];
          runtime.targetPos.y += def.explode[1];
          runtime.targetPos.z += def.explode[2];
        } else {
          const dir = def.explodeDir || [0, 0, 0];
          const dist = def.explodeDist || 0;
          runtime.targetPos.x += dir[0] * dist;
          runtime.targetPos.y += dir[1] * dist;
          runtime.targetPos.z += dir[2] * dist;
        }
        runtime.targetQuat.copy(runtime.explodeQuat);
      }
      const distSq = runtime.currentPos.distanceToSquared(runtime.targetPos);
      const angle = runtime.currentQuat.angleTo(runtime.targetQuat);
      if (distSq < 1e-9 && angle < 1e-6) return;
      runtime.currentPos.lerp(runtime.targetPos, 1 - Math.exp(-6.2 * dt));
      runtime.currentQuat.slerp(runtime.targetQuat, 1 - Math.exp(-5.8 * dt));
      if (distSq < 1e-7 && angle < 1e-4) {
        runtime.currentPos.copy(runtime.targetPos);
        runtime.currentQuat.copy(runtime.targetQuat);
      }
      runtime.group.position.copy(runtime.currentPos);
      runtime.group.quaternion.copy(runtime.currentQuat);
      moved = true;
    });
    if (moved) labelsDirty = true;
    return moved;
  }

  /* ----------------------------------------------------------------
     08. LABELS
     ---------------------------------------------------------------- */
  function refreshLabels() {
    let any = false;
    const allOut = config.parts.filter((p) => !p.fixed).every((p) => removed.has(p.id));
    partMap.forEach((runtime) => {
      const active = selectedId === runtime.def.id;
      const visible = selectedId
        ? active
        : (removed.has(runtime.def.id) || (allOut && runtime.def.fixed));
      runtime.labelEl.classList.toggle("is-visible", visible);
      runtime.labelEl.classList.toggle("is-active", active);
      if (visible) any = true;
    });
    labelsVisible = any;
    labelsDirty = true;
  }

  function renderLabels(now) {
    if (!labelsVisible || !labelsDirty) return;
    if (now - lastLabelRender < 32) return;
    labelRenderer.render(scene, camera);
    lastLabelRender = now;
    labelsDirty = false;
  }

  /* ----------------------------------------------------------------
     09. STATE / DEPENDENCIES / ACTIONS
     ---------------------------------------------------------------- */
  function getState() {
    return {
      selectedId,
      hoveredId,
      autoRotate,
      removed: Array.from(removed),
      explodedAll: config.parts.filter((p) => !p.fixed).every((p) => removed.has(p.id))
    };
  }

  function broadcast() {
    needsRender = true;
    const state = getState();
    listeners.forEach((fn) => fn(state));
  }

  function checkDeps(id) {
    const def = config.parts.find((p) => p.id === id);
    if (!def || !def.deps?.length) return null;
    const blocker = def.deps.find((dep) => !removed.has(dep));
    return blocker ? config.parts.find((p) => p.id === blocker) || null : null;
  }

  function togglePart(id) {
    const def = config.parts.find((p) => p.id === id);
    if (!def) return;

    if (selectedId === id) {
      if (!def.fixed) removed.delete(id);
      selectedId = null;
      showOutline(null);
      refreshLabels();
      broadcast();
      tweenCamera(defaultView(), 760);
      return;
    }

    const blocker = checkDeps(id);
    if (blocker) {
      blockListeners.forEach((fn) => fn(blocker, def));
      return;
    }

    if (!def.fixed) removed.add(id);
    selectedId = id;
    showOutline(id);
    refreshLabels();
    broadcast();
    focusPart(id);
  }

  function selectPart(id) {
    if (selectedId === id) return;
    const def = config.parts.find((p) => p.id === id);
    if (!def) return;
    if (!def.fixed && !removed.has(id)) removed.add(id);
    selectedId = id;
    showOutline(id);
    refreshLabels();
    broadcast();
    focusPart(id);
  }

  /* 只取消选中，不动已拆状态：点空白 / 按 Esc 用。
     相机保持不动——用户可能正看着拆开的状态，不该被拉回整机视角。 */
  function clearSelection() {
    if (!selectedId) return false;
    selectedId = null;
    showOutline(null);
    refreshLabels();
    broadcast();
    return true;
  }

  function explodeAll() {
    config.parts.forEach((p) => { if (!p.fixed) removed.add(p.id); });
    selectedId = null;
    showOutline(null);
    refreshLabels();
    broadcast();
    // Auto-fit is opt-in for products with large exploded spreads. This keeps
    // existing products' hand-tuned exploded camera composition untouched.
    tweenCamera(config.explodeFit ? fitExplodedView() : explodedView(), 1050);
  }

  function reset() {
    removed.clear();
    selectedId = null;
    hoveredId = null;
    showOutline(null);
    refreshLabels();
    broadcast();
    tweenCamera(defaultView(), 780);
  }

  function setAutoRotate(value) {
    autoRotate = typeof value === "boolean" ? value : !autoRotate;
    controls.autoRotate = autoRotate;
    broadcast();
  }

  function setHovered(id) {
    if (hoveredId === id) return;
    hoveredId = id;
    broadcast();
  }

  /* ----------------------------------------------------------------
     10. PICKING / POINTER
     ---------------------------------------------------------------- */
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    let fallback = null;
    for (let i = 0; i < hits.length; i++) {
      const object = hits[i].object;
      const id = object?.userData?.partId;
      if (!id) continue;
      // Transparent cover glass and similar noPick meshes are low-priority:
      // first look for a normal part behind the glass, otherwise select glass.
      if (!object.userData.noPick) return id;
      if (!fallback) fallback = id;
    }
    return fallback;
  }

  function onPointerMove(event) {
    if (config.previewMode) return;
    if (event.buttons !== 0) {
      if (hoveredId) {
        setHovered(null);
        hoverListeners.forEach((fn) => fn(null, event));
      }
      return;
    }
    const now = performance.now();
    if (now - lastPick < 30) return;
    lastPick = now;
    const id = pick(event.clientX, event.clientY);
    if (id !== hoveredId) {
      setHovered(id);
      hoverListeners.forEach((fn) => fn(id, event));
    } else if (id) {
      hoverListeners.forEach((fn) => fn(id, event));
    }
  }

  function onPointerDown(event) {
    pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
  }

  function onPointerUp(event) {
    if (config.previewMode) {
      pointerDown = null;
      return;
    }
    if (!pointerDown) return;
    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    const duration = performance.now() - pointerDown.time;
    pointerDown = null;
    if (dx * dx + dy * dy > 36 || duration > 700) return;
    const id = pick(event.clientX, event.clientY);
    if (id) togglePart(id);
    else clearSelection();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", () => {
    if (hoveredId) {
      setHovered(null);
      hoverListeners.forEach((fn) => fn(null));
    }
    pointerDown = null;
  });

  /* ----------------------------------------------------------------
     11. RESIZE / RENDER LOOP
     ---------------------------------------------------------------- */
  function updateFov() {
    camera.fov = config.previewMode
      ? (config.camera.fov || 34)
      : (viewWidth() < (config.camera.narrowBreak || 820)
        ? (config.camera.fovNarrow || 42)
        : (viewWidth() < 1180 ? (config.camera.fovTablet || config.camera.fov) : config.camera.fov));
    camera.updateProjectionMatrix();
  }

  function resize() {
    const width = viewWidth();
    const height = viewHeight();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * qualityScale);
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
    camera.aspect = width / height;
    updateFov();
    labelsDirty = true;
    needsRender = true;
  }
  window.addEventListener("resize", resize);
  updateFov();

  let lastTime = performance.now();

  /* 帧耗时滑窗：只做两件事——给 getStats 报告，以及驱动自适应分辨率。
     取最近 45 帧的中位数而不是均值，避免一次 GC/切窗把画质永久拉低。 */
  const frameWindow = [];
  let frameCount = 0;
  let renderCount = 0;
  function frameMs() {
    if (!frameWindow.length) return 0;
    const sorted = frameWindow.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  /* 按需渲染：静止时（无相机变化、无部件动画、无呼吸灯）不调用 render。
     436 个 draw call 每帧都在提交，静止时省下的是整帧的 CPU+GPU。 */
  let needsRender = true;
  const lastCamPos = new T.Vector3(Infinity, Infinity, Infinity);
  const lastCamQuat = new T.Quaternion();

  function requestRender() {
    needsRender = true;
  }

  function loop(now) {
    if (disposed) return;
    frameId = requestAnimationFrame(loop);
    const rawDt = now - lastTime;
    const dt = Math.min(0.08, Math.max(0.0001, rawDt / 1000));
    lastTime = now;
    frameCount += 1;
    if (rawDt > 0 && rawDt < 400) {
      frameWindow.push(rawDt);
      if (frameWindow.length > 45) frameWindow.shift();
    }
    const tweening = !!cameraTween;
    if (cameraTween) updateCameraTween(now);
    else controls.update();
    const partsMoved = updatePartTransforms(dt);
    const materialsChanged = updateMaterials(dt);
    const breathing = glowState.mode === "breath" && glowState.hasSource;
    if (breathing) {
      glowElapsed += dt;
      applyGlow(glowState.level * (0.55 + 0.45 * Math.sin(glowElapsed * 2.1)));
    }
    adaptQuality(now);
    renderLabels(now);

    const cameraMoved = camera.position.distanceToSquared(lastCamPos) > 1e-10
      || 1 - Math.abs(camera.quaternion.dot(lastCamQuat)) > 1e-12;
    if (!needsRender && !partsMoved && !materialsChanged && !breathing && !cameraMoved && !tweening) {
      return;
    }
    needsRender = false;
    renderCount += 1;
    lastCamPos.copy(camera.position);
    lastCamQuat.copy(camera.quaternion);
    renderer.render(scene, camera);
  }

  /* ----------------------------------------------------------------
     10b. ADAPTIVE QUALITY
     集成显卡 + 12 个光源 + 物理玻璃，最容易被压垮的是填充率。
     这里按帧耗时滑窗降/升像素比：慢了先降分辨率（视觉代价最小），
     快了再慢慢加回来，避免一次性砍画质。
     ---------------------------------------------------------------- */
  let qualityScale = 1;
  let lastQualityAt = 0;

  function basePixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  function applyPixelRatio() {
    renderer.setPixelRatio(basePixelRatio() * qualityScale);
    renderer.setSize(viewWidth(), viewHeight(), false);
  }

  function adaptQuality(now) {
    if (frameWindow.length < 30 || now - lastQualityAt < 1200) return;
    const ms = frameMs();
    if (ms <= 0) return;
    if (ms > 24 && qualityScale > 0.55) {
      qualityScale = Math.max(0.55, qualityScale - 0.15);
      lastQualityAt = now;
      applyPixelRatio();
    } else if (ms < 11 && qualityScale < 1) {
      qualityScale = Math.min(1, qualityScale + 0.15);
      lastQualityAt = now;
      applyPixelRatio();
    } else {
      lastQualityAt = now;
    }
  }

  function startLoop() {
    if (!frameId) frameId = requestAnimationFrame(loop);
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    controls.dispose();
    disposeContactShadow();
    disposeGlow();
    renderer.dispose();
    labelRenderer.domElement.remove();
  }

  /* ----------------------------------------------------------------
     12. PUBLIC API
     ---------------------------------------------------------------- */
  return {
    getRenderer: () => renderer,
    getScene: () => scene,
    getCamera: () => camera,
    getControls: () => controls,
    setStageVisible: (visible) => {
      if (stageGroup) stageGroup.visible = !!visible;
    },
    getState,
    getPart: (id) => partMap.get(id),
    getModel: () => modelRoot,
    getStats: () => {
      let lights = 0;
      scene.traverse((object) => { if (object.isLight) lights += 1; });
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        programs: renderer.info.programs?.length ?? 0,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        lights,
        frames: frameCount,
        renders: renderCount,
        frameMs: Math.round(frameMs() * 10) / 10,
        pixelRatio: Math.round(renderer.getPixelRatio() * 100) / 100,
        size: { width: viewWidth(), height: viewHeight() }
      };
    },
    checkDeps,
    attachModel,
    togglePart,
    selectPart,
    clearSelection,
    setGlow,
    glowInfo,
    explodeAll,
    reset,
    setAutoRotate,
    setHovered,
    focusPart,
    focusCamera: focusPart,
    resize,
    dispose,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    onHover: (fn) => { hoverListeners.add(fn); return () => hoverListeners.delete(fn); },
    onBlocked: (fn) => { blockListeners.add(fn); return () => blockListeners.delete(fn); }
  };
}















