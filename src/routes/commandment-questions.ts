import type { FastifyPluginAsync } from "fastify";
import { createCommandmentQuestionsRepository } from "../repositories/commandment-questions-repository.ts";
import { createCommandmentsRepository } from "../repositories/commandments-repository.ts";
import {
	type CommandmentQuestionsService,
	createCommandmentQuestionsService,
} from "../services/commandment-questions-service.ts";

declare module "fastify" {
	interface FastifyInstance {
		commandmentQuestionsService: CommandmentQuestionsService;
	}
}

export interface CommandmentQuestionsOptions {
	service?: CommandmentQuestionsService; // tests can pass their own
}

// number comes from the prefix '/:number/questions'
const params = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 10 } },
} as const;

const questionSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		commandmentId: { type: "integer" },
		questionPosition: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const commandmentQuestionsRoutes: FastifyPluginAsync<
	CommandmentQuestionsOptions
> = async (app, opts) => {
	app.decorate(
		"commandmentQuestionsService",
		opts.service ??
			createCommandmentQuestionsService(
				createCommandmentQuestionsRepository(app.db),
				createCommandmentsRepository(app.db),
			),
	);

	app.get<{ Params: { number: number } }>(
		"/",
		{
			schema: {
				params,
				response: { 200: { type: "array", items: questionSchema } },
			},
		},
		async (request) =>
			app.commandmentQuestionsService.getAllQuestions(request.params.number),
	);
};

export default commandmentQuestionsRoutes;
