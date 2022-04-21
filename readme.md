# Clad
[![build badge](https://github.com/insomnimus/clad/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/insomnimus/clad/actions/workflows/main.yml)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://deno.land/x/clad/mod.ts)

Clad is a simple command line arguments parser. It is inspired by the awesome
rust library, [clap](https://github.com/clap-rs/clap).

## Features
- Supports short (`-f`), long (`--long`) and positional arguments.
- `--option value` and `--option=value` are allowed.
- `-f value`, `-f=value` and `-fvalue` are also allowed.
- You can combine short flags: `-Syu` is the same as `-S -y -u`.
- You can specify any flag to take multiple values.
- You can specify default values.
- You can limit possible values to a set. (can set the comparison to be case insensitive as well).
- You can specify a flag as conflicting with another.
- You can specify a flag as requiring another.
- Pass positional values that start with `-` after `--`. E.g.
  `./amyapp -- -somevalue`.
- Supports required/optional flags.
- Supports per-argument validation with a closure.
- Simple interface.
- Auto generated help message.

## Unsupported
For now there is no support for subcommands.

## Usage Example
> Note: Check out the [examples directory](examples/) for more.

```ts
// examples/bump-version.ts
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
		validate: (s) =>
			s.match(/^\d+\.\d+\.\d+$/)
				? undefined
				: "the value must be in the form major.minor.patch where each field is a non-negative number",
	},
})
	.version("0.1.0")
	.about("Increment a semantic version")
	.parse(Deno.args);

// WE can trust the input!
let [major, minor, patch] = args.str.ver!.split(".").map((x) => parseInt(x));

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

```

### Example Session
```output
+ deno run ./bump-version.ts -h
USAGE: bump-version [OPTIONS] ARGS...
Increment a semantic version

OPTIONS:
    -b, --bump <bump>: Bump which field? (required) [possible values: major, minor, patch]
-V, --version: Show version information and exit
    -h, --help: Show this message and exit

ARGS:
     <ver>: The version to bump (required)
+ deno run ./bump-version.ts --version
bump-version 0.1.0
+ deno run ./bump-version.ts --bump major 0.1.0
0.1.0 -> 1.0.0
+ deno run ./bump-version.ts 0.1.0 -bMiNoR
0.1.0 -> 0.2.0
+ deno run ./bump-version.ts 0.1.0
error: missing required value for -b --bump <bump>
run with --help for more info
+ deno run ./bump-version.ts -b mayor 0.1.0
error: failed to validate the 'mayor' value of -b --bump <bump>: value must be one of [major, minor, patch]
run with --help for more info
+ deno run ./bump-version.ts not_a_version --bump=patch
error: failed to validate the 'not_a_version' value of <ver>: the value must be in the form major.minor.patch where each field is a non-negative number
run with --help for more info
```
