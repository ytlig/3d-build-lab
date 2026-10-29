/* ------------------------------------------------------------------
   ATX motherboard procedural model, extracted from the original
   single-file page. All geometry, CanvasTextures and material recipes
   are preserved; only the outer factory is new.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const THREE = window.ATX_LIB.THREE;
  // The original model created CSS2D labels inside registerPart. The engine
  // now owns labels, so these placeholders are harmless Object3D anchors.
  function CSS2DObject() { return new THREE.Object3D(); }
    const T = THREE;
    const TAU = Math.PI * 2;
    const BOARD_W = 3.05;
    const BOARD_H = 2.44;
    const BOARD_T = 0.036;
    const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const PART_DATA = [
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

    const PART_MAP = new Map(PART_DATA.map((part) => [part.id, part]));
    const ALL_REMOVABLE = PART_DATA.filter((part) => part.removable).map((part) => part.id);
    const REMOVAL_ORDER = ["cooler", "gpu", "ram1", "ram2", "m2", "atx24", "cpu8", "cpu"];
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

    const COLORS = {
      cyan: 0x5fe7ff,
      amber: 0xffb15a,
      green: 0x7ce7b5,
      error: 0xff7665
    };

    const state = {
      selectedId: null,
      hoveredId: null,
      removed: new Set(),
      removalStart: new Map(),
      autoRotate: false,
      explodedAll: false,
      booted: false
    };

    let scene;
    let MATS;
    let camera;
    let renderer;
    let controls;
    let labelRenderer;
    let raycaster;
    let pointerNdc;
    let modelRoot;
    let labelLayer;
    let toastTimer = 0;
    let cameraTween = null;
    let labelsDirty = true;
    let lastLabelRender = 0;
    let lastRaycastTime = 0;
    let pointerDown = null;
    let lastFrame = performance.now();
    const pickables = [];
    const partRuntime = new Map();
    const fanRotors = [];
    let activeOutlineId = null;

    /* ==================================================================
       02. SMALL UTILITIES / 数学、Canvas 与场景辅助
       ================================================================== */
    function mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rnd = mulberry32(0xa7b1c3d4);

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function makeCanvasTexture(width, height, draw, opts = {}) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height);
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = opts.linear ? T.NoColorSpace : T.SRGBColorSpace;
      texture.anisotropy = opts.anisotropy || 4;
      if (opts.wrap) {
        texture.wrapS = texture.wrapT = T.RepeatWrapping;
        texture.repeat.set(opts.wrap[0], opts.wrap[1]);
      }
      texture.needsUpdate = true;
      return texture;
    }

    function roundRectPath(ctx, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function roundedRectShape(w, h, r) {
      const s = new T.Shape();
      const x = -w / 2;
      const y = -h / 2;
      const radius = Math.min(r, w / 2, h / 2);
      s.moveTo(x + radius, y);
      s.lineTo(x + w - radius, y);
      s.quadraticCurveTo(x + w, y, x + w, y + radius);
      s.lineTo(x + w, y + h - radius);
      s.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      s.lineTo(x + radius, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - radius);
      s.lineTo(x, y + radius);
      s.quadraticCurveTo(x, y, x + radius, y);
      return s;
    }

    function roundedPanelGeometry(w, h, depth, radius = 0.02, bevel = 0.008) {
      const shape = roundedRectShape(w, h, radius);
      const geometry = new T.ExtrudeGeometry(shape, {
        depth: Math.max(0.005, depth - bevel * 2),
        steps: 1,
        curveSegments: 10,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2
      });
      geometry.translate(0, 0, -depth / 2 + bevel);
      geometry.computeVertexNormals();
      return geometry;
    }

    function addMesh(parent, geometry, material, position, rotation) {
      const mesh = new T.Mesh(geometry, material);
      if (position) mesh.position.set(position[0], position[1], position[2]);
      if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      parent.add(mesh);
      return mesh;
    }

    function addBox(parent, w, h, d, material, position, rotation) {
      return addMesh(parent, new T.BoxGeometry(w, h, d), material, position, rotation);
    }

    function addCylinderZ(parent, rTop, rBottom, height, material, position, segments = 24) {
      const geometry = new T.CylinderGeometry(rTop, rBottom, height, clamp(segments, 8, 32), 1, false);
      const mesh = addMesh(parent, geometry, material, position, [Math.PI / 2, 0, 0]);
      return mesh;
    }

    function addCylinderX(parent, radius, height, material, position, segments = 24) {
      const geometry = new T.CylinderGeometry(radius, radius, height, clamp(segments, 8, 32), 1, false);
      return addMesh(parent, geometry, material, position, [0, 0, Math.PI / 2]);
    }

    function addCylinderY(parent, rTop, rBottom, height, material, position, segments = 24) {
      const geometry = new T.CylinderGeometry(rTop, rBottom, height, clamp(segments, 8, 32), 1, false);
      return addMesh(parent, geometry, material, position);
    }

    function addTorus(parent, radius, tube, material, position, rotation, radialSegments = 10, tubularSegments = 32) {
      const geometry = new T.TorusGeometry(radius, tube, clamp(radialSegments, 6, 16), clamp(tubularSegments, 16, 32));
      return addMesh(parent, geometry, material, position, rotation);
    }

    function addDecal(parent, texture, width, height, position, rotation, opacity = 1) {
      const material = new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
        side: T.DoubleSide
      });
      const mesh = addMesh(parent, new T.PlaneGeometry(width, height), material, position, rotation);
      mesh.renderOrder = 3;
      return mesh;
    }

    function textTexture(text, opts = {}) {
      const width = opts.width || 512;
      const height = opts.height || 256;
      return makeCanvasTexture(width, height, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        if (opts.fill) {
          ctx.fillStyle = opts.fill;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.fillStyle = opts.color || "#d8e6e9";
        ctx.font = `${opts.weight || 500} ${opts.size || 58}px ${opts.font || "Bahnschrift, Arial, sans-serif"}`;
        ctx.textAlign = opts.align || "center";
        ctx.textBaseline = "middle";
        const lines = Array.isArray(text) ? text : [text];
        const lineHeight = opts.lineHeight || (opts.size || 58) * 1.15;
        const total = (lines.length - 1) * lineHeight;
        lines.forEach((line, index) => {
          ctx.fillText(line, opts.x === undefined ? w / 2 : opts.x, h / 2 - total / 2 + index * lineHeight + (opts.offsetY || 0));
        });
        if (opts.sub) {
          ctx.fillStyle = opts.subColor || "rgba(180,205,210,0.5)";
          ctx.font = `400 ${opts.subSize || 20}px Bahnschrift, Arial, sans-serif`;
          ctx.fillText(opts.sub, opts.x === undefined ? w / 2 : opts.x, h / 2 + (opts.subY || 60));
        }
      });
    }

    function setPartSelector(group, partId) {
      group.traverse((object) => {
        if (object.isMesh) {
          object.userData.partId = partId;
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
    }

    /* ==================================================================
       03. PROCEDURAL TEXTURES / 程序化贴图（无外部图片）
       ================================================================== */
    function makeBoardTexture(anisotropy) {
      const cw = 2048;
      const ch = 1638;
      const texture = makeCanvasTexture(cw, ch, (ctx, w, h) => {
        const bx = (x) => ((x + BOARD_W / 2) / BOARD_W) * w;
        const by = (y) => ((BOARD_H / 2 - y) / BOARD_H) * h;

        const base = ctx.createLinearGradient(0, 0, w, h);
        base.addColorStop(0, "#0a251d");
        base.addColorStop(0.45, "#082019");
        base.addColorStop(1, "#061611");
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);

        // 大块覆铜区域
        const copperPour = (x, y, pw, ph, alpha) => {
          const g = ctx.createLinearGradient(bx(x), by(y), bx(x + pw), by(y - ph));
          g.addColorStop(0, `rgba(137,105,54,${alpha})`);
          g.addColorStop(1, `rgba(105,132,97,${alpha * 0.25})`);
          ctx.fillStyle = g;
          ctx.fillRect(bx(x), by(y), (pw / BOARD_W) * w, (ph / BOARD_H) * h);
        };
        copperPour(-1.1, 1.05, 0.72, 0.28, 0.1);
        copperPour(0.32, 0.4, 0.35, 0.55, 0.08);
        copperPour(-0.4, 0.4, 0.5, 0.5, 0.06);

        // PCB 细密噪点
        for (let i = 0; i < 3800; i++) {
          const x = rnd() * w;
          const y = rnd() * h;
          ctx.fillStyle = rnd() > 0.5 ? "rgba(171,210,191,0.03)" : "rgba(0,0,0,0.06)";
          ctx.fillRect(x, y, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
        }

        // 铜走线
        const traceColor = () => rnd() > 0.78 ? "rgba(174,135,67,0.23)" : "rgba(97,151,137,0.19)";
        for (let i = 0; i < 128; i++) {
          let x = bx(-1.48 + rnd() * 2.96);
          let y = by(-1.15 + rnd() * 2.3);
          ctx.beginPath();
          ctx.moveTo(x, y);
          const segments = 2 + Math.floor(rnd() * 3);
          let horizontal = rnd() > 0.5;
          for (let s = 0; s < segments; s++) {
            const len = (0.04 + rnd() * 0.26) * w;
            if (horizontal) x += rnd() > 0.28 ? len : -len;
            else y += rnd() > 0.28 ? len : -len;
            ctx.lineTo(x, y);
            horizontal = !horizontal;
          }
          ctx.strokeStyle = traceColor();
          ctx.lineWidth = 0.8 + rnd() * 1.8;
          ctx.stroke();

          if (rnd() > 0.6) {
            ctx.beginPath();
            ctx.arc(x, y, 2.6 + rnd() * 2.5, 0, TAU);
            ctx.fillStyle = "rgba(192,158,80,0.32)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, TAU);
            ctx.fillStyle = "rgba(2,9,8,0.85)";
            ctx.fill();
          }
        }

        // 靠近内存/芯片组的并行总线
        ctx.save();
        ctx.strokeStyle = "rgba(135,109,61,0.18)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 22; i++) {
          ctx.beginPath();
          ctx.moveTo(bx(0.15), by(0.2 - i * 0.012));
          ctx.lineTo(bx(0.52), by(0.2 - i * 0.012));
          ctx.stroke();
        }
        ctx.restore();

        // 安装孔
        const holes = [
          [-1.4, 1.1], [-1.4, 0.1], [-1.4, -0.92], [-0.9, -1.12],
          [0.25, -1.12], [1.4, -1.03], [1.4, -0.12], [1.4, 0.92], [-0.35, 1.13]
        ];
        holes.forEach(([x, y]) => {
          const px = bx(x);
          const py = by(y);
          ctx.beginPath();
          ctx.arc(px, py, 18, 0, TAU);
          ctx.fillStyle = "rgba(188,174,132,0.55)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 11, 0, TAU);
          ctx.fillStyle = "#020605";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 21, 0, TAU);
          ctx.strokeStyle = "rgba(225,234,219,0.22)";
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        // 插座/插槽丝印轮廓
        ctx.save();
        ctx.strokeStyle = "rgba(211,226,221,0.22)";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(bx(-0.73), by(0.83), (0.54 / BOARD_W) * w, (0.54 / BOARD_H) * h);
        ctx.strokeRect(bx(-1.47), by(1.12), (0.27 / BOARD_W) * w, (0.86 / BOARD_H) * h);
        ctx.strokeStyle = "rgba(196,211,207,0.14)";
        ctx.strokeRect(bx(0.46), by(0.76), (0.48 / BOARD_W) * w, (1.04 / BOARD_H) * h);
        ctx.strokeRect(bx(-1.34), by(-0.23), (2.48 / BOARD_W) * w, (0.12 / BOARD_H) * h);
        ctx.strokeRect(bx(-0.26), by(-0.02), (0.9 / BOARD_W) * w, (0.12 / BOARD_H) * h);
        ctx.restore();

        // CPU 触点阵列
        ctx.save();
        const sx = bx(-0.45);
        const sy = by(0.55);
        const step = 7.2;
        for (let ix = -16; ix <= 16; ix++) {
          for (let iy = -16; iy <= 16; iy++) {
            if ((ix + iy) % 7 === 0) continue;
            ctx.fillStyle = "rgba(220,174,84,0.3)";
            ctx.fillRect(sx + ix * step, sy + iy * step, 2.6, 2.6);
          }
        }
        ctx.restore();

        // 丝印文字
        const silkscreen = (text, x, y, size = 21, alpha = 0.46, align = "left") => {
          ctx.save();
          ctx.fillStyle = `rgba(223,235,231,${alpha})`;
          ctx.font = `500 ${size}px Bahnschrift, Arial, sans-serif`;
          ctx.textAlign = align;
          ctx.textBaseline = "middle";
          ctx.fillText(text, bx(x), by(y));
          ctx.restore();
        };
        silkscreen("ATX  /  REV 1.0", -1.36, -1.02, 22, 0.5);
        silkscreen("MOTHERBOARD", -1.36, -1.08, 15, 0.3);
        silkscreen("CPU_FAN", -0.92, 0.84, 15, 0.43);
        silkscreen("DDR5  A1", 0.46, 0.78, 15, 0.47);
        silkscreen("DDR5  B1", 0.74, 0.78, 15, 0.47);
        silkscreen("M.2_1", -0.21, -0.03, 14, 0.44);
        silkscreen("PCIe 5.0 x16", -1.16, -0.15, 15, 0.46);
        silkscreen("ATX_24PIN", 1.14, -0.01, 14, 0.48);
        silkscreen("CPU_PWR", -0.46, 1.05, 14, 0.44);
        silkscreen("SATA 6G", 0.83, -0.97, 14, 0.4);
        silkscreen("AUDIO", -1.29, -0.67, 14, 0.4);
        silkscreen("2.5G LAN", -1.29, 0.28, 13, 0.35);
        silkscreen("VRM", -0.96, 0.93, 13, 0.32);
        silkscreen("CHIPSET", 0.73, -0.72, 13, 0.36);
        silkscreen("305 × 244 mm", 0.35, -1.03, 13, 0.32);

        // 随机位号与小型焊盘
        const refs = ["C104", "R22", "Q17", "U11", "C308", "R47", "D5", "JP1", "FAN2", "USB4"];
        for (let i = 0; i < 28; i++) {
          const x = -1.35 + rnd() * 2.7;
          const y = -1.02 + rnd() * 2.0;
          silkscreen(refs[Math.floor(rnd() * refs.length)], x, y, 10, 0.24);
          if (rnd() > 0.5) {
            ctx.fillStyle = "rgba(208,178,111,0.28)";
            ctx.fillRect(bx(x) + 34, by(y) - 3, 5, 5);
          }
        }

        // 调试排针、跳线与测试点
        ctx.save();
        ctx.fillStyle = "rgba(16,28,27,0.85)";
        ctx.strokeStyle = "rgba(221,234,230,0.17)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
          ctx.fillRect(bx(-1.2 + i * 0.032), by(-0.51), 12, 6);
          ctx.strokeRect(bx(-1.2 + i * 0.032), by(-0.51), 12, 6);
        }
        ctx.restore();

        // 条码与二维码图形
        ctx.save();
        ctx.fillStyle = "rgba(227,236,232,0.22)";
        for (let i = 0; i < 34; i++) {
          const bw = 2 + (i % 3) * 2;
          ctx.fillRect(bx(0.72) + i * 5, by(-1.07), bw, 30);
        }
        const qx = bx(1.16);
        const qy = by(-1.02);
        ctx.strokeStyle = "rgba(221,235,230,0.15)";
        ctx.strokeRect(qx, qy, 58, 58);
        for (let i = 0; i < 7; i++) {
          for (let j = 0; j < 7; j++) {
            if (rnd() > 0.48) {
              ctx.fillStyle = "rgba(221,235,230,0.2)";
              ctx.fillRect(qx + 5 + i * 6.5, qy + 5 + j * 6.5, 4, 4);
            }
          }
        }
        ctx.restore();

        // 板边高光与警告标识
        ctx.strokeStyle = "rgba(126,223,205,0.22)";
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, w - 6, h - 6);
        ctx.save();
        ctx.strokeStyle = "rgba(255,185,102,0.58)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx(-1.18), by(-0.76));
        ctx.lineTo(bx(-1.13), by(-0.83));
        ctx.lineTo(bx(-1.08), by(-0.76));
        ctx.closePath();
        ctx.stroke();
        silkscreen("STATIC", -1.06, -0.79, 10, 0.38);
        ctx.restore();
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeIOTexture(anisotropy) {
      const texture = makeCanvasTexture(512, 1024, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "#10171a");
        g.addColorStop(0.48, "#1d272b");
        g.addColorStop(1, "#0b1114");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "rgba(220,235,238,0.42)";
        ctx.font = "500 19px Bahnschrift, Arial, sans-serif";
        ctx.fillText("REAR I/O", 28, 42);
        ctx.font = "400 11px Bahnschrift, Arial, sans-serif";
        ctx.fillStyle = "rgba(172,194,200,0.28)";
        ctx.fillText("USB 3.2 / HDMI / DP / 2.5G LAN / AUDIO", 28, 62);

        const port = (x, y, pw, ph, label, type = "usb") => {
          ctx.save();
          ctx.fillStyle = "#050809";
          roundRectPath(ctx, x, y, pw, ph, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(189,214,219,0.24)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "rgba(185,214,220,0.55)";
          ctx.font = "500 10px Bahnschrift, Arial, sans-serif";
          ctx.fillText(label, x, y + ph + 18);
          if (type === "usb") {
            ctx.fillStyle = "rgba(84,169,192,0.55)";
            ctx.fillRect(x + 8, y + ph * 0.42, pw - 16, ph * 0.18);
          } else if (type === "lan") {
            ctx.fillStyle = "rgba(255,178,89,0.35)";
            ctx.fillRect(x + 6, y + 8, pw - 12, 6);
          } else if (type === "audio") {
            ctx.beginPath();
            ctx.arc(x + pw / 2, y + ph / 2, 8, 0, TAU);
            ctx.fillStyle = "rgba(65,213,155,0.6)";
            ctx.fill();
          }
          ctx.restore();
        };

        port(30, 100, 110, 50, "USB 3.2");
        port(160, 100, 110, 50, "USB 3.2");
        port(300, 96, 70, 42, "USB-C", "usbc");
        port(30, 210, 160, 58, "HDMI 2.1", "hdmi");
        port(210, 210, 160, 58, "DISPLAYPORT", "dp");
        port(30, 325, 170, 72, "2.5G LAN", "lan");
        port(220, 327, 68, 68, "AUDIO", "audio");
        port(300, 327, 68, 68, "MIC", "audio");

        ctx.strokeStyle = "rgba(176,205,211,0.14)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.moveTo(24, 470 + i * 8);
          ctx.lineTo(470, 470 + i * 8);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(219,235,238,0.36)";
        ctx.font = "500 15px Bahnschrift, Arial, sans-serif";
        ctx.fillText("BIOS FLASH", 30, 570);
        ctx.strokeStyle = "rgba(196,223,226,0.23)";
        ctx.strokeRect(30, 590, 72, 34);
        ctx.fillText("CLEAR CMOS", 30, 670);
        ctx.strokeRect(30, 690, 72, 34);

        ctx.fillStyle = "rgba(248,179,93,0.55)";
        ctx.font = "500 12px Bahnschrift, Arial, sans-serif";
        ctx.fillText("2.5G", 250, 380);
        ctx.fillStyle = "rgba(158,200,207,0.28)";
        for (let i = 0; i < 24; i++) {
          ctx.fillRect(244 + (i % 6) * 28, 820 + Math.floor(i / 6) * 20, 19, 5);
        }

        ctx.strokeStyle = "rgba(95,231,255,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 965);
        ctx.lineTo(468, 965);
        ctx.stroke();
        ctx.fillStyle = "rgba(95,231,255,0.4)";
        ctx.font = "500 11px Bahnschrift, Arial, sans-serif";
        ctx.fillText("ATX / IO SHIELD", 30, 990);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeGpuLabelTexture(anisotropy) {
      const texture = makeCanvasTexture(1024, 192, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(4,8,10,0.84)";
        roundRectPath(ctx, 0, 28, w, 112, 18);
        ctx.fill();
        ctx.strokeStyle = "rgba(133,220,232,0.18)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#dbe9ec";
        ctx.font = "600 46px Bahnschrift, Arial, sans-serif";
        ctx.fillText("GRAPHICS", 42, 102);
        ctx.fillStyle = "#ffb15a";
        ctx.font = "500 34px Bahnschrift, Arial, sans-serif";
        ctx.fillText("16G", 370, 101);
        ctx.fillStyle = "rgba(150,180,187,0.58)";
        ctx.font = "400 18px Bahnschrift, Arial, sans-serif";
        ctx.fillText("PCIe 5.0 / DUAL FAN", 520, 100);

        ctx.fillStyle = "rgba(95,231,255,0.72)";
        ctx.font = "500 13px Bahnschrift, Arial, sans-serif";
        ctx.fillText("03 / VGA", 42, 62);
        ctx.fillStyle = "rgba(255,177,90,0.65)";
        ctx.fillRect(42, 152, 160, 2);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeRamLabelTexture(anisotropy, side) {
      const texture = makeCanvasTexture(384, 768, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(12,19,23,0.7)");
        g.addColorStop(0.5, "rgba(27,37,42,0.74)");
        g.addColorStop(1, "rgba(8,13,16,0.7)");
        roundRectPath(ctx, 10, 40, w - 20, h - 80, 16);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "rgba(163,197,205,0.18)";
        ctx.stroke();

        ctx.fillStyle = "rgba(229,241,243,0.8)";
        ctx.font = "600 34px Bahnschrift, Arial, sans-serif";
        ctx.fillText("DDR5", 34, 128);
        ctx.fillStyle = "rgba(255,177,90,0.9)";
        ctx.font = "500 28px Bahnschrift, Arial, sans-serif";
        ctx.fillText("32GB", 34, 176);
        ctx.fillStyle = "rgba(155,180,186,0.55)";
        ctx.font = "400 15px Bahnschrift, Arial, sans-serif";
        ctx.fillText("6000 MT/s  ·  CL30", 34, 208);

        ctx.fillStyle = "rgba(95,231,255,0.45)";
        ctx.fillRect(34, 240, 230, 2);
        ctx.fillStyle = "rgba(165,193,199,0.35)";
        ctx.font = "400 12px Bahnschrift, Arial, sans-serif";
        ctx.fillText("METAL HEATSPREADER", 34, 278);
        ctx.fillText(side === "A" ? "DIMM A1" : "DIMM B1", 34, 300);

        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = `rgba(206,226,230,${0.05 + i * 0.015})`;
          ctx.fillRect(34, 370 + i * 23, 250 - i * 28, 2);
        }
        ctx.fillStyle = "rgba(255,177,90,0.7)";
        ctx.fillRect(34, 670, 210, 3);
        ctx.font = "400 11px Bahnschrift, Arial, sans-serif";
        ctx.fillStyle = "rgba(138,165,172,0.42)";
        ctx.fillText("XMP 3.0 / EXPO READY", 34, 700);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeM2LabelTexture(anisotropy) {
      const texture = makeCanvasTexture(640, 160, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(8,13,16,0.78)";
        roundRectPath(ctx, 0, 22, w, 116, 14);
        ctx.fill();
        ctx.fillStyle = "rgba(224,238,240,0.75)";
        ctx.font = "600 34px Bahnschrift, Arial, sans-serif";
        ctx.fillText("NVMe", 26, 92);
        ctx.fillStyle = "rgba(95,231,255,0.85)";
        ctx.font = "500 26px Bahnschrift, Arial, sans-serif";
        ctx.fillText("M.2 2280", 142, 92);
        ctx.fillStyle = "rgba(160,186,192,0.55)";
        ctx.font = "400 13px Bahnschrift, Arial, sans-serif";
        ctx.fillText("PCIe 4.0 ×4  /  2TB", 358, 90);
        ctx.fillStyle = "rgba(255,177,90,0.62)";
        ctx.fillRect(26, 120, 210, 2);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeCpuLabelTexture(anisotropy) {
      const texture = makeCanvasTexture(512, 512, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(218,228,231,0.36)";
        ctx.lineWidth = 2;
        roundRectPath(ctx, 22, 22, w - 44, h - 44, 32);
        ctx.stroke();
        ctx.fillStyle = "rgba(225,235,238,0.55)";
        ctx.font = "500 35px Bahnschrift, Arial, sans-serif";
        ctx.fillText("CPU", 48, 100);
        ctx.fillStyle = "rgba(22,29,32,0.62)";
        ctx.font = "400 18px Bahnschrift, Arial, sans-serif";
        ctx.fillText("PROCESSOR / LGA", 48, 136);
        ctx.fillStyle = "rgba(95,231,255,0.55)";
        ctx.fillRect(48, 166, 140, 2);
        ctx.fillStyle = "rgba(206,223,226,0.28)";
        ctx.font = "400 15px Bahnschrift, Arial, sans-serif";
        ctx.fillText("ATX TEARDOWN SAMPLE", 48, 412);
        ctx.fillText("REV 01 / 2026", 48, 436);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeFanHubTexture(anisotropy) {
      const texture = makeCanvasTexture(256, 256, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 112, 0, TAU);
        ctx.fillStyle = "rgba(6,10,12,0.94)";
        ctx.fill();
        ctx.strokeStyle = "rgba(95,231,255,0.28)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(226,240,242,0.85)";
        ctx.font = "700 62px Bahnschrift, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ATX", w / 2, h / 2 - 4);
        ctx.fillStyle = "rgba(95,231,255,0.52)";
        ctx.font = "400 18px Bahnschrift, Arial, sans-serif";
        ctx.fillText("DRAGON", w / 2, h / 2 + 52);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makePowerLabelTexture(anisotropy, main) {
      const texture = makeCanvasTexture(512, 128, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(7,11,14,0.72)";
        roundRectPath(ctx, 0, 22, w, 82, 8);
        ctx.fill();
        ctx.fillStyle = "rgba(218,233,236,0.72)";
        ctx.font = "600 24px Bahnschrift, Arial, sans-serif";
        ctx.fillText(main ? "ATX 24-PIN" : "EPS 8-PIN", 22, 73);
        ctx.fillStyle = "rgba(255,177,90,0.68)";
        ctx.font = "400 13px Bahnschrift, Arial, sans-serif";
        ctx.fillText(main ? "MAIN POWER" : "CPU POWER", 290, 73);
      });
      texture.anisotropy = anisotropy;
      return texture;
    }

    function makeEnvironmentTexture(anisotropy) {
      const texture = makeCanvasTexture(1024, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#010405");
        g.addColorStop(0.35, "#071116");
        g.addColorStop(0.55, "#102027");
        g.addColorStop(0.7, "#040a0c");
        g.addColorStop(1, "#010304");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const softbox = (x, y, rx, ry, color) => {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.4, color.replace("0.7", "0.26").replace("0.45", "0.18"));
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
          ctx.translate(-x, -y);
          ctx.fillStyle = gradient;
          ctx.fillRect(x - Math.max(rx, ry), y - Math.max(rx, ry), Math.max(rx, ry) * 2, Math.max(rx, ry) * 2);
          ctx.restore();
        };

        softbox(w * 0.18, h * 0.19, 130, 200, "rgba(194,235,245,0.7)");
        softbox(w * 0.72, h * 0.15, 180, 120, "rgba(144,211,229,0.45)");
        softbox(w * 0.45, h * 0.58, 280, 52, "rgba(238,248,250,0.36)");
        softbox(w * 0.92, h * 0.5, 100, 160, "rgba(255,166,85,0.45)");
        softbox(w * 0.03, h * 0.48, 80, 160, "rgba(74,199,217,0.3)");

        ctx.fillStyle = "rgba(174,226,237,0.22)";
        ctx.fillRect(0, h * 0.53, w, 1.5);
      });
      texture.mapping = T.EquirectangularReflectionMapping;
      texture.anisotropy = anisotropy;
      return texture;
    }

    /* ==================================================================
       04. MATERIALS / 硬件材质与程序化反射环境
       ================================================================== */
    function createMaterials(maxAnisotropy) {
      const textureAnisotropy = Math.min(8, maxAnisotropy);
      const boardTexture = makeBoardTexture(textureAnisotropy);
      const ioTtexture = makeIOTexture(textureAnisotropy);
      const gpuLabel = makeGpuLabelTexture(textureAnisotropy);
      const ramLabelA = makeRamLabelTexture(textureAnisotropy, "A");
      const ramLabelB = makeRamLabelTexture(textureAnisotropy, "B");
      const m2Label = makeM2LabelTexture(textureAnisotropy);
      const cpuLabel = makeCpuLabelTexture(textureAnisotropy);
      const fanHub = makeFanHubTexture(textureAnisotropy);
      const powerMainLabel = makePowerLabelTexture(textureAnisotropy, true);
      const powerCpuLabel = makePowerLabelTexture(textureAnisotropy, false);

      const standard = (color, options = {}) => new T.MeshStandardMaterial(Object.assign({
        color,
        roughness: 0.55,
        metalness: 0.25
      }, options));

      const materials = {
        textures: {
          board: boardTexture,
          io: ioTtexture,
          gpuLabel,
          ramLabelA,
          ramLabelB,
          m2Label,
          cpuLabel,
          fanHub,
          powerMainLabel,
          powerCpuLabel
        },
        pcb: standard(0x09221b, { roughness: 0.66, metalness: 0.16, envMapIntensity: 0.38 }),
        pcbEdge: standard(0x06160f, { roughness: 0.72, metalness: 0.18 }),
        boardFace: standard(0xffffff, { map: boardTexture, roughness: 0.58, metalness: 0.16, envMapIntensity: 0.35 }),
        metal: standard(0x8a949a, { roughness: 0.17, metalness: 0.92, envMapIntensity: 1.7 }),
        brushed: standard(0x5a646a, { roughness: 0.21, metalness: 0.88, envMapIntensity: 1.55 }),
        darkMetal: standard(0x1c2227, { roughness: 0.2, metalness: 0.88, envMapIntensity: 1.35 }),
        darkMetal2: standard(0x101518, { roughness: 0.5, metalness: 0.65, envMapIntensity: 0.55 }),
        gpuShroud: standard(0x2b333a, { roughness: 0.18, metalness: 0.86, envMapIntensity: 1.6 }),
        copper: standard(0xb36c3d, { roughness: 0.28, metalness: 0.9, envMapIntensity: 1.25 }),
        gold: standard(0xd5a651, { roughness: 0.24, metalness: 0.96, envMapIntensity: 1.2 }),
        blackPlastic: standard(0x0b0e11, { roughness: 0.72, metalness: 0.18 }),
        connector: standard(0x151a1e, { roughness: 0.58, metalness: 0.3 }),
        fanFrame: standard(0x1b2329, { roughness: 0.46, metalness: 0.42 }),
        fanBlade: standard(0x34424b, { roughness: 0.32, metalness: 0.4, envMapIntensity: 1.1, side: T.DoubleSide }),
        fanHub: standard(0x0f1519, { roughness: 0.45, metalness: 0.45 }),
        cap: standard(0x646d71, { roughness: 0.4, metalness: 0.72 }),
        capDark: standard(0x181e22, { roughness: 0.55, metalness: 0.45 }),
        silicone: standard(0x0b0c0d, { roughness: 0.9, metalness: 0.04 }),
        ramMetal: standard(0x3d464d, { roughness: 0.22, metalness: 0.9, envMapIntensity: 1.4 }),
        ramMetalDark: standard(0x222a30, { roughness: 0.38, metalness: 0.82 }),
        glowCyan: new T.MeshStandardMaterial({
          color: 0x0b2a30,
          emissive: 0x48def5,
          emissiveIntensity: 1.05,
          roughness: 0.35,
          metalness: 0.25
        }),
        glowAmber: new T.MeshStandardMaterial({
          color: 0x2c1a0a,
          emissive: 0xffa94d,
          emissiveIntensity: 0.9,
          roughness: 0.4,
          metalness: 0.2
        }),
        ioFace: new T.MeshStandardMaterial({
          map: ioTtexture,
          roughness: 0.42,
          metalness: 0.65,
          envMapIntensity: 0.8
        }),
        decalWhite: new T.MeshBasicMaterial({ color: 0xd7e9ec, toneMapped: false })
      };

      return materials;
    }

    function createEnvironment(renderer, anisotropy) {
      // 优先用全站共用的摄影棚环境（矩形柔光箱）；没有时退回本文件的旧版本
      const shared = window.ATX_ENV?.createEnvironment;
      if (typeof shared === "function") {
        const envMap = shared(renderer, anisotropy);
        if (envMap) return envMap;
      }
      const texture = makeEnvironmentTexture(anisotropy);
      const pmrem = new T.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envMap = pmrem.fromEquirectangular(texture).texture;
      texture.dispose();
      pmrem.dispose();
      return envMap;
    }

    /* ==================================================================
       05. MODEL HELPERS / 可复用的程序化零件
       ================================================================== */
    function createFan(radius, depth, labelTexture) {
      const group = new T.Group();
      const frameR = radius * 1.34;
      const frameShape = roundedRectShape(frameR * 2, frameR * 2, frameR * 0.22);
      const hole = new T.Path();
      hole.absarc(0, 0, radius * 1.03, 0, TAU, true);
      frameShape.holes.push(hole);
      const frameGeom = new T.ExtrudeGeometry(frameShape, {
        depth: depth * 0.66,
        steps: 1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 1
      });
      frameGeom.translate(0, 0, -depth * 0.33);
      addMesh(group, frameGeom, MATS.fanFrame);

      // 风扇边框上的四颗固定螺丝
      for (let sx = -1; sx <= 1; sx += 2) {
        for (let sy = -1; sy <= 1; sy += 2) {
          addCylinderZ(group, 0.018, 0.018, 0.024, MATS.darkMetal, [sx * frameR * 0.8, sy * frameR * 0.8, depth * 0.38], 12);
        }
      }

      const rotor = new T.Group();
      rotor.position.z = depth * 0.06;
      group.add(rotor);
      addCylinderZ(rotor, radius * 0.23, radius * 0.26, depth * 0.46, MATS.fanHub, [0, 0, 0], 24);
      addCylinderZ(rotor, radius * 0.16, radius * 0.16, depth * 0.5 + 0.005, MATS.darkMetal2, [0, 0, depth * 0.03], 20);

      const bladeShape = new T.Shape();
      bladeShape.moveTo(radius * 0.08, radius * 0.02);
      bladeShape.bezierCurveTo(radius * 0.27, radius * 0.2, radius * 0.62, radius * 0.16, radius * 0.94, -radius * 0.02);
      bladeShape.bezierCurveTo(radius * 0.59, -radius * 0.18, radius * 0.25, -radius * 0.12, radius * 0.08, -radius * 0.02);
      const bladeGeom = new T.ExtrudeGeometry(bladeShape, {
        depth: 0.011,
        steps: 1,
        curveSegments: 8,
        bevelEnabled: false
      });
      const blades = new T.InstancedMesh(bladeGeom, MATS.fanBlade, 7);
      const dummy = new T.Object3D();
      for (let i = 0; i < 7; i++) {
        dummy.position.set(0, 0, 0.018);
        dummy.rotation.set(0, 0, (i / 7) * TAU + 0.22);
        dummy.updateMatrix();
        blades.setMatrixAt(i, dummy.matrix);
      }
      blades.instanceMatrix.needsUpdate = true;
      blades.castShadow = false;
      blades.receiveShadow = false;
      rotor.add(blades);

      addTorus(group, radius * 0.98, 0.012, MATS.glowCyan, [0, 0, depth * 0.4], [0, 0, 0], 8, 32);
      addTorus(group, radius * 0.83, 0.006, MATS.darkMetal2, [0, 0, depth * 0.43], [0, 0, 0], 6, 24);

      if (labelTexture) {
        const circle = new T.Mesh(
          new T.CircleGeometry(radius * 0.19, 24),
          new T.MeshBasicMaterial({ map: labelTexture, transparent: true, toneMapped: false })
        );
        circle.position.z = depth * 0.29;
        circle.castShadow = false;
        circle.receiveShadow = false;
        rotor.add(circle);
      }

      fanRotors.push({ rotor, speed: 0.6 + rnd() * 1.0, axis: "z" });
      return group;
    }

    function buildVrmHeatsink(width, height, finCount) {
      const group = new T.Group();
      addMesh(group, roundedPanelGeometry(width, height, 0.055, 0.018, 0.005), MATS.darkMetal);
      for (let i = 0; i < finCount; i++) {
        const fw = width / finCount * 0.44;
        addBox(group, fw, height * 0.84, 0.045, MATS.brushed, [-width / 2 + width / finCount * (i + 0.5), 0, 0.042]);
      }
      addBox(group, width * 0.92, 0.018, 0.12, MATS.glowCyan, [0, -height * 0.38, 0.012]);
      addBox(group, width * 0.25, height * 1.02, 0.015, MATS.darkMetal2, [width * 0.36, 0, 0.055]);
      return group;
    }

    function buildBoard() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.board);

      // PCB 本体与正面贴图
      addMesh(group, roundedPanelGeometry(BOARD_W, BOARD_H, BOARD_T, 0.032, 0.004), MATS.pcbEdge);
      addMesh(
        group,
        new T.PlaneGeometry(BOARD_W - 0.018, BOARD_H - 0.018),
        MATS.boardFace,
        [0, 0, BOARD_T / 2 + 0.002]
      );

      // 板边测量装饰线
      const lineMat = new T.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.22 });
      const m = 0.065;
      const z = 0.01;
      const corners = [
        [-BOARD_W / 2 - m, -BOARD_H / 2 - m], [BOARD_W / 2 + m, -BOARD_H / 2 - m],
        [BOARD_W / 2 + m, BOARD_H / 2 + m], [-BOARD_W / 2 - m, BOARD_H / 2 + m]
      ];
      const linePoints = [];
      for (let i = 0; i < 4; i++) {
        linePoints.push(new T.Vector3(corners[i][0], corners[i][1], z));
        linePoints.push(new T.Vector3(corners[(i + 1) % 4][0], corners[(i + 1) % 4][1], z));
      }
      const frameLine = new T.LineSegments(new T.BufferGeometry().setFromPoints(linePoints), lineMat);
      group.add(frameLine);

      // 后置 IO 面板
      const io = new T.Group();
      io.position.set(-1.39, 0.76, 0.04);
      group.add(io);
      addMesh(io, roundedPanelGeometry(0.25, 0.92, 0.13, 0.016, 0.006), MATS.brushed);
      addMesh(io, new T.PlaneGeometry(0.215, 0.86), MATS.ioFace, [0, 0, 0.068]);
      const portMat = MATS.blackPlastic;
      addBox(io, 0.095, 0.045, 0.035, portMat, [-0.035, 0.31, 0.09]);
      addBox(io, 0.085, 0.04, 0.035, portMat, [0.035, 0.31, 0.09]);
      addBox(io, 0.075, 0.052, 0.035, portMat, [-0.04, 0.21, 0.09]);
      addBox(io, 0.065, 0.052, 0.035, portMat, [0.04, 0.21, 0.09]);
      addBox(io, 0.085, 0.07, 0.035, portMat, [-0.03, -0.03, 0.09]);
      addBox(io, 0.07, 0.07, 0.035, portMat, [0.05, -0.03, 0.09]);
      for (let i = 0; i < 3; i++) {
        addCylinderZ(io, 0.02, 0.02, 0.03, MATS.gold, [0.055, 0.12 - i * 0.065, 0.09], 16);
      }
      addBox(io, 0.18, 0.02, 0.04, MATS.glowCyan, [0, -0.38, 0.09]);
      addDecal(io, textTexture("REAR I/O", {
        width: 512, height: 128, size: 36, color: "rgba(222,236,238,0.48)", align: "left", x: 18, offsetY: 0
      }), 0.2, 0.05, [0, 0.43, 0.1]);

      // CPU 插槽与保持架
      const socket = new T.Group();
      socket.position.set(-0.45, 0.55, 0.055);
      group.add(socket);
      addMesh(socket, roundedPanelGeometry(0.6, 0.6, 0.045, 0.03, 0.004), MATS.darkMetal2);
      addBox(socket, 0.5, 0.5, 0.012, MATS.gold, [0, 0, 0.03]);
      const pinTexture = makeCanvasTexture(512, 512, (ctx, w, h) => {
        ctx.fillStyle = "#111619";
        ctx.fillRect(0, 0, w, h);
        for (let y = 18; y < h; y += 15) {
          for (let x = 18; x < w; x += 15) {
            ctx.fillStyle = (x + y) % 3 === 0 ? "rgba(255,198,96,0.78)" : "rgba(213,166,78,0.45)";
            ctx.fillRect(x, y, 4, 4);
          }
        }
      });
      addDecal(socket, pinTexture, 0.47, 0.47, [0, 0, 0.04]);
      // 插槽压杆与边框
      addBox(socket, 0.66, 0.035, 0.05, MATS.metal, [0, 0.32, 0.02]);
      addBox(socket, 0.66, 0.035, 0.05, MATS.metal, [0, -0.32, 0.02]);
      addBox(socket, 0.035, 0.64, 0.05, MATS.metal, [0.32, 0, 0.02]);
      addCylinderZ(socket, 0.03, 0.03, 0.02, MATS.gold, [-0.27, -0.3, 0.05], 16);

      // VRM 散热片
      const vrmLeft = buildVrmHeatsink(0.52, 0.2, 7);
      vrmLeft.position.set(-0.94, 0.91, 0.07);
      vrmLeft.rotation.z = 0.05;
      group.add(vrmLeft);
      const vrmTop = buildVrmHeatsink(0.72, 0.18, 9);
      vrmTop.position.set(-0.1, 0.96, 0.07);
      group.add(vrmTop);

      // 芯片组散热片
      const chipset = new T.Group();
      chipset.position.set(0.85, -0.9, 0.06);
      chipset.rotation.z = -0.08;
      group.add(chipset);
      addMesh(chipset, roundedPanelGeometry(0.58, 0.48, 0.075, 0.03, 0.006), MATS.darkMetal);
      addBox(chipset, 0.48, 0.08, 0.09, MATS.brushed, [0, 0.12, 0.045]);
      addBox(chipset, 0.48, 0.08, 0.09, MATS.brushed, [0, -0.12, 0.045]);
      addBox(chipset, 0.46, 0.02, 0.015, MATS.glowAmber, [0, 0, 0.08]);
      addDecal(chipset, textTexture("CHIPSET", {
        width: 512, height: 128, size: 28, color: "rgba(214,229,232,0.52)", align: "left", x: 18
      }), 0.38, 0.095, [0, -0.2, 0.084]);

      // 内存插槽
      [0.55, 0.83].forEach((x) => {
        const slot = new T.Group();
        slot.position.set(x, 0.22, 0.06);
        group.add(slot);
        addBox(slot, 0.055, 1.08, 0.06, MATS.blackPlastic, [0, 0, 0]);
        addBox(slot, 0.024, 0.94, 0.016, MATS.gold, [0.008, 0, 0.037]);
        addBox(slot, 0.062, 0.08, 0.065, MATS.connector, [0, 0.52, 0.01]);
        addBox(slot, 0.062, 0.08, 0.065, MATS.connector, [0, -0.52, 0.01]);
      });

      // PCIe x16 插槽
      const pcie = new T.Group();
      pcie.position.set(-0.08, -0.23, 0.055);
      group.add(pcie);
      addBox(pcie, 1.28, 0.09, 0.07, MATS.blackPlastic, [0, 0, 0]);
      addBox(pcie, 1.18, 0.018, 0.02, MATS.gold, [0.02, 0.018, 0.045]);
      addBox(pcie, 0.2, 0.11, 0.08, MATS.connector, [-0.6, 0, 0.02]);
      // 下方两条辅助 PCIe
      [-0.72, -1.02].forEach((y, index) => {
        addBox(group, index === 0 ? 0.92 : 0.7, 0.07, 0.06, MATS.blackPlastic, [0.04, y, 0.05]);
        addBox(group, index === 0 ? 0.82 : 0.6, 0.01, 0.018, MATS.gold, [0.04, y + 0.014, 0.038]);
      });

      // M.2 插槽与定位立柱
      addBox(group, 0.98, 0.075, 0.05, MATS.blackPlastic, [0.18, -0.11, 0.045]);
      addBox(group, 0.86, 0.012, 0.016, MATS.gold, [0.18, -0.085, 0.071]);
      addCylinderZ(group, 0.026, 0.026, 0.05, MATS.metal, [0.58, -0.11, 0.052], 16);

      // 铝电解电容：InstancedMesh
      const capPositions = [
        [-1.13, 1.04], [-1.02, 1.04], [-0.9, 1.04], [-0.78, 1.04],
        [-0.98, 0.79], [-0.88, 0.79], [-0.78, 0.79],
        [-0.02, 0.92], [0.11, 0.92], [0.24, 0.92], [0.37, 0.92],
        [-1.22, 0.12], [-1.22, 0.02], [-1.22, -0.08],
        [0.18, 0.82], [0.29, 0.82], [0.4, 0.82],
        [1.17, 0.88], [1.17, 0.78], [1.17, 0.68],
        [-1.18, -0.72], [-1.08, -0.72], [-0.98, -0.72],
        [0.65, -0.9], [0.8, -0.9], [0.95, -0.9]
      ];
      const capGeom = new T.CylinderGeometry(0.027, 0.027, 0.075, 16, 1, false);
      const caps = new T.InstancedMesh(capGeom, MATS.cap, capPositions.length);
      const dummy = new T.Object3D();
      capPositions.forEach(([x, y], i) => {
        dummy.position.set(x, y, 0.075);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        caps.setMatrixAt(i, dummy.matrix);
      });
      caps.instanceMatrix.needsUpdate = true;
      caps.castShadow = false;
      caps.receiveShadow = false;
      group.add(caps);

      // 小型固态电容：深色
      const solidCapPositions = [[-1.01, 0.68], [-.9, .68], [-.52, 0.9], [-.42, .9], [.43, .73], [.55, .73]];
      const solidCaps = new T.InstancedMesh(new T.CylinderGeometry(0.019, 0.019, 0.055, 12), MATS.capDark, solidCapPositions.length);
      solidCapPositions.forEach(([x, y], i) => {
        dummy.position.set(x, y, 0.065);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        solidCaps.setMatrixAt(i, dummy.matrix);
      });
      solidCaps.instanceMatrix.needsUpdate = true;
      solidCaps.castShadow = false;
      solidCaps.receiveShadow = false;
      group.add(solidCaps);

      // SATA 接口
      for (let i = 0; i < 3; i++) {
        const sx = 0.82 + i * 0.14;
        addBox(group, 0.085, 0.18, 0.11, MATS.connector, [sx, -0.99, 0.07]);
        addBox(group, 0.075, 0.055, 0.04, MATS.darkMetal2, [sx, -1.04, 0.13]);
      }

      // CMOS 电池
      addCylinderZ(group, 0.11, 0.11, 0.038, MATS.metal, [0.52, -0.78, 0.06], 24);
      addCylinderZ(group, 0.086, 0.086, 0.039, MATS.darkMetal, [0.52, -0.78, 0.085], 24);
      addBox(group, 0.08, 0.02, 0.02, MATS.gold, [0.67, -0.78, 0.09]);

      // 音频隔离区与前置接口
      addBox(group, 0.62, 0.32, 0.06, MATS.darkMetal, [-1.18, -0.64, 0.06]);
      addBox(group, 0.56, 0.025, 0.015, MATS.glowCyan, [-1.18, -0.57, 0.095]);
      for (let i = 0; i < 4; i++) {
        addCylinderZ(group, 0.027, 0.027, 0.06, MATS.gold, [-1.34 + i * 0.11, -0.72, 0.075], 16);
      }

      // 前面板、风扇 header 与测试点
      addBox(group, 0.32, 0.07, 0.055, MATS.blackPlastic, [-0.58, -1.16, 0.05]);
      for (let i = 0; i < 8; i++) {
        addCylinderZ(group, 0.006, 0.006, 0.02, MATS.gold, [-0.7 + i * 0.035, -1.16, 0.08], 8);
      }
      [[-0.92, 0.98], [0.46, 0.87], [1.13, 0.43], [-1.2, -0.18]].forEach(([x, y]) => {
        addBox(group, 0.07, 0.13, 0.035, MATS.blackPlastic, [x, y, 0.065]);
        addBox(group, 0.04, 0.02, 0.01, MATS.gold, [x, y + 0.04, 0.087]);
      });

      // 主板螺丝孔环
      const holePositions = [
        [-1.4, 1.1], [-1.4, 0.1], [-1.4, -0.92], [-0.9, -1.12],
        [0.25, -1.12], [1.4, -1.03], [1.4, -0.12], [1.4, 0.92], [-0.35, 1.13]
      ];
      holePositions.forEach(([x, y]) => {
        addTorus(group, 0.038, 0.007, MATS.gold, [x, y, 0.039], [0, 0, 0], 6, 16);
        const hole = new T.Mesh(
          new T.CircleGeometry(0.031, 16),
          new T.MeshBasicMaterial({ color: 0x010403, toneMapped: false })
        );
        hole.position.set(x, y, 0.04);
        group.add(hole);
      });

      setPartSelector(group, "board");
      return group;
    }

    function buildCPU() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.cpu);

      addBox(group, 0.43, 0.43, 0.036, MATS.pcbEdge, [0, 0, -0.018]);
      addBox(group, 0.39, 0.39, 0.012, MATS.gold, [0, 0, 0.005]);
      addMesh(group, roundedPanelGeometry(0.36, 0.36, 0.045, 0.034, 0.004), MATS.metal, [0, 0, 0.034]);
      addMesh(group, roundedPanelGeometry(0.375, 0.375, 0.02, 0.04, 0.003), MATS.darkMetal, [0, 0, 0.009]);

      // IHS 蚀刻文字与角标
      addDecal(group, MATS.textures.cpuLabel, 0.26, 0.26, [0, 0, 0.058]);
      addBox(group, 0.04, 0.012, 0.01, MATS.glowAmber, [-0.16, 0.16, 0.059], [0, 0, -0.7]);
      addBox(group, 0.14, 0.012, 0.006, MATS.glowAmber, [0.03, -0.18, 0.058]);
      addCylinderZ(group, 0.018, 0.018, 0.01, MATS.darkMetal2, [-0.16, -0.16, 0.058], 12);

      setPartSelector(group, "cpu");
      return group;
    }

    function buildCooler() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.cooler);

      // 铜底与扣具（落在 CPU 顶部）
      addBox(group, 0.58, 0.58, 0.07, MATS.copper, [0, 0, -0.43]);
      addBox(group, 0.72, 0.1, 0.055, MATS.darkMetal, [0, 0.35, -0.43]);
      addBox(group, 0.72, 0.1, 0.055, MATS.darkMetal, [0, -0.35, -0.43]);
      addCylinderZ(group, 0.045, 0.045, 0.078, MATS.copper, [-0.16, 0, -0.4], 20);
      addCylinderZ(group, 0.045, 0.045, 0.078, MATS.copper, [0.16, 0, -0.4], 20);

      // 四根 U 型热管
      const pipePositions = [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]];
      pipePositions.forEach(([x, y]) => {
        addCylinderZ(group, 0.03, 0.03, 0.78, MATS.copper, [x, y, -0.04], 20);
        addTorus(group, 0.09, 0.03, MATS.copper, [x, y, 0.365], [0, Math.PI / 2, 0], 8, 20);
      });

      // 铝鳍片阵列（实例化）
      const finGeom = new T.BoxGeometry(0.84, 0.92, 0.012);
      const fins = new T.InstancedMesh(finGeom, MATS.metal, 18);
      const dummy = new T.Object3D();
      const finStart = -0.34;
      const finEnd = 0.28;
      for (let i = 0; i < 18; i++) {
        const t = i / 17;
        dummy.position.set(0, 0, finStart + (finEnd - finStart) * t);
        dummy.rotation.set(0, 0, i % 2 === 0 ? 0.018 : -0.018);
        dummy.scale.set(1 - Math.abs(t - 0.5) * 0.1, 1, 1);
        dummy.updateMatrix();
        fins.setMatrixAt(i, dummy.matrix);
      }
      fins.instanceMatrix.needsUpdate = true;
      fins.castShadow = false;
      fins.receiveShadow = false;
      group.add(fins);

      // 鳍片两侧固定轨
      addBox(group, 0.034, 0.96, 0.68, MATS.darkMetal, [-0.44, 0, -0.02]);
      addBox(group, 0.034, 0.96, 0.68, MATS.darkMetal, [0.44, 0, -0.02]);

      // 顶部铭牌与风扇
      addBox(group, 0.64, 0.08, 0.06, MATS.darkMetal2, [0, 0.34, 0.33]);
      addDecal(group, textTexture(["TOWER", "4 × HEAT PIPE"], {
        width: 512, height: 256, size: 48, lineHeight: 58, sub: "THERMAL / 120MM", subSize: 18, subY: 68,
        color: "rgba(225,237,239,0.62)"
      }), 0.48, 0.24, [0, 0, 0.363]);

      const fan = createFan(0.39, 0.11, MATS.textures.fanHub);
      fan.position.set(0, 0, 0.45);
      group.add(fan);

      // 风扇扣具
      addBox(group, 0.06, 0.82, 0.06, MATS.darkMetal2, [-0.57, 0, 0.4]);
      addBox(group, 0.06, 0.82, 0.06, MATS.darkMetal2, [0.57, 0, 0.4]);
      addBox(group, 0.7, 0.025, 0.02, MATS.glowAmber, [0, -0.47, 0.47]);

      setPartSelector(group, "cooler");
      return group;
    }

    function buildRam(id, x, side) {
      const group = new T.Group();
      group.position.set(...BASE_POSITION[id]);

      addBox(group, 0.046, 0.98, 0.3, MATS.pcb, [0, 0, 0]);
      addBox(group, 0.034, 0.92, 0.27, MATS.ramMetalDark, [0, 0, 0.03]);
      // 金属马甲前后片
      for (const sx of [-1, 1]) {
        const plateGeom = roundedPanelGeometry(0.28, 0.9, 0.026, 0.04, 0.004);
        const plate = addMesh(group, plateGeom, sx > 0 ? MATS.ramMetal : MATS.ramMetalDark, [sx * 0.041, 0, 0.015], [0, Math.PI / 2, 0]);
        plate.rotation.y = Math.PI / 2;
        for (let i = 0; i < 5; i++) {
          addBox(group, 0.012, 0.78, 0.012, MATS.darkMetal2, [sx * 0.057, 0, -0.09 + i * 0.045]);
        }
      }
      addBox(group, 0.062, 0.026, 0.25, MATS.glowCyan, [0, 0.505, 0.025]);
      addBox(group, 0.054, 0.09, 0.28, MATS.ramMetal, [0, 0.47, 0.0]);
      addBox(group, 0.055, 0.06, 0.3, MATS.darkMetal2, [0, -0.5, 0.02]);

      addDecal(
        group,
        side === "A" ? MATS.textures.ramLabelA : MATS.textures.ramLabelB,
        0.26,
        0.56,
        [0.06, 0.02, 0.015],
        [0, Math.PI / 2, 0],
        0.92
      );
      addBox(group, 0.018, 0.19, 0.19, MATS.darkMetal2, [-0.016, -0.52, 0.02]);

      setPartSelector(group, id);
      return group;
    }

    function buildGPU() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.gpu);

      // PCB 与金属背板
      addBox(group, 2.5, 0.56, 0.036, MATS.pcbEdge, [0, 0, -0.055]);
      addMesh(group, roundedPanelGeometry(2.45, 0.5, 0.026, 0.06, 0.005), MATS.darkMetal, [0, 0, -0.102]);
      addBox(group, 2.34, 0.07, 0.03, MATS.brushed, [0, -0.2, -0.124]);
      for (let i = 0; i < 3; i++) {
        addBox(group, 0.34, 0.018, 0.012, MATS.blackPlastic, [-0.82 + i * 0.72, -0.12, -0.118]);
      }

      // 正面导流罩
      addMesh(group, roundedPanelGeometry(2.53, 0.57, 0.11, 0.07, 0.012), MATS.gpuShroud, [0, 0, 0.056]);
      addBox(group, 2.42, 0.12, 0.035, MATS.darkMetal, [0, -0.24, 0.11]);
      addBox(group, 2.36, 0.024, 0.02, MATS.glowCyan, [0, -0.302, 0.105]);
      addBox(group, 0.7, 0.045, 0.03, MATS.glowAmber, [0, 0.255, 0.113]);
      addDecal(group, MATS.textures.gpuLabel, 1.45, 0.27, [0, 0.255, 0.135], [0, 0, 0], 0.94);

      // 双风扇
      const fan1 = createFan(0.235, 0.1, MATS.textures.fanHub);
      fan1.position.set(-0.63, 0, 0.1);
      group.add(fan1);
      const fan2 = createFan(0.235, 0.1, MATS.textures.fanHub);
      fan2.position.set(0.63, 0, 0.1);
      group.add(fan2);

      // 金手指
      const fingerCount = 18;
      const fingerGeom = new T.BoxGeometry(0.038, 0.06, 0.012);
      const fingers = new T.InstancedMesh(fingerGeom, MATS.gold, fingerCount);
      const dummy = new T.Object3D();
      for (let i = 0; i < fingerCount; i++) {
        dummy.position.set(-0.42 + i * 0.05, -0.31, -0.055);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        fingers.setMatrixAt(i, dummy.matrix);
      }
      fingers.instanceMatrix.needsUpdate = true;
      fingers.castShadow = false;
      fingers.receiveShadow = false;
      group.add(fingers);

      // 顶部供电接口与侧面结构
      addBox(group, 0.22, 0.09, 0.1, MATS.blackPlastic, [0.87, 0.29, 0.05]);
      for (let i = 0; i < 4; i++) {
        addBox(group, 0.032, 0.02, 0.02, MATS.gold, [0.8 + i * 0.045, 0.33, 0.06]);
      }
      addBox(group, 0.08, 0.08, 0.24, MATS.darkMetal, [-1.25, -0.21, -0.02]);
      addBox(group, 0.08, 0.08, 0.24, MATS.darkMetal, [1.25, -0.21, -0.02]);

      // 侧边装饰线与品牌标
      addBox(group, 0.016, 0.33, 0.02, MATS.glowCyan, [-1.265, 0.08, 0.03]);
      addBox(group, 0.016, 0.33, 0.02, MATS.glowCyan, [1.265, 0.08, 0.03]);
      addDecal(group, textTexture(["VGA", "X16"], {
        width: 512, height: 512, size: 66, lineHeight: 72, color: "rgba(227,239,241,0.55)"
      }), 0.3, 0.3, [0, -0.04, 0.125], [0, 0, 0], 0.55);

      setPartSelector(group, "gpu");
      return group;
    }

    function buildM2() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.m2);

      addBox(group, 0.9, 0.225, 0.018, MATS.pcb, [0, 0, 0]);
      addBox(group, 0.09, 0.2, 0.014, MATS.gold, [-0.44, 0, 0.011]);
      addBox(group, 0.05, 0.18, 0.016, MATS.darkMetal2, [0.43, 0, 0.013]);
      addMesh(group, roundedPanelGeometry(0.82, 0.2, 0.06, 0.035, 0.006), MATS.brushed, [0, 0, 0.045]);
      addBox(group, 0.7, 0.012, 0.012, MATS.darkMetal2, [0, 0.085, 0.079]);
      addBox(group, 0.7, 0.012, 0.012, MATS.darkMetal2, [0, -0.085, 0.079]);
      addDecal(group, MATS.textures.m2Label, 0.62, 0.155, [0, 0, 0.081], [0, 0, 0], 0.96);
      addCylinderZ(group, 0.026, 0.026, 0.03, MATS.metal, [0.47, 0, 0.04], 16);
      addCylinderZ(group, 0.013, 0.013, 0.01, MATS.darkMetal2, [0.47, 0, 0.058], 12);

      setPartSelector(group, "m2");
      return group;
    }

    function build24Pin() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.atx24);

      addMesh(group, roundedPanelGeometry(0.24, 0.9, 0.17, 0.03, 0.008), MATS.blackPlastic, [0, 0, 0]);
      addMesh(group, roundedPanelGeometry(0.205, 0.855, 0.025, 0.025, 0.005), MATS.connector, [0, 0, 0.092]);
      addBox(group, 0.18, 0.045, 0.035, MATS.darkMetal2, [0, 0.46, 0.06]);
      addBox(group, 0.18, 0.045, 0.035, MATS.darkMetal2, [0, -0.46, 0.06]);

      const pinGeom = new T.BoxGeometry(0.054, 0.035, 0.014);
      const pins = new T.InstancedMesh(pinGeom, MATS.gold, 24);
      const dummy = new T.Object3D();
      for (let col = 0; col < 2; col++) {
        for (let row = 0; row < 12; row++) {
          dummy.position.set(-0.052 + col * 0.104, 0.37 - row * 0.067, 0.109);
          dummy.updateMatrix();
          pins.setMatrixAt(col * 12 + row, dummy.matrix);
        }
      }
      pins.instanceMatrix.needsUpdate = true;
      pins.castShadow = false;
      pins.receiveShadow = false;
      group.add(pins);
      addDecal(group, MATS.textures.powerMainLabel, 0.19, 0.05, [0, 0.32, 0.116], [0, 0, 0], 0.86);

      setPartSelector(group, "atx24");
      return group;
    }

    function buildCPUPower() {
      const group = new T.Group();
      group.position.set(...BASE_POSITION.cpu8);

      addMesh(group, roundedPanelGeometry(0.64, 0.22, 0.17, 0.03, 0.008), MATS.blackPlastic, [0, 0, 0]);
      addMesh(group, roundedPanelGeometry(0.6, 0.185, 0.025, 0.025, 0.005), MATS.connector, [0, 0, 0.092]);
      addBox(group, 0.12, 0.05, 0.04, MATS.darkMetal2, [0, -0.14, 0.06]);
      const pins = new T.InstancedMesh(new T.BoxGeometry(0.045, 0.04, 0.014), MATS.gold, 8);
      const dummy = new T.Object3D();
      for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 2; row++) {
          dummy.position.set(-0.18 + col * 0.12, -0.035 + row * 0.07, 0.109);
          dummy.updateMatrix();
          pins.setMatrixAt(col * 2 + row, dummy.matrix);
        }
      }
      pins.instanceMatrix.needsUpdate = true;
      pins.castShadow = false;
      pins.receiveShadow = false;
      group.add(pins);
      addDecal(group, MATS.textures.powerCpuLabel, 0.46, 0.065, [0, 0.045, 0.116], [0, 0, 0], 0.86);

      setPartSelector(group, "cpu8");
      return group;
    }

    /* ==================================================================
       06. PART REGISTRY / 部件注册、材质基线、CSS2D 标签
       ================================================================== */
    function registerPart(def, group) {
      group.position.set(...BASE_POSITION[def.id]);
      group.name = def.id;

      // 每个部件拥有独立的材质实例，避免高亮时互相影响
      const cloneMap = new Map();
      group.traverse((object) => {
        if (!object.isMesh) return;
        if (Array.isArray(object.material)) {
          object.material = object.material.map((material) => {
            if (!cloneMap.has(material)) cloneMap.set(material, material.clone());
            return cloneMap.get(material);
          });
        } else if (object.material) {
          if (!cloneMap.has(object.material)) cloneMap.set(object.material, object.material.clone());
          object.material = cloneMap.get(object.material);
        }
        object.castShadow = false;
        object.receiveShadow = false;
        object.userData.partId = def.id;
      });

      const materialStates = [];
      const seen = new Set();
      const meshes = [];
      group.traverse((object) => {
        if (!object.isMesh) return;
        meshes.push(object);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => {
          if (!material || seen.has(material)) return;
          seen.add(material);
          const baseEmissive = material.emissive ? material.emissive.clone() : null;
          materialStates.push({
            material,
            baseColor: material.color ? material.color.clone() : null,
            baseEmissive,
            baseEmissiveIntensity: material.emissiveIntensity === undefined ? 1 : material.emissiveIntensity,
            baseEmissiveLum: baseEmissive ? baseEmissive.r + baseEmissive.g + baseEmissive.b : 0
          });
        });
      });

      pickables.push(...meshes);

      const labelEl = document.createElement("div");
      labelEl.className = "part-label3d";
      labelEl.dataset.part = def.id;
      labelEl.innerHTML = `<span class="label-no">${def.no}</span><span>${def.name}</span><span class="label-en">${def.en}</span>`;
      const label = new CSS2DObject(labelEl);
      label.position.set(def.labelOffset[0], def.labelOffset[1], def.labelOffset[2]);
      group.add(label);

      const quat = group.quaternion.clone();
      const runtime = {
        def,
        group,
        meshes,
        materials: materialStates,
        basePos: group.position.clone(),
        currentPos: group.position.clone(),
        targetPos: group.position.clone(),
        baseQuat: quat.clone(),
        currentQuat: quat.clone(),
        targetQuat: quat.clone(),
        explodeQuat: quat.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(
          def.explodeRot[0], def.explodeRot[1], def.explodeRot[2]
        ))),
        label,
        labelEl,
        glow: 0,
        targetGlow: 0,
        dim: 1,
        targetDim: 1,
        outline: null
      };
      partRuntime.set(def.id, runtime);
      return runtime;
    }

    function buildModel() {
      modelRoot = new T.Group();
      modelRoot.name = "atx-motherboard";
      scene.add(modelRoot);

      const builders = {
        board: buildBoard,
        cpu: buildCPU,
        cooler: buildCooler,
        ram1: () => buildRam("ram1", 0.55, "A"),
        ram2: () => buildRam("ram2", 0.83, "B"),
        gpu: buildGPU,
        m2: buildM2,
        atx24: build24Pin,
        cpu8: buildCPUPower
      };

      PART_DATA.forEach((def) => {
        const group = builders[def.id]();
        const runtime = registerPart(def, group);
        modelRoot.add(group);
      });

      modelRoot.traverse((object) => {
        object.castShadow = false;
        object.receiveShadow = false;
      });
    }

  function buildProductModel(rendererApi) {
    renderer = rendererApi;
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    MATS = createMaterials(maxAnisotropy);
    pickables.length = 0;
    partRuntime.clear();
    fanRotors.length = 0;

    const root = new T.Group();
    root.name = "atx-motherboard";
    const builders = {
      board: buildBoard,
      cpu: buildCPU,
      cooler: buildCooler,
      ram1: () => buildRam("ram1", 0.55, "A"),
      ram2: () => buildRam("ram2", 0.83, "B"),
      gpu: buildGPU,
      m2: buildM2,
      atx24: build24Pin,
      cpu8: buildCPUPower
    };

    PART_DATA.forEach((def) => {
      const group = builders[def.id]();
      const runtime = registerPart(def, group);
      root.add(group);
      runtime.labelElement = runtime.labelEl;
      delete runtime.label;
      delete runtime.labelEl;
    });

    root.traverse((object) => {
      object.castShadow = false;
      object.receiveShadow = false;
    });
    root.updateMatrixWorld(true);

    const envMap = createEnvironment(renderer, maxAnisotropy);
    return {
      root: root,
      parts: Object.fromEntries(partRuntime),
      pickables: pickables.slice(),
      envMap: envMap,
      fans: fanRotors.slice()
    };
  }

  window.MotherboardModel = {
    build: buildProductModel,
    parts: PART_DATA,
    basePositions: BASE_POSITION
  };
})();


