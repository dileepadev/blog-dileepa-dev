---
agent: "agent"
model: GPT-5 mini (copilot)
tools: ["execute", "read", "search"]
description: "Generate a new commit message based on the provided code changes."
---

Your goal is to generate the most appropriate and effective commit message based on the provided code changes.

## Commit Message Format

Follow this format strictly:
`<type>(<scope>): <short message> (<optional issue references>) (<optional PR reference>)`

`<optional longer description>`

### Type (`<type>`)

- `content`: A new blog post.
- `fix`: A correction to a published post, or to a script.
- `docs`: Repository documentation.
- `style`: Prose or formatting changes with no change of meaning.
- `refactor`: Restructuring a script without changing its behavior.
- `chore`: Routine tasks, workflows, or repository configuration.

`feat`, `perf` and `test` belonged to the Astro application and are not used here.

### Scope (`<scope>`)

- Optional but recommended (e.g., `repo`, `content`, `schema`, `scripts`, `workflows`). For a
  change to one post, the post's slug is the better scope.

### Short Message (`<short message>`)

- Use imperative mood (e.g., "Add" not "Added").
- Capitalize first letter.
- No period at the end.
- Keep under 50 characters.

### References

- Issues: `(refs #2)` or `(fixes #2)`.
- PRs: `(#123)` at the end of the header.

## Instructions

- **Check the changes first**: Identify added, modified, or deleted files using `git diff --cached`.
- **Provide the final output as a Zsh-ready command**: You MUST wrap the `git commit` command in a Zsh code block so it can be copied and pasted directly into the terminal.
- **Example output format**:
  ```zsh
  git commit -m "content(agent-framework): Add a post on memory and threads" -m "Detailed description of changes..."
  ```
- **Current references**: only if the work traces to a GitHub issue. Do not invent a number.

## Examples

- `content(agent-framework): Add a post on memory and threads (refs #21)`
- `fix(part-4-picking-the-right-model): Correct the deployment command`
- `chore(workflows): Validate posts on pull requests`

Ensure the commit message is professional, concise, and follows these guidelines exactly.
