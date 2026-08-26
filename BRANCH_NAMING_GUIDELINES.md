# Branch Naming Guidelines

This repository is **content only**. There is no application to release, so the branching model
is the smallest one that still gets work reviewed.

## `main`

`main` is the canonical branch and the only long-lived one. It holds the published posts, and
`dileepa-dev` reads them from it. Do not commit to it directly — open a pull request.

> [!NOTE]
> **There is no `dev` branch, and no version branches.** Up to `v2.0.0` this was an Astro site
> and it followed the platform's `feat/vX.Y.Z` release model. That ended with the application.
> A blog post is not a release, so it does not get a version branch.

## Working branches

Short-lived, branched from `main`, deleted after the merge.

| Branch Name  | Description                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `content/x`  | A new post, or an edit to an existing one. Replace `x` with the subject.                        |
| `fix/x`      | A correction to a published post — a broken link, a wrong command, a factual error.             |
| `docs/x`     | Repository documentation: the README, the front-matter contract, these guidelines.              |
| `chore/x`    | The scripts, the workflows, or repository configuration.                                        |

## Examples

- `content/agent-framework-memory` — a new post about memory in Agent Framework.
- `content/part-9-cost-control` — the next post in the Foundry series.
- `fix/part-4-broken-model-link` — correct a dead link in a published post.
- `docs/frontmatter-contract` — clarify a field in `schema/frontmatter.md`.
- `chore/validate-workflow` — adjust the validation workflow.

## The one rule that is not about naming

**Never rename a published post's file.** The file name is the slug and the slug is the URL, so a
rename breaks a live link and nothing in this repository will notice. If a title has to change,
change `title` in the front matter and leave the file name alone. See
[VERSIONING.md](VERSIONING.md).
