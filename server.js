const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataDir = process.env.DATA_DIR || process.env.RENDER_DISK_MOUNT_PATH || path.join(root, "data");
const sessionsFile = path.join(dataDir, "sessions.jsonl");
const port = Number(process.env.PORT || 4175);
const adminKey = process.env.ADMIN_KEY || "";

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
    notes: String(payload.notes || "").slice(0, 3000),
    scene: Array.isArray(payload.scene) ? payload.scene.slice(0, 200) : [],
    analysis: payload.analysis && typeof payload.analysis === "object" ? payload.analysis : {},
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
