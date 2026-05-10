const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataDir = process.env.DATA_DIR || process.env.RENDER_DISK_MOUNT_PATH || path.join(root, "data");
const sessionsFile = path.join(dataDir, "sessions.jsonl");
const port = Number(process.env.PORT || 4175);
const adminKey = process.env.ADMIN_KEY || "";
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const openaiMaxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 2600);

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
      sendJson(response, 200, { enabled: Boolean(openaiApiKey), model: openaiModel });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ai-analysis") {
      if (!openaiApiKey) {
        sendJson(response, 501, {
          error: "AI analysis is not configured. Set OPENAI_API_KEY on the server or in Render environment variables.",
          code: "OPENAI_API_KEY_MISSING",
        });
        return;
      }
      const payload = JSON.parse(await readBody(request));
      const analysis = await requestAiSandplayAnalysis(sanitizeAiPayload(payload));
      sendJson(response, 200, {
        ok: true,
        model: openaiModel,
        generated_at: new Date().toISOString(),
        analysis,
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
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openaiModel,
      max_output_tokens: openaiMaxOutputTokens,
      input: [
        {
          role: "system",
          content:
            "你是受训心理咨询师的沙盘治疗记录助手。请用中文输出。你的任务是根据沙盘结构、来访者叙述和咨询师记录，生成反思性心理假设、可验证证据和需要追问的问题。请给出3到6条心理含义假设、2到8条重要微缩物叙事、5到10个可问来访者的问题。不要诊断，不要声称确定来访者人格、创伤或疾病；所有解释都必须使用“可能、也许、可探索、需要来访者确认”等假设语言。若材料不足，明确说明缺失信息并给出追问。若出现自伤、伤人、急性危机线索，提示立即联系线下专业人员或当地紧急服务。",
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
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}`);
  }
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
