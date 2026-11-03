import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { type Component, matchesKey, type TUI, truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { countItems, flatItems, groupStatus, type Todo, type TodoGroup, type TodoPlan } from "./core/index.ts";
import { storeFor } from "./tools/shared.ts";

const WIDGET_KEY = "pi-workflow-kit-todos";
// Pi truncates array widgets past 10 lines.
const EXPANDED_MAX_LINES = 10;
// alt+t only fires where Option sends Meta; on a default macOS keyboard it types "†", hence ctrl+space first.
const TOGGLE_KEYS = ["ctrl+space", "alt+t"] as const;
const TOGGLE_HINT = TOGGLE_KEYS[0];

type Paint = (color: string, text: string) => string;
const plain: Paint = (_c, t) => t;

const mark: Record<Todo["status"], string> = { done: "✓", in_progress: "◐", pending: "○" };

function item(todo: Todo, indent: string, paint: Paint): string {
	const text = `${indent}${mark[todo.status]} ${todo.title}`;
	if (todo.status === "done") return paint("dim", text);
	if (todo.status === "in_progress") return paint("accent", text);
	return text;
}

function progress(plan: TodoPlan): { done: number; total: number } {
	return { done: flatItems(plan).filter((todo) => todo.status === "done").length, total: countItems(plan) };
}

// The step a reader most wants to see: the one in work, else the next one to start.
function focusStep(plan: TodoPlan): { group?: TodoGroup; todo: Todo } | undefined {
	const steps = [
		...plan.groups.flatMap((group) => group.todos.map((todo) => ({ group, todo }))),
		...plan.todos.map((todo) => ({ todo })),
	];
	return steps.find((s) => s.todo.status === "in_progress") ?? steps.find((s) => s.todo.status === "pending");
}

export function renderCollapsedLine(plan: TodoPlan, paint: Paint = plain): string | undefined {
	const { done, total } = progress(plan);
	if (total === 0) return undefined;
	const focus = focusStep(plan);
	const head = paint("accent", `TODO ${done}/${total}`);
	const hint = paint("dim", `  ${TOGGLE_HINT} expand · /todos panel`);
	if (!focus) return `${head} ${paint("dim", "all done")}${hint}`;
	const where = focus.group ? `${focus.group.title} › ` : "";
	return `${head} ${paint("dim", where)}${item(focus.todo, "", paint)}${hint}`;
}

export function renderTodoLines(plan: TodoPlan, paint: Paint = plain): string[] {
	const { done, total } = progress(plan);
	if (total === 0) return [];
	const header = `${paint("accent", `TODO ${done}/${total}`)}${paint("dim", `  ${TOGGLE_HINT} collapse · /todos panel`)}`;
	const focus = focusStep(plan)?.todo;
	const body: string[] = [];
	let focusLine = 0;
	const push = (todo: Todo, indent: string) => {
		if (todo === focus) focusLine = body.length;
		body.push(item(todo, indent, paint));
	};
	for (const group of plan.groups) {
		const status = groupStatus(group);
		if (status === "done") {
			body.push(paint("dim", `  ✓ ${group.title} (${group.todos.length})`));
			continue;
		}
		body.push(`  ${status === "active" ? "▸" : "·"} ${group.title}`);
		for (const todo of group.todos) push(todo, "    ");
	}
	for (const todo of plan.todos) push(todo, "  ");
	if (body.length < EXPANDED_MAX_LINES) return [header, ...body];
	// Keep the step in work on screen: a window of the body around it, the rest counted.
	const room = EXPANDED_MAX_LINES - 2;
	const start = Math.max(0, Math.min(focusLine - 2, body.length - room));
	const hidden = body.length - room;
	return [header, ...body.slice(start, start + room), paint("dim", `  … ${hidden} more · /todos to see all`)];
}

// One selectable row of the panel. Groups fold; steps open to show their details.
type Row = { kind: "group"; group: TodoGroup } | { kind: "todo"; todo: Todo; indent: string } | { kind: "loose" };

const DETAIL_FIELDS = ["note", "summary", "verification"] as const;

class TodoPanel implements Component {
	private cursor = 0;
	private scroll = 0;
	private readonly folded = new Set<string>();
	private readonly opened = new Set<string>();

	constructor(
		private readonly tui: TUI,
		private readonly theme: Theme,
		private readonly read: () => TodoPlan,
		private readonly close: () => void,
	) {
		for (const group of read().groups) if (groupStatus(group) === "done") this.folded.add(group.id);
	}

	private rows(plan: TodoPlan): Row[] {
		const rows: Row[] = [];
		for (const group of plan.groups) {
			rows.push({ kind: "group", group });
			if (!this.folded.has(group.id)) for (const todo of group.todos) rows.push({ kind: "todo", todo, indent: "    " });
		}
		if (plan.todos.length > 0) {
			rows.push({ kind: "loose" });
			for (const todo of plan.todos) rows.push({ kind: "todo", todo, indent: "    " });
		}
		return rows;
	}

	private height(): number {
		return Math.max(6, Math.floor(this.tui.terminal.rows * 0.8) - 4);
	}

	handleInput(data: string): void {
		const rows = this.rows(this.read());
		const page = Math.max(1, this.height() - 2);
		if (matchesKey(data, "escape") || data === "q") return this.close();
		if (matchesKey(data, "up") || data === "k") this.cursor--;
		else if (matchesKey(data, "down") || data === "j") this.cursor++;
		else if (matchesKey(data, "pageUp")) this.cursor -= page;
		else if (matchesKey(data, "pageDown")) this.cursor += page;
		else if (matchesKey(data, "home") || data === "g") this.cursor = 0;
		else if (matchesKey(data, "end") || data === "G") this.cursor = rows.length - 1;
		else if (matchesKey(data, "return") || data === " ") {
			const row = rows[this.cursor];
			if (row?.kind === "group") toggle(this.folded, row.group.id);
			if (row?.kind === "todo") toggle(this.opened, row.todo.id);
		} else return;
		this.cursor = Math.max(0, Math.min(this.cursor, this.rows(this.read()).length - 1));
		this.tui.requestRender();
	}

	render(width: number): string[] {
		const th = this.theme;
		const plan = this.read();
		const inner = Math.max(10, width - 4);
		const { done, total } = progress(plan);
		const body: string[] = [];
		let cursorLine = 0;
		this.rows(plan).forEach((row, index) => {
			const selected = index === this.cursor;
			if (selected) cursorLine = body.length;
			const pointer = selected ? th.fg("accent", "› ") : "  ";
			const line = this.rowText(row, plan);
			body.push(truncateToWidth(pointer + (selected ? th.bold(line) : line), inner));
			if (row.kind === "todo" && this.opened.has(row.todo.id)) {
				for (const field of DETAIL_FIELDS) {
					const value = row.todo[field];
					if (!value) continue;
					for (const wrapped of wrapTextWithAnsi(`${field}: ${value}`, inner - 8)) body.push(th.fg("dim", `        ${wrapped}`));
				}
			}
		});
		if (body.length === 0) body.push(th.fg("dim", "  No TODO plan in this chat."));

		const view = this.height();
		if (cursorLine < this.scroll) this.scroll = cursorLine;
		if (cursorLine >= this.scroll + view) this.scroll = cursorLine - view + 1;
		this.scroll = Math.max(0, Math.min(this.scroll, Math.max(0, body.length - view)));
		const visible = body.slice(this.scroll, this.scroll + view);
		const more = body.length > view ? th.fg("dim", ` ${this.scroll + 1}-${this.scroll + visible.length}/${body.length}`) : "";

		const border = (s: string) => th.fg("border", s);
		const pad = (s: string) => truncateToWidth(s, inner, "", true);
		return [
			border(`╭${"─".repeat(inner + 2)}╮`),
			`${border("│")} ${pad(`${th.fg("accent", th.bold(`TODO ${done}/${total}`))}${more}`)} ${border("│")}`,
			...visible.map((line) => `${border("│")} ${pad(line)} ${border("│")}`),
			`${border("│")} ${pad(th.fg("dim", "↑↓/jk move · PgUp/PgDn · Enter fold/details · Esc close"))} ${border("│")}`,
			border(`╰${"─".repeat(inner + 2)}╯`),
		];
	}

	private rowText(row: Row, plan: TodoPlan): string {
		const th = this.theme;
		const paint: Paint = (color, text) => th.fg(color as never, text);
		if (row.kind === "loose") return th.fg("dim", `  Loose (${plan.todos.length})`);
		if (row.kind === "todo") {
			const hasDetails = DETAIL_FIELDS.some((field) => row.todo[field]);
			return item(row.todo, row.indent, paint) + (hasDetails && !this.opened.has(row.todo.id) ? th.fg("dim", " …") : "");
		}
		const status = groupStatus(row.group);
		const fold = this.folded.has(row.group.id) ? "▸" : "▾";
		const count = `${row.group.todos.filter((t) => t.status === "done").length}/${row.group.todos.length}`;
		const text = `${fold} ${row.group.title} ${th.fg("dim", `(${count})`)}`;
		if (status === "done") return th.fg("dim", text);
		return status === "active" ? th.fg("accent", text) : text;
	}

	invalidate(): void {}
}

function toggle(set: Set<string>, id: string): void {
	if (!set.delete(id)) set.add(id);
}

export function registerTodoWidget(pi: ExtensionAPI): void {
	let expanded = false;
	const refresh = (ctx: ExtensionContext): void => {
		if (!ctx.hasUI || ctx.mode !== "tui") return;
		const theme = ctx.ui.theme;
		const paint: Paint = (color, text) => (theme ? theme.fg(color as never, text) : text);
		const plan = storeFor(ctx).read();
		const lines = expanded ? renderTodoLines(plan, paint) : [renderCollapsedLine(plan, paint)].filter((l) => l !== undefined);
		ctx.ui.setWidget(WIDGET_KEY, lines.length > 0 ? lines : undefined);
	};
	pi.on("session_start", (_event, ctx) => refresh(ctx));
	pi.on("tool_execution_end", (event, ctx) => {
		if (event.toolName.startsWith("todo_")) refresh(ctx);
	});
	for (const key of TOGGLE_KEYS) {
		pi.registerShortcut(key, {
			description: "Expand or collapse the TODO list above the editor",
			handler: async (ctx) => {
				expanded = !expanded;
				refresh(ctx);
			},
		});
	}
	pi.registerCommand("todos", {
		description: "Open the full TODO plan in a scrollable panel",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI || ctx.mode !== "tui") return;
			await ctx.ui.custom<void>(
				(tui, theme, _keybindings, done) => new TodoPanel(tui, theme, () => storeFor(ctx).read(), () => done()),
				{ overlay: true, overlayOptions: { width: "80%", maxHeight: "80%", anchor: "center" } },
			);
			refresh(ctx);
		},
	});
}
