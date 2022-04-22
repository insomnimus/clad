import { ArgMatches, Args, Command } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@0.135.0/testing/asserts.ts";

type Tests<T> = {
	[name: string]: T;
};

type Basic = {
	ok: string[];
	fail: string[];
	flags: Args;
};

type Vals = {
	flags: Args;
	inputs: [string, { [key: string]: string | number | string[] }][];
};

const basic: Tests<Basic> = {
	"long flags": {
		ok: ["", "--name wow", "-nwow", "-n wow", "-n=wow", "--name=wow", "-fnwow", "-fn=wow"],
		fail: ["-f -f", "-f=wow", "-n", "--name", "-fn"],
		flags: {
			name: { flags: ["n", "name"], takesValue: true },
			foo: { flags: ["f"] },
		},
	},
	"name and surname": {
		ok: ["john", "john doe"],
		fail: ["", "john sir doe doingston", "--wtf", "john doe --wow"],
		flags: {
			name: { required: true },
			surname: {},
		},
	},
	"conflict": {
		ok: ["-l asdf", "-u asdf e", "-- asdf wow bar", "-l -- -u"],
		fail: ["-lu failme", "-l -u nope", "-ul lol", "-l --up", "--low --up", "-l -l", "--up -u"],
		flags: {
			low: { flags: ["l", "low"], conflicts: ["up"] },
			up: { flags: ["u", "up"], conflicts: ["low"] },
			trail: { multi: true },
		},
	},
	"validation": {
		ok: ["-n 2", "-n2", "-n=2 -n22", "--num=2 --num 22 -n2 -n=2 -n 2", ""],
		fail: ["-nn2", "-n", "--number=no", "-n -- -n2", "-- -n2"],
		flags: {
			num: {
				multi: true,
				flags: ["n", "num"],
				validate: s => (s.match(/^\d+$/) ? undefined : ""),
			},
		},
	},
	"requires 1": {
		ok: ["", "-a", "-ablol", "-b=lol", "-b lol -a"],
		fail: [],
		flags: {
			a: { flags: ["a"], requires: ["b"] },
			b: { flags: ["b"], default: "default" },
		},
	},
	"requires 2": {
		ok: ["-a -b asdf", "", "-bc", "asdf"],
		fail: ["-a", "-a lol"],
		flags: {
			a: { flags: ["a"], requires: ["b", "c"] },
			b: { flags: ["b"], takesValue: true },
			c: { default: "default" },
		},
	},
	"override -h": {
		ok: ["-h"],
		fail: [],
		flags: { h: { flags: ["h"] } },
	},
	"possible values": {
		ok: ["", "-pasdf", "-p asdf major", "-- minor", "major"],
		fail: ["no", "--path=DDD MAJOR", "MINOR"],
		flags: {
			path: { flags: ["p", "path"], takesValue: true },
			kind: { possible: ["major", "minor", "patch"] },
		},
	},
};

Deno.test("basic", () => {
	for (const [name, test] of Object.entries(basic)) {
		for (const ok of test.ok) {
			const args = ok === "" ? [] : ok.split(" ");
			try {
				const cmd = new Command(name, test.flags).throwOnError(true);
				cmd.parse(args);
			} catch (e) {
				throw `the test ${name} failed where it should succeed with input: ${ok}\nerror: ${e}`;
			}
		}
		for (const fail of test.fail) {
			const args = fail === "" ? [] : fail.split(" ");
			const cmd = new Command(name, test.flags).throwOnError(true);
			try {
				cmd.parse(args);
				throw "no";
			} catch (e) {
				if (e.toString() === "no") {
					throw `${name} succeeded where it should have failed with input: ${fail}`;
				}
			}
		}
	}
});

const vals: Tests<Vals> = {
	"basic": {
		flags: {
			first: { required: true },
			second: {},
			trailing: { multi: true },
		},
		inputs: [
			["1 2 3 4 5", { first: "1", second: "2", trailing: ["3", "4", "5"] }],
			["1 -- 2 3", { first: "1", second: "2", trailing: ["3"] }],
			["lol", { first: "lol", trailing: [] }],
			["-- -a -b", { first: "-a", second: "-b", trailing: [] }],
			["-- -ab", { first: "-ab", trailing: [] }],
		],
	},
	"default": {
		flags: {
			a: { flags: ["a", "asdf"], default: "default" },
			b: {},
		},
		inputs: [
			["lol", { a: "default", b: "lol" }],
			["-- -alol", { a: "default", b: "-alol" }],
			["asdf -akek", { a: "kek", b: "asdf" }],
			["-a=asdf", { a: "asdf" }],
			["", { a: "default" }],
		],
	},
	"override -h and --help": {
		flags: {
			h: { flags: ["h", "help"], takesValue: true },
		},
		inputs: [
			["-h --help", { h: "--help" }],
			["--help=help", { h: "help" }],
			["-ha", { h: "a" }],
		],
	},
};

Deno.test("values", () => {
	for (const [name, test] of Object.entries(vals)) {
		const cmd = new Command(name, test.flags).throwOnError(true);
		for (const [input, _expected] of test.inputs) {
			const expected: ArgMatches = { str: {}, arr: {}, bool: {} };
			for (const [k, v] of Object.entries(_expected)) {
				if (Array.isArray(v)) expected.arr[k] = v;
				else if (typeof v === "string") expected.str[k] = v;
			}
			const args = input === "" ? [] : input.split(/\s+/);
			const got = cmd.parse(args);
			try {
				assertEquals(expected, got);
			} catch (_e) {
				throw `${name} failed (input was ${input}\nexpected: ${JSON.stringify(
					expected,
					undefined,
					2
				)}\ngot: ${JSON.stringify(got, undefined, 2)}`;
			}
		}
	}
});
