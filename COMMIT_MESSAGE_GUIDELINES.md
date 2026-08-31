# Commit Message Guidelines

A good commit message should be descriptive and provide context about the changes made. This helps improve code review, debugging, and long-term maintainability.

Table of Contents:

- [Commit Message Guidelines](#commit-message-guidelines)
  - [Commit Message Format](#commit-message-format)
    - [`<type>`](#type)
    - [`<scope>`](#scope)
    - [`<short message>`](#short-message)
    - [`<optional issue references>`](#optional-issue-references)
    - [`<optional PR reference>`](#optional-pr-reference)
    - [`<optional longer description>`](#optional-longer-description)
  - [Issue and PR References](#issue-and-pr-references)
    - [Best Practices](#best-practices)
    - [Examples for Issue and PR References](#examples-for-issue-and-pr-references)
    - [Summary Table for Issue and PR Linking (with Scope)](#summary-table-for-issue-and-pr-linking-with-scope)
  - [✅ Summary Examples with All Fields](#-summary-examples-with-all-fields)

## Commit Message Format

Use the following format for commit messages:

```md
<type>(<scope>): <short message> (<optional issue references>) (<optional PR reference>)

<optional longer description>
```

### `<type>`

The `<type>` field indicates the nature of the changes made in the commit. Use one of the following values:

| Type     | Description                                                   |
|----------|---------------------------------------------------------------|
| content  | A new blog post.                                              |
| fix      | A correction to a published post, or to a script.             |
| docs     | Repository documentation (e.g., README, the contract).        |
| style    | Prose or formatting changes with no change of meaning.        |
| refactor | Restructuring a script without changing its behavior.         |
| chore    | Routine tasks, workflows, or repository configuration.        |

`feat`, `perf` and `test` belonged to the application and are not used here.

### `<scope>`

The `<scope>` is optional, but recommended. It helps clarify which part of the project the commit affects. For example:

| Scope         | Description                                                                                                   |
|---------------|---------------------------------------------------------------------------------------------------------------|
| repo          | Repository-wide configuration or setup                                                                        |
| schema        | The front-matter contract                                                                                     |
| scripts       | `validate-posts.mjs` or `sync-blogs.mjs`                                                                      |
| workflows     | GitHub Actions                                                                                                |
| `<topic>`     | A concise 1–2 word topic or series for a post (`foundry`, `evals`, `certifications`, `agent-framework`, etc.) |

For a `content` or `fix` commit about a post, use a **concise topic or series name** rather than the full file slug. This keeps commit headers under 50–72 characters while retaining clear context in `git log --oneline`:

- `content(certifications): Add 2026 Microsoft AI guide (refs #3)`
- `content(evals): Add agent evaluation testing guide (refs #3)`
- `fix(foundry): Correct project endpoint parameter (refs #3)`

### `<short message>`

A concise summary of what the commit does.

Writing Tips:

- Use the imperative mood (e.g., “Add” not “Added”)
- Capitalize the first letter
- Don’t end with a period
- Keep under 50 characters if possible
- Be specific (e.g., “Add agent tools” > “Update code”)
- Avoid "I", "this commit", or "fix" as vague verbs

### `<optional issue references>`

Optionally link the commit to relevant issues using GitHub keywords such as `fixes`, `closes`, `resolves`, or `refs`. Multiple issues can be referenced by separating them with commas.

### `<optional PR reference>`

Optionally link the commit to a pull request using the format `(#<number>)`. This should be placed at the end of the commit message.

### `<optional longer description>`

An optional detailed description of the changes made in the commit. This can include the reasoning behind the changes, implementation details, or any other relevant information. Separate this section from the header with a blank line.

## Issue and PR References

Use GitHub keywords to link commits to issues, and standard notation for PRs.

### Best Practices

- **Pull Requests**: Use `(#<number>)` at the very end of the header. This is automatically recognized by GitHub.
  - ✅ `(#5)`
  - 🚫 `(pr #5)` or `refs #5` for the PR itself.
- **Issues**: Use standard GitHub keywords (`fixes`, `refs`, `closes`, `resolves`) in parentheses before the PR number.

### Examples for Issue and PR References

**Straightforward PR reference:**

```md
chore(repo): Update repository settings (#5)
```

**Issue + PR:**

```md
fix(scripts): Fix front-matter array parsing (fixes #42) (#102)
```

**Multiple Issues + PR:**

```md
docs(schema): Update front-matter contract documentation (refs #1, #2) (#5)
```

### Summary Table for Issue and PR Linking (with Scope)

| Purpose                | Example Commit Message                                                   | Result                             |
| ---------------------- | -----------------------------------------------------------------------  | ---------------------------------- |
| Close single issue     | `fix(scripts): Resolve validation regex bug (fixes #12) (#100)`          | Closes #12, links PR #100          |
| Reference single issue | `docs(schema): Clarify frontmatter rules (refs #34) (#105)`              | Links issue #34, PR #105           |
| Reference PR Only      | `chore(workflows): Update sync action (#45)`                             | Links PR #45                       |
| Close multiple issues  | `content(evals): Add testing guide (fixes #56, #57) (#200)`              | Closes #56, #57, links PR #200     |
| Mixed References       | `fix(foundry): Handle edge case in config (fixes #12, refs #23) (#150)`  | Closes #12, refs #23, links PR #150|
| Multiple PRs (rare)    | `chore(repo): Sync metadata (#5, #6)`                                    | Links PR #5 and #6                 |

## ✅ Summary Examples with All Fields

```md
content(evals): Add agent evaluation testing guide (refs #3) (#101)

Add a practical guide on testing non-deterministic AI agents in CI using schema assertions, trajectory checks, and model-graded LLM-as-a-judge rubrics.
```

```md
fix(scripts): Fix front-matter inline array parser (fixes #42) (#102)
```

```md
docs(readme): Remove emojis from section headings (refs #3)
```

```md
chore(workflows): Update post validation workflow (#45)
```
