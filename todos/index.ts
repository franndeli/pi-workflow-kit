import type { ExtensionAPI, ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { registerTodoTools } from "./tools/index.ts";
import { registerTodoWidget } from "./widget.ts";

const TODO_SECTION = "pi-todos";

const TODO_RULE = [
	"This chat has a TODO list — your live plan for the conversation, shown to the user above the editor.",
	"A pending loose item already in that list is promoted into its own group when you take it into work, regardless of size.",
	"When the user asks for a plan or new work needs at least three substantive execution steps, read the todos skill, create a concise plan once the task is understood enough to plan, and keep it current.",
].join("\n");

const factory: ExtensionFactory = (pi: ExtensionAPI) => {
	registerTodoTools(pi);
	registerTodoWidget(pi);

	pi.on("before_agent_start", (event) => {
		event.systemPromptOptions.sections[TODO_SECTION] = TODO_RULE;
	});
};

export default factory;
