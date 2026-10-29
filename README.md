# 拆装工作台 / PC WORKBENCH

把原先两个独立的单文件拆解页，合并为同一个可扩展产品站。首页负责产品目录，`viewer.html` 使用共享引擎渲染不同产品；新增产品时优先只增加一份配置。当前包含 ATX 主板（9 模块），以及在其基础上扩展出的 ATX 完整主机（22 模块）。

## 一键启动（Windows）

**双击根目录的 [`start.bat`](./start.bat) 即可本地预览。**

脚本会自动：

- 查找可用的 Python 3（优先 `py -3`，其次 `python`）；
- 检测 `8080`，如果被占用就改用 `8123`，并打印实际地址；
- 在独立的最小化窗口中启动本地 HTTP 服务；
- 自动打开浏览器访问首页；
- 如果两个端口都被占用、或本地服务启动失败，会给出提示并停住窗口；
- 如果未安装 Python 3，会提示安装地址，并提醒安装时勾选 `Add Python to PATH`。

> 服务运行在单独的最小化窗口里，关闭该窗口即可停止服务。启动器窗口可以按任意键关闭，不会影响服务。

## 手动启动

如果不使用一键脚本，也可以手动启动：

```powershell
cd E:\3dshow
python -m http.server 8080
```

打开：

- 首页：`http://127.0.0.1:8080/`
- ATX 主板：`http://127.0.0.1:8080/viewer.html?id=motherboard`
- ATX 完整主机：`http://127.0.0.1:8080/viewer.html?id=desktop`
- 装机配置器：`http://127.0.0.1:8080/configurator.html`

> Three.js r160、`OrbitControls`、`CSS2DRenderer` 已打包在 `vendor/three.bundle.js`，不依赖 CDN。由于页面使用 ES module，请通过 HTTP 服务访问，不建议直接双击 `file://`。

## 目录

```text
start.bat                       Windows 一键启动（8080 → 8123 自动切换）
index.html                      首页产品卡片 + 配置器入口
viewer.html                     统一拆解页 (?id=motherboard / desktop)
configurator.html               装机配置器（整机装配 + RGB）
css/home.css                    首页视觉
css/viewer.css                  拆解页视觉与响应式布局
css/configurator.css            配置器视觉
js/engine.js                    scene / camera / controls / 拆解状态机 / 聚焦 / 自适应画质
js/ui.js                        部件清单 / 参数面板 / 引导 / 灯效 / 提示
js/loader.js                    产品注册表读取、config → buildModel → UI
js/configurator.js              配件选择、兼容检查、装配挂载、保存分享
configs/index.js                产品注册表
configs/motherboard.js          ATX 主板纯数据配置
configs/desktop.js              ATX 完整主机配置，复用主板 parts 数据
models/env.js                   全站共用程序化 IBL 环境（矩形柔光箱 → PMREM）
models/motherboard.js           ATX 主板程序化模型
models/desktop.js               整机工厂：复用主板模型 + 机箱/电源/风扇/线材
models/*-preview.js             配置器用的参数化小模型（显卡/机箱/主板/散热/电源/内存/风扇）
data/components/*.json          GPU / CPU / 主板 / 散热器 / 内存 / 存储 / 电源 / 机箱风扇 / 机箱数据
data/presets.json               八组用途预设的 9 品类型号组合
assets/                         产品卡片缩略图
vendor/three.bundle.js          本地 Three.js r160 + addons
```

## 配置格式

产品 `configs/*.js` 都是纯数据。当前首页展示 ATX 主板与完整整机；Action 4 相关配置、模型和旧页面已移除。核心结构：

```js
export default {
  id: "product-id",
  name: "产品名",
  category: "分类",
  isPremium: false,
  thumbnail: "assets/thumbnail.png",
  theme: "product-id",
  camera: {
    position: [x, y, z],
    target: [x, y, z],
    fov: 34,
    fovTablet: 38,
    fovNarrow: 42
  },
  views: {
    exploded: { position: [x, y, z], target: [x, y, z] }
  },
  render: { exposure: 1 },
  stage: { radius: 2.7, y: -1.65, accent: 0xffb15a, secondary: 0x5fe7ff },
  lights: [ /* 见现有配置 */ ],
  overview: { name, en, description, stats, specs },
  parts: [
    {
      id: "part-id",
      number: "01",
      name: "部件名",
      en: "PART NAME",
      category: "CATEGORY",
      short: "列表摘要",
      description: "详情描述",
      stats: [["数值", "LABEL"]],
      specs: [["参数", "值"]],
      role: "功能说明",
      install: "装配位置",
      position: [0, 0, 0],
      material: { color: 0x8899aa, metalness: 0.8, roughness: 0.3 },
      geometry: { type: "box", size: [1, 0.2, 0.6] },
      explodeDir: [0, 1, 0],
      explodeDist: 1.2,
      explodeRot: [0, 0, 0],
      focus: { theta: 0.6, phi: 1.2, radius: 4, target: [0, 0, 0] },
      params: { /* 右侧面板可显示的数据 */ },
      deps: ["prerequisite-part-id"],
      fixed: false
    }
  ]
};
```

### geometry 类型

`loader.js` 内置纯数据几何工厂，支持：

- `box`：`size: [w, h, d]`
- `cylinder`：`args: [radiusTop, radiusBottom, height, segments]`
- `sphere`：`args: [radius, widthSegments, heightSegments]`
- `plane`：`size: [w, h]`
- `torus`：`args: [radius, tube, radialSegments, tubularSegments]`
- `compound`：`children: [子 geometry 节点]`

所有几何段数会被限制在 32 以内。

## 产品模型

ATX 主板与完整整机不是几个 box 能还原的模型，它们的 PCB、散热鳍片、风扇、针脚、机箱与线材都是由大量程序化几何组成的。为了保持原来的视觉细节，产品保留自己的模型工厂：

- `models/motherboard.js` → `window.MotherboardModel.build(renderer)`
- `models/desktop.js` → `window.DesktopModel.build(renderer)`

整机工厂直接调用 `window.MotherboardModel.build(renderer)`，只对主板各部件组做整体偏移，然后添加机箱、侧板、前面板、顶部盖板、电源、四枚风扇和四组线材；主板几何与材质代码未改动。

配置里只写一个 `model` 字段：

```js
model: "ActionCameraModel" // 或 "MotherboardModel" / "DesktopModel"
```

`loader.js` 会优先调用这个工厂；没有 `model` 字段时，直接按 `parts[].geometry` 生成。新增一个简单的纯数据产品，只需要写 `configs/<id>.js` 并在 `configs/index.js` 注册。若将来需要另一个复杂程序化产品，再增加一个模型工厂即可。

## ATX 完整主机

`configs/desktop.js` 直接从 `configs/motherboard.js` 复用 9 个主板部件的完整数据，只覆盖依赖、编号和爆开方向。`models/desktop.js` 从 `MotherboardModel` 取得原始部件组，将整组偏移到机箱内部，再添加 13 个新部件，共 22 个独立可拆模块：

- 机箱框架、钢化玻璃侧板、前面板、顶部盖板
- 850W 全模组电源
- 前置 120mm × 2、顶部 140mm、后置 120mm 风扇
- 24-pin 主板供电线、CPU 8-pin 线、显卡供电线、SATA 供电线
- 原有 CPU、散热器、内存、显卡、M.2、供电接口与主板

主要解锁链：

```text
侧板 → 显卡 → 内存 A/B → 散热器 → CPU → 主板 → 电源 → 机箱
```

另外，M.2、24-pin、8-pin 需要先于主板拆下；前面板/顶部盖板依赖侧板；对应风扇依赖各自面板；线材在侧板后可拆。全部 22 个模块都有独立的 `params`、`stats`、`specs`、`focus` 与 `explode` 数据。

侧板玻璃是透明 Mesh，带 `userData.noPick = true`。这个标记现在表示“低优先级拾取”而不是“不可拾取”：Raycaster 收集全部交点后，优先返回玻璃后方第一个普通部件；只有没有普通部件命中时，才回退选中玻璃/侧板。玻璃后方的机箱大背板、托架也标为低优先级，所以点击玻璃空白区可以选中侧板，点击硬件则直接选中硬件。

## 装机配置器（阶段 2 / 3 / 4 / L2 / Stage 5）

独立页面 [`configurator.html`](./configurator.html)，不修改 `viewer.html` 或 3D 产品。阶段 2 是配件选择与兼容检查；阶段 3 给显卡增加参数化 3D；L1 把机箱与显卡组合；L2 再加入主板和散热器。电源与内存仍未做真实装配。配件数据来自：

```text
data/components/gpu.json          9 款
data/components/cpu.json          7 款
data/components/motherboard.json  10 款
data/components/cooler.json       7 款
data/components/memory.json       6 款
data/components/storage.json      5 款
data/components/psu.json          8 款
data/components/casefan.json      5 款
data/components/case.json         8 款
```

共 65 个真实型号。L2 新增 5 款散热器和 2 款 ITX 主板；Stage 5 新增 5 款机箱风扇，并补齐电源、内存、机箱风扇的 3D 参数；本轮新增 5 款存储、2 款 240/280 水冷。每条记录包含 `id / name / brand / specs / compat / modelParams / price / fidelity`。当前 9 个品类都参与配置单；存储参与接口检查，但不单独做 3D 模型。机箱新增 `compat.fanSlots`、`compat.radiatorPositions`，电源新增 `compat.connectors`，RTX 4090 新增 `requires12vhpwr`。

本轮检查 18 项兼容性：

1. **CPU 插槽 vs 主板插槽**：比较 `cpu.compat.socket` 与 `motherboard.compat.socket`。
2. **散热器插槽 vs CPU 平台**：`cooler.compat.socket` 必须包含 CPU 插槽；没有 CPU 时回退到主板插槽。
3. **主板板型 vs 机箱支持**：`case.compat.supportedFormFactors` 必须包含 `motherboard.compat.formFactor`。
4. **显卡长度 vs 机箱限长**：比较 `gpu.modelParams.length` 与 `case.compat.maxGpuLength`。
5. **显卡厚度 vs 机箱槽位**：比较 `gpu.modelParams.thickness` 与 `case.compat.maxGpuThickness`。
6. **散热器高度 vs 机箱限高**：比较 `cooler.modelParams.height` 与 `case.compat.maxCoolerHeight`。
7. **冷排规格 vs 机箱支持**：`modelParams.radiatorSize > 0` 时，检查是否在 `case.compat.supportedRadiatorSizes` 中；风冷跳过。
8. **冷排位置 vs 机箱安装位**：按 `radiatorPosition` 查 `case.compat.radiatorPositions`；未指定位置时按总支持列表判断。
9. **冷排厚度 vs 机箱空间**：冷排厚度 + 风扇厚度与 `case.compat.maxRadiatorThickness` 比较；风冷跳过。
10. **机箱风扇 vs 安装位**：按 `fanSlots` 的位置、数量、尺寸检查风扇的 `positions / quantity / size`。
11. **内存高度 vs 散热器避让**：比较 `memory.modelParams.height` 与 `cooler.compat.memoryClearance`。
12. **内存类型 vs 主板支持**：比较 `memory.compat.memoryType` 与 `motherboard.compat.memoryType`（DDR5 / DDR4）。
13. **电源长度 vs 机箱电源仓**：比较 `psu.modelParams.length` 与 `case.compat.maxPsuLength`。
14. **电源功率 vs CPU + 显卡功耗 × 1.3**：要求 `psu.compat.wattage >= ceil((cpu.compat.powerWatt + gpu.compat.powerWatt) * 1.3)`。
15. **显卡供电 vs 电源接口**：`gpu.compat.requires12vhpwr` 为真时，`psu.compat.connectors["12vhpwr"]` 必须大于 0。
16. **PCIe 8pin 数量**：比较 `gpu.compat.pcie8` 与 `psu.compat.connectors.pcie8`。
17. **存储接口 vs 主板接口**：M.2 检查 `m2Slots > 0`，SATA 检查 `sataPorts > 0`。
18. **M.2 长度 / key vs 主板**：比较 `storage.compat.m2Length / m2Key` 与 `motherboard.modelParams.m2Lengths / m2Key`。

如果必要数据未选齐，对应检查为“待选择”；不兼容时右侧显示红色原因说明，并在详情里给出“为什么 + 可换型号”。

冷排位置只先给 5 款支持 360 的机箱填写：North、O11 Dynamic EVO、4000D AIRFLOW、7000D AIRFLOW、Meshify 2 XL。其余机箱的 `radiatorPositions` 为空，检查会回退到 `supportedRadiatorSizes`。

三款水冷的 `radiatorPosition` 当前为 `null`：一体水冷可以按机箱选择前 / 顶 / 侧安装，不能把某个安装位写死成散热器属性。未指定位置时，只要机箱任一位置支持该冷排规格就通过；以后若某款散热器确实只能装固定位置，再填 `前 / 顶 / 侧`。

选中水冷后，配置单的散热器行下方出现安装位置选择器：`不限 / 前部 / 顶部 / 侧面`，默认「不限」。选择结果写入 `state.radiatorPosition`，并进入 localStorage 与分享 payload；更换为风冷或移除散热器时清空。`radiatorPosition` 为构建状态，不写回散热器 JSON。

通过状态折叠为一行「全部 18 项通过 · 点击查看详情」；点击该行或「查看全部 18 项」后才展开完整检查列表。失败状态仍直接列出失败项。

390px 下品类列表排在预设按钮上方；预设按钮横向滚动，不再纵向堆叠。

### 自定义配件（最小版）

每个品类型号列表底部有「找不到型号？添加自定义配件」，弹窗按品类显示结构化字段。只要求名称，其余字段留空表示未知。

- 显卡：名称、长度、厚度、功耗、PCIe 8pin 数量、需要 12VHPWR（是 / 否 / 未知）
- CPU：名称、插槽、功耗
- 主板：名称、板型、内存类型、插槽、M.2 数量、M.2 key、M.2 长度支持、SATA 数量
- 散热器：名称、类型、高度、冷排规格、冷排厚度、风扇厚度、支持插槽、内存避让
- 内存：名称、类型、容量、马甲高度
- 电源：名称、功率、长度、12VHPWR 数量、PCIe 8pin 数量
- 机箱：名称、支持板型、显卡限长/限厚、散热限高、冷排空间、电源限长、冷排位/规格、风扇位/尺寸
- 存储：名称、类型、长度、M.2 长度规格、M.2 key、协议
- 机箱风扇：名称、尺寸、数量、位置

未知字段不会写成 0，也不会默认通过。检查项会变成「待确认」，检查区显示 `X 项通过 / Y 项待确认 / Z 项失败`；只要还有待确认，就不会显示 18/18。自定义件卡片和配置单行带「自定义 · 未审核」标记，3D 预览显示「含自定义件 · 未建模」。

自定义件存放在独立 key `atx-configurator-custom-parts-v1`，不写入官方 JSON。含自定义件的配置分享时先选择「分享含自定义件的配置」或「只分享官方配件」：前者把精简定义放进 payload 的 `c` 字段，后者只带官方件并记录省略数量 `n`。从分享链接导入的自定义件标「自定义 · 分享导入」；同 ID 冲突时保留接收方本机版本。

### 本机保存的配置列表

不提供账号或登录入口。配置列表存在本机：

- key：`atx-configurator-saved-configs-v1`
- 扁平数组，最多 20 条
- 每条包含选中型号、冷排安装位置和自定义件精简定义
- 弹窗标题为「本机保存的配置列表」，并明确标注「仅保存在这台设备」

顶部「本机配置列表」可以保存、载入、删除配置；不需要登录，也不会同步到其他设备或浏览器。分享不需要身份，payload 不包含账号 ID。

提示文案按“告诉用户怎么办”处理：

- 显卡超长/过厚：显示具体长度或槽位、超出量，并列出可换显卡或机箱。
- 电源不足：显示建议功率、当前功率，并列出满足功率的电源。
- 板型、散热器高度、冷排规格、冷排位置、风扇安装位、内存高度、存储接口：显示限制值，并列出可换主板/机箱/散热器/风扇/内存/存储。
- CPU/主板插槽、散热器扣具、显卡供电：显示插槽/接口差异，并列出可换 CPU/主板/散热器/电源/显卡。

CPU 与主板之间还做了**选前双向门禁**：

- 已选 CPU 时，插槽不兼容的主板卡片灰显并标注“插槽不兼容”；
- 已选主板时，插槽不兼容的 CPU 卡片同样灰显；
- 点击灰卡不会改变当前配置，而是通过底部 toast 说明原因，并提示先取消已选 CPU/主板；
- 取消 CPU 或主板后，另一侧的灰卡会自动恢复可选；
- 选完后的红色兼容检查保留，继续作为 GPU/机箱/电源等场景的兜底。

### 显卡参数化模型（阶段 3）

新增 [`models/gpu-preview.js`](./models/gpu-preview.js)，完全由 `modelParams` 生成：

- `length` → 显卡长度与相机取景；
- `thickness` → 卡身厚度 / 插槽厚度；
- `fanCount` → 1 / 2 / 3 个前置风扇；
- `hasBackplate` → 是否生成金属背板。

### 机箱 + 显卡装配预览（阶段 4 / L1）

配置网格下方是全宽 `ASSEMBLY 3D` 面板；选中机箱或显卡后，右侧配置单会出现“查看 L2 装配预览 ↓”的跳转按钮。L1 共有四种模式：

- **无选择**：空状态；
- **只选机箱**：机箱空着，显示主板位、GPU 位、电源位示意；
- **只选显卡**：保持单卡 3D 预览，共享舞台仍显示；
- **机箱 + 显卡**：显卡装进机箱显卡位，并显示 FIT / OVER 装配状态。

机箱尺寸来自新增的 `modelParams.tier / length / width / height`：

- `tier`：`itx` / `mid` / `full`，分别对应 ITX、中塔、全塔细节档；
- `length`：机箱前后深度（X 轴）；
- `width`：机箱宽度（Z 轴，侧透玻璃在 +Z）；
- `height`：机箱高度（Y 轴）；
- `compat.maxGpuLength`：决定显卡安装限位。

显卡定位在机箱内部后侧：`rearX = -length/2 + 0.12`，显卡中心沿 X 前进半个卡长，Y 在机箱高度的约 47% 处，Z 朝侧透玻璃方向。机箱前部是开放框架，显卡超长时会先穿过限位，再伸出前框。

超长可视化：

- 显卡长度 > 机箱限长时，限位线、超出段、前缘状态灯全部转为红色；
- 显卡前端超过机箱前框时会实际伸到机箱外；
- 右侧显示 `超出 XXXmm / OVER` 与具体长度；
- 装得下时显示绿色 FIT、绿色限位/前缘状态灯，显卡完整位于机箱内。

共享引擎只新增了通用能力：`viewportElement`（按容器取尺寸）、`previewMode`（关闭拾取）、`setStageVisible`（切换共享舞台显隐）；没有写机箱/显卡专用逻辑。继续保持无 Bloom、无阴影、`setPixelRatio(min(dpr, 1.5))`。

### 机箱 + 主板 + 散热器 + 显卡装配（L2）

L2 在 L1 基础上加入主板与散热器，配置器现在有 7 个品类：

- 主板按 `modelParams.formFactor / length / width` 生成 ATX / M-ATX / ITX / E-ATX 板；
- 主板竖装在机箱后部，PCIe 槽位于局部 Y=0；
- 显卡定位到主板 PCIe 槽前：`gpuZ = 主板表面 + 0.045 + 显卡厚度/2`，并通过新增的 PCIe 连接块与插槽相接，不再悬空；
- 散热器装在 CPU 位，高度从主板表面沿 +Z（朝侧透玻璃方向）生成；
- 机箱前部仍为开放框架，GPU 超长会穿出前框；GPU 超高/散热器超高用红色超出段与红色状态灯表示。

散热器高度规则：

```text
cooler.modelParams.height > case.compat.maxCoolerHeight → 红色“盖不上侧板”
```

机箱新增 `compat.maxCoolerHeight`：North 170、O11D 167、H5 165、4000D 170、SG13 61、Velka 3 37、7000D 190、Meshify 2 XL 185mm。

L2 的 3D 场景有五种状态分支：

- 无选择：空状态；
- 只选机箱：空机箱 + 主板位/GPU 位/电源位示意；
- 只选显卡：单卡预览；
- 只选主板/散热器（无机箱）：`COMPONENT` 工作台预览；
- 机箱 + 任一装配件：`装配中`，主板、散热器、显卡按选择组合。

### 整机装配 + RGB（Stage 5）

Stage 5 把电源、内存、机箱风扇和示意走线加入装配，后续又加入存储，配置器扩展到 9 个品类：

- **电源**：`psu.json` 的 `modelParams` 增加 `length / width / height / modularType / interfaces`；按尺寸生成 ATX 方块、风扇罩、模组接口，放在机箱底部电源位。
- **内存**：按 `moduleCount / height / hasRgb` 生成垂直内存条、马甲和 RGB 顶灯，插入主板 4 个 RAM 槽中的对应槽位。
- **机箱风扇**：新增 `casefan.json`，按 `size / quantity / hasRgb / positions` 在前面板、顶部、后部安装 120/140mm 风扇；RGB 环与扇叶使用高 emissive 材质，并附少量点光源提亮。
- **走线**：电源接 24-pin、CPU 8-pin、GPU 供电三段 TubeGeometry 曲线，从 PSU 顶部的模组接口连到主板和显卡；只做示意，不追求真实线材弯曲。
- **整机状态**：9 个品类全部选齐且 CPU 存在时，预览状态显示“整机装配”；缺少任一件回退为“装配中”，右侧显示电源/内存/存储/风扇/走线摘要。
- **兼容检查**：扩展到 18 项，新增散热器扣具、板型、显卡厚度、冷排规格/位置/厚度、风扇安装位、内存高度、内存类型、电源长度、显卡供电、PCIe 8pin、存储接口和 M.2 长度/key；失败详情包含原因与可换型号。

CPU 仍只参与参数与兼容检查，没有单独 CPU 3D 模型。共享引擎继续只提供通用开关，不包含电源/内存/风扇专用逻辑。继续保持无 Bloom、无阴影、`setPixelRatio(min(dpr, 1.5))`；RGB 依靠 emissive 和点光源，不依赖 Bloom。

### 保真标签

每个配件记录包含 `fidelity`：

- `exact`：尺寸与轮廓都较准确；
- `proportional`：尺寸准确、外观简化。

当前 65 个配件全部标记为 `proportional`：这一轮不做 Hero 模型，避免把参数化简化外观虚标为 exact。以后某个型号换成更准确的轮廓，只需改 JSON 的 `fidelity`，预览说明和导出会自动更新。

卡片上不再重复挂保真标签；3D 预览区顶部统一提示「3D 外观为示意，尺寸按真实参数生成」。文字导出仍保留每个配件行的 `保真：比例示意` / `保真：尺寸精确`。

### 用途预设

`data/presets.json` 维护八组一键预设，配置器顶部按钮读取该文件并填入 9 个品类。预设条是单行横向滚动，高度恒定一行：

- **1080p 游戏** —— 中端配置，预算友好
- **2K 高刷** —— 2K 高刷，4070 Ti 级
- **小体积静音** —— ITX 机箱，无 RGB
- **办公轻量** —— 预算优先，办公够用
- **4K 发烧** —— 旗舰卡 + 1000W
- **创作生产力** —— 16 核 + 64GB
- **AMD 游戏** —— 3D 缓存 + A 卡
- **海景房光效** —— 海景房 + 全套 RGB

原始条目示例：

| 预设 | 定位 | 关键选择 |
|---|---|---|
| 1080p 游戏 | 中端、预算友好 | RTX 4060 Solo / i5-14600K / B760M / 650W / 4000D |
| 2K 高刷 | 中高端、4070 级别 | RTX 4070 Ti SUPER / i5-14600K / Z790 / LT720 360 / North |
| 小体积静音 | ITX、低功耗、无 RGB | RTX 4060 Solo / i3-14100 / B760-I / NH-L9i / SUGO 13 |

三个预设均通过全部 18 项兼容检查；点击后配置单、9/9 计数、3D 装配预览同步更新。已有配置时先弹确认「载入预设将覆盖当前配置」；载入后提供 5 分钟有效的「撤销预设」按钮，恢复上一套配置。

### 保存 / 分享 / 导出（纯前端）

右侧配置单新增 `SAVE / SHARE` 区块：

- **本机保存**：每次选择、移除或清空后自动写入 `localStorage`；
  - 自定义件独立 key：`atx-configurator-custom-parts-v1`
  - 配置 key：`atx-configurator-build-v1`
  - 内容：`{ version: 1, savedAt: ISO 时间, selected: { 品类: 型号 ID 或 null }, radiatorPosition: "" }`
  - 打开页面自动恢复；恢复时 toast 提示“已恢复上次配置”。
- **分享链接**：
  - 编码官方型号 ID、冷排安装位置；自定义件按需编码精简定义；
  - payload 为 `{ v: 1, s: { gpu: "...", cpu: "...", ... }, p: "top" }`；
  - 含自定义件时，完整分享增加 `c: { "custom-id": { category, name, modelParams, compat } }`；
  - 只分享官方配件时省略 `c`，用 `n` 记录省略的自定义件数量；
  - 使用 UTF-8 → base64 → **base64url**（`+`→`-`、`/`→`_`、去掉尾部 `=`），通过 `?config=` 传递；
  - 打开分享链接时优先于 localStorage，校验 ID 后恢复，并写回本机；
  - 非法链接会回退本机保存并提示。
  - 打开含 `c` 的链接时导入自定义件并写入接收方独立 key；同 ID 保留本机版本；
  - 打开只含官方件的链接时提示「原配置含 N 个自定件，未包含」。
- **导出配置单**：
  - 生成纯文字清单，包含全部 9 个品类、型号、关键参数、单品价格、参考总价、兼容状态和 18 项检查结果；
  - 自定义件行追加「自定义 · 未审核」，参数按该件实际字段导出；
  - 通过 Clipboard API 复制，失败时回退 `textarea + execCommand`。

首页产品卡片下方新增“装机配置器”入口卡片。页面仍通过 `start.bat` 或静态服务器访问。

### 静态部署

这是纯静态站点，`configurator.html`、`viewer.html`、`data/`、`assets/`、`models/`、`vendor/` 一起部署即可，不需要 Node 或后端。

- **GitHub Pages**：把仓库根目录作为 Pages 源，保留 `.nojekyll`；公开仓库免费，支持 HTTPS 和自定义域名。适合个人项目和公开演示。免费版 Pages 需要公开仓库，站点上限约 1GB，月带宽约 100GB。
- **Cloudflare Pages**：连接仓库，构建命令留空，输出目录 `/`；支持私有仓库、预览部署、缓存/安全响应头和自定义域名，适合后续公开 Beta。
- **Netlify / Vercel**：同样适合静态站；如果以后要接服务端函数、真实账号或服务端历史，再选择带 Functions 的方案。

当前应用没有服务端账号，配置历史和自定义件只存在浏览器 localStorage；不要把它描述为跨设备账号系统。

## 引擎与更新策略

### 缓存版本号（改完必须一起改）

`index.html` / `viewer.html` / `configurator.html` 里所有本地 `href` / `src` / `import` 都带同一个
`?v=YYYYMMDD-N` 查询串。改任何 CSS / JS / 模型文件后，把三处版本号一起 +1：

```bash
# 例：把 20261029-1 全部替换成 20261030-1
```

否则浏览器可能用「旧 JS + 新 HTML」渲染，报出 `Cannot set properties of null`
这类元素已删、脚本还在写旧 id 的错误。

### 引擎职责

`js/engine.js` 共享负责：

- `setPixelRatio(min(devicePixelRatio, 1.5))`
- 无 Bloom / 无后处理 / 关闭阴影
- OrbitControls 阻尼、缩放与旋转限制
- 每部件独立的 `removed` 状态、`togglePart`、依赖检查
- 沿 `explodeDir × explodeDist` 拆出并回位
- emissive + 外扩描边高亮，材料过渡
- `focusCamera` 平滑运镜
- 标签只在需要时刷新，UI 只在事件触发时更新 DOM
- 配置 `explodeFit: true` 时，全部拆解会计算所有部件爆炸后的世界包围盒并自动 fit 相机；单品聚焦仍使用配置中的焦点参数。
- 支持通用 `userData.noPick` 低优先级拾取：先选中后方普通部件，没有普通部件时才回退到玻璃

渲染循环：

```js
controls.update();
// 部件 tween + 高亮过渡 + 必要的标签更新
renderer.render(scene, camera);
```

UI 更新不会进入逐帧循环。

## 交互

- 拖拽旋转、滚轮缩放。
- 悬停部件高亮并显示名称。
- 点击部件：拆出、发光、相机聚焦、右侧显示参数。
- 再次点击同一部件：归位并回到总览。
- `deps` 未满足时锁定，并提示前置部件。
- 右侧面板显示“建议下一步”，清单中所有依赖已满足的部件有可用标记，下一建议额外显示 `NEXT`。
- 底部：全部拆解 / 全部复位 / 自动旋转。
- 移动端：部件清单变为抽屉，详情变为底部面板。

## 旧页面

合并前的独立对照页面和已下线的 DJI 资源已清理，不再随站点部署。
