# Versioning

**This repository no longer carries application versions.**

Up to `2.0.0` it was an Astro website, and it followed
[Semantic Versioning](https://semver.org/) like any other application in the platform. `2.0.0`
is the **final release** — the tag that archives the last build of that site before it was
removed.

What remains is content. Content is not versioned, because a blog post is not a release.

## The policy

- **Publishing a post is a commit to `main`.** Not a tag, not a release, not a `CHANGELOG` entry.
- **No version number.** There is no `package.json` to bump and nothing that consumes a version
  of this repository.
- **`CHANGELOG.md` is frozen at `2.0.0`.** It records the life of the application. It is not a
  log of posts — Git history is that, and it is better at it.
- **Correcting a published post is an ordinary commit.** If the correction is material, set
  `updatedDate` in the front matter so readers can see the post changed.

## The one thing that behaves like a breaking change

**Renaming a published file.** The file name is the slug and the slug is the URL, so a rename
breaks a live link and nothing in this repository will notice.

Never rename a published post. If a title genuinely has to change, change `title` in the front
matter and leave the file name alone.

## How the main site pins content

`dileepa-dev` reads post bodies from this repository at build time **pinned to a ref** — a tag or
a commit SHA, never `main`. An unpinned fetch would make its builds non-reproducible and could
ship an in-progress edit by accident.

So the ref is the versioning that matters here, and it lives in the consumer. Publishing is two
steps: commit the post, then bump the pinned ref in `dileepa-dev`.

See
[`dileepadev/docs/migration/versioning-policy.md`](https://github.com/dileepadev/dileepadev/blob/main/docs/migration/versioning-policy.md)
for how this fits the rest of the platform.

## Questions or Issues?

Open an issue: <https://github.com/dileepadev/blog-dileepa-dev/issues>
