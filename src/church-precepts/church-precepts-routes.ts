import type { FastifyPluginAsync } from "fastify";
import { churchPreceptNumberParams } from "./church-precept-params.ts";
import churchPreceptQuestionsRoutes from "./church-precept-questions-routes.ts";
import type { GetChurchPreceptByNumber } from "./get-church-precept-by-number.ts";
import type { ListChurchPreceptQuestions } from "./list-church-precept-questions.ts";
import type { ListChurchPrecepts } from "./list-church-precepts.ts";

export interface ChurchPreceptsOptions {
	listChurchPrecepts: ListChurchPrecepts;
	getChurchPreceptByNumber: GetChurchPreceptByNumber;
	listChurchPreceptQuestions: ListChurchPreceptQuestions;
}

const churchPreceptSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		number: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const churchPreceptsRoutes: FastifyPluginAsync<ChurchPreceptsOptions> = async (
	app,
	opts,
) => {
	app.get(
		"/",
		{
			schema: {
				response: { 200: { type: "array", items: churchPreceptSchema } },
			},
		},
		async () => opts.listChurchPrecepts(),
	);

	app.get<{ Params: { number: number } }>(
		"/:number",
		{
			schema: {
				params: churchPreceptNumberParams,
				response: { 200: churchPreceptSchema },
			},
		},
		async (request) => opts.getChurchPreceptByNumber(request.params.number),
	);

	app.register(churchPreceptQuestionsRoutes, {
		prefix: "/:number/questions",
		listChurchPreceptQuestions: opts.listChurchPreceptQuestions,
	});
};

export default churchPreceptsRoutes;
