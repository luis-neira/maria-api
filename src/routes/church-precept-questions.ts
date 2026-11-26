import type { FastifyPluginAsync } from "fastify";
import { createChurchPreceptQuestionsRepository } from "../repositories/church-precept-questions-repository.ts";
import { createChurchPreceptsRepository } from "../repositories/church-precepts-repository.ts";
import {
	type ChurchPreceptQuestionsService,
	createChurchPreceptQuestionsService,
} from "../services/church-precept-questions-service.ts";
import { churchPreceptNumberParams } from "./church-precept-params.ts";

declare module "fastify" {
	interface FastifyInstance {
		churchPreceptQuestionsService: ChurchPreceptQuestionsService;
	}
}

export interface ChurchPreceptQuestionsOptions {
	service?: ChurchPreceptQuestionsService;
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
	app.decorate(
		"churchPreceptQuestionsService",
		opts.service ??
			createChurchPreceptQuestionsService(
				createChurchPreceptQuestionsRepository(app.db),
				createChurchPreceptsRepository(app.db),
			),
	);

	app.get<{ Params: { number: number } }>(
		"/",
		{
			schema: {
				params: churchPreceptNumberParams,
				response: { 200: { type: "array", items: questionSchema } },
			},
		},
		async (request) =>
			app.churchPreceptQuestionsService.getAllQuestions(request.params.number),
	);
};

export default churchPreceptQuestionsRoutes;
