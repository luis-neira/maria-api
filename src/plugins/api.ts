import type { FastifyPluginAsync } from "fastify";
import { createChurchPreceptQuestionsRepository } from "../church-precepts/questions/church-precept-questions-repository.ts";
import { createChurchPreceptsRepository } from "../church-precepts/church-precepts-repository.ts";
import churchPreceptsRoutes from "../church-precepts/church-precepts-routes.ts";
import { createChurchPreceptQuestionsService } from "../church-precepts/questions/church-precept-questions-service.ts";
import { createChurchPreceptsService } from "../church-precepts/church-precepts-service.ts";
import { createCommandmentQuestionsRepository } from "../commandments/questions/commandment-questions-repository.ts";
import { createCommandmentsRepository } from "../commandments/commandments-repository.ts";
import { createOffensesRepository } from "../commandments/offenses/offenses-repository.ts";
import commandmentsRoutes from "../commandments/commandments-routes.ts";
import { createCommandmentQuestionsService } from "../commandments/questions/commandment-questions-service.ts";
import { createCommandmentsService } from "../commandments/commandments-service.ts";
import { createOffensesService } from "../commandments/offenses/offenses-service.ts";

export interface ApiOptions {
	apiKey: string;
}

const apiRoutes: FastifyPluginAsync<ApiOptions> = async (api, opts) => {
	// Every route under /api, at any depth, runs this first
	// Thrown, not sent, so the error handler formats it like every other error.
	// A plain statusCode, not an AppError: authentication is HTTP's concern, not a service's.
	api.addHook("onRequest", async (request) => {
		if (request.headers["x-api-key"] !== opts.apiKey) {
			throw Object.assign(new Error("Missing or invalid API key."), {
				statusCode: 401,
			});
		}
	});

	const commandments = createCommandmentsService(
		createCommandmentsRepository(api.db),
	);
	api.register(commandmentsRoutes, {
		prefix: "/commandments",
		commandments,
		commandmentQuestions: createCommandmentQuestionsService(
			createCommandmentQuestionsRepository(api.db),
			commandments.getByNumber,
		),
		offenses: createOffensesService(
			createOffensesRepository(api.db),
			commandments.getByNumber,
		),
	});
	const churchPrecepts = createChurchPreceptsService(
		createChurchPreceptsRepository(api.db),
	);
	api.register(churchPreceptsRoutes, {
		prefix: "/church-precepts",
		churchPrecepts,
		churchPreceptQuestions: createChurchPreceptQuestionsService(
			createChurchPreceptQuestionsRepository(api.db),
			churchPrecepts.getByNumber,
		),
	});
};

export default apiRoutes;
