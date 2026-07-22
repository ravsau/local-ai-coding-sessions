const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const THUMBNAIL_DIR = path.join(__dirname, "thumbnails");

// Ensure thumbnails directory exists
fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/thumbnails", express.static(THUMBNAIL_DIR));

// ── Load Gemini API key from ~/.env ───────────────────────────────
function loadApiKey() {
  // Try environment variable first
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  // Fall back to reading ~/.env
  try {
    const envPath = path.join(require("os").homedir(), ".env");
    const contents = fs.readFileSync(envPath, "utf8");
    const match = contents.match(/^GEMINI_API_KEY=(.+)$/m);
    if (match) {
      return match[1].trim();
    }
  } catch {
    // silent
  }
  return null;
}

const GEMINI_API_KEY = loadApiKey();

// ── Gemini API helpers ────────────────────────────────────────────

/**
 * Call Gemini Flash for text generation (titles).
 * POST https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent
 */
async function geminiText(prompt) {
  const url = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
  );
  url.searchParams.set("key", GEMINI_API_KEY);

  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    timeout: 120_000,
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Gemini API error ${resp.status}: ${body.slice(0, 300)}`);
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

/**
 * Call Gemini 2.5 Flash Image for thumbnail generation.
 * POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
 * The image comes back as base64 inlineData.
 */
async function geminiImage(prompt, outPath) {
  const url = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent"
  );
  url.searchParams.set("key", GEMINI_API_KEY);

  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    timeout: 180_000,
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Gemini Image API error ${resp.status}: ${body.slice(0, 300)}`);
  }

  const data = await resp.json();

  // Find the inlineData part with the image
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  let imagePart = null;
  for (const part of parts) {
    if (part.inlineData || part.inline_data) {
      imagePart = part.inlineData || part.inline_data;
      break;
    }
  }

  if (!imagePart) {
    throw new Error("Gemini Image API returned no image data");
  }

  const { data: base64Data, mimeType } = imagePart;
  if (!base64Data) {
    throw new Error("Gemini Image API returned empty image data");
  }

  // Decode base64 and save to disk
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(outPath, buffer);

  if (!fs.existsSync(outPath)) {
    throw new Error("Failed to write thumbnail to disk");
  }

  return outPath;
}

// ── Routes ───────────────────────────────────────────────────────────

/** GET /api/health — check Gemini API key is configured */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, gemini: !!GEMINI_API_KEY });
});

/**
 * POST /api/titles
 * Body: { idea: string }
 * Returns: { titles: [{ rank, title, score, explanation }] }
 */
app.post("/api/titles", async (req, res) => {
  const { idea } = req.body;
  if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
    return res.status(400).json({ error: "A video idea is required." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error:
        "GEMINI_API_KEY not found. Set it in your ~/.env file or as an environment variable.",
    });
  }

  try {
    const prompt = [
      `You are a YouTube title strategist. Given a video idea, generate exactly 9 titles.`,
      `For each title, assign a score from 0-100 based on clickability, SEO, and hook strength.`,
      `Rank them from best (1) to worst (9).`,
      `Return ONLY a valid JSON array. No markdown, no code fences, no extra text.`,
      ``,
      `Format: [{ "rank": 1, "title": "...", "score": 95, "explanation": "..." }]`,
      ``,
      `Video idea: "${idea.trim()}"`,
    ].join("\n");

    const raw = await geminiText(prompt);

    // Attempt to parse the response as JSON
    let titles;
    try {
      titles = JSON.parse(raw);
    } catch {
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        titles = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse Gemini response as JSON");
      }
    }

    if (!Array.isArray(titles) || titles.length === 0) {
      throw new Error("Gemini did not return a valid array of titles");
    }

    // Ensure each title has the expected fields
    titles = titles.slice(0, 9).map((t, i) => ({
      rank: t.rank || i + 1,
      title: t.title || "Untitled",
      score: typeof t.score === "number" ? t.score : 50,
      explanation: t.explanation || "",
    }));

    res.json({ titles });
  } catch (err) {
    console.error("Title generation error:", err.message);
    res.status(500).json({ error: `Generation failed: ${err.message}` });
  }
});

/**
 * POST /api/thumbnail
 * Body: { title: string, idea: string }
 * Returns: { filename: string, url: string }
 */
app.post("/api/thumbnail", async (req, res) => {
  const { title, idea } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "A title is required." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error:
        "GEMINI_API_KEY not found. Set it in your ~/.env file or as an environment variable.",
    });
  }

  try {
    const hash = crypto.createHash("md5").update(title).digest("hex").slice(0, 8);
    const filename = `thumb_${hash}_${Date.now()}.png`;
    const outPath = path.join(THUMBNAIL_DIR, filename);

    const imagePrompt = [
      `Create a YouTube thumbnail for the video titled: "${title}".`,
      idea ? `The video is about: "${idea}".` : "",
      `Bold text overlay, vibrant colors, high contrast, 1280x720, photorealistic style.`,
      `The thumbnail should be eye-catching and clickable, suitable for YouTube.`,
    ]
      .filter(Boolean)
      .join(" ");

    await geminiImage(imagePrompt, outPath);

    res.json({
      filename,
      url: `/thumbnails/${filename}`,
    });
  } catch (err) {
    console.error("Thumbnail generation error:", err.message);
    res.status(500).json({ error: `Thumbnail generation failed: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🎬 Title & Thumbnail Generator running at http://localhost:${PORT}`);
  console.log(`   Gemini API key: ${GEMINI_API_KEY ? "✓ loaded" : "✗ not found"}`);
});