# TODO — blog-dileepa-dev

> [!IMPORTANT]
> This repository is **content only** — a directory of Markdown, the contract it follows, and two
> dependency-free scripts. It is not an application, and publishing a post is a pull request into
> `main` rather than a release. See [VERSIONING.md](VERSIONING.md).

The v2.0.0 migration that made it so is **complete**; its full scope is in issue
[#3](https://github.com/dileepadev/blog-dileepa-dev/issues/3), and what was done is recorded in
[CHANGELOG.md](CHANGELOG.md) under `v2.0.0`. That work is not repeated here.

**This file is not a backlog of posts.** A planned post is an issue or a draft branch, not a line
here — a list of unwritten titles goes stale faster than it gets written.

## Open

Nothing in this repository.

## Outside this repository

Two things the migration depends on that cannot be done from here.

- [ ] **Remove the `blog.dileepa.dev` DNS record**, at the registrar. It no longer points at
      GitHub Pages: HTTPS fails for want of a certificate and HTTP is a registrar forward to an
      older domain. The record is the last trace of the retired host — GitHub Pages itself is
      already disabled for this repository, and the Astro workflow that fed it is deleted.
- [ ] **Bump `BLOG_CONTENT_REF` in `dileepa-dev` after each merge here**, and rebuild. This is the
      publishing step, not a task: the main site pins a commit SHA, so a merged post is live only
      once that ref moves. It is listed because it is the one part of publishing that is easy to
      forget, and forgetting it looks like a broken post rather than an unpublished one.

## Standing rules, not tasks

Repeated here because each has already cost something once.

- **Never rename a published post's file.** The name is the slug and the slug is a live URL.
- **Every image is an absolute URL.** This repository holds none, and serves nothing.
- **No build system.** No `package.json`, no bundler, no framework. Both scripts import only
  `node:` built-ins; keep it that way.
