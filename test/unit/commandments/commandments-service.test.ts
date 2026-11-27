import assert from "node:assert/strict";
import { test } from "node:test";
import type {
	Commandment,
	CommandmentsRepository,
} from "#src/commandments/commandments-repository.ts";
import { createCommandmentsService } from "#src/commandments/commandments-service.ts";
import { AppError } from "#src/errors.ts";

// A fake repository: an array behind the same interface. No database, no Fastify.
function fakeRepo(rows: Commandment[]): CommandmentsRepository {
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

const commandments = createCommandmentsService(fakeRepo(rows));

test("lists every Commandment in number order", async () => {
	assert.deepEqual(await commandments.list(), [
		{ id: 2, number: 1, text: "First" },
		{ id: 1, number: 2, text: "Second" },
	]);
});

test("finds a Commandment by number", async () => {
	assert.deepEqual(await commandments.getByNumber(1), {
		id: 2,
		number: 1,
		text: "First",
	});
});

test("throws a NOT_FOUND AppError for a missing Commandment", async () => {
	await assert.rejects(commandments.getByNumber(7), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 7 not found.");
		return true;
	});
});
