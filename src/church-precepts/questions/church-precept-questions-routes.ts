import type { FastifyPluginAsync } from "fastify";
import type { ChurchPreceptQuestionsService } from "./church-precept-questions-service.ts";

export interface ChurchPreceptQuestionsOptions {
	churchPreceptQuestions: ChurchPreceptQuestionsService;
}

const questionSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		churchPreceptId: { type: "integer" },
		questionPosition: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const churchPreceptNumberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 5 } },
} as const;

const churchPreceptQuestionsRoutes: FastifyPluginAsync<
	ChurchPreceptQuestionsOptions
> = async (app, opts) => {
	app.get<{ Params: { number: number } }>(
		"/",
		{
			schema: {
				params: churchPreceptNumberParams,
				response: { 200: { type: "array", items: questionSchema } },
			},
		},
		async (request) =>
			opts.churchPreceptQuestions.listByChurchPreceptNumber(
				request.params.number,
			),
	);
};

export default churchPreceptQuestionsRoutes;
