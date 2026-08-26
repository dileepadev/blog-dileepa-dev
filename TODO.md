# TODO — blog-dileepa-dev

This repository's slice of the v2.0.0 platform migration. Full scope: issue
[#3](https://github.com/dileepadev/blog-dileepa-dev/issues/3). Cross-repository sequencing lives
in [`dileepadev/TODO.md`](https://github.com/dileepadev/dileepadev/blob/main/TODO.md).

> [!IMPORTANT]
> After v2.0.0 this repository is **content only** — a directory of Markdown and the sync script
> that indexes it. It stops being an application, and publishing a post becomes a commit rather
> than a release.

## Content move ✅

- [x] `src/content/posts/` → `posts/<year>/<month>/` — 17 of 18 slugs byte-identical
- [x] **`2026-02-11-welcome` was renamed to `2026-02-10-welcome`** during the move, and its
      `publishedDate` changed with it. Resolved: the corrected date stays, and `dileepa-dev`
      carries a same-site 301 from the old slug. Tracked in `dileepadev/docs/architecture/redirects.md` §2
- [x] `.mdx` → `.md` — the only MDX-only syntax was a `SeriesBox` import in eight posts, and the
      series box is a rendering concern rendered from `series` / `seriesOrder` instead
- [x] Remove `banner` and `bannerAlt` from every post's front matter
- [x] Delete `public/images/banners/` — 19 files. Posts carry no image of their own
- [x] Document the front-matter contract in [`schema/frontmatter.md`](schema/frontmatter.md)
- [x] Audit all 18 post bodies for hard-coded `blog.dileepa.dev` links — none found
- [ ] Front-matter validation in CI, so a malformed post fails here rather than in the main
      site's build

## Images ✅

- [x] **The three inline post images are on Cloudinary.** `2026-02-12-personalize-your-vs-code-ai-with-custom-agents`
      now points at `res.cloudinary.com/dileepadev/...` URLs, and `public/images/posts/` is gone.
      No post references a root-relative path any more — the repository holds no image a post
      depends on, which is what §4 of the content pipeline has said all along
- [ ] Delete the rest of `public/` — `favicon.ico`, `favicon.svg` and `images/brand/` are Astro-era
      leftovers that nothing reads. It is the last directory here that is not words

## Sync pipeline ✅

- [x] Retarget `scripts/sync-blogs.mjs` at the FastAPI `/blogs/sync` — relative `path`, no
      `SITE_URL`, no banner
- [x] Stop skipping posts that already exist — the endpoint is an upsert, so an edited post
      updates instead of being ignored
- [x] Compute `readingTimeMinutes` from the body, excluding code blocks
- [x] Send `sourcePath` and `contentHash`, so a row can be traced back to the file that made it
- [x] Add `--dry-run`
- [x] `.github/workflows/sync.yml` replaces `astro.yml` — triggered by content changes rather
      than chained to a Pages deploy, and installs nothing, because the script imports only
      `node:` built-ins
- [ ] Confirm `API_BASE_URL` and `BLOG_SYNC_API_KEY` still match the API's values after cutover

## Astro app — removed ✅

`blog.dileepa.dev` is retired rather than redirected. The links that pointed at it have been
updated at the source, so there is no redirect layer to stand up and nothing gating the deletion.

- [x] Delete `src/`, `astro.config.mjs`, `tsconfig.json`, `package.json`, `package-lock.json`,
      and the Astro entries in `.vscode/`
- [x] Delete `.github/workflows/astro.yml` — the build and Pages deploy
- [ ] Tag `v2.0.0` to archive the final Astro build in history
- [ ] Disable GitHub Pages for the repository
- [ ] Remove the `blog.dileepa.dev` DNS record
- [ ] Delete the `CNAME` / custom-domain setting if one is configured

## Docs

- [x] `README.md` — content workflow rather than a website description
- [x] `AGENTS.md` — new layout, new front matter, banners removed
- [x] `VERSIONING.md` replaced by a content policy: no application releases for content changes
- [x] `CHANGELOG.md` frozen at `2.0.0` — the freeze note is in place; the tag itself is above
- [ ] Trim `BRANCH_NAMING_GUIDELINES.md` and `PULL_REQUEST_GUIDELINES.md` to a content workflow
