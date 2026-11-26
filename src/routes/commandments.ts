import type { FastifyPluginAsync } from "fastify";
import { createCommandmentsRepository } from "../repositories/commandments-repository.ts";
import {
	type CommandmentsService,
	createCommandmentsService,
} from "../services/commandments-service.ts";
import examinationQuestionsRoutes, {
	type ExaminationQuestionsOptions,
} from "./examination-questions.ts";
import offensesRoutes, { type OffensesOptions } from "./offenses.ts";

declare module "fastify" {
	interface FastifyInstance {
		commandmentsService: CommandmentsService;
	}
}

export interface CommandmentsOptions {
	service?: CommandmentsService; // tests can pass their own
	questions?: ExaminationQuestionsOptions;
	offenses?: OffensesOptions;
}

const commandmentSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		number: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const numberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 10 } },
} as const;

const commandmentsRoutes: FastifyPluginAsync<CommandmentsOptions> = async (
	app,
	opts,
) => {
	// Wiring: the only line that touches app.db. Built once at boot,
	// visible to this plugin and its children only.
	app.decorate(
		"commandmentsService",
		opts.service ??
			createCommandmentsService(createCommandmentsRepository(app.db)),
	);

	app.get(
		"/",
		{
			schema: {
				response: { 200: { type: "array", items: commandmentSchema } },
			},
		},
		async () => app.commandmentsService.getAllCommandments(),
	);

	app.get<{ Params: { number: number } }>(
		"/:number",
		{
			schema: { params: numberParams, response: { 200: commandmentSchema } },
		},
		async (request) =>
			app.commandmentsService.getByCommandmentNumber(request.params.number),
	);

	app.register(examinationQuestionsRoutes, {
		prefix: "/:number/questions",
		...opts.questions,
	});

	app.register(offensesRoutes, {
		prefix: "/:number/offenses",
		...opts.offenses,
	});
};

export default commandmentsRoutes;
