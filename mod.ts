type Arg = {
	required?: boolean;
	flags: string[];
	multi?: boolean;
	takesValue?: boolean;
	validate?(value: string): string | null;
};

interface ArgState extends Arg {
	name: string;
	isPositional: boolean;
	occurrences: number;
	vals: string[];
}

type Args = {
	[name: string]: Arg;
};

type ArgMatches = {
	[name: string]: Value;
};

type Value = undefined | string | string[] | boolean;

class Command<T extends Args> {
	constructor(args: T) {
		this.#args = new Map();
		let lastPositional = -1;
		let firstMultiPositional = -1;
		for (const [i, [k, v]] of Object.entries(args).entries()) {
			let isPositional = false;
			let name: string;
			// if it isn't positional
			if (v.flags?.length ?? 0 !== 0) {
				const shorts = v.flags.filter((x) => x.length === 1);
				const longs = v.flags.filter((x) => x.length > 1);
				if (shorts.length > 0 && longs.length > 0) {
					name = `-${shorts[0]} --${longs[0]}`;
				} else if (shorts.length > 0) name = "-" + shorts[0];
				else if (longs.length > 0) name = "--" + longs[0];
				else throw `option '${k}' contains an empty flag`;
				if (v.takesValue) name += ` <${k}${v.multi ? "..." : ""}>`;
			} else {
				isPositional = true;
				lastPositional = i;
				if (v.multi && firstMultiPositional < 0) firstMultiPositional = i;
				name = `<${k}${v.multi ? "..." : ""}>`;
			}

			this.#args.set(k, {
				...v,
				occurrences: 0,
				vals: [],
				name: name,
				isPositional: isPositional,
			});
		}

		if (lastPositional !== firstMultiPositional) {
			throw `positionals with multiple values are only allowed as the last positional (${
				this.#args[firstMultiPositional].name
			})`;
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

	#get(s: string): ArgState | undefined {
		if (s.startsWith("--")) {
			if (s.length == 3) return undefined;
			const name = s.substring(2);
			return this.#args.values().find((x) => x.flags?.includes(name) ?? false);
		} else if (s.length > 1 && s.startsWith("-")) {
			const name = s.substring(1);
			return this.#args.values().find((x) => x.flags?.includes(name) ?? false);
		} else {
			// find the first positional that has no value
			const positionals = this.#args.values().filter((x) => x.isPositional);
			if (positionals.length === 0) return undefined;
			const arg = positionals.find((x) => x.occurrences === 0);
			if (arg) return arg;
			// or return the last positional if it's multi
			if (positionals[positionals.length - 1].multi) {
				return positionals[positionals.length - 1];
			} else return undefined;
		}
	}

	#helpAndExit(_long: boolean): never {
		Deno.exit(0);
	}

	#errAndExit(msg: string, suggestHelp = true): never {
		console.log(`error: ${msg}`);
		if (suggestHelp) console.log("run with --help for more info");
		Deno.exit(1);
	}

	preprocess(argv: string[]): string[] {
		const processed: string[] = [];
		const shorts = this.#shorts();
		const longs = this.#longs();

		for (let pos = 0; pos < argv.length; pos++) {
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

	parse(argv: string[]): ArgMatches {
		argv = this.preprocess(argv);

		for (let pos = 0; pos < argv.length; pos++) {
			const s = argv[pos];
			const flag = this.#get(s);
			if (flag === undefined) {
				if (s === "-h") this.#helpAndExit(false);
				else if (s === "--help") this.#helpAndExit(true);
				else if (s.startsWith("-")) this.#errAnddExit(`unknown option ${s}`);
				else $this.#errAndExit(`unexpected value ${s}`);
			}

			flag.occurrences++;
			if (flag.takesValue) {
				// if it's positional, do not shift argv
				if (flag.isPositional) flag.vals.push(s);
				else {
					pos++;
					if (pos >= argv.length) {
						this.#errAndExit(
							`the argument ${flag.name} requires a value but none was supplied`,
						);
					}
					flag.vals.push(s);
				}
			}
		}

		// post validation
		for (const flag of this.#args.values()) {
			if (!flag.multi && flag.occurrences > 1) {
				this.#errAndExit(`${flag.name} can be specified only once`);
			} // flags are always optional
			else if (!flag.takesValue) continue;
			else if (flag.required && flag.occurrences === 0) {
				this.#errAndExit(`missing required value for ${flag.name}`);
			}

			for (const val of flag.vals) {
				const res = flag.validate === undefined
					? undefined
					: flag.validate(val);
				if (res !== undefined) {
					this.#errAndExit(
						`failed to validate the '${val}' value of ${flag.name}: ${res}`,
					);
				}
			}
		}

		// everything is fine
		return <{ [key in keyof T]: Value }> this.#args.entries().reduce(
			(res, [name, val]) => {
				if (val.takesValue && val.multi) {
					Object.assign(p, { [name]: val.vals });
				} else if (val.takesValue) {
					Object.assign(p, { [name]: v.vals.get(0) });
				} else {
					Object.assign(p, { [name]: v.occurrences });
				}
			},
			{},
		);
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
