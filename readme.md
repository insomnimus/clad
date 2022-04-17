# Clad
Clad is a simple command line arguments parser.
It is inspired by the awesome rust library, [clap](https://github.com/clap-rs/clap).

## Features
- Supports short (`-f`), long (`--long`) and positional arguments.
- `--option value` and `--option=value` are allowed.
- `-f value`, `-f=value` and `-fvalue` are also allowed.
- You can combine short flags: `-Syu` is the same as `-S -y -u`.
- You can specify any flag to take multiple values.
- Supports required/optional flags.
- Supports per-argument validation with a closure.
- Simple interface.
- Auto generated help message.

## Unsupported
For now there is no support for subcommands.

## Usage Example
Please read [this file](./example.ts).

## Documentation
Coming soon.
