/* ==================================================================
   PRODUCT LOADER
   Registry lookup, config loading, model construction and mounting.
   Product-specific procedural builders live in models/*.js and are
   referenced by config.buildModel. Data-only configs can use the
   built-in primitive geometry factory below.
   ================================================================== */
import { products, getConfig } from "../configs/index.js";
import { createEngine } from "./engine.js";
import { createUI } from "./ui.js";

const { THREE: T } = window.ATX_LIB;

/* ----------------------------------------------------------------
   01. GENERIC GEOMETRY FACTORY
   boxes / cylinders / spheres / planes / tori / compound groups.
   This is the extension path for products that only need config data.
   ---------------------------------------------------------------- */
function makeMaterial(spec, fallbackColor) {
  if (!spec) return new T.MeshStandardMaterial({ color: fallbackColor, roughness: 0.5, metalness: 0.4 });
  if (spec.isMaterial) return spec;
  return new T.MeshStandardMaterial({
    color: spec.color ?? fallbackColor,
    roughness: spec.roughness ?? 0.5,
    metalness: spec.metalness ?? 0.4,
    emissive: spec.emissive ?? 0x000000,
    emissiveIntensity: spec.emissiveIntensity ?? 1,
    transparent: spec.transparent ?? false,
    opacity: spec.opacity ?? 1
  });
}

function createGeometry(spec) {
  if (!spec) return null;
  const type = spec.type || "box";
  if (type === "box") {
    const [w, h, d] = spec.size || spec.args || [1, 1, 1];
    return new T.BoxGeometry(w, h, d, spec.segments?.[0] || 1, spec.segments?.[1] || 1, spec.segments?.[2] || 1);
  }
  if (type === "cylinder") {
    const [rt, rb, h, seg] = spec.args || [spec.radiusTop ?? 0.5, spec.radiusBottom ?? 0.5, spec.height ?? 1, spec.segments ?? 24];
    return new T.CylinderGeometry(rt, rb, h, Math.min(seg || 24, 32), 1, false);
  }
  if (type === "sphere") {
    const [r, ws, hs] = spec.args || [spec.radius ?? 0.5, spec.widthSegments ?? 24, spec.heightSegments ?? 16];
    return new T.SphereGeometry(r, Math.min(ws || 24, 32), Math.min(hs || 16, 32));
  }
  if (type === "plane") {
    const [w, h] = spec.size || spec.args || [1, 1];
    return new T.PlaneGeometry(w, h);
  }
  if (type === "torus") {
    const [r, tube, rs, ts] = spec.args || [spec.radius ?? 0.5, spec.tube ?? 0.1, spec.radialSegments ?? 8, spec.tubularSegments ?? 32];
    return new T.TorusGeometry(r, tube, Math.min(rs || 8, 16), Math.min(ts || 32, 32));
  }
  return null;
}

function addPrimitive(parent, spec, fallbackColor) {
  if (!spec) return;
  if (spec.type === "compound") {
    const group = new T.Group();
    if (spec.position) group.position.fromArray(spec.position);
    if (spec.rotation) group.rotation.fromArray(spec.rotation);
    if (spec.scale) group.scale.fromArray(spec.scale);
    (spec.children || []).forEach((child) => addPrimitive(group, child, fallbackColor));
    parent.add(group);
    return group;
  }
  const geometry = createGeometry(spec);
  if (!geometry) return null;
  const material = makeMaterial(spec.material, fallbackColor);
  const mesh = new T.Mesh(geometry, material);
  if (spec.position) mesh.position.fromArray(spec.position);
  if (spec.rotation) mesh.rotation.fromArray(spec.rotation);
  if (spec.scale) mesh.scale.fromArray(spec.scale);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function buildGenericModel(config) {
  const root = new T.Group();
  root.name = config.id;
  const parts = {};
  const pickables = [];

  config.parts.forEach((def) => {
    const group = new T.Group();
    group.position.fromArray(def.position || [0, 0, 0]);
    const spec = def.geometry || { type: "box", size: [0.4, 0.4, 0.4], material: { color: 0x8a949a } };
    addPrimitive(group, spec, 0x8a949a);
    const materialState = [];
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.userData.partId = def.id;
      pickables.push(object);
      const material = Array.isArray(object.material) ? object.material[0] : object.material;
      if (!material) return;
      materialState.push({
        material,
        baseColor: material.color ? material.color.clone() : null,
        baseEmissive: material.emissive ? material.emissive.clone() : null,
        baseEmissiveIntensity: material.emissiveIntensity ?? 1,
        baseEmissiveLum: material.emissive ? material.emissive.r + material.emissive.g + material.emissive.b : 0
      });
    });
    parts[def.id] = {
      group,
      materials: Array.from(new Set(materialState.map((s) => s.material))),
      materialState: materialState.map((s) => ({
        color: s.baseColor,
        emissive: s.baseEmissive,
        emissiveIntensity: s.baseEmissiveIntensity
      }))
    };
    root.add(group);
  });

  return { root, parts, pickables, envMap: null };
}

/* ----------------------------------------------------------------
   02. MODEL BUILDER
   ---------------------------------------------------------------- */
export async function buildModel(config, renderer) {
  // Complex procedural products expose a global model factory. The factory
  // contract is { build(renderer) -> { root, parts, pickables, envMap } }.
  // This keeps product configs pure data while preserving the original
  // high-detail models from both standalone pages.
  if (config.model) {
    const factory = window[config.model];
    if (!factory || typeof factory.build !== "function") {
      throw new Error(`模型工厂未加载：${config.model}`);
    }
    return factory.build(renderer);
  }
  return buildGenericModel(config);
}

/* ----------------------------------------------------------------
   03. PRODUCT BOOTSTRAP
   ---------------------------------------------------------------- */
export async function loadProduct(rawId) {
  const id = rawId || "motherboard";
  const product = products.find((p) => p.id === id);
  if (!product) throw new Error(`未知产品：${id}`);

  const config = await getConfig(id);
  if (!config) throw new Error(`未找到产品配置：${id}`);

  const canvas = document.getElementById("scene-canvas");
  if (!canvas) throw new Error("缺少 #scene-canvas");

  const engine = createEngine(config, canvas);
  const model = await buildModel(config, engine.getRenderer());
  engine.attachModel(model);
  const ui = createUI(config, engine);

  // 性能排查用：?stats 时在右上角显示帧率/绘制调用，正常访问零开销
  if (new URLSearchParams(location.search).has("stats")) {
    window.__ATX_STATS__ = () => engine.getStats();
    mountStatsBadge(engine);
  }

  return { config, engine, model, ui };
}

function mountStatsBadge(engine) {
  const badge = document.createElement("div");
  badge.style.cssText = [
    "position:fixed", "top:10px", "right:12px", "z-index:9999",
    "padding:6px 9px", "border:1px solid rgba(95,231,255,.35)",
    "background:rgba(4,10,13,.92)", "color:#9fe8ff",
    "font:11px/1.5 ui-monospace,Consolas,monospace",
    "letter-spacing:.02em", "white-space:pre", "pointer-events:none"
  ].join(";");
  document.body.appendChild(badge);

  let lastFrames = 0;
  let lastAt = performance.now();
  let fps = 0;
  window.setInterval(() => {
    const stats = engine.getStats();
    const now = performance.now();
    const dt = (now - lastAt) / 1000;
    if (dt > 0.4) {
      fps = (stats.frames - lastFrames) / dt;
      lastFrames = stats.frames;
      lastAt = now;
    }
    badge.textContent =
      `${fps.toFixed(0)} fps  ${stats.frameMs.toFixed(1)}ms\n` +
      `calls ${stats.calls}  tris ${(stats.triangles / 1000).toFixed(0)}k\n` +
      `lights ${stats.lights}  dpr ${stats.pixelRatio}\n` +
      `renders ${stats.renders}/${stats.frames}`;
    document.title = "STATS " + JSON.stringify(stats);
  }, 500);
}

