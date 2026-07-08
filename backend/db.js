import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'store.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function readStore() {
  if (!existsSync(DB_PATH)) return { ideas: [], nextId: 1 };
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { ideas: [], nextId: 1 };
  }
}

function writeStore(store) {
  writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

export function createIdea(draft) {
  const store = readStore();
  const id = store.nextId++;
  const idea = { id, draft, createdAt: new Date().toISOString(), titles: [], thumbnails: [] };
  store.ideas.push(idea);
  writeStore(store);
  return idea;
}

export function getIdea(id) {
  const store = readStore();
  return store.ideas.find(i => i.id === id) || null;
}

export function addTitle(ideaId, title, score) {
  const store = readStore();
  const idea = store.ideas.find(i => i.id === ideaId);
  if (!idea) return null;
  const titleObj = { id: Date.now(), title, score, createdAt: new Date().toISOString() };
  idea.titles.push(titleObj);
  writeStore(store);
  return titleObj;
}

export function addThumbnail(ideaId, titleId, imagePath, prompt, style) {
  const store = readStore();
  const idea = store.ideas.find(i => i.id === ideaId);
  if (!idea) return null;
  const thumb = { id: Date.now(), titleId, imagePath, prompt, style, createdAt: new Date().toISOString() };
  idea.thumbnails.push(thumb);
  writeStore(store);
  return thumb;
}

export function getAllIdeas() {
  return readStore().ideas;
}
