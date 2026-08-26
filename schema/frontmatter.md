# Front matter

The contract every post follows. **Field names are an interface** — `dileepa-dev` renders from
them at build time, and `scripts/sync-blogs.mjs` maps them onto the API's model. Renaming one
breaks rendering in one repository and data in another.

Enforced by [`../scripts/validate-posts.mjs`](../scripts/validate-posts.mjs), which
[`validate.yml`](../.github/workflows/validate.yml) runs on every pull request. A malformed post
fails here, where the author sees it, rather than in the main site's build where it looks like a
site bug. Run it yourself with `node scripts/validate-posts.mjs`.

## Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Sentence case. |
| `description` | string | yes | One or two sentences. Used as the meta description and the list summary. |
| `publishedDate` | ISO date | yes | `YYYY-MM-DD`. |
| `updatedDate` | ISO date | no | Omit unless the post actually changed. |
| `tags` | string[] | defaults to `[]` | Inline array. |
| `draft` | boolean | defaults to `false` | A draft is hidden from the site and from every public API caller. |
| `series` | string | no | The series key, e.g. `microsoft-foundry`. Posts sharing one are linked in order. |
| `seriesOrder` | number | no | The part number. Required if `series` is set. |

## What is not here

- **No `banner`, no `bannerAlt`.** Posts carry no image of their own. Anything a post shows is an
  ordinary Markdown image in the body pointing at an absolute URL. The validator rejects a
  root-relative path: this repository serves nothing, so such a path resolves to nothing.
- **No `slug`.** The file name is the slug. See below.
- **No `readingTime`.** Computed from the body by the sync script, so it cannot go stale.

## File layout

```text
posts/<year>/<month>/<slug>.md
```

The year and month directories are **grouping only** — they were never part of the URL and are
stripped when the id becomes a slug. What determines the URL is the file name:

```text
posts/2026/08/2026-08-21-what-is-microsoft-agent-framework.md
              └─────────────────── slug ───────────────────┘
              → dileepa.dev/blog/2026-08-21-what-is-microsoft-agent-framework
```

**Never rename a published file.** The slug is the URL, and there is no way to notice the break
from inside this repository. The 18 published slugs are listed in
[`dileepadev/docs/architecture/redirects.md`](https://github.com/dileepadev/dileepadev/blob/main/docs/architecture/redirects.md) §3.

## Markdown, not MDX

Posts are `.md`. Eight of them used to import an Astro `SeriesBox` component and call it as JSX,
which is the only thing that made them MDX. The series box is a rendering concern, not prose:
`dileepa-dev` renders it from `series` and `seriesOrder`, and the posts are plain Markdown that
survives any framework change.

The practical rule: if a post needs a component, the renderer is missing a feature. Add it there.

## Example

```yaml
---
title: "Part 3: Building your first agent"
description: "Prompt agents versus hosted agents, and how to talk to one in the playground."
publishedDate: "2026-08-13"
updatedDate: "2026-08-13"
tags: ["Microsoft Foundry", "AI", "Agents"]
series: "microsoft-foundry"
seriesOrder: 3
---
```
