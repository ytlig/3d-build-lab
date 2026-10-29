/* ------------------------------------------------------------------
   ATX FULL BUILD / 完整主机配置
   Reuses the motherboard product's part records and model factory,
   then adds chassis, panels, PSU, four fans and four cable harnesses.
   The main unlock chain is:
   side panel → GPU → RAM → cooler → CPU → motherboard → PSU → chassis
   ------------------------------------------------------------------ */
import motherboard from "./motherboard.js";

const BOARD_OFFSET = [0, 0.15, 0.05];

function offsetPosition(position) {
  return [
    (position?.[0] || 0) + BOARD_OFFSET[0],
    (position?.[1] || 0) + BOARD_OFFSET[1],
    (position?.[2] || 0) + BOARD_OFFSET[2]
  ];
}

const boardParts = new Map(motherboard.parts.map((part) => [part.id, part]));

function boardPart(id, number, overrides) {
  const base = boardParts.get(id);
  return {
    ...base,
    ...overrides,
    number,
    position: offsetPosition(base.position),
    material: "procedural",
    geometry: { type: "compound", preset: "atx-procedural" },
    fixed: false
  };
}

function newPart(data) {
  const params = {
    description: data.description,
    specs: data.specs,
    stats: data.stats,
    role: data.role,
    install: data.install,
    ...(data.params || {})
  };
  return {
    fixed: false,
    deps: [],
    material: "procedural",
    geometry: { type: "compound", preset: "desktop-procedural" },
    explodeRot: [0, 0, 0],
    ...data,
    params
  };
}

const parts = [
  newPart({
    id: "sidePanel",
    number: "01",
    name: "钢化玻璃侧板",
    en: "TEMPERED GLASS PANEL",
    category: "CHASSIS",
    short: "4 mm 钢化玻璃 · 免工具",
    description: "右侧全透钢化玻璃侧板，四周为黑色金属包边。透过玻璃可以直接看到主板、显卡、内存与走线；侧板是整机拆解的第一道入口。",
    role: "保护内部硬件并展示整机装配效果，同时承担侧向结构支撑。",
    install: "从机箱后侧卡槽滑入，四颗手拧螺丝固定。",
    position: [0, 0.05, 1.55],
    explode: [0, 0, 1.5],
    explodeDir: [0, 0, 1],
    explodeDist: 1.5,
    labelOffset: [0, 2.0, 0],
    focus: { theta: 0.56, phi: 1.19, radius: 7.4, target: [0, 0.2, 0] },
    stats: [["4 mm", "GLASS"], ["3.72", "WIDTH / M"], ["3.78", "HEIGHT / M"], ["TOOL-FREE", "INSTALL"]],
    specs: [["材质", "4 mm 钢化玻璃"], ["边框", "黑色阳极氧化铝"], ["固定", "四颗手拧螺丝"], ["开启", "后侧滑入式"]],
    params: { note: "整机拆解入口" },
    deps: []
  }),
  boardPart("gpu", "02", {
    deps: ["sidePanel"],
    description: "双风扇显卡横跨 PCIe 5.0 插槽，安装后会遮挡内存下缘。拆下侧板后才可以安全解锁显卡。",
  }),
  boardPart("ram1", "03", { deps: ["gpu"] }),
  boardPart("ram2", "04", { deps: ["gpu"] }),
  boardPart("cooler", "05", { deps: ["ram1", "ram2"] }),
  boardPart("cpu", "06", { deps: ["cooler"] }),
  boardPart("m2", "07", { deps: ["sidePanel"] }),
  boardPart("atx24", "08", { deps: ["sidePanel"] }),
  boardPart("cpu8", "09", { deps: ["sidePanel"] }),
  boardPart("board", "10", {
    deps: ["cpu", "m2", "atx24", "cpu8"],
    explode: [0, 0.24, 1.42],
    focus: { theta: 0.56, phi: 1.17, radius: 8.6, target: [0, 0.02, 0.1] }
  }),
  newPart({
    id: "psu",
    number: "11",
    name: "850W 全模组电源",
    en: "ATX 3.0 PSU",
    category: "POWER",
    short: "850 W · 80 PLUS Gold",
    description: "底部安装的 850W 全模组 ATX 3.0 电源，为 CPU、显卡、主板与存储提供独立供电。顶部为进风风扇，侧面为全模组接口区。",
    role: "把交流电转换为整机所需的 +12V / +5V / +3.3V 直流电。",
    install: "从机箱后部推入 PSU 仓，四颗螺丝固定；模组线在装机前接入。",
    position: [0.55, -1.68, 0.35],
    explode: [0, -0.7, 1.38],
    explodeDir: [0, -0.45, 0.9],
    explodeDist: 1.5,
    labelOffset: [0, 0.45, 0],
    focus: { theta: 0.48, phi: 1.18, radius: 4.0, target: [0, 0.18, 0.1] },
    stats: [["850 W", "OUTPUT"], ["GOLD", "80 PLUS"], ["ATX 3.0", "STANDARD"], ["140 mm", "FAN"]],
    specs: [["额定功率", "850 W"], ["效率", "80 PLUS Gold"], ["规范", "ATX 3.0 / PCIe 5.0"], ["散热", "140 mm FDB 风扇"], ["结构", "全模组"]],
    params: { note: "为 CPU / GPU / 主板 / SATA 供电" },
    deps: ["board"]
  }),
  newPart({
    id: "case",
    number: "12",
    name: "中塔机箱框架",
    en: "MID-TOWER CHASSIS",
    category: "CHASSIS",
    short: "ATX 中塔 · 钢架结构",
    description: "钢制中塔机箱框架，包含底板、背板、后板、主板托架、铜柱、理线孔与扩展槽。外壳保留开放式展示结构，便于拆解与观察。",
    role: "承载主板、显卡、电源、风扇与走线，并提供结构强度与风道边界。",
    install: "整机装配的最后一步；将已完成的核心硬件装入机箱框架。",
    position: [0, 0, 0],
    explode: [0, -0.85, -1.15],
    explodeDir: [0, -0.55, -0.75],
    explodeDist: 1.45,
    labelOffset: [0, 2.25, 0.55],
    focus: { theta: 0.57, phi: 1.16, radius: 9.4, target: [0, 0.1, 0.35] },
    stats: [["ATX", "FORM FACTOR"], ["4.2 mm", "STEEL"], ["7", "EXPANSION SLOTS"], ["2 × 120", "FRONT FANS"]],
    specs: [["结构", "钢制中塔"], ["主板支持", "ATX / Micro-ATX"], ["扩展槽", "7 槽"], ["理线", "背板 24 mm"], ["脚垫", "四点橡胶"]],
    params: { note: "整机结构的最终承载层" },
    deps: ["psu"]
  }),
  newPart({
    id: "frontPanel",
    number: "13",
    name: "前面板",
    en: "FRONT MESH PANEL",
    category: "CHASSIS",
    short: "冲孔网面 · 前置 I/O",
    description: "前置冲孔网面板，为两枚 120 mm 进风风扇提供低阻风道，并在顶部集成电源键、USB 与音频接口。",
    role: "保护前置风扇并引导冷空气进入机箱。",
    install: "从机箱前面板卡扣向外拆下。",
    position: [1.98, 0, 0.45],
    explode: [1.2, 0, 0.15],
    explodeDir: [1, 0, 0.1],
    explodeDist: 1.2,
    labelOffset: [0, 1.9, 0],
    focus: { theta: 0.55, phi: 1.2, radius: 7.8, target: [0, 0.2, 0] },
    stats: [["2 × 120", "INTAKE"], ["MESH", "AIRFLOW"], ["USB-C", "FRONT I/O"], ["POWER", "BUTTON"]],
    specs: [["面板", "冲孔钢网"], ["进风", "2 × 120 mm"], ["前置 I/O", "USB-C / USB-A / Audio"], ["固定", "卡扣 + 磁吸"]],
    params: { note: "前置进风与开关接口" },
    deps: ["sidePanel"]
  }),
  newPart({
    id: "topPanel",
    number: "14",
    name: "顶部盖板",
    en: "TOP VENT PANEL",
    category: "CHASSIS",
    short: "顶部网孔 · 防尘",
    description: "顶部可拆盖板，带有大面积网孔与防尘滤网，为顶部排风扇提供出风通道，同时遮盖顶部走线与冷排安装位。",
    role: "顶部出风、防尘并完成机箱上部封闭。",
    install: "向后滑动顶部盖板即可取下。",
    position: [0, 2.08, 0.45],
    explode: [0, 1.05, 0.1],
    explodeDir: [0, 1, 0.1],
    explodeDist: 1.05,
    labelOffset: [0, 0.2, 0],
    focus: { theta: 0.6, phi: 1.15, radius: 6.4, target: [0, 0.08, 0] },
    stats: [["1 × 140", "TOP FAN"], ["MESH", "VENT"], ["DUST", "FILTER"], ["TOOL-FREE", "REMOVAL"]],
    specs: [["面板", "冲孔钢网"], ["顶部风扇", "1 × 140 mm"], ["滤网", "可拆防尘网"], ["固定", "后滑式卡扣"]],
    params: { note: "顶部排风与防尘" },
    deps: ["sidePanel"]
  }),
  newPart({
    id: "frontFan1",
    number: "15",
    name: "前置风扇 A",
    en: "FRONT INTAKE FAN A",
    category: "COOLING",
    short: "120 mm PWM · 1800 RPM",
    description: "前置进风风扇 A，将冷空气从前面板压入机箱，为显卡与 CPU 散热器提供新鲜气流。",
    role: "建立机箱正压与前置进风。",
    install: "固定在前面板内侧风扇位，四颗螺丝固定。",
    position: [1.67, 1.02, 0.53],
    explode: [1.1, 0.1, 0.85],
    explodeDir: [0.8, 0.05, 0.6],
    explodeDist: 1.35,
    explodeRot: [0, -0.1, 0],
    labelOffset: [0, 0.58, 0],
    focus: { theta: 0.5, phi: 1.2, radius: 2.4, target: [0, 0, 0] },
    stats: [["120 mm", "SIZE"], ["1800", "MAX RPM"], ["65 CFM", "AIRFLOW"], ["26 dBA", "NOISE"]],
    specs: [["尺寸", "120 × 120 × 25 mm"], ["转速", "200 – 1800 RPM"], ["风量", "65 CFM"], ["轴承", "液压轴承"], ["接口", "4-pin PWM"]],
    params: { note: "前置进风 A" },
    deps: ["frontPanel"]
  }),
  newPart({
    id: "frontFan2",
    number: "16",
    name: "前置风扇 B",
    en: "FRONT INTAKE FAN B",
    category: "COOLING",
    short: "120 mm PWM · 1800 RPM",
    description: "前置进风风扇 B，与 A 风扇形成上下双进风，覆盖显卡与主板下半部的冷空气需求。",
    role: "补充前置进风并均衡机箱内部风压。",
    install: "固定在前面板内侧下方风扇位。",
    position: [1.67, -0.02, 0.53],
    explode: [1.1, -0.25, 0.85],
    explodeDir: [0.8, -0.2, 0.6],
    explodeDist: 1.35,
    explodeRot: [0, 0.08, 0],
    labelOffset: [0, 0.58, 0],
    focus: { theta: 0.5, phi: 1.2, radius: 2.4, target: [0, 0, 0] },
    stats: [["120 mm", "SIZE"], ["1800", "MAX RPM"], ["65 CFM", "AIRFLOW"], ["26 dBA", "NOISE"]],
    specs: [["尺寸", "120 × 120 × 25 mm"], ["转速", "200 – 1800 RPM"], ["风量", "65 CFM"], ["轴承", "液压轴承"], ["接口", "4-pin PWM"]],
    params: { note: "前置进风 B" },
    deps: ["frontPanel"]
  }),
  newPart({
    id: "topFan",
    number: "17",
    name: "顶部风扇",
    en: "TOP EXHAUST FAN",
    category: "COOLING",
    short: "140 mm PWM · 1500 RPM",
    description: "顶部 140 mm 排风扇，将 CPU 散热器与显卡区域上浮的热空气排出机箱。",
    role: "顶部排风，降低 CPU 供电与内存区域温度。",
    install: "安装在顶部盖板下方，四颗长螺丝固定。",
    position: [0.55, 1.92, 0.53],
    explode: [0.3, 1.2, 0.9],
    explodeDir: [0.2, 0.9, 0.65],
    explodeDist: 1.4,
    explodeRot: [0.08, 0, 0],
    labelOffset: [0, 0.55, 0],
    focus: { theta: 0.6, phi: 1.08, radius: 2.6, target: [0, 0, 0] },
    stats: [["140 mm", "SIZE"], ["1500", "MAX RPM"], ["82 CFM", "AIRFLOW"], ["29 dBA", "NOISE"]],
    specs: [["尺寸", "140 × 140 × 25 mm"], ["转速", "300 – 1500 RPM"], ["风量", "82 CFM"], ["轴承", "液压轴承"], ["接口", "4-pin PWM"]],
    params: { note: "顶部排风" },
    deps: ["topPanel"]
  }),
  newPart({
    id: "rearFan",
    number: "18",
    name: "后置风扇",
    en: "REAR EXHAUST FAN",
    category: "COOLING",
    short: "120 mm PWM · 1600 RPM",
    description: "后置排风扇，位于主板后 I/O 与 CPU 供电区域旁，负责把 VRM 与机箱尾部热量快速排出。",
    role: "后部排风，配合前部进风建立前后风道。",
    install: "从机箱后部外侧固定，网罩朝外。",
    position: [-1.68, 0.55, 0.53],
    explode: [-1.15, 0.2, 0.85],
    explodeDir: [-0.8, 0.1, 0.6],
    explodeDist: 1.4,
    explodeRot: [0, 0.12, 0],
    labelOffset: [0, 0.55, 0],
    focus: { theta: 0.58, phi: 1.18, radius: 2.4, target: [0, 0, 0] },
    stats: [["120 mm", "SIZE"], ["1600", "MAX RPM"], ["58 CFM", "AIRFLOW"], ["25 dBA", "NOISE"]],
    specs: [["尺寸", "120 × 120 × 25 mm"], ["转速", "200 – 1600 RPM"], ["风量", "58 CFM"], ["轴承", "液压轴承"], ["接口", "4-pin PWM"]],
    params: { note: "后部排风" },
    deps: ["sidePanel"]
  }),
  newPart({
    id: "cable24",
    number: "19",
    name: "24-pin 主板供电线",
    en: "24-PIN SLEEVED CABLE",
    category: "CABLE",
    short: "600 mm · 编织线",
    description: "电源到主板的 24-pin 主供电线，使用黑色编织包网并经过机箱理线孔。线材从 PSU 模组口沿背板向上，再接入主板右缘。",
    role: "向主板、内存与芯片组输送 +12V / +5V / +3.3V 主供电。",
    install: "从 PSU 24-pin 模组口接出，经底部理线孔进入主仓后接到主板。",
    position: [0, 0, 0],
    explode: [0.35, 0.1, 1.35],
    explodeDir: [0.25, 0.05, 0.95],
    explodeDist: 1.4,
    labelOffset: [1.5, 0.15, 0.55],
    focus: { theta: 0.58, phi: 1.18, radius: 3.6, target: [1.42, 0.12, 0.55] },
    stats: [["24", "PINS"], ["600 mm", "LENGTH"], ["18 AWG", "WIRE"], ["SLEEVED", "FINISH"]],
    specs: [["接口", "24-pin ATX"], ["长度", "600 mm"], ["线径", "18 AWG"], ["包网", "黑色编织"], ["理线", "背板 + 理线孔"]],
    params: { note: "主板主供电" },
    deps: ["sidePanel"]
  }),
  newPart({
    id: "cable8",
    number: "20",
    name: "CPU 8-pin 供电线",
    en: "EPS 8-PIN CABLE",
    category: "CABLE",
    short: "700 mm · EPS 8-pin",
    description: "从电源到主板上缘 EPS 8-pin 接口的 CPU 供电线，沿背板顶部绕行，避开 CPU 散热器与顶部风扇。",
    role: "为 CPU VRM 提供独立 12V 输入。",
    install: "从 PSU CPU 8-pin 模组口接出，经顶部理线孔接到主板上缘。",
    position: [0, 0, 0],
    explode: [0.2, 0.35, 1.35],
    explodeDir: [0.15, 0.25, 0.95],
    explodeDist: 1.4,
    labelOffset: [-0.7, 1.2, 0.55],
    focus: { theta: 0.55, phi: 1.1, radius: 3.4, target: [-0.65, 1.2, 0.55] },
    stats: [["8", "PINS"], ["700 mm", "LENGTH"], ["18 AWG", "WIRE"], ["EPS", "STANDARD"]],
    specs: [["接口", "EPS 8-pin"], ["长度", "700 mm"], ["线径", "18 AWG"], ["包网", "黑色编织"], ["走线", "背板顶部"]],
    params: { note: "CPU 独立 12V" },
    deps: ["sidePanel"]
  }),
  newPart({
    id: "cableGpu",
    number: "21",
    name: "显卡供电线",
    en: "PCIe POWER CABLE",
    category: "CABLE",
    short: "650 mm · PCIe 8-pin",
    description: "电源到显卡的 PCIe 8-pin 供电线，从 PSU 前部模组口向上，经显卡下方走线空间接入显卡尾部。",
    role: "为显卡核心与显存提供额外 12V 供电。",
    install: "从 PSU PCIe 模组口接出，沿主仓前缘接到显卡供电口。",
    position: [0, 0, 0],
    explode: [0.35, -0.1, 1.35],
    explodeDir: [0.25, -0.08, 0.95],
    explodeDist: 1.4,
    labelOffset: [1.0, -0.3, 0.55],
    focus: { theta: 0.52, phi: 1.2, radius: 3.2, target: [0.95, -0.3, 0.55] },
    stats: [["8", "PINS"], ["650 mm", "LENGTH"], ["16 AWG", "WIRE"], ["PCIe", "STANDARD"]],
    specs: [["接口", "PCIe 8-pin"], ["长度", "650 mm"], ["线径", "16 AWG"], ["包网", "黑色编织"], ["走线", "主仓前缘"]],
    params: { note: "显卡辅助供电" },
    deps: ["sidePanel"]
  }),
  newPart({
    id: "cableSata",
    number: "22",
    name: "SATA 供电线",
    en: "SATA POWER CABLE",
    category: "CABLE",
    short: "500 mm · 3 × SATA",
    description: "一拖三 SATA 供电线，从电源引出后沿底仓走线，可连接 2.5 英寸 SSD 或硬盘。",
    role: "为 SATA 存储设备提供 5V / 12V 供电。",
    install: "从 PSU SATA 模组口接出，沿底仓理线槽布置。",
    position: [0, 0, 0],
    explode: [0.5, -0.2, 1.3],
    explodeDir: [0.35, -0.15, 0.9],
    explodeDist: 1.4,
    labelOffset: [0.95, -0.7, 0.5],
    focus: { theta: 0.52, phi: 1.2, radius: 3.0, target: [0.9, -0.7, 0.5] },
    stats: [["3 ×", "CONNECTORS"], ["500 mm", "LENGTH"], ["5V / 12V", "RAILS"], ["SATA", "STANDARD"]],
    specs: [["接口", "3 × SATA"], ["长度", "500 mm"], ["电压", "5V / 12V"], ["包网", "黑色编织"], ["走线", "底仓"]],
    params: { note: "SATA 存储供电" },
    deps: ["sidePanel"]
  })
];

export default {
  id: "desktop",
  name: "ATX 完整主机",
  category: "整机方案",
  isPremium: true,
  thumbnail: "assets/desktop.png",
  theme: "desktop",
  model: "DesktopModel",
  brand: {
    mark: "PC",
    title: "FULL BUILD / 22",
    sub: "整机拆解视图",
  },
  ui: {
    canvasLabel: "ATX 完整主机三维交互拆解视图",
    countLabel: "MODULES",
    guide: "先拆侧板，再依次解锁显卡、内存、散热器与 CPU；最后拆主板、电源和机箱。",
    explodeLabel: "全部拆解",
    resetLabel: "全部复位",
    bootMark: "PC",
    bootTitle: "FULL BUILD",
    bootSub: "整机装配分解系统",
    bootStatus: "正在组装 ATX 整机"
  },
  camera: {
    position: [5.15, 4.22, 8.38],
    target: [0, 0.05, 0.35],
    fov: 34,
    fovTablet: 38,
    fovNarrow: 44,
    narrowBreak: 820
  },
  views: {
    exploded: {
      position: [7.3, 5.9, 11.8],
      target: [0, 0.05, 0.5]
    }
  },
  explodeFit: true,
  render: { exposure: 1.33 },
  glow: true,
  stage: {
    radius: 3.25,
    y: -2.45,
    accent: 0xffb15a,
    secondary: 0x5fe7ff
  },
  lights: [
    { type: "hemisphere", sky: 0xa7e2ed, ground: 0x030706, intensity: 1.6 },
    { type: "directional", color: 0x9fe8ff, intensity: 1.0, position: [-3.2, 3.8, -7.2] },
    { type: "directional", color: 0xffe9d4, intensity: 3.0, position: [4.5, 6.2, 6.0] },
    { type: "directional", color: 0x54d9ef, intensity: 1.45, position: [-5.6, 2.8, 4.5] },
    { type: "directional", color: 0xd4f1f5, intensity: 1.35, position: [0.2, 1.4, 7.5] },
    { type: "point", color: 0xff9a4c, intensity: 1.35, distance: 12, decay: 2, position: [3.8, 0.6, 2.6] },
    { type: "point", color: 0x3aa9c0, intensity: 1.6, distance: 14, decay: 2, position: [-2.2, 3.4, -4.2] },
    { type: "point", color: 0x73d8e8, intensity: 1.0, distance: 10, decay: 2, position: [0, -2.2, 3.2] }
  ],
  overview: {
    name: "ATX 完整主机",
    en: "FULL SYSTEM / 22 MODULES",
    cn: "整机装配分解",
    description: "在既有 ATX 主板模型外增加中塔机箱、钢化玻璃侧板、850W 电源、四枚机箱风扇与四组编织供电线，形成一台完整的可拆解主机。",
    stats: [["22", "独立模块"], ["ATX", "FORM FACTOR"], ["850 W", "80+ GOLD"], ["4", "CASE FANS"]],
    specs: [["主板", "ATX 305 × 244 mm"], ["电源", "850 W ATX 3.0"], ["显卡", "PCIe 5.0 双风扇"], ["散热", "塔式 + 4 机箱风扇"], ["侧板", "4 mm 钢化玻璃"]]
  },
  parts: parts
};



