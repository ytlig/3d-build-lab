/* ------------------------------------------------------------------
   ATX motherboard product configuration.
   The component records are the original data, normalized into the
   shared engine schema. The procedural builder lives in
   models/motherboard.js and runs through buildModel below.
   ------------------------------------------------------------------ */
const BASE_POSITION = {
  board: [0, 0, 0],
  cpu: [-0.45, 0.55, 0.105],
  cooler: [-0.45, 0.6, 0.62],
  ram1: [0.55, 0.22, 0.16],
  ram2: [0.83, 0.22, 0.16],
  gpu: [-0.08, -0.55, 0.3],
  m2: [0.18, -0.11, 0.075],
  atx24: [1.3, 0.13, 0.075],
  cpu8: [-0.52, 1.11, 0.075]
};

const RAW_PARTS = [
      {
        id: "board",
        no: "01",
        name: "ATX 主板",
        en: "MOTHERBOARD PCB",
        category: "BASEPLATE",
        short: "305 × 244 mm · 基准板",
        stats: [
          ["ATX", "板型 / FORM FACTOR"],
          ["305×244", "尺寸 / MM"],
          ["24+8", "POWER PINS"],
          ["PCIe 5.0", "GRAPHICS LINK"]
        ],
        specs: [
          ["板型", "ATX · 305 × 244 mm"],
          ["主供电", "24-pin ATX"],
          ["CPU 供电", "8-pin EPS"],
          ["扩展接口", "PCIe 5.0 x16 / M.2"]
        ],
        desc: "标准 ATX 主板 PCB，以 305 × 244 mm 的真实比例为基准平面。板面集成 VRM 供电区、CPU 插槽、芯片组散热片、后置 IO、PCIe 与内存插槽；本演示中同时作为所有组件的装配坐标原点。",
        role: "承托全部模块，并为 CPU、内存、显卡与存储提供供电、信号与扩展通道。",
        install: "通过 9 颗铜柱螺丝固定在机箱背板，本演示以悬浮剖面展示。",
        dependency: "无前置拆解步骤 · 固定基准",
        removable: false,
        explode: [0, 0, 0],
        explodeRot: [0, 0, 0],
        labelOffset: [0, 1.37, 0.08],
        focus: { theta: 0.56, phi: 1.17, radius: 8.6, target: [0, 0.02, 0.1] }
      },
      {
        id: "cpu",
        no: "02",
        name: "CPU 处理器",
        en: "PROCESSOR",
        category: "COMPUTE",
        short: "8C / 16T · 125 W",
        stats: [
          ["8C/16T", "CORES / THREADS"],
          ["5.2 GHz", "BOOST CLOCK"],
          ["125 W", "TDP"],
          ["LGA", "SOCKET TYPE"]
        ],
        specs: [
          ["插槽", "LGA 1700"],
          ["核心 / 线程", "8C / 16T"],
          ["加速频率", "5.2 GHz"],
          ["热设计功耗", "125 W"]
        ],
        desc: "方形封装处理器，顶部覆盖镀镍金属顶盖（IHS）。安装于主板 CPU 插槽中央，是整机的计算核心；在本演示中被塔式散热器完整覆盖。",
        role: "执行操作系统、游戏与生产力任务，负责整机的通用计算与调度。",
        install: "三角定位标记对齐插槽后压入；需在安装散热器之前完成。",
        dependency: "需先拆下 CPU 散热器",
        blockedBy: { id: "cooler", message: "请先拆下 CPU 散热器", note: "散热器覆盖了 CPU 插槽与固定压杆" },
        removable: true,
        explode: [-0.28, 0.16, 0.82],
        explodeRot: [0.04, 0.12, 0],
        labelOffset: [0, 0.29, 0.08],
        focus: { theta: 0.45, phi: 1.15, radius: 2.3, target: [0, 0, 0] }
      },
      {
        id: "cooler",
        no: "03",
        name: "CPU 散热器",
        en: "TOWER COOLER",
        category: "THERMAL",
        short: "4 热管 · 120 mm 风扇",
        stats: [
          ["4 × 6 mm", "HEAT PIPES"],
          ["120 mm", "FAN SIZE"],
          ["220 W", "TDP SUPPORT"],
          ["1600 RPM", "MAX SPEED"]
        ],
        specs: [
          ["结构", "塔式单塔"],
          ["热管", "4 × 6 mm 铜热管"],
          ["风扇", "120 mm PWM"],
          ["解热能力", "220 W"]
        ],
        desc: "塔式风冷散热器，由铜底、四根 U 型热管、密集铝鳍片与 120 mm 风扇组成。前置风扇将冷空气推过鳍片，把 CPU 产生的热量带出机箱。",
        role: "将 CPU 顶盖热量传导至鳍片，并通过风扇建立稳定气流。",
        install: "使用扣具压在 CPU 顶部；拆下散热器后才可访问 CPU 插槽。",
        dependency: "无前置拆解步骤",
        removable: true,
        explode: [-1.25, 0.7, 0.16],
        explodeRot: [0.05, 0.03, 0],
        labelOffset: [0, 0.56, 0.33],
        focus: { theta: 0.47, phi: 1.12, radius: 3.4, target: [0, 0.02, 0.12] }
      },
      {
        id: "ram1",
        no: "04",
        name: "内存条 A",
        en: "DDR5 DIMM A1",
        category: "MEMORY",
        short: "32 GB · 6000 MT/s",
        stats: [
          ["DDR5", "MEMORY TYPE"],
          ["32 GB", "CAPACITY"],
          ["6000", "MT/S"],
          ["CL30", "LATENCY"]
        ],
        specs: [
          ["规格", "DDR5 32 GB"],
          ["频率", "6000 MT/s"],
          ["时序", "CL30"],
          ["马甲", "铝合金 + 导光条"]
        ],
        desc: "双通道内存条 A，覆盖铝合金金属马甲与顶部导光条。内存条竖插在 CPU 右侧的 DIMM 插槽中，下缘会被横跨机箱的显卡遮挡。",
        role: "为系统和应用提供高速临时数据空间，双通道配置可提升内存带宽。",
        install: "对准防呆缺口后垂直压入 A1 插槽；需在安装显卡前完成。",
        dependency: "需先拆下显卡",
        blockedBy: { id: "gpu", message: "请先拆下显卡", note: "显卡覆盖了内存插槽下缘与固定卡扣" },
        removable: true,
        explode: [0.92, 0.42, 0.82],
        explodeRot: [0.02, 0.08, 0.025],
        labelOffset: [0, 0.6, 0.08],
        focus: { theta: 1.02, phi: 1.21, radius: 2.7, target: [0, 0, 0] }
      },
      {
        id: "ram2",
        no: "05",
        name: "内存条 B",
        en: "DDR5 DIMM B1",
        category: "MEMORY",
        short: "32 GB · 6000 MT/s",
        stats: [
          ["DDR5", "MEMORY TYPE"],
          ["32 GB", "CAPACITY"],
          ["6000", "MT/S"],
          ["CL30", "LATENCY"]
        ],
        specs: [
          ["规格", "DDR5 32 GB"],
          ["频率", "6000 MT/s"],
          ["时序", "CL30"],
          ["马甲", "铝合金 + 导光条"]
        ],
        desc: "双通道内存条 B，安装于 CPU 右侧的 B1 插槽。与 A 条组成双通道配置，外侧带金属马甲与顶部 RGB 导光条。",
        role: "与内存 A 组成双通道，进一步提升数据吞吐与带宽。",
        install: "安装在 B1 插槽；与 A 条保持同规格可获得最佳兼容性。",
        dependency: "需先拆下显卡",
        blockedBy: { id: "gpu", message: "请先拆下显卡", note: "显卡覆盖了内存插槽下缘与固定卡扣" },
        removable: true,
        explode: [1.18, 0.1, 0.82],
        explodeRot: [0.02, -0.04, -0.02],
        labelOffset: [0, 0.6, 0.08],
        focus: { theta: 1.02, phi: 1.21, radius: 2.7, target: [0, 0, 0] }
      },
      {
        id: "gpu",
        no: "06",
        name: "显卡",
        en: "GRAPHICS CARD",
        category: "GRAPHICS",
        short: "PCIe 5.0 · 双风扇",
        stats: [
          ["PCIe 5.0", "INTERFACE"],
          ["16 GB", "GDDR7"],
          ["2 × 100 mm", "FANS"],
          ["2.5 SLOT", "FORM FACTOR"]
        ],
        specs: [
          ["接口", "PCIe 5.0 x16"],
          ["显存", "16 GB GDDR7"],
          ["散热", "双风扇 + 金属背板"],
          ["结构", "PCB + 导流罩 + 金手指"]
        ],
        desc: "双风扇显卡，由独立 PCB、正面导流罩、双滚珠风扇、金属背板与 PCIe 金手指构成。显卡横跨多个扩展槽，安装后会遮挡内存插槽下缘，是内存拆解的前置条件。",
        role: "负责图形渲染、光线追踪与 GPU 并行运算，为显示输出提供图像信号。",
        install: "金手指插入 PCIe 5.0 x16 插槽后锁紧挡板螺丝；拆卸内存前需先移除。",
        dependency: "无前置拆解步骤",
        removable: true,
        explode: [0.12, -0.56, 1.36],
        explodeRot: [0.06, 0.01, -0.025],
        labelOffset: [0, 0.37, 0.12],
        focus: { theta: 0.34, phi: 1.18, radius: 5.25, target: [0, 0.02, 0.05] }
      },
      {
        id: "m2",
        no: "07",
        name: "M.2 SSD",
        en: "NVME SSD",
        category: "STORAGE",
        short: "PCIe 4.0 ×4 · 2 TB",
        stats: [
          ["2280", "FORM FACTOR"],
          ["PCIe 4.0 ×4", "INTERFACE"],
          ["2 TB", "CAPACITY"],
          ["7000 MB/s", "SEQUENTIAL"]
        ],
        specs: [
          ["规格", "M.2 2280"],
          ["接口", "PCIe 4.0 ×4"],
          ["容量", "2 TB"],
          ["散热", "铝合金散热片"]
        ],
        desc: "M.2 2280 固态硬盘，覆盖铝合金散热片，安装在 CPU 与显卡插槽之间的 M.2_1 接口。高速 NVMe 通道用于系统盘、素材缓存与大型项目加载。",
        role: "提供高速非易失存储，承担操作系统、软件与项目文件的读写。",
        install: "以约 30° 插入 M.2 插槽后压平，用末端螺丝固定。",
        dependency: "无前置拆解步骤",
        removable: true,
        explode: [0.5, 0.25, 0.82],
        explodeRot: [0.04, -0.02, 0.04],
        labelOffset: [0, 0.22, 0.09],
        focus: { theta: 0.32, phi: 1.16, radius: 2.1, target: [0, 0, 0.02] }
      },
      {
        id: "atx24",
        no: "08",
        name: "24-pin 供电",
        en: "ATX MAIN POWER",
        category: "POWER",
        short: "ATX 3.0 · 24 针",
        stats: [
          ["24", "PIN COUNT"],
          ["+12V / +5V", "MAIN RAILS"],
          ["+3.3V", "STANDBY RAIL"],
          ["RIGHT", "BOARD EDGE"]
        ],
        specs: [
          ["标准", "ATX 24-pin"],
          ["供电", "+12V / +5V / +3.3V"],
          ["位置", "主板右缘"],
          ["结构", "24 针插座"]
        ],
        desc: "24-pin ATX 主供电接口，位于主板右缘。通过插座向主板、内存、芯片组及扩展设备分配 +12V、+5V 与 +3.3V 电源。",
        role: "将电源的主供电输入主板，是整个平台最核心的供电入口。",
        install: "电源 24-pin 线缆对准卡扣后垂直插入；拆卸前需释放卡扣。",
        dependency: "无前置拆解步骤",
        removable: true,
        explode: [1.05, -0.02, 0.56],
        explodeRot: [0, 0.1, 0.02],
        labelOffset: [0.02, 0.56, 0.08],
        focus: { theta: 1.18, phi: 1.2, radius: 2.15, target: [0, 0, 0.04] }
      },
      {
        id: "cpu8",
        no: "09",
        name: "8-pin CPU 供电",
        en: "EPS 8-PIN POWER",
        category: "POWER",
        short: "EPS 8-pin · 12V",
        stats: [
          ["8", "PIN COUNT"],
          ["12 V", "CPU RAIL"],
          ["EPS", "STANDARD"],
          ["TOP", "BOARD EDGE"]
        ],
        specs: [
          ["标准", "EPS 8-pin"],
          ["供电", "+12V CPU"],
          ["位置", "主板上缘"],
          ["结构", "8 针供电口"]
        ],
        desc: "8-pin EPS CPU 供电接口，位于主板上缘。为 CPU VRM 提供独立 12V 输入，保证高负载下的稳定供电与超频余量。",
        role: "向 CPU 供电模块提供独立 12V 输入，降低 24-pin 主供电的压力。",
        install: "电源 CPU 8-pin 线缆对准防呆卡扣后插入；建议在安装主板前先接好。",
        dependency: "无前置拆解步骤",
        removable: true,
        explode: [0.02, 0.82, 0.52],
        explodeRot: [0.04, 0, 0],
        labelOffset: [0, 0.21, 0.08],
        focus: { theta: 0.48, phi: 0.94, radius: 2.0, target: [0, 0, 0.03] }
      }
    ];

function dirAndDistance(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  return {
    dir: len > 0.00001 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0],
    dist: len
  };
}

const parts = RAW_PARTS.map((p) => {
  const split = dirAndDistance(p.explode || [0, 0, 0]);
  return {
    id: p.id,
    number: p.no,
    name: p.name,
    en: p.en,
    category: p.category,
    short: p.short,
    description: p.desc,
    specs: p.specs,
    stats: p.stats,
    role: p.role,
    install: p.install,
    position: BASE_POSITION[p.id] || [0, 0, 0],
    material: "procedural",
    geometry: { type: "compound", preset: "atx-procedural" },
    fixed: !p.removable,
    deps: p.blockedBy ? [p.blockedBy.id] : [],
    explode: p.explode || [0, 0, 0],
    explodeDir: split.dir,
    explodeDist: split.dist,
    explodeRot: p.explodeRot || [0, 0, 0],
    labelOffset: p.labelOffset || [0, 0.4, 0],
    focus: p.focus,
    params: {
      description: p.desc,
      specs: p.specs,
      stats: p.stats,
      role: p.role,
      install: p.install,
      dependency: p.dependency
    }
  };
});

export default {
  id: "motherboard",
  name: "ATX 主板",
  category: "PC 硬件",
  isPremium: false,
  thumbnail: "assets/motherboard.png",
  theme: "motherboard",
  brand: {
    mark: "ATX",
    title: "MOTHERBOARD / 09",
    sub: "主板拆解视图",
  },
  ui: {
    canvasLabel: "ATX 主板三维装配分解视图",
    countLabel: "MODULES",
    guide: "再次点击同一部件归位；<em>显卡未拆时无法取下内存。</em>",
    explodeLabel: "全部拆解",
    resetLabel: "全部复位",
    bootMark: "ATX",
    bootTitle: "MOTHERBOARD",
    bootSub: "程序化装配分解系统",
    bootStatus: "正在构建 ATX 几何体"
  },
  camera: {
    position: [4.03, 3.31, 6.29],
    target: [0, 0.03, 0.25],
    fov: 34,
    fovTablet: 38,
    fovNarrow: 42,
    narrowBreak: 820
  },
  views: {
    exploded: {
      position: [4.84, 3.94, 8.07],
      target: [0, 0.03, 0.5]
    }
  },
  render: { exposure: 1.36 },
  stage: {
    radius: 2.64,
    y: -1.64,
    accent: 0xffb15a,
    secondary: 0x5fe7ff
  },
  lights: [
    { type: "hemisphere", sky: 0xa7e2ed, ground: 0x030706, intensity: 1.62 },
    { type: "directional", color: 0x9fe8ff, intensity: 1.3, position: [-3.6, 3.4, -6.4] },
    { type: "directional", color: 0xffe9d4, intensity: 3.0, position: [4.5, 6.2, 6.0] },
    { type: "directional", color: 0x54d9ef, intensity: 1.45, position: [-5.6, 2.8, 4.5] },
    { type: "directional", color: 0xd4f1f5, intensity: 1.35, position: [0.2, 1.4, 7.5] },
    { type: "point", color: 0xff9a4c, intensity: 1.35, distance: 12, decay: 2, position: [3.8, 0.6, 2.6] },
    { type: "point", color: 0x3aa9c0, intensity: 1.6, distance: 14, decay: 2, position: [-2.2, 3.4, -4.2] },
    { type: "point", color: 0x73d8e8, intensity: 1.0, distance: 10, decay: 2, position: [0, -2.2, 3.2] }
  ],
  overview: {
    name: "ATX 主板装配",
    en: "ATX MOTHERBOARD / 305 × 244 MM",
    cn: "装配分解实验",
    description: "以标准 ATX 主板为基准平面，逐层查看 CPU、散热器、内存、显卡、M.2 与供电接口的装配关系。所有几何体与细节纹理均由代码实时生成。",
    stats: [["09", "独立组件"], ["305×244", "ATX / MM"], ["24 + 8", "POWER PINS"], ["PCIe 5.0", "扩展通道"]],
    specs: [["板型", "ATX · 305 × 244 mm"], ["主供电", "24-pin ATX"], ["CPU 供电", "8-pin EPS"], ["扩展", "PCIe 5.0 / M.2"]]
  },
  parts: parts,
  model: "MotherboardModel"
};

