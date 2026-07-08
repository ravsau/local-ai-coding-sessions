import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createIdea, getIdea, addTitle, addThumbnail, getAllIdeas } from './db.js';
import { codexText, codexImage } from './codex.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Serve static frontend
app.use(express.static(join(__dirname, '..', 'frontend')));

// ── API routes ───────────────────────────────────────────────────

// POST /api/ideas — submit a draft idea
app.post('/api/ideas', (req, res) => {
  const { draft } = req.body;
  if (!draft || typeof draft !== 'string') {
    return res.status(400).json({ error: 'draft text is required' });
  }
  const idea = createIdea(draft);
  res.status(201).json(idea);
});

// GET /api/ideas — list all ideas
app.get('/api/ideas', (req, res) => {
  res.json(getAllIdeas());
});

// GET /api/ideas/:id — get a single idea
app.get('/api/ideas/:id', (req, res) => {
  const idea = getIdea(Number(req.params.id));
  if (!idea) return res.status(404).json({ error: 'not found' });
  res.json(idea);
});

// POST /api/ideas/:id/generate — generate titles only
app.post('/api/ideas/:id/generate', async (req, res) => {
  const idea = getIdea(Number(req.params.id));
  if (!idea) return res.status(404).json({ error: 'not found' });

  res.status(202).json({ status: 'generating' });

  try {
    const titlePrompt = `You are a YouTube thumbnail and title strategist. Given this video idea:\n\n"""\n${idea.draft}\n"""\n\nGenerate exactly 9 catchy, clickable YouTube titles. Each title should be different in angle — different hooks, different emotional triggers. Return them as a JSON array of objects with keys "title" and "score" (1-100). Output ONLY valid JSON.`;

    const titleRaw = await codexText(titlePrompt, 300);
    let titles;
    try {
      titles = JSON.parse(titleRaw.replace(/^[^[{]*/, '').replace(/[^}\]]*$/, ''));
    } catch {
      const match = titleRaw.match(/\[[\s\S]*\]/);
      if (match) titles = JSON.parse(match[0]);
      else throw new Error('Could not parse title output');
    }

    if (!Array.isArray(titles)) throw new Error('Expected array of titles');

    for (const t of titles.slice(0, 9)) {
      addTitle(idea.id, t.title || t, t.score || 50);
    }

    console.log(`Generated ${Math.min(titles.length, 9)} titles for idea ${idea.id}`);
  } catch (err) {
    console.error('Title generation failed:', err.message);
  }
});

// POST /api/ideas/:id/thumbnail/:titleId — generate 1 thumbnail for a selected title
app.post('/api/ideas/:id/thumbnail/:titleId', async (req, res) => {
  const idea = getIdea(Number(req.params.id));
  if (!idea) return res.status(404).json({ error: 'idea not found' });

  const titleObj = idea.titles.find(t => t.id === Number(req.params.titleId));
  if (!titleObj) return res.status(404).json({ error: 'title not found' });

  const styles = [
    'minimalist, bold text overlay, single striking image',
    'split-screen comparison, before and after',
    'close-up emotional face reaction',
    'infographic style with numbered list',
    'dark moody background with dramatic lighting',
    'bright colorful, playful illustration style',
    'cinematic wide shot with text overlay',
    'vintage/retro aesthetic with bold typography',
    '3-panel collage showing different aspects',
  ];

  // Pick a style based on the title index
  const titleIdx = idea.titles.indexOf(titleObj);
  const style = styles[titleIdx % styles.length];

  const imagePrompt = `A YouTube thumbnail for a video titled: "${titleObj.title}". Style: ${style}. Make it bold, clickable, with compelling visuals and text.`;

  try {
    const imageRel = `generated_images/idea_${idea.id}_${titleObj.id}.png`;
    const imagePath = await codexImage(imagePrompt, imageRel, 480);
    const thumb = addThumbnail(idea.id, titleObj.id, imagePath, imagePrompt, style);

    console.log(`Generated thumbnail ${thumb.id} for title "${titleObj.title}"`);
    res.json(thumb);
  } catch (err) {
    console.error('Thumbnail generation failed:', err.message);
    res.status(500).json({ error: 'thumbnail generation failed', details: err.message });
  }
});

// GET /api/thumbnails/:id/image — serve generated image
app.get('/api/thumbnails/:id/image', (req, res) => {
  const allIdeas = getAllIdeas();
  for (const idea of allIdeas) {
    const thumb = idea.thumbnails.find(t => t.id === Number(req.params.id));
    if (thumb) {
      return res.sendFile(thumb.imagePath);
    }
  }
  res.status(404).json({ error: 'thumbnail not found' });
});

// ── start server ─────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
