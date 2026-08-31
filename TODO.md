# TODO — blog-dileepa-dev

> [!IMPORTANT]
> This repository is **content only** — a directory of Markdown, the contract it follows, and two
> dependency-free scripts. It is not an application, and publishing a post is a commit or pull
> request into `main` rather than a release. See [VERSIONING.md](VERSIONING.md).

The v2.0.0 migration that made it so is **complete**; its full scope is in issue
[#3](https://github.com/dileepadev/blog-dileepa-dev/issues/3), and what was done is recorded in
[CHANGELOG.md](CHANGELOG.md) under `v2.0.0`.

**This file is not a backlog of posts.** A planned post is an issue or a draft branch, not a line
here — a list of unwritten titles goes stale faster than it gets written.

## Open

Nothing open. All migration, validation, and synchronization pipelines are complete and active.

## Standing rules, not tasks

Repeated here because each has already cost something once.

- **Never rename a published post's file.** The name is the slug and the slug is a live URL.
- **Every image is an absolute URL.** This repository holds none, and serves nothing.
- **No build system.** No `package.json`, no bundler, no framework. Both scripts import only
  `node:` built-ins; keep it that way.
