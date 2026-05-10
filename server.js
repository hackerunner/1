const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataDir = process.env.DATA_DIR || process.env.RENDER_DISK_MOUNT_PATH || path.join(root, "data");
const sessionsFile = path.join(dataDir, "sessions.jsonl");
const port = Number(process.env.PORT || 4175);
const adminKey = process.env.ADMIN_KEY || "";
const aiApiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
const aiModels = splitModelList(process.env.OPENAI_MODEL || process.env.AI_MODEL || "deepseek-v3.2");
const aiModel = aiModels[0];
const aiBaseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1");
const aiApiStyle = (process.env.AI_API_STYLE || inferApiStyle(aiBaseUrl, aiModel)).toLowerCase();
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

fs.mkdirSync(dataDir, { recursive: true });

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/sessions") {
      const payload = JSON.parse(await readBody(request));
      const record = sanitizeSession(payload, request);
      fs.appendFileSync(sessionsFile, `${JSON.stringify(record)}\n`, "utf8");
      sendJson(response, 200, { ok: true, savedAt: record.server_received_at });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/ai-status") {
      sendJson(response, 200, {
        enabled: Boolean(aiApiKey),
        model: aiModel,
        fallbackModels: aiModels.slice(1),
        baseUrl: aiBaseUrl,
        apiStyle: aiApiStyle,
        needsBaseUrl: Boolean(aiApiKey) && isLikelyGatewayKey(aiApiKey) && aiBaseUrl === "https://api.openai.com/v1",
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ai-analysis") {
      if (!aiApiKey) {
        sendJson(response, 501, {
          error: "AI analysis is not configured. Set OPENAI_API_KEY on the server or in Render environment variables.",
          code: "OPENAI_API_KEY_MISSING",
        });
        return;
      }
      if (isLikelyGatewayKey(aiApiKey) && aiBaseUrl === "https://api.openai.com/v1") {
        sendJson(response, 501, {
          error: "This key looks like a model gateway key, not an OpenAI key. Set OPENAI_BASE_URL to the gateway API address, for example https://example.com/v1.",
          code: "OPENAI_BASE_URL_MISSING",
        });
        return;
      }
      const payload = JSON.parse(await readBody(request));
      const result = await requestAiSandplayAnalysis(sanitizeAiPayload(payload));
      sendJson(response, 200, {
        ok: true,
        model: result.model,
        generated_at: new Date().toISOString(),
        analysis: result.analysis,
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/count") {
      if (!authorizeAdmin(request, response, url)) return;
      sendJson(response, 200, { count: readSessions().length });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/export.json") {
      if (!authorizeAdmin(request, response, url)) return;
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sandplay-sessions.json"',
      });
      response.end(JSON.stringify(readSessions(), null, 2));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/export.csv") {
      if (!authorizeAdmin(request, response, url)) return;
      response.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sandplay-sessions.csv"',
      });
      response.end(toCsv(readSessions().map(flattenSession)));
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
  console.log(`Sandplay analysis server running at http://localhost:${port}`);
  console.log(`Session store: ${sessionsFile}`);
});

function serveStatic(urlPath, request, response) {
  const requested = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
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

function sanitizeSession(payload, request) {
  const safe = {
    id: String(payload.id || cryptoSafeId()),
    created_at: String(payload.created_at || new Date().toISOString()),
    client_code: String(payload.client_code || "").slice(0, 80),
    title: String(payload.title || "").slice(0, 120),
    aim: String(payload.aim || "").slice(0, 500),
    client_story: String(payload.client_story || "").slice(0, 4000),
    notes: String(payload.notes || "").slice(0, 3000),
    scene: Array.isArray(payload.scene) ? payload.scene.slice(0, 200) : [],
    analysis: payload.analysis && typeof payload.analysis === "object" ? payload.analysis : {},
    ai_analysis: payload.ai_analysis && typeof payload.ai_analysis === "object" ? payload.ai_analysis : {},
    client_user_agent: String(request.headers["user-agent"] || "").slice(0, 300),
    client_ip: normalizeIp(firstHeaderValue(request.headers["x-forwarded-for"]) || request.socket.remoteAddress || ""),
    server_received_at: new Date().toISOString(),
  };
  return safe;
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

function readSessions() {
  if (!fs.existsSync(sessionsFile)) return [];
  return fs
    .readFileSync(sessionsFile, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function authorizeAdmin(request, response, url) {
  if (!adminKey) return true;
  const given = request.headers["x-admin-key"] || url.searchParams.get("key") || "";
  if (given === adminKey) return true;
  sendJson(response, 401, { error: "Unauthorized" });
  return false;
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function flattenSession(record) {
  const scene = Array.isArray(record.scene) ? record.scene : [];
  const analysis = record.analysis || {};
  return {
    id: record.id,
    created_at: record.created_at,
    server_received_at: record.server_received_at,
    client_code: record.client_code,
    title: record.title,
    aim: record.aim,
    item_count: scene.length,
    categories: JSON.stringify(analysis.categoryCounts || {}),
    dominant_zone: analysis.dominantZone || "",
    density: analysis.density || "",
    themes: Array.isArray(analysis.themes) ? analysis.themes.join("; ") : "",
    ai_summary: record.ai_analysis?.summary || "",
    notes: record.notes,
  };
}

function toCsv(rows) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [columns.join(","), ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(","))].join("\n");
}

function firstHeaderValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function normalizeIp(value) {
  return String(value).split(",")[0].trim().replace(/^::ffff:/, "");
}

function cryptoSafeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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

function inferApiStyle(baseUrl, model) {
  if (!baseUrl.includes("api.openai.com")) return "chat";
  if (String(model).includes("deepseek") || String(model).includes("qwen") || String(model).includes("gpt-oss")) return "chat";
  return "responses";
}

function isLikelyGatewayKey(value) {
  return /^[a-f0-9]{48,}$/i.test(String(value || ""));
}

function sanitizeAiPayload(payload) {
  return {
    title: String(payload.title || "").slice(0, 120),
    aim: String(payload.aim || "").slice(0, 500),
    client_story: String(payload.client_story || "").slice(0, 4000),
    notes: String(payload.notes || "").slice(0, 3000),
    scene: Array.isArray(payload.scene)
      ? payload.scene.slice(0, 80).map((item) => ({
          label: String(item.label || "").slice(0, 40),
          category: String(item.category || "").slice(0, 40),
          role: String(item.role || "").slice(0, 40),
          tone: String(item.tone || "").slice(0, 80),
          symbolId: String(item.symbolId || "").slice(0, 40),
          x: Number(item.x || 0),
          y: Number(item.y || 0),
          scale: Number(item.scale || 1),
          rotation: Number(item.rotation || 0),
          addedAt: String(item.addedAt || "").slice(0, 40),
        }))
      : [],
    analysis: payload.analysis && typeof payload.analysis === "object" ? payload.analysis : {},
  };
}

async function requestAiSandplayAnalysis(payload) {
  let lastError = null;
  for (const model of aiModels) {
    try {
      const analysis = aiApiStyle === "responses" ? await requestResponsesAnalysis(payload, model) : await requestChatAnalysis(payload, model);
      return { model, analysis };
    } catch (error) {
      lastError = error;
      if (!isModelUnavailable(error)) throw error;
    }
  }
  throw lastError || new Error("No AI model was available");
}

async function requestResponsesAnalysis(payload, model) {
  const apiResponse = await fetch(`${aiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_output_tokens: aiMaxOutputTokens,
      input: [
        {
          role: "system",
          content: sandplaySystemPrompt(),
        },
        {
          role: "user",
          content: `请分析以下沙盘资料，并严格返回 JSON。\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "sandplay_ai_analysis",
          strict: true,
          schema: aiAnalysisSchema(),
        },
      },
    }),
  });

  const data = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    const message = data.error?.message || `OpenAI request failed with HTTP ${apiResponse.status}`;
    throw new Error(message);
  }

  const text = extractOutputText(data);
  if (!text) {
    const refusal = extractRefusal(data);
    if (refusal) throw new Error(refusal);
    throw new Error("OpenAI returned an empty response");
  }

  try {
    return normalizeAiAnalysis(JSON.parse(text));
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}`);
  }
}

async function requestChatAnalysis(payload, model) {
  let lastError = null;
  for (const formatMode of ["json_schema", "json_object", "plain"]) {
    try {
      return await requestChatAnalysisWithFormat(payload, formatMode, model);
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithSimplerFormat(error)) throw error;
    }
  }
  throw lastError;
}

async function requestChatAnalysisWithFormat(payload, formatMode, model) {
  const body = {
    model,
    max_tokens: aiMaxOutputTokens,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `${sandplaySystemPrompt()} 请严格输出 JSON，不要输出 Markdown。`,
      },
      {
        role: "user",
        content: `请分析以下沙盘资料，并返回符合指定结构的 JSON。\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  };

  if (formatMode === "json_schema") {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "sandplay_ai_analysis",
        strict: true,
        schema: aiAnalysisSchema(),
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
    return normalizeAiAnalysis(JSON.parse(stripJsonFence(text)));
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}`);
  }
}

function normalizeAiAnalysis(value) {
  const source = value && typeof value === "object" ? value : {};
  const hypotheses = toArray(source.psychologicalMeanings || source.psychological_meanings);
  const reflective = toArray(source.reflective_hypotheses || source.reflectiveHypotheses);
  const symbolNarrative = toArray(source.symbolNarrative || source.symbol_narrative);
  const microNarratives = toArray(source.micro_narratives || source.microNarratives);
  const missing = toStringArray(source.missingInformation || source.missing_information);
  const questions = toStringArray(source.questionsForClient || source.questions_for_client);
  const therapistFocus = toStringArray(source.therapistFocus || source.therapist_focus);
  const risk = toStringArray(source.riskAndLimits || source.risk_and_limits || source.crisis_alert);

  const psychologicalMeanings = hypotheses.length
    ? hypotheses.map(normalizeMeaning)
    : reflective.map((item, index) => ({
        theme: `心理含义假设 ${index + 1}`,
        evidence: ["来自模型对沙盘结构、来访者讲述与咨询师记录的综合推断。"],
        possibleMeaning: stringifyItem(item),
        alternativeMeanings: ["这也可能只是物件审美、摆放习惯或当下任务理解的结果，需要来访者确认。"],
        howToVerify: ["请来访者为这一部分命名，并询问它与现实生活中的哪种感受或关系有关。"],
      }));

  const normalizedSymbols = symbolNarrative.length
    ? symbolNarrative.map(normalizeSymbolNarrative)
    : microNarratives.map((item, index) => ({
        symbol: `微叙事 ${index + 1}`,
        observedRole: stringifyItem(item),
        hypothesis: "这是可探索的叙事线索，不是确定结论。",
        question: "这段关系或画面对你来说像什么？",
      }));

  return {
    summary: String(
      source.summary ||
        source.overall_summary ||
        source.overallSummary ||
        source.comprehensive_understanding ||
        psychologicalMeanings[0]?.possibleMeaning ||
        "AI 已生成可探索的沙盘假设，请结合来访者讲述进一步确认。",
    ),
    psychologicalMeanings: psychologicalMeanings.length ? psychologicalMeanings : fallbackMeanings(),
    symbolNarrative: normalizedSymbols.length ? normalizedSymbols : fallbackSymbols(),
    missingInformation: missing.length ? missing : ["来访者对每个重要物件的命名、感受和故事仍需补充。"],
    questionsForClient: questions.length ? questions : fallbackQuestions(),
    therapistFocus: therapistFocus.length ? therapistFocus : fallbackTherapistFocus(),
    riskAndLimits: risk.length ? risk : ["当前输出仅为反思性假设，不能替代临床诊断。", "如出现自伤、伤人或急性危机线索，应立即转介线下专业支持或当地紧急服务。"],
    confidence: ["低", "中", "高"].includes(source.confidence) ? source.confidence : "中",
  };
}

function normalizeMeaning(item, index) {
  if (typeof item === "string") {
    return {
      theme: `心理含义假设 ${index + 1}`,
      evidence: ["来自模型综合推断。"],
      possibleMeaning: item,
      alternativeMeanings: ["需要结合来访者叙述确认。"],
      howToVerify: ["向来访者追问这一假设是否贴近其经验。"],
    };
  }
  const object = item && typeof item === "object" ? item : {};
  return {
    theme: String(object.theme || object.title || `心理含义假设 ${index + 1}`),
    evidence: toStringArray(object.evidence).length ? toStringArray(object.evidence) : ["来自沙盘结构和叙事材料。"],
    possibleMeaning: String(object.possibleMeaning || object.possible_meaning || object.meaning || stringifyItem(item)),
    alternativeMeanings: toStringArray(object.alternativeMeanings || object.alternative_meanings).length
      ? toStringArray(object.alternativeMeanings || object.alternative_meanings)
      : ["也可能代表资源、愿望或当下操作选择，需要来访者确认。"],
    howToVerify: toStringArray(object.howToVerify || object.how_to_verify).length
      ? toStringArray(object.howToVerify || object.how_to_verify)
      : ["请来访者讲述这一部分的故事和情绪。"],
  };
}

function normalizeSymbolNarrative(item, index) {
  if (typeof item === "string") {
    return {
      symbol: `重要物件 ${index + 1}`,
      observedRole: item,
      hypothesis: "这是可探索的物件叙事线索。",
      question: "这个物件在你的故事里是谁或是什么？",
    };
  }
  const object = item && typeof item === "object" ? item : {};
  return {
    symbol: String(object.symbol || object.label || `重要物件 ${index + 1}`),
    observedRole: String(object.observedRole || object.observed_role || object.role || stringifyItem(item)),
    hypothesis: String(object.hypothesis || object.meaning || "这是可探索的物件叙事线索。"),
    question: String(object.question || "这个物件在你的故事里是谁或是什么？"),
  };
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map(stringifyItem).filter(Boolean);
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}：${stringifyItem(item)}`);
  }
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function stringifyItem(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function fallbackMeanings() {
  return [
    {
      theme: "材料不足",
      evidence: ["AI 未返回完整心理含义结构。"],
      possibleMeaning: "当前更适合把分析作为访谈提纲，而不是解释结论。",
      alternativeMeanings: ["沙盘可能仍处于建构早期，意义需要由来访者命名。"],
      howToVerify: ["请来访者讲述沙盘标题、核心物件和下一步会发生什么。"],
    },
  ];
}

function fallbackSymbols() {
  return [
    {
      symbol: "整体沙盘",
      observedRole: "作为当前心理场景的整体呈现。",
      hypothesis: "需要结合来访者叙述理解其含义。",
      question: "如果这个沙盘会说一句话，它会说什么？",
    },
  ];
}

function fallbackQuestions() {
  return ["这个沙盘叫什么名字？", "最重要的物件是哪一个？", "哪个部分最想被移动或改变？", "这些物件之间发生了什么？", "这和你现实中的哪个感受或关系有关？"];
}

function fallbackTherapistFocus() {
  return ["优先记录来访者自己的命名和故事。", "区分系统假设与来访者确认过的内容。", "关注情绪强度、沉默、迟疑和移动顺序。"];
}

function sandplaySystemPrompt() {
  return "你是受训心理咨询师的沙盘治疗记录助手。请用中文输出。你的任务是根据沙盘结构、来访者叙述和咨询师记录，生成反思性心理假设、可验证证据和需要追问的问题。请给出3到6条心理含义假设、2到8条重要微缩物叙事、5到10个可问来访者的问题。不要诊断，不要声称确定来访者人格、创伤或疾病；所有解释都必须使用“可能、也许、可探索、需要来访者确认”等假设语言。若材料不足，明确说明缺失信息并给出追问。若出现自伤、伤人、急性危机线索，提示立即联系线下专业人员或当地紧急服务。";
}

function shouldRetryWithSimplerFormat(error) {
  const message = String(error.message || "").toLowerCase();
  return (
    error.status === 400 ||
    error.status === 422 ||
    message.includes("response_format") ||
    message.includes("json_schema") ||
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

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  const chunks = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
      if (typeof content.output_text === "string") chunks.push(content.output_text);
    }
  }
  return chunks.join("").trim();
}

function extractRefusal(data) {
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (typeof content.refusal === "string") return content.refusal;
    }
  }
  return "";
}

function aiAnalysisSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "psychologicalMeanings",
      "symbolNarrative",
      "missingInformation",
      "questionsForClient",
      "therapistFocus",
      "riskAndLimits",
      "confidence",
    ],
    properties: {
      summary: { type: "string" },
      psychologicalMeanings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["theme", "evidence", "possibleMeaning", "alternativeMeanings", "howToVerify"],
          properties: {
            theme: { type: "string" },
            evidence: { type: "array", items: { type: "string" } },
            possibleMeaning: { type: "string" },
            alternativeMeanings: { type: "array", items: { type: "string" } },
            howToVerify: { type: "array", items: { type: "string" } },
          },
        },
      },
      symbolNarrative: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["symbol", "observedRole", "hypothesis", "question"],
          properties: {
            symbol: { type: "string" },
            observedRole: { type: "string" },
            hypothesis: { type: "string" },
            question: { type: "string" },
          },
        },
      },
      missingInformation: { type: "array", items: { type: "string" } },
      questionsForClient: { type: "array", items: { type: "string" } },
      therapistFocus: { type: "array", items: { type: "string" } },
      riskAndLimits: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["低", "中", "高"] },
    },
  };
}
