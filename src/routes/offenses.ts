import type { FastifyPluginAsync } from "fastify";
import { createCommandmentsRepository } from "../repositories/commandments-repository.ts";
import { createOffensesRepository } from "../repositories/offenses-repository.ts";
import {
	createOffensesService,
	type OffensesService,
} from "../services/offenses-service.ts";

declare module "fastify" {
	interface FastifyInstance {
		offensesService: OffensesService;
	}
}

export interface OffensesOptions {
	service?: OffensesService; // tests can pass their own
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

const commandmentOffensesSchema = {
	type: "object",
	required: ["categories", "uncategorized"],
	additionalProperties: false,
	properties: {
		categories: { type: "array", maxItems: 0 }, // grouping by category is not served yet
		uncategorized: { type: "array", items: offenseSchema },
	},
} as const;

const offensesRoutes: FastifyPluginAsync<OffensesOptions> = async (
	app,
	opts,
) => {
	app.decorate(
		"offensesService",
		opts.service ??
			createOffensesService(
				createOffensesRepository(app.db),
				createCommandmentsRepository(app.db),
			),
	);

	app.get<{ Params: { number: number } }>(
		"/",
		{ schema: { params, response: { 200: commandmentOffensesSchema } } },
		async (request) => app.offensesService.listOffenses(request.params.number),
	);
};

export default offensesRoutes;
