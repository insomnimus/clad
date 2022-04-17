import { Command } from "./mod.ts";

const args = new Command("clad", {
	quiet: { flags: ["q", "quiet"], help: "Be more quiet" },
	verbose: {
		multi: true,
		flags: ["v", "verbose"],
		help: "Enable verbose output",
	},
	path: {
		required: true,
		default: ".",
		help: "The path of something",
		flags: ["p", "path"],
		takesValue: true,
	},
	trailing: { multi: true, help: "Extra arguments" },
})
	.about("An example clad app")
	.parse(Deno.args);

console.log(
	"verbose: ",
	args.verbose,
	"\nquiet: ",
	args.quiet,
	"\npath: ",
	args.path,
	"\ntrailing: ",
	args.trailing,
);
