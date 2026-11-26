import type { FastifyPluginAsync } from "fastify";
import type { ListCommandmentOffenses } from "./list-commandment-offenses.ts";

interface OffensesOptions {
	listCommandmentOffenses: ListCommandmentOffenses;
}

// number comes from the prefix '/:number/offenses'
const params = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 10 } },
} as const;

const offenseSchema = {
	type: "object",
	required: ["id", "text"],
	additionalProperties: false,
	properties: {
		id: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const offenseCategorySchema = {
	type: "object",
	required: ["id", "text", "offenses"],
	additionalProperties: false,
	properties: {
		id: { type: "integer" },
		text: { type: "string" },
		offenses: { type: "array", items: offenseSchema },
	},
} as const;

const commandmentOffensesSchema = {
	type: "object",
	required: ["categories", "uncategorized"],
	additionalProperties: false,
	properties: {
		categories: { type: "array", items: offenseCategorySchema },
		uncategorized: { type: "array", items: offenseSchema },
	},
} as const;

const offensesRoutes: FastifyPluginAsync<OffensesOptions> = async (
	app,
	opts,
) => {
	app.get<{ Params: { number: number } }>(
		"/",
		{ schema: { params, response: { 200: commandmentOffensesSchema } } },
		async (request) => opts.listCommandmentOffenses(request.params.number),
	);
};

export default offensesRoutes;
