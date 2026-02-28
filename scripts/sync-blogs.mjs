/**
 * sync-blogs.mjs
 *
 * Reads all MDX blog posts from src/content/posts/, extracts frontmatter,
 * and syncs each post to the API via the POST /blogs/sync endpoint.
 *
 * The API endpoint uses upsert-by-slug, so this script is idempotent —
 * running it multiple times won't create duplicates.
 *
 * Environment variables:
 *   BLOG_SYNC_API_KEY  — API key for the x-api-key header
 *   API_BASE_URL       — Base URL of the API (e.g. https://api.dileepa.dev)
 *   SITE_URL           — Blog site URL (e.g. https://blog.dileepa.dev)
 *
 * Usage:
 *   node scripts/sync-blogs.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.API_BASE_URL;
const BLOG_SYNC_API_KEY = process.env.BLOG_SYNC_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://blog.dileepa.dev";
const POSTS_DIR = join(process.cwd(), "src", "content", "posts");

if (!API_BASE_URL) {
  console.error("❌ Missing API_BASE_URL environment variable");
  process.exit(1);
}

if (!BLOG_SYNC_API_KEY) {
  console.error("❌ Missing BLOG_SYNC_API_KEY environment variable");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from an MDX file.
 * Returns an object with the frontmatter fields.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Parse arrays (tags)
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));
    }

    frontmatter[key] = value;
  }

  return frontmatter;
}

/**
 * Build a blog DTO from frontmatter and filename.
 */
function buildBlogDto(filename, frontmatter, index) {
  const slug = filename.replace(/\.mdx$/, "");

  return {
    slug,
    index,
    title: frontmatter.title,
    date: frontmatter.publishedDate,
    excerpt: frontmatter.description,
    link: `${SITE_URL}/blog/${slug}`,
    bannerUrl: frontmatter.banner
      ? `${SITE_URL}${frontmatter.banner}`
      : "",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("📖 Reading blog posts from:", POSTS_DIR);

  const files = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort(); // Chronological order by filename convention

  if (files.length === 0) {
    console.log("⚠️  No MDX files found. Nothing to sync.");
    return;
  }

  console.log(`📝 Found ${files.length} blog post(s)`);

  // Fetch existing blogs from API to preserve indexes and detect new posts
  let existingBlogs = [];
  try {
    const res = await fetch(`${API_BASE_URL}/blogs`);
    if (res.ok) {
      existingBlogs = await res.json();
    }
  } catch {
    // If fetch fails, start fresh — new posts will get index 1, 2, ...
  }

  const existingBySlug = new Map(
    existingBlogs.map((b) => [b.slug, b])
  );
  let maxIndex = existingBlogs.reduce(
    (max, b) => Math.max(max, b.index || 0),
    0
  );

  console.log(
    `📊 Existing blogs in DB: ${existingBlogs.length} (max index: ${maxIndex})`
  );

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filepath = join(POSTS_DIR, filename);
    const content = readFileSync(filepath, "utf-8");
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter || !frontmatter.title) {
      console.warn(`⚠️  Skipping ${filename} — missing or invalid frontmatter`);
      continue;
    }

    const slug = filename.replace(/\.mdx$/, "");
    const existing = existingBySlug.get(slug);

    // Preserve existing index for known posts, assign next index for new ones
    let index;
    if (existing) {
      index = existing.index;
    } else {
      maxIndex++;
      index = maxIndex;
    }

    const dto = buildBlogDto(filename, frontmatter, index);

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
        const errorBody = await response.text();
        console.error(
          `❌ Failed to sync "${dto.title}" (${response.status}): ${errorBody}`
        );
        failed++;
        continue;
      }

      const result = await response.json();
      console.log(`✅ Synced: "${dto.title}" → ${result._id || "ok"}`);
      synced++;
    } catch (error) {
      console.error(`❌ Network error syncing "${dto.title}":`, error.message);
      failed++;
    }
  }

  console.log(`\n🏁 Sync complete: ${synced} synced, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
