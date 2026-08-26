# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

> [!IMPORTANT]
> **This changelog is frozen at `2.0.0`.** It records the life of the Astro application that used
> to live here. After `2.0.0` this repository holds content only, and a blog post is not a
> release — publishing is a commit to `main`. See [VERSIONING.md](VERSIONING.md).

## [Unreleased]

Work towards `2.0.0`, in which this repository stops being an application and becomes the content
source for `dileepa.dev/blog`. See [TODO.md](TODO.md).

### Changed - Unreleased

- Posts move from `src/content/posts/` to `posts/<year>/<month>/`, grouped by publication
  month. Outside `src/` on purpose: `dileepa-dev` reads the files straight from Git at build time,
  so the Astro app is one reader of this content rather than its owner. **17 of 18 slugs are
  unchanged** — the file name is the slug and the slug is the URL. The exception is
  `2026-02-11-welcome`, renamed to `2026-02-10-welcome` along with its `publishedDate`; its
  previously published URL no longer resolves.
- Posts become `.md`. The only MDX-only syntax was a `SeriesBox` import in eight posts; the series
  box is a rendering concern and is now rendered from the `series` and `seriesOrder` front matter
  by both readers.
- `scripts/sync-blogs.mjs` targets the FastAPI `/blogs/sync`. It sends a relative `path` instead
  of an absolute `link` — the host is moving and the API composes the canonical URL itself — and
  computes `readingTimeMinutes` from the body, excluding code blocks.
- The sync no longer **skips** a post whose slug already exists. The endpoint is an upsert, so the
  skip meant an edited post never updated its index row.
- The front-matter contract is documented in `schema/frontmatter.md`.

### Removed - Unreleased

- **Banners.** `banner` and `bannerAlt` are gone from the front matter and `public/images/banners/`
  is deleted — 19 files. Posts carry no image of their own; anything a post shows is an ordinary
  Markdown image in the body pointing at a URL. The API keeps a `banner` field on its model, and
  it is deliberately never written.
- `SITE_URL` from the sync script and the workflow.
- **The Astro application.** `src/`, `astro.config.mjs`, `tsconfig.json`, `package.json`,
  `package-lock.json`, and the Astro entries in `.vscode/`. There is no build here any more and
  no dependencies to install — `scripts/sync-blogs.mjs` imports only `node:` built-ins.
- **`.github/workflows/astro.yml`** — the build and GitHub Pages deploy. Replaced by
  `sync.yml`, which runs on content changes rather than chaining off a deploy that no longer
  happens.
- **`blog.dileepa.dev`.** The host is retired rather than redirected: the links that pointed at
  it were updated at the source. Posts live at `dileepa.dev/blog/{slug}` — the same path on a
  different host.

## [v1.1.0] - 2026-03-06

### Added - v1.1.0

- Add published date and updated date
- Change `pubDate` to `publishedDate`
- Show a floating action button for ToC on mobile view
- Custom 404 page
- Add blog sync workflow and script
- Centralize site metadata, content schema, and utilities
- Pin welcome post to the bottom of the list
- Add analytics and monitoring:
  - Microsoft Clarity
  - Google Analytics

### Changed - v1.1.0

- Update layout title
- Update welcome page hero title size
- Fix font sizes across all screen resolutions
- Display 2-3 cards on one row
- Improve UI of search and filter
- Improve UI of blogs page table view
- Remove tags column on blogs page table view

## [v1.0.0] - 2026-02-04

### Added - v1.0.0

- Initial release of the Astro-based blog with core blogging functionality:
  - Set up the Astro project structure and scaffolding
  - Added Tailwind CSS and configured global styles and brand theme
  - Implemented light/dark theme support (respects system preference)
  - Added home, about, and blog listing pages
  - Added blog post support using Markdown/MDX with banner images, header metadata (title, date, tags), and an in-page table of contents
  - Implemented improved date formatting (e.g., January 31, 2026)
  - Added blog search, sorting, and share features
  - Implemented responsive design and basic routing/navigation
  - Configured SEO basics (meta tags, sitemap)
  - Added `README` with setup and usage instructions
  - Deployed the site to production
  - Displayed project version in the footer
  - Stacked welcome page action buttons on mobile (2 rows)
  - Stacked blog search bar and sort dropdown on mobile (2 rows)
  - Added visible labels for search and sort controls
  - Added card and table views on blog listing with a toggle and table interactions
- Focused on simplicity, performance, and maintainability as the baseline for future enhancements
- This release represents the baseline functionality for the blog and is intended as a stable foundation for future features and improvements.

<!-- e.g., -->
<!-- Unreleased -->
<!-- v2.0.0 -->
<!-- v1.1.0 -->
<!-- v1.0.0 -->
<!-- v0.0.1 -->

[Unreleased]: https://github.com/dileepadev/blog-dileepa-dev/branches
[v1.1.0]: https://github.com/dileepadev/blog-dileepa-dev/releases/tag/v1.1.0
[v1.0.0]: https://github.com/dileepadev/blog-dileepa-dev/releases/tag/v1.0.0
