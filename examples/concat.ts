import { Command } from "../mod.ts";

const args = new Command("concat", {
	sep: {
		help: "The separator used to concatenate words",
		default: "-",
		flags: ["s", "sep", "separator"],
	},
	cap: {
		help: "Make each word all caps",
		flags: ["c", "capitalize"],
	},
	low: {
		help: "Make each word lowercase",
		conflicts: ["cap"],
		flags: ["l", "low", "lowercase"],
	},
	words: {
		help: "Any number of words to join",
		multi: true,
		required: true,
	},
})
	.about("Concatenate words with a separator")
	.parse(Deno.args);

const mapper = (s: string): string => {
	if (args.low) return s.toLowerCase();
	else if (args.cap) return s.toUpperCase();
	else return s;
};

console.log((args.words as string[]).map(mapper).join(args.sep as string));
