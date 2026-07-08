import { spawnSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const GENERATED_DIR = join(PROJECT_ROOT, 'generated_images');

if (!existsSync(GENERATED_DIR)) mkdirSync(GENERATED_DIR, { recursive: true });

function findCodex() {
  try {
    const out = execSync('which codex 2>/dev/null', { encoding: 'utf-8' });
    return out.trim();
  } catch {
    return null;
  }
}

// ── text generation ──────────────────────────────────────────────

export function codexText(prompt, timeout = 240) {
  const codex = findCodex();
  if (!codex) throw new Error('codex CLI not on PATH');

  const fullPrompt = prompt + '\n\nReply with the requested output only. No preamble, no repo exploration.';
  const proc = spawnSync(codex, [
    'exec',
    '--sandbox', 'read-only',
    '--skip-git-repo-check',
    '-C', PROJECT_ROOT,
    fullPrompt,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeout * 1000,
    encoding: 'utf-8',
  });

  if (proc.error) {
    if (proc.error.code === 'ETIMEDOUT') throw new Error('codex exec timed out');
    throw new Error(`codex exec failed: ${proc.error.message}`);
  }
  if (proc.status !== 0) {
    const tail = (proc.stderr || proc.stdout || '').slice(-500);
    throw new Error(`codex exec returned ${proc.status}: ${tail}`);
  }

  const out = proc.stdout?.trim() || '';
  if (!out) throw new Error('codex exec returned no output');
  return out;
}

// ── image generation ─────────────────────────────────────────────

export function codexImage(prompt, outRel, timeout = 480) {
  const codex = findCodex();
  if (!codex) throw new Error('codex CLI not on PATH');

  const target = resolve(PROJECT_ROOT, outRel);
  const targetDir = dirname(target);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

  const imagePrompt = `$imagegen ${prompt}\nSave the final selected image as ${outRel}.\nAfter saving it, reply with the exact relative path and nothing else.`;

  const started = Date.now();
  const proc = spawnSync(codex, [
    'exec',
    '--sandbox', 'workspace-write',
    '--skip-git-repo-check',
    '-C', PROJECT_ROOT,
    imagePrompt,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeout * 1000,
    encoding: 'utf-8',
  });

  if (proc.error) {
    if (proc.error.code === 'ETIMEDOUT') throw new Error('codex exec image timed out');
    throw new Error(`codex exec failed: ${proc.error.message}`);
  }
  if (proc.status !== 0) {
    const tail = (proc.stderr || proc.stdout || '').slice(-600);
    throw new Error(`codex exec returned ${proc.status}: ${tail}`);
  }

  // Primary check: file exists at target
  if (existsSync(target)) return target;

  // Fallback: check CODEX_HOME/generated_images
  const codexHome = process.env.CODEX_HOME || join(process.env.HOME || '/tmp', '.codex');
  const genDir = join(codexHome, 'generated_images');
  if (existsSync(genDir)) {
    const files = readdirSync(genDir).sort((a, b) => {
      const aTime = statSync(join(genDir, a)).mtimeMs;
      const bTime = statSync(join(genDir, b)).mtimeMs;
      return bTime - aTime;
    });
    if (files.length > 0) {
      const newest = join(genDir, files[0]);
      const ext = newest.match(/\.(png|jpg|jpeg|webp)$/i)?.[0] || '.png';
      const dest = target.endsWith(ext) ? target : target + ext;
      copyFileSync(newest, dest);
      return dest;
    }
  }

  throw new Error('codex ran but no image landed on disk');
}
