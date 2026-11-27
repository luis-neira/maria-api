import type { FastifyPluginAsync } from "fastify";
import type { CommandmentQuestionsService } from "./commandment-questions-service.ts";

interface CommandmentQuestionsOptions {
	commandmentQuestions: CommandmentQuestionsService;
}

const questionSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		commandmentId: { type: "integer" },
		questionPosition: { type: "integer" },
		text: { type: "string" },
	},
} as const;

export const commandmentNumberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 10 } },
} as const;

const commandmentQuestionsRoutes: FastifyPluginAsync<
	CommandmentQuestionsOptions
> = async (app, opts) => {
	app.get<{ Params: { number: number } }>(
		"/",
		{
			schema: {
				params: commandmentNumberParams,
				response: { 200: { type: "array", items: questionSchema } },
			},
		},
		async (request) =>
			opts.commandmentQuestions.listByCommandmentNumber(request.params.number),
	);
};

export default commandmentQuestionsRoutes;
