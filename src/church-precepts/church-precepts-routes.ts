import type { FastifyPluginAsync } from "fastify";
import type { ChurchPreceptQuestionsService } from "./questions/church-precept-questions-service.ts";
import type { ChurchPreceptsService } from "./church-precepts-service.ts";
import churchPreceptQuestionsRoutes from "./questions/church-precept-questions-routes.ts";

export interface ChurchPreceptsOptions {
	churchPrecepts: ChurchPreceptsService;
	churchPreceptQuestions: ChurchPreceptQuestionsService;
}

const churchPreceptSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		number: { type: "integer" },
		text: { type: "string" },
	},
} as const;

export const churchPreceptNumberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 5 } },
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
		async () => opts.churchPrecepts.list(),
	);

	app.get<{ Params: { number: number } }>(
		"/:number",
		{
			schema: {
				params: churchPreceptNumberParams,
				response: { 200: churchPreceptSchema },
			},
		},
		async (request) => opts.churchPrecepts.getByNumber(request.params.number),
	);

	app.register(churchPreceptQuestionsRoutes, {
		prefix: "/:number/questions",
		churchPreceptQuestions: opts.churchPreceptQuestions,
	});
};

export default churchPreceptsRoutes;
