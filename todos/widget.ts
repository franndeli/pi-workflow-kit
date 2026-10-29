import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { countItems, flatItems, groupStatus, type Todo, type TodoPlan } from "./core/index.ts";
import { storeFor } from "./tools/shared.ts";

const WIDGET_KEY = "pi-workflow-kit-todos";
const MAX_LINES = 14;

type Paint = (color: string, text: string) => string;

const mark: Record<Todo["status"], string> = { done: "✓", in_progress: "◐", pending: "○" };

function item(todo: Todo, indent: string, paint: Paint): string {
	const text = `${indent}${mark[todo.status]} ${todo.title}`;
	if (todo.status === "done") return paint("dim", text);
	if (todo.status === "in_progress") return paint("accent", text);
	return text;
}

export function renderTodoLines(plan: TodoPlan, paint: Paint = (_c, t) => t): string[] {
	const total = countItems(plan);
	if (total === 0) return [];
	const done = flatItems(plan).filter((todo) => todo.status === "done").length;
	const lines = [paint("accent", `TODO ${done}/${total}`)];
	for (const group of plan.groups) {
		const status = groupStatus(group);
		if (status === "done") {
			lines.push(paint("dim", `  ✓ ${group.title} (${group.todos.length})`));
			continue;
		}
		lines.push(`  ${status === "active" ? "▸" : "·"} ${group.title}`);
		for (const todo of group.todos) lines.push(item(todo, "    ", paint));
	}
	for (const todo of plan.todos) lines.push(item(todo, "  ", paint));
	if (lines.length <= MAX_LINES) return lines;
	return [...lines.slice(0, MAX_LINES - 1), paint("dim", `  … ${lines.length - MAX_LINES + 1} more`)];
}

export function registerTodoWidget(pi: ExtensionAPI): void {
	let hidden = false;
	const refresh = (ctx: ExtensionContext): void => {
		if (!ctx.hasUI || ctx.mode !== "tui") return;
		const theme = ctx.ui.theme;
		const paint: Paint = (color, text) => (theme ? theme.fg(color as never, text) : text);
		const lines = hidden ? [] : renderTodoLines(storeFor(ctx).read(), paint);
		ctx.ui.setWidget(WIDGET_KEY, lines.length > 0 ? lines : undefined);
	};
	pi.on("session_start", (_event, ctx) => refresh(ctx));
	pi.on("tool_execution_end", (event, ctx) => {
		if (event.toolName.startsWith("todo_")) refresh(ctx);
	});
	pi.registerCommand("todos", {
		description: "Show or hide the TODO list above the editor",
		handler: async (_args, ctx) => {
			hidden = !hidden;
			refresh(ctx);
		},
	});
}
