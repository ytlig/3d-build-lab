# 3D Build Lab · 拆装实验室

**在浏览器里把一台 PC 拆开，再配一台。**

纯静态站点，无构建、无后端。Three.js r160 已打包在 `vendor/`，所有 3D 模型由代码生成。

![整机 22 个模块全部拆出](docs/teardown.webp)

| 首页 | 装机配置器 |
|---|---|
| <img src="docs/home.webp" alt="首页：产品目录" /> | <img src="docs/configurator.webp" alt="配置器：兼容检查与装配预览" /> |

| 页面 | 内容 |
|---|---|
| `index.html` | 产品目录 |
| `viewer.html` | 3D 拆解，`?id=motherboard`（9 模块）/ `?id=desktop`（22 模块） |
| `configurator.html` | 装机配置器 |

## 运行

```bash
python -m http.server 8080
```

打开 `http://127.0.0.1:8080/`。Windows 也可以直接双击 `start.bat`。

页面使用 ES module，必须经 HTTP 访问，`file://` 打不开。

## 功能

- **拆解**：22 个模块按真实顺序解锁（侧板 → 显卡 → 内存 → 散热器 → CPU → 主板 → 电源 → 机箱），点击拆出并聚焦，前置条件未满足时锁定并提示
- **灯效**：整机页 5 档配色 + 呼吸，默认「原始」；用自发光材质与点光源实现，不依赖 Bloom
- **配置器**：9 个品类共 65 个型号，选配时同步跑 18 项兼容检查，8 组预设一键套用
- **装配预览**：按配件参数生成机箱、主板、散热、显卡、电源、内存、风扇与走线，超限标红并显示 `OVER`；配件是参数化模型，尺寸准确、外观简化
- **本机**：自动保存、20 条历史、分享链接、配置对比、文字导出、自定义配件

## 结构

```text
index.html / viewer.html / configurator.html   三个页面
css/        每个页面一份样式
js/         engine（场景与拆解）· ui · loader · configurator（选配与兼容）
configs/    产品注册表，两台机器的纯数据配置
models/     程序化模型：主板、整机、配置器用的参数化小模型
data/       9 个品类的配件数据（65 条）与 8 组预设
assets/     卡片缩略图
docs/       README 截图
vendor/     Three.js r160 + addons
start.bat   Windows 一键启动
```

## 产品配置

`configs/*.js` 是纯数据，`parts[]` 描述每个部件的几何、位置、拆出方向与依赖：

```js
export default {
  id: "product-id",
  name: "产品名",
  camera: { position: [3, 2, 5], target: [0, 0, 0], fov: 34 },
  overview: { name, en, description, stats, specs },
  parts: [
    {
      id: "part-id",
      number: "01",
      name: "部件名",
      geometry: { type: "box", size: [1, 0.2, 0.6] },
      position: [0, 0, 0],
      explodeDir: [0, 1, 0],
      explodeDist: 1.2,
      deps: ["prerequisite-part-id"]
    }
  ]
};
```

几何类型：`box` / `cylinder` / `sphere` / `plane` / `torus` / `compound`，段数限制在 32 以内。

复杂产品不必逐个描述几何，写一个 `model` 字段指向模型工厂（`MotherboardModel` / `DesktopModel`）即可。

## 兼容检查

18 项，覆盖四类问题：

| 组 | 检查 |
|---|---|
| 平台 | CPU 插槽 ↔ 主板、散热器扣具 ↔ CPU、内存类型 ↔ 主板 |
| 空间 | 显卡长度/厚度 ↔ 机箱、散热器高度 ↔ 机箱、板型 ↔ 机箱、电源长度 ↔ 电源仓、冷排规格/位置/厚度 ↔ 机箱、风扇位 ↔ 机箱 |
| 供电 | 电源功率 ≥ (CPU + 显卡) × 1.3、12VHPWR 接口、PCIe 8pin 数量 |
| 存储 | M.2 / SATA 接口、M.2 长度与 key |

数据没选齐记为「待确认」，不兼容时给出原因和可替换型号。自定义配件留空的字段同样记为待确认，不会默认通过。

## 用途预设

8 组：1080p 游戏、2K 高刷、小体积静音、办公轻量、4K 发烧、创作生产力、AMD 游戏、海景房光效。均通过全部 18 项检查，载入后可撤销。

## 本机数据

没有账号系统，配置、历史与自定义件都放在 `localStorage`。分享链接把配置编码进 `?config=`，打开时优先于本机保存。

## 性能取舍

无 Bloom、无后处理、无阴影；画质上限 `min(devicePixelRatio, 1.5)`；画面静止时跳过渲染；帧率不足时自动降采样。

## 部署

纯静态，根目录整体部署即可。

| 平台 | 配置 |
|---|---|
| GitHub Pages | 根目录作为源，保留 `.nojekyll` |
| Cloudflare Pages | 构建命令留空，输出目录 `/` |
| Netlify / Vercel | 直接指定仓库 |

## 开发

改动 CSS / JS / 模型后，把三个页面里的 `?v=YYYYMMDD-N` 一起 +1，避免浏览器混用新旧文件。

## 数据说明

配件型号、参数与价格为演示用的手工数据，不是厂商官方规格，价格仅供参考。产品名称与商标归各自所有者，本项目与厂商无关联。

## 许可证

代码以 [MIT](./LICENSE) 开源。商标与数据声明见上。
