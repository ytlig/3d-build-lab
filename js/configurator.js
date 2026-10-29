/* ==================================================================
   BUILD CONFIGURATOR / L2
   配件数据读取、品类/型号选择、配置单与 18 项兼容性检查。
   机箱 + 主板 + 散热器 + 显卡通过共享 engine.js 提供 L2 装配预览。
   ================================================================== */
import { createEngine } from "./engine.js";
import { createGpuPreview } from "../models/gpu-preview.js";
import { createCasePreview } from "../models/case-preview.js";
import { createMotherboardPreview } from "../models/motherboard-preview.js";
import { createCoolerPreview } from "../models/cooler-preview.js";
import { createPsuPreview } from "../models/psu-preview.js";
import { createMemoryPreview } from "../models/memory-preview.js";
import { createCaseFanPreview } from "../models/casefan-preview.js";

const T = window.ATX_LIB.THREE;

/* ----------------------------------------------------------------
   01. 品类元数据
   ---------------------------------------------------------------- */
const CATEGORIES = [
  {
    id: "gpu",
    label: "显卡",
    en: "GRAPHICS",
    file: "data/components/gpu.json",
    keys: ["显存", "功耗", "长度"],
    hint: "选择显卡后，系统会比对机箱限长与整机供电需求。"
  },
  {
    id: "cpu",
    label: "CPU",
    en: "PROCESSOR",
    file: "data/components/cpu.json",
    keys: ["核心/线程", "频率", "插槽"],
    hint: "CPU 插槽必须与主板插槽一致。"
  },
  {
    id: "motherboard",
    label: "主板",
    en: "MOTHERBOARD",
    file: "data/components/motherboard.json",
    keys: ["插槽", "内存", "板型"],
    hint: "主板插槽决定可安装的 CPU 平台。"
  },
  {
    id: "cooler",
    label: "散热器",
    en: "COOLER",
    file: "data/components/cooler.json",
    keys: ["类型", "高度", "风扇数"],
    hint: "散热器高度需要小于机箱限高，否则侧板无法盖上。"
  },
  {
    id: "memory",
    label: "内存",
    en: "MEMORY",
    file: "data/components/memory.json",
    keys: ["类型", "容量", "频率"],
    hint: "内存会加入配置单；内存高度参与散热器避让检查。"
  },
  {
    id: "storage",
    label: "存储",
    en: "STORAGE",
    file: "data/components/storage.json",
    keys: ["接口", "容量", "协议"],
    hint: "M.2 需要主板有空闲 M.2 插槽；SATA 需要主板 SATA 接口。"
  },
  {
    id: "psu",
    label: "电源",
    en: "POWER",
    file: "data/components/psu.json",
    keys: ["额定功率", "认证", "规范"],
    hint: "电源额定功率需覆盖 (CPU + 显卡功耗) × 1.3。"
  },
  {
    id: "casefan",
    label: "机箱风扇",
    en: "CASE FANS",
    file: "data/components/casefan.json",
    keys: ["尺寸", "数量", "RGB"],
    hint: "风扇会按位置装入机箱前部、顶部或后部；RGB 以发光材质显示。"
  },
  {
    id: "case",
    label: "机箱",
    en: "CASE",
    file: "data/components/case.json",
    keys: ["板型", "显卡限长", "风扇位"],
    hint: "机箱显卡限长与散热器限高会参与装配检查。"
  }
];

const CATEGORY_MAP = new Map(CATEGORIES.map((category, index) => [category.id, { ...category, index }]));

const CARD_SPEC_KEYS = {
  gpu: ["显存", "功耗", "长度"],
  cpu: ["核心/线程", "功耗", "插槽"],
  motherboard: ["插槽", "板型", "内存"],
  cooler: ["类型", "高度", "支持平台"],
  memory: ["类型", "容量", "频率"],
  storage: ["接口", "容量", "协议"],
  psu: ["额定功率", "认证", "规范"],
  casefan: ["尺寸", "数量", "位置"],
  case: ["板型", "显卡限长", "风扇位"]
};

/* ----------------------------------------------------------------
   02. 页面状态与 DOM
   ---------------------------------------------------------------- */
const state = {
  active: "gpu",
  selected: Object.fromEntries(CATEGORIES.map((category) => [category.id, null])),
  data: Object.fromEntries(CATEGORIES.map((category) => [category.id, []])),
  presets: [],
  radiatorPosition: ""
};

const dom = {
  presetStrip: document.getElementById("preset-strip"),
  presetList: document.getElementById("preset-list"),
  presetUndo: document.getElementById("preset-undo"),
  customTrigger: document.getElementById("custom-part-trigger"),
  customDialog: document.getElementById("custom-part-dialog"),
  customForm: document.getElementById("custom-part-form"),
  customFields: document.getElementById("custom-fields"),
  customError: document.getElementById("custom-form-error"),
  customCancel: document.getElementById("custom-cancel"),
  previewCustomNote: document.getElementById("preview-custom-note"),
  savedConfigButton: document.getElementById("saved-config-button"),
  savedConfigDialog: document.getElementById("saved-config-dialog"),
  savedConfigClose: document.getElementById("saved-config-close"),
  savedConfigSave: document.getElementById("saved-config-save"),
  savedConfigExport: document.getElementById("saved-config-export"),
  savedConfigImport: document.getElementById("saved-config-import"),
  savedConfigFile: document.getElementById("saved-config-file"),
  savedConfigList: document.getElementById("saved-config-list"),
  savedConfigCount: document.getElementById("saved-config-count"),
  compareDialog: document.getElementById("compare-dialog"),
  compareSummary: document.getElementById("compare-summary"),
  compareBody: document.getElementById("compare-body"),
  compareClose: document.getElementById("compare-close"),
  shareChoiceDialog: document.getElementById("share-choice-dialog"),
  shareChoiceCopy: document.getElementById("share-choice-copy"),
  shareChoiceCancel: document.getElementById("share-choice-cancel"),
  categoryList: document.getElementById("category-list"),
  categoryCount: document.getElementById("category-count"),
  categoryTitle: document.getElementById("category-title"),
  catalogCount: document.getElementById("catalog-count"),
  catalogSub: document.getElementById("catalog-sub"),
  catalogSearch: document.getElementById("catalog-search"),
  catalogCompatible: document.getElementById("catalog-compatible"),
  catalogSort: document.getElementById("catalog-sort"),
  catalogReset: document.getElementById("catalog-reset"),
  compatTopCounts: document.getElementById("compat-top-counts"),
  modelGrid: document.getElementById("model-grid"),
  loading: document.getElementById("loading-state"),
  empty: document.getElementById("empty-state"),
  selectionList: document.getElementById("selection-list"),
  selectedCount: document.getElementById("selected-count"),
  totalPrice: document.getElementById("total-price"),
  clearBuild: document.getElementById("clear-build"),
  buildUndo: document.getElementById("build-undo"),
  compatState: document.getElementById("compat-state"),
  compatOverall: document.getElementById("compat-overall"),
  compatList: document.getElementById("compat-list"),
  compatToggle: document.getElementById("compat-toggle"),
  toast: document.getElementById("config-toast"),
  toastText: document.getElementById("config-toast-text"),
  previewPanel: document.getElementById("gpu-preview-panel"),
  previewStage: document.getElementById("gpu-preview-stage"),
  previewCanvas: document.getElementById("gpu-preview-canvas"),
  previewEmpty: document.getElementById("gpu-preview-empty"),
  previewState: document.getElementById("preview-state"),
  previewName: document.getElementById("preview-gpu-name"),
  previewBrand: document.getElementById("preview-gpu-brand"),
  previewLength: document.getElementById("preview-length"),
  previewThickness: document.getElementById("preview-thickness"),
  previewFans: document.getElementById("preview-fans"),
  previewBackplate: document.getElementById("preview-backplate"),
  previewCaseName: document.getElementById("preview-case-name"),
  previewCaseMeta: document.getElementById("preview-case-meta"),
  previewMbMeta: document.getElementById("preview-mb-meta"),
  previewFit: document.getElementById("preview-fit"),
  previewFitState: document.getElementById("preview-fit-state"),
  previewFitDetail: document.getElementById("preview-fit-detail"),
  previewCoolerName: document.getElementById("preview-cooler-name"),
  previewCoolerMeta: document.getElementById("preview-cooler-meta"),
  previewCoolerFit: document.getElementById("preview-cooler-fit"),
  previewCoolerFitState: document.getElementById("preview-cooler-fit-state"),
  previewCoolerFitDetail: document.getElementById("preview-cooler-fit-detail"),
  previewPsuMeta: document.getElementById("preview-psu-meta"),
  previewMemoryMeta: document.getElementById("preview-memory-meta"),
  previewStorageMeta: document.getElementById("preview-storage-meta"),
  previewFansMeta: document.getElementById("preview-fans-meta"),
  previewCablesMeta: document.getElementById("preview-cables-meta"),
  previewJump: document.getElementById("preview-jump"),
  copyShare: document.getElementById("copy-share"),
  copyExport: document.getElementById("copy-export"),
  buildSaveState: document.getElementById("build-save-state")
};

let toastTimer = 0;
let toastTone = "warning";
let compatExpanded = false;
let presetUndoState = null;
let presetUndoTimer = 0;
let customCategoryId = "gpu";
let editingCustomId = null;
let catalogFilter = { query: "", compatibleOnly: false, sort: "default" };
let clearUndoState = null;
let clearUndoTimer = 0;
let pendingCustomDelete = "";
let pendingCustomDeleteTimer = 0;

const STORAGE_KEY = "atx-configurator-build-v1";
const CUSTOM_STORAGE_KEY = "atx-configurator-custom-parts-v1";
const SAVED_CONFIG_STORAGE_KEY = "atx-configurator-saved-configs-v1";
const SHARE_VERSION = 1;
const SHARE_MAX_CUSTOM = 20;
const SHARE_MAX_DEFINITION_CHARS = 12000;
const SHARE_MAX_URL_CHARS = 16000;
const FIDELITY_LABELS = {
  exact: "尺寸精确",
  proportional: "比例示意"
};

function fidelityOf(part) {
  return part?.fidelity === "exact" ? "exact" : "proportional";
}

function fidelityLabel(part) {
  return FIDELITY_LABELS[fidelityOf(part)];
}

const CUSTOM_FIELDS = {
  gpu: [
    { key: "name", label: "名称", type: "text", required: true, placeholder: "例如 GeForce RTX 5090" },
    { key: "length", label: "长度 (mm)", type: "number", min: 1, step: 1 },
    { key: "thickness", label: "厚度 (槽)", type: "number", min: 0.1, step: 0.1 },
    { key: "powerWatt", label: "功耗 (W)", type: "number", min: 1, step: 1 },
    { key: "pcie8", label: "PCIe 8pin 数量", type: "number", min: 0, step: 1 },
    { key: "requires12vhpwr", label: "需要 12VHPWR", type: "select", options: [["", "未知"], ["yes", "是"], ["no", "否"]] }
  ],
  cpu: [
    { key: "name", label: "名称", type: "text", required: true, placeholder: "例如 Ryzen 7 9800X3D" },
    { key: "socket", label: "插槽", type: "text", placeholder: "例如 AM5 / LGA1700" },
    { key: "powerWatt", label: "功耗 (W)", type: "number", min: 1, step: 1 }
  ],
  motherboard: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "formFactor", label: "板型", type: "select", options: [["", "未知"], ["ATX", "ATX"], ["M-ATX", "M-ATX"], ["ITX", "ITX"], ["E-ATX", "E-ATX"]] },
    { key: "memoryType", label: "内存类型", type: "select", options: [["", "未知"], ["DDR5", "DDR5"], ["DDR4", "DDR4"]] },
    { key: "socket", label: "插槽", type: "text", placeholder: "例如 AM5 / LGA1700" },
    { key: "m2Slots", label: "M.2 数量", type: "number", min: 0, step: 1 },
    { key: "m2Key", label: "M.2 key", type: "select", options: [["", "未知"], ["M", "M key"], ["B", "B key"]] },
    { key: "m2Lengths", label: "M.2 长度支持", type: "checks", options: [["2242", "2242"], ["2260", "2260"], ["2280", "2280"], ["22110", "22110"]] },
    { key: "sataPorts", label: "SATA 数量", type: "number", min: 0, step: 1 }
  ],
  cooler: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "type", label: "类型", type: "select", options: [["", "未知"], ["air", "风冷"], ["liquid", "水冷"]] },
    { key: "height", label: "高度 (mm)", type: "number", min: 1, step: 1 },
    { key: "radiatorSize", label: "冷排规格", type: "select", options: [["", "未知"], ["0", "无 / 风冷"], ["240", "240"], ["280", "280"], ["360", "360"]] },
    { key: "radiatorThickness", label: "冷排厚度 (mm)", type: "number", min: 0, step: 1 },
    { key: "radiatorFanThickness", label: "冷排风扇厚度 (mm)", type: "number", min: 0, step: 1 },
    { key: "socket", label: "支持插槽", type: "checks", options: [["LGA1700", "LGA1700"], ["LGA1200", "LGA1200"], ["LGA115x", "LGA115x"], ["AM5", "AM5"], ["AM4", "AM4"]] },
    { key: "memoryClearance", label: "内存避让高度 (mm)", type: "number", min: 0, step: 1 }
  ],
  memory: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "memoryType", label: "类型", type: "select", options: [["", "未知"], ["DDR5", "DDR5"], ["DDR4", "DDR4"]] },
    { key: "capacityGB", label: "容量 (GB)", type: "number", min: 1, step: 1 },
    { key: "height", label: "马甲高度 (mm)", type: "number", min: 1, step: 1 }
  ],
  psu: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "wattage", label: "额定功率 (W)", type: "number", min: 1, step: 1 },
    { key: "length", label: "长度 (mm)", type: "number", min: 1, step: 1 },
    { key: "connectors12vhpwr", label: "12VHPWR 数量", type: "number", min: 0, step: 1 },
    { key: "connectorsPcie8", label: "PCIe 8pin 数量", type: "number", min: 0, step: 1 }
  ],
  case: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "formFactors", label: "支持板型", type: "checks", options: [["E-ATX", "E-ATX"], ["ATX", "ATX"], ["M-ATX", "M-ATX"], ["ITX", "ITX"]] },
    { key: "maxGpuLength", label: "显卡限长 (mm)", type: "number", min: 1, step: 1 },
    { key: "maxGpuThickness", label: "显卡限厚 (槽)", type: "number", min: 0.1, step: 0.1 },
    { key: "maxCoolerHeight", label: "散热限高 (mm)", type: "number", min: 1, step: 1 },
    { key: "maxRadiatorThickness", label: "冷排空间 (mm)", type: "number", min: 1, step: 1 },
    { key: "maxPsuLength", label: "电源限长 (mm)", type: "number", min: 1, step: 1 },
    { key: "radiatorPositions", label: "冷排位", type: "checks", options: [["front", "前部"], ["top", "顶部"], ["side", "侧面"]] },
    { key: "radiatorSizes", label: "冷排规格支持", type: "checks", options: [["240", "240"], ["280", "280"], ["360", "360"]] },
    { key: "fanFront", label: "前部风扇位", type: "number", min: 0, step: 1 },
    { key: "fanTop", label: "顶部风扇位", type: "number", min: 0, step: 1 },
    { key: "fanRear", label: "后部风扇位", type: "number", min: 0, step: 1 },
    { key: "fanSizes", label: "风扇尺寸支持", type: "checks", options: [["120", "120mm"], ["140", "140mm"]] }
  ],
  storage: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "interface", label: "类型", type: "select", options: [["", "未知"], ["M.2", "M.2"], ["SATA", "SATA"]] },
    { key: "length", label: "长度 (mm)", type: "number", min: 1, step: 1 },
    { key: "m2Length", label: "M.2 长度规格", type: "select", options: [["", "未知"], ["2242", "2242"], ["2260", "2260"], ["2280", "2280"], ["22110", "22110"]] },
    { key: "m2Key", label: "M.2 key", type: "select", options: [["", "未知"], ["M", "M key"], ["B", "B key"]] },
    { key: "protocol", label: "协议", type: "text", placeholder: "例如 PCIe 4.0 x4 / SATA III" }
  ],
  casefan: [
    { key: "name", label: "名称", type: "text", required: true },
    { key: "size", label: "尺寸", type: "select", options: [["", "未知"], ["120", "120mm"], ["140", "140mm"]] },
    { key: "quantity", label: "数量", type: "number", min: 1, step: 1 },
    { key: "positions", label: "安装位置", type: "checks", options: [["front", "前部"], ["top", "顶部"], ["rear", "后部"]] }
  ]
};

const CUSTOM_FIELD_LABELS = Object.fromEntries(
  Object.entries(CUSTOM_FIELDS).map(([category, fields]) => [
    category,
    Object.fromEntries(fields.map((field) => [field.key, field.label]))
  ])
);

/* ----------------------------------------------------------------
   01b. 机箱 / 显卡装配预览 / 复用共享 engine
   ---------------------------------------------------------------- */
const PREVIEW_CONFIG = {
  id: "assembly-preview",
  previewMode: true,
  viewportElement: "#gpu-preview-stage",
  parts: [
    {
      id: "assemblyPreview",
      number: "01",
      name: "机箱/显卡装配预览",
      en: "ASSEMBLY PREVIEW",
      fixed: true,
      deps: [],
      position: [0, 0, 0],
      explode: [0, 0, 0],
      explodeRot: [0, 0, 0],
      labelOffset: [0, 0.6, 0],
      focus: { theta: 0.68, phi: 1.18, radius: 4, target: [0, 0.04, 0] }
    }
  ],
  camera: {
    position: [3.2, 2.3, 4.4],
    target: [0, 0.04, 0],
    fov: 34,
    fovTablet: 34,
    fovNarrow: 34,
    narrowBreak: 0
  },
  views: {
    exploded: { position: [3.2, 2.3, 4.4], target: [0, 0.04, 0] }
  },
  render: { exposure: 1.34 },
  stage: { radius: 2.2, y: -0.68, accent: 0xffb15a, secondary: 0x5fe7ff },
  lights: [
    { type: "hemisphere", sky: 0xc4ebf2, ground: 0x060908, intensity: 1.3 },
    { type: "directional", color: 0x9fe8ff, intensity: 0.9, position: [-3.2, 3.2, -6.2] },
    { type: "directional", color: 0xfff0df, intensity: 3.2, position: [4.2, 5.6, 4.8] },
    { type: "directional", color: 0x72e4f5, intensity: 1.55, position: [-4.5, 2.2, 3.6] },
    { type: "directional", color: 0xe4f7fa, intensity: 1.45, position: [0.2, 1.2, 5.5] },
    { type: "point", color: 0xffb15a, intensity: 1.35, distance: 10, decay: 2, position: [2.4, 0.6, 2.4] }
  ]
};

let previewEngine = null;
let previewPartGroup = null;
let previewContent = null;
let previewEnvironment = null;
let previewKey = "";
let previewFit = null;

function previewRefsReady() {
  return !!(dom.previewStage && dom.previewCanvas && dom.previewPanel);
}

function createPreviewEnvironment(renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#020607");
  gradient.addColorStop(0.4, "#0a1b21");
  gradient.addColorStop(0.58, "#152c34");
  gradient.addColorStop(0.78, "#03080a");
  gradient.addColorStop(1, "#010304");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  const softbox = (x, y, rx, ry, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, color);
    g.addColorStop(0.45, "rgba(130,190,205,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.fillRect(x - Math.max(rx, ry), y - Math.max(rx, ry), Math.max(rx, ry) * 2, Math.max(rx, ry) * 2);
    ctx.restore();
  };
  softbox(180, 90, 160, 210, "rgba(214,245,250,0.75)");
  softbox(760, 110, 200, 100, "rgba(140,210,226,0.45)");
  softbox(520, 300, 300, 46, "rgba(255,214,170,0.38)");
  softbox(950, 260, 90, 180, "rgba(255,150,75,0.4)");
  const texture = new T.CanvasTexture(canvas);
  texture.mapping = T.EquirectangularReflectionMapping;
  texture.colorSpace = T.SRGBColorSpace;
  const pmrem = new T.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return envMap;
}

function ensurePreviewEngine() {
  if (previewEngine || !previewRefsReady()) return;
  previewPartGroup = new T.Group();
  previewContent = new T.Group();
  previewPartGroup.add(previewContent);
  const root = new T.Group();
  root.add(previewPartGroup);
  previewEngine = createEngine(PREVIEW_CONFIG, dom.previewCanvas);
  if (!previewEnvironment) {
    // 共用摄影棚环境（矩形柔光箱）；顺带修掉每次重建都新建一张 PMREM 的泄漏
    previewEnvironment = window.ATX_ENV?.createEnvironment?.(previewEngine.getRenderer(), 4)
      || createPreviewEnvironment(previewEngine.getRenderer());
  }
  previewEngine.attachModel({
    root,
    parts: {
      assemblyPreview: { group: previewPartGroup, materials: [] }
    },
    pickables: [],
    envMap: previewEnvironment
  });
}

function disposePreviewContent() {
  if (!previewContent) return;
  [...previewContent.children].forEach((child) => {
    previewContent.remove(child);
    child.traverse((object) => {
      if (!object.isMesh && !object.isLine) return;
      if (object.geometry) object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!material) return;
        if (material.map) material.map.dispose();
        material.dispose();
      });
    });
  });
}

function fitPreviewCamera() {
  if (!previewEngine || !previewFit) return;
  const camera = previewEngine.getCamera();
  const controls = previewEngine.getControls();
  const vHalf = T.MathUtils.degToRad(camera.fov * 0.5);
  const tanHalf = Math.max(0.001, Math.tan(vHalf));
  let target;
  let theta;
  let phi;
  let radius;

  if (previewFit.kind === "gpu") {
    const meta = previewFit.meta;
    target = new T.Vector3(0, 0.04, 0);
    theta = 0.58;
    phi = 1.2;
    const radiusByWidth = (meta.length * 1.18) / (2 * tanHalf * Math.max(0.4, camera.aspect));
    const radiusByHeight = (meta.height * 1.8) / (2 * tanHalf);
    radius = Math.max(2.0, radiusByWidth, radiusByHeight);
  } else if (previewFit.kind === "box") {
    const box = previewFit.box;
    const center = box.getCenter(new T.Vector3());
    const size = box.getSize(new T.Vector3());
    target = center;
    theta = 0.68;
    phi = 1.18;
    const sphere = 0.5 * Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
    const hHalf = Math.atan(tanHalf * Math.max(0.4, camera.aspect));
    const minHalf = Math.min(vHalf, Math.max(0.01, hHalf));
    radius = Math.max(2.2, (sphere / Math.sin(minHalf)) * 1.12);
  } else {
    const meta = previewFit.meta;
    const minX = -meta.length / 2;
    const maxX = Math.max(meta.length / 2, previewFit.extraMaxX || -Infinity);
    const minZ = -meta.width / 2;
    const maxZ = Math.max(meta.width / 2, previewFit.extraMaxZ || -Infinity);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const halfX = Math.max(0.1, (maxX - minX) / 2);
    const halfY = Math.max(0.1, meta.height / 2);
    const halfZ = Math.max(0.1, (maxZ - minZ) / 2);
    target = new T.Vector3(centerX, 0.02, centerZ);
    theta = 0.72;
    phi = 1.18;
    const sphere = Math.sqrt(halfX * halfX + halfY * halfY + halfZ * halfZ);
    const hHalf = Math.atan(tanHalf * Math.max(0.4, camera.aspect));
    const minHalf = Math.min(vHalf, Math.max(0.01, hHalf));
    radius = Math.max(2.2, (sphere / Math.sin(minHalf)) * 1.08);
  }

  const sinPhi = Math.sin(phi);
  camera.position.set(
    target.x + radius * sinPhi * Math.sin(theta),
    target.y + radius * Math.cos(phi),
    target.z + radius * sinPhi * Math.cos(theta)
  );
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();
}

function formatOver(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}mm`;
}

function coolerTypeLabel(type) {
  if (type === "liquid") return "水冷";
  if (type === "low-profile") return "下压";
  return "塔式";
}

function setFitBlock(block, stateEl, detailEl, tone, stateText, detailText) {
  block.classList.remove("is-fit", "is-over", "is-idle");
  block.classList.add(tone);
  stateEl.textContent = stateText;
  detailEl.textContent = detailText;
}

function setPreviewInfo(mode, gpu, pcCase, motherboard, cooler, memory, psu, casefan, gpuMeta, caseMeta, mbMeta, coolerMeta, memoryMeta, psuMeta, fanMeta, gpuOverBy, coolerOverBy, complete) {
  // GPU half of the side panel.
  if (gpu) {
    dom.previewName.textContent = gpu.name;
    dom.previewBrand.textContent = `${gpu.brand || "—"} / ${gpu.specs?.显存 || "PARAMETRIC GPU"}`;
    dom.previewLength.textContent = `${gpu.modelParams?.length ?? "—"}mm`;
    dom.previewThickness.textContent = gpuMeta ? `${gpuMeta.thickness} slot` : "—";
    dom.previewFans.textContent = gpuMeta ? `${gpuMeta.fanCount} fan${gpuMeta.fanCount > 1 ? "s" : ""}` : "—";
    dom.previewBackplate.textContent = gpuMeta ? (gpuMeta.hasBackplate ? "有 / YES" : "无 / NO") : "—";
  } else {
    dom.previewName.textContent = "未选择显卡";
    dom.previewBrand.textContent = "选择显卡后生成参数化模型";
    dom.previewLength.textContent = "—";
    dom.previewThickness.textContent = "—";
    dom.previewFans.textContent = "—";
    dom.previewBackplate.textContent = "—";
  }

  // Case + board metadata.
  if (pcCase && caseMeta) {
    dom.previewCaseName.textContent = pcCase.name;
    dom.previewCaseMeta.textContent = `${caseMeta.tierLabel} · ${caseMeta.depthMm} × ${caseMeta.widthMm} × ${caseMeta.heightMm}mm · 显卡限长 ${caseMeta.maxGpuMm}mm / 散热限高 ${caseMeta.maxCoolerMm}mm`;
  } else {
    dom.previewCaseName.textContent = "未选择机箱";
    dom.previewCaseMeta.textContent = "选择机箱后可检查显卡长度与散热器限高";
  }
  dom.previewMbMeta.textContent = motherboard && mbMeta
    ? `主板：${motherboard.name} · ${mbMeta.formFactor} ${Math.round(mbMeta.length * 100)} × ${Math.round(mbMeta.height * 100)}mm`
    : "主板：未选择";

  if (cooler && coolerMeta) {
    const radiatorSize = Number(cooler.modelParams?.radiatorSize || 0);
    dom.previewCoolerName.textContent = cooler.name;
    dom.previewCoolerMeta.textContent = `${coolerTypeLabel(coolerMeta.type)}${radiatorSize > 0 ? ` · ${radiatorSize} 冷排` : ""} · ${formatOver(coolerMeta.heightMm)} · ${coolerMeta.fanCount} fan${coolerMeta.fanCount === 1 ? "" : "s"}`;
  } else {
    dom.previewCoolerName.textContent = "未选择散热器";
    dom.previewCoolerMeta.textContent = "选择散热器后检查机箱限高";
  }

  dom.previewPsuMeta.textContent = psu && psuMeta
    ? `电源：${psu.name} · ${psuMeta.length * 100}×${psuMeta.width * 100}×${psuMeta.height * 100}mm`
    : "电源：未选择";
  dom.previewMemoryMeta.textContent = memory && memoryMeta
    ? `内存：${memory.name} · ${memoryMeta.populated} 条 · 马甲 ${memoryMeta.heightMm}mm · ${memoryMeta.hasRgb ? "RGB" : "无灯"}`
    : "内存：未选择";
  const storage = selectedPart("storage");
  if (dom.previewStorageMeta) {
    dom.previewStorageMeta.textContent = storage
      ? `存储：${storage.name} · ${storage.compat?.interface || "—"} · ${storage.specs?.容量 || "—"}`
      : "存储：未选择";
  }
  dom.previewFansMeta.textContent = casefan && fanMeta
    ? `机箱风扇：${casefan.name} · ${fanMeta.count} 把 · ${fanMeta.meta?.sizeMm || "—"}mm · ${fanMeta.hasRgb ? "RGB 亮起" : "无 RGB"}`
    : "机箱风扇：未选择";

  dom.previewState.classList.remove("is-live", "is-fit", "is-over");
  dom.previewFit.classList.remove("is-fit", "is-over", "is-idle");
  dom.previewCoolerFit.classList.remove("is-fit", "is-over", "is-idle");

  if (mode === "none") {
    dom.previewState.textContent = "未选择";
    setFitBlock(dom.previewFit, dom.previewFitState, dom.previewFitDetail, "is-idle", "等待装配", "同时选择机箱与显卡进入装配检查。");
    setFitBlock(dom.previewCoolerFit, dom.previewCoolerFitState, dom.previewCoolerFitDetail, "is-idle", "无散热器", "散热器高度必须小于机箱限高。");
    dom.previewJump.hidden = true;
    return;
  }

  dom.previewState.classList.add("is-live");
  dom.previewJump.hidden = false;

  const gpuCheck = !!(gpu && pcCase);
  const coolerCheck = !!(cooler && pcCase);
  let anyOver = false;

  if (gpuCheck) {
    const gpuMm = Number(gpu.modelParams?.length || 0);
    const maxMm = Number(caseMeta?.maxGpuMm || 0);
    if (gpuOverBy > 0) {
      anyOver = true;
      setFitBlock(
        dom.previewFit,
        dom.previewFitState,
        dom.previewFitDetail,
        "is-over",
        `超出 ${formatOver(gpuOverBy * 100)} / OVER`,
        `显卡长 ${formatOver(gpuMm)}，机箱限长 ${formatOver(maxMm)}，红色部分为超出长度。`
      );
    } else {
      setFitBlock(
        dom.previewFit,
        dom.previewFitState,
        dom.previewFitDetail,
        "is-fit",
        "装得下 / FIT",
        `显卡长 ${formatOver(gpuMm)} ≤ 机箱限长 ${formatOver(maxMm)}，完整位于机箱内。`
      );
    }
  } else if (gpu && !pcCase) {
    setFitBlock(dom.previewFit, dom.previewFitState, dom.previewFitDetail, "is-idle", "单卡预览", "选择机箱后进入装配长度检查。");
  } else {
    setFitBlock(dom.previewFit, dom.previewFitState, dom.previewFitDetail, "is-idle", "无显卡", "选择显卡后检查长度。");
  }

  if (coolerCheck) {
    const heightMm = Number(cooler.modelParams?.height ?? cooler.compat?.height ?? 0);
    const maxMm = Number(caseMeta?.maxCoolerMm || 0);
    if (coolerOverBy > 0) {
      anyOver = true;
      setFitBlock(
        dom.previewCoolerFit,
        dom.previewCoolerFitState,
        dom.previewCoolerFitDetail,
        "is-over",
        `超高 ${formatOver(coolerOverBy * 100)} / OVER`,
        `散热器高 ${formatOver(heightMm)}，机箱限高 ${formatOver(maxMm)}，盖不上侧板。`
      );
    } else {
      setFitBlock(
        dom.previewCoolerFit,
        dom.previewCoolerFitState,
        dom.previewCoolerFitDetail,
        "is-fit",
        "高度通过 / FIT",
        `散热器高 ${formatOver(heightMm)} ≤ 机箱限高 ${formatOver(maxMm)}，可以盖上侧板。`
      );
    }
  } else if (cooler && !pcCase) {
    setFitBlock(
      dom.previewCoolerFit,
      dom.previewCoolerFitState,
      dom.previewCoolerFitDetail,
      "is-idle",
      "高度预览",
      `散热器高 ${formatOver(Number(cooler.modelParams?.height || 0))}，选择机箱后检查限高。`
    );
  } else {
    setFitBlock(dom.previewCoolerFit, dom.previewCoolerFitState, dom.previewCoolerFitDetail, "is-idle", "无散热器", "选择散热器后检查高度。");
  }

  if (mode === "gpu") {
    dom.previewState.textContent = "单卡预览";
  } else if (mode === "case") {
    dom.previewState.textContent = "空机箱";
  } else if (mode === "component") {
    dom.previewState.textContent = "部件预览";
  } else {
    dom.previewState.textContent = complete ? "整机装配" : "装配中";
    if (anyOver) dom.previewState.classList.add("is-over");
    else if (gpuCheck || coolerCheck) dom.previewState.classList.add("is-fit");
  }
}

function gpuStatusMaterial(color, opacity) {
  return new T.MeshBasicMaterial({
    color,
    toneMapped: false,
    transparent: true,
    opacity,
    depthWrite: false
  });
}

function addGpuStatus(content, caseMeta, gpuMeta, gpuLength, gpuY, gpuZ, overBy) {
  const fits = overBy <= 0;
  const statusColor = fits ? 0x7ce7b5 : 0xff5f4d;
  const status = new T.Group();

  // Vertical limit marker at the advertised maximum GPU length.
  const limitGeo = new T.BoxGeometry(0.02, gpuMeta.height + 0.12, gpuMeta.depth + 0.08);
  const limit = new T.Mesh(limitGeo, gpuStatusMaterial(statusColor, 0.38));
  limit.position.set(caseMeta.gpuMount.limitX, gpuY, gpuZ);
  status.add(limit);
  const limitEdges = new T.LineSegments(
    new T.EdgesGeometry(limitGeo),
    new T.LineBasicMaterial({ color: statusColor, toneMapped: false, transparent: true, opacity: 0.95 })
  );
  limitEdges.position.copy(limit.position);
  status.add(limitEdges);

  if (fits) {
    const rail = new T.Mesh(
      new T.BoxGeometry(gpuLength, 0.012, 0.012),
      gpuStatusMaterial(statusColor, 0.85)
    );
    rail.position.set(caseMeta.gpuMount.rearX + gpuLength / 2, gpuY - gpuMeta.height / 2 - 0.03, gpuZ + gpuMeta.depth / 2 + 0.005);
    status.add(rail);
  } else {
    const visualOver = Math.max(overBy, 0.055);
    const overGeo = new T.BoxGeometry(visualOver, gpuMeta.height + 0.06, gpuMeta.depth + 0.06);
    const overBox = new T.Mesh(overGeo, gpuStatusMaterial(statusColor, 0.2));
    overBox.material.side = T.DoubleSide;
    overBox.position.set(caseMeta.gpuMount.limitX + visualOver / 2, gpuY, gpuZ);
    status.add(overBox);
    const overEdges = new T.LineSegments(
      new T.EdgesGeometry(overGeo),
      new T.LineBasicMaterial({ color: statusColor, toneMapped: false, transparent: true, opacity: 0.95 })
    );
    overEdges.position.copy(overBox.position);
    status.add(overEdges);
  }
  content.add(status);
}

function addCoolerStatus(content, coolerMeta, coolerX, coolerY, baseZ, maxCoolerMm, overBy) {
  const fits = overBy <= 0;
  const statusColor = fits ? 0x7ce7b5 : 0xff5f4d;
  const status = new T.Group();
  const limitZ = baseZ + maxCoolerMm / 100;
  const topZ = baseZ + coolerMeta.height;
  const width = 0.58;
  const height = 0.62;

  // Height limit plane crossing the cooler footprint.
  const limitGeo = new T.BoxGeometry(width, height, 0.018);
  const limit = new T.Mesh(limitGeo, gpuStatusMaterial(statusColor, 0.32));
  limit.position.set(coolerX, coolerY, limitZ);
  status.add(limit);
  const limitEdges = new T.LineSegments(
    new T.EdgesGeometry(limitGeo),
    new T.LineBasicMaterial({ color: statusColor, toneMapped: false, transparent: true, opacity: 0.95 })
  );
  limitEdges.position.copy(limit.position);
  status.add(limitEdges);

  if (fits) {
    const topFrame = new T.LineSegments(
      new T.EdgesGeometry(new T.BoxGeometry(width, height, 0.012)),
      new T.LineBasicMaterial({ color: statusColor, toneMapped: false, transparent: true, opacity: 0.9 })
    );
    topFrame.position.set(coolerX, coolerY, topZ);
    status.add(topFrame);
  } else {
    const visualOver = Math.max(overBy, 0.055);
    const overGeo = new T.BoxGeometry(width, height, visualOver);
    const overBox = new T.Mesh(overGeo, gpuStatusMaterial(statusColor, 0.2));
    overBox.material.side = T.DoubleSide;
    overBox.position.set(coolerX, coolerY, limitZ + visualOver / 2);
    status.add(overBox);
    const overEdges = new T.LineSegments(
      new T.EdgesGeometry(overGeo),
      new T.LineBasicMaterial({ color: statusColor, toneMapped: false, transparent: true, opacity: 0.95 })
    );
    overEdges.position.copy(overBox.position);
    status.add(overEdges);
  }
  content.add(status);
}

function addCable(content, start, end, radius, color) {
  const p1 = start.clone().add(new T.Vector3(0, 0.18, 0));
  const p2 = start.clone().lerp(end, 0.52).add(new T.Vector3(0, 0.24, 0));
  const p3 = end.clone().add(new T.Vector3(0, 0.12, 0));
  const curve = new T.CatmullRomCurve3([start.clone(), p1, p2, p3, end.clone()]);
  const geometry = new T.TubeGeometry(curve, 24, radius, 6, false);
  const mesh = new T.Mesh(geometry, new T.MeshStandardMaterial({
    color,
    metalness: 0.18,
    roughness: 0.62
  }));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  content.add(mesh);
}

function addCaseFans(content, caseMeta, fan) {
  const params = fan.modelParams || {};
  const positions = Array.isArray(params.positions) && params.positions.length
    ? params.positions
    : ["front"];
  const groups = { front: [], top: [], rear: [] };
  positions.forEach((position) => {
    if (groups[position]) groups[position].push(position);
    else groups.front.push(position);
  });

  let meta = null;
  let count = 0;

  const makeFan = (position, index, total) => {
    const fanPreview = createCaseFanPreview(fan);
    meta = fanPreview.meta;
    const size = fanPreview.meta.size;
    const fanGroup = fanPreview.group;
    if (position === "front") {
      const spacing = size * 1.08;
      fanGroup.rotation.y = Math.PI / 2;
      fanGroup.position.set(
        caseMeta.length / 2 - 0.18,
        caseMeta.height * 0.04 + (index - (total - 1) / 2) * spacing,
        0
      );
    } else if (position === "top") {
      const spacing = size * 1.08;
      fanGroup.rotation.x = -Math.PI / 2;
      fanGroup.position.set(
        (index - (total - 1) / 2) * spacing,
        caseMeta.height / 2 - 0.18,
        0
      );
    } else {
      fanGroup.rotation.y = Math.PI / 2;
      fanGroup.position.set(-caseMeta.length / 2 + 0.18, caseMeta.height * 0.20, 0);
    }
    content.add(fanGroup);
    count += 1;
  };

  groups.front.forEach((position, index) => makeFan(position, index, groups.front.length));
  groups.top.forEach((position, index) => makeFan(position, index, groups.top.length));
  groups.rear.forEach((position, index) => makeFan(position, index, groups.rear.length));

  if (params.hasRgb) {
    const rgbLight = new T.PointLight(0x4fe6ff, 2.0, 4.6, 2);
    rgbLight.position.set(caseMeta.length / 2 - 0.55, 0, 0.25);
    content.add(rgbLight);
    const pinkLight = new T.PointLight(0xff5fa8, 1.1, 3.4, 2);
    pinkLight.position.set(caseMeta.length / 2 - 0.45, caseMeta.height * 0.22, -0.2);
    content.add(pinkLight);
  }

  return { count, hasRgb: !!params.hasRgb, meta };
}

function addOverallStatus(content, caseMeta, fits) {
  const statusColor = fits ? 0x7ce7b5 : 0xff5f4d;
  const status = new T.Group();
  const beaconMat = new T.MeshBasicMaterial({
    color: statusColor,
    toneMapped: false,
    transparent: true,
    opacity: 0.98
  });

  const beacon = new T.Mesh(new T.BoxGeometry(0.018, 0.24, 0.018), beaconMat);
  beacon.position.set(caseMeta.length / 2 + 0.002, 0, caseMeta.width / 2 - 0.035);
  status.add(beacon);

  const topBar = new T.Mesh(
    new T.BoxGeometry(0.026, 0.024, caseMeta.width * 0.56),
    beaconMat
  );
  topBar.position.set(caseMeta.length / 2 + 0.014, caseMeta.height / 2 - 0.04, 0);
  status.add(topBar);
  content.add(status);
}

function updateAssemblyPreview(gpu, pcCase, motherboard, cooler, memory, psu, casefan) {
  if (!previewRefsReady()) return;
  let mode;
  if (pcCase) mode = (gpu || motherboard || cooler || memory || psu || casefan) ? "assembly" : "case";
  else if (gpu && !motherboard && !cooler && !memory && !psu && !casefan) mode = "gpu";
  else if (gpu || motherboard || cooler) mode = "component";
  else mode = "none";

  const key = `${mode}:${gpu?.id || ""}:${pcCase?.id || ""}:${motherboard?.id || ""}:${cooler?.id || ""}:${memory?.id || ""}:${selectedPart("storage")?.id || ""}:${psu?.id || ""}:${casefan?.id || ""}`;
  if (key === previewKey && previewEngine) return;

  if (mode === "none") {
    if (previewEngine) disposePreviewContent();
    previewKey = key;
    previewFit = null;
    dom.previewStage.classList.remove("has-model");
    dom.previewStage.dataset.mode = "none";
    dom.previewStage.dataset.fit = "idle";
    dom.previewStage.dataset.gpu = "";
    dom.previewStage.dataset.case = "";
    dom.previewStage.dataset.mb = "";
    dom.previewStage.dataset.cooler = "";
    dom.previewStage.dataset.psu = "";
    dom.previewStage.dataset.memory = "";
    dom.previewStage.dataset.casefan = "";
    dom.previewStage.dataset.full = "empty";
    dom.previewStage.dataset.cables = "0";
    dom.previewStage.dataset.over = "0";
    dom.previewStage.dataset.gpuLength = "0";
    dom.previewStage.dataset.coolerHeight = "0";
    dom.previewCablesMeta.textContent = "走线：未连接";
    setPreviewInfo("none", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, false);
    return;
  }

  ensurePreviewEngine();
  if (!previewEngine || !previewContent) return;
  previewKey = key;
  disposePreviewContent();

  let casePreview = null;
  let mbPreview = null;
  let gpuPreview = null;
  let coolerPreview = null;
  let psuPreview = null;
  let memoryPreview = null;
  let fanResult = null;
  let gpuLength = 0;
  let gpuOverBy = 0;
  let coolerOverBy = 0;
  let gpuY = 0;
  let gpuZ = 0;
  let coolerX = 0;
  let coolerY = 0;
  let coolerBaseZ = 0;
  let boardFront = 0;
  let cableCount = 0;

  if (pcCase) {
    casePreview = createCasePreview(pcCase, {
      showMotherboardPlaceholder: !motherboard,
      showPsuPlaceholder: !psu
    });
    previewContent.add(casePreview.group);
  }

  if (motherboard) {
    mbPreview = createMotherboardPreview(motherboard);
    if (casePreview) {
      const mount = casePreview.meta.gpuMount;
      mbPreview.group.position.set(0, mount.y, casePreview.meta.boardZ);
    } else {
      mbPreview.group.position.set(0, 0, 0);
    }
    previewContent.add(mbPreview.group);
    boardFront = mbPreview.group.position.z + mbPreview.meta.thickness / 2;
  }

  if (gpu) {
    gpuPreview = createGpuPreview(gpu);
    gpuLength = Number(gpu.modelParams?.length) / 100 || gpuPreview.meta.length;
    if (casePreview) {
      const mount = casePreview.meta.gpuMount;
      gpuY = mount.y;
      gpuZ = mbPreview ? boardFront + 0.045 + gpuPreview.meta.depth / 2 : mount.z;
      gpuPreview.group.position.set(mount.rearX + gpuLength / 2, gpuY, gpuZ);
      gpuOverBy = Math.max(0, gpuLength - casePreview.meta.maxGpuLength);
    } else if (mbPreview) {
      gpuY = 0;
      gpuZ = boardFront + 0.045 + gpuPreview.meta.depth / 2;
      gpuPreview.group.position.set(-mbPreview.meta.length / 2 + 0.1 + gpuLength / 2, 0, gpuZ);
    } else {
      gpuPreview.group.position.set(0, 0, 0);
    }
    previewContent.add(gpuPreview.group);
  }

  if (cooler) {
    coolerPreview = createCoolerPreview(cooler);
    if (mbPreview) {
      coolerX = mbPreview.group.position.x + mbPreview.meta.cpu.x;
      coolerY = mbPreview.group.position.y + mbPreview.meta.cpu.y;
      coolerBaseZ = boardFront + 0.005;
    } else if (casePreview) {
      // Without a selected board, mount the height-check model over the
      // case's placeholder CPU area.
      coolerX = -casePreview.meta.length * 0.05;
      coolerY = casePreview.meta.gpuMount.y + 0.55;
      coolerBaseZ = casePreview.meta.boardZ + 0.03;
    } else {
      coolerX = 0;
      coolerY = gpuPreview ? 0.65 : 0;
      coolerBaseZ = 0.005;
    }
    coolerPreview.group.position.set(coolerX, coolerY, coolerBaseZ);
    previewContent.add(coolerPreview.group);
    if (casePreview && casePreview.meta.maxCoolerMm > 0) {
      coolerOverBy = Math.max(0, coolerPreview.meta.height - casePreview.meta.maxCoolerMm / 100);
    }
  }

  if (pcCase && psu) {
    psuPreview = createPsuPreview(psu);
    const psuX = -casePreview.meta.length / 2 + psuPreview.meta.length / 2 + 0.06;
    const psuY = -casePreview.meta.height / 2 + psuPreview.meta.height / 2 + 0.04;
    const psuZ = -casePreview.meta.width * 0.12;
    psuPreview.group.position.set(psuX, psuY, psuZ);
    previewContent.add(psuPreview.group);
  }

  if (mbPreview && memory) {
    memoryPreview = createMemoryPreview(memory, mbPreview.meta.ramSlots);
    memoryPreview.group.position.copy(mbPreview.group.position);
    previewContent.add(memoryPreview.group);
  }

  if (casePreview && casefan) {
    fanResult = addCaseFans(previewContent, casePreview.meta, casefan);
  }

  // Routing: 24-pin / CPU 8-pin / GPU power from the PSU to the components.
  if (casePreview && psuPreview) {
    const psuOrigin = psuPreview.group.position;
    if (mbPreview) {
      const mbOrigin = mbPreview.group.position;
      const atxStart = psuOrigin.clone().add(new T.Vector3(
        psuPreview.meta.connectors.atx24.x,
        psuPreview.meta.connectors.atx24.y,
        psuPreview.meta.connectors.atx24.z
      ));
      const atxEnd = mbOrigin.clone().add(new T.Vector3(
        mbPreview.meta.connectors.atx24.x,
        mbPreview.meta.connectors.atx24.y,
        mbPreview.meta.connectors.atx24.z
      ));
      addCable(previewContent, atxStart, atxEnd, 0.032, 0x1a2226);
      cableCount += 1;
      const cpuStart = psuOrigin.clone().add(new T.Vector3(
        psuPreview.meta.connectors.cpu8.x,
        psuPreview.meta.connectors.cpu8.y,
        psuPreview.meta.connectors.cpu8.z
      ));
      const cpuEnd = mbOrigin.clone().add(new T.Vector3(
        mbPreview.meta.connectors.cpu8.x,
        mbPreview.meta.connectors.cpu8.y,
        mbPreview.meta.connectors.cpu8.z
      ));
      addCable(previewContent, cpuStart, cpuEnd, 0.024, 0x222b30);
      cableCount += 1;
    }
    if (gpuPreview) {
      const gpuStart = psuOrigin.clone().add(new T.Vector3(
        psuPreview.meta.connectors.pcie.x,
        psuPreview.meta.connectors.pcie.y,
        psuPreview.meta.connectors.pcie.z
      ));
      const gpuEnd = gpuPreview.group.position.clone().add(new T.Vector3(
        gpuPreview.meta.power.x,
        gpuPreview.meta.power.y,
        gpuPreview.meta.power.z
      ));
      addCable(previewContent, gpuStart, gpuEnd, 0.028, 0x0e1418);
      cableCount += 1;
    }
  }

  // Show the physical PCIe connection when the card is mounted on a board.
  if (mbPreview && gpuPreview) {
    const connector = new T.Mesh(
      new T.BoxGeometry(0.34, 0.052, 0.035),
      new T.MeshStandardMaterial({ color: 0x2b363a, metalness: 0.65, roughness: 0.32 })
    );
    connector.position.set(0, gpuY, boardFront + 0.012);
    connector.castShadow = false;
    connector.receiveShadow = false;
    previewContent.add(connector);
    const gold = new T.Mesh(
      new T.BoxGeometry(0.31, 0.014, 0.012),
      new T.MeshBasicMaterial({ color: 0xc6a15b, toneMapped: false })
    );
    gold.position.set(0, gpuY, boardFront + 0.03);
    previewContent.add(gold);
  }

  if (casePreview) {
    if (gpuPreview) {
      addGpuStatus(previewContent, casePreview.meta, gpuPreview.meta, gpuLength, gpuY, gpuZ, gpuOverBy);
    }
    if (coolerPreview) {
      addCoolerStatus(
        previewContent,
        coolerPreview.meta,
        coolerX,
        coolerY,
        coolerBaseZ,
        casePreview.meta.maxCoolerMm,
        coolerOverBy
      );
    }
    const checks = [];
    if (gpuPreview) checks.push(gpuOverBy <= 0);
    if (coolerPreview) checks.push(coolerOverBy <= 0);
    if (checks.length) addOverallStatus(previewContent, casePreview.meta, checks.every(Boolean));
  }

  if (casePreview) {
    previewFit = {
      kind: "case",
      meta: casePreview.meta,
      extraMaxX: Math.max(
        casePreview.meta.length / 2,
        gpuPreview ? gpuPreview.group.position.x + gpuLength / 2 : -Infinity
      ),
      extraMaxZ: Math.max(
        casePreview.meta.width / 2,
        coolerPreview ? coolerBaseZ + coolerPreview.meta.height : -Infinity
      )
    };
  } else if (mbPreview || coolerPreview) {
    const box = new T.Box3().setFromObject(previewContent);
    previewFit = { kind: "box", box };
  } else if (gpuPreview) {
    previewFit = { kind: "gpu", meta: gpuPreview.meta };
  } else {
    previewFit = null;
  }

  const gpuFits = gpuOverBy <= 0;
  const coolerFits = coolerOverBy <= 0;
  const overallFits = (!gpuPreview || gpuFits) && (!coolerPreview || coolerFits);
  const complete = !!(
    pcCase &&
    gpu &&
    motherboard &&
    cooler &&
    memory &&
    psu &&
    casefan &&
    selectedPart("cpu") &&
    selectedPart("storage")
  );
  dom.previewStage.classList.add("has-model");
  dom.previewStage.dataset.mode = mode;
  dom.previewStage.dataset.gpu = gpu?.id || "";
  dom.previewStage.dataset.case = pcCase?.id || "";
  dom.previewStage.dataset.mb = motherboard?.id || "";
  dom.previewStage.dataset.cooler = cooler?.id || "";
  dom.previewStage.dataset.psu = psu?.id || "";
  dom.previewStage.dataset.memory = memory?.id || "";
  dom.previewStage.dataset.casefan = casefan?.id || "";
  dom.previewStage.dataset.full = complete ? "full" : "partial";
  dom.previewStage.dataset.cables = String(cableCount);
  dom.previewStage.dataset.gpuMount = gpuPreview
    ? (mbPreview ? "motherboard" : (casePreview ? "case" : "standalone"))
    : "none";
  dom.previewStage.dataset.fit = mode === "assembly" && (gpuPreview || coolerPreview)
    ? (overallFits ? "fit" : "over")
    : "idle";
  dom.previewStage.dataset.gpuFit = gpuPreview && pcCase ? (gpuFits ? "fit" : "over") : "idle";
  dom.previewStage.dataset.coolerFit = coolerPreview && pcCase ? (coolerFits ? "fit" : "over") : "idle";
  dom.previewStage.dataset.over = String(gpuOverBy);
  dom.previewStage.dataset.coolerOver = String(coolerOverBy);
  dom.previewStage.dataset.gpuLength = String(gpuLength);
  dom.previewStage.dataset.coolerHeight = String(coolerPreview?.meta.height || 0);
  setPreviewInfo(
    mode,
    gpu,
    pcCase,
    motherboard,
    cooler,
    memory,
    psu,
    casefan,
    gpuPreview?.meta,
    casePreview?.meta,
    mbPreview?.meta,
    coolerPreview?.meta,
    memoryPreview?.meta,
    psuPreview?.meta,
    fanResult,
    gpuOverBy,
    coolerOverBy,
    complete
  );
  dom.previewCablesMeta.textContent = cableCount
    ? `走线：${cableCount} 条 · 24pin / 8pin / GPU`
    : "走线：未连接";
  previewEngine.setStageVisible(mode === "gpu");
  previewEngine.resize();
  fitPreviewCamera();
}

/* ----------------------------------------------------------------
   03. 小工具
   ---------------------------------------------------------------- */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priceText(value) {
  const number = Number(value || 0);
  return number > 0 ? `¥ ${number.toLocaleString("zh-CN")}` : "—";
}

function selectedPart(categoryId) {
  return state.selected[categoryId] || null;
}

function selectedCount() {
  return Object.values(state.selected).filter(Boolean).length;
}

function totalPrice() {
  return Object.values(state.selected).reduce((sum, part) => sum + Number(part?.price || 0), 0);
}

function categoryMeta(categoryId) {
  return CATEGORY_MAP.get(categoryId) || CATEGORIES[0];
}

function specValue(part, key) {
  return part?.specs?.[key] ?? "—";
}

function formatMm(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number % 1 === 0 ? number.toFixed(0) : number.toFixed(1)}mm` : "—";
}

const PSU_TIERS = [450, 550, 650, 750, 850, 1000, 1200, 1600];

function suggestedPsuWattage(requiredWatt) {
  return PSU_TIERS.find((value) => value >= requiredWatt) || Math.ceil(requiredWatt / 100) * 100;
}

function socketOf(part) {
  return part?.compat?.socket ? String(part.compat.socket).toUpperCase() : "";
}

function alternativeParts(categoryId, predicate, excludeId) {
  return (state.data[categoryId] || [])
    .filter((part) => part.id !== excludeId && predicate(part))
    .slice(0, 2);
}

function suggestionText(primary, secondary, fallback = "") {
  const names = (parts) => parts.map((part) => part.name).join(" / ");
  const clauses = [];
  if (primary.length) clauses.push(`可换：${names(primary)}`);
  if (secondary.length) clauses.push(`或换：${names(secondary)}`);
  return clauses.length ? ` ${clauses.join("；")}。` : (fallback ? ` ${fallback}` : "");
}

function caseFormFactors(part) {
  return Array.isArray(part?.compat?.supportedFormFactors)
    ? part.compat.supportedFormFactors
    : [];
}

function slotText(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number % 1 === 0 ? number.toFixed(0) : number.toFixed(1)} 槽` : "—";
}

/* Return a conflict object when selecting `part` under `categoryId` would
   mismatched the already-selected CPU or motherboard socket. */
function partWouldFail(categoryId, part) {
  if (socketConflictFor(categoryId, part)) return true;
  const previous = state.selected[categoryId];
  state.selected[categoryId] = part;
  try {
    return compatibilityChecks().some(
      (check) => check.status === "fail" && (check.affected || []).includes(categoryId)
    );
  } finally {
    state.selected[categoryId] = previous;
  }
}

function socketConflictFor(categoryId, part) {
  if (categoryId !== "cpu" && categoryId !== "motherboard") return null;
  const counterpartId = categoryId === "cpu" ? "motherboard" : "cpu";
  const counterpart = selectedPart(counterpartId);
  if (!counterpart) return null;
  const newSocket = socketOf(part);
  const oldSocket = socketOf(counterpart);
  if (!newSocket || !oldSocket || newSocket === oldSocket) return null;
  return {
    categoryId,
    counterpartId,
    counterpart,
    newSocket,
    oldSocket,
    message: categoryId === "cpu"
      ? `插槽不兼容：已选主板 ${counterpart.name}（${oldSocket}），无法加入 ${part.name}（${newSocket}）。请先取消主板选择。`
      : `插槽不兼容：已选 CPU ${counterpart.name}（${oldSocket}），无法加入 ${part.name}（${newSocket}）。请先取消 CPU 选择。`
  };
}

function showToast(message, tone = "warning") {
  if (!dom.toast || !dom.toastText) return;
  const visible = dom.toast.classList.contains("is-visible");
  // A transient success message must not erase a visible compatibility error.
  if (visible && toastTone === "warning" && tone === "success") return;
  toastTone = tone;
  dom.toast.dataset.tone = tone;
  dom.toastText.textContent = message;
  dom.toast.classList.remove("is-success");
  if (tone === "success") dom.toast.classList.add("is-success");
  dom.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
    toastTone = "warning";
  }, 3600);
}

/* ----------------------------------------------------------------
   03b. 本机保存 / 分享链接 / 文字导出
   ---------------------------------------------------------------- */
function selectionMap() {
  const selected = {};
  CATEGORIES.forEach((category) => {
    selected[category.id] = selectedPart(category.id)?.id || null;
  });
  return selected;
}

function saveTimeText(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateSaveState(text, saved = false) {
  if (!dom.buildSaveState) return;
  dom.buildSaveState.textContent = text;
  dom.buildSaveState.classList.toggle("is-saved", saved);
}

function persistBuild() {
  try {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      selected: selectionMap(),
      radiatorPosition: state.radiatorPosition || ""
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    updateSaveState(`已自动保存 · ${saveTimeText(payload.savedAt)}`, true);
  } catch (error) {
    updateSaveState("本机保存不可用", false);
  }
}

function readStoredBuild() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== 1 || typeof payload.selected !== "object") return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function applySelectionMap(selection) {
  let count = 0;
  CATEGORIES.forEach((category) => {
    const id = selection?.[category.id];
    const part = id
      ? state.data[category.id].find((item) => item.id === id) || null
      : null;
    state.selected[category.id] = part;
    if (part) count += 1;
  });
  return count;
}

function encodeSharePayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeSharePayload(raw) {
  const normalized = String(raw || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (!payload || payload.v !== SHARE_VERSION || typeof payload.s !== "object" || !payload.s) {
    throw new Error("invalid share payload");
  }
  return payload;
}

function buildShareUrl(mode = "normal") {
  const official = {};
  const custom = {};
  CATEGORIES.forEach((category) => {
    const part = selectedPart(category.id);
    if (!part) return;
    if (part.custom) {
      custom[part.id] = compactCustomPart(part);
    } else {
      official[category.id] = part.id;
    }
  });
  const payload = {
    v: SHARE_VERSION,
    s: official,
    p: state.radiatorPosition || ""
  };
  if (mode === "with-custom") payload.c = custom;
  if (mode === "official-only") payload.n = Object.keys(custom).length;
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("config", encodeSharePayload(payload));
  return url.toString();
}

function restoreInitialBuild() {
  let shared = null;
  let invalidShare = false;
  const raw = new URLSearchParams(location.search).get("config");
  if (raw) {
    try {
      shared = decodeSharePayload(raw);
    } catch (error) {
      invalidShare = true;
    }
  }

  if (shared) {
    const sharedCustom = importSharedCustomParts(shared.c, "share");
    applySelectionMap(shared.s || {});
    Object.entries(sharedCustom.byCategory).forEach(([category, part]) => {
      state.selected[category] = part;
    });
    state.radiatorPosition = normalizeRadiatorPosition(shared.p);
    persistBuild();
    const count = selectedCount();
    const missingCustom = Number(shared.n || 0);
    let message = "已从分享链接载入配置";
    let tone = count > 0 ? "success" : "warning";
    if (shared.c) {
      message = `已从分享链接载入配置，导入 ${sharedCustom.imported.length} 个自定义件`;
      if (sharedCustom.conflicts.length) {
        message += `，保留本机 ${sharedCustom.conflicts.length} 个`;
        tone = "warning";
      }
    } else if (missingCustom > 0) {
      message = `原配置含 ${missingCustom} 个自定件，未包含`;
      tone = "warning";
    }
    return {
      count,
      message: count > 0 || shared.c ? message : "分享链接中没有有效配置",
      tone
    };
  }

  const stored = readStoredBuild();
  if (stored) {
    const count = applySelectionMap(stored.selected);
    state.radiatorPosition = normalizeRadiatorPosition(stored.radiatorPosition);
    updateSaveState(`上次保存 · ${saveTimeText(stored.savedAt)}`, count > 0);
    return {
      count,
      message: invalidShare
        ? (count > 0 ? "分享链接无效，已恢复上次配置" : "分享链接无效")
        : (count > 0 ? "已恢复上次配置" : ""),
      tone: invalidShare ? "warning" : "success"
    };
  }

  updateSaveState("自动保存到本机", false);
  return {
    count: 0,
    message: invalidShare ? "分享链接无效" : "",
    tone: "warning"
  };
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fall back to a temporary textarea below.
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  area.style.left = "-1000px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, area.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  area.remove();
  return copied;
}

function buildExportText() {
  const checks = compatibilityChecks();
  const count = selectedCount();
  const fails = checks.filter((check) => check.status === "fail");
  const passes = checks.filter((check) => check.status === "pass");
  const pending = checks.filter((check) => check.status === "pending");
  const status = fails.length
    ? `不兼容（${fails.length} 项）`
    : (passes.length === checks.length
      ? (count === CATEGORIES.length ? "通过" : "待补全")
      : `待确认（${pending.length} 项）`);
  const divider = "=".repeat(56);
  const lines = [
    "ATX BUILD / 装机配置单",
    `生成时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`,
    "数据版本：2026-10",
    "免责声明：兼容性按已选型号与已填参数计算，未覆盖所有物理细节；价格与性能仅供参考；自定义件未审核。",
    divider
  ];

  CATEGORIES.forEach((category) => {
    const part = selectedPart(category.id);
    if (!part) {
      lines.push(`${category.label}：未选择`);
      return;
    }
    const specs = part.custom
      ? customSpecsText(part)
      : category.keys.map((key) => `${key} ${part.specs?.[key] ?? "—"}`).join(" / ");
    lines.push(`${category.label}：${part.name}${part.custom ? "  |  自定义 · 未审核" : ""}`);
    lines.push(`  ${specs}  |  ${priceText(part.price)}  |  保真：${fidelityLabel(part)}`);
  });

  const selectedCooler = selectedPart("cooler");
  if (selectedCooler && Number(selectedCooler.modelParams?.radiatorSize || 0) > 0) {
    lines.push(`冷排安装位置：${radiatorPositionLabel(state.radiatorPosition)}`);
  }

  lines.push(divider);
  lines.push(`已选：${count} / ${CATEGORIES.length}`);
  lines.push(`参考总价：${priceText(totalPrice())}`);
  lines.push(`兼容状态：${status}`);
  lines.push(`检查统计：${passes.length} 项通过 / ${pending.length} 项待确认 / ${fails.length} 项失败`);
  lines.push("检查结果：");
  checks.forEach((check) => {
    const tag = check.status === "pass" ? "[PASS]" : check.status === "fail" ? "[FAIL]" : "[WAIT]";
    lines.push(`${tag} ${check.title}`);
    lines.push(`      ${check.detail}`);
  });
  lines.push(divider);
  lines.push(`页面：${location.origin}${location.pathname}`);
  return lines.join("\n");
}

function hasCustomSelection() {
  return CATEGORIES.some((category) => selectedPart(category.id)?.custom);
}

function selectedCustomParts() {
  return CATEGORIES
    .map((category) => selectedPart(category.id))
    .filter((part) => part?.custom);
}

function safeClone(value, depth = 0) {
  if (depth > 4) return null;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => safeClone(item, depth + 1));
  if (!value || typeof value !== "object") return value;
  const copy = {};
  Object.entries(value).slice(0, 100).forEach(([key, item]) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return;
    copy[key] = safeClone(item, depth + 1);
  });
  return copy;
}

function compactCustomPart(part) {
  return {
    category: part.category,
    name: part.name,
    modelParams: safeClone(part.modelParams || {}),
    compat: safeClone(part.compat || {})
  };
}

function customSpecsFromDefinition(category, modelParams = {}, compat = {}) {
  const specs = {};
  const add = (key, value) => {
    if (value !== undefined && value !== null && value !== "") specs[key] = String(value);
  };
  if (category === "gpu") {
    add("长度", modelParams.length !== undefined ? fmtMm(modelParams.length) : undefined);
    add("厚度", modelParams.thickness !== undefined ? `${modelParams.thickness} 槽` : undefined);
    add("功耗", compat.powerWatt !== undefined ? `${compat.powerWatt}W` : undefined);
    add("PCIe 8pin", compat.pcie8 !== undefined ? `${compat.pcie8} 个` : undefined);
    add("供电", compat.requires12vhpwr === true ? "12VHPWR" : compat.requires12vhpwr === false ? "无需 12VHPWR" : undefined);
  }
  if (category === "cpu") {
    add("插槽", compat.socket);
    add("功耗", compat.powerWatt !== undefined ? `${compat.powerWatt}W` : undefined);
  }
  if (category === "motherboard") {
    add("板型", compat.formFactor);
    add("内存", compat.memoryType);
    add("插槽", compat.socket);
    add("M.2", modelParams.m2Slots !== undefined ? `${modelParams.m2Slots} 个` : undefined);
    add("M.2 key", modelParams.m2Key);
    add("SATA", modelParams.sataPorts !== undefined ? `${modelParams.sataPorts} 个` : undefined);
  }
  if (category === "cooler") {
    add("类型", modelParams.type === "liquid" ? "水冷" : modelParams.type === "air" ? "风冷" : undefined);
    add("高度", modelParams.height !== undefined ? fmtMm(modelParams.height) : undefined);
    add("冷排", modelParams.radiatorSize > 0 ? String(modelParams.radiatorSize) : undefined);
    add("冷排厚度", modelParams.radiatorThickness !== undefined ? fmtMm(modelParams.radiatorThickness) : undefined);
    add("内存避让", compat.memoryClearance !== undefined ? fmtMm(compat.memoryClearance) : undefined);
  }
  if (category === "memory") {
    add("类型", compat.memoryType);
    add("容量", compat.capacityGB !== undefined ? `${compat.capacityGB}GB` : undefined);
    add("高度", modelParams.height !== undefined ? fmtMm(modelParams.height) : undefined);
  }
  if (category === "psu") {
    add("额定功率", compat.wattage !== undefined ? `${compat.wattage}W` : undefined);
    add("长度", modelParams.length !== undefined ? fmtMm(modelParams.length) : undefined);
    add("12VHPWR", compat.connectors?.["12vhpwr"]);
  }
  if (category === "case") {
    add("板型", Array.isArray(compat.supportedFormFactors) ? compat.supportedFormFactors.join(" / ") : undefined);
    add("显卡限长", compat.maxGpuLength !== undefined ? fmtMm(compat.maxGpuLength) : undefined);
    add("显卡限厚", compat.maxGpuThickness !== undefined ? `${compat.maxGpuThickness} 槽` : undefined);
    add("散热限高", compat.maxCoolerHeight !== undefined ? fmtMm(compat.maxCoolerHeight) : undefined);
    add("冷排空间", compat.maxRadiatorThickness !== undefined ? fmtMm(compat.maxRadiatorThickness) : undefined);
    add("冷排位", Array.isArray(compat.supportedRadiatorSizes) ? compat.supportedRadiatorSizes.join(" / ") : undefined);
  }
  if (category === "storage") {
    add("接口", compat.interface);
    add("协议", modelParams.protocol);
    add("长度", compat.m2Length !== undefined ? fmtMm(compat.m2Length) : modelParams.length !== undefined ? fmtMm(modelParams.length) : undefined);
    add("M.2 key", compat.m2Key);
  }
  if (category === "casefan") {
    add("尺寸", compat.size !== undefined ? `${compat.size}mm` : undefined);
    add("数量", compat.quantity);
  }
  return specs;
}

function customSpecsText(part) {
  const specs = part.specs && Object.keys(part.specs).length
    ? part.specs
    : customSpecsFromDefinition(part.category, part.modelParams || {}, part.compat || {});
  const text = Object.entries(specs)
    .map(([key, value]) => `${key} ${value}`)
    .join(" / ");
  return text || "参数待确认";
}

function customPartFromDefinition(id, definition, source = "share") {
  const category = definition?.category;
  const safeId = typeof id === "string" ? id.trim() : "";
  const name = typeof definition?.name === "string" ? definition.name.trim() : "";
  if (!CATEGORY_MAP.has(category) || !safeId || safeId.length > 80 || !name || name.length > 120) {
    return null;
  }
  if (JSON.stringify(definition).length > SHARE_MAX_DEFINITION_CHARS) return null;
  const modelParams = safeClone(definition.modelParams || {});
  const compat = safeClone(definition.compat || {});
  return {
    id: safeId,
    category,
    custom: true,
    source,
    name,
    brand: source === "share" ? "自定义 · 分享导入" : "自定义 · 未审核",
    specs: customSpecsFromDefinition(category, modelParams, compat),
    compat,
    modelParams,
    price: 0,
    fidelity: "proportional"
  };
}

function importSharedCustomParts(defs, source = "share") {
  const imported = [];
  const conflicts = [];
  const byCategory = {};
  if (!defs || typeof defs !== "object") return { imported, conflicts, byCategory };
  Object.entries(defs).slice(0, SHARE_MAX_CUSTOM).forEach(([id, definition]) => {
    if (!definition || typeof definition !== "object") return;
    const category = definition.category;
    if (!CATEGORY_MAP.has(category)) return;
    const existing = state.data[category].find((part) => part.id === id);
    if (existing) {
      conflicts.push(existing);
      byCategory[category] = existing;
      return;
    }
    const part = customPartFromDefinition(String(id), definition, source);
    if (!part) return;
    state.data[category].push(part);
    imported.push(part);
    byCategory[category] = part;
  });
  if (imported.length) saveCustomParts();
  return { imported, conflicts, byCategory };
}

async function copyShareConfig(mode = "normal") {
  const url = buildShareUrl(mode);
  if (url.length > SHARE_MAX_URL_CHARS) {
    showToast("自定义件参数过多，分享链接过长；请精简参数后再试", "warning");
    return;
  }
  const copied = await copyText(url);
  showToast(copied ? "分享链接已复制" : "复制失败，请检查浏览器权限", copied ? "success" : "warning");
}

async function handleCopyShare() {
  if (selectedCount() === 0) return;
  if (hasCustomSelection()) {
    if (dom.shareChoiceCopy) {
      const count = selectedCustomParts().length;
      dom.shareChoiceCopy.textContent = `这份配置包含 ${count} 个自定义件；选择是否把它们一起分享。`;
    }
    dom.shareChoiceDialog.showModal();
    return;
  }
  await copyShareConfig("normal");
}

async function handleCopyExport() {
  if (selectedCount() === 0) return;
  const copied = await copyText(buildExportText());
  showToast(copied ? "配置单已复制到剪贴板" : "复制失败，请检查浏览器权限", copied ? "success" : "warning");
}

function randomToken(prefix = "") {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function removeLegacyAccountStorage() {
  try {
    [
      "atx-configurator-accounts-v1",
      "atx-configurator-session-v1",
      "atx-configurator-history-v1"
    ].forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    // Legacy local-only account data is optional to clean.
  }
}

function readSavedConfigs() {
  try {
    const raw = localStorage.getItem(SAVED_CONFIG_STORAGE_KEY);
    const entries = raw ? JSON.parse(raw) : [];
    return Array.isArray(entries) ? entries.filter((entry) => entry?.id) : [];
  } catch (error) {
    return [];
  }
}

function writeSavedConfigs(entries) {
  localStorage.setItem(SAVED_CONFIG_STORAGE_KEY, JSON.stringify(entries));
}

function openSavedConfigDialog() {
  renderSavedConfigs();
  if (!dom.savedConfigDialog.open) dom.savedConfigDialog.showModal();
}

function closeSavedConfigDialog() {
  if (dom.savedConfigDialog?.open) dom.savedConfigDialog.close();
}

function saveCurrentConfig() {
  if (selectedCount() === 0) {
    showToast("当前配置为空，未保存", "warning");
    return;
  }
  const custom = {};
  selectedCustomParts().forEach((part) => {
    custom[part.id] = compactCustomPart(part);
  });
  const entries = readSavedConfigs();
  entries.unshift({
    id: randomToken("saved_"),
    createdAt: new Date().toISOString(),
    selected: selectionMap(),
    radiatorPosition: state.radiatorPosition || "",
    custom
  });
  writeSavedConfigs(entries.slice(0, 20));
  renderSavedConfigs();
  showToast("已保存到本机配置列表", "success");
}

function loadSavedConfig(entryId) {
  clearClearUndo();
  const entry = readSavedConfigs().find((item) => item.id === entryId);
  if (!entry) return;
  const imported = importSharedCustomParts(entry.custom, "saved");
  applySelectionMap(entry.selected || {});
  Object.entries(imported.byCategory).forEach(([category, part]) => {
    state.selected[category] = part;
  });
  state.radiatorPosition = normalizeRadiatorPosition(entry.radiatorPosition);
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
  closeSavedConfigDialog();
  showToast("已载入本机保存的配置", "success");
}

function compareSavedConfig(entryId) {
  const entry = readSavedConfigs().find((item) => item.id === entryId);
  if (!entry) return;
  const current = selectionMap();
  const saved = entry.selected || {};
  let differences = 0;
  const rows = CATEGORIES.map((category) => {
    const currentId = current[category.id];
    const savedId = saved[category.id];
    const currentName = selectedPart(category.id)?.name || "未选择";
    const savedName = state.data[category.id].find((part) => part.id === savedId)?.name
      || entry.custom?.[savedId]?.name
      || "未选择";
    const different = currentId !== savedId;
    if (different) differences += 1;
    return `<div class="compare-row ${different ? "is-different" : ""}">
      <span class="compare-category">${category.label}</span>
      <span class="compare-value"><small>当前</small>${escapeHtml(currentName)}</span>
      <span class="compare-value"><small>保存</small>${escapeHtml(savedName)}</span>
    </div>`;
  });
  dom.compareSummary.textContent = `当前配置 vs 保存于 ${new Date(entry.createdAt).toLocaleString("zh-CN", { hour12: false })} · ${differences} 个品类不同`;
  dom.compareBody.innerHTML = rows.join("");
  if (!dom.compareDialog.open) dom.compareDialog.showModal();
}

function deleteSavedConfig(entryId) {
  writeSavedConfigs(readSavedConfigs().filter((item) => item.id !== entryId));
  renderSavedConfigs();
  showToast("已删除本机保存的配置", "success");
}

function exportSavedConfigs() {
  const entries = readSavedConfigs();
  if (!entries.length) {
    showToast("这台设备还没有可导出的配置", "warning");
    return;
  }
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `atx-configs-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("本机配置已导出", "success");
}

async function importSavedConfigs(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const incoming = JSON.parse(text);
    if (!Array.isArray(incoming)) throw new Error("文件不是配置数组。");
    const existing = readSavedConfigs();
    const ids = new Set(existing.map((entry) => entry.id));
    const imported = incoming
      .slice(0, 20)
      .filter((entry) => entry && typeof entry === "object" && entry.selected && typeof entry.selected === "object")
      .map((entry) => ({
        id: typeof entry.id === "string" && entry.id ? entry.id : randomToken("saved_"),
        createdAt: entry.createdAt || new Date().toISOString(),
        selected: safeClone(entry.selected),
        radiatorPosition: normalizeRadiatorPosition(entry.radiatorPosition),
        custom: safeClone(entry.custom || {})
      }))
      .filter((entry) => !ids.has(entry.id));
    if (!imported.length) {
      showToast("没有可导入的新配置", "warning");
      return;
    }
    writeSavedConfigs([...imported, ...existing].slice(0, 20));
    renderSavedConfigs();
    showToast(`已导入 ${imported.length} 条本机配置`, "success");
  } catch (error) {
    showToast(`导入失败：${error.message}`, "warning");
  } finally {
    if (dom.savedConfigFile) dom.savedConfigFile.value = "";
  }
}

function renderSavedConfigs() {
  if (!dom.savedConfigList) return;
  const entries = readSavedConfigs();
  dom.savedConfigCount.textContent = entries.length ? `${entries.length} / 20` : "仅保存在这台设备";
  if (!entries.length) {
    dom.savedConfigList.innerHTML = `<p class="saved-config-empty">这台设备还没有保存的配置。设置好配置后点上方按钮保存。</p>`;
    return;
  }
  dom.savedConfigList.innerHTML = entries.map((entry) => {
    const count = Object.values(entry.selected || {}).filter(Boolean).length;
    const customCount = Object.keys(entry.custom || {}).length;
    const date = new Date(entry.createdAt);
    const time = Number.isNaN(date.getTime())
      ? entry.createdAt
      : date.toLocaleString("zh-CN", { hour12: false });
    return `<div class="saved-config-item">
      <div>
        <strong>${time}</strong>
        <small>${count} / 9 个品类${customCount ? ` · ${customCount} 个自定义件` : ""}</small>
      </div>
      <div class="saved-config-item-actions">
        <button type="button" class="text-button" data-saved-load="${entry.id}">载入</button>
        <button type="button" class="text-button" data-saved-compare="${entry.id}">对比</button>
        <button type="button" class="text-button" data-saved-delete="${entry.id}">删除</button>
      </div>
    </div>`;
  }).join("");
}

/* ----------------------------------------------------------------
   04. 配件数据读取
   ---------------------------------------------------------------- */
async function loadComponents() {
  const entries = await Promise.all(
    CATEGORIES.map(async (category) => {
      const response = await fetch(category.file, { cache: "no-store" });
      if (!response.ok) throw new Error(`${category.file} 读取失败 (${response.status})`);
      const items = await response.json();
      if (!Array.isArray(items)) throw new Error(`${category.file} 不是配件数组`);
      return [category.id, items];
    })
  );

  entries.forEach(([id, items]) => { state.data[id] = items; });
}

function readCustomParts() {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    const parts = raw ? JSON.parse(raw) : [];
    return Array.isArray(parts)
      ? parts.filter((part) => part && part.custom && part.id && part.category)
      : [];
  } catch (error) {
    return [];
  }
}

function saveCustomParts() {
  try {
    const parts = CATEGORIES.flatMap((category) =>
      state.data[category.id].filter((part) => part.custom)
    );
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(parts));
  } catch (error) {
    // Custom parts are optional; keep the official catalog usable.
  }
}

function loadCustomParts() {
  readCustomParts().forEach((part) => {
    if (!state.data[part.category]) return;
    if (state.data[part.category].some((item) => item.id === part.id)) return;
    state.data[part.category].push(part);
  });
}

function customValueMarkup(field, values = {}) {
  const id = `custom-${field.key}`;
  if (field.type === "checks") {
    const selected = Array.isArray(values[field.key]) ? values[field.key].map(String) : [];
    return `<div class="custom-field custom-field-checks">
      <span class="custom-label">${escapeHtml(field.label)}</span>
      <div class="custom-checks">
        ${field.options.map(([value, label]) => `
          <label><input type="checkbox" name="${field.key}" value="${value}"${selected.includes(String(value)) ? " checked" : ""}> ${escapeHtml(label)}</label>`).join("")}
      </div>
    </div>`;
  }
  if (field.type === "select") {
    const current = values[field.key] === undefined ? "" : String(values[field.key]);
    return `<label class="custom-field" for="${id}">
      <span class="custom-label">${escapeHtml(field.label)}</span>
      <select id="${id}" name="${field.key}">
        ${field.options.map(([value, label]) => `<option value="${value}"${current === String(value) ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
      </select>
    </label>`;
  }
  const current = values[field.key] === undefined ? "" : String(values[field.key]);
  return `<label class="custom-field" for="${id}">
    <span class="custom-label">${escapeHtml(field.label)}${field.required ? " *" : ""}</span>
    <input id="${id}" name="${field.key}" type="${field.type}" value="${escapeHtml(current)}"${field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ""}${field.min !== undefined ? ` min="${field.min}"` : ""}${field.step !== undefined ? ` step="${field.step}"` : ""}>
  </label>`;
}

function customPartToFormValues(part) {
  if (!part) return {};
  const values = {
    name: part.name
  };
  const mp = part.modelParams || {};
  const compat = part.compat || {};
  if (part.category === "gpu") {
    Object.assign(values, {
      length: mp.length,
      thickness: mp.thickness,
      powerWatt: compat.powerWatt,
      pcie8: compat.pcie8,
      requires12vhpwr: compat.requires12vhpwr === true ? "yes" : compat.requires12vhpwr === false ? "no" : ""
    });
  }
  if (part.category === "cpu") {
    Object.assign(values, { socket: compat.socket, powerWatt: compat.powerWatt });
  }
  if (part.category === "motherboard") {
    Object.assign(values, {
      formFactor: compat.formFactor,
      memoryType: compat.memoryType,
      socket: compat.socket,
      m2Slots: mp.m2Slots,
      m2Key: mp.m2Key,
      m2Lengths: mp.m2Lengths?.map(String),
      sataPorts: mp.sataPorts
    });
  }
  if (part.category === "cooler") {
    Object.assign(values, {
      type: mp.type,
      height: mp.height,
      radiatorSize: mp.radiatorSize,
      radiatorThickness: mp.radiatorThickness,
      radiatorFanThickness: mp.radiatorFanThickness,
      socket: compat.socket,
      memoryClearance: compat.memoryClearance
    });
  }
  if (part.category === "memory") {
    Object.assign(values, {
      memoryType: compat.memoryType,
      capacityGB: compat.capacityGB,
      height: mp.height
    });
  }
  if (part.category === "psu") {
    Object.assign(values, {
      wattage: compat.wattage,
      length: mp.length,
      connectors12vhpwr: compat.connectors?.["12vhpwr"],
      connectorsPcie8: compat.connectors?.pcie8
    });
  }
  if (part.category === "case") {
    const positions = compat.radiatorPositions && typeof compat.radiatorPositions === "object"
      ? Object.keys(compat.radiatorPositions)
      : [];
    const sizes = Array.isArray(compat.supportedRadiatorSizes) ? compat.supportedRadiatorSizes : [];
    const slots = Array.isArray(compat.fanSlots) ? compat.fanSlots : [];
    Object.assign(values, {
      formFactors: compat.supportedFormFactors,
      maxGpuLength: compat.maxGpuLength,
      maxGpuThickness: compat.maxGpuThickness,
      maxCoolerHeight: compat.maxCoolerHeight,
      maxRadiatorThickness: compat.maxRadiatorThickness,
      maxPsuLength: compat.maxPsuLength,
      radiatorPositions: positions,
      radiatorSizes: sizes.map(String),
      fanFront: slots.find((slot) => slot.position === "front")?.count,
      fanTop: slots.find((slot) => slot.position === "top")?.count,
      fanRear: slots.find((slot) => slot.position === "rear")?.count,
      fanSizes: slots[0]?.sizes?.map(String)
    });
  }
  if (part.category === "storage") {
    Object.assign(values, {
      interface: compat.interface,
      length: mp.length,
      m2Length: compat.m2Length,
      m2Key: compat.m2Key,
      protocol: mp.protocol
    });
  }
  if (part.category === "casefan") {
    Object.assign(values, {
      size: compat.size,
      quantity: compat.quantity,
      positions: mp.positions
    });
  }
  return values;
}

function openCustomPartForm(categoryId, editPart = null) {
  const category = categoryMeta(categoryId);
  const fields = CUSTOM_FIELDS[categoryId] || [];
  const values = customPartToFormValues(editPart);
  customCategoryId = categoryId;
  editingCustomId = editPart?.id || null;
  const title = document.getElementById("custom-dialog-title");
  if (title) title.textContent = editPart ? `编辑自定义${category.label}` : `添加自定义${category.label}`;
  dom.customFields.innerHTML = fields.map((field) => customValueMarkup(field, values)).join("");
  dom.customError.hidden = true;
  dom.customError.textContent = "";
  dom.customDialog.showModal();
  window.setTimeout(() => dom.customFields.querySelector("input, select")?.focus(), 40);
}

function closeCustomPartForm() {
  if (dom.customDialog?.open) dom.customDialog.close();
  editingCustomId = null;
}

function readCustomFieldValues(categoryId) {
  const fields = CUSTOM_FIELDS[categoryId] || [];
  const values = {};
  fields.forEach((field) => {
    if (field.type === "checks") {
      const checked = [...dom.customFields.querySelectorAll(`input[name="${field.key}"]:checked`)]
        .map((input) => input.value);
      if (checked.length) values[field.key] = checked;
      return;
    }
    const input = dom.customFields.querySelector(`[name="${field.key}"]`);
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) return;
    if (field.type === "number") {
      const number = Number(raw);
      if (!Number.isFinite(number)) throw new Error(`${field.label}需要填写数字。`);
      values[field.key] = number;
    } else {
      values[field.key] = raw;
    }
  });
  return values;
}

function fmtMm(value) {
  return value === undefined ? "待确认" : `${value}mm`;
}

function fmtNumber(value, suffix = "") {
  return value === undefined ? "待确认" : `${value}${suffix}`;
}

function customPartFromValues(categoryId, values) {
  const name = String(values.name || "").trim();
  if (!name) throw new Error("名称不能为空。");
  const part = {
    id: `custom-${categoryId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: categoryId,
    custom: true,
    source: "local",
    name,
    brand: "自定义 · 未审核",
    specs: {},
    compat: {},
    modelParams: {},
    price: 0,
    fidelity: "proportional"
  };
  if (categoryId === "gpu") {
    if (values.length !== undefined) {
      part.modelParams.length = values.length;
      part.specs["长度"] = fmtMm(values.length);
    }
    if (values.thickness !== undefined) {
      part.modelParams.thickness = values.thickness;
      part.specs["厚度"] = `${values.thickness} 槽`;
    }
    if (values.powerWatt !== undefined) {
      part.compat.powerWatt = values.powerWatt;
      part.specs["功耗"] = `${values.powerWatt}W`;
    }
    if (values.pcie8 !== undefined) {
      part.compat.pcie8 = values.pcie8;
      part.specs["PCIe 8pin"] = `${values.pcie8} 个`;
    }
    if (values.requires12vhpwr === "yes") part.compat.requires12vhpwr = true;
    if (values.requires12vhpwr === "no") part.compat.requires12vhpwr = false;
    if (values.requires12vhpwr) part.specs["供电"] = values.requires12vhpwr === "yes" ? "12VHPWR" : "无需 12VHPWR";
  }
  if (categoryId === "cpu") {
    if (values.socket) {
      part.compat.socket = values.socket;
      part.specs["插槽"] = values.socket;
    }
    if (values.powerWatt !== undefined) {
      part.compat.powerWatt = values.powerWatt;
      part.specs["功耗"] = `${values.powerWatt}W`;
    }
  }
  if (categoryId === "motherboard") {
    if (values.formFactor) {
      part.compat.formFactor = values.formFactor;
      part.modelParams.formFactor = values.formFactor;
      part.specs["板型"] = values.formFactor;
    }
    if (values.memoryType) {
      part.compat.memoryType = values.memoryType;
      part.specs["内存"] = values.memoryType;
    }
    if (values.socket) {
      part.compat.socket = values.socket;
      part.specs["插槽"] = values.socket;
    }
    if (values.m2Slots !== undefined) {
      part.modelParams.m2Slots = values.m2Slots;
      part.specs["M.2"] = `${values.m2Slots} 个`;
    }
    if (values.m2Key) part.modelParams.m2Key = values.m2Key;
    if (values.m2Lengths) {
      part.modelParams.m2Lengths = values.m2Lengths.map(Number).filter(Number.isFinite);
    }
    if (values.sataPorts !== undefined) {
      part.modelParams.sataPorts = values.sataPorts;
      part.specs["SATA"] = `${values.sataPorts} 个`;
    }
  }
  if (categoryId === "cooler") {
    if (values.type) {
      part.modelParams.type = values.type;
      part.specs["类型"] = values.type === "liquid" ? "水冷" : "风冷";
    }
    if (values.height !== undefined) {
      part.modelParams.height = values.height;
      part.compat.height = values.height;
      part.specs["高度"] = fmtMm(values.height);
    }
    if (values.radiatorSize !== undefined) {
      part.modelParams.radiatorSize = values.radiatorSize;
      if (values.radiatorSize > 0) part.specs["冷排"] = `${values.radiatorSize}`;
    } else if (values.type === "air") {
      part.modelParams.radiatorSize = 0;
    }
    if (values.radiatorThickness !== undefined) part.modelParams.radiatorThickness = values.radiatorThickness;
    if (values.radiatorFanThickness !== undefined) part.modelParams.radiatorFanThickness = values.radiatorFanThickness;
    if (values.socket) part.compat.socket = values.socket;
    if (values.memoryClearance !== undefined) {
      part.compat.memoryClearance = values.memoryClearance;
      part.specs["内存避让"] = fmtMm(values.memoryClearance);
    }
  }
  if (categoryId === "memory") {
    if (values.memoryType) {
      part.compat.memoryType = values.memoryType;
      part.specs["类型"] = values.memoryType;
    }
    if (values.capacityGB !== undefined) {
      part.compat.capacityGB = values.capacityGB;
      part.specs["容量"] = `${values.capacityGB}GB`;
    }
    if (values.height !== undefined) {
      part.modelParams.height = values.height;
      part.specs["高度"] = fmtMm(values.height);
    }
  }
  if (categoryId === "psu") {
    if (values.wattage !== undefined) {
      part.compat.wattage = values.wattage;
      part.specs["额定功率"] = `${values.wattage}W`;
    }
    if (values.length !== undefined) {
      part.modelParams.length = values.length;
      part.specs["长度"] = fmtMm(values.length);
    }
    if (values.connectors12vhpwr !== undefined) {
      part.compat.connectors = { "12vhpwr": values.connectors12vhpwr };
      if (values.connectorsPcie8 !== undefined) {
        part.compat.connectors.pcie8 = values.connectorsPcie8;
      }
      part.specs["12VHPWR"] = `${values.connectors12vhpwr}`;
    }
  }
  if (categoryId === "case") {
    if (values.formFactors) {
      part.compat.supportedFormFactors = values.formFactors;
      part.specs["板型"] = values.formFactors.join(" / ");
    }
    if (values.maxGpuLength !== undefined) {
      part.compat.maxGpuLength = values.maxGpuLength;
      part.compat.maxCaseLength = values.maxGpuLength;
      part.specs["显卡限长"] = fmtMm(values.maxGpuLength);
    }
    if (values.maxGpuThickness !== undefined) {
      part.compat.maxGpuThickness = values.maxGpuThickness;
      part.specs["显卡限厚"] = `${values.maxGpuThickness} 槽`;
    }
    if (values.maxCoolerHeight !== undefined) {
      part.compat.maxCoolerHeight = values.maxCoolerHeight;
      part.specs["散热限高"] = fmtMm(values.maxCoolerHeight);
    }
    if (values.maxRadiatorThickness !== undefined) {
      part.compat.maxRadiatorThickness = values.maxRadiatorThickness;
    }
    if (values.maxPsuLength !== undefined) {
      part.compat.maxPsuLength = values.maxPsuLength;
      part.modelParams.maxPsuLength = values.maxPsuLength;
    }
    if (values.radiatorPositions && values.radiatorSizes) {
      const radiatorSizes = values.radiatorSizes.map(Number).filter(Number.isFinite);
      part.compat.radiatorPositions = Object.fromEntries(
        values.radiatorPositions.map((position) => [position, radiatorSizes])
      );
      part.compat.supportedRadiatorSizes = radiatorSizes;
    }
    if (values.fanSizes) {
      const fanSizes = values.fanSizes.map(Number).filter(Number.isFinite);
      const positions = [
        ["front", "fanFront"],
        ["top", "fanTop"],
        ["rear", "fanRear"]
      ];
      const slots = positions
        .filter(([, key]) => values[key] !== undefined)
        .map(([position, key]) => ({ position, count: values[key], sizes: fanSizes }));
      if (slots.length) part.compat.fanSlots = slots;
    }
  }
  if (categoryId === "storage") {
    if (values.interface) {
      part.compat.interface = values.interface;
      part.specs["接口"] = values.interface;
    }
    if (values.length !== undefined) part.modelParams.length = values.length;
    if (values.m2Key) part.compat.m2Key = values.m2Key;
    if (values.interface === "M.2" && values.m2Length !== undefined) {
      part.compat.m2Length = Number(values.m2Length);
    }
    if (values.protocol) {
      part.modelParams.protocol = values.protocol;
      part.specs["协议"] = values.protocol;
    }
  }
  if (categoryId === "casefan") {
    if (values.size !== undefined) {
      part.compat.size = values.size;
      part.modelParams.size = values.size;
      part.specs["尺寸"] = `${values.size}mm`;
    }
    if (values.quantity !== undefined) {
      part.compat.quantity = values.quantity;
      part.modelParams.quantity = values.quantity;
      part.specs["数量"] = `${values.quantity}`;
    }
    if (values.positions) {
      part.modelParams.positions = values.positions;
      part.specs["位置"] = values.positions.join(" / ");
    }
  }
  return part;
}

function submitCustomPart(event) {
  event.preventDefault();
  if (!dom.customDialog?.open) return;
  try {
    const values = readCustomFieldValues(customCategoryId);
    const part = customPartFromValues(customCategoryId, values);
    const editId = editingCustomId;
    if (editId) {
      const index = state.data[customCategoryId].findIndex((item) => item.id === editId);
      if (index >= 0) {
        const previous = state.data[customCategoryId][index];
        part.id = previous.id;
        part.source = previous.source || "local";
        part.brand = previous.brand || "自定义 · 未审核";
        state.data[customCategoryId][index] = part;
        if (state.selected[customCategoryId]?.id === editId) {
          state.selected[customCategoryId] = part;
        }
      }
    } else {
      state.data[customCategoryId].push(part);
      state.selected[customCategoryId] = part;
    }
    state.active = customCategoryId;
    saveCustomParts();
    closeCustomPartForm();
    renderCategories();
    renderCatalog();
    renderSummary();
    persistBuild();
    showToast(editId ? "自定义配件已更新 · 未审核" : "已保存自定义配件 · 未审核", "success");
  } catch (error) {
    dom.customError.textContent = error.message;
    dom.customError.hidden = false;
  }
}

function deleteCustomPart(id) {
  const category = CATEGORIES.find((item) =>
    state.data[item.id].some((part) => part.id === id && part.custom)
  );
  if (!category) return;
  state.data[category.id] = state.data[category.id].filter((item) => item.id !== id);
  if (state.selected[category.id]?.id === id) {
    state.selected[category.id] = null;
    if (category.id === "cooler") state.radiatorPosition = "";
  }
  saveCustomParts();
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
  showToast("自定义配件已删除", "success");
}

async function loadPresets() {
  const response = await fetch("data/presets.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`data/presets.json 读取失败 (${response.status})`);
  const presets = await response.json();
  if (!Array.isArray(presets)) throw new Error("data/presets.json 不是预设数组");
  state.presets = presets.filter((preset) => preset && preset.id && preset.name && preset.selection);
  renderPresets();
}

function renderPresets() {
  if (!dom.presetStrip || !dom.presetList) return;
  if (!state.presets.length) {
    dom.presetStrip.hidden = true;
    return;
  }
  dom.presetStrip.hidden = false;
  dom.presetList.innerHTML = state.presets.map((preset) => `
    <button class="preset-button" type="button" data-preset="${escapeHtml(preset.id)}" title="${escapeHtml(`${preset.name} · ${preset.description || ""}`)}">
      <span class="preset-name">${escapeHtml(preset.name)}</span>
      <span class="preset-desc">${escapeHtml(preset.description || "")}</span>
    </button>`).join("");
}

function clearPresetUndo() {
  window.clearTimeout(presetUndoTimer);
  presetUndoTimer = 0;
  presetUndoState = null;
  if (dom.presetUndo) dom.presetUndo.hidden = true;
}

function showPresetUndo(selection, name, radiatorPosition) {
  window.clearTimeout(presetUndoTimer);
  presetUndoState = { selection, name, radiatorPosition: radiatorPosition || "" };
  if (dom.presetUndo) {
    dom.presetUndo.hidden = false;
    dom.presetUndo.textContent = "撤销预设";
    dom.presetUndo.title = `恢复载入「${name}」之前的配置（5 分钟内有效）`;
  }
  presetUndoTimer = window.setTimeout(clearPresetUndo, 5 * 60 * 1000);
}

function undoPreset() {
  if (!presetUndoState) return;
  const previous = presetUndoState;
  applySelectionMap(previous.selection);
  state.radiatorPosition = previous.radiatorPosition || "";
  state.active = CATEGORIES[0].id;
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
  clearPresetUndo();
  showToast(
    previous.name ? `已恢复载入「${previous.name}」之前的配置` : "已恢复上一套配置",
    "success"
  );
}

function applyPreset(presetId) {
  clearClearUndo();
  const preset = state.presets.find((item) => item.id === presetId);
  if (!preset) return;
  const missing = CATEGORIES.filter((category) => {
    const id = preset.selection?.[category.id];
    return !id || !state.data[category.id]?.some((part) => part.id === id);
  });
  if (missing.length) {
    showToast(`预设数据不完整：${missing.map((category) => category.label).join("、")}`, "warning");
    return;
  }
  // 覆盖式载入有「撤销预设」兜底，不再弹原生确认
  const previous = selectionMap();
  const previousRadiatorPosition = state.radiatorPosition;
  const count = applySelectionMap(preset.selection);
  state.radiatorPosition = "";
  state.active = CATEGORIES[0].id;
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
  showPresetUndo(previous, preset.name, previousRadiatorPosition);
  const checks = compatibilityChecks();
  const fails = checks.filter((check) => check.status === "fail").length;
  showToast(
    fails
      ? `已载入 ${preset.name} · ${count} / ${CATEGORIES.length} · ${fails} 项不兼容`
      : `已载入 ${preset.name} · ${count} / ${CATEGORIES.length} · ${checks.length} 项兼容`,
    fails ? "warning" : "success"
  );
}

/* ----------------------------------------------------------------
   05. 左侧品类列表
   ---------------------------------------------------------------- */
function renderCategories() {
  const countLabel = String(CATEGORIES.length).padStart(2, "0");
  if (dom.categoryCount) dom.categoryCount.textContent = countLabel;

  dom.categoryList.innerHTML = CATEGORIES.map((category, index) => {
    const active = state.active === category.id;
    const selected = selectedPart(category.id);
    return `
      <button
        class="category-button ${active ? "is-active" : ""}"
        type="button"
        aria-current="${active ? "true" : "false"}"
        data-category="${category.id}"
      >
        <span class="category-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="category-copy">
          <strong>${category.label}</strong>
          <small>${state.data[category.id].length} 款</small>
        </span>
      </button>`;
  }).join("");
}

/* ----------------------------------------------------------------
   06. 中间型号列表
   ---------------------------------------------------------------- */
function sortMetric(part, metric) {
  if (metric === "price") return Number(part.price || 0);
  if (metric === "length") {
    const values = [part.modelParams?.length, part.compat?.maxGpuLength, part.modelParams?.height];
    const value = values.find((item) => Number.isFinite(Number(item)) && item !== null && item !== undefined);
    return value === undefined ? null : Number(value);
  }
  if (metric === "power") {
    const values = [part.compat?.powerWatt, part.compat?.wattage];
    const value = values.find((item) => Number.isFinite(Number(item)) && item !== null && item !== undefined);
    return value === undefined ? null : Number(value);
  }
  return null;
}

function renderCatalog() {
  const category = categoryMeta(state.active);
  const allItems = state.data[category.id];
  const query = catalogFilter.query.trim().toLowerCase();
  const items = allItems.filter((part) => {
    if (catalogFilter.compatibleOnly && selectedPart(category.id)?.id !== part.id) {
      if (partWouldFail(category.id, part)) return false;
    }
    if (!query) return true;
    const haystack = [
      part.name,
      part.brand,
      ...Object.entries(part.specs || {}).flatMap(([key, value]) => [key, value])
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  if (catalogFilter.sort !== "default") {
    const [metric, direction] = catalogFilter.sort.split("-");
    items.sort((left, right) => {
      const a = sortMetric(left, metric);
      const b = sortMetric(right, metric);
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return direction === "asc" ? a - b : b - a;
    });
  }

  dom.categoryTitle.textContent = category.label;
  dom.catalogCount.textContent = items.length === allItems.length
    ? `${allItems.length} 款`
    : `${items.length} / ${allItems.length} 款`;

  const counterpartId = category.id === "cpu" ? "motherboard" : category.id === "motherboard" ? "cpu" : null;
  const counterpart = counterpartId ? selectedPart(counterpartId) : null;
  const counterpartSocket = socketOf(counterpart);
  dom.catalogSub.textContent = counterpart
    ? `${category.hint} 当前已选 ${counterpart.name}（${counterpartSocket}）；灰色型号插槽不兼容。`
    : "";

  dom.loading.hidden = true;
  dom.empty.hidden = items.length > 0;
  dom.modelGrid.hidden = items.length === 0;
  if (!items.length) {
    dom.empty.textContent = allItems.length
      ? "没有匹配型号。清空搜索词或关闭「只看兼容」再试。"
      : "当前品类暂无型号数据。";
  }

  dom.modelGrid.innerHTML = items.map((part) => {
    const selected = selectedPart(category.id)?.id === part.id;
    const conflict = socketConflictFor(category.id, part);
    const incompatible = !!conflict;
    const custom = !!part.custom;
    const specEntries = custom
      ? Object.entries(part.specs || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
      : (CARD_SPEC_KEYS[category.id] || category.keys)
        .filter((key) => part.specs && key in part.specs)
        .map((key) => [key, specValue(part, key)]);
    const specs = specEntries.length
      ? specEntries.slice(0, 3)
        .map(([key, value]) => `<span class="model-spec"><span>${escapeHtml(key)}</span><b>${escapeHtml(value)}</b></span>`)
        .join("")
      : '<span class="model-spec-empty">参数待确认</span>';
    return `
      <div class="model-item ${custom ? "is-custom-item" : ""}">
      <button
        class="model-card ${selected ? "is-selected" : ""} ${incompatible ? "is-incompatible" : ""} ${custom ? "is-custom" : ""}"
        type="button"
        aria-pressed="${selected ? "true" : "false"}"
        data-id="${escapeHtml(part.id)}"
        ${incompatible ? `data-incompatible="true" title="插槽不兼容"` : ""}
        ${custom ? 'data-custom="true"' : ""}
      >
        <span class="model-top">
          <span class="model-brand">${custom ? escapeHtml(part.source === "share" ? "自定义 · 分享导入" : "自定义 · 未审核") : escapeHtml(part.brand || "—")}</span>
          ${incompatible
            ? '<span class="model-warning">插槽不兼容</span>'
            : '<span class="model-check">已选择</span>'}
        </span>
        <span class="model-name">${escapeHtml(part.name)}</span>
        <span class="model-specs">${specs}</span>
        <span class="model-foot">
          <span class="model-price">${priceText(part.price)}</span>
          <span class="model-state">${incompatible ? "插槽不兼容" : selected ? "已加入配置" : ""}</span>
        </span>
      </button>
      ${custom ? `
        <div class="model-custom-actions">
          <button type="button" class="text-button" data-custom-edit="${escapeHtml(part.id)}">编辑</button>
          <button type="button" class="text-button${pendingCustomDelete === part.id ? " is-confirming" : ""}" data-custom-delete="${escapeHtml(part.id)}">${pendingCustomDelete === part.id ? "确认删除" : "删除"}</button>
        </div>` : ""}
      </div>`;
  }).join("");
}

/* ----------------------------------------------------------------
   07. 兼容性检查
   ---------------------------------------------------------------- */
function checkCpuSocket() {
  const cpu = selectedPart("cpu");
  const motherboard = selectedPart("motherboard");
  if (!cpu || !motherboard) {
    return {
      id: "cpu-socket",
      title: "CPU 插槽 / 主板插槽",
      status: "pending",
      summary: "等待选择 CPU 与主板",
      detail: "选择两者后自动比对 CPU 插槽是否匹配。"
    };
  }
  const cpuSocket = cpu.compat?.socket;
  const boardSocket = motherboard.compat?.socket;
  if (!cpuSocket || !boardSocket) {
    return {
      id: "cpu-socket",
      title: "CPU 插槽 / 主板插槽",
      status: "pending",
      summary: "缺少插槽数据",
      detail: "当前配件数据未提供完整插槽字段。"
    };
  }
  const pass = String(cpuSocket).toUpperCase() === String(boardSocket).toUpperCase();
  const cpuOptions = alternativeParts("cpu", (part) => socketOf(part) === String(boardSocket).toUpperCase(), cpu.id);
  const boardOptions = alternativeParts("motherboard", (part) => socketOf(part) === String(cpuSocket).toUpperCase(), motherboard.id);
  return {
    id: "cpu-socket",
    title: "CPU 插槽 / 主板插槽",
    status: pass ? "pass" : "fail",
    summary: pass ? "插槽匹配" : "插槽不兼容",
    detail: pass
      ? `${cpu.name} 与 ${motherboard.name} 均为 ${cpuSocket}。`
      : `${cpu.name} 为 ${cpuSocket}，${motherboard.name} 为 ${boardSocket}，无法安装。${suggestionText(cpuOptions, boardOptions, "请换同插槽 CPU 或主板。")}`
  };
}

function checkCoolerSocket() {
  const cooler = selectedPart("cooler");
  const cpu = selectedPart("cpu");
  const motherboard = selectedPart("motherboard");
  const platform = cpu?.compat?.socket || motherboard?.compat?.socket;
  if (!cooler || !platform) {
    return {
      id: "cooler-socket",
      title: "散热器插槽 / CPU 平台",
      status: "pending",
      summary: "等待选择散热器与 CPU/主板",
      detail: "选择散热器和 CPU 或主板后比对扣具支持的插槽。"
    };
  }
  const sockets = Array.isArray(cooler.compat?.socket)
    ? cooler.compat.socket
    : (cooler.compat?.socket ? [cooler.compat.socket] : []);
  if (!sockets.length) {
    return {
      id: "cooler-socket",
      title: "散热器插槽 / CPU 平台",
      status: "pending",
      summary: "缺少散热器插槽数据",
      detail: "当前散热器数据未提供支持的插槽列表。"
    };
  }
  const normalized = String(platform).toUpperCase();
  const pass = sockets.map((socket) => String(socket).toUpperCase()).includes(normalized);
  const coolerOptions = alternativeParts(
    "cooler",
    (part) => {
      const supported = Array.isArray(part.compat?.socket)
        ? part.compat.socket
        : (part.compat?.socket ? [part.compat.socket] : []);
      return supported.map((socket) => String(socket).toUpperCase()).includes(normalized);
    },
    cooler.id
  );
  return {
    id: "cooler-socket",
    title: "散热器插槽 / CPU 平台",
    status: pass ? "pass" : "fail",
    summary: pass ? "扣具插槽匹配" : "散热器扣具不兼容",
    detail: pass
      ? `${cooler.name} 支持 ${normalized}，与当前平台匹配。`
      : `${cooler.name} 支持 ${sockets.join(" / ")}，当前平台为 ${normalized}，无法安装。${suggestionText(coolerOptions, [], "请换支持该平台扣具的散热器。")}`
  };
}

function checkFormFactor() {
  const motherboard = selectedPart("motherboard");
  const pcCase = selectedPart("case");
  if (!motherboard || !pcCase) {
    return {
      id: "form-factor",
      title: "主板板型 / 机箱支持",
      status: "pending",
      summary: "等待选择主板与机箱",
      detail: "选择主板和机箱后比对板型是否在机箱支持范围内。"
    };
  }
  const boardForm = motherboard.compat?.formFactor;
  const supported = caseFormFactors(pcCase);
  if (!boardForm || !supported.length) {
    return {
      id: "form-factor",
      title: "主板板型 / 机箱支持",
      status: "pending",
      summary: "缺少板型数据",
      detail: "当前配件数据未提供完整主板板型或机箱支持列表。"
    };
  }
  const pass = supported.includes(boardForm);
  const boardOptions = alternativeParts(
    "motherboard",
    (part) => supported.includes(part.compat?.formFactor),
    motherboard.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => caseFormFactors(part).includes(boardForm),
    pcCase.id
  );
  return {
    id: "form-factor",
    title: "主板板型 / 机箱支持",
    status: pass ? "pass" : "fail",
    summary: pass ? "板型可安装" : "主板板型超出机箱",
    detail: pass
      ? `主板为 ${boardForm}，机箱支持 ${supported.join(" / ")}。`
      : `主板为 ${boardForm}，机箱仅支持 ${supported.join(" / ")}，无法固定主板。${suggestionText(boardOptions, caseOptions, "请换匹配板型的主板或机箱。")}`
  };
}

function checkGpuLength() {
  const gpu = selectedPart("gpu");
  const pcCase = selectedPart("case");
  if (!gpu || !pcCase) {
    return {
      id: "gpu-length",
      title: "显卡长度 / 机箱限长",
      status: "pending",
      summary: "等待选择显卡与机箱",
      detail: "选择显卡和机箱后比对物理长度。"
    };
  }
  const length = Number(gpu.modelParams?.length ?? gpu.compat?.maxCaseLength);
  const limit = Number(pcCase.compat?.maxGpuLength ?? pcCase.compat?.maxCaseLength);
  if (!Number.isFinite(length) || !Number.isFinite(limit)) {
    return {
      id: "gpu-length",
      title: "显卡长度 / 机箱限长",
      status: "pending",
      summary: "缺少长度数据",
      detail: "当前配件数据未提供完整显卡长度或机箱限长。"
    };
  }
  const pass = length <= limit;
  const overflow = Math.max(0, length - limit);
  const gpuOptions = alternativeParts(
    "gpu",
    (part) => Number(part.modelParams?.length ?? part.compat?.maxCaseLength) <= limit,
    gpu.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => Number(part.compat?.maxGpuLength ?? part.compat?.maxCaseLength) >= length,
    pcCase.id
  );
  return {
    id: "gpu-length",
    title: "显卡长度 / 机箱限长",
    status: pass ? "pass" : "fail",
    summary: pass ? "长度可安装" : "显卡超出机箱限长",
    detail: pass
      ? `显卡长 ${formatMm(length)}，机箱限长 ${formatMm(limit)}，可以安装。`
      : `显卡长 ${formatMm(length)}，机箱限长 ${formatMm(limit)}，超出 ${formatMm(overflow)}。${suggestionText(gpuOptions, caseOptions, "请换更短显卡或更大机箱。")}`
  };
}

function checkGpuThickness() {
  const gpu = selectedPart("gpu");
  const pcCase = selectedPart("case");
  if (!gpu || !pcCase) {
    return {
      id: "gpu-thickness",
      title: "显卡厚度 / 机箱槽位",
      status: "pending",
      summary: "等待选择显卡与机箱",
      detail: "选择显卡和机箱后比对厚度与可用槽位。"
    };
  }
  const thickness = Number(gpu.modelParams?.thickness);
  const limit = Number(pcCase.compat?.maxGpuThickness);
  if (!Number.isFinite(thickness) || !Number.isFinite(limit)) {
    return {
      id: "gpu-thickness",
      title: "显卡厚度 / 机箱槽位",
      status: "pending",
      summary: "缺少厚度数据",
      detail: "当前配件数据未提供完整显卡厚度或机箱槽位限制。"
    };
  }
  const pass = thickness <= limit;
  const gpuOptions = alternativeParts(
    "gpu",
    (part) => Number(part.modelParams?.thickness) <= limit,
    gpu.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => Number(part.compat?.maxGpuThickness) >= thickness,
    pcCase.id
  );
  return {
    id: "gpu-thickness",
    title: "显卡厚度 / 机箱槽位",
    status: pass ? "pass" : "fail",
    summary: pass ? "厚度可安装" : "显卡过厚",
    detail: pass
      ? `显卡厚 ${slotText(thickness)}，机箱支持 ≤ ${slotText(limit)}，不会顶到侧板。`
      : `显卡厚 ${slotText(thickness)}，机箱支持 ≤ ${slotText(limit)}，会顶到侧板或占用过多槽位。${suggestionText(gpuOptions, caseOptions, "请换更薄显卡或更大机箱。")}`
  };
}

function checkMemoryType() {
  const memory = selectedPart("memory");
  const motherboard = selectedPart("motherboard");
  if (!memory || !motherboard) {
    return {
      id: "memory-type",
      title: "内存类型 / 主板支持",
      status: "pending",
      summary: "等待选择内存与主板",
      detail: "选择内存和主板后比对 DDR5 / DDR4 类型。"
    };
  }
  const memoryType = memory.compat?.memoryType;
  const boardType = motherboard.compat?.memoryType;
  if (!memoryType || !boardType) {
    return {
      id: "memory-type",
      title: "内存类型 / 主板支持",
      status: "pending",
      summary: "内存类型待确认",
      detail: "当前配件数据未提供完整的内存或主板内存类型。"
    };
  }
  const pass = memoryType === boardType;
  if (pass) {
    return {
      id: "memory-type",
      title: "内存类型 / 主板支持",
      status: "pass",
      summary: "内存类型匹配",
      detail: `${memory.name} 与 ${motherboard.name} 都使用 ${memoryType}。`
    };
  }
  const memoryOptions = alternativeParts(
    "memory",
    (part) => part.compat?.memoryType === boardType,
    memory.id
  );
  const boardOptions = alternativeParts(
    "motherboard",
    (part) => part.compat?.memoryType === memoryType,
    motherboard.id
  );
  return {
    id: "memory-type",
    title: "内存类型 / 主板支持",
    status: "fail",
    summary: "内存类型不匹配",
    detail: `${memory.name} 是 ${memoryType}，${motherboard.name} 只支持 ${boardType}。${suggestionText(memoryOptions, boardOptions, `请换 ${boardType} 内存或支持 ${memoryType} 的主板。`)}`
  };
}

function checkPsuLength() {
  const psu = selectedPart("psu");
  const pcCase = selectedPart("case");
  if (!psu || !pcCase) {
    return {
      id: "psu-length",
      title: "电源长度 / 机箱电源仓",
      status: "pending",
      summary: "等待选择电源与机箱",
      detail: "选择电源和机箱后比对电源长度。"
    };
  }
  const length = Number(psu.modelParams?.length);
  const maxLength = Number(pcCase.compat?.maxPsuLength);
  if (!Number.isFinite(length) || !Number.isFinite(maxLength)) {
    return {
      id: "psu-length",
      title: "电源长度 / 机箱电源仓",
      status: "pending",
      summary: "电源长度待确认",
      detail: "当前配件数据未提供完整的电源长度或机箱电源仓限制。"
    };
  }
  const pass = length <= maxLength;
  const caseOptions = pass ? [] : alternativeParts(
    "case",
    (part) => Number(part.compat?.maxPsuLength) >= length,
    pcCase.id
  );
  const psuOptions = pass ? [] : alternativeParts(
    "psu",
    (part) => Number(part.modelParams?.length) <= maxLength,
    psu.id
  );
  return {
    id: "psu-length",
    title: "电源长度 / 机箱电源仓",
    status: pass ? "pass" : "fail",
    summary: pass ? "电源长度可用" : "电源过长",
    detail: pass
      ? `${psu.name} 长 ${length}mm，机箱支持最长 ${maxLength}mm。`
      : `${psu.name} 长 ${length}mm，超过 ${pcCase.name} 的 ${maxLength}mm 电源仓限制。${suggestionText(psuOptions, caseOptions, "请换更短电源或电源仓更大的机箱。")}`
  };
}

function checkM2Fit() {
  const storage = selectedPart("storage");
  const motherboard = selectedPart("motherboard");
  if (!storage || !motherboard) {
    return {
      id: "m2-fit",
      title: "M.2 长度 / key",
      status: "pending",
      summary: "等待选择存储与主板",
      detail: "选择 M.2 存储和主板后检查长度与 key。"
    };
  }
  if (storage.compat?.interface !== "M.2") {
    return {
      id: "m2-fit",
      title: "M.2 长度 / key",
      status: "pass",
      summary: "SATA 不需要 M.2 槽位",
      detail: `${storage.name} 使用 SATA，不占用 M.2 长度或 key。`
    };
  }
  const length = Number(storage.compat?.m2Length);
  const key = storage.compat?.m2Key;
  const maxLengths = motherboard.modelParams?.m2Lengths;
  const boardKey = motherboard.modelParams?.m2Key;
  if (!Number.isFinite(length) || !key || !Array.isArray(maxLengths) || !boardKey) {
    return {
      id: "m2-fit",
      title: "M.2 长度 / key",
      status: "pending",
      summary: "M.2 长度或 key 待确认",
      detail: "当前配件数据未提供完整的 M.2 长度或 key。"
    };
  }
  const lengthPass = maxLengths.includes(length);
  const keyPass = key === boardKey;
  const pass = lengthPass && keyPass;
  return {
    id: "m2-fit",
    title: "M.2 长度 / key",
    status: pass ? "pass" : "fail",
    summary: pass ? "M.2 长度与 key 匹配" : "M.2 不兼容",
    detail: pass
      ? `${storage.name} 为 ${length} / ${key} key，主板支持该规格。`
      : `${storage.name} 为 ${length} / ${key} key；${motherboard.name} 支持 ${maxLengths.join(" / ")} / ${boardKey} key。请换匹配的 M.2 或主板。`
  };
}

function checkPsuWattage() {
  const cpu = selectedPart("cpu");
  const gpu = selectedPart("gpu");
  const psu = selectedPart("psu");
  if (!cpu || !gpu || !psu) {
    return {
      id: "psu-wattage",
      title: "电源功率 / CPU + 显卡功耗",
      status: "pending",
      summary: "等待选择 CPU、显卡与电源",
      detail: "按 (CPU 功耗 + 显卡功耗) × 1.3 计算建议功率。"
    };
  }
  const cpuPower = Number(cpu.compat?.powerWatt);
  const gpuPower = Number(gpu.compat?.powerWatt);
  const wattage = Number(psu.compat?.wattage);
  if (![cpuPower, gpuPower, wattage].every(Number.isFinite)) {
    return {
      id: "psu-wattage",
      title: "电源功率 / CPU + 显卡功耗",
      status: "pending",
      summary: "缺少功耗数据",
      detail: "当前配件数据未提供完整功耗字段。"
    };
  }
  const required = Math.ceil((cpuPower + gpuPower) * 1.3);
  const suggested = suggestedPsuWattage(required);
  const pass = wattage >= required;
  const psuOptions = alternativeParts(
    "psu",
    (part) => Number(part.compat?.wattage) >= suggested,
    psu.id
  );
  return {
    id: "psu-wattage",
    title: "电源功率 / CPU + 显卡功耗",
    status: pass ? "pass" : "fail",
    summary: pass ? "额定功率充足" : "电源功率不足",
    detail: pass
      ? `整机建议 ${required}W，当前电源 ${wattage}W，功率充足。`
      : `整机建议 ${required}W（CPU ${cpuPower}W + 显卡 ${gpuPower}W，按 1.3 倍余量），当前电源 ${wattage}W，低于建议 ${suggested}W。${suggestionText(psuOptions, [], `建议换 ${suggested}W 以上电源。`)}`
  };
}

function checkPsuConnector() {
  const gpu = selectedPart("gpu");
  const psu = selectedPart("psu");
  if (!gpu || !psu) {
    return {
      id: "psu-connector",
      title: "显卡供电 / 电源接口",
      status: "pending",
      summary: "等待选择显卡与电源",
      detail: "选择显卡和电源后检查 12VHPWR 供电接口。"
    };
  }
  const requires12vhpwr = gpu.compat?.requires12vhpwr;
  if (gpu.custom && requires12vhpwr === undefined) {
    return {
      id: "psu-connector",
      title: "显卡供电 / 电源接口",
      status: "pending",
      summary: "显卡供电待确认",
      detail: `${gpu.name} 未填写是否需要 12VHPWR。`
    };
  }
  if (!requires12vhpwr) {
    return {
      id: "psu-connector",
      title: "显卡供电 / 电源接口",
      status: "pass",
      summary: "无需 12VHPWR",
      detail: `${gpu.name} 不使用 12VHPWR，普通 PCIe 供电即可。`
    };
  }
  const connectors = psu.compat?.connectors;
  if (!connectors) {
    return {
      id: "psu-connector",
      title: "显卡供电 / 电源接口",
      status: "pending",
      summary: "缺少电源接口数据",
      detail: "当前电源数据未提供 12VHPWR 接口数量。"
    };
  }
  const count = Number(connectors["12vhpwr"] || 0);
  const pass = count > 0;
  const psuOptions = alternativeParts(
    "psu",
    (part) => Number(part.compat?.connectors?.["12vhpwr"] || 0) > 0,
    psu.id
  );
  const gpuOptions = alternativeParts(
    "gpu",
    (part) => !part.compat?.requires12vhpwr,
    gpu.id
  );
  return {
    id: "psu-connector",
    title: "显卡供电 / 电源接口",
    status: pass ? "pass" : "fail",
    summary: pass ? "12VHPWR 可用" : "电源缺少 12VHPWR",
    detail: pass
      ? `${gpu.name} 需要 12VHPWR，${psu.name} 提供 ${count} 个接口。`
      : `${gpu.name} 需要 12VHPWR，${psu.name} 没有 12VHPWR 接口。${suggestionText(psuOptions, gpuOptions, "请换带 12VHPWR 的电源。")}`
  };
}

function checkCoolerHeight() {
  const cooler = selectedPart("cooler");
  const pcCase = selectedPart("case");
  if (!cooler || !pcCase) {
    return {
      id: "cooler-height",
      title: "散热器高度 / 机箱限高",
      status: "pending",
      summary: "等待选择散热器与机箱",
      detail: "选择散热器和机箱后比对散热器高度。"
    };
  }
  const height = Number(cooler.modelParams?.height ?? cooler.compat?.height);
  const limit = Number(pcCase.compat?.maxCoolerHeight);
  if (!Number.isFinite(height) || !Number.isFinite(limit)) {
    return {
      id: "cooler-height",
      title: "散热器高度 / 机箱限高",
      status: "pending",
      summary: "缺少高度数据",
      detail: "当前配件数据未提供完整散热器高度或机箱限高。"
    };
  }
  const pass = height <= limit;
  const coolerOptions = alternativeParts(
    "cooler",
    (part) => Number(part.modelParams?.height ?? part.compat?.height) <= limit,
    cooler.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => Number(part.compat?.maxCoolerHeight) >= height,
    pcCase.id
  );
  return {
    id: "cooler-height",
    title: "散热器高度 / 机箱限高",
    status: pass ? "pass" : "fail",
    summary: pass ? "高度可安装" : "散热器超高",
    detail: pass
      ? `散热器高 ${formatMm(height)}，机箱限高 ${formatMm(limit)}，可以盖上侧板。`
      : `散热器高 ${formatMm(height)}，机箱限高 ${formatMm(limit)}，盖不上侧板。${suggestionText(coolerOptions, caseOptions, "请换更矮散热器或更高机箱。")}`
  };
}

function checkRadiatorSize() {
  const cooler = selectedPart("cooler");
  const pcCase = selectedPart("case");
  if (!cooler || !pcCase) {
    return {
      id: "radiator-size",
      title: "冷排规格 / 机箱支持",
      status: "pending",
      summary: "等待选择散热器与机箱",
      detail: "选择水冷散热器和机箱后比对冷排规格。"
    };
  }
  const rawRadiatorSize = cooler.modelParams?.radiatorSize;
  const radiatorSize = Number(rawRadiatorSize);
  const supported = pcCase.compat?.supportedRadiatorSizes;
  if (
    rawRadiatorSize === undefined ||
    rawRadiatorSize === null ||
    rawRadiatorSize === "" ||
    !Number.isFinite(radiatorSize) ||
    !Array.isArray(supported)
  ) {
    return {
      id: "radiator-size",
      title: "冷排规格 / 机箱支持",
      status: "pending",
      summary: "冷排数据待确认",
      detail: "当前配件数据未提供完整冷排规格或机箱支持列表。"
    };
  }
  if (radiatorSize <= 0) {
    return {
      id: "radiator-size",
      title: "冷排规格 / 机箱支持",
      status: "pass",
      summary: "风冷无需冷排",
      detail: "当前散热器为风冷，不使用冷排。"
    };
  }
  const pass = supported.includes(radiatorSize);
  const waterOptions = alternativeParts(
    "cooler",
    (part) => {
      const size = Number(part.modelParams?.radiatorSize ?? 0);
      return size > 0 && size < radiatorSize && supported.includes(size);
    },
    cooler.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => (part.compat?.supportedRadiatorSizes || []).includes(radiatorSize),
    pcCase.id
  );
  const supportedText = supported.length ? supported.join(" / ") : "无 240 / 280 / 360";
  const waterNames = waterOptions.map((part) => part.name).join(" / ");
  const caseNames = caseOptions.map((part) => part.name).join(" / ");
  const smallerSizes = supported.filter((size) => Number(size) < radiatorSize);
  const swaps = [
    waterNames
      ? `可换：${waterNames}`
      : smallerSizes.length
        ? `可换：${smallerSizes.join(" / ")} 水冷`
        : "可换：风冷"
  ];
  if (caseNames) swaps.push(`或换：${caseNames}`);
  return {
    id: "radiator-size",
    title: "冷排规格 / 机箱支持",
    status: pass ? "pass" : "fail",
    summary: pass ? "冷排可安装" : "冷排规格不兼容",
    detail: pass
      ? `散热器为 ${radiatorSize} 冷排，机箱支持 ${supportedText} 冷排。`
      : `散热器为 ${radiatorSize} 冷排，机箱${supported.length ? `仅支持 ${supportedText} 冷排` : "未提供 240 / 280 / 360 冷排安装位"}，装不下。${swaps.join("；")}。`
  };
}

const FAN_POSITION_LABELS = {
  front: "前部",
  top: "顶部",
  rear: "后部"
};

/* Return null when fan/case slot data is incomplete, otherwise
   { fits, detail } with the first physical conflict. */
function fanFitsCase(fan, pcCase) {
  const slots = pcCase?.compat?.fanSlots;
  const quantity = Number(fan?.compat?.quantity ?? fan?.modelParams?.quantity ?? 0);
  const size = Number(fan?.compat?.size ?? fan?.modelParams?.size ?? 0);
  if (!Array.isArray(slots) || !quantity || !size) return null;
  const positions = Array.isArray(fan.modelParams?.positions)
    ? fan.modelParams.positions
    : [];
  if (fan.custom && !positions.length) return null;
  if (pcCase.custom && !slots.length) return null;
  if (!positions.length) {
    const total = slots
      .filter((slot) => Array.isArray(slot.sizes) && slot.sizes.includes(size))
      .reduce((sum, slot) => sum + Number(slot.count || 0), 0);
    return total >= quantity
      ? { fits: true, detail: `${quantity} 把 ${size}mm 风扇有机箱位可用。` }
      : { fits: false, detail: `需要 ${quantity} 个 ${size}mm 位，机箱只有 ${total} 个。` };
  }
  const required = {};
  positions.forEach((position) => { required[position] = (required[position] || 0) + 1; });
  for (const [position, count] of Object.entries(required)) {
    const label = FAN_POSITION_LABELS[position] || position;
    const slot = slots.find((item) => item.position === position);
    if (pcCase.custom && (!slot || !Number.isFinite(Number(slot.count)))) return null;
    if (!slot || !Array.isArray(slot.sizes) || !slot.sizes.includes(size)) {
      return { fits: false, detail: `机箱${label}不支持 ${size}mm 风扇。` };
    }
    if (count > Number(slot.count || 0)) {
      return {
        fits: false,
        detail: `机箱${label}只有 ${slot.count} 个 ${size}mm 位，需要 ${count} 个。`
      };
    }
  }
  return { fits: true, detail: `机箱${positions.map((position) => FAN_POSITION_LABELS[position] || position).join(" / ")}的 ${size}mm 位足够。` };
}

const RADIATOR_POSITION_LABELS = {
  front: "前部",
  top: "顶部",
  side: "侧面"
};

function normalizeRadiatorPosition(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["front", "前", "前部"].includes(normalized)) return "front";
  if (["top", "顶", "顶部"].includes(normalized)) return "top";
  if (["side", "侧", "侧面"].includes(normalized)) return "side";
  return "";
}

function radiatorPositionLabel(value) {
  return value ? RADIATOR_POSITION_LABELS[value] : "不限";
}

function setRadiatorPosition(value) {
  clearClearUndo();
  state.radiatorPosition = normalizeRadiatorPosition(value);
  renderSummary();
  persistBuild();
}

function checkRadiatorPosition() {
  const cooler = selectedPart("cooler");
  const pcCase = selectedPart("case");
  if (!cooler || !pcCase) {
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: "pending",
      summary: "等待选择散热器与机箱",
      detail: "选择水冷散热器和机箱后比对冷排安装位置。"
    };
  }
  const rawRadiatorSize = cooler.modelParams?.radiatorSize;
  const radiatorSize = Number(rawRadiatorSize);
  if (
    rawRadiatorSize === undefined ||
    rawRadiatorSize === null ||
    rawRadiatorSize === "" ||
    !Number.isFinite(radiatorSize)
  ) {
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: "pending",
      summary: "冷排数据待确认",
      detail: "当前散热器未提供冷排规格，无法判断安装位置。"
    };
  }
  if (radiatorSize <= 0) {
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: "pass",
      summary: "风冷无需冷排位置",
      detail: "当前散热器为风冷，不使用冷排。"
    };
  }
  const rawPosition = state.radiatorPosition || cooler.modelParams?.radiatorPosition;
  const position = normalizeRadiatorPosition(rawPosition);
  const positions = pcCase.compat?.radiatorPositions;
  const supported = pcCase.compat?.supportedRadiatorSizes;
  if (!Array.isArray(supported)) {
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: "pending",
      summary: "缺少机箱冷排数据",
      detail: "当前机箱数据未提供冷排支持列表。"
    };
  }
  if (!String(rawPosition || "").trim()) {
    const pass = supported.includes(radiatorSize);
    const caseOptions = alternativeParts(
      "case",
      (part) => (part.compat?.supportedRadiatorSizes || []).includes(radiatorSize),
      pcCase.id
    );
    const coolerOptions = alternativeParts(
      "cooler",
      (part) => {
        const size = Number(part.modelParams?.radiatorSize ?? 0);
        return size > 0 && size < radiatorSize && supported.includes(size);
      },
      cooler.id
    );
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: pass ? "pass" : "fail",
      summary: pass ? "安装位置可用" : "冷排位置不兼容",
      detail: pass
        ? `${radiatorSize} 冷排未指定位置，机箱任一位置支持该规格。`
        : `${radiatorSize} 冷排未指定位置，机箱任一位置都不支持该规格。${suggestionText(coolerOptions, caseOptions, "请换更小冷排或支持该规格的机箱。")}`
    };
  }
  if (!position) {
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: "pending",
      summary: "无法识别冷排位置",
      detail: "散热器 radiatorPosition 不是前 / 顶 / 侧。"
    };
  }
  const hasPositionData = positions && typeof positions === "object" && Object.keys(positions).length > 0;
  if (pcCase.custom && !hasPositionData) {
    return {
      id: "radiator-position",
      title: "冷排位置 / 机箱安装位",
      status: "pending",
      summary: "机箱冷排位置待确认",
      detail: "自定义机箱未填写冷排位置，无法判断该位置是否支持。"
    };
  }
  const positionList = hasPositionData && Array.isArray(positions[position]) ? positions[position] : [];
  const pass = hasPositionData ? positionList.includes(radiatorSize) : supported.includes(radiatorSize);
  const label = RADIATOR_POSITION_LABELS[position];
  const coolerOptions = alternativeParts(
    "cooler",
    (part) => {
      const size = Number(part.modelParams?.radiatorSize ?? 0);
      if (!(size > 0 && size < radiatorSize)) return false;
      return hasPositionData
        ? Array.isArray(positions[position]) && positions[position].includes(size)
        : supported.includes(size);
    },
    cooler.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => {
      const casePositions = part.compat?.radiatorPositions;
      if (casePositions && Array.isArray(casePositions[position])) {
        return casePositions[position].includes(radiatorSize);
      }
      return (part.compat?.supportedRadiatorSizes || []).includes(radiatorSize);
    },
    pcCase.id
  );
  const listText = positionList.length ? positionList.join(" / ") : "没有冷排位";
  return {
    id: "radiator-position",
    title: "冷排位置 / 机箱安装位",
    status: pass ? "pass" : "fail",
    summary: pass ? "安装位置可用" : "冷排位置不兼容",
    detail: pass
      ? hasPositionData
        ? `${radiatorSize} 冷排安装在${label}，机箱${label}支持 ${positionList.join(" / ")}。`
        : `${radiatorSize} 冷排未指定位置，机箱任一位置支持该规格。`
      : `${radiatorSize} 冷排只能装在${label}，该机箱${label}不支持 ${radiatorSize} 冷排（${listText}）。${suggestionText(coolerOptions, caseOptions, `请换${label}支持 ${radiatorSize} 的机箱或更小冷排。`)}`
  };
}

function checkRadiatorClearance() {
  const cooler = selectedPart("cooler");
  const pcCase = selectedPart("case");
  if (!cooler || !pcCase) {
    return {
      id: "radiator-clearance",
      title: "冷排厚度 / 机箱空间",
      status: "pending",
      summary: "等待选择散热器与机箱",
      detail: "选择水冷散热器和机箱后检查冷排加风扇厚度。"
    };
  }
  const radiatorSize = Number(cooler.modelParams?.radiatorSize || 0);
  if (radiatorSize <= 0) {
    return {
      id: "radiator-clearance",
      title: "冷排厚度 / 机箱空间",
      status: "pass",
      summary: "风冷无需冷排空间",
      detail: "当前散热器为风冷，不使用冷排。"
    };
  }
  const thickness = Number(cooler.modelParams?.radiatorThickness);
  const fanThickness = Number(cooler.modelParams?.radiatorFanThickness);
  const maxThickness = Number(pcCase.compat?.maxRadiatorThickness);
  if (!Number.isFinite(thickness) || !Number.isFinite(fanThickness) || !Number.isFinite(maxThickness)) {
    return {
      id: "radiator-clearance",
      title: "冷排厚度 / 机箱空间",
      status: "pending",
      summary: "冷排厚度待确认",
      detail: "当前配件数据未提供完整的冷排厚度或机箱空间。"
    };
  }
  const total = thickness + fanThickness;
  const pass = total <= maxThickness;
  return {
    id: "radiator-clearance",
    title: "冷排厚度 / 机箱空间",
    status: pass ? "pass" : "fail",
    summary: pass ? "冷排厚度可用" : "冷排过厚",
    detail: pass
      ? `${radiatorSize} 冷排 ${thickness}mm + 风扇 ${fanThickness}mm = ${total}mm，机箱空间 ${maxThickness}mm。`
      : `${radiatorSize} 冷排 ${thickness}mm + 风扇 ${fanThickness}mm = ${total}mm，超过机箱 ${maxThickness}mm 空间。请换薄冷排或更大机箱。`
  };
}

function checkFanSlots() {
  const fan = selectedPart("casefan");
  const pcCase = selectedPart("case");
  if (!fan || !pcCase) {
    return {
      id: "fan-slots",
      title: "机箱风扇 / 安装位",
      status: "pending",
      summary: "等待选择风扇与机箱",
      detail: "选择机箱风扇和机箱后比对数量、尺寸与安装位置。"
    };
  }
  const result = fanFitsCase(fan, pcCase);
  if (!result) {
    return {
      id: "fan-slots",
      title: "机箱风扇 / 安装位",
      status: "pending",
      summary: "缺少风扇位数据",
      detail: "当前配件数据未提供完整风扇数量、尺寸或机箱安装位。"
    };
  }
  const fanOptions = alternativeParts(
    "casefan",
    (part) => fanFitsCase(part, pcCase)?.fits === true,
    fan.id
  );
  const caseOptions = alternativeParts(
    "case",
    (part) => fanFitsCase(fan, part)?.fits === true,
    pcCase.id
  );
  return {
    id: "fan-slots",
    title: "机箱风扇 / 安装位",
    status: result.fits ? "pass" : "fail",
    summary: result.fits ? "风扇位足够" : "风扇安装位不足",
    detail: result.fits
      ? `${fan.name}：${result.detail}`
      : `${fan.name}：${result.detail}${suggestionText(fanOptions, caseOptions, "请换数量/尺寸匹配的风扇或机箱。")}`
  };
}

function checkMemoryHeight() {
  const memory = selectedPart("memory");
  const cooler = selectedPart("cooler");
  if (!memory || !cooler) {
    return {
      id: "memory-height",
      title: "内存高度 / 散热器避让",
      status: "pending",
      summary: "等待选择内存与散热器",
      detail: "选择内存和散热器后比对马甲高度与内存避让空间。"
    };
  }
  const height = Number(memory.modelParams?.height ?? memory.compat?.height);
  const clearance = Number(cooler.compat?.memoryClearance);
  if (!Number.isFinite(height) || !Number.isFinite(clearance)) {
    return {
      id: "memory-height",
      title: "内存高度 / 散热器避让",
      status: "pending",
      summary: "缺少高度数据",
      detail: "当前配件数据未提供完整内存高度或散热器避让空间。"
    };
  }
  const pass = height <= clearance;
  const memoryOptions = alternativeParts(
    "memory",
    (part) => Number(part.modelParams?.height ?? part.compat?.height) <= clearance,
    memory.id
  );
  const coolerOptions = alternativeParts(
    "cooler",
    (part) => Number(part.compat?.memoryClearance) >= height,
    cooler.id
  );
  return {
    id: "memory-height",
    title: "内存高度 / 散热器避让",
    status: pass ? "pass" : "fail",
    summary: pass ? "内存可避让" : "内存与散热器冲突",
    detail: pass
      ? `内存马甲高 ${formatMm(height)}，散热器避让 ${formatMm(clearance)}，可以安装。`
      : `内存马甲高 ${formatMm(height)}，散热器仅避让 ${formatMm(clearance)}，风扇会压住内存。${suggestionText(memoryOptions, coolerOptions, "请换更矮内存或换水冷/高避让散热器。")}`
  };
}

function checkPcie8Count() {
  const gpu = selectedPart("gpu");
  const psu = selectedPart("psu");
  if (!gpu || !psu) {
    return {
      id: "pcie8-count",
      title: "PCIe 8pin / 电源接口",
      status: "pending",
      summary: "等待选择显卡与电源",
      detail: "选择显卡和电源后检查 PCIe 8pin 数量。"
    };
  }
  const required = gpu.compat?.pcie8;
  const available = psu.compat?.connectors?.pcie8;
  if (!Number.isFinite(Number(required)) || !Number.isFinite(Number(available))) {
    return {
      id: "pcie8-count",
      title: "PCIe 8pin / 电源接口",
      status: "pending",
      summary: "PCIe 8pin 数量待确认",
      detail: "当前配件数据未提供完整的 PCIe 8pin 数量。"
    };
  }
  if (Number(required) <= 0) {
    return {
      id: "pcie8-count",
      title: "PCIe 8pin / 电源接口",
      status: "pass",
      summary: "无需 PCIe 8pin",
      detail: `${gpu.name} 不需要额外的 PCIe 8pin 供电。`
    };
  }
  const pass = Number(available) >= Number(required);
  return {
    id: "pcie8-count",
    title: "PCIe 8pin / 电源接口",
    status: pass ? "pass" : "fail",
    summary: pass ? "PCIe 8pin 数量足够" : "PCIe 8pin 不足",
    detail: pass
      ? `${gpu.name} 需要 ${required} 个 PCIe 8pin，${psu.name} 提供 ${available} 个。`
      : `${gpu.name} 需要 ${required} 个 PCIe 8pin，${psu.name} 只有 ${available} 个。请换电源或显卡。`
  };
}

function checkStorageInterface() {
  const storage = selectedPart("storage");
  const motherboard = selectedPart("motherboard");
  if (!storage || !motherboard) {
    return {
      id: "storage-interface",
      title: "存储接口 / 主板接口",
      status: "pending",
      summary: "等待选择存储与主板",
      detail: "选择存储和主板后检查 M.2 插槽或 SATA 接口。"
    };
  }
  const iface = storage.compat?.interface;
  const m2Slots = Number(motherboard.modelParams?.m2Slots);
  const sataPorts = Number(motherboard.modelParams?.sataPorts);
  if (!iface || !Number.isFinite(m2Slots) || !Number.isFinite(sataPorts)) {
    return {
      id: "storage-interface",
      title: "存储接口 / 主板接口",
      status: "pending",
      summary: "缺少接口数据",
      detail: "当前配件数据未提供完整存储接口或主板接口数量。"
    };
  }
  const count = iface === "M.2" ? m2Slots : iface === "SATA" ? sataPorts : 0;
  const pass = count > 0;
  const otherIface = iface === "M.2" ? "SATA" : "M.2";
  const otherCount = otherIface === "M.2" ? m2Slots : sataPorts;
  const storageOptions = alternativeParts(
    "storage",
    (part) => {
      const partIface = part.compat?.interface;
      return partIface === "M.2" ? m2Slots > 0 : partIface === "SATA" ? sataPorts > 0 : false;
    },
    storage.id
  );
  const boardOptions = alternativeParts(
    "motherboard",
    (part) => (iface === "M.2" ? Number(part.modelParams?.m2Slots) : Number(part.modelParams?.sataPorts)) > 0,
    motherboard.id
  );
  return {
    id: "storage-interface",
    title: "存储接口 / 主板接口",
    status: pass ? "pass" : "fail",
    summary: pass ? "接口可用" : `${iface} 接口不足`,
    detail: pass
      ? `${storage.name} 使用 ${iface}，${motherboard.name} 提供 ${count} 个可用接口。`
      : `${storage.name} 使用 ${iface}，${motherboard.name} 没有可用 ${iface} 接口${otherCount > 0 ? `（另有 ${otherIface} 接口）` : ""}。${suggestionText(storageOptions, boardOptions, `请换 ${otherIface} 存储或支持 ${iface} 的主板。`)}`
  };
}

const CHECK_AFFECTED = {
  "cpu-socket": ["cpu", "motherboard"],
  "cooler-socket": ["cooler", "cpu", "motherboard"],
  "form-factor": ["motherboard", "case"],
  "gpu-length": ["gpu", "case"],
  "gpu-thickness": ["gpu", "case"],
  "cooler-height": ["cooler", "case"],
  "radiator-size": ["cooler", "case"],
  "radiator-position": ["cooler", "case"],
  "radiator-clearance": ["cooler", "case"],
  "fan-slots": ["casefan", "case"],
  "memory-height": ["memory", "cooler"],
  "memory-type": ["memory", "motherboard"],
  "psu-length": ["psu", "case"],
  "psu-wattage": ["psu", "cpu", "gpu"],
  "psu-connector": ["psu", "gpu"],
  "pcie8-count": ["psu", "gpu"],
  "storage-interface": ["storage", "motherboard"],
  "m2-fit": ["storage", "motherboard"]
};

function compatibilityChecks() {
  const checks = [
    checkCpuSocket(),
    checkCoolerSocket(),
    checkFormFactor(),
    checkGpuLength(),
    checkGpuThickness(),
    checkCoolerHeight(),
    checkRadiatorSize(),
    checkRadiatorPosition(),
    checkRadiatorClearance(),
    checkFanSlots(),
    checkMemoryHeight(),
    checkMemoryType(),
    checkPsuLength(),
    checkPsuWattage(),
    checkPsuConnector(),
    checkPcie8Count(),
    checkStorageInterface(),
    checkM2Fit()
  ];
  return checks.map((check) => ({ ...check, affected: CHECK_AFFECTED[check.id] || [] }));
}

/* ----------------------------------------------------------------
   08. 右侧配置单与检查结果
   ---------------------------------------------------------------- */
function renderSummary() {
  const count = selectedCount();
  const checks = compatibilityChecks();
  const conflicts = new Set(
    checks
      .filter((check) => check.status === "fail")
      .flatMap((check) => check.affected || [])
  );
  dom.selectedCount.textContent = `${count} / ${CATEGORIES.length}`;
  dom.totalPrice.textContent = priceText(totalPrice());
  dom.clearBuild.disabled = count === 0;
  if (dom.copyShare) dom.copyShare.disabled = count === 0;
  if (dom.copyExport) dom.copyExport.disabled = count === 0;

  dom.selectionList.innerHTML = CATEGORIES.map((category) => {
    const part = selectedPart(category.id);
    const conflict = !!part && conflicts.has(category.id);
    const custom = !!part?.custom;
    const row = `
      <div class="selection-row ${conflict ? "is-conflict" : ""} ${custom ? "is-custom" : ""}" data-category="${category.id}" ${conflict ? 'data-conflict="true"' : ""} ${custom ? 'data-custom="true"' : ""}>
        <span class="selection-category">${category.label}${conflict ? '<i class="selection-conflict" title="存在兼容问题，查看右侧检查">!</i>' : ""}</span>
        <span class="selection-value ${part ? "" : "is-empty"}"${part ? ` title="${escapeHtml(part.name)}"` : ""}>${custom ? `<i class="custom-mark">${part.source === "share" ? "分享导入" : "未审核"}</i>` : ""}${part ? escapeHtml(part.name) : "未选择"}</span>
        <button
          class="remove-button ${part ? "" : "is-hidden"}"
          type="button"
          data-remove="${category.id}"
          aria-label="取消选择${category.label}"
        >×</button>
      </div>`;
    if (category.id !== "cooler" || !part || Number(part.modelParams?.radiatorSize || 0) <= 0) {
      return row;
    }
    const currentPosition = state.radiatorPosition || "";
    const options = [
      ["", "不限"],
      ["front", "前部"],
      ["top", "顶部"],
      ["side", "侧面"]
    ];
    return `${row}
      <div class="radiator-position-row">
        <span class="selection-category">安装位置</span>
        <div class="radiator-position-options" role="group" aria-label="冷排安装位置">
          ${options.map(([value, label]) => `
            <button
              type="button"
              class="radiator-position-button ${currentPosition === value ? "is-active" : ""}"
              data-radiator-position="${value}"
              aria-pressed="${currentPosition === value ? "true" : "false"}"
            >${label}</button>`).join("")}
        </div>
      </div>`;
  }).join("");

  renderCompatibility(checks);
  updatePreviewForSelection();
}

function renderCompatibility(checks = compatibilityChecks()) {
  const fails = checks.filter((check) => check.status === "fail");
  const passes = checks.filter((check) => check.status === "pass");
  const pending = checks.filter((check) => check.status === "pending");
  const count = selectedCount();

  const counts = `${passes.length} 项通过 / ${pending.length} 项待确认 / ${fails.length} 项失败`;
  if (dom.compatTopCounts) {
    dom.compatTopCounts.innerHTML = `
      <span class="is-pass"><b>${passes.length}</b> 通过</span>
      <span class="is-pending"><b>${pending.length}</b> 待确认</span>
      <span class="is-fail"><b>${fails.length}</b> 失败</span>`;
  }
  let status = "pending";
  let stateLabel = "待选择";
  let overallTitle = "继续选择配件";
  let overallText = `${counts}。选齐相关配件后自动更新。`;

  if (fails.length) {
    status = "fail";
    stateLabel = "不兼容";
    overallTitle = `发现 ${fails.length} 项不兼容`;
    overallText = `${counts}。${fails.map((check) => check.summary).join("；")}。`;
  } else if (pending.length) {
    status = "pending";
    stateLabel = count === CATEGORIES.length ? "待确认" : "待补全";
    overallTitle = `${passes.length} 项通过 / ${pending.length} 项待确认`;
    overallText = `${counts}。${count === CATEGORIES.length ? "请补全自定义件的未知字段后再确认。" : "继续补齐配置单中的其余品类。"}`;
  } else {
    status = count === CATEGORIES.length ? "pass" : "pending";
    stateLabel = status === "pass" ? "通过" : "待补全";
    overallTitle = status === "pass" ? "配置兼容性检查通过" : `${passes.length} 项检查已通过`;
    overallText = `${counts}。${status === "pass" ? "当前配置通过全部检查。" : "继续补齐配置单中的其余品类。"}`;
  }

  dom.compatState.textContent = stateLabel;
  dom.compatState.className = `compat-state is-${status}`;
  dom.compatOverall.className = `compat-overall is-${status}`;
  dom.compatOverall.innerHTML = `
    <span class="compat-dot"></span>
    <div><strong>${escapeHtml(overallTitle)}</strong><small>${escapeHtml(overallText)}</small></div>`;

  const renderCheck = (check) => `
    <div class="compat-item is-${check.status}">
      <span class="compat-icon">${check.status === "pass" ? "✓" : check.status === "fail" ? "!" : "·"}</span>
      <div>
        <strong>${escapeHtml(check.title)}${check.status === "fail" ? " · " + escapeHtml(check.summary) : ""}</strong>
        <small>${escapeHtml(check.detail)}</small>
      </div>
    </div>`;

  if (compatExpanded) {
    dom.compatList.innerHTML = checks.map(renderCheck).join("");
  } else if (fails.length) {
    dom.compatList.innerHTML = fails.map(renderCheck).join("");
  } else {
    const summaryStatus = pending.length ? "pending" : "pass";
    const summaryTitle = pending.length
      ? `${pending.length} 项待确认`
      : `全部 ${checks.length} 项通过 · 点击查看详情`;
    const summaryDetail = pending.length
      ? `${passes.length} 项通过 / ${fails.length} 项失败；继续补齐或确认未知字段。`
      : "点击展开查看完整检查列表。";
    const summaryAttrs = pending.length
      ? ""
      : ' data-expand-compat="true" role="button" tabindex="0"';
    dom.compatList.innerHTML = `
      <div class="compat-item is-${summaryStatus}${pending.length ? "" : " compat-summary-action"}"${summaryAttrs}>
        <span class="compat-icon">${pending.length ? "·" : "✓"}</span>
        <div>
          <strong>${summaryTitle}</strong>
          <small>${summaryDetail}</small>
        </div>
      </div>`;
  }

  if (dom.compatToggle) {
    dom.compatToggle.textContent = compatExpanded ? "收起检查" : `查看全部 ${checks.length} 项`;
    dom.compatToggle.setAttribute("aria-expanded", compatExpanded ? "true" : "false");
  }
}

function updatePreviewForSelection() {
  const hasCustom = Object.values(state.selected).some((part) => part?.custom);
  if (hasCustom) {
    updateAssemblyPreview(null, null, null, null, null, null, null);
    dom.previewStage.classList.remove("has-model");
    dom.previewStage.classList.add("is-custom");
    if (dom.previewCustomNote) dom.previewCustomNote.hidden = false;
    dom.previewState.textContent = "未建模";
    return;
  }
  dom.previewStage.classList.remove("is-custom");
  if (dom.previewCustomNote) dom.previewCustomNote.hidden = true;
  updateAssemblyPreview(
    selectedPart("gpu"),
    selectedPart("case"),
    selectedPart("motherboard"),
    selectedPart("cooler"),
    selectedPart("memory"),
    selectedPart("psu"),
    selectedPart("casefan")
  );
}

/* ----------------------------------------------------------------
   09. 选择行为
   ---------------------------------------------------------------- */
function selectCategory(categoryId) {
  if (!CATEGORY_MAP.has(categoryId)) return;
  if (categoryId !== state.active) {
    catalogFilter.query = "";
    if (dom.catalogSearch) dom.catalogSearch.value = "";
  }
  state.active = categoryId;
  renderCategories();
  renderCatalog();
}

function toggleModel(categoryId, modelId) {
  clearClearUndo();
  const category = categoryMeta(categoryId);
  const part = state.data[category.id].find((item) => item.id === modelId) || null;
  if (!part) return;

  const wasSelected = selectedPart(category.id)?.id === modelId;
  if (!wasSelected) {
    // Safety guard in addition to the gray card styling. Clicking a gray card
    // keeps the current build and explains why it cannot be selected.
    const conflict = socketConflictFor(category.id, part);
    if (conflict) {
      showToast(conflict.message);
      return;
    }
  }

  state.selected[category.id] = wasSelected ? null : part;
  if (category.id === "cooler") {
    const nextCooler = state.selected[category.id];
    if (!nextCooler || Number(nextCooler.modelParams?.radiatorSize || 0) <= 0) {
      state.radiatorPosition = "";
    }
  }
  state.active = category.id;
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
}

function removeCategory(categoryId) {
  if (!CATEGORY_MAP.has(categoryId)) return;
  clearClearUndo();
  state.selected[categoryId] = null;
  if (categoryId === "cooler") state.radiatorPosition = "";
  renderCategories();
  // CPU and motherboard gating depends on the counterpart selection, so the
  // visible catalog must be re-evaluated even when another category was removed.
  renderCatalog();
  renderSummary();
  persistBuild();
}

function clearClearUndo() {
  window.clearTimeout(clearUndoTimer);
  clearUndoTimer = 0;
  clearUndoState = null;
  if (dom.buildUndo) dom.buildUndo.hidden = true;
}

function clearBuild() {
  if (selectedCount() === 0) return;
  // 可逆操作不弹原生确认：先记下快照，清空后 30 秒内可点「撤销清空」恢复。
  clearUndoState = {
    selection: selectionMap(),
    radiatorPosition: state.radiatorPosition || ""
  };
  CATEGORIES.forEach((category) => { state.selected[category.id] = null; });
  state.radiatorPosition = "";
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
  if (dom.buildUndo) {
    dom.buildUndo.hidden = false;
    dom.buildUndo.textContent = "撤销清空";
  }
  clearUndoTimer = window.setTimeout(clearClearUndo, 30 * 1000);
  showToast("已清空配置，30 秒内可撤销", "success");
}

function undoClearBuild() {
  if (!clearUndoState) return;
  applySelectionMap(clearUndoState.selection);
  state.radiatorPosition = clearUndoState.radiatorPosition || "";
  renderCategories();
  renderCatalog();
  renderSummary();
  persistBuild();
  clearClearUndo();
  showToast("已恢复清空前的配置", "success");
}

/* ----------------------------------------------------------------
   10. 事件绑定
   ---------------------------------------------------------------- */
function bindEvents() {
  dom.presetList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    applyPreset(button.dataset.preset);
  });

  if (dom.presetUndo) dom.presetUndo.addEventListener("click", undoPreset);

  if (dom.catalogSearch) {
    dom.catalogSearch.addEventListener("input", () => {
      catalogFilter.query = dom.catalogSearch.value;
      renderCatalog();
    });
  }
  if (dom.catalogCompatible) {
    dom.catalogCompatible.addEventListener("change", () => {
      catalogFilter.compatibleOnly = dom.catalogCompatible.checked;
      renderCatalog();
    });
  }
  if (dom.catalogSort) {
    dom.catalogSort.addEventListener("change", () => {
      catalogFilter.sort = dom.catalogSort.value;
      renderCatalog();
    });
  }
  if (dom.catalogReset) {
    dom.catalogReset.addEventListener("click", () => {
      catalogFilter = { query: "", compatibleOnly: false, sort: "default" };
      if (dom.catalogSearch) dom.catalogSearch.value = "";
      if (dom.catalogCompatible) dom.catalogCompatible.checked = false;
      if (dom.catalogSort) dom.catalogSort.value = "default";
      renderCatalog();
    });
  }

  if (dom.customTrigger) {
    dom.customTrigger.addEventListener("click", () => openCustomPartForm(state.active));
  }
  if (dom.customCancel) {
    dom.customCancel.addEventListener("click", closeCustomPartForm);
  }
  if (dom.customForm) {
    dom.customForm.addEventListener("submit", submitCustomPart);
  }

  if (dom.savedConfigButton) {
    dom.savedConfigButton.addEventListener("click", openSavedConfigDialog);
  }
  if (dom.savedConfigClose) dom.savedConfigClose.addEventListener("click", closeSavedConfigDialog);
  if (dom.savedConfigSave) dom.savedConfigSave.addEventListener("click", saveCurrentConfig);
  if (dom.savedConfigExport) dom.savedConfigExport.addEventListener("click", exportSavedConfigs);
  if (dom.compareClose) dom.compareClose.addEventListener("click", () => dom.compareDialog.close());
  if (dom.savedConfigImport && dom.savedConfigFile) {
    dom.savedConfigImport.addEventListener("click", () => dom.savedConfigFile.click());
    dom.savedConfigFile.addEventListener("change", () => importSavedConfigs(dom.savedConfigFile.files?.[0]));
  }
  if (dom.savedConfigList) {
    dom.savedConfigList.addEventListener("click", (event) => {
      const load = event.target.closest("[data-saved-load]");
      if (load) {
        loadSavedConfig(load.dataset.savedLoad);
        return;
      }
      const compare = event.target.closest("[data-saved-compare]");
      if (compare) {
        compareSavedConfig(compare.dataset.savedCompare);
        return;
      }
      const remove = event.target.closest("[data-saved-delete]");
      if (remove) deleteSavedConfig(remove.dataset.savedDelete);
    });
  }

  if (dom.shareChoiceCancel) {
    dom.shareChoiceCancel.addEventListener("click", () => dom.shareChoiceDialog.close());
  }
  dom.shareChoiceDialog?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-share-mode]");
    if (!button) return;
    dom.shareChoiceDialog.close();
    copyShareConfig(button.dataset.shareMode);
  });

  dom.categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    selectCategory(button.dataset.category);
  });

  dom.modelGrid.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-custom-edit]");
    if (edit) {
      const part = state.data[state.active].find((item) => item.id === edit.dataset.customEdit);
      if (part) openCustomPartForm(state.active, part);
      return;
    }
    const remove = event.target.closest("[data-custom-delete]");
    if (remove) {
      const id = remove.dataset.customDelete;
      if (pendingCustomDelete === id) {
        window.clearTimeout(pendingCustomDeleteTimer);
        pendingCustomDelete = "";
        pendingCustomDeleteTimer = 0;
        deleteCustomPart(id);
      } else {
        // 两步删除代替原生 confirm：第一次变成「确认删除」，3 秒内再点才真删
        window.clearTimeout(pendingCustomDeleteTimer);
        pendingCustomDelete = id;
        pendingCustomDeleteTimer = window.setTimeout(() => {
          pendingCustomDelete = "";
          pendingCustomDeleteTimer = 0;
          renderCatalog();
        }, 3000);
        renderCatalog();
      }
      return;
    }
    const card = event.target.closest(".model-card");
    if (!card) return;
    toggleModel(state.active, card.dataset.id);
  });

  dom.selectionList.addEventListener("click", (event) => {
    const position = event.target.closest("[data-radiator-position]");
    if (position) {
      event.stopPropagation();
      setRadiatorPosition(position.dataset.radiatorPosition);
      return;
    }
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      event.stopPropagation();
      removeCategory(remove.dataset.remove);
      return;
    }
    const row = event.target.closest(".selection-row");
    if (row) selectCategory(row.dataset.category);
  });

  dom.clearBuild.addEventListener("click", clearBuild);
  if (dom.buildUndo) dom.buildUndo.addEventListener("click", undoClearBuild);

  if (dom.compatToggle) {
    dom.compatToggle.addEventListener("click", () => {
      compatExpanded = !compatExpanded;
      renderCompatibility();
    });
  }

  dom.compatList.addEventListener("click", (event) => {
    if (!event.target.closest("[data-expand-compat]")) return;
    compatExpanded = true;
    renderCompatibility();
  });

  dom.compatList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!event.target.closest("[data-expand-compat]")) return;
    event.preventDefault();
    compatExpanded = true;
    renderCompatibility();
  });

  if (dom.copyShare) dom.copyShare.addEventListener("click", handleCopyShare);
  if (dom.copyExport) dom.copyExport.addEventListener("click", handleCopyExport);

  if (dom.previewJump && dom.previewPanel) {
    dom.previewJump.addEventListener("click", () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      dom.previewPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  window.addEventListener("resize", () => {
    if (!previewEngine || !previewFit) return;
    previewEngine.resize();
    fitPreviewCamera();
  });
}

/* ----------------------------------------------------------------
   11. 初始化
   ---------------------------------------------------------------- */
async function init() {
  bindEvents();
  renderCategories();
  removeLegacyAccountStorage();
  try {
    await loadComponents();
    loadCustomParts();
    await loadPresets().catch((error) => {
      console.warn("[configurator] preset data unavailable", error);
      state.presets = [];
      renderPresets();
    });
    dom.loading.hidden = true;
    const restored = restoreInitialBuild();
    renderCategories();
    renderCatalog();
    renderSummary();
    if (restored.message) {
      window.setTimeout(() => showToast(restored.message, restored.tone), 350);
    }
  } catch (error) {
    console.error("[configurator]", error);
    // 这里的元素可能因为 HTML / JS 版本错位而缺失，全部走可选链：
    // 宁可少显示一句提示，也不要让整个页面白掉。
    if (dom.loading) dom.loading.hidden = true;
    if (dom.modelGrid) dom.modelGrid.hidden = true;
    if (dom.empty) dom.empty.hidden = false;
    if (dom.empty) {
      const hint = location.protocol === "file:"
        ? "请通过本地 HTTP 服务打开页面（直接双击 HTML 会被浏览器拦截 fetch）。"
        : `读取 data/*.json 失败：${error.message}`;
      dom.empty.textContent = `配件数据加载失败。${hint}`;
    }
    try {
      renderSummary();
    } catch (summaryError) {
      console.error("[configurator] summary render failed", summaryError);
    }
  }
}

init();


