/* ── State ─────────────────────────────────────────────────────── */
let currentIdea = "";
let thumbGenId = 0; // incrementing counter to guard stale callbacks
let abortController = null;

/* ── DOM refs ──────────────────────────────────────────────────── */
const ideaInput = document.getElementById("idea-input");
const generateBtn = document.getElementById("generate-btn");
const btnText = generateBtn.querySelector(".btn-text");
const spinner = generateBtn.querySelector(".spinner");
const errorMsg = document.getElementById("error-msg");
const results = document.getElementById("results");
const titleGrid = document.getElementById("title-grid");
const modal = document.getElementById("thumb-modal");
const thumbClose = document.getElementById("thumb-close");
const thumbImg = document.getElementById("thumb-img");
const thumbSpinner = document.getElementById("thumb-spinner");
const thumbTitleDisplay = document.getElementById("thumb-title-display");

/* ── Helpers ───────────────────────────────────────────────────── */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

function setLoading(loading) {
  generateBtn.disabled = loading;
  btnText.classList.toggle("hidden", loading);
  spinner.classList.toggle("hidden", !loading);
}

/* ── Generate titles ───────────────────────────────────────────── */
async function generateTitles() {
  hideError();
  const idea = ideaInput.value.trim();
  if (!idea) {
    showError("Please enter a video idea first.");
    return;
  }

  currentIdea = idea;
  setLoading(true);
  results.classList.add("hidden");

  try {
    const resp = await fetch("/api/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || `Server error (${resp.status})`);
    }

    renderTitles(data.titles);
    results.classList.remove("hidden");
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

/* ── Render title cards ────────────────────────────────────────── */
function renderTitles(titles) {
  titleGrid.innerHTML = "";

  titles.forEach((t) => {
    const card = document.createElement("div");
    card.className = `title-card rank-${t.rank}`;

    card.innerHTML = `
      <div class="rank-badge">${t.rank}</div>
      <div class="card-body">
        <div class="title-text">${escapeHtml(t.title)}</div>
        <div class="explanation">${escapeHtml(t.explanation)}</div>
      </div>
      <div class="card-score">
        <div class="score-value">${t.score}</div>
        <div class="score-label">score</div>
        <div class="score-bar">
          <div class="score-fill" style="width: ${t.score}%"></div>
        </div>
        <button class="btn small" data-title="${escapeHtml(t.title)}">
          🖼️ Thumbnail
        </button>
      </div>
    `;

    card.querySelector(".btn.small").addEventListener("click", () => {
      generateThumbnail(t.title);
    });

    titleGrid.appendChild(card);
  });
}

/* ── Generate thumbnail ────────────────────────────────────────── */
async function generateThumbnail(title) {
  // Cancel any in-flight thumbnail generation
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  const genId = ++thumbGenId;

  // Clean up old image and handlers
  thumbImg.onload = null;
  thumbImg.onerror = null;
  thumbImg.src = "";
  thumbImg.classList.add("hidden");
  thumbSpinner.classList.remove("hidden");
  hideError();

  thumbTitleDisplay.textContent = title;
  modal.classList.remove("hidden");

  try {
    const resp = await fetch("/api/thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, idea: currentIdea }),
      signal: abortController.signal,
    });

    // If modal was closed while fetching, ignore the response
    if (genId !== thumbGenId) return;

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || "Thumbnail generation failed");
    }

    // If modal was closed while parsing, ignore
    if (genId !== thumbGenId) return;

    thumbImg.src = data.url;
    thumbImg.onload = () => {
      if (genId !== thumbGenId) return;
      thumbSpinner.classList.add("hidden");
      thumbImg.classList.remove("hidden");
    };
    thumbImg.onerror = () => {
      if (genId !== thumbGenId) return;
      thumbSpinner.classList.add("hidden");
      showError("Failed to load generated thumbnail image.");
    };
  } catch (err) {
    // Don't show errors for aborted requests
    if (err.name === "AbortError") return;
    if (genId !== thumbGenId) return;
    thumbSpinner.classList.add("hidden");
    showError(err.message);
  }
}

/* ── Modal controls ────────────────────────────────────────────── */
function closeModal() {
  modal.classList.add("hidden");

  // Cancel in-flight fetch
  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  // Bump the generation counter so any pending callbacks are ignored
  thumbGenId++;

  // Detach image handlers BEFORE clearing src to prevent onerror firing
  thumbImg.onload = null;
  thumbImg.onerror = null;
  thumbImg.src = "";
  thumbImg.classList.add("hidden");
  thumbSpinner.classList.add("hidden");
  hideError();
}

thumbClose.addEventListener("click", closeModal);
modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ── Event listeners ───────────────────────────────────────────── */
generateBtn.addEventListener("click", generateTitles);

ideaInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    generateTitles();
  }
});

/* ── Utility ───────────────────────────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ── Init ──────────────────────────────────────────────────────── */
(async function init() {
  try {
    const resp = await fetch("/api/health");
    const data = await resp.json();
    if (!data.gemini) {
      showError(
        "GEMINI_API_KEY is not configured. " +
        "Add it to your ~/.env file: GEMINI_API_KEY=your_key_here"
      );
    }
  } catch {
    showError("Could not reach the server. Is it running?");
  }
})();