import { Command } from "../mod.ts";

const args = new Command("bump-version", {
	bump: {
		flags: ["b", "bump"],
		help: "Bump which field?",
		// Only these valeus will be accepted
		possible: ["major", "minor", "patch"],
		// Match above values case insensitively
		ignoreCase: true,
		// This flag must be present
		required: true,
	},
	ver: {
		// We don't specify `flag` because this is a positional
		help: "The version to bump",
		required: true,
		// Run this callback to validate the input
		validate: s =>
			s.match(/^\d+\.\d+\.\d+$/)
				? undefined
				: "the value must be in the form major.minor.patch where each field is a non-negative number",
	},
})
	.version("0.1.0")
	.about("Increment a semantic version")
	.parse(Deno.args);

// WE can trust the input!
let [major, minor, patch] = args.str.ver!.split(".").map(x => parseInt(x));

switch (args.str.bump.toLowerCase()) {
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

console.log(`${args.str.ver} -> ${major}.${minor}.${patch}`);
