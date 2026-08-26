# Pull Request Guidelines

Every change to this repository — a new post, a correction, a documentation edit — arrives as a
pull request into `main`. There is no release to cut and no version to bump.

## PR Title Format

```md
<type>(<scope>): <message> [#issue_number]
```

- `<type>`: one of

  - `content`: a new post.
  - `fix`: a correction to a published post or to a script.
  - `docs`: repository documentation — README, the front-matter contract, these guidelines.
  - `chore`: scripts, workflows, or repository configuration.

- `<scope>`: what the change is about — the post slug for content and fixes, the file or area
  otherwise.

- `<message>`: a short, clear description, in sentence case.

- `[#issue_number]` (optional): the related GitHub issue, if there is one.

## Examples

- `content(agent-framework): Add a post on memory and threads [#21]`
- `fix(part-4-picking-the-right-model): Correct the deployment command`
- `docs(frontmatter): Document seriesOrder`
- `chore(workflows): Validate posts on pull requests`

## Before you open one

- **Run the validator.** `node scripts/validate-posts.mjs` — the same check CI runs. Nothing to
  install.
- **Check the file name.** `posts/<year>/<month>/YYYY-MM-DD-slug.md`, with the date in the name
  matching `publishedDate`. **The file name is the URL.**
- **Never rename a published post.** A rename breaks a live link and nothing here will notice.
- **Images are absolute URLs.** Upload through `POST /uploads` and paste the URL it returns; this
  repository holds no images.

## What happens after the merge

1. The sync workflow indexes the post's metadata into the API.
2. `dileepa-dev` reads the post body from a **pinned ref**, so the post is live once that ref is
   bumped and the site rebuilt. See [VERSIONING.md](VERSIONING.md).
