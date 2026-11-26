import type { FastifyPluginAsync } from "fastify";
import { createChurchPreceptQuestionsRepository } from "../church-precepts/church-precept-questions-repository.ts";
import { createChurchPreceptsRepository } from "../church-precepts/church-precepts-repository.ts";
import churchPreceptsRoutes from "../church-precepts/church-precepts-routes.ts";
import { createGetChurchPreceptByNumber } from "../church-precepts/get-church-precept-by-number.ts";
import { createListChurchPreceptQuestions } from "../church-precepts/list-church-precept-questions.ts";
import { createListChurchPrecepts } from "../church-precepts/list-church-precepts.ts";
import { createCommandmentQuestionsRepository } from "../commandments/commandment-questions-repository.ts";
import { createCommandmentsRepository } from "../commandments/commandments-repository.ts";
import commandmentsRoutes from "../commandments/commandments-routes.ts";
import { createGetCommandmentByNumber } from "../commandments/get-commandment-by-number.ts";
import { createListCommandmentOffenses } from "../commandments/list-commandment-offenses.ts";
import { createListCommandmentQuestions } from "../commandments/list-commandment-questions.ts";
import { createListCommandments } from "../commandments/list-commandments.ts";
import { createOffensesRepository } from "../commandments/offenses-repository.ts";

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

	const commandments = createCommandmentsRepository(api.db);
	api.register(commandmentsRoutes, {
		prefix: "/commandments",
		listCommandments: createListCommandments(commandments),
		getCommandmentByNumber: createGetCommandmentByNumber(commandments),
		listCommandmentQuestions: createListCommandmentQuestions(
			createCommandmentQuestionsRepository(api.db),
			commandments,
		),
		listCommandmentOffenses: createListCommandmentOffenses(
			createOffensesRepository(api.db),
			commandments,
		),
	});
	const churchPrecepts = createChurchPreceptsRepository(api.db);
	api.register(churchPreceptsRoutes, {
		prefix: "/church-precepts",
		listChurchPrecepts: createListChurchPrecepts(churchPrecepts),
		getChurchPreceptByNumber: createGetChurchPreceptByNumber(churchPrecepts),
		listChurchPreceptQuestions: createListChurchPreceptQuestions(
			createChurchPreceptQuestionsRepository(api.db),
			churchPrecepts,
		),
	});
};

export default apiRoutes;
