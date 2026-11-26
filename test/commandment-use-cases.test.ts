import assert from "node:assert/strict";
import { test } from "node:test";
import type { Commandment } from "../src/commandments/commandment.ts";
import {
	createGetCommandmentByNumber,
	type GetCommandmentByNumberRepository,
} from "../src/commandments/get-commandment-by-number.ts";
import {
	createListCommandments,
	type ListCommandmentsRepository,
} from "../src/commandments/list-commandments.ts";
import { AppError } from "../src/errors.ts";

// A fake repository: an array behind the same interface. No database, no Fastify.
function fakeRepo(
	rows: Commandment[],
): ListCommandmentsRepository & GetCommandmentByNumberRepository {
	return {
		async findAll() {
			return [...rows].sort((a, b) => a.number - b.number);
		},
		async findByCommandmentNumber(number) {
			return rows.find((r) => r.number === number);
		},
	};
}

const rows: Commandment[] = [
	{ id: 1, number: 2, text: "Second" },
	{ id: 2, number: 1, text: "First" },
];

test("listCommandments returns every Commandment in number order", async () => {
	const listCommandments = createListCommandments(fakeRepo(rows));
	assert.deepEqual(await listCommandments(), [
		{ id: 2, number: 1, text: "First" },
		{ id: 1, number: 2, text: "Second" },
	]);
});

test("getCommandmentByNumber finds a Commandment by number", async () => {
	const getCommandmentByNumber = createGetCommandmentByNumber(fakeRepo(rows));
	assert.deepEqual(await getCommandmentByNumber(1), {
		id: 2,
		number: 1,
		text: "First",
	});
});

test("getCommandmentByNumber throws a NOT_FOUND AppError for a missing number", async () => {
	const getCommandmentByNumber = createGetCommandmentByNumber(fakeRepo(rows));
	await assert.rejects(getCommandmentByNumber(7), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 7 not found.");
		return true;
	});
});
