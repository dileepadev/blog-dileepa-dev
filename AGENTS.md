# AGENTS.md

Canonical instructions for AI coding agents working in this repository.

> This file is the **single source of truth**. `CLAUDE.md` and
> `.github/copilot-instructions.md` intentionally contain only tool-specific notes and point
> back here. Add shared rules **here only** — duplicating them causes drift and contradictory
> guidance.

## What this is

`blog-dileepa-dev` is a **content-source repository**: 18 Markdown posts, a front-matter
contract, and a script that indexes them into the API. It is not an application. There is no
build, no dependency tree, and nothing deployed from here.

The posts are rendered by [`dileepa-dev`](https://github.com/dileepadev/dileepa-dev), which reads
them straight from Git at build time and serves them at `dileepa.dev/blog/{slug}`.

Until v2.0.0 this was a standalone Astro site at `blog.dileepa.dev`. **That site is gone** — the
application was deleted and the host retired rather than redirected, because the links pointing
at it were updated at the source. `v2.0.0` is the final release tag; it exists to archive the
last Astro build in history.

`main` is the source of truth for content, and publishing a post is a commit — not a release.

[TODO.md](TODO.md) holds this repo's slice. Issue **#3** holds the full scope. The
cross-repository roadmap lives in `dileepadev/TODO.md`.

## Layout

| Path | What it is |
| --- | --- |
| `content/posts/<year>/<month>/` | 18 `.md` posts, named `YYYY-MM-DD-slug.md`. **The file name is the slug** |
| `schema/frontmatter.md` | The front-matter contract |
| `scripts/sync-blogs.mjs` | Metadata sync to `POST /blogs/sync`. Dependency-free and idempotent |
| `.github/workflows/sync.yml` | Runs the sync on content changes to `main` |
| `public/` | **Astro-era leftovers.** A favicon and brand images nothing reads; due for deletion |

The year and month directories are grouping only; they are stripped when the id becomes a slug.

> [!NOTE]
> **Do not reintroduce a build system.** No `package.json`, no bundler, no framework. If
> something here needs a dependency, question the something. The sync script imports only
> `node:` built-ins and should stay that way.

## Front matter

| Field | Type | Required |
| --- | --- | --- |
| `title` | string | yes |
| `description` | string | yes |
| `publishedDate` | date (ISO `YYYY-MM-DD`) | yes |
| `updatedDate` | date | no |
| `tags` | string[] | defaults to `[]` |
| `draft` | boolean | defaults to `false` |
| `series` | string | no |
| `seriesOrder` | number | no |

**Field names are load-bearing.** The main site and the API both key off them. Renaming one
breaks rendering in one repo and data in another. The full contract, with the file layout and the
reasoning, is in [`schema/frontmatter.md`](schema/frontmatter.md).

**There is no `banner`.** Posts carry no image of their own; anything a post shows is an ordinary
Markdown image in the body pointing at a URL. The API keeps a `banner` field on its model — the
shape is unchanged — and it is deliberately never written.

Validation now happens in the **consumer**, not here. `src/content.config.ts` used to enforce
this contract at Astro build time and went with the app; a CI check to replace it is the open
item in [TODO.md](TODO.md).

## Toolchain

None. Node 22+ if you want to run the sync script by hand:

```bash
API_BASE_URL=http://localhost:8000 node scripts/sync-blogs.mjs --dry-run
```

There is nothing to install.

## Writing a post

- `content/posts/<year>/<month>/YYYY-MM-DD-slug.md`. **The file name is the URL**; the year and
  month directories are grouping only.
- Front matter per the table above; `publishedDate` as an ISO date string.
- **No banner.** Embed an image with ordinary Markdown, pointing at a Cloudinary URL.
- Plain Markdown, not MDX. If a post needs a component, the renderer is missing a feature — add
  it to `dileepa-dev` rather than writing JSX into prose.
- Voice follows the brand guide §4 — plain, specific, unhurried. Explain rather than announce.
  Banned without exception: *passionate about, leveraging, cutting-edge, revolutionize,
  game-changing, unlock, seamless, AI enthusiast, thought leader, journey, humbled to announce,
  10x.*
- Sentence case in titles and headings.

## Coding standards

There is barely any code here, and it should stay that way. What exists:

- `scripts/sync-blogs.mjs` — keep it dependency-free and idempotent.
- Front-matter validation in CI, once written — a small script, so a malformed post fails here
  rather than breaking the main site's build.

## Testing

- Front-matter validation is the only check, and it must cover all 18 posts.
- Rendering is verified in `dileepa-dev`, not here. There is nothing to render in this repo.

## Docs

- `README.md` is a content workflow guide. It does not describe a website.
- `CHANGELOG.md` is **frozen at 2.0.0**. It logs the life of the application, not the posts —
  Git history is the log of posts.
- `VERSIONING.md` is a content policy: no application releases for content changes.
- `BRANCH_NAMING_GUIDELINES.md` and `PULL_REQUEST_GUIDELINES.md` should be trimmed to what a
  content workflow actually needs.

## Git workflow

- Branches: [BRANCH_NAMING_GUIDELINES.md](BRANCH_NAMING_GUIDELINES.md). `main` is protected.
  Content work is `docs/x`.
- Commits: [COMMIT_MESSAGE_GUIDELINES.md](COMMIT_MESSAGE_GUIDELINES.md) — if the work traces to
  a GitHub issue, reference it (`fixes #12`, `refs #12`); don't invent an issue number if none
  was given. v2.0.0 work traces to `refs #3`.
- PRs: [PULL_REQUEST_GUIDELINES.md](PULL_REQUEST_GUIDELINES.md)
- **No release tags for content.** `main` is the source of truth.

## Secrets

- Two repository secrets drive the sync pipeline: `API_BASE_URL` and `BLOG_SYNC_API_KEY`.
- `BLOG_SYNC_API_KEY` must match the API's value. It is a write credential — never echo it in a
  workflow log, never commit it.
- This repository holds **no Cloudinary credentials**. Image uploads go through the API's
  `POST /uploads`.

## Gotchas

- **Never change a slug.** All 18 filenames are published URLs at `dileepa.dev/blog/{slug}`.
  Renaming one breaks a live link and there is no way to notice from inside this repo. If a
  title has to change, change `title` and leave the file name alone.
- **Two slug redirects now live in `dileepa-dev`**, and neither can be served from here:
  `2026-08-06-zero-to-agent-microsoft-foundry-series-kickoff` →
  `2026-08-06-part-1-kicking-off-the-series` (used to sit in the deleted `astro.config.mjs`), and
  `2026-02-11-welcome` → `2026-02-10-welcome`. Do not try to reimplement them here.
- **A rename already slipped through once.** The v2.0.0 content move renamed
  `2026-02-11-welcome` to `2026-02-10-welcome` and nothing noticed until the sync script's output
  was read against the published URL list. That is the whole hazard in one example: the rename
  looked like a date correction and cost a permanent redirect rule. **Renaming a published file
  is never a local change.**
- **The repository holds no image a post depends on.** Every image in every post is an absolute
  Cloudinary URL. Keep it that way: upload through `POST /uploads` and paste the URL back. The
  three screenshots that used to live in `public/` are the reason this rule is stated twice —
  they were root-relative, the Astro app served them, and deleting that app broke them until they
  were moved.
- **The main site pins a ref.** `dileepa-dev` fetches post bodies from a tag or commit SHA, never
  `main`. Committing a post does not publish it — the pinned ref in `dileepa-dev` has to be
  bumped too.
- **The API stores metadata only.** If post bodies start appearing in the database, the source of
  truth has quietly moved and something is wrong.
