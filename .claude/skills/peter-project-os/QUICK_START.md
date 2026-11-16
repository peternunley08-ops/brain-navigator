# Peter Project OS — quick start

Keep the entire `peter-project-os` folder together. It includes the original Anti-Slop methods, all 22 visual-treatment recipes, universal workflows, Peter's GitHub project map and optional tested helpers. No third-party repo, background job or agent fleet is installed by this package.

## Claude web or desktop
Enable code execution/file creation if needed. Open **Customize → Skills**, upload `peter-project-os-v1.0.0.zip` using the custom-skill upload option, then enable it. Keep this personalized package in your personal account; it includes your repository map, including the name of a private coursework repo. See [official Claude setup](https://support.claude.com/en/articles/12512180-use-skills-in-claude). UI wording or organization settings may differ.

Connect GitHub separately if you want repository access. A skill cannot grant access or turn a read-only connector into a code runner. With a local export instead, Claude can produce revised files where its tools permit; that does not update GitHub automatically.

Then say:

> Run Peter Project OS on Brain Navigator.

Or attach/open a project and say:

> Run Peter Project OS on this project.

## Claude Code
Extract the ZIP and place the folder at `~/.claude/skills/peter-project-os/` for personal use, or `.claude/skills/peter-project-os/` in a project. Avoid committing this personal profile to a public project unintentionally. Preserve an existing installation before replacement. Open your project and invoke:

```text
/peter-project-os
```

You can add a short target or constraint. [Official Claude Code skills documentation](https://code.claude.com/docs/en/skills) describes location and invocation. Setup guidance checked 2026-11-15; installation/import has not been executed or tested on your Claude account.

## Other agents
Use the host's configured skill import/location and invoke “Run Peter Project OS on this project.” Hosts supporting dollar-prefixed skills can use `$peter-project-os`. If native skills are unavailable, provide SKILL.md plus the supporting files and request the workflow. Keep essential behavior in the package; do not replace global agent rules. The agent adapts to actual tools and permissions.

## Useful short requests
- “Find my swim roster project and run Peter Project OS.”
- “Run Peter Project OS on this report and presentation.”
- “Run Peter Project OS. Audit only.”
- “Run Peter Project OS and open a draft PR.”
- “Fix this error using Peter Project OS.”

The default is to infer the brief, audit broadly, implement selectively and validate. It preserves purpose and useful code; GitHub reuse requires a demonstrated gap and footprint check. Ambiguous projects require a short choice. No detailed prompt is needed.

The skill checks real token usage when exposed by the host and otherwise conserves context without inventing numbers. It does not automatically merge, publish, pay for services, migrate production data or create schedules. Expect an actual artifact/diff, concise changes and honest verification limits. The package is prepared, not automatically installed.
