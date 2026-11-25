import type { ExtensionAPI, ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { registerSpecTools } from "./tools/index.ts";

const SPEC_SECTION = "pi-spec-graph";

const SPEC_RULE = [
	"Specs record the product's intent; only requirements with an ID (e.g. REQ-012) are binding.",
	"- Consult the relevant spec when work may alter a requirement, a module boundary, or an architecture decision; localized work need not read unrelated specs.",
	"- Breaking an ID'd requirement is a bug; changing one needs the user's decision. Other spec prose describes the current state: if your change makes a sentence false, fix or delete it, but never treat it as a rule.",
	"- Update a spec only when a requirement, boundary, or decision changed. Do not create new .md files for plans, notes, or reports.",
].join("\n");

const factory: ExtensionFactory = (pi: ExtensionAPI) => {
	registerSpecTools(pi);

	pi.on("before_agent_start", (event) => {
		event.systemPromptOptions.sections[SPEC_SECTION] = SPEC_RULE;
	});
};

export default factory;
