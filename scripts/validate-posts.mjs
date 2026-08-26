/**
 * validate-posts.mjs
 *
 * Checks every post against the contract in schema/frontmatter.md.
 *
 * This replaces `src/content.config.ts`, which enforced the same rules at Astro
 * build time and was deleted with the application. Without it the first reader
 * of a malformed post is `dileepa-dev`'s build, where the failure looks like a
 * site bug rather than a content one. A post should fail here, in the
 * repository the author is working in.
 *
 * Dependency-free by design — `node:` built-ins only, so CI installs nothing.
 * The front-matter parser is the same deliberate subset `sync-blogs.mjs` uses:
 * scalars, booleans, numbers and inline arrays. If a post ever needs nested
 * structure, take a YAML dependency in both scripts rather than growing two
 * half-parsers.
 *
 * Usage:
 *   node scripts/validate-posts.mjs
 *
 * Exits non-zero if any post fails.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const POSTS_DIR = join(process.cwd(), "posts");

/** `YYYY-MM-DD-slug`, and the date has to be the real calendar date. */
const FILENAME = /^(\d{4})-(\d{2})-(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED = ["title", "description", "publishedDate"];
const KNOWN = [
  "title",
  "description",
  "publishedDate",
  "updatedDate",
  "tags",
  "draft",
  "series",
  "seriesOrder",
  "featured",
];

/** Fields the v2.0.0 content move removed. Naming them beats "unknown field". */
const RETIRED = {
  banner: "Posts carry no image of their own — use a Markdown image in the body.",
  bannerAlt: "Posts carry no image of their own — use a Markdown image in the body.",
  pubDate: "Renamed to publishedDate in v1.1.0.",
  link: "The site composes URLs from the slug.",
};

function findPosts(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...findPosts(full));
    else found.push(full);
  }
  return found;
}

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return match ? { raw: match[1], body: match[2] } : null;
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

function isRealDate(value) {
  if (!ISO_DATE.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === String(value)
  );
}

/**
 * One post's problems, as a list of sentences.
 *
 * Every check returns a message rather than throwing, so one run reports every
 * fault in every post instead of the first one.
 */
function checkPost(filepath, content) {
  const problems = [];
  const name = basename(filepath, extname(filepath));

  if (extname(filepath) !== ".md") {
    problems.push(
      `Posts are .md, not ${extname(filepath) || "extensionless"}. ` +
        `If a post needs a component, add it to the renderer in dileepa-dev.`,
    );
    return problems;
  }

  // The file name is the slug and the slug is the URL, so its shape is a
  // contract rather than a convention.
  const filenameMatch = FILENAME.exec(name);
  if (!filenameMatch) {
    problems.push(
      `File name must be YYYY-MM-DD-lowercase-slug.md — the name is the URL.`,
    );
  }

  const split = splitFrontmatter(content);
  if (!split) {
    problems.push("No front-matter block.");
    return problems;
  }

  const frontmatter = parseFrontmatter(split.raw);

  for (const field of REQUIRED) {
    const value = frontmatter[field];
    if (value === undefined || value === "") problems.push(`Missing ${field}.`);
  }

  for (const [field, why] of Object.entries(RETIRED)) {
    if (field in frontmatter) problems.push(`\`${field}\` is retired. ${why}`);
  }

  for (const field of Object.keys(frontmatter)) {
    if (!KNOWN.includes(field) && !(field in RETIRED)) {
      problems.push(
        `Unknown field \`${field}\`. Field names are an interface — the site ` +
          `renders from them and the API keys off them.`,
      );
    }
  }

  for (const field of ["publishedDate", "updatedDate"]) {
    const value = frontmatter[field];
    if (value !== undefined && !isRealDate(value)) {
      problems.push(`${field} must be an ISO date (YYYY-MM-DD), got "${value}".`);
    }
  }

  // A date in the name that disagrees with the front matter puts the post in
  // one place in the URL and another in the listing.
  if (filenameMatch && isRealDate(frontmatter.publishedDate)) {
    const fromName = filenameMatch[0].slice(0, 10);
    if (fromName !== frontmatter.publishedDate) {
      problems.push(
        `File name says ${fromName} but publishedDate is ` +
          `${frontmatter.publishedDate}. Change the date, never the file name — ` +
          `the name is a published URL.`,
      );
    }
    // posts/<year>/<month>/ is grouping, but grouping that disagrees with the
    // post is just a file in the wrong drawer.
    const expected = join("posts", filenameMatch[1], filenameMatch[2]);
    const actual = relative(process.cwd(), filepath).replace(
      `/${basename(filepath)}`,
      "",
    );
    if (actual !== expected) {
      problems.push(`Should live in ${expected}/, not ${actual}/.`);
    }
  }

  if (frontmatter.tags !== undefined && !Array.isArray(frontmatter.tags)) {
    problems.push(`tags must be an inline array, e.g. tags: ["AI", "Cloud"].`);
  }

  if (frontmatter.series !== undefined) {
    if (typeof frontmatter.seriesOrder !== "number") {
      problems.push("seriesOrder is required, and numeric, when series is set.");
    }
  } else if (frontmatter.seriesOrder !== undefined) {
    problems.push("seriesOrder without series.");
  }

  for (const field of ["draft", "featured"]) {
    if (frontmatter[field] !== undefined && typeof frontmatter[field] !== "boolean") {
      problems.push(`${field} must be true or false.`);
    }
  }

  // The repository holds no image a post depends on. A root-relative path was
  // served by the Astro app and resolves to nothing now.
  for (const [, target] of split.body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    if (!/^https?:\/\//.test(target)) {
      problems.push(
        `Image "${target}" is not an absolute URL. Upload it through ` +
          `POST /uploads and paste the URL it returns.`,
      );
    }
  }

  if (!split.body.trim()) problems.push("The post has no body.");

  return problems;
}

function main() {
  let files;
  try {
    files = findPosts(POSTS_DIR);
  } catch {
    console.error(`No posts directory at ${POSTS_DIR}.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("No posts found. This repository is content — that is a fault.");
    process.exit(1);
  }

  let failed = 0;
  const slugs = new Map();

  for (const filepath of files) {
    const shown = relative(process.cwd(), filepath);
    const problems = checkPost(filepath, readFileSync(filepath, "utf-8"));

    // Directories are stripped when the file id becomes a slug, so two posts
    // in different months can still collide on one URL.
    const slug = basename(filepath, extname(filepath));
    const first = slugs.get(slug);
    if (first) problems.push(`Duplicate slug — ${first} already uses it.`);
    else slugs.set(slug, shown);

    if (problems.length === 0) continue;
    failed++;
    console.error(`\n${shown}`);
    for (const problem of problems) console.error(`  - ${problem}`);
  }

  const passed = files.length - failed;
  console.log(
    `\n${passed} of ${files.length} post(s) valid.` +
      (failed ? ` ${failed} failed.` : ""),
  );
  if (failed) process.exit(1);
}

main();
