const sigils = [
  { id: "moon-mirror", label: "月相镜", truth: "自我觉察", group: "inner", color: "#c9b6ff", shape: "mirror" },
  { id: "star-candle", label: "星烛", truth: "潜意识", group: "inner", color: "#f1c86b", shape: "candle" },
  { id: "veil", label: "雾纱", truth: "未显化阻力", group: "shadow", color: "#b8a8d8", shape: "veil" },
  { id: "obsidian-gate", label: "黑曜门", truth: "边界与卡点", group: "shadow", color: "#8f8aa0", shape: "gate" },
  { id: "silver-key", label: "银钥", truth: "突破点", group: "source", color: "#d7e1e8", shape: "key" },
  { id: "tidal-shell", label: "潮汐贝", truth: "用户感受", group: "field", color: "#5fb8a7", shape: "shell" },
  { id: "oracle-cup", label: "金圣杯", truth: "财富承接", group: "resource", color: "#f1c86b", shape: "cup" },
  { id: "crystal-tower", label: "紫晶塔", truth: "资源结构", group: "resource", color: "#8c78d4", shape: "crystal" },
  { id: "stag-lantern", label: "白鹿灯", truth: "贵人与合作", group: "outer", color: "#dce6d2", shape: "stag" },
  { id: "fire-altar", label: "星火坛", truth: "团队动能", group: "outer", color: "#ff936b", shape: "altar" },
  { id: "feather-messenger", label: "羽信", truth: "宣传传播", group: "outer", color: "#f3d6a2", shape: "feather" },
  { id: "garden", label: "秘花园", truth: "内容资产", group: "field", color: "#8da66c", shape: "garden" },
  { id: "storm-eye", label: "靛风眼", truth: "整体状态", group: "field", color: "#74a9d8", shape: "eye" },
  { id: "compass", label: "铜罗盘", truth: "方向策略", group: "structure", color: "#d9ad57", shape: "compass" },
  { id: "serpent-staff", label: "青蛇杖", truth: "行动力", group: "structure", color: "#5fb8a7", shape: "staff" },
  { id: "solar-coin", label: "日金币", truth: "影响力", group: "outer", color: "#f1c86b", shape: "coin" },
  { id: "wave-source", label: "源潮", truth: "投影源", group: "source", color: "#74a9d8", shape: "wave" },
  { id: "black-seed", label: "黑种子", truth: "隐藏潜能", group: "shadow", color: "#9a8f76", shape: "seed" },
];

const state = {
  activeSigil: "moon-mirror",
  items: [],
  selectedId: null,
};

const els = {};
let dragState = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  renderShelf();
  renderItems();
  updateEditor();
});

function cacheElements() {
  els.energyShelf = document.getElementById("energyShelf");
  els.blindMode = document.getElementById("blindMode");
  els.tray = document.getElementById("mysticTray");
  els.placedItems = document.getElementById("placedItems");
  els.selectedName = document.getElementById("selectedName");
  els.selectedTruth = document.getElementById("selectedTruth");
  els.awarenessInput = document.getElementById("awarenessInput");
  els.saveAwarenessBtn = document.getElementById("saveAwarenessBtn");
  els.markSourceBtn = document.getElementById("markSourceBtn");
  els.removeItemBtn = document.getElementById("removeItemBtn");
  els.analyzeGameBtn = document.getElementById("analyzeGameBtn");
  els.resetGameBtn = document.getElementById("resetGameBtn");
  els.demoGameBtn = document.getElementById("demoGameBtn");
  els.typeResult = document.getElementById("typeResult");
  els.gameStatus = document.getElementById("gameStatus");
  els.gameTopic = document.getElementById("gameTopic");
  els.gameQuestion = document.getElementById("gameQuestion");
}

function bindEvents() {
  els.blindMode.addEventListener("change", () => {
    renderShelf();
    updateEditor();
  });
  els.tray.addEventListener("pointerdown", onTrayPointerDown);
  els.saveAwarenessBtn.addEventListener("click", saveAwareness);
  els.markSourceBtn.addEventListener("click", markSelectedAsSource);
  els.removeItemBtn.addEventListener("click", removeSelected);
  els.analyzeGameBtn.addEventListener("click", analyzeGame);
  els.resetGameBtn.addEventListener("click", resetGame);
  els.demoGameBtn.addEventListener("click", seedGame);
  els.awarenessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveAwareness();
  });
}

function renderShelf() {
  const blind = els.blindMode.checked;
  els.energyShelf.innerHTML = sigils
    .map((sigil) => {
      const active = state.activeSigil === sigil.id ? "active" : "";
      return `
        <button class="energy-card ${active}" type="button" data-sigil="${sigil.id}">
          <span class="sigil-icon">${sigilSvg(sigil)}</span>
          <span>
            <strong>${sigil.label}</strong>
            <small>${blind ? "真实能量隐藏中" : sigil.truth}</small>
          </span>
        </button>
      `;
    })
    .join("");

  els.energyShelf.querySelectorAll(".energy-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSigil = button.dataset.sigil;
      renderShelf();
    });
  });
}

function renderItems() {
  els.placedItems.innerHTML = state.items
    .map((item) => {
      const sigil = getSigil(item.sigilId);
      const selected = item.id === state.selectedId ? "selected" : "";
      const source = item.isSource ? "source" : "";
      return `
        <button class="placed-item ${selected} ${source}" data-id="${item.id}" type="button"
          style="left:${item.x}%;top:${item.y}%;" title="${sigil.label}">
          <span class="placed-token">${sigilSvg(sigil)}</span>
          ${item.isSource ? '<span class="source-dot" title="投影源"></span>' : ""}
        </button>
      `;
    })
    .join("");

  els.placedItems.querySelectorAll(".placed-item").forEach((node) => {
    node.addEventListener("pointerdown", onItemPointerDown);
    node.addEventListener("click", (event) => event.stopPropagation());
  });
  updateStatus();
}

function onTrayPointerDown(event) {
  if (event.target.closest(".placed-item")) return;
  const point = trayPoint(event);
  addItem(state.activeSigil, point.x, point.y);
}

function onItemPointerDown(event) {
  const id = event.currentTarget.dataset.id;
  const item = getItem(id);
  if (!item) return;
  state.selectedId = id;
  const rect = els.tray.getBoundingClientRect();
  dragState = {
    id,
    startX: item.x,
    startY: item.y,
    startClientX: event.clientX,
    startClientY: event.clientY,
    rectWidth: rect.width,
    rectHeight: rect.height,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onItemPointerMove);
  window.addEventListener("pointerup", onItemPointerUp, { once: true });
  renderItems();
  updateEditor();
}

function onItemPointerMove(event) {
  if (!dragState) return;
  const item = getItem(dragState.id);
  if (!item) return;
  const dx = ((event.clientX - dragState.startClientX) / dragState.rectWidth) * 100;
  const dy = ((event.clientY - dragState.startClientY) / dragState.rectHeight) * 100;
  item.x = clamp(dragState.startX + dx, 3, 97);
  item.y = clamp(dragState.startY + dy, 4, 96);
  positionItem(dragState.id, item);
}

function onItemPointerUp() {
  window.removeEventListener("pointermove", onItemPointerMove);
  dragState = null;
  renderItems();
}

function positionItem(id, item) {
  const node = els.placedItems.querySelector(`[data-id="${id}"]`);
  if (!node) return;
  node.style.left = `${item.x}%`;
  node.style.top = `${item.y}%`;
}

function addItem(sigilId, x, y) {
  const sigil = getSigil(sigilId);
  const item = {
    id: `sigil-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    sigilId,
    x: clamp(x, 3, 97),
    y: clamp(y, 4, 96),
    awareness: "",
    isSource: sigil.truth === "投影源" || sigil.truth === "突破点",
  };
  if (item.isSource) state.items.forEach((existing) => (existing.isSource = false));
  state.items.push(item);
  state.selectedId = item.id;
  renderItems();
  updateEditor();
}

function updateEditor() {
  const item = selectedItem();
  const blind = els.blindMode.checked;
  if (!item) {
    els.selectedName.textContent = "尚未选择星砂";
    els.selectedTruth.textContent = "选择一个图标，写一句它给你的直觉感受。";
    els.awarenessInput.value = "";
    els.awarenessInput.disabled = true;
    els.saveAwarenessBtn.disabled = true;
    els.markSourceBtn.disabled = true;
    els.removeItemBtn.disabled = true;
    return;
  }
  const sigil = getSigil(item.sigilId);
  els.selectedName.textContent = item.isSource ? `${sigil.label} · 投影源` : sigil.label;
  els.selectedTruth.textContent = blind ? "盲选中：真实能量会在揭示时出现。" : `真实能量：${sigil.truth}`;
  els.awarenessInput.disabled = false;
  els.saveAwarenessBtn.disabled = false;
  els.markSourceBtn.disabled = false;
  els.removeItemBtn.disabled = false;
  els.awarenessInput.value = item.awareness || "";
}

function saveAwareness() {
  const item = selectedItem();
  if (!item) return;
  item.awareness = els.awarenessInput.value.trim();
  renderItems();
}

function markSelectedAsSource() {
  const item = selectedItem();
  if (!item) return;
  state.items.forEach((existing) => (existing.isSource = existing.id === item.id));
  renderItems();
  updateEditor();
}

function removeSelected() {
  if (!state.selectedId) return;
  state.items = state.items.filter((item) => item.id !== state.selectedId);
  state.selectedId = null;
  renderItems();
  updateEditor();
}

function seedGame() {
  state.items = [];
  [
    ["wave-source", 18, 34, "喷涌"],
    ["storm-eye", 12, 43, "开心但混沌"],
    ["tidal-shell", 27, 51, "灵活"],
    ["star-candle", 44, 62, "单纯懵懂"],
    ["garden", 52, 74, "安稳"],
    ["fire-altar", 69, 48, "燃烧有光"],
    ["feather-messenger", 83, 44, "被给到光"],
    ["oracle-cup", 67, 35, "能接住钱"],
    ["crystal-tower", 60, 24, "有力量"],
    ["stag-lantern", 84, 32, "有方向"],
  ].forEach(([sigilId, x, y, awareness]) => {
    const sigil = getSigil(sigilId);
    state.items.push({
      id: `seed-${sigilId}-${Math.random().toString(36).slice(2, 7)}`,
      sigilId,
      x,
      y,
      awareness,
      isSource: sigil.truth === "投影源",
    });
  });
  state.selectedId = state.items.find((item) => item.isSource)?.id || state.items[0]?.id || null;
  renderItems();
  updateEditor();
  analyzeGame();
}

function resetGame() {
  state.items = [];
  state.selectedId = null;
  els.typeResult.innerHTML = '<div class="empty-result">等待开盘。</div>';
  renderItems();
  updateEditor();
}

function analyzeGame() {
  if (!state.items.length) {
    els.typeResult.innerHTML = '<div class="empty-result">先在星砂盘里摆几个图标。</div>';
    return;
  }
  saveAwareness();
  const analysis = buildAnalysis();
  renderAnalysis(analysis);
}

function buildAnalysis() {
  const enriched = state.items.map((item) => ({ ...item, sigil: getSigil(item.sigilId) }));
  const relations = nearestRelations(enriched);
  const source = enriched.find((item) => item.isSource) || findClosestToCenter(enriched);
  const sourceNeighbors = relations[source.id] || [];
  const axes = scoreAxes(enriched, source, sourceNeighbors);
  const code = axes.map((axis) => axis.code).join("-");
  const name = axes.map((axis) => axis.word).join("");
  const summary = buildSummary(source, sourceNeighbors, axes);
  const actions = buildActions(source, sourceNeighbors, axes);
  return { enriched, source, sourceNeighbors, axes, code, name, summary, actions };
}

function scoreAxes(items, source, sourceNeighbors) {
  const groupScore = (groups) =>
    items
      .filter((item) => groups.includes(item.sigil.group))
      .reduce((total, item) => total + centrality(item) + awarenessBoost(item), 0);
  const outerScore = groupScore(["outer", "resource", "structure"]) + items.reduce((total, item) => total + (item.x > 55 ? 0.22 : 0), 0);
  const innerScore = groupScore(["inner", "field", "shadow"]) + items.reduce((total, item) => total + (item.x < 45 ? 0.22 : 0), 0);
  const sparkScore = keywordScore(items, ["光", "燃", "冲", "力量", "方向", "钱", "开心", "热"]) + groupScore(["outer", "structure"]);
  const tideScore = keywordScore(items, ["流", "灵活", "安稳", "智慧", "懵懂", "等", "柔", "感受"]) + groupScore(["inner", "field"]);
  const formScore = groupScore(["resource", "structure"]) + keywordScore(items, ["稳", "钱", "资源", "结构", "方向", "落地"]);
  const auraScore = groupScore(["field", "inner"]) + keywordScore(items, ["场", "内容", "感受", "接受", "可爱", "安稳"]);
  const sourceOuter = sourceNeighbors.filter((rel) => ["outer", "resource", "structure"].includes(rel.item.sigil.group)).reduce((total, rel) => total + rel.weight, 0);
  const sourceInner = sourceNeighbors.filter((rel) => ["inner", "field", "shadow"].includes(rel.item.sigil.group)).reduce((total, rel) => total + rel.weight, 0);
  const breakthroughScore = sourceOuter + keywordScore([source], ["喷涌", "冲", "破", "开", "方向", "力量"]);
  const harmonyScore = sourceInner + keywordScore([source], ["安稳", "接受", "智慧", "柔", "等", "可爱"]);

  return [
    axis("能量来源", innerScore, outerScore, "N", "M", "夜视", "显化"),
    axis("行动动力", tideScore, sparkScore, "T", "S", "潮汐", "星火"),
    axis("建构方式", auraScore, formScore, "A", "F", "造场", "铸形"),
    axis("突破姿态", harmonyScore, breakthroughScore, "G", "B", "借势", "破界"),
  ];
}

function axis(label, leftScore, rightScore, leftCode, rightCode, leftWord, rightWord) {
  const total = Math.max(0.01, leftScore + rightScore);
  const rightPercent = Math.round((rightScore / total) * 100);
  const useRight = rightPercent >= 52;
  return {
    label,
    code: useRight ? rightCode : leftCode,
    word: useRight ? rightWord : leftWord,
    leftWord,
    rightWord,
    percent: useRight ? rightPercent : 100 - rightPercent,
  };
}

function buildSummary(source, sourceNeighbors, axes) {
  const stateText = source.awareness || "还没有被命名";
  const closest = sourceNeighbors[0]?.item;
  const closestText = closest
    ? `它最近牵着“${closest.sigil.truth}”，说明答案不是单点爆发，而是要从这条关系里开门。`
    : "它周围很空，说明这局要先把源头单独看清。";
  const energyLine = axes[0].code === "M" ? "你这盘需要被看见，藏着做会散。" : "你这盘先靠内在校准，急着外放会乱。";
  const moveLine = axes[1].code === "S" ? "动力是星火：先点燃一个可见动作。" : "动力是潮汐：先顺势调节节奏和位置。";
  return `投影源是“${source.sigil.label}”，真实能量指向“${source.sigil.truth}”，你给它的状态是“${stateText}”。${closestText}${energyLine}${moveLine}`;
}

function buildActions(source, sourceNeighbors, axes) {
  const actions = [];
  const nearestTruth = sourceNeighbors[0]?.item.sigil.truth;
  if (nearestTruth) actions.push(`先处理“${source.sigil.truth}”和“${nearestTruth}”的关系：它们是在互相点亮，还是一个替另一个承压。`);
  actions.push(axes[2].code === "F" ? "把资源、钱、方向和合作拆成一张行动清单，先让能量成形。" : "先调内容、场域和用户感受，吸引力来自气质一致。");
  actions.push(axes[3].code === "B" ? "本周做一个破界动作：公开、邀约、发布、谈合作，任选一个。" : "本周做一个借势动作：收反馈、确认需求、让关键人靠近。");
  actions.push("给最模糊的那枚星砂再补一句觉察，下一轮会更准。");
  return actions;
}

function renderAnalysis(analysis) {
  const topRelations = allRelations(analysis.enriched).filter((rel) => rel.weight > 0.42).slice(0, 6);
  const sourceLines = analysis.sourceNeighbors.length
    ? analysis.sourceNeighbors.map((rel) => `“${analysis.source.sigil.truth}”靠近“${rel.item.sigil.truth}”：${relationMeaning({ a: analysis.source, b: rel.item, level: rel.level })}`)
    : ["投影源周围没有特别近的星砂，先单独命名它的状态。"];

  els.typeResult.innerHTML = `
    <section class="type-hero">
      <span class="type-code">${analysis.code}</span>
      <h3>${analysis.name}型</h3>
      <p>${escapeHtml(analysis.summary)}</p>
    </section>
    <section class="result-card">
      <h4>四维倾向</h4>
      <div class="axis-grid">${analysis.axes.map(axisHtml).join("")}</div>
    </section>
    <section class="result-card">
      <h4>投影源破局</h4>
      <ul>${sourceLines.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
    <section class="result-card">
      <h4>关键关系</h4>
      <ol class="relationship-list">
        ${topRelations.length ? topRelations.map((rel) => `<li>${escapeHtml(relationLine(rel))}</li>`).join("") : "<li>目前关系较分散，先增加摆放或补充觉察。</li>"}
      </ol>
    </section>
    <section class="result-card">
      <h4>行动指南</h4>
      <ul>${analysis.actions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
    <section class="result-card">
      <h4>真实能量揭示</h4>
      <div class="energy-map">${analysis.enriched.map(energyMapHtml).join("")}</div>
    </section>
  `;
  els.gameStatus.textContent = `已生成 ${analysis.name}型。结果只作娱乐参考，真正答案以行动反馈为准。`;
}

function axisHtml(axis) {
  return `
    <div class="axis-row">
      <header><span>${axis.label}</span><strong>${axis.word} ${axis.percent}%</strong></header>
      <div class="axis-track"><div class="axis-fill" style="width:${axis.percent}%"></div></div>
    </div>
  `;
}

function energyMapHtml(item) {
  return `
    <div class="energy-map-item">
      <strong>${escapeHtml(item.sigil.label)} → ${escapeHtml(item.sigil.truth)}${item.isSource ? " · 投影源" : ""}</strong>
      <span>主观觉察：${escapeHtml(item.awareness || "未填写")}</span>
    </div>
  `;
}

function updateStatus() {
  const count = state.items.length;
  const awarenessCount = state.items.filter((item) => item.awareness).length;
  els.gameStatus.textContent = count
    ? `已摆放 ${count} 枚星砂，已记录 ${awarenessCount} 条主观觉察。`
    : "摆放 5 个以上星砂，并记录几条主观觉察，会更像一份类 MBTI 原型画像。";
}

function nearestRelations(items) {
  const result = {};
  items.forEach((item) => {
    result[item.id] = items
      .filter((other) => other.id !== item.id)
      .map((other) => {
        const d = distance(item, other);
        return { item: other, distance: d, weight: proximityWeight(d), level: relationLevel(d) };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  });
  return result;
}

function allRelations(items) {
  const seen = new Set();
  const relations = [];
  for (const a of items) {
    for (const b of items) {
      if (a.id === b.id) continue;
      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const d = distance(a, b);
      relations.push({ a, b, distance: d, weight: proximityWeight(d), level: relationLevel(d) });
    }
  }
  return relations.sort((a, b) => b.weight - a.weight);
}

function relationLine(rel) {
  return `“${rel.a.sigil.truth}”与“${rel.b.sigil.truth}”${relationVerb(rel.level)}，${relationMeaning(rel)}。`;
}

function relationMeaning(rel) {
  const a = rel.a?.sigil?.truth || "";
  const b = rel.b?.sigil?.truth || "";
  const pair = `${a}${b}`;
  if (pair.includes("宣传") && pair.includes("团队")) return "适合把团队动能变成传播火种";
  if (pair.includes("财富") && pair.includes("资源")) return "承接与结构互相牵引，钱需要容器";
  if (pair.includes("潜意识") && pair.includes("影响力")) return "真正有感染力的东西来自未经修饰的直觉";
  if (pair.includes("投影源") && pair.includes("整体状态")) return "源头直接牵动全局，先调源头";
  if (pair.includes("内容") && pair.includes("用户")) return "内容要贴近用户感受，不宜自嗨";
  if (pair.includes("边界") && pair.includes("突破")) return "卡点本身就是门，别绕开它";
  if (rel.level === "close") return "能量互相牵动，优先一起看";
  if (rel.level === "medium") return "有连接但还没完全打通";
  return "保持距离，像是暂时不想互相影响";
}

function relationVerb(level) {
  if (level === "close") return "贴得很近";
  if (level === "medium") return "有明显连接";
  if (level === "far") return "保持距离";
  return "几乎不接触";
}

function findClosestToCenter(items) {
  return [...items].sort((a, b) => distance(a, { x: 50, y: 50 }) - distance(b, { x: 50, y: 50 }))[0];
}

function centrality(item) {
  return 1 - Math.min(distance(item, { x: 50, y: 50 }) / 70, 1);
}

function awarenessBoost(item) {
  return item.awareness ? 0.35 : 0;
}

function keywordScore(items, words) {
  return items.reduce((total, item) => {
    const text = item.awareness || "";
    return total + words.reduce((score, word) => score + (text.includes(word) ? 0.7 : 0), 0);
  }, 0);
}

function proximityWeight(distanceValue) {
  return Number(Math.max(0, 1 - distanceValue / 42).toFixed(3));
}

function relationLevel(distanceValue) {
  if (distanceValue <= 16) return "close";
  if (distanceValue <= 28) return "medium";
  if (distanceValue <= 42) return "far";
  return "very_far";
}

function trayPoint(event) {
  const rect = els.tray.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

function selectedItem() {
  return state.selectedId ? getItem(state.selectedId) : null;
}

function getItem(id) {
  return state.items.find((item) => item.id === id);
}

function getSigil(id) {
  return sigils.find((sigil) => sigil.id === id) || sigils[0];
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sigilSvg(sigil) {
  const c = sigil.color;
  const pale = "#f6efe2";
  const dark = "#171622";
  switch (sigil.shape) {
    case "mirror":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="25" rx="15" ry="19" fill="${pale}" stroke="${c}" stroke-width="4"/><path d="M32 44v12M22 56h20M24 23c5-7 13-8 20-4" stroke="${c}" stroke-width="3"/><path d="M18 10 13 5M46 10l5-5" stroke="${c}" stroke-width="3"/></svg>`;
    case "candle":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 7c8 8 3 14 9 20 5 5 1 14-9 16-10-2-14-11-9-16 5-6 3-12 9-20z" fill="${c}"/><path d="M25 38h14v18H25z" fill="${pale}" stroke="${dark}" stroke-width="3"/><path d="M20 56h24" stroke="${c}" stroke-width="4"/></svg>`;
    case "veil":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 18c8-9 29-9 36 0-5 6-5 14 0 22-8 8-28 8-36 0 5-8 5-16 0-22z" fill="${c}" opacity=".78"/><path d="M18 25c8 4 20 4 28 0M19 38c7 4 19 4 26 0" stroke="${pale}" stroke-width="3"/></svg>`;
    case "gate":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 56V25a15 15 0 0 1 30 0v31h-9V26a6 6 0 0 0-12 0v30z" fill="${c}" stroke="${pale}" stroke-width="3"/><path d="M20 40h24M32 10v9" stroke="${dark}" stroke-width="3"/></svg>`;
    case "key":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="24" cy="25" r="11" fill="none" stroke="${c}" stroke-width="6"/><path d="M34 33 53 52M44 43l6-6M49 48l5-5" stroke="${c}" stroke-width="6"/><circle cx="24" cy="25" r="3" fill="${pale}"/></svg>`;
    case "shell":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 47c2-20 12-33 20-33s18 13 20 33c-10 7-30 7-40 0z" fill="${c}"/><path d="M32 15v35M20 45c2-13 6-24 12-30M44 45c-2-13-6-24-12-30M16 47h32" stroke="${pale}" stroke-width="3"/></svg>`;
    case "cup":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 14h24v14c0 9-5 16-12 16s-12-7-12-16z" fill="${c}" stroke="${dark}" stroke-width="3"/><path d="M44 20h7c0 9-3 14-10 15M32 44v10M23 54h18" stroke="${c}" stroke-width="4"/><path d="M25 23h14" stroke="${pale}" stroke-width="3"/></svg>`;
    case "crystal":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 48 22 38 58H26L16 22z" fill="${c}" stroke="${pale}" stroke-width="3"/><path d="M32 6v52M16 22h32M24 22l8-16 8 16" stroke="${dark}" stroke-width="2"/></svg>`;
    case "stag":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 36c2-10 10-15 23-11 5 2 8 5 9 11-5 1-9 4-10 10H24c-1-5-3-8-5-10z" fill="${c}"/><path d="M24 23c-5-8-7-13-5-16M24 23c-1-8 2-14 8-18M42 25c2-8 6-14 12-17M42 25c6-7 8-12 7-17M24 44l-6 10M42 44l7 10" stroke="${pale}" stroke-width="4"/></svg>`;
    case "altar":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 52h24l-4-22H24z" fill="${dark}" stroke="${c}" stroke-width="4"/><path d="M32 8c8 8 3 14 9 20 4 4 0 12-9 14-9-2-13-10-9-14 5-6 3-12 9-20z" fill="${c}"/><path d="M20 52h24" stroke="${pale}" stroke-width="3"/></svg>`;
    case "feather":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M50 9C29 11 16 25 16 49c19-2 33-16 34-40z" fill="${c}" stroke="${dark}" stroke-width="3"/><path d="M17 49 48 12M24 38h18M28 30h16M22 46h11" stroke="${pale}" stroke-width="3"/></svg>`;
    case "garden":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="24" cy="24" r="9" fill="${c}"/><circle cx="40" cy="24" r="9" fill="${c}"/><circle cx="32" cy="38" r="10" fill="${c}"/><path d="M32 18v30M18 52h28" stroke="${pale}" stroke-width="4"/><circle cx="32" cy="30" r="5" fill="${pale}"/></svg>`;
    case "eye":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32s9-16 24-16 24 16 24 16-9 16-24 16S8 32 8 32z" fill="${pale}" stroke="${c}" stroke-width="4"/><circle cx="32" cy="32" r="9" fill="${c}"/><path d="M32 6v8M32 50v8M6 32h8M50 32h8" stroke="${c}" stroke-width="3"/></svg>`;
    case "compass":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="${c}" stroke-width="4"/><path d="m39 16-5 20-15 12 5-20z" fill="${c}" stroke="${dark}" stroke-width="3"/><circle cx="32" cy="32" r="3" fill="${pale}"/></svg>`;
    case "staff":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8v48" stroke="${c}" stroke-width="5"/><path d="M21 18c14-9 29 4 15 14-10 7-22-4-9-10" fill="none" stroke="${pale}" stroke-width="4"/><path d="M23 56h18" stroke="${c}" stroke-width="5"/></svg>`;
    case "coin":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="${c}" stroke="${dark}" stroke-width="3"/><path d="M32 13v38M13 32h38M20 20l24 24M44 20 20 44" stroke="${pale}" stroke-width="3"/><circle cx="32" cy="32" r="7" fill="${pale}"/></svg>`;
    case "wave":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 39c7-9 14 8 22 0s15 8 24 0v13H9z" fill="${c}"/><path d="M10 26c7-7 14 7 21 0s14 7 23 0" stroke="${c}" stroke-width="5"/><circle cx="19" cy="16" r="3" fill="${pale}"/></svg>`;
    case "seed":
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M34 56C18 48 14 31 31 8c18 18 19 38 3 48z" fill="${c}" stroke="${pale}" stroke-width="3"/><path d="M32 18v29M32 36c7-3 12-8 14-15" stroke="${dark}" stroke-width="3"/></svg>`;
    default:
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" fill="${c}"/></svg>`;
  }
}
