import type { FastifyPluginAsync } from "fastify";
import type { CommandmentQuestionsService } from "../services/commandment-questions-service.ts";
import { commandmentNumberParams } from "./schemas/commandment-params.ts";

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
