/* ==================================================================
   STUDIO ENVIRONMENT
   全站共用的程序化 IBL 环境贴图（等距圆柱 → PMREM）。

   为什么要矩形柔光箱而不是径向光斑：
   金属和玻璃的"真实感"主要来自反射里的**光箱边缘**。径向模糊光斑
   只能给出一团弥散的亮，看起来像塑料；矩形面板会在平面金属上拉出
   一条有起止的条状高光，这是产品渲染最容易被认出的特征。
   ================================================================== */
(function () {
  const T = () => window.ATX_LIB?.THREE || window.THREE;

  function draw(canvas, blurEnabled) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d");

    // 天花板 → 地平线 → 地面：反射需要一个明确的上下差
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0.0, "#04090c");
    sky.addColorStop(0.28, "#0a151b");
    sky.addColorStop(0.5, "#101f27");
    sky.addColorStop(0.54, "#0a1418");
    sky.addColorStop(0.78, "#050b0e");
    sky.addColorStop(1.0, "#010304");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    if (blurEnabled) ctx.filter = "blur(7px)";

    const panel = (u, v, pw, ph, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(u * w - pw / 2, v * h - ph / 2, pw, ph);
    };

    // 主光：左上大面积柔光箱
    panel(0.20, 0.17, 360, 240, "rgba(255,255,255,0.98)");
    // 辅助：右上一块更冷的板
    panel(0.74, 0.13, 230, 160, "rgba(206,240,255,0.8)");
    // 地平线上方的长条灯：平面金属上那条横向亮带的来源
    panel(0.46, 0.415, 560, 30, "rgba(255,255,255,0.9)");
    // 暖色点缀（右侧）
    panel(0.92, 0.5, 140, 180, "rgba(255,196,140,0.72)");
    // 青色轮廓灯（左缘）
    panel(0.03, 0.48, 100, 180, "rgba(150,232,255,0.6)");
    // 顶部细长条形灯：给顶盖板一条细高光
    panel(0.5, 0.06, 660, 16, "rgba(255,255,255,0.85)");

    if (blurEnabled) ctx.filter = "none";

    // 地平线
    ctx.fillStyle = "rgba(174,226,237,0.18)";
    ctx.fillRect(0, h * 0.528, w, 1.5);
  }

  function createEnvironment(renderer, anisotropy = 1) {
    const THREE = T();
    if (!THREE || !renderer) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;

    let blurEnabled = true;
    try {
      const probe = canvas.getContext("2d");
      probe.filter = "blur(2px)";
      blurEnabled = probe.filter === "blur(2px)";
    } catch (error) {
      blurEnabled = false;
    }
    draw(canvas, blurEnabled);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(texture).texture;
    texture.dispose();
    pmrem.dispose();
    return envMap;
  }

  window.ATX_ENV = { createEnvironment };
})();

