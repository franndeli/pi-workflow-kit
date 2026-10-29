# pi-workflow-kit

[![npm version](https://img.shields.io/npm/v/pi-workflow-kit.svg)](https://www.npmjs.com/package/pi-workflow-kit)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/franndeli/pi-workflow-kit)](https://github.com/franndeli/pi-workflow-kit/releases)

Spec-driven workflow for the [pi](https://pi.dev) coding agent: a **spec graph** with `spec_*` tools, a **live TODO plan** shown above the editor, and a set of **workflow skills** (brainstorming, writing specs, shipping a PR, …). Extracted from [ThinkRail](https://github.com/franndeli/thinkrail) so it runs in plain pi — for example inside Orca terminals.

## Install

```sh
pi install npm:pi-workflow-kit
```

Or straight from GitHub:

```sh
pi install git:github.com/franndeli/pi-workflow-kit
```

Requires a recent version of `@earendil-works/pi-coding-agent` (the package's peer dependency).

## What you get

### Spec graph

`spec_create`, `spec_get`, `spec_update`, `spec_delete`, `spec_grep`, `spec_graph` and `spec_validate` operate on the project's frontmatter-tagged Markdown specs (goal-and-requirements, architecture, module `SPEC.md`s, task specs). The `spec-graph` skill teaches the agent the conventions.

A spec is any Markdown file whose frontmatter carries an `id` and a `type`:

```markdown
---
id: auth-module
type: module-design
title: Authentication module
parent: architecture
depends-on: [session-store]
status: active
---

# Authentication module
…
```

### TODO plan

`todo_write`, `todo_add`, `todo_update`, `todo_promote`, `todo_remove`, `todo_list` and `todo_plan_summary`. The agent keeps a grouped plan for the chat and the TUI shows it above the editor with live progress.

- `/todos` hides or shows the widget.
- Plans are stored per session in `~/.pi/agent/todos/`.

### Workflow skills

| Skill | Purpose |
| --- | --- |
| `choosing-a-workflow` | Router — picks the right workflow for new work |
| `brainstorming` | Shape a feature or fix before implementing it |
| `writing-specs` | Quality bar for goal, architecture and module specs |
| `asking-user-questions` | Norms for structured questions to the user |
| `setting-up-a-project` | Onboard a project that has no spec graph yet |
| `importing-a-codebase` | Build the initial spec graph for existing code |
| `starting-a-new-project` | Go from a raw idea to a specced project |
| `shipping-a-pr` | Create, update and monitor a pull request |
| `spec-graph` | How to read, create and validate specs |
| `todos` | How to keep the shared plan |

A short system-prompt rule makes the agent route feature and bug-fix work through `choosing-a-workflow` first.

Scratch files the skills write (task specs, PR bodies, screenshots) go in `.pi/context/` inside the project — add that to your `.gitignore`.

## Recommended companions

The skills call these when they are installed:

- [`@thinkrail/pi-ask-user-question`](https://www.npmjs.com/package/@thinkrail/pi-ask-user-question) — structured multiple-choice questions.
- [`@thinkrail/pi-visualize`](https://www.npmjs.com/package/@thinkrail/pi-visualize) — Mermaid diagrams and comparisons in the terminal.

## Project layout

```
spec-graph/   spec_* tools and the spec index
todos/        todo_* tools and the TUI widget
workflow/     system-prompt routing rule
skills/       workflow SKILL.md files
```

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security issues as described in [SECURITY.md](SECURITY.md).

## License

[Apache-2.0](LICENSE). Originally part of [ThinkRail](https://github.com/franndeli/thinkrail).
