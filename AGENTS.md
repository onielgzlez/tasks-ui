# Working on this repository

## Code style is part of completion

- Before editing, read the nearest repository instructions, formatter configuration and neighboring code. Follow the conventions for that file type.
- Format every changed TypeScript, JavaScript, CSS, JSON, YAML and Markdown file with Prettier. Do not hand-compress code, concatenate unrelated statements on one line or sacrifice readability to reduce line count.
- Use descriptive names, explicit control-flow blocks and small, readable components and hooks. A formatter does not replace a readability review.
- Respect `.editorconfig`, `.prettierrc.json` and `.prettierignore`. Do not introduce another competing style configuration.
- Do not format generated files, dependency lockfiles or secrets.
- Before finishing, run `pnpm format:check` and `git diff --check`. Run `pnpm check` for code changes; it includes formatting, types, tests and build.
- Review the final diff for readable layout and unintended changes. Keep commits focused; separate repository-wide formatting from behavior changes.
