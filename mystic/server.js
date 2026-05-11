const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4175);
const aiApiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
const aiModels = splitModelList(process.env.OPENAI_MODEL || process.env.AI_MODEL || "deepseek-v3.2");
const aiModel = aiModels[0];
const aiBaseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1");
const aiMaxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || process.env.AI_MAX_OUTPUT_TOKENS || 2600);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/ai-status") {
      sendJson(response, 200, {
        enabled: Boolean(aiApiKey),
        model: aiModel,
        fallbackModels: aiModels.slice(1),
        baseUrl: aiBaseUrl,
        needsBaseUrl: Boolean(aiApiKey) && isLikelyGatewayKey(aiApiKey) && aiBaseUrl === "https://api.openai.com/v1",
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/mystic-analysis") {
      if (!aiApiKey) {
        sendJson(response, 501, {
          error: "AI analysis is not configured. Set OPENAI_API_KEY on the server or in Render environment variables.",
          code: "OPENAI_API_KEY_MISSING",
        });
        return;
      }
      if (isLikelyGatewayKey(aiApiKey) && aiBaseUrl === "https://api.openai.com/v1") {
        sendJson(response, 501, {
          error: "This key looks like a model gateway key, not an OpenAI key. Set OPENAI_BASE_URL to the gateway API address.",
          code: "OPENAI_BASE_URL_MISSING",
        });
        return;
      }
      const payload = JSON.parse(await readBody(request));
      const result = await requestAiMysticAnalysis(sanitizeMysticPayload(payload));
      sendJson(response, 200, {
        ok: true,
        model: result.model,
        generated_at: new Date().toISOString(),
        analysis: result.analysis,
      });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    serveStatic(url.pathname, request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Starsand server running at http://localhost:${port}`);
});

function serveStatic(urlPath, request, response) {
  let requested = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
  if (requested.endsWith("/")) requested = `${requested}index.html`;
  const filePath = path.normalize(path.join(root, requested));
  const relativePath = path.relative(root, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "") || "https://api.openai.com/v1";
}

function splitModelList(value) {
  return String(value || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function isLikelyGatewayKey(value) {
  return /^[a-f0-9]{48,}$/i.test(String(value || ""));
}

function sanitizeMysticPayload(payload) {
  const local = payload.local_result && typeof payload.local_result === "object" ? payload.local_result : {};
  return {
    title: String(payload.title || "星砂原型局").slice(0, 80),
    mode: String(payload.mode || "娱乐向盲选象征沙盘").slice(0, 80),
    local_result: {
      code: String(local.code || "").slice(0, 40),
      name: String(local.name || "").slice(0, 80),
      summary: String(local.summary || "").slice(0, 1200),
      axes: Array.isArray(local.axes)
        ? local.axes.slice(0, 8).map((axis) => ({
            label: String(axis.label || "").slice(0, 40),
            tendency: String(axis.tendency || "").slice(0, 40),
            percent: Number(axis.percent || 0),
          }))
        : [],
    },
    source_breakthrough: toStringArray(payload.source_breakthrough).slice(0, 8).map((item) => item.slice(0, 360)),
    key_relations: Array.isArray(payload.key_relations)
      ? payload.key_relations.slice(0, 12).map((rel) => ({
          text: String(rel.text || "").slice(0, 420),
          a: String(rel.a || "").slice(0, 60),
          b: String(rel.b || "").slice(0, 60),
          level: String(rel.level || "").slice(0, 24),
          weight: Number(rel.weight || 0),
          meaning: String(rel.meaning || "").slice(0, 280),
        }))
      : [],
    action_guide: toStringArray(payload.action_guide).slice(0, 8).map((item) => item.slice(0, 360)),
    items: Array.isArray(payload.items)
      ? payload.items.slice(0, 60).map((item) => ({
          label: String(item.label || "").slice(0, 40),
          revealedEnergy: String(item.revealedEnergy || "").slice(0, 80),
          group: String(item.group || "").slice(0, 40),
          awareness: String(item.awareness || "").slice(0, 160),
          x: Number(item.x || 0),
          y: Number(item.y || 0),
          isProjectionSource: Boolean(item.isProjectionSource),
        }))
      : [],
  };
}

async function requestAiMysticAnalysis(payload) {
  let lastError = null;
  for (const model of aiModels) {
    try {
      const analysis = await requestMysticChatAnalysis(payload, model);
      return { model, analysis };
    } catch (error) {
      lastError = error;
      if (!isModelUnavailable(error)) throw error;
    }
  }
  throw lastError || new Error("No AI model was available");
}

async function requestMysticChatAnalysis(payload, model) {
  let lastError = null;
  for (const formatMode of ["json_schema", "json_object", "plain"]) {
    try {
      return await requestMysticChatAnalysisWithFormat(payload, formatMode, model);
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithSimplerFormat(error)) throw error;
    }
  }
  throw lastError;
}

async function requestMysticChatAnalysisWithFormat(payload, formatMode, model) {
  const body = {
    model,
    max_tokens: aiMaxOutputTokens,
    temperature: 0.68,
    messages: [
      {
        role: "system",
        content: `${mysticSystemPrompt()} 请严格输出 JSON，不要输出 Markdown。`,
      },
      {
        role: "user",
        content: `请读取以下星砂娱乐沙盘资料，并返回符合指定结构的 JSON。\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  };

  if (formatMode === "json_schema") {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "starsand_mystic_analysis",
        strict: true,
        schema: mysticAnalysisSchema(),
      },
    };
  } else if (formatMode === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const apiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await apiResponse.text();
  const data = safeJson(raw);
  if (!apiResponse.ok) {
    const message = data.error?.message || data.message || raw || `AI gateway request failed with HTTP ${apiResponse.status}`;
    const error = new Error(message);
    error.status = apiResponse.status;
    throw error;
  }

  const text = data.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new Error("AI gateway returned an empty response");

  try {
    return normalizeMysticAnalysis(JSON.parse(stripJsonFence(text)), payload);
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}`);
  }
}

function normalizeMysticAnalysis(value, payload = {}) {
  const source = value && typeof value === "object" ? value : {};
  const sourceReading = toStringArray(source.sourceReading || source.source_reading);
  const relationshipReading = toStringArray(source.relationshipReading || source.relationship_reading);
  const actionGuide = toStringArray(source.actionGuide || source.action_guide);
  const ritualSuggestion = toStringArray(source.ritualSuggestion || source.ritual_suggestion);
  const fallbackSourceReading = buildMysticSourceFallback(payload);
  const fallbackRelationships = buildMysticRelationshipFallback(payload);
  const fallbackActions = buildMysticActionFallback(payload);
  return {
    title: String(source.title || "星砂密语"),
    opening: String(source.opening || source.summary || "这组星砂像是在提示：真正的转折不在用力解释，而在看见哪股能量最先牵动全局。"),
    sourceReading: sourceReading.length >= 2 ? sourceReading : fallbackSourceReading,
    relationshipReading: relationshipReading.length >= 2 ? relationshipReading : fallbackRelationships,
    actionGuide: actionGuide.length >= 3 ? actionGuide : fallbackActions,
    ritualSuggestion: ritualSuggestion.length ? ritualSuggestion : ["把最想移动的一枚星砂轻轻挪一厘米，观察自己是否松了一口气。"],
    softWarning: String(source.softWarning || source.soft_warning || "这是一种娱乐性的象征读法，不是诊断、预测或命令。请保留自己的判断。"),
  };
}

function buildMysticSourceFallback(payload) {
  const lines = toStringArray(payload.source_breakthrough).slice(0, 4);
  if (!lines.length) return ["投影源是这盘里最像“开关”的位置。它不一定告诉你全部答案，但会提示你先从哪里松动。"];
  return lines.map((line, index) =>
    index === 0
      ? `破局开关先看这里：${line}。这像是在说，真正的突破不是把所有事同时推开，而是先碰那根最敏感的线。`
      : `辅助线索：${line}。它不必被当成结论，更像一盏偏光灯，照出你现在最容易忽略的入口。`,
  );
}

function buildMysticRelationshipFallback(payload) {
  const relations = Array.isArray(payload.key_relations) ? payload.key_relations.slice(0, 5) : [];
  if (!relations.length) return ["靠得近的能量更像彼此借力或互相牵制；距离远的能量暂时不必强行连线。"];
  return relations.map((rel) => {
    const text = rel.text || [rel.a, rel.b].filter(Boolean).join(" 与 ");
    return `${text} 这组关系更像是盘面里的暗线：如果顺着它走，会看到支持从哪里来，也会看到阻力在哪里变得有形。`;
  });
}

function buildMysticActionFallback(payload) {
  const actions = toStringArray(payload.action_guide).slice(0, 5);
  if (actions.length >= 3) return actions;
  return [
    ...actions,
    "今天只挑一个最小动作验证盘面，不要急着证明整盘都对。",
    "把最靠近投影源的一组关系写成一句问题，明天用一个现实反馈回答它。",
    "如果某个沙具让你想挪开，先不要删掉它，给它补一句主观觉察，再看它到底是在挡路还是在守门。",
  ].slice(0, 5);
}

function mysticSystemPrompt() {
  return [
    "你是“星砂原型局”的娱乐向象征解读者。请用中文输出，语气要有神秘感、穿透感和行动感，但边界要清楚：这是游戏，不是诊断、预测、咨询结论或命运裁决。",
    "你会收到盲选沙盘的揭示结果：投影源破局、关键关系、行动指南、空间位置、沙具背后的能量映射，以及用户对沙具的主观觉察。请把这些材料翻译成“可玩、可感、可行动”的读法。",
    "重点使用三条线索：1. 投影源代表破局开关，靠近投影源的能量优先分析；2. 关键关系代表真实能量之间的牵引、支撑或卡点；3. 行动指南要具体，让用户知道接下来可以做什么。",
    "输出要详细，但不要说得太绝对、太透、太像定命。要像一面带雾的镜子：可以放开讲象征、趋势、暗线和突破点，但每个判断都要留下选择空间。",
    "sourceReading 至少 3 条，每条 60 到 140 字；relationshipReading 至少 3 条，每条要点名关系中的能量；actionGuide 至少 4 条，每条必须是可执行的小动作；ritualSuggestion 1 到 3 条即可。",
    "不要提 MBTI，不要要求用户长篇陈述，不要做医学或心理疾病判断。可以使用“像是、也许、这盘更像在提示、可以先试试”这类游戏化措辞。",
    "行动建议要落地：给出 3 到 5 条可以在一周内尝试的小动作。不要给违法、危险、操控他人或极端建议。",
  ].join("\n");
}

function mysticAnalysisSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "opening", "sourceReading", "relationshipReading", "actionGuide", "ritualSuggestion", "softWarning"],
    properties: {
      title: { type: "string" },
      opening: { type: "string" },
      sourceReading: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      relationshipReading: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      actionGuide: { type: "array", minItems: 4, maxItems: 6, items: { type: "string" } },
      ritualSuggestion: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } },
      softWarning: { type: "string" },
    },
  };
}

function shouldRetryWithSimplerFormat(error) {
  const message = String(error.message || "").toLowerCase();
  return (
    error.status === 400 ||
    error.status === 422 ||
    message.includes("response_format") ||
    message.includes("json_schema") ||
    message.includes("not valid json") ||
    message.includes("unsupported") ||
    message.includes("invalid parameter")
  );
}

function isModelUnavailable(error) {
  const message = String(error.message || "").toLowerCase();
  return error.status === 422 && (message.includes("模型已下线") || message.includes("model") || message.includes("offline"));
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function stripJsonFence(value) {
  return String(value)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map(stringifyItem).filter(Boolean);
  if (value && typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}：${stringifyItem(item)}`);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function stringifyItem(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
