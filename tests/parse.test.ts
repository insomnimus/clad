import { Args, Command } from "../mod.ts";
// import { assertThrows } from "https://deno.land/std/testing/asserts.ts";

type TestCase = {
	name: string;
	ok: string[];
	fail: string[];
	flags: Args;
};

const tests: TestCase[] = [
	{
		name: "long flags",
		ok: [
			"",
			"--name wow",
			"-nwow",
			"-n wow",
			"-n=wow",
			"--name=wow",
			"-fnwow",
			"-fn=wow",
		],
		fail: ["-f -f", "-f=wow", "-n", "--name", "-fn"],
		flags: {
			name: { flags: ["n", "name"], takesValue: true },
			foo: { flags: ["f"] },
		},
	},
	{
		name: "name and surname",
		ok: ["john", "john doe"],
		fail: ["", "john sir doe doingston", "--wtf", "john doe --wow"],
		flags: {
			name: { required: true },
			surname: {},
		},
	},
	{
		name: "conflict",
		ok: ["-l asdf", "-u asdf e", "-- asdf wow bar", "-l -- -u"],
		fail: [
			"-lu failme",
			"-l -u nope",
			"-ul lol",
			"-l --up",
			"--low --up",
			"-l -l",
			"--up -u",
		],
		flags: {
			low: { flags: ["l", "low"], conflicts: ["up"] },
			up: { flags: ["u", "up"], conflicts: ["low"] },
			trail: { multi: true },
		},
	},
];

Deno.test("test parse", () => {
	for (const test of tests) {
		for (const ok of test.ok) {
			const args = ok === "" ? [] : ok.split(" ");
			try {
				const cmd = new Command(test.name, test.flags).throwOnError(true);
				cmd.parse(args);
			} catch (e) {
				throw `the test ${test.name} failed where it should succeed with input: ${ok}\nerror: ${e}`;
			}
		}
		for (const fail of test.fail) {
			const args = fail === "" ? [] : fail.split(" ");
			const cmd = new Command(test.name, test.flags).throwOnError(true);
			try {
				cmd.parse(args);
				throw "no";
			} catch (e) {
				if (e.toString() === "no") {
					throw `${test.name} succeeded where it should have failed with input: ${fail}`;
				}
			}
		}
	}
});
