# pi-workflow-kit

Spec-driven workflow for [pi](https://pi.dev), extracted from ThinkRail so it runs in plain pi (for example inside Orca terminals).

```sh
pi install npm:pi-workflow-kit
```

## What you get

- **Spec graph.** `spec_create`, `spec_get`, `spec_update`, `spec_delete`, `spec_grep`, `spec_graph` and `spec_validate` over the project's frontmatter-tagged Markdown specs (goal-and-requirements, architecture, module `SPEC.md`s, task specs), plus the `spec-graph` skill that teaches the agent the conventions.
- **TODO plan.** `todo_write`, `todo_add`, `todo_update`, `todo_promote`, `todo_remove`, `todo_list` and `todo_plan_summary`. The agent keeps a grouped plan for the chat, and the TUI shows it above the editor with live progress. `/todos` hides or shows it. Plans are stored per session in `~/.pi/agent/todos/`.
- **Workflow skills.** `choosing-a-workflow` (the router), `writing-specs`, `brainstorming`, `asking-user-questions`, `importing-a-codebase`, `setting-up-a-project`, `starting-a-new-project` and `shipping-a-pr`. A short system-prompt rule makes the agent route feature and bug-fix work through `choosing-a-workflow` first.

Scratch files the skills write (task specs, PR bodies, screenshots) go in `.pi/context/` inside the project; add that to your `.gitignore`.

Works best together with [`@thinkrail/pi-ask-user-question`](https://www.npmjs.com/package/@thinkrail/pi-ask-user-question) (structured questions) and [`@thinkrail/pi-visualize`](https://www.npmjs.com/package/@thinkrail/pi-visualize) (Mermaid diagrams and comparisons in the terminal), which the skills call when they're installed.

## License

Apache-2.0. Originally part of [ThinkRail](https://github.com/franndeli/thinkrail).
