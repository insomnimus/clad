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
	words: {
		help: "Any number of words to join",
		multi: true,
		required: true,
	},
})
	.about("Concatenate words with a separator")
	.parse(Deno.args);

const mapper = (s: string): string => args.cap ? s.toUpperCase() : s;
console.log((args.words as string[]).map(mapper).join(args.sep as string));
