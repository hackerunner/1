const categories = [
  { id: "figures", label: "人物" },
  { id: "shelter", label: "容器" },
  { id: "nature", label: "自然" },
  { id: "boundary", label: "边界" },
  { id: "energy", label: "能量" },
  { id: "motion", label: "行动" },
];

const symbols = [
  { id: "self", label: "自我", category: "figures", role: "core", tone: "身份", shape: "figure", color: "#315f88" },
  { id: "child", label: "孩子", category: "figures", role: "vulnerable", tone: "需要", shape: "child", color: "#4d9b91" },
  { id: "caregiver", label: "照料者", category: "figures", role: "relationship", tone: "支持", shape: "caregiver", color: "#6e4f82" },
  { id: "observer", label: "旁观者", category: "figures", role: "distance", tone: "观看", shape: "observer", color: "#66727d" },
  { id: "guardian", label: "守护动物", category: "figures", role: "protection", tone: "本能", shape: "animal", color: "#4f7f4d" },
  { id: "wild", label: "野性动物", category: "figures", role: "instinct", tone: "冲动", shape: "animal", color: "#c65c45" },
  { id: "house", label: "房屋", category: "shelter", role: "safety", tone: "安顿", shape: "house", color: "#277a73" },
  { id: "tower", label: "高塔", category: "shelter", role: "control", tone: "视角", shape: "tower", color: "#315f88" },
  { id: "tent", label: "帐篷", category: "shelter", role: "temporary", tone: "过渡", shape: "tent", color: "#a67839" },
  { id: "gate", label: "门", category: "shelter", role: "threshold", tone: "进入", shape: "gate", color: "#6e4f82" },
  { id: "tree", label: "树", category: "nature", role: "growth", tone: "生命力", shape: "tree", color: "#4f7f4d" },
  { id: "mountain", label: "山", category: "nature", role: "obstacle", tone: "重量", shape: "mountain", color: "#66727d" },
  { id: "water", label: "水域", category: "nature", role: "affect", tone: "情绪", shape: "water", color: "#315f88" },
  { id: "fire", label: "火", category: "nature", role: "affect", tone: "能量", shape: "fire", color: "#c65c45" },
  { id: "stone", label: "石头", category: "nature", role: "ground", tone: "沉稳", shape: "stone", color: "#6f6559" },
  { id: "bridge", label: "桥", category: "boundary", role: "connection", tone: "连接", shape: "bridge", color: "#277a73" },
  { id: "fence", label: "栅栏", category: "boundary", role: "boundary", tone: "保护", shape: "fence", color: "#6f6559" },
  { id: "wall", label: "墙", category: "boundary", role: "boundary", tone: "隔离", shape: "wall", color: "#66727d" },
  { id: "path", label: "道路", category: "boundary", role: "movement", tone: "路径", shape: "path", color: "#a67839" },
  { id: "circle", label: "圆圈", category: "boundary", role: "container", tone: "完整", shape: "circle", color: "#6e4f82" },
  { id: "light", label: "光", category: "energy", role: "resource", tone: "看见", shape: "light", color: "#d09a28" },
  { id: "shadow", label: "阴影", category: "energy", role: "unspoken", tone: "未知", shape: "shadow", color: "#17202a" },
  { id: "treasure", label: "宝物", category: "energy", role: "value", tone: "资源", shape: "treasure", color: "#d09a28" },
  { id: "clock", label: "时钟", category: "energy", role: "time", tone: "节奏", shape: "clock", color: "#315f88" },
  { id: "mirror", label: "镜子", category: "energy", role: "reflection", tone: "自省", shape: "mirror", color: "#4d9b91" },
  { id: "boat", label: "船", category: "motion", role: "transition", tone: "穿越", shape: "boat", color: "#315f88" },
  { id: "vehicle", label: "车", category: "motion", role: "agency", tone: "推进", shape: "vehicle", color: "#c65c45" },
  { id: "ladder", label: "梯子", category: "motion", role: "ascent", tone: "上升", shape: "ladder", color: "#a67839" },
  { id: "key", label: "钥匙", category: "motion", role: "access", tone: "开启", shape: "key", color: "#d09a28" },
  { id: "spiral", label: "螺旋", category: "motion", role: "cycle", tone: "循环", shape: "spiral", color: "#6e4f82" },
];

const evidenceItems = [
  {
    title: "Roesler, C. (2019)",
    meta: "Sandplay therapy: theory, applications and evidence base. The Arts in Psychotherapy.",
    url: "https://doi.org/10.1016/j.aip.2019.04.001",
  },
  {
    title: "Wiersma et al. (2022)",
    meta: "A meta-analysis of sandplay therapy treatment outcomes. International Journal of Play Therapy.",
    url: "https://doi.org/10.1037/pla0000180",
  },
  {
    title: "Forty years review (2025)",
    meta: "Systematic review with digital sandplay application insights. The Arts in Psychotherapy.",
    url: "https://doi.org/10.1016/j.aip.2025.102311",
  },
  {
    title: "Kalff / Lowenfeld tradition",
    meta: "Safe and protected space, World Technique, symbolic expression and nonverbal process.",
    url: "https://lowenfeld.org/the-world-technique/",
  },
  {
    title: "Mitchell & Friedman",
    meta: "Themes in Sandplay: clinical tracking of repeated symbolic patterns.",
    url: "https://www.routledge.com/Sandplay-Past-Present-and-Future/Friedman-RogersMitchell/p/book/9780415101370",
  },
  {
    title: "Homeyer & Sweeney",
    meta: "Sandtray practice manual: client story, process observation, and cautious interpretation.",
    url: "https://www.routledge.com/Sandtray-Therapy-A-Practical-Manual/Homeyer-Sweeney/p/book/9781032117553",
  },
];

const state = {
  activeCategory: "figures",
  activeSymbol: "self",
  tool: "select",
  items: [],
  selectedId: null,
  lastAnalysis: null,
  lastAnalyzedAt: "",
  analysisDirty: false,
  history: [],
};

const els = {};
let dragState = null;
let shelfDragState = null;
let rakeState = null;
let rakeContext = null;
let suppressShelfClick = false;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  renderCategoryTabs();
  renderShelf();
  renderEvidence();
  bindEvents();
  resizeCanvas();
  restoreDraft();
  render();
  showSafetyDialog();
});

function cacheElements() {
  els.categoryTabs = document.getElementById("categoryTabs");
  els.symbolShelf = document.getElementById("symbolShelf");
  els.tray = document.getElementById("tray");
  els.rakeCanvas = document.getElementById("rakeCanvas");
  els.sceneItems = document.getElementById("sceneItems");
  els.itemCount = document.getElementById("itemCount");
  els.densityText = document.getElementById("densityText");
  els.zoneText = document.getElementById("zoneText");
  els.boundaryText = document.getElementById("boundaryText");
  els.scoreBars = document.getElementById("scoreBars");
  els.analysisTitle = document.getElementById("analysisTitle");
  els.analysisState = document.getElementById("analysisState");
  els.analyzeBtn = document.getElementById("analyzeBtn");
  els.analyzeStatus = document.getElementById("analyzeStatus");
  els.microSignalList = document.getElementById("microSignalList");
  els.themeList = document.getElementById("themeList");
  els.promptList = document.getElementById("promptList");
  els.clientCode = document.getElementById("clientCode");
  els.sceneTitle = document.getElementById("sceneTitle");
  els.sessionAim = document.getElementById("sessionAim");
  els.sessionNotes = document.getElementById("sessionNotes");
  els.evidenceList = document.getElementById("evidenceList");
  els.safetyDialog = document.getElementById("safetyDialog");
  rakeContext = els.rakeCanvas.getContext("2d");
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("dragstart", preventAppNativeDrag);
  document.addEventListener("selectstart", preventDragSelection);

  document.querySelectorAll(".tool-button").forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });

  els.tray.addEventListener("pointerdown", onTrayPointerDown);

  document.getElementById("rotateLeftBtn").addEventListener("click", () => rotateSelected(-15));
  document.getElementById("rotateRightBtn").addEventListener("click", () => rotateSelected(15));
  document.getElementById("smallerBtn").addEventListener("click", () => scaleSelected(-0.1));
  document.getElementById("largerBtn").addEventListener("click", () => scaleSelected(0.1));
  document.getElementById("duplicateBtn").addEventListener("click", duplicateSelected);
  document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
  document.getElementById("smoothBtn").addEventListener("click", smoothSand);
  document.getElementById("randomSeedBtn").addEventListener("click", seedScene);
  els.analyzeBtn.addEventListener("click", runMicroAnalysis);
  document.getElementById("newSceneBtn").addEventListener("click", newScene);
  document.getElementById("saveLocalBtn").addEventListener("click", saveLocalSession);
  document.getElementById("saveServerBtn").addEventListener("click", saveServerSession);
  document.getElementById("exportBtn").addEventListener("click", exportReport);
  document.getElementById("copyReportBtn").addEventListener("click", copyReport);

  [els.clientCode, els.sceneTitle, els.sessionAim, els.sessionNotes].forEach((input) => {
    input.addEventListener("input", saveDraft);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      deleteSelected();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      undo();
    }
  });
}

function showSafetyDialog() {
  if (localStorage.getItem("mindsand-safety-ack") === "yes") return;
  if (typeof els.safetyDialog.showModal === "function") {
    els.safetyDialog.showModal();
    els.safetyDialog.addEventListener("close", () => localStorage.setItem("mindsand-safety-ack", "yes"), { once: true });
  }
}

function renderCategoryTabs() {
  els.categoryTabs.innerHTML = categories
    .map(
      (category) =>
        `<button type="button" class="${category.id === state.activeCategory ? "active" : ""}" data-category="${category.id}">${category.label}</button>`,
    )
    .join("");

  els.categoryTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      const firstSymbol = symbols.find((symbol) => symbol.category === state.activeCategory);
      if (firstSymbol) state.activeSymbol = firstSymbol.id;
      renderCategoryTabs();
      renderShelf();
    });
  });
}

function renderShelf() {
  const visible = symbols.filter((symbol) => symbol.category === state.activeCategory);
  els.symbolShelf.innerHTML = visible
    .map((symbol) => {
      const active = symbol.id === state.activeSymbol ? "active" : "";
      return `
        <button class="symbol-button ${active}" type="button" data-symbol="${symbol.id}" draggable="false">
          <span class="symbol-art">${symbolSvg(symbol)}</span>
          <span>
            <strong>${symbol.label}</strong>
            <small>${symbol.tone}</small>
          </span>
        </button>
      `;
    })
    .join("");

  els.symbolShelf.querySelectorAll(".symbol-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (suppressShelfClick) {
        suppressShelfClick = false;
        event.preventDefault();
        return;
      }
      state.activeSymbol = button.dataset.symbol;
      setTool("place");
      renderShelf();
    });
    button.addEventListener("pointerdown", onShelfPointerDown);
    button.addEventListener("dragstart", preventNativeDrag);
  });
}

function render() {
  renderItems();
  invalidateAnalysis();
  updateAnalyzeStatus();
  saveDraft();
}

function renderItems() {
  els.sceneItems.innerHTML = state.items
    .map((item) => {
      const symbol = getSymbol(item.symbolId);
      const selected = item.id === state.selectedId ? "selected" : "";
      const size = 56 * item.scale;
      return `
        <button class="scene-item ${selected}" data-id="${item.id}" type="button" draggable="false"
          style="left:${item.x}%;top:${item.y}%;width:${size}px;height:${size}px;margin-left:${-size / 2}px;margin-top:${-size / 2}px;transform:rotate(${item.rotation}deg)"
          title="${symbol.label}">
          ${symbolSvg(symbol)}
        </button>
      `;
    })
    .join("");

  els.sceneItems.querySelectorAll(".scene-item").forEach((node) => {
    node.addEventListener("pointerdown", onItemPointerDown);
    node.addEventListener("dragstart", preventNativeDrag);
    node.addEventListener("click", (event) => event.stopPropagation());
  });
}

function renderAnalysis(analysis) {
  els.analysisTitle.textContent = "见微知著";
  els.analysisState.textContent = `已在 ${new Date(state.lastAnalyzedAt).toLocaleTimeString()} 生成分析。后续移动、增删物件后，请重新点击底部按钮。`;
  els.analysisState.classList.remove("stale");
  els.itemCount.textContent = analysis.itemCount;
  els.densityText.textContent = analysis.density;
  els.zoneText.textContent = analysis.dominantZone;
  els.boundaryText.textContent = analysis.boundaryCount;
  els.scoreBars.innerHTML = analysis.scores
    .map(
      (score) => `
        <div class="score-row">
          <span>${score.label}</span>
          <div class="score-track"><div class="score-fill" style="width:${score.value}%"></div></div>
          <strong>${score.value}</strong>
        </div>
      `,
    )
    .join("");
  els.microSignalList.innerHTML = analysis.microSignals.map((signal) => `<li>${signal}</li>`).join("");
  els.themeList.innerHTML = analysis.themes.map((theme) => `<li>${theme}</li>`).join("");
  els.promptList.innerHTML = analysis.prompts.map((prompt) => `<li>${prompt}</li>`).join("");
}

function renderAnalysisPlaceholder() {
  els.analysisTitle.textContent = "等待分析";
  els.analysisState.textContent = "先完成沙盘建构。系统不实时解读，避免打断投射和叙事过程。";
  els.analysisState.classList.remove("stale");
  els.itemCount.textContent = "--";
  els.densityText.textContent = "待分析";
  els.zoneText.textContent = "待分析";
  els.boundaryText.textContent = "--";
  els.scoreBars.innerHTML = `<div class="analysis-empty">点击沙盘下方的“开始分析”后，才会生成维度条。</div>`;
  els.microSignalList.innerHTML = `<li>等待记录第一物件、中心/边缘、重复、孤立、边界和连接等微线索。</li>`;
  els.themeList.innerHTML = `<li>当前尚未启动分析。</li>`;
  els.promptList.innerHTML = `<li>先让来访者完成摆放，再邀请其命名和讲述。</li>`;
}

function runMicroAnalysis() {
  state.lastAnalysis = analyzeScene();
  state.lastAnalyzedAt = new Date().toISOString();
  state.analysisDirty = false;
  renderAnalysis(state.lastAnalysis);
  updateAnalyzeStatus();
  notify("见微知著分析已生成");
}

function invalidateAnalysis() {
  if (!state.lastAnalysis) {
    renderAnalysisPlaceholder();
    return;
  }
  state.analysisDirty = true;
  els.analysisState.textContent = "沙盘已经改变。右侧仍保留上一次分析，点击底部按钮可重新生成。";
  els.analysisState.classList.add("stale");
}

function updateAnalyzeStatus() {
  const count = state.items.length;
  if (!state.lastAnalysis) {
    els.analyzeBtn.textContent = count ? "开始分析" : "分析空沙盘";
    els.analyzeStatus.textContent = count ? `已放置 ${count} 个微缩物，点击开始分析。` : "尚未放置微缩物，也可以分析空沙盘的留白。";
    return;
  }
  els.analyzeBtn.textContent = state.analysisDirty ? "重新分析" : "再次分析";
  els.analyzeStatus.textContent = state.analysisDirty
    ? `沙盘已改变，当前有 ${count} 个微缩物。`
    : `已分析 ${state.lastAnalysis.itemCount} 个微缩物。`;
}

function renderEvidence() {
  els.evidenceList.innerHTML = evidenceItems
    .map(
      (item) => `
        <a class="evidence-item" href="${item.url}" target="${item.url.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">
          <strong>${item.title}</strong>
          <small>${item.meta}</small>
        </a>
      `,
    )
    .join("");
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll(".tool-button").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
}

function onTrayPointerDown(event) {
  if (event.target.closest(".scene-item")) return;
  const point = trayPoint(event);
  state.selectedId = null;

  if (state.tool === "place") {
    addItem(state.activeSymbol, point.x, point.y);
    return;
  }

  if (state.tool === "rake") {
    beginRake(event, point);
    return;
  }

  renderItems();
  updateAnalyzeStatus();
  saveDraft();
}

function onShelfPointerDown(event) {
  if (event.button !== 0) return;
  event.preventDefault();

  const button = event.currentTarget;
  const symbolId = button.dataset.symbol;
  state.activeSymbol = symbolId;
  setTool("place");

  shelfDragState = {
    symbolId,
    button,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    preview: null,
  };

  button.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onShelfPointerMove);
  window.addEventListener("pointerup", onShelfPointerUp, { once: true });
  window.addEventListener("pointercancel", onShelfPointerCancel, { once: true });
}

function onShelfPointerMove(event) {
  if (!shelfDragState) return;
  const moved = Math.hypot(event.clientX - shelfDragState.startX, event.clientY - shelfDragState.startY);

  if (!shelfDragState.dragging && moved > 4) {
    shelfDragState.dragging = true;
    shelfDragState.preview = createDragPreview(getSymbol(shelfDragState.symbolId));
    shelfDragState.button.classList.add("drag-origin");
    document.body.classList.add("is-dragging-symbol");
  }

  if (shelfDragState.dragging) {
    moveDragPreview(shelfDragState.preview, event);
    els.tray.classList.toggle("tray-drop-ready", isPointInsideTray(event));
  }
}

function onShelfPointerUp(event) {
  window.removeEventListener("pointermove", onShelfPointerMove);
  window.removeEventListener("pointercancel", onShelfPointerCancel);
  if (!shelfDragState) return;

  const { dragging, symbolId, button } = shelfDragState;
  const droppedOnTray = dragging && isPointInsideTray(event);
  suppressShelfClick = dragging;
  if (dragging) {
    window.setTimeout(() => {
      suppressShelfClick = false;
    }, 300);
  }

  cleanupShelfDrag();
  renderShelf();

  if (droppedOnTray) {
    const point = trayPoint(event);
    addItem(symbolId, point.x, point.y);
    return;
  }

  state.activeSymbol = symbolId;
  setTool("place");
}

function onShelfPointerCancel() {
  window.removeEventListener("pointermove", onShelfPointerMove);
  cleanupShelfDrag();
  renderShelf();
}

function onItemPointerDown(event) {
  event.preventDefault();
  event.stopPropagation();
  const id = event.currentTarget.dataset.id;
  state.selectedId = id;
  pushHistory();
  const item = getItem(id);
  const rect = els.tray.getBoundingClientRect();
  const nodeRect = event.currentTarget.getBoundingClientRect();
  els.sceneItems.querySelectorAll(".scene-item").forEach((node) => node.classList.toggle("selected", node.dataset.id === id));
  dragState = {
    id,
    node: event.currentTarget,
    symbolId: item.symbolId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: item.x,
    startY: item.y,
    rectWidth: rect.width,
    rectHeight: rect.height,
    offsetX: event.clientX - nodeRect.left,
    offsetY: event.clientY - nodeRect.top,
    size: nodeRect.width,
    rotation: item.rotation,
    moved: false,
    preview: null,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onItemPointerMove);
  window.addEventListener("pointerup", onItemPointerUp, { once: true });
  window.addEventListener("pointercancel", onItemPointerCancel, { once: true });
}

function onItemPointerMove(event) {
  if (!dragState) return;
  const item = getItem(dragState.id);
  if (!item) return;
  const dx = ((event.clientX - dragState.startClientX) / dragState.rectWidth) * 100;
  const dy = ((event.clientY - dragState.startClientY) / dragState.rectHeight) * 100;
  if (!dragState.moved && (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2)) {
    dragState.moved = true;
    dragState.preview = createDragPreview(getSymbol(dragState.symbolId), { size: dragState.size, rotation: dragState.rotation });
    dragState.node.classList.add("dragging", "drag-origin");
    document.body.classList.add("is-dragging-item");
  }
  if (!dragState.moved) {
    return;
  }
  item.x = clamp(dragState.startX + dx, 3, 97);
  item.y = clamp(dragState.startY + dy, 4, 96);
  moveDragPreview(dragState.preview, event, dragState.offsetX, dragState.offsetY);
}

function onItemPointerUp() {
  window.removeEventListener("pointermove", onItemPointerMove);
  window.removeEventListener("pointercancel", onItemPointerCancel);
  const moved = Boolean(dragState?.moved);
  cleanupItemDrag();
  dragState = null;
  if (moved) {
    render();
    return;
  }
  renderItems();
  updateAnalyzeStatus();
  saveDraft();
}

function onItemPointerCancel() {
  window.removeEventListener("pointermove", onItemPointerMove);
  cleanupItemDrag();
  dragState = null;
  renderItems();
}

function positionItemNode(node, item) {
  if (!node) return;
  const size = 56 * item.scale;
  node.style.left = `${item.x}%`;
  node.style.top = `${item.y}%`;
  node.style.width = `${size}px`;
  node.style.height = `${size}px`;
  node.style.marginLeft = `${-size / 2}px`;
  node.style.marginTop = `${-size / 2}px`;
  node.style.transform = `rotate(${item.rotation}deg)`;
}

function createDragPreview(symbol, options = {}) {
  const size = options.size || 56;
  const rotation = options.rotation || 0;
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.style.width = `${size}px`;
  preview.style.height = `${size}px`;
  preview.dataset.rotation = String(rotation);
  preview.innerHTML = `<span class="drag-preview-art">${symbolSvg(symbol)}</span>`;
  document.body.appendChild(preview);
  return preview;
}

function moveDragPreview(preview, event, offsetX = 28, offsetY = 28) {
  if (!preview) return;
  const rotation = Number(preview.dataset.rotation || 0);
  preview.style.transform = `translate3d(${event.clientX - offsetX}px, ${event.clientY - offsetY}px, 0) rotate(${rotation}deg)`;
}

function cleanupShelfDrag() {
  shelfDragState?.preview?.remove();
  shelfDragState?.button?.classList.remove("drag-origin");
  document.body.classList.remove("is-dragging-symbol");
  els.tray.classList.remove("tray-drop-ready");
  shelfDragState = null;
}

function cleanupItemDrag() {
  dragState?.preview?.remove();
  dragState?.node?.classList.remove("dragging", "drag-origin");
  document.body.classList.remove("is-dragging-item");
}

function preventNativeDrag(event) {
  event.preventDefault();
}

function preventAppNativeDrag(event) {
  if (event.target?.closest?.(".app-shell")) {
    event.preventDefault();
  }
}

function preventDragSelection(event) {
  if (document.body.classList.contains("is-dragging-symbol") || document.body.classList.contains("is-dragging-item")) {
    event.preventDefault();
  }
}

function isPointInsideTray(event) {
  const rect = els.tray.getBoundingClientRect();
  return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function beginRake(event, point) {
  rakeState = { last: point };
  els.tray.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", drawRake);
  window.addEventListener("pointerup", endRake, { once: true });
}

function drawRake(event) {
  if (!rakeState) return;
  const point = trayPoint(event);
  const from = toCanvasPoint(rakeState.last);
  const to = toCanvasPoint(point);
  rakeContext.save();
  rakeContext.strokeStyle = "rgba(101, 73, 38, 0.34)";
  rakeContext.lineWidth = 3;
  rakeContext.lineCap = "round";
  rakeContext.beginPath();
  rakeContext.moveTo(from.x, from.y);
  rakeContext.lineTo(to.x, to.y);
  rakeContext.stroke();
  rakeContext.restore();
  rakeState.last = point;
}

function endRake() {
  window.removeEventListener("pointermove", drawRake);
  rakeState = null;
  saveDraft();
}

function addItem(symbolId, x, y) {
  const symbol = getSymbol(symbolId);
  pushHistory();
  const item = {
    id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    symbolId: symbol.id,
    x: clamp(x, 3, 97),
    y: clamp(y, 4, 96),
    scale: 1,
    rotation: Math.round((Math.random() * 18 - 9) / 3) * 3,
    addedAt: new Date().toISOString(),
  };
  state.items.push(item);
  state.selectedId = item.id;
  setTool("select");
  render();
}

function rotateSelected(delta) {
  const item = selectedItem();
  if (!item) return;
  pushHistory();
  item.rotation = normalizeAngle(item.rotation + delta);
  render();
}

function scaleSelected(delta) {
  const item = selectedItem();
  if (!item) return;
  pushHistory();
  item.scale = clamp(Number((item.scale + delta).toFixed(2)), 0.65, 1.75);
  render();
}

function duplicateSelected() {
  const item = selectedItem();
  if (!item) return;
  pushHistory();
  const duplicate = {
    ...item,
    id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    x: clamp(item.x + 6, 3, 97),
    y: clamp(item.y + 5, 4, 96),
    addedAt: new Date().toISOString(),
  };
  state.items.push(duplicate);
  state.selectedId = duplicate.id;
  render();
}

function deleteSelected() {
  if (!state.selectedId) return;
  pushHistory();
  state.items = state.items.filter((item) => item.id !== state.selectedId);
  state.selectedId = null;
  render();
}

function smoothSand() {
  rakeContext.clearRect(0, 0, els.rakeCanvas.width, els.rakeCanvas.height);
  invalidateAnalysis();
  updateAnalyzeStatus();
  saveDraft();
}

function seedScene() {
  pushHistory();
  smoothSand();
  const starter = [
    ["self", 50, 54],
    ["house", 28, 38],
    ["bridge", 47, 42],
    ["water", 72, 62],
    ["tree", 63, 31],
    ["wall", 36, 68],
  ];
  state.items = starter.map(([symbolId, x, y], index) => ({
    id: `seed-${Date.now().toString(36)}-${index}`,
    symbolId,
    x,
    y,
    scale: symbolId === "water" ? 1.35 : 1,
    rotation: symbolId === "bridge" ? -8 : 0,
    addedAt: new Date().toISOString(),
  }));
  state.selectedId = null;
  render();
}

function newScene() {
  if (state.items.length && !window.confirm("清空当前沙盘？")) return;
  pushHistory();
  state.items = [];
  state.selectedId = null;
  els.clientCode.value = "";
  els.sceneTitle.value = "";
  els.sessionAim.value = "";
  els.sessionNotes.value = "";
  state.lastAnalysis = null;
  state.lastAnalyzedAt = "";
  state.analysisDirty = false;
  smoothSand();
  render();
}

function undo() {
  const snapshot = state.history.pop();
  if (!snapshot) return;
  const parsed = JSON.parse(snapshot);
  state.items = parsed.items;
  state.selectedId = parsed.selectedId;
  render();
}

function analyzeScene() {
  const items = state.items.map((item) => ({ ...item, symbol: getSymbol(item.symbolId) }));
  const itemCount = items.length;
  const categoryCounts = {};
  const roleCounts = {};
  const zoneCounts = {};

  items.forEach((item) => {
    categoryCounts[item.symbol.category] = (categoryCounts[item.symbol.category] || 0) + 1;
    roleCounts[item.symbol.role] = (roleCounts[item.symbol.role] || 0) + 1;
    const zone = zoneOf(item);
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });

  const centerItems = items.filter((item) => distance(item, { x: 50, y: 50 }) < 18);
  const perimeterItems = items.filter((item) => item.x < 16 || item.x > 84 || item.y < 16 || item.y > 84);
  const boundaryCount = (roleCounts.boundary || 0) + (roleCounts.container || 0);
  const connectionCount = (roleCounts.connection || 0) + (roleCounts.movement || 0) + (roleCounts.threshold || 0);
  const affectCount = (roleCounts.affect || 0) + (roleCounts.unspoken || 0);
  const supportCount = (roleCounts.safety || 0) + (roleCounts.protection || 0) + (roleCounts.resource || 0);
  const isolatedItems = isolatedSymbols(items);
  const closePairs = closeSymbolPairs(items);
  const dominantZone = dominant(zoneCounts) || "无";
  const density = densityLabel(itemCount);
  const microSignals = deriveMicroSignals({
    items,
    categoryCounts,
    zoneCounts,
    centerItems,
    perimeterItems,
    isolatedItems,
    closePairs,
    dominantZone,
    density,
  });

  const themes = [];
  const prompts = [];

  if (!itemCount) {
    themes.push("沙盘尚为空，当前更像一个等待表达的容器。");
    prompts.push("先从一个最能代表当前状态的物件开始，再观察它需要靠近或远离什么。");
  } else {
    themes.push(`当前共有 ${itemCount} 个微缩物，空间密度为“${density}”，主区域为“${dominantZone}”。`);

    if (centerItems.length) {
      themes.push(`中心区出现 ${centerItems.map((item) => item.symbol.label).join("、")}，可作为当前自我关注或核心议题的线索。`);
      prompts.push("中心物件像是在保护、表达、等待，还是阻挡？");
    } else {
      themes.push("中心区保持留白，可能提示主题仍在形成，或重要内容被放在关系/边缘位置。");
      prompts.push("如果中心必须出现一个物件，它会是什么？");
    }

    if (boundaryCount >= 2) {
      themes.push("边界与容器元素较明显，可关注保护、隔离、控制感和安全距离。");
      prompts.push("哪些对象被边界保护，哪些对象被边界隔开？");
    }

    if (connectionCount >= 2) {
      themes.push("道路、桥、门或行动元素较多，沙盘里存在转变、通达或重新连接的主题。");
      prompts.push("哪一条路径最想被走通，走通后会发生什么？");
    }

    if (affectCount) {
      themes.push("水、火、阴影等情绪能量元素出现，适合追问情绪的强度、可控性与命名方式。");
      prompts.push("这些能量是被承接、被隐藏，还是正在扩散？");
    }

    if (perimeterItems.length > itemCount * 0.45) {
      themes.push("大量物件靠近边缘，可能反映谨慎、探索边界或把重要内容保持在安全距离。");
      prompts.push("边缘物件若向中心移动一步，会变得更安全还是更危险？");
    }

    if (isolatedItems.length) {
      themes.push(`${isolatedItems.map((item) => item.symbol.label).join("、")} 与其他物件距离较远，可作为孤立感或独立资源的观察点。`);
      prompts.push("最孤立的物件希望被谁看见，或希望继续保持距离？");
    }

    if ((categoryCounts.figures || 0) >= 3 && (categoryCounts.boundary || 0) >= 1) {
      themes.push("人物与边界同时突出，关系位置、角色分工和亲近距离可能是重点。");
    }

    prompts.push("请来访者为这个场景取一个标题，再讲述开始、冲突与下一步。");
    prompts.push("以移动顺序为线索记录：先放下的物件通常承载更直接的主题。");
  }

  themes.push("所有解释都应回到来访者自己的命名、故事和情绪体验，而不是由系统直接下结论。");

  const scores = [
    { label: "自我", value: score((roleCounts.core || 0) * 24 + centerItems.length * 12 + (categoryCounts.figures || 0) * 5) },
    { label: "关系", value: score((roleCounts.relationship || 0) * 22 + connectionCount * 12 + (categoryCounts.figures || 0) * 5) },
    { label: "保护", value: score(boundaryCount * 18 + supportCount * 13 + (roleCounts.control || 0) * 10) },
    { label: "行动", value: score(connectionCount * 18 + (categoryCounts.motion || 0) * 14 + zoneRight(items) * 6) },
    { label: "情绪", value: score(affectCount * 20 + (roleCounts.vulnerable || 0) * 13 + (roleCounts.instinct || 0) * 10) },
  ];

  return {
    itemCount,
    density,
    dominantZone,
    boundaryCount,
    categoryCounts,
    roleCounts,
    zoneCounts,
    microSignals,
    themes,
    prompts,
    scores,
  };
}

function deriveMicroSignals({ items, categoryCounts, zoneCounts, centerItems, perimeterItems, isolatedItems, closePairs, dominantZone, density }) {
  if (!items.length) {
    return [
      "留白本身是第一条线索：没有放置物件时，重点可放在回避、等待、安全感、控制权或尚未被命名的主题。",
      "空沙盘不等于没有内容；需要回到来访者的解释，询问其对空白、沙面和边界的感受。",
    ];
  }

  const ordered = [...items].sort((a, b) => itemOrderTime(a) - itemOrderTime(b));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const largest = [...items].sort((a, b) => b.scale - a.scale)[0];
  const repeated = Object.entries(categoryCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `${categoryLabel(category)} ${count} 个`);
  const leftCount = items.filter((item) => item.x < 45).length;
  const rightCount = items.filter((item) => item.x > 55).length;
  const upperCount = items.filter((item) => item.y < 45).length;
  const lowerCount = items.filter((item) => item.y > 55).length;
  const dominantZoneCount = zoneCounts[dominantZone] || 0;

  const signals = [
    `第一物件是“${first.symbol.label}”，位于${zoneOf(first)}，常作为进入主题的门口；先问它为什么第一个出现。`,
  ];

  if (last && last.id !== first.id) {
    signals.push(`最后放下的是“${last.symbol.label}”，可观察它是在补充、修复、封口，还是改变前面场景的含义。`);
  }

  signals.push(`主区域为${dominantZone}（${dominantZoneCount} 个物件），空间密度为${density}；这比单个符号更适合作为结构性线索。`);

  if (centerItems.length) {
    signals.push(`中心区承载“${centerItems.map((item) => item.symbol.label).join("、")}”，提示当前最容易被看见或最需要被承接的内容。`);
  } else {
    signals.push("中心区留白，提示核心位置暂未被占据；可询问留白是安全、空洞、等待，还是不可触碰。");
  }

  if (largest && largest.scale > 1.05) {
    signals.push(`最大的物件是“${largest.symbol.label}”，体量被放大，可能代表强度、价值、压力或需要优先处理的对象。`);
  }

  if (repeated.length) {
    signals.push(`重复类别：${repeated.join("、")}。重复比单个象征更可靠，适合追踪主题是否在多处回返。`);
  }

  if (closePairs.length) {
    const pairText = closePairs
      .slice(0, 2)
      .map((pair) => `“${pair.a.symbol.label}”靠近“${pair.b.symbol.label}”`)
      .join("；");
    signals.push(`亲近线索：${pairText}。靠近可被理解为联盟、依赖、冲突或无法分离，需由来访者命名。`);
  }

  if (isolatedItems.length) {
    signals.push(`孤立线索：${isolatedItems.map((item) => `“${item.symbol.label}”`).join("、")}离其他物件较远，可能是被保护、被排除或自成资源。`);
  }

  if (perimeterItems.length >= Math.ceil(items.length / 2)) {
    signals.push("大量物件靠近边缘，边界感强；可观察来访者是否需要距离、退路或外部保护。");
  }

  if (Math.abs(leftCount - rightCount) >= 2) {
    signals.push(leftCount > rightCount ? "左侧物件明显更多，可关注过去、记忆和既有关系的牵引。" : "右侧物件明显更多，可关注未来、行动和未完成目标的牵引。");
  }

  if (Math.abs(upperCount - lowerCount) >= 2) {
    signals.push(upperCount > lowerCount ? "上半区物件更多，可关注意识化、理想、秩序或精神性表达。" : "下半区物件更多，可关注身体感、情绪沉积、现实负担或本能层面。");
  }

  return signals.slice(0, 9);
}

function closeSymbolPairs(items) {
  const pairs = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const spacing = distance(items[i], items[j]);
      if (spacing <= 16) {
        pairs.push({ a: items[i], b: items[j], spacing });
      }
    }
  }
  return pairs.sort((a, b) => a.spacing - b.spacing);
}

function itemOrderTime(item) {
  return Date.parse(item.addedAt || "") || 0;
}

function saveLocalSession() {
  const payload = buildPayload();
  const sessions = JSON.parse(localStorage.getItem("mindsand-sessions") || "[]");
  sessions.push(payload);
  localStorage.setItem("mindsand-sessions", JSON.stringify(sessions.slice(-100)));
  notify("已保存到本地浏览器");
}

async function saveServerSession() {
  const payload = buildPayload();
  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    notify("已保存到服务器");
  } catch (error) {
    notify(`服务器保存失败：${error.message}`);
  }
}

function exportReport() {
  const report = buildReport();
  if (!report) {
    notify("请先点击沙盘下方的见微知著分析");
    return;
  }
  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `mindsand-report-${new Date().toISOString().slice(0, 10)}.md`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function copyReport() {
  const report = buildReport();
  if (!report) {
    notify("请先点击沙盘下方的见微知著分析");
    return;
  }
  try {
    await navigator.clipboard.writeText(report);
    notify("报告已复制");
  } catch {
    notify("复制失败，请使用导出报告");
  }
}

function buildPayload() {
  return {
    id: `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    client_code: els.clientCode.value.trim(),
    title: els.sceneTitle.value.trim(),
    aim: els.sessionAim.value.trim(),
    notes: els.sessionNotes.value.trim(),
    scene: state.items.map((item) => ({ ...item, label: getSymbol(item.symbolId).label, category: getSymbol(item.symbolId).category })),
    analysis: state.lastAnalysis
      ? { ...state.lastAnalysis, generated_at: state.lastAnalyzedAt, stale: state.analysisDirty }
      : { status: "not_requested", stale: false },
  };
}

function buildReport() {
  if (!state.lastAnalysis) return "";
  const payload = buildPayload();
  const analysis = payload.analysis;
  const sceneRows = payload.scene
    .map((item) => `- ${item.label}：${item.category}，x=${item.x.toFixed(1)}，y=${item.y.toFixed(1)}，scale=${item.scale}`)
    .join("\n");
  return `# MindSand 沙盘分析报告

生成时间：${new Date().toLocaleString()}
匿名编号：${payload.client_code || "未填写"}
主题：${payload.title || "未填写"}
目标：${payload.aim || "未填写"}

## 概览

- 微缩物数量：${analysis.itemCount}
- 空间密度：${analysis.density}
- 主区域：${analysis.dominantZone}
- 边界物数量：${analysis.boundaryCount}

## 微证据链

${analysis.microSignals.map((signal) => `- ${signal}`).join("\n")}

## 主题线索

${analysis.themes.map((theme) => `- ${theme}`).join("\n")}

## 观察提示

${analysis.prompts.map((prompt) => `- ${prompt}`).join("\n")}

## 微缩物清单

${sceneRows || "- 暂无"}

## 咨询师记录

${payload.notes || "未填写"}

## 使用边界

本报告仅用于心理教育、咨询记录与自我反思；不能替代临床诊断、治疗或危机干预。解释应以当事人的叙事、情绪、文化背景和咨询关系为准。
`;
}

function saveDraft() {
  const draft = {
    items: state.items,
    selectedId: state.selectedId,
    clientCode: els.clientCode?.value || "",
    sceneTitle: els.sceneTitle?.value || "",
    sessionAim: els.sessionAim?.value || "",
    sessionNotes: els.sessionNotes?.value || "",
    rake: els.rakeCanvas?.toDataURL?.() || "",
  };
  localStorage.setItem("mindsand-draft", JSON.stringify(draft));
}

function restoreDraft() {
  const raw = localStorage.getItem("mindsand-draft");
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    state.items = Array.isArray(draft.items) ? draft.items : [];
    state.selectedId = draft.selectedId || null;
    els.clientCode.value = draft.clientCode || "";
    els.sceneTitle.value = draft.sceneTitle || "";
    els.sessionAim.value = draft.sessionAim || "";
    els.sessionNotes.value = draft.sessionNotes || "";
    if (draft.rake) {
      const image = new Image();
      image.onload = () => rakeContext.drawImage(image, 0, 0, els.rakeCanvas.width, els.rakeCanvas.height);
      image.src = draft.rake;
    }
  } catch {
    localStorage.removeItem("mindsand-draft");
  }
}

function pushHistory() {
  state.history.push(JSON.stringify({ items: state.items, selectedId: state.selectedId }));
  state.history = state.history.slice(-40);
}

function resizeCanvas() {
  const rect = els.rakeCanvas.getBoundingClientRect();
  const previous = document.createElement("canvas");
  previous.width = els.rakeCanvas.width || 1;
  previous.height = els.rakeCanvas.height || 1;
  previous.getContext("2d").drawImage(els.rakeCanvas, 0, 0);
  els.rakeCanvas.width = Math.max(1, Math.round(rect.width * window.devicePixelRatio));
  els.rakeCanvas.height = Math.max(1, Math.round(rect.height * window.devicePixelRatio));
  rakeContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  if (previous.width > 1) {
    rakeContext.drawImage(previous, 0, 0, rect.width, rect.height);
  }
}

function trayPoint(event) {
  const rect = els.tray.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

function toCanvasPoint(point) {
  const rect = els.rakeCanvas.getBoundingClientRect();
  return {
    x: (point.x / 100) * rect.width,
    y: (point.y / 100) * rect.height,
  };
}

function getSymbol(id) {
  return symbols.find((symbol) => symbol.id === id) || symbols[0];
}

function categoryLabel(id) {
  return categories.find((category) => category.id === id)?.label || id;
}

function getItem(id) {
  return state.items.find((item) => item.id === id);
}

function selectedItem() {
  return state.selectedId ? getItem(state.selectedId) : null;
}

function zoneOf(item) {
  if (distance(item, { x: 50, y: 50 }) < 18) return "中心";
  if (item.x < 50 && item.y < 50) return "左上";
  if (item.x >= 50 && item.y < 50) return "右上";
  if (item.x < 50 && item.y >= 50) return "左下";
  return "右下";
}

function dominant(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function densityLabel(count) {
  if (count === 0) return "空";
  if (count <= 6) return "低";
  if (count <= 16) return "中";
  return "高";
}

function isolatedSymbols(items) {
  if (items.length < 3) return [];
  return items.filter((item) => {
    const nearest = Math.min(...items.filter((other) => other.id !== item.id).map((other) => distance(item, other)));
    return nearest > 28;
  });
}

function zoneRight(items) {
  return items.filter((item) => item.x > 62).length;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function score(value) {
  return Math.round(clamp(value, 0, 100));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(value) {
  let angle = value % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function notify(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function symbolSvg(symbol) {
  const c = symbol.color;
  const dark = "#25313c";
  const pale = "#fff7e8";
  switch (symbol.shape) {
    case "figure":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="13" r="7" fill="${c}"/><path d="M14 40c1-10 5-17 10-17s9 7 10 17z" fill="${c}"/><path d="M17 28h14" stroke="${pale}" stroke-width="2"/></svg>`;
    case "child":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="6" fill="${c}"/><path d="M17 39c1-8 4-14 7-14s6 6 7 14z" fill="${c}"/><path d="M14 30c7 5 13 5 20 0" stroke="${dark}" stroke-width="2" fill="none"/></svg>`;
    case "caregiver":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="19" cy="15" r="6" fill="${c}"/><circle cx="30" cy="18" r="5" fill="#4d9b91"/><path d="M11 40c2-9 6-15 11-15 4 0 8 4 10 11 2-4 4-6 6-7" fill="${c}" opacity=".85"/></svg>`;
    case "observer":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 24s7-11 18-11 18 11 18 11-7 11-18 11S6 24 6 24z" fill="${pale}" stroke="${c}" stroke-width="3"/><circle cx="24" cy="24" r="6" fill="${c}"/></svg>`;
    case "animal":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 29c2-9 10-13 19-10 5 1 8 4 10 9-4 1-7 4-8 8H16c-1-3-3-5-5-7z" fill="${c}"/><path d="M31 18l5-7 2 9M17 30l-5 8M31 30l6 8" stroke="${dark}" stroke-width="3"/></svg>`;
    case "house":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 23 24 9l17 14v17H12V23z" fill="${c}"/><path d="M20 40V28h8v12" fill="${pale}"/><path d="M7 23 24 9l17 14" stroke="${dark}" stroke-width="3" fill="none"/></svg>`;
    case "tower":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 40V14h18v26z" fill="${c}"/><path d="M13 14V8h5v6m5 0V8h5v6m5 0V8h3v6" stroke="${dark}" stroke-width="3"/><path d="M21 40V28h6v12M20 21h8" stroke="${pale}" stroke-width="2"/></svg>`;
    case "tent":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 40 24 9l17 31z" fill="${c}"/><path d="M24 9v31M16 40l8-13 8 13" stroke="${pale}" stroke-width="2" fill="none"/></svg>`;
    case "gate":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 40V18a13 13 0 0 1 26 0v22h-8V19a5 5 0 0 0-10 0v21z" fill="${c}"/><path d="M15 28h18" stroke="${pale}" stroke-width="2"/></svg>`;
    case "tree":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M22 25h5v16h-5z" fill="#6f4b2e"/><circle cx="24" cy="17" r="10" fill="${c}"/><circle cx="15" cy="24" r="8" fill="${c}"/><circle cx="33" cy="24" r="8" fill="${c}"/></svg>`;
    case "mountain":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 40 18 15l8 13 5-8 12 20z" fill="${c}"/><path d="m18 15 5 8 3-5M31 20l4 8" stroke="${pale}" stroke-width="2"/></svg>`;
    case "water":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 29c5-6 10 6 15 0s10 6 15 0 6-3 6-3v12H6z" fill="${c}"/><path d="M7 20c5-5 9 5 14 0s9 5 14 0" stroke="${c}" stroke-width="4" fill="none"/></svg>`;
    case "fire":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42c-9-3-13-9-10-17 2-5 7-8 7-16 7 5 4 12 10 15 4 2 5 11-7 18z" fill="${c}"/><path d="M24 38c-4-2-6-5-4-9 1-3 4-5 4-9 4 4 7 11 0 18z" fill="#f4c04f"/></svg>`;
    case "stone":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 36c0-12 8-24 18-23 8 1 13 9 12 18-2 8-10 11-19 11-6 0-11-1-11-6z" fill="${c}"/><path d="M17 25h15" stroke="${pale}" stroke-width="2" opacity=".5"/></svg>`;
    case "bridge":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 34c7-17 29-17 36 0" stroke="${c}" stroke-width="7" fill="none"/><path d="M8 34h32M15 30v7M24 27v10M33 30v7" stroke="${dark}" stroke-width="2"/></svg>`;
    case "fence":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18h32M8 31h32" stroke="${c}" stroke-width="5"/><path d="M12 10v30M22 10v30M32 10v30" stroke="${dark}" stroke-width="4"/></svg>`;
    case "wall":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h32v24H8z" fill="${c}"/><path d="M8 22h32M8 30h32M18 14v8M30 14v8M14 22v8M26 22v8M38 22v8M20 30v8M32 30v8" stroke="${pale}" stroke-width="2" opacity=".65"/></svg>`;
    case "path":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 42c10-8 15-15 8-36M28 42c-4-12 2-18 8-28" stroke="${c}" stroke-width="7" fill="none"/></svg>`;
    case "circle":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" fill="none" stroke="${c}" stroke-width="7"/><circle cx="24" cy="24" r="5" fill="${c}"/></svg>`;
    case "light":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8" fill="${c}"/><path d="M24 4v8M24 36v8M4 24h8M36 24h8M10 10l6 6M32 32l6 6M38 10l-6 6M16 32l-6 6" stroke="${c}" stroke-width="4"/></svg>`;
    case "shadow":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 34c-13 8-29-1-29-16 0-4 1-8 4-12-1 12 8 24 25 28z" fill="${c}"/></svg>`;
    case "treasure":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 22h30v18H9z" fill="${c}"/><path d="M12 22c2-9 22-9 24 0M9 29h30M24 22v18" stroke="${dark}" stroke-width="3"/><circle cx="24" cy="31" r="3" fill="${pale}"/></svg>`;
    case "clock":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" fill="${pale}" stroke="${c}" stroke-width="5"/><path d="M24 14v11l8 5" stroke="${dark}" stroke-width="3"/></svg>`;
    case "mirror":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="19" rx="12" ry="15" fill="${pale}" stroke="${c}" stroke-width="5"/><path d="M24 34v8M17 42h14M19 18c4-5 9-6 14-4" stroke="${c}" stroke-width="2"/></svg>`;
    case "boat":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 29h32c-4 9-9 12-16 12S12 38 8 29z" fill="${c}"/><path d="M24 29V8l12 16H24z" fill="${pale}" stroke="${dark}" stroke-width="2"/></svg>`;
    case "vehicle":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 28h5l5-8h14l5 8h3v9H8z" fill="${c}"/><circle cx="16" cy="37" r="4" fill="${dark}"/><circle cx="34" cy="37" r="4" fill="${dark}"/><path d="M19 22h11" stroke="${pale}" stroke-width="2"/></svg>`;
    case "ladder":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 42 27 6M31 42 20 6M18 34h11M20 26h7M22 18h3" stroke="${c}" stroke-width="5"/></svg>`;
    case "key":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="21" r="8" fill="none" stroke="${c}" stroke-width="6"/><path d="M24 26 40 42M33 35l5-5M37 39l4-4" stroke="${c}" stroke-width="6"/></svg>`;
    case "spiral":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 24c0 2-2 3-4 3-5 0-8-6-5-11 4-8 18-7 22 2 6 15-11 30-25 20" stroke="${c}" stroke-width="5" fill="none"/></svg>`;
    default:
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" fill="${c}"/></svg>`;
  }
}
