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

## Import
Make sure to specify an exact version!

```ts
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

### Output
```output
$ deno run ./bump-version.ts -h
USAGE: bump-version [OPTIONS] ARGS...
Increment a semantic version

OPTIONS:
    -h, --help: Show this message and exit

ARGS:
     <bump>: Bump which field? (required) [possible values: major, minor, patch]
     <ver>: The version to bump (required)
$ deno run ./bump-version.ts major 1.2.3
1.2.3 -> 2.0.0
$ deno run ./bump-version.ts Minor 1.2.3
1.2.3 -> 1.3.0
$ deno run ./bump-version.ts PATCH 1.2.3
1.2.3 -> 1.2.4
$ deno run ./bump-version.ts lol 1.2.3
error: failed to validate the 'lol' value of <bump>: value must be one of [major, minor, patch]
run with --help for more info
$ deno run ./bump-version.ts minor 1.2.3.4.5
error: failed to validate the '1.2.3.4.5' value of <ver>: the value must be in the form major.minor.patch where each field is a non-negative number
run with --help for more info
```
