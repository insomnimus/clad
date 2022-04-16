interface Arg {
	required?: boolean;
	flags: string[];
	multi?: boolean;
	takesValue?: boolean;
	validate?(value: string): string | null;
}

interface ArgState extends Arg {
	occurrences: number;
	vals: string[];
}

interface Args {
	[name: string]: Arg;
}

class Command {
	constructor(args: Args) {
		this.#args = new Map();
		for (const [k, v] of Object.entries(args)) {
			this.#args.set(k, { ...v, occurrences: 0, vals: [] });
		}
	}

	#args: Map<string, ArgState>;

	#shorts(): Map<string, boolean> {
		const map = new Map<string, boolean>();
		for (const arg of this.#args.values()) {
			for (const s of arg.flags?.filter((s) => s.length === 1)) {
				map.set(s, arg.takesValue ?? false);
			}
		}
		return map;
	}

	#longs(): Map<string, boolean> {
		const map = new Map<string, boolean>();
		for (const arg of this.#args.values()) {
			for (const s of arg.flags?.filter((s) => s.length > 1)) {
				map.set(s, arg.takesValue ?? false);
			}
		}
		return map;
	}

	preprocess(argv: string[]): string[] {
		const processed: string[] = [];
		const shorts = this.#shorts();
		const longs = this.#longs();

		let pos = 0;

		for (; pos < argv.length; pos++) {
			const s = argv[pos];
			// console.log("at ", pos);

			if (s.startsWith("--")) {
				// Split --arg=val to --arg val
				const index = s.indexOf("=");

				if (index < 0) {
					processed.push(s);
					// shift the position to consume the value if the flag exists and takes a value
					if (longs.get(s.substring(2))) {
						pos++;
						if (pos < argv.length) processed.push(argv[pos]);
					}
				} else {
					processed.push(s.substring(0, index));
					processed.push(s.substring(index + 1));
				}
			} else if (s.length > 1 && s.startsWith("-")) {
				for (let i = 1; i < s.length; i++) {
					// if flag exists and takes value
					if (shorts.get(s[i])) {
						processed.push("-" + s[i]);
						const rest = s.substring(i + 1);
						if (rest === "") {
							// shift position and push value
							pos++;
							if (pos < argv.length) processed.push(argv[pos]);
						} else if (rest.startsWith("=")) {
							processed.push(rest.substring(1));
						} else {
							processed.push(rest);
						}
						// done with the char iteration
						break;
					} else {
						// push the character prepended with "-"
						processed.push("-" + s[i]);
					}
				}
			} else {
				// it's a positional
				processed.push(s);
			}
		}

		return processed;
	}
}

// test
function arg(flags: string[], takesValue = false): Arg {
	return { flags: flags, takesValue: takesValue };
}

const cmd = new Command({
	out: arg(["o", "out"], true),
	verbose: arg(["v", "verbose"]),
	quiet: arg(["q", "quiet"]),
	path: arg([], true),
});

for (const s of cmd.preprocess(Deno.args)) {
	console.log(s);
}
