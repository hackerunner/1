const energies = [
  { id: "star", label: "黄星星", truth: "潜意识", group: "inner", color: "#d09a28", shape: "star" },
  { id: "campfire", label: "篝火", truth: "团队代表", group: "outer", color: "#c65c45", shape: "fire" },
  { id: "girl", label: "掌心的女孩", truth: "内容", group: "field", color: "#4d9b91", shape: "person" },
  { id: "sun", label: "黄太阳", truth: "布置", group: "structure", color: "#d09a28", shape: "sun" },
  { id: "monkey", label: "蓝猴", truth: "场域", group: "field", color: "#315f88", shape: "animal" },
  { id: "water-user", label: "壬水", truth: "用户", group: "inner", color: "#315f88", shape: "wave" },
  { id: "storm", label: "蓝风暴", truth: "整体状态", group: "inner", color: "#6e4f82", shape: "storm" },
  { id: "promo-fire", label: "丙火", truth: "宣传", group: "outer", color: "#c65c45", shape: "flame" },
  { id: "wood-self", label: "甲木", truth: "本人", group: "inner", color: "#4f7f4d", shape: "tree" },
  { id: "train", label: "绿皮火车", truth: "合作方代表", group: "outer", color: "#277a73", shape: "train" },
  { id: "dog", label: "白狗", truth: "影响力", group: "outer", color: "#66727d", shape: "dog" },
  { id: "warrior", label: "黄战士", truth: "资源", group: "structure", color: "#a67839", shape: "shield" },
  { id: "sea-wave", label: "海浪", truth: "投影源", group: "source", color: "#315f88", shape: "wave" },
  { id: "ingot", label: "金元宝", truth: "财富", group: "structure", color: "#d09a28", shape: "ingot" },
  { id: "key", label: "银钥匙", truth: "突破点", group: "source", color: "#6e4f82", shape: "key" },
  { id: "mirror", label: "小镜子", truth: "自我觉察", group: "inner", color: "#4d9b91", shape: "mirror" },
];

const state = {
  activeEnergy: "star",
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
  els.tray = document.getElementById("archetypeTray");
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
  els.energyShelf.innerHTML = energies
    .map((energy) => {
      const active = state.activeEnergy === energy.id ? "active" : "";
      return `
        <button class="energy-card ${active}" type="button" data-energy="${energy.id}">
          <span class="energy-icon">${energySvg(energy)}</span>
          <span>
            <strong>${energy.label}</strong>
            <small>${blind ? "真实能量已隐藏" : energy.truth}</small>
          </span>
        </button>
      `;
    })
    .join("");

  els.energyShelf.querySelectorAll(".energy-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeEnergy = button.dataset.energy;
      renderShelf();
    });
  });
}

function renderItems() {
  els.placedItems.innerHTML = state.items
    .map((item) => {
      const energy = getEnergy(item.energyId);
      const selected = item.id === state.selectedId ? "selected" : "";
      const source = item.isSource ? "source" : "";
      return `
        <button class="placed-item ${selected} ${source}" data-id="${item.id}" type="button"
          style="left:${item.x}%;top:${item.y}%;" title="${energy.label}">
          <span class="placed-token">${energySvg(energy)}</span>
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
  addItem(state.activeEnergy, point.x, point.y);
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
    moved: false,
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
  if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) dragState.moved = true;
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

function addItem(energyId, x, y) {
  const energy = getEnergy(energyId);
  const item = {
    id: `energy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    energyId,
    x: clamp(x, 3, 97),
    y: clamp(y, 4, 96),
    awareness: "",
    isSource: energy.truth === "投影源",
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
    els.selectedName.textContent = "尚未选择沙具";
    els.selectedTruth.textContent = "选择一个沙具后，记录它此刻给你的感觉。";
    els.awarenessInput.value = "";
    els.awarenessInput.disabled = true;
    els.saveAwarenessBtn.disabled = true;
    els.markSourceBtn.disabled = true;
    els.removeItemBtn.disabled = true;
    return;
  }

  const energy = getEnergy(item.energyId);
  els.selectedName.textContent = item.isSource ? `${energy.label} · 投影源` : energy.label;
  els.selectedTruth.textContent = blind ? "盲抽中：真实能量会在分析时揭示。" : `真实能量：${energy.truth}`;
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
  updateStatus();
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
  const starter = [
    ["sea-wave", 18, 34, "喷涌"],
    ["storm", 12, 42, "开心欢乐"],
    ["water-user", 25, 48, "灵活"],
    ["star", 45, 62, "单纯懵懂"],
    ["girl", 52, 74, "安稳"],
    ["campfire", 68, 48, "燃烧有光"],
    ["train", 84, 36, "有方向"],
    ["ingot", 66, 35, "有钱"],
    ["warrior", 60, 25, "有力量"],
  ];
  starter.forEach(([energyId, x, y, awareness]) => {
    const energy = getEnergy(energyId);
    state.items.push({
      id: `seed-${energyId}-${Math.random().toString(36).slice(2, 7)}`,
      energyId,
      x,
      y,
      awareness,
      isSource: energy.truth === "投影源",
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
  els.typeResult.innerHTML = '<div class="type-empty">等待生成原型。</div>';
  renderItems();
  updateEditor();
}

function analyzeGame() {
  if (!state.items.length) {
    els.typeResult.innerHTML = '<div class="type-empty">先在沙盘里放几个能量沙具。</div>';
    return;
  }
  saveAwareness();
  const analysis = buildAnalysis();
  renderAnalysis(analysis);
}

function buildAnalysis() {
  const enriched = state.items.map((item) => ({ ...item, energy: getEnergy(item.energyId) }));
  const relations = nearestRelations(enriched);
  const source = enriched.find((item) => item.isSource) || findClosestToCenter(enriched);
  const sourceNeighbors = relations[source.id] || [];
  const axes = scoreAxes(enriched, source, sourceNeighbors);
  const code = axes.map((axis) => axis.code).join("-");
  const name = axes.map((axis) => axis.word).join("");
  const summary = buildSummary(enriched, source, sourceNeighbors, axes);
  const actions = buildActions(source, sourceNeighbors, axes);
  return { enriched, relations, source, sourceNeighbors, axes, code, name, summary, actions };
}

function scoreAxes(items, source, sourceNeighbors) {
  const groupScore = (groups) =>
    items
      .filter((item) => groups.includes(item.energy.group))
      .reduce((total, item) => total + centrality(item) + awarenessBoost(item), 0);
  const rightScore = items.reduce((total, item) => total + (item.x > 55 ? 0.25 : 0) + (item.energy.group === "outer" ? 0.9 : 0), 0);
  const innerScore = groupScore(["inner", "field"]) + items.reduce((total, item) => total + (item.x < 45 ? 0.2 : 0), 0);
  const fireScore = keywordScore(items, ["光", "燃", "热", "冲", "力量", "方向", "钱", "开心"]) + groupScore(["outer", "structure"]);
  const waterScore = keywordScore(items, ["流", "灵活", "安稳", "智慧", "懵懂", "柔", "等", "感受"]) + groupScore(["inner", "field"]);
  const structureScore = groupScore(["structure"]) + keywordScore(items, ["稳", "钱", "资源", "布置", "方向", "落地"]);
  const fieldScore = groupScore(["field", "inner"]) + keywordScore(items, ["场", "内容", "智慧", "接受", "可爱", "安稳"]);
  const sourceOuter = sourceNeighbors.filter((rel) => ["outer", "structure"].includes(rel.item.energy.group)).reduce((total, rel) => total + rel.weight, 0);
  const sourceInner = sourceNeighbors.filter((rel) => ["inner", "field"].includes(rel.item.energy.group)).reduce((total, rel) => total + rel.weight, 0);
  const breakthroughScore = sourceOuter + keywordScore([source], ["喷涌", "冲", "破", "开", "方向", "力量"]);
  const harmonyScore = sourceInner + keywordScore([source], ["安稳", "接受", "智慧", "柔", "等", "可爱"]);

  return [
    axis("能量来源", innerScore, rightScore, "I", "O", "内感", "外推"),
    axis("行动动力", waterScore, fireScore, "W", "F", "流动", "点火"),
    axis("建构方式", fieldScore, structureScore, "C", "R", "造场", "筑基"),
    axis("突破姿态", harmonyScore, breakthroughScore, "H", "A", "借势", "破阵"),
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
    direction: useRight ? "right" : "left",
  };
}

function buildSummary(items, source, sourceNeighbors, axes) {
  const sourceEnergy = source.energy.truth;
  const sourceState = source.awareness || "还没有被命名";
  const closest = sourceNeighbors[0]?.item;
  const closestText = closest ? `它最近贴着“${closest.energy.truth}”，说明破局不是凭空发生，而是要从${closest.energy.truth}这条线索里打开。` : "投影源周围很空，说明这盘的破局更像先把源头能量单独看清。";
  const outer = axes[0].code === "O" ? "你这盘不是闷头想出来的盘，它要靠外部反馈、团队、宣传或合作把能量点燃。" : "你这盘的答案先从内在感受里出来，急着外推反而会散。";
  const drive = axes[1].code === "F" ? "动力是火：适合先制造可见动作，让局面热起来。" : "动力是水：适合顺势流动，先调位置、调节奏、调感受。";
  return `投影源是“${source.energy.label}”，真实能量指向“${sourceEnergy}”，你给它的状态是“${sourceState}”。${closestText}${outer}${drive}`;
}

function buildActions(source, sourceNeighbors, axes) {
  const actions = [];
  const nearestTruth = sourceNeighbors[0]?.item.energy.truth;
  if (nearestTruth) actions.push(`先处理“${source.energy.truth}”和“${nearestTruth}”的关系：它们是互相点亮、互相拉扯，还是一个在替另一个背压力。`);
  actions.push(axes[2].code === "R" ? "把资源、钱、合作节奏写成清单；这盘需要可执行结构，不要只靠感觉。" : "先把内容、场域和用户感受调顺；这盘的吸引力来自气质一致。");
  actions.push(axes[3].code === "A" ? "本周做一个外显动作：发出去、谈合作、做一次公开呈现。" : "本周先做一个关系动作：确认需求、收反馈、让关键人靠近。");
  actions.push("把最模糊但最有感觉的那个沙具，再补一句主观觉察；下一轮分析会更准。");
  return actions;
}

function renderAnalysis(analysis) {
  const topRelations = allRelations(analysis.enriched)
    .filter((rel) => rel.weight > 0.42)
    .slice(0, 6);
  const sourceNeighborText = analysis.sourceNeighbors.length
    ? analysis.sourceNeighbors.map((rel) => `“${analysis.source.energy.truth}”靠近“${rel.item.energy.truth}”：${relationMeaning({ a: analysis.source, b: rel.item, level: rel.level })}`)
    : ["投影源周围没有特别近的沙具，先单独命名它的状态。"];

  els.typeResult.innerHTML = `
    <section class="type-hero">
      <span class="type-code">${analysis.code}</span>
      <h3>${analysis.name}型</h3>
      <p>${escapeHtml(analysis.summary)}</p>
    </section>
    <section class="result-card">
      <h4>四维倾向</h4>
      <div class="axis-grid">
        ${analysis.axes.map(axisHtml).join("")}
      </div>
    </section>
    <section class="result-card">
      <h4>投影源破局</h4>
      <ul>${sourceNeighborText.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
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
      <h4>能量揭示</h4>
      <div class="energy-map">
        ${analysis.enriched.map(energyMapHtml).join("")}
      </div>
    </section>
  `;
  els.gameStatus.textContent = `已生成 ${analysis.name}型。结果只作娱乐参考，真正答案以你的行动反馈为准。`;
}

function axisHtml(axis) {
  return `
    <div class="axis-row">
      <header>
        <span>${axis.label}</span>
        <strong>${axis.word} ${axis.percent}%</strong>
      </header>
      <div class="axis-track"><div class="axis-fill" style="width:${axis.percent}%"></div></div>
    </div>
  `;
}

function energyMapHtml(item) {
  return `
    <div class="energy-map-item">
      <strong>${escapeHtml(item.energy.label)} → ${escapeHtml(item.energy.truth)}${item.isSource ? " · 投影源" : ""}</strong>
      <span>主观觉察：${escapeHtml(item.awareness || "未填写")}</span>
    </div>
  `;
}

function updateStatus() {
  const count = state.items.length;
  const awarenessCount = state.items.filter((item) => item.awareness).length;
  els.gameStatus.textContent = count
    ? `已摆放 ${count} 个沙具，已记录 ${awarenessCount} 条主观觉察。`
    : "摆放 5 个以上沙具，并至少记录 3 条主观觉察，会更像一份“类 MBTI”画像。";
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
  return `“${rel.a.energy.truth}”与“${rel.b.energy.truth}”${relationVerb(rel.level)}，${relationMeaning(rel)}。`;
}

function relationMeaning(rel) {
  const a = rel.a?.energy?.truth || rel.item?.energy?.truth || "";
  const b = rel.b?.energy?.truth || "";
  const pair = `${a}${b}`;
  if (pair.includes("宣传") && pair.includes("团队")) return "适合让团队变成传播火种";
  if (pair.includes("财富") && pair.includes("资源")) return "钱和资源互相牵引，落地结构很重要";
  if (pair.includes("潜意识") && pair.includes("影响力")) return "真正有感染力的东西来自未经修饰的直觉";
  if (pair.includes("投影源") && pair.includes("整体状态")) return "破局点直接牵动全局状态，先调源头";
  if (pair.includes("本人") && pair.includes("资源")) return "个人状态需要资源托底，不宜硬扛";
  if (pair.includes("内容") && pair.includes("布置")) return "内容需要被更好地呈现，包装会影响接受度";
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

function getEnergy(id) {
  return energies.find((energy) => energy.id === id) || energies[0];
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

function energySvg(energy) {
  const c = energy.color;
  const dark = "#25313c";
  const pale = "#fff7e8";
  switch (energy.shape) {
    case "star":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 6 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z" fill="${c}" stroke="${dark}" stroke-width="2"/></svg>`;
    case "fire":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42c-9-3-13-9-10-17 2-5 7-8 7-16 7 5 4 12 10 15 4 2 5 11-7 18z" fill="${c}"/><path d="M24 38c-4-2-6-5-4-9 1-3 4-5 4-9 4 4 7 11 0 18z" fill="#f4c04f"/></svg>`;
    case "person":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="7" fill="${c}"/><path d="M14 40c1-10 5-17 10-17s9 7 10 17z" fill="${c}"/><path d="M13 33c7 5 15 5 22 0" stroke="${dark}" stroke-width="2" fill="none"/></svg>`;
    case "sun":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="9" fill="${c}"/><path d="M24 4v8M24 36v8M4 24h8M36 24h8M10 10l6 6M32 32l6 6M38 10l-6 6M16 32l-6 6" stroke="${c}" stroke-width="4"/></svg>`;
    case "animal":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 29c2-9 10-13 19-10 5 1 8 4 10 9-4 1-7 4-8 8H16c-1-3-3-5-5-7z" fill="${c}"/><path d="M31 18l5-7 2 9M17 30l-5 8M31 30l6 8" stroke="${dark}" stroke-width="3"/></svg>`;
    case "wave":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 29c5-6 10 6 15 0s10 6 15 0 6-3 6-3v12H6z" fill="${c}"/><path d="M7 20c5-5 9 5 14 0s9 5 14 0" stroke="${c}" stroke-width="4" fill="none"/></svg>`;
    case "storm":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 19c1-8 13-11 19-4 6 0 9 5 8 10-1 6-6 9-12 9H15c-6 0-10-3-10-8s4-8 10-7z" fill="${c}"/><path d="m25 23-7 11h7l-4 10 11-15h-7z" fill="#f4c04f"/></svg>`;
    case "flame":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42c-8-2-13-8-12-15 1-8 9-11 9-21 9 6 4 14 12 19 7 4 3 15-9 17z" fill="${c}"/><path d="M17 38h16" stroke="${dark}" stroke-width="3"/></svg>`;
    case "tree":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M22 25h5v16h-5z" fill="#6f4b2e"/><circle cx="24" cy="17" r="10" fill="${c}"/><circle cx="15" cy="24" r="8" fill="${c}"/><circle cx="33" cy="24" r="8" fill="${c}"/></svg>`;
    case "train":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 13h26c4 0 7 3 7 7v13H9z" fill="${c}"/><path d="M14 18h19M14 25h23M15 40l5-7M34 40l-5-7" stroke="${dark}" stroke-width="3"/><circle cx="17" cy="33" r="3" fill="${pale}"/><circle cx="34" cy="33" r="3" fill="${pale}"/></svg>`;
    case "dog":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 30c2-8 9-12 18-10 5 1 8 4 9 8-4 2-7 4-8 9H16c-1-3-2-5-4-7z" fill="${c}"/><path d="M31 19 39 9v13M17 30l-5 8M31 31l6 7" stroke="${dark}" stroke-width="3"/></svg>`;
    case "shield":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 39 11v12c0 10-6 16-15 20C15 39 9 33 9 23V11z" fill="${c}"/><path d="M24 10v27M15 22h18" stroke="${pale}" stroke-width="3"/></svg>`;
    case "ingot":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 31c3-9 8-13 14-13s11 4 14 13c-3 6-25 6-28 0z" fill="${c}"/><path d="M16 30c3 3 13 3 16 0M18 21c1 6 11 6 12 0" stroke="${dark}" stroke-width="3" fill="none"/></svg>`;
    case "key":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="21" r="8" fill="none" stroke="${c}" stroke-width="6"/><path d="M24 26 40 42M33 35l5-5M37 39l4-4" stroke="${c}" stroke-width="6"/></svg>`;
    case "mirror":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="19" rx="12" ry="15" fill="${pale}" stroke="${c}" stroke-width="5"/><path d="M24 34v8M17 42h14M19 18c4-5 9-6 14-4" stroke="${c}" stroke-width="2"/></svg>`;
    default:
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" fill="${c}"/></svg>`;
  }
}
