/* ==================================================================
   PRODUCT VIEWER UI
   Parts list, parameter panel, guide copy, controls and toast.
   DOM writes happen only on state/selection changes or pointer events.
   ================================================================== */
const $ = (id) => document.getElementById(id);

export function createUI(config, engine) {
  const dom = {
    partsList: $("parts-list"),
    partsPanel: $("parts-panel"),
    partsToggle: $("parts-toggle"),
    detailContent: $("detail-content"),
    detailPanel: $("detail-panel"),
    modeHud: $("mode-hud"),
    modeValue: $("mode-value"),
    modeCn: $("mode-cn"),
    explodeAll: $("explode-all"),
    resetAll: $("reset-all"),
    autoRotate: $("auto-rotate"),
    cursorTip: $("cursor-tip"),
    cursorTipName: $("cursor-tip-name"),
    cursorTipEn: $("cursor-tip-en"),
    toast: $("toast"),
    toastMessage: $("toast-message"),
    boot: $("boot"),
    bootStatus: $("boot-status-text")
  };
  const rows = new Map();
  let hoverId = null;
  let lastDetailKey = "";
  let toastTimer = 0;

  /* ----------------------------------------------------------------
     01. STATIC PRODUCT SHELL
     ---------------------------------------------------------------- */
  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function applyProductChrome() {
    document.body.dataset.product = config.id;
    document.body.dataset.theme = config.theme || config.id;
    const ui = config.ui || {};
    setText("brand-title", config.brand?.title || config.name);
    setText("brand-sub", config.brand?.sub || "拆装实验室");
    setText("part-count", String(config.parts.length).padStart(2, "0"));
    setText("toggle-count", String(config.parts.length).padStart(2, "0"));
    setText("count-label", ui.countLabel || "PARTS");
    const guide = $("guide-note");
    if (guide) guide.innerHTML = ui.guide || "再次点击归位；按顺序拆解。";
    const brand = $("brand");
    if (brand) brand.setAttribute("aria-label", `${config.name} 拆解视图，返回产品库`);
    setText("explode-label", ui.explodeLabel || "全部拆解");
    setText("reset-label", ui.resetLabel || "全部复位");
    setText("boot-mark", ui.bootMark || config.brand?.mark || "3D");
    setText("boot-title", ui.bootTitle || config.name.toUpperCase());
    setText("boot-sub", ui.bootSub || "程序化拆解系统");
    setText("boot-status-text", ui.bootStatus || "正在构建几何体");
    document.title = `${config.name} · 拆装实验室`;
    const canvas = $("scene-canvas");
    if (canvas) canvas.setAttribute("aria-label", ui.canvasLabel || `${config.name} 三维拆解视图`);
  }

  /* ----------------------------------------------------------------
     02. PARTS LIST
     ---------------------------------------------------------------- */
  function buildRows() {
    config.parts.forEach((part) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "part-row";
      row.dataset.part = part.id;
      row.setAttribute("role", "option");
      row.innerHTML = `
        <span class="part-index">${part.number || ""}</span>
        <span class="part-main">
          <span class="part-line"><span class="part-name">${part.name}</span><span class="part-en">${part.en || ""}</span></span>
          <span class="part-short">${part.short || ""}</span>
        </span>
        <span class="part-status">
          <span class="status-mark"></span>
          <span class="status-text">可拆</span>
          <svg class="lock-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3.2" y="7" width="9.6" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.1"/><path d="M5.2 7V5.1a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" stroke-width="1.1"/></svg>
        </span>`;
      row.addEventListener("click", () => {
        engine.togglePart(part.id);
        if (window.innerWidth <= 1100) closePartsPanel();
      });
      row.addEventListener("pointerenter", () => {
        hoverId = part.id;
        engine.setHovered(part.id);
      });
      row.addEventListener("pointerleave", () => {
        if (hoverId === part.id) {
          hoverId = null;
          engine.setHovered(null);
        }
      });
      dom.partsList.appendChild(row);
      rows.set(part.id, row);
    });
  }

  function isBlocked(part, state) {
    if (!part.deps?.length || part.fixed) return false;
    if (state.removed.includes(part.id)) return false;
    return part.deps.some((dep) => !state.removed.includes(dep));
  }

  function findNextPart(state) {
    return config.parts.find((part) =>
      !part.fixed &&
      !state.removed.includes(part.id) &&
      !isBlocked(part, state)
    ) || null;
  }

  function updateRows(state) {
    const next = findNextPart(state);
    config.parts.forEach((part) => {
      const row = rows.get(part.id);
      if (!row) return;
      const selected = state.selectedId === part.id;
      const removed = state.removed.includes(part.id);
      const blocked = isBlocked(part, state);
      const available = !part.fixed && !removed && !blocked;
      row.classList.toggle("is-selected", selected);
      row.classList.toggle("is-removed", removed);
      row.classList.toggle("is-locked", blocked);
      row.classList.toggle("is-hover", state.hoveredId === part.id);
      row.classList.toggle("is-available", available);
      row.classList.toggle("is-next", !!next && next.id === part.id);
      row.setAttribute("aria-selected", selected ? "true" : "false");
      const status = row.querySelector(".status-text");
      if (selected) status.textContent = removed ? "已拆 · 聚焦" : "聚焦中";
      else if (removed) status.textContent = "已拆";
      else if (blocked) status.textContent = "锁定";
      else if (part.fixed) status.textContent = "基准";
      else status.textContent = "可拆";
    });
  }

  function nextStepMarkup(state) {
    const next = findNextPart(state);
    if (!next) {
      return `<div class="next-step is-complete"><span class="next-step-label">NEXT STEP</span><strong>全部模块已拆解</strong><small>点击“全部复位”可重新装配。</small></div>`;
    }
    const depNames = (next.deps || [])
      .map((id) => config.parts.find((part) => part.id === id)?.name || id)
      .filter(Boolean);
    return `<div class="next-step">
      <span class="next-step-label">NEXT STEP / 建议下一步</span>
      <strong>拆下${next.name}</strong>
      <small>${depNames.length ? `前置条件已满足：${depNames.join("、")}` : "当前无前置依赖，可直接拆下"}</small>
    </div>`;
  }

  /* 拆解顺序：按 deps（先拆谁）做一次拓扑排序，得到"合法可以执行的顺序"。
     左侧清单的编号是装配结构序，两者并不相同——例如 CPU(02) 必须先拆散热器(03)。 */
  function teardownOrder() {
    const pool = config.parts.filter((part) => !part.fixed);
    const placed = new Set();
    const order = [];
    const depKnown = (id) => pool.some((part) => part.id === id);

    for (let guard = 0; guard <= pool.length; guard += 1) {
      let progressed = false;
      pool.forEach((part) => {
        if (placed.has(part.id)) return;
        const deps = (part.deps || []).filter(depKnown);
        if (deps.every((dep) => placed.has(dep))) {
          order.push(part);
          placed.add(part.id);
          progressed = true;
        }
      });
      if (!progressed) break;
    }
    pool.forEach((part) => {
      if (placed.has(part.id)) return;
      order.push(part);
      placed.add(part.id);
    });
    return order;
  }

  function sequenceMarkup(state) {
    const order = teardownOrder();
    if (!order.length) return "";
    const removed = new Set(state.removed);
    const items = order
      .map((part) => {
        const done = removed.has(part.id);
        const open = !done && (part.deps || []).every((dep) => removed.has(dep));
        const cls = done ? "is-done" : open ? "is-open" : "is-locked";
        return `<span class="seq-item ${cls}">${part.name}</span>`;
      })
      .join("");
    return `<div class="detail-section">
      <div class="detail-section-label"><span>拆解顺序 / SEQUENCE</span><span>${removed.size} / ${order.length}</span></div>
      <div class="seq-flow${order.length > 10 ? " is-long" : ""}">${items}</div>
    </div>`;
  }

  /* ----------------------------------------------------------------
     03. DETAIL PANEL
     ---------------------------------------------------------------- */
  function specRows(specs) {
    return (specs || []).map(([key, value]) => `<div class="spec-row"><span>${key}</span><b>${value}</b></div>`).join("");
  }

  function renderOverview(state) {
    const overview = config.overview || {};
    dom.detailContent.innerHTML = `
      <div class="detail-eyebrow"><span>SYSTEM / ${config.brand?.mark || "3D"}</span><span class="tag">OVERVIEW</span></div>
      <h1 class="detail-title">${overview.name || config.name}</h1>
      <div class="detail-en">${overview.en || config.name}</div>
      <p class="detail-desc">${overview.description || ""}</p>
      ${nextStepMarkup(state)}
      <div class="detail-section">
        <div class="detail-section-label"><span>规格概览 / SPECS</span><span>DATASHEET</span></div>
        <div class="spec-rows">${specRows(overview.specs)}</div>
      </div>
      ${sequenceMarkup(state)}`;
    dom.detailContent.scrollTop = 0;
  }

  function renderPart(part, state) {
    const removed = state.removed.includes(part.id);
    const blocker = isBlocked(part, state) ? part.deps.find((dep) => !state.removed.includes(dep)) : null;
    const blockerName = blocker ? config.parts.find((p) => p.id === blocker)?.name || blocker : "";
    const dependency = blocker ? `需先拆下 ${blockerName}` : (part.deps?.length ? "前置部件已拆下" : "无前置拆解步骤");
    const action = part.fixed ? "关闭详情" : (removed ? "归位此部件" : "拆下并聚焦");
    dom.detailContent.innerHTML = `
      <div class="detail-eyebrow"><span>MODULE ${part.number || ""} / ${part.category || "PART"}</span><span class="tag">${part.en || ""}</span></div>
      <h1 class="detail-title">${part.name}</h1>
      <p class="detail-desc">${part.description || part.params?.description || ""}</p>
      <span class="detail-status ${removed ? "is-removed" : ""}">${part.fixed ? "固定基准" : (removed ? "已拆下" : "已安装")}</span>
      ${nextStepMarkup(state)}
      <div class="detail-section">
        <div class="detail-section-label"><span>规格参数 / SPECS</span><span>DATASHEET</span></div>
        <div class="spec-rows">${specRows(part.specs || part.params?.specs)}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-label"><span>装配与约束 / ASSEMBLY</span><span>LOGIC</span></div>
        <dl class="detail-pairs">
          <dt>功能</dt><dd>${part.role || part.params?.role || "—"}</dd>
          <dt>位置</dt><dd>${part.install || part.params?.install || "—"}</dd>
        </dl>
        <div class="dependency"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.1"/><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" stroke-width="1.1"/></svg><span>${dependency}</span></div>
      </div>
      <div class="detail-actions">
        <span class="detail-hint">${part.fixed ? "固定基准 · 不参与拆解" : "再次点击同一部件可归位"}</span>
        <button type="button" class="detail-close" data-action="part-action">${action}</button>
      </div>`;
    dom.detailContent.scrollTop = 0;
  }

  function renderDetail(state) {
    if (state.selectedId) {
      const part = config.parts.find((p) => p.id === state.selectedId);
      if (part) {
        renderPart(part, state);
        return;
      }
    }
    renderOverview(state);
  }

  /* ----------------------------------------------------------------
     04. MODE / DOCK / STATE
     ---------------------------------------------------------------- */
  function updateMode(state) {
    dom.modeHud.classList.remove("is-focus", "is-exploded");
    let value = "ASSEMBLED";
    let cn = "整机装配";
    if (state.selectedId) {
      const part = config.parts.find((p) => p.id === state.selectedId);
      value = `FOCUS / ${part?.en || ""}`;
      cn = part?.name || "";
      dom.modeHud.classList.add("is-focus");
    } else if (state.explodedAll) {
      value = "EXPLODED";
      cn = "全部拆解";
      dom.modeHud.classList.add("is-exploded");
    } else if (state.removed.length) {
      value = "DISASSEMBLING";
      cn = "部分拆解";
      dom.modeHud.classList.add("is-exploded");
    }
    dom.modeValue.textContent = value;
    dom.modeCn.textContent = cn;
  }

  function updateDock(state) {
    dom.explodeAll.disabled = state.explodedAll;
    dom.resetAll.disabled = !state.removed.length && !state.selectedId;
    dom.autoRotate.classList.toggle("is-active", state.autoRotate);
    dom.autoRotate.setAttribute("aria-pressed", state.autoRotate ? "true" : "false");
  }

  function update(state, forceDetail = false) {
    document.body.classList.toggle("has-selection", !!state.selectedId);
    updateRows(state);
    updateMode(state);
    updateDock(state);
    const key = `${state.selectedId || "overview"}|${state.removed.join(",")}`;
    if (forceDetail || key !== lastDetailKey) {
      lastDetailKey = key;
      renderDetail(state);
    }
  }

  /* ----------------------------------------------------------------
     05. TOOLTIP / TOAST / CONTROLS
     ---------------------------------------------------------------- */
  function hideTip() {
    dom.cursorTip?.classList.remove("is-visible");
  }

  function showTip(id, event) {
    if (!id || !event) return hideTip();
    const part = config.parts.find((p) => p.id === id);
    if (!part) return hideTip();
    dom.cursorTipName.textContent = part.name;
    dom.cursorTipEn.textContent = part.en || "";
    dom.cursorTip.classList.add("is-visible");
    const width = dom.cursorTip.offsetWidth || 180;
    const height = dom.cursorTip.offsetHeight || 34;
    let x = event.clientX + 16;
    let y = event.clientY + 16;
    if (x + width > window.innerWidth - 12) x = event.clientX - width - 10;
    if (y + height > window.innerHeight - 12) y = event.clientY - height - 10;
    dom.cursorTip.style.left = `${x}px`;
    dom.cursorTip.style.top = `${y}px`;
  }

  function showToast(blocker, target) {
    dom.toastMessage.innerHTML = `<strong>请先拆下${blocker.name}</strong> · ${blocker.name}遮挡了${target.name}的拆解路径`;
    dom.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 3000);
    const row = rows.get(blocker.id);
    if (row) {
      row.classList.add("is-attention");
      window.setTimeout(() => row.classList.remove("is-attention"), 1800);
    }
  }

  function closePartsPanel() {
    document.body.classList.remove("parts-open");
    dom.partsToggle.setAttribute("aria-expanded", "false");
  }

  function bind() {
    bindGlow();
    dom.partsToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("parts-open");
      dom.partsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    dom.explodeAll.addEventListener("click", () => engine.explodeAll());
    dom.resetAll.addEventListener("click", () => engine.reset());
    dom.autoRotate.addEventListener("click", () => engine.setAutoRotate());
    dom.detailContent.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action='part-action']");
      if (!action) return;
      const state = engine.getState();
      if (state.selectedId) engine.togglePart(state.selectedId);
    });
    document.addEventListener("keydown", (event) => {
      if (/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "")) return;
      if (event.code === "KeyR") { event.preventDefault(); engine.reset(); }
      else if (event.code === "KeyE") { event.preventDefault(); engine.explodeAll(); }
      else if (event.code === "Escape") {
        if (engine.clearSelection()) event.preventDefault();
      }
      else if (event.code === "Space" && event.target?.tagName !== "BUTTON") {
        event.preventDefault();
        engine.setAutoRotate();
      }
    });
    engine.subscribe((state) => update(state));
    engine.onHover((id, event) => {
      if (id) showTip(id, event);
      else hideTip();
    });
    engine.onBlocked((blocker, target) => showToast(blocker, target));
  }

  /* ----------------------------------------------------------------
     05b. RGB GLOW CONTROL
     只有模型里真的存在发光材质时才出现（主板类产品不一定有灯带）。
     ---------------------------------------------------------------- */
  let glowColor = null;
  let glowMode = "static";

  function bindGlow() {
    const card = $("glow-card");
    if (!card || typeof engine.glowInfo !== "function") return;
    const info = engine.glowInfo();
    if (!info.hasSource) return;

    card.hidden = false;
    const swatches = [...card.querySelectorAll("[data-glow]")];
    const breath = $("glow-breath");
    const modeLabel = $("glow-mode-label");

    function paint() {
      swatches.forEach((button) => {
        const value = button.dataset.glow;
        const active = value === "off"
          ? glowColor === null
          : glowColor === value;
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (breath) breath.setAttribute("aria-pressed", glowMode === "breath" ? "true" : "false");
      if (modeLabel) {
        modeLabel.textContent = glowColor === null
          ? "原始"
          : (glowMode === "breath" ? "呼吸" : "常亮");
      }
    }

    swatches.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.glow;
        glowColor = value === "off" ? null : value;
        engine.setGlow(glowColor, glowMode);
        paint();
      });
    });

    if (breath) {
      breath.addEventListener("click", () => {
        glowMode = glowMode === "breath" ? "static" : "breath";
        engine.setGlow(glowColor, glowMode);
        paint();
      });
    }

    paint();
  }

  /* ----------------------------------------------------------------
     06. BOOT
     ---------------------------------------------------------------- */
  function finishBoot() {
    window.__VIEWER_READY__ = true;
    if (dom.bootStatus) dom.bootStatus.textContent = "系统就绪";
    if (dom.boot) {
      dom.boot.classList.add("is-hidden");
      setTimeout(() => dom.boot?.remove(), 700);
    }
  }

  function failBoot(message) {
    if (dom.boot) {
      dom.boot.classList.add("is-error");
      dom.boot.classList.remove("is-hidden");
    }
    if (dom.bootStatus) dom.bootStatus.textContent = message || "初始化失败，请检查 WebGL 支持";
  }

  /* ----------------------------------------------------------------
     07. START
     ---------------------------------------------------------------- */
  applyProductChrome();
  buildRows();
  bind();
  update(engine.getState(), true);
  finishBoot();

  return {
    update: (state) => update(state),
    finishBoot,
    failBoot
  };
}





