# Clad
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://deno.land/x/clad@v0.2.2/mod.tshttps://doc.deno.land/https://deno.land/x/clad/mod.ts)

Clad is a simple command line arguments parser. It is inspired by the awesome
rust library, [clap](https://github.com/clap-rs/clap).

## Features
- Supports short (`-f`), long (`--long`) and positional arguments.
- `--option value` and `--option=value` are allowed.
- `-f value`, `-f=value` and `-fvalue` are also allowed.
- You can combine short flags: `-Syu` is the same as `-S -y -u`.
- You can specify any flag to take multiple values.
- You can specify default values.
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
import * as clad from "https://deno.land/x/clad/mod.ts";
// Or take what you need:
// import { Command } from "https://deno.land/x/clad/mod.ts";
```

## Usage Example
```ts
import { Command } from "https://deno.land/x/clad/mod.ts";

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
```

### Example Output
```output
$ deno run ./concat.ts -h
USAGE: concat [OPTIONS] ARGS...
Concatenate words with a separator

OPTIONS:
    -s, --sep, --separator <sep>: The separator used to concatenate words [default: -]
    -c, --capitalize: Make each word all caps
    -h, --help: Show this message and exit

ARGS:
     <words>...: Any number of words to join (required)
$ deno run ./concat.ts
error: missing required value for <words...>
run with --help for more info
$ deno run ./concat.ts 'it'\''s' a me mario
it's-a-me-mario
$ deno run ./concat.ts -s _ snake case
snake_case
$ deno run ./concat.ts -cs_ screaming snake case
SCREAMING_SNAKE_CASE
$ deno run ./concat.ts --notaflag
error: unknown option `--notaflag`
if you meant to supply `--notaflag` as a value rather than a flag, use `-- --notaflag`
run with --help for more info
$ deno run ./concat.ts -s ' ' -- --notaflag is not a flag but now it works
--notaflag is not a flag but now it works
```
