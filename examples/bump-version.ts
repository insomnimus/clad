import { Command } from "../mod.ts";

const args = new Command("bump-version", {
	bump: {
		help: "Bump which field?",
		possible: ["major", "minor", "patch"],
		ignoreCase: true,
		required: true,
	},
	ver: {
		help: "The version to bump",
		required: true,
		validate: (s) =>
			s.match(/^\d+\.\d+\.\d+$/)
				? undefined
				: "the value must be in the form major.minor.patch where each field is a non-negative number",
	},
})
	.about("Increment a semantic version")
	.parse(Deno.args);

// WE can trust the input!
let [major, minor, patch] = (args.ver as string).split(".").map((x) =>
	parseInt(x)
);

switch ((args.bump as string).toLowerCase()) {
	case "major": {
		major++;
		minor = 0;
		patch = 0;
		break;
	}
	case "minor": {
		minor++;
		patch = 0;
		break;
	}
	// guaranteed to be "patch"!
	default: {
		patch++;
		break;
	}
}

console.log(`${args.ver} -> ${major}.${minor}.${patch}`);
