import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";
const DATA_DIR = join(__dirname, "data");
const FAVOURITES_FILE = join(DATA_DIR, "favourites.json");

function isRecordOfStrings(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

async function ensureFavouritesStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(FAVOURITES_FILE, "utf8");
  } catch {
    await writeFile(FAVOURITES_FILE, "{}", "utf8");
  }
}

async function getFavourites() {
  const raw = await readFile(FAVOURITES_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (isRecordOfStrings(parsed)) return parsed;

  // Backward-compatible read for old array formats:
  // 1) ["breedA", "urlA", "breedB", "urlB"]
  // 2) ["urlA", "urlB"] (stored as {"unknown-1":"urlA", ...})
  if (Array.isArray(parsed)) {
    const mapped = {};
    const looksLikePairs = parsed.every((item) => typeof item === "string") && parsed.length % 2 === 0;

    if (looksLikePairs) {
      for (let index = 0; index < parsed.length; index += 2) {
        const breed = parsed[index];
        const imageUrl = parsed[index + 1];
        if (typeof breed === "string" && typeof imageUrl === "string") {
          mapped[breed] = imageUrl;
        }
      }
      return mapped;
    }

    let counter = 1;
    for (const item of parsed) {
      if (typeof item === "string" && item) {
        mapped[`unknown-${counter}`] = item;
        counter += 1;
      }
    }
    return mapped;
  }

  return {};
}

async function saveFavourites(favourites) {
  await writeFile(FAVOURITES_FILE, JSON.stringify(favourites, null, 2), "utf8");
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendNotFound(res) {
  sendJson(res, 404, { error: "Not Found" });
}

function sendServerError(res, error) {
  const message = error instanceof Error ? error.message : "Internal Server Error";
  sendJson(res, 500, { error: message });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

async function handleRequest(req, res) {
  const pathname = new URL(req.url ?? "/", `http://${req.headers.host}`).pathname;
  const method = req.method ?? "GET";

  if (method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "GET" && pathname === "/api/favourites") {
    const favourites = await getFavourites();
    sendJson(res, 200, favourites);
    return;
  }

  if (method === "POST" && pathname === "/api/favourites") {
    const payload = await parseJsonBody(req);
    const breed = typeof payload.breed === "string" ? payload.breed : "";
    const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl : "";

    if (!breed || !imageUrl) {
      sendJson(res, 400, { error: "'breed' and 'imageUrl' are required." });
      return;
    }

    const favourites = await getFavourites();
    favourites[breed] = imageUrl;
    await saveFavourites(favourites);

    sendJson(res, 201, { breed, imageUrl });
    return;
  }

  if (method === "DELETE" && pathname === "/api/favourites") {
    const payload = await parseJsonBody(req);
    const breed = typeof payload.breed === "string" ? payload.breed : "";
    const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl : "";

    if (!breed && !imageUrl) {
      sendJson(res, 400, { error: "'breed' or 'imageUrl' is required." });
      return;
    }

    const favourites = await getFavourites();

    if (breed) {
      delete favourites[breed];
    } else {
      for (const [favouriteBreed, favouriteUrl] of Object.entries(favourites)) {
        if (favouriteUrl === imageUrl) {
          delete favourites[favouriteBreed];
        }
      }
    }

    await saveFavourites(favourites);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendNotFound(res);
}

await ensureFavouritesStore();

const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    sendServerError(res, error);
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on http://${HOST}:${PORT}`);
});
