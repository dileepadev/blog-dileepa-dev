# blog-dileepa-dev

The blog content behind **[dileepa.dev/blog](https://dileepa.dev/blog)** — a directory of
Markdown posts and the script that indexes them.

This repository holds **words, not a website**. There is no build, no dependencies, and nothing
to deploy. The main site ([`dileepa-dev`](https://github.com/dileepadev/dileepa-dev)) reads these
files straight from Git at build time and renders them.

> [!NOTE]
> Until v2.0.0 this was a standalone Astro site at `blog.dileepa.dev`. That site is retired and
> its posts now live at `dileepa.dev/blog/{slug}` — the same path, a different host.

## 🗂️ Layout

| Path | What it is |
| --- | --- |
| `posts/<year>/<month>/` | The posts, as `.md`. **The file name is the slug.** |
| `schema/frontmatter.md` | The front-matter contract |
| `scripts/sync-blogs.mjs` | Pushes post metadata to the API. No dependencies |
| `.github/workflows/sync.yml` | Runs the sync when content changes on `main` |

The year and month directories are **grouping only**. They were never part of the URL and are
stripped when the file id becomes a slug.

## ✍️ Writing a Post

Create a Markdown file at `posts/<year>/<month>/YYYY-MM-DD-your-slug.md`:

```md
---
title: "My post title"
description: "Short summary for the listing and social cards"
publishedDate: "2026-02-03"
updatedDate: "2026-02-03" # optional
tags: ["AI", "Cloud"]
series: "microsoft-foundry" # optional
seriesOrder: 3 # required if series is set
---

## Content

Write the post here, in plain Markdown.
```

Commit it to `main`. That is the whole publishing process — there is no release to cut.

The full contract is in [`schema/frontmatter.md`](schema/frontmatter.md). Three things worth
knowing before you write one:

- **The file name is the slug, and the slug is the URL.** **Never rename a published file** —
  there is no way to notice the break from inside this repository.
- **There is no banner field.** Posts carry no image of their own. Anything a post shows is an
  ordinary Markdown image in the body pointing at a URL.
- **Posts are `.md`, not `.mdx`.** If a post needs a component, the renderer is missing a
  feature — add it to the main site rather than writing JSX into prose.

## 🖼️ Images

Images live on Cloudinary, not in this repository. Upload one through `POST /uploads` — the
admin's media screen, or the endpoint directly — and paste the URL it returns:

```md
![The Foundry project overview](https://res.cloudinary.com/dileepadev/image/upload/blog/foundry-overview.png)
```

This removes a whole moving part: no image sync step, and no way for a post's images to fall out
of step with its words.

> [!WARNING]
> `public/images/posts/` still holds three screenshots that predate this rule, and the post that
> embeds them points at root-relative paths. Nothing serves those paths any more. They are
> pending upload to Cloudinary — see [TODO.md](TODO.md).

## 🔁 How the Main Site Consumes This

```text
  posts/2026/08/my-post.md
            │
            │  push to main
            ▼
   sync workflow ──▶ POST /blogs/sync ──▶ api-dileepa-dev   (metadata index)
            │
            ▼
   dileepa-dev build
     • post bodies ◀── GitHub API, pinned to a ref
     • post list   ◀── api-dileepa-dev
     → /blog and /blog/{slug} as static pages
```

Three stores, each holding what it is good at: **Git** holds the words, **Cloudinary** holds the
images, **MongoDB** holds the index.

**The API stores metadata only.** The words stay in Git and are read from there. If post bodies
ever start appearing in the database, the source of truth has quietly moved.

**Publishing a post requires a rebuild of the main site.** That is a webhook, and for a blog that
publishes a few times a month it is the right cost.

Full detail:
[`dileepadev/docs/architecture/content-pipeline.md`](https://github.com/dileepadev/dileepadev/blob/main/docs/architecture/content-pipeline.md).

## 🧪 Running the Sync by Hand

The script imports only `node:` built-ins, so there is nothing to install:

```bash
API_BASE_URL=http://localhost:8000 node scripts/sync-blogs.mjs --dry-run
```

Drop `--dry-run` to actually write. The API upserts by slug, so new posts are created and
existing ones updated — running it twice is harmless.

> **Setup:** two GitHub repository secrets:
>
> - `API_BASE_URL` — Base URL of the API (e.g. `https://api.dileepa.dev`)
> - `BLOG_SYNC_API_KEY` — must match the `BLOG_SYNC_API_KEY` in the API's environment

## 🤝 Contributing

Open an issue or a pull request. Follow [CONTRIBUTING.md](CONTRIBUTING.md) and the branch and
commit naming guidelines.

## ⚖️ License

MIT. See [LICENSE](LICENSE).

## 📫 Contact

- Website: <https://dileepa.dev>
- Email: <contact@dileepa.dev>
