import type { FastifyPluginAsync } from "fastify";
import type { OffensesService } from "./offenses-service.ts";
import { commandmentNumberParams } from "./route-schemas.ts";

interface OffensesOptions {
	offenses: OffensesService;
}

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
		{
			schema: {
				params: commandmentNumberParams,
				response: { 200: commandmentOffensesSchema },
			},
		},
		async (request) =>
			opts.offenses.listByCommandmentNumber(request.params.number),
	);
};

export default offensesRoutes;
