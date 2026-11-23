// main.ts — make.fun bundle entry for the Neon Snake post-x entry.
// Copies POST.json from the bot directory into the output directory,
// after checking it parses and holds a URL. Node 22, stdlib only.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir: string = process.env.MAKEFUN_BOT_DIR || '/bot';
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const src: string = join(botDir, 'POST.json');
const raw: string = readFileSync(src, 'utf8');

let post: unknown;
try {
  post = JSON.parse(raw);
} catch {
  throw new Error('POST.json is not valid JSON');
}

const url: unknown =
  post !== null && typeof post === 'object'
    ? (post as Record<string, unknown>).url
    : undefined;
if (typeof url !== 'string' || url.length === 0) {
  throw new Error('POST.json must hold a url string');
}
try {
  new URL(url);
} catch {
  throw new Error('POST.json url is not a valid URL');
}

mkdirSync(outDir, { recursive: true });
const dest: string = join(outDir, 'POST.json');
copyFileSync(src, dest);
console.log(`POST.json copied to ${dest}`);
