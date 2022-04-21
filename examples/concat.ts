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
	.version("0.1.0")
	.about("Concatenate words with a separator")
	.parse(Deno.args);

const mapper = (s: string): string => {
	if (args.bool.low) return s.toLowerCase();
	else if (args.bool.cap) return s.toUpperCase();
	else return s;
};

console.log(args.arr.words.map(mapper).join(args.str.sep));
