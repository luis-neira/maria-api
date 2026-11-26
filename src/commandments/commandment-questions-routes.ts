import type { FastifyPluginAsync } from "fastify";
import type { ListCommandmentQuestions } from "./list-commandment-questions.ts";

interface CommandmentQuestionsOptions {
	listCommandmentQuestions: ListCommandmentQuestions;
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
	app.get<{ Params: { number: number } }>(
		"/",
		{
			schema: {
				params,
				response: { 200: { type: "array", items: questionSchema } },
			},
		},
		async (request) => opts.listCommandmentQuestions(request.params.number),
	);
};

export default commandmentQuestionsRoutes;
