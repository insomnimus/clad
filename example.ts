import { Command } from "./mod.ts";

const args = new Command("clad", {
	quiet: { flags: ["q", "quiet"] },
	verbose: { multi: true, flags: ["v", "verbose"] },
	path: {
		required: true,
		flags: ["p", "path"],
		takesValue: true,
	},
	args: { multi: true, takesValue: true },
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
	"\nargs: ",
	args.args,
);
