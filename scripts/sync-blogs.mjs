/**
 * sync-blogs.mjs
 *
 * Reads every post under content/posts/, extracts its front matter, and upserts
 * it into the API through POST /blogs/sync.
 *
 * The API stores metadata only — bodies stay in Git and are read from there by
 * dileepa-dev at build time. See
 * dileepadev/docs/architecture/content-pipeline.md.
 *
 * Three things changed from the v1 script, and each was a real bug:
 *
 * 1. v1 wrote absolute `link` and `bannerUrl` values built from SITE_URL. The
 *    host is moving, so consumers compose the URL now: this sends a relative
 *    `path` and nothing else. SITE_URL is gone.
 * 2. v1 *skipped* any slug that already existed, so an edited post never
 *    updated. The endpoint is an upsert; the skip was never needed. This sends
 *    every post and lets the upsert decide.
 * 3. There is no banner. Posts carry no images of their own — anything a post
 *    shows is an ordinary Markdown image pointing at a URL in the body.
 *
 * `published` is deliberately not sent. Visibility follows `draft`, so the front
 * matter stays the single place an author decides whether a post is live.
 *
 * Environment variables:
 *   BLOG_SYNC_API_KEY  — API key for the x-api-key header (required)
 *   API_BASE_URL       — Base URL of the API, e.g. https://api.dileepa.dev (required)
 *
 * Usage:
 *   node scripts/sync-blogs.mjs
 *   node scripts/sync-blogs.mjs --dry-run
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.API_BASE_URL;
const BLOG_SYNC_API_KEY = process.env.BLOG_SYNC_API_KEY;
const POSTS_DIR = join(process.cwd(), "content", "posts");
const DRY_RUN = process.argv.includes("--dry-run");

if (!API_BASE_URL) {
  console.error("Missing API_BASE_URL environment variable.");
  process.exit(1);
}

if (!BLOG_SYNC_API_KEY && !DRY_RUN) {
  console.error("Missing BLOG_SYNC_API_KEY environment variable.");
  process.exit(1);
}

// Average reading speed, words per minute. Whole minutes only — a post that
// says "7.3 min" is pretending to a precision it does not have.
const WORDS_PER_MINUTE = 220;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Every .md file under content/posts, at any depth. Posts are grouped by year and month. */
function findPosts(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      found.push(...findPosts(full));
    } else if (extname(name) === ".md") {
      found.push(full);
    }
  }
  return found;
}

/**
 * Split a file into its front matter block and its body.
 *
 * The parser below handles the subset this repo actually uses — scalars,
 * booleans, numbers, and inline arrays. It is deliberately not a YAML parser:
 * a dependency here would have to be installed in CI to sync a directory of
 * text files. If the front matter ever needs nested structure, take the
 * dependency rather than growing this.
 */
function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { raw: match[1], body: match[2] };
}

function parseScalar(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatter(raw) {
  const frontmatter = {};
  for (const line of raw.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1 || line.trimStart().startsWith("#")) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      frontmatter[key] = inner
        ? inner.split(",").map((item) => String(parseScalar(item.trim())))
        : [];
      continue;
    }

    frontmatter[key] = parseScalar(value);
  }
  return frontmatter;
}

function readingTimeMinutes(body) {
  // Code blocks are skimmed rather than read, and counting them makes a
  // tutorial claim twice the time it takes.
  const prose = body.replace(/```[\s\S]*?```/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * The body the API's BlogSync model expects.
 *
 * `sourcePath` is the repo path, so a row can be traced back to the file that
 * produced it. `contentHash` is over the whole file, front matter included, so
 * a metadata-only edit still registers as a change.
 */
function buildBlogDto(filepath, frontmatter, body, content, index) {
  const slug = basename(filepath, ".md");
  const publishedDate = toIsoDate(frontmatter.publishedDate);
  if (!publishedDate) return null;

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description ?? "",
    path: `/blog/${slug}`,
    publishedDate,
    updatedDate: toIsoDate(frontmatter.updatedDate),
    tags: frontmatter.tags ?? [],
    series: frontmatter.series
      ? { name: frontmatter.series, order: frontmatter.seriesOrder ?? 0 }
      : null,
    readingTimeMinutes: readingTimeMinutes(body),
    draft: frontmatter.draft === true,
    featured: frontmatter.featured === true,
    order: index,
    sourcePath: relative(process.cwd(), filepath),
    contentHash: createHash("sha256").update(content).digest("hex").slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Reading posts from ${POSTS_DIR}`);
  const files = findPosts(POSTS_DIR);

  if (files.length === 0) {
    console.log("No Markdown files found. Nothing to sync.");
    return;
  }

  console.log(`Found ${files.length} post(s).`);
  if (DRY_RUN) console.log("Dry run — nothing will be sent.\n");

  let synced = 0;
  let failed = 0;

  for (const [index, filepath] of files.entries()) {
    const content = readFileSync(filepath, "utf-8");
    const split = splitFrontmatter(content);

    if (!split) {
      console.warn(`  ! ${relative(process.cwd(), filepath)} has no front matter. Skipped.`);
      failed++;
      continue;
    }

    const frontmatter = parseFrontmatter(split.raw);
    if (!frontmatter.title) {
      console.warn(`  ! ${relative(process.cwd(), filepath)} has no title. Skipped.`);
      failed++;
      continue;
    }

    // Ordering is by position in the chronological file listing, so a
    // re-sync produces the same order rather than appending to whatever the
    // database happened to hold.
    const dto = buildBlogDto(filepath, frontmatter, split.body, content, index + 1);
    if (!dto) {
      console.warn(
        `  ! ${relative(process.cwd(), filepath)}: publishedDate ` +
          `"${frontmatter.publishedDate}" could not be read. Skipped.`,
      );
      failed++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ${dto.slug}  (${dto.readingTimeMinutes} min${dto.draft ? ", draft" : ""})`);
      synced++;
      continue;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/blogs/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": BLOG_SYNC_API_KEY,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        console.error(`  ! ${dto.slug} failed (${response.status}): ${await response.text()}`);
        failed++;
        continue;
      }

      console.log(`  ${dto.slug}`);
      synced++;
    } catch (error) {
      console.error(`  ! ${dto.slug} failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${synced} synced, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
