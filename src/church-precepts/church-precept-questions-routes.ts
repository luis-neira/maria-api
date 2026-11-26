import type { FastifyPluginAsync } from "fastify";
import { churchPreceptNumberParams } from "./church-precept-params.ts";
import type { ListChurchPreceptQuestions } from "./list-church-precept-questions.ts";

export interface ChurchPreceptQuestionsOptions {
	listChurchPreceptQuestions: ListChurchPreceptQuestions;
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
		async (request) => opts.listChurchPreceptQuestions(request.params.number),
	);
};

export default churchPreceptQuestionsRoutes;
