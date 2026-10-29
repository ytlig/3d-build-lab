/* ==================================================================
   PRODUCT REGISTRY
   Home page cards read this lightweight list. Viewer configs are
   imported lazily so the landing page never loads Three.js.
   ================================================================== */
export const products = [
  {
    id: "motherboard",
    name: "ATX 主板",
    shortName: "Motherboard",
    category: "PC 硬件",
    scope: "单板拆解",
    isPremium: false,
    thumbnail: "assets/motherboard.webp",
    tagline: "PCIe 5.0 · DDR5 · ATX 305×244",
    description: "只拆一块主板：CPU 插槽、供电、内存、显卡与 M.2 如何排布在一块 PCB 上。",
    accent: "#ffb15a",
    partCount: 9
  },
  {
    id: "desktop",
    name: "ATX 完整主机",
    shortName: "Full Build",
    category: "整机方案",
    scope: "整机装配",
    isPremium: true,
    thumbnail: "assets/desktop.webp",
    tagline: "850W ATX 3.0 · 4 枚风扇 · 4 组编织线",
    description: "把主板装进机箱：加入电源、风扇、编织线与风道，观察整机如何装配。",
    accent: "#5fe7ff",
    partCount: 22
  }
];

export async function getConfig(id) {
  if (id === "motherboard") return (await import("./motherboard.js")).default;
  if (id === "desktop") return (await import("./desktop.js")).default;
  return null;
}

