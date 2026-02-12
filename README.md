# blog.dileepa.dev 📝

This repository contains the source for my personal dev blog where I write about AI, cloud computing, and software development.

![blog.dileepa.dev screenshot](https://dileepadev.github.io/images/blog-dileepa-dev/preview.png)

## 🔧 Quick Start

### Prerequisites

- Node.js 22.x or later
- npm (or yarn/pnpm)

### Install & Run (Development)

```bash
git clone https://github.com/dileepadev/blog-dileepa-dev.git
cd blog-dileepa-dev
npm install
npm run dev
```

Open <http://localhost:4321> to view the site locally.

### Build & Preview (Production)

```bash
npm run build
npm run preview
```

## 🗂️ Project Structure

Key folders/files:

- `src/content/posts/` - Add blog posts as `.mdx` files (filename becomes the slug)
- `src/pages/blog/[slug].astro` - Post template (renders MDX & generates ToC)
- `src/layouts/Layout.astro` - Site layout and metadata
- `src/components/` - Reusable components (Share, ThemeToggle, etc.)
- `public/images/banners/` - Banner images for posts

## ✍️ Writing a Post

Create a new MDX file in `src/content/posts/` using the pattern `YYYY-MM-DD-your-slug.mdx`.
Include frontmatter at the top of the file. Recommended fields:

```md
title: "My Post Title"
description: "Short summary for listing and social cards"
publishedDate: "2026-02-03"
updatedDate: "2026-02-03" # optional
tags: ["AI", "Cloud"]
banner: "/images/banners/my-banner.png"
bannerAlt: "A short description of the banner image"

## Content

Write content here using MDX...
```

**Note:**

- The `slug` is derived from the file name (without the date and extension).
- `publishedDate` should be an ISO date string (YYYY-MM-DD).

## 🔁 Read Next (Behavior)

The post page now shows a **Read Next** section under each post with two cards:

- **Latest** — the most recent post (excluding the current one)
- **Recommended** — a tag-related post (falls back to a random post if no tag-match exists)

This is done at build-time by scanning `src/content/posts`.

## 🚀 Deployment

- The site is compatible with `GitHub Pages` and other static hosts that support Astro builds.
- For `GitHub Pages` read this official documentation: [Deploy your Astro Site to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)

## 🧪 Testing & Local Tools

- Run `npm run dev` to run the dev server with hot reload.
- `npm run build` produces a static build into `.output`/`dist` depending on Astro config.

## 🤝 Contributing

- Please open issues or submit pull requests.
- Follow the repository's [CONTRIBUTING.md](.github/CONTRIBUTING.md) and use the branch/commit naming guidelines.

## ⚖️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file.

## 📫 Contact

- Website: <https://dileepa.dev>
- Email: <contact@dileepa.dev>
