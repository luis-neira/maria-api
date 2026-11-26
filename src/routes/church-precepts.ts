import type { FastifyPluginAsync } from "fastify";
import { createChurchPreceptsRepository } from "../repositories/church-precepts-repository.ts";
import {
	type ChurchPreceptsService,
	createChurchPreceptsService,
} from "../services/church-precepts-service.ts";
import { churchPreceptNumberParams } from "./church-precept-params.ts";
import churchPreceptQuestionsRoutes, {
	type ChurchPreceptQuestionsOptions,
} from "./church-precept-questions.ts";

declare module "fastify" {
	interface FastifyInstance {
		churchPreceptsService: ChurchPreceptsService;
	}
}

export interface ChurchPreceptsOptions {
	service?: ChurchPreceptsService; // tests can pass their own
	questions?: ChurchPreceptQuestionsOptions;
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
	app.decorate(
		"churchPreceptsService",
		opts.service ??
			createChurchPreceptsService(createChurchPreceptsRepository(app.db)),
	);

	app.get(
		"/",
		{
			schema: {
				response: { 200: { type: "array", items: churchPreceptSchema } },
			},
		},
		async () => app.churchPreceptsService.listChurchPrecepts(),
	);

	app.get<{ Params: { number: number } }>(
		"/:number",
		{
			schema: {
				params: churchPreceptNumberParams,
				response: { 200: churchPreceptSchema },
			},
		},
		async (request) =>
			app.churchPreceptsService.getChurchPrecept(request.params.number),
	);

	app.register(churchPreceptQuestionsRoutes, {
		prefix: "/:number/questions",
		...opts.questions,
	});
};

export default churchPreceptsRoutes;
