import { useState, useEffect, useCallback } from "react";

const API = "/api";

function scoreMeta(score) {
  if (score >= 90) return { color: "#34d399", label: "Viral" };
  if (score >= 80) return { color: "#34d399", label: "Strong" };
  if (score >= 70) return { color: "#f5c542", label: "Good" };
  if (score >= 60) return { color: "#fb923c", label: "Okay" };
  return { color: "#f87171", label: "Weak" };
}

function ScoreBadge({ score }) {
  const { color, label } = scoreMeta(score);
  return (
    <div className="score-pill">
      <span className="score-number" style={{ color }}>{score}</span>
      <span className="score-label">{label}</span>
    </div>
  );
}

function ScoreBar({ score }) {
  const { color } = scoreMeta(score);
  return (
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

function TitleCard({ title, idea, index }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/thumbnail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.title, idea, index }),
      });
      const data = await res.json();
      if (data.url) {
        setThumbnailUrl(data.url);
      } else {
        setError(data.error || "Generation failed");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`title-card rank-${title.rank}`}>
      <div className="card-top">
        <div className="rank-badge">
          {title.rank === 1 ? "👑" : `#${title.rank}`}
        </div>
        <div className="card-body">
          <h3 className="card-title">{title.title}</h3>
          {title.reason && <p className="card-reason">{title.reason}</p>}
        </div>
        <ScoreBadge score={title.score} />
      </div>
      <ScoreBar score={title.score} />

      <div className="card-footer">
        <button
          className={`thumb-btn${thumbnailUrl ? " done" : ""}`}
          onClick={handleGenerate}
          disabled={loading || !!thumbnailUrl}
        >
          <span className="btn-icon">
            {loading ? <span className="spinner spinner-dark" /> : thumbnailUrl ? "✓" : "🎨"}
          </span>
          {loading ? "Generating..." : thumbnailUrl ? "Generated" : "Generate Thumbnail"}
        </button>
      </div>

      {thumbnailUrl && (
        <div className="thumbnail-preview">
          <img src={thumbnailUrl} alt={`Thumbnail for "${title.title}"`} />
        </div>
      )}

      {error && <p className="card-error">{error}</p>}
    </div>
  );
}

export default function App() {
  const [idea, setIdea] = useState("");
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codexReady, setCodexReady] = useState(null);

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => setCodexReady(d.status === "ok"))
      .catch(() => setCodexReady(false));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setTitles([]);

    try {
      const res = await fetch(`${API}/titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = await res.json();
      if (data.titles) {
        setTitles(data.titles);
      } else {
        setError(data.error || "Failed to generate titles");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [idea]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo">🎬</span>{" "}
          <span className="title-text">TitleForge</span>
        </h1>
        <p className="tagline">
          Generate ranked video titles & thumbnails — powered by Codex CLI, zero API keys
        </p>
      </header>

      {codexReady === false && (
        <div className="codex-warning">
          ⚠️ <strong>Codex CLI not detected.</strong> Install it and run{" "}
          <code>codex auth login</code> to authenticate.
        </div>
      )}

      <div className="input-section">
        <div className="input-wrapper">
          <textarea
            className="idea-input"
            placeholder="Describe your video idea...&#10;e.g., &quot;A tutorial on building a SaaS app with Next.js and Stripe&quot;"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleGenerate();
            }}
          />
        </div>
        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!idea.trim() || loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> Generating Titles...
            </>
          ) : (
            <>⚡ Generate 9 Titles</>
          )}
        </button>
        <p className="hint">Press <kbd>⌘</kbd> + <kbd>Enter</kbd> to generate</p>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      {titles.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>Ranked by Clickability</h2>
            <span className="count-badge">{titles.length} titles</span>
          </div>
          <div className="titles-grid">
            {titles.map((t, i) => (
              <TitleCard
                key={i}
                title={t}
                idea={idea}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      <footer className="app-footer">
        Built with Codex CLI · No APIs · No API Keys
      </footer>
    </div>
  );
}
