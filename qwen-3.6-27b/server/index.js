import express from "express";
import cors from "cors";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

const THUMBNAILS_DIR = join(__dirname, "thumbnails");
mkdirSync(THUMBNAILS_DIR, { recursive: true });

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use("/thumbnails", express.static(THUMBNAILS_DIR));

// --- Helpers ---

/**
 * Parse codex exec stdout. The model's answer sits between the last "codex"
 * marker line and the "tokens used" line.
 */
function parseCodexOutput(raw) {
  const lines = raw.split("\n");
  const codexIdx = lines.lastIndexOf("codex");
  if (codexIdx === -1) return raw.trim();

  let endIdx = lines.length;
  for (let i = codexIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === "tokens used") {
      endIdx = i;
      break;
    }
  }

  return lines.slice(codexIdx + 1, endIdx).join("\n").trim();
}

/**
 * Run codex exec as a child process. Returns a promise with the parsed output.
 * Streams stderr to console so long-running calls don't buffer into OOM.
 */
function runCodex(args, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const allArgs = ["exec", "--sandbox", ...args];
    const child = spawn("codex", allArgs, {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"], // ignore stdin so codex doesn't block waiting for input
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0 || code === null) {
        resolve(parseCodexOutput(stdout));
      } else {
        reject(new Error(`codex exited with code ${code}. stderr: ${stderr.slice(-500)}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn codex: ${err.message}`));
    });
  });
}

// --- Health check ---
app.get("/api/health", (_req, res) => {
  try {
    execFileSync("codex", ["--version"], { encoding: "utf8", timeout: 5_000 });
    res.json({ status: "ok", codex: "available" });
  } catch {
    res.status(503).json({
      status: "error",
      codex: "not available",
      message:
        "The `codex` CLI is not installed or not logged in. Install it and run `codex auth login`.",
    });
  }
});

// --- Generate 9 ranked titles ---
app.post("/api/titles", async (req, res) => {
  const { idea } = req.body;
  if (!idea || !idea.trim()) {
    return res.status(400).json({ error: "Video idea is required" });
  }

  const prompt = `You are a YouTube title expert. Given a video idea, generate exactly 9 clickable, high-CTR titles.

Video idea: ${idea}

Output ONLY valid JSON — no markdown, no explanation, no code fences. Format:
[
  { "rank": 1, "title": "...", "score": 95, "reason": "one-line reason" },
  { "rank": 2, "title": "...", "score": 88, "reason": "one-line reason" },
  ...9 total...
]

Rules:
- rank 1 = best title
- score is 0-100 based on clickability, curiosity, and relevance
- titles should be under 70 characters
- vary the style: some curiosity-gap, some how-to, some listicle, some provocative
- reason should be one short sentence
- output MUST be parseable JSON, nothing else`;

  try {
    const raw = await runCodex([
      "read-only",
      "--skip-git-repo-check",
      "-C",
      ".",
      prompt,
    ], 300_000);

    // Strip any markdown code fences
    let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    // Find JSON array in the output
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response. Raw: " + cleaned.slice(0, 300));
    }

    const titles = JSON.parse(jsonMatch[0]);
    res.json({ titles });
  } catch (err) {
    console.error("Title generation failed:", err.message);
    res.status(500).json({
      error: "Title generation failed",
      detail: err.message,
    });
  }
});

// --- Generate thumbnail ---
app.post("/api/thumbnail", async (req, res) => {
  const { title, idea, index } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const filename = `thumb-${Date.now()}-${index || 0}.png`;
  const outPath = join(THUMBNAILS_DIR, filename);

  const imagePrompt = `A YouTube thumbnail for a video titled "${title}"${idea ? ` about: ${idea}` : ""}. Bold, high-contrast, eye-catching design. Large readable text overlay with the title. Vibrant colors, dramatic lighting, professional YouTube thumbnail style. 16:9 aspect ratio.`;

  try {
    await runCodex(
      [
        "workspace-write",
        "--skip-git-repo-check",
        "-C",
        THUMBNAILS_DIR,
        `$imagegen ${imagePrompt}; save it to ${filename}`,
      ],
      600_000
    );

    if (!existsSync(outPath)) {
      throw new Error("Image file was not created by codex");
    }

    res.json({
      url: `/thumbnails/${filename}`,
      filename,
    });
  } catch (err) {
    console.error("Thumbnail generation failed:", err.message);
    res.json({
      url: null,
      filename: null,
      error: "Thumbnail generation failed. Showing placeholder.",
      detail: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
