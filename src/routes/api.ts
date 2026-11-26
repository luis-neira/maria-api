import type { FastifyPluginAsync } from "fastify";
import { createCommandmentQuestionsRepository } from "../commandments/commandment-questions-repository.ts";
import { createCommandmentsRepository } from "../commandments/commandments-repository.ts";
import commandmentsRoutes from "../commandments/commandments-routes.ts";
import { createGetCommandmentByNumber } from "../commandments/get-commandment-by-number.ts";
import { createListCommandmentQuestions } from "../commandments/list-commandment-questions.ts";
import { createListCommandments } from "../commandments/list-commandments.ts";
import churchPreceptsRoutes from "./church-precepts.ts";

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
	});
	api.register(churchPreceptsRoutes, { prefix: "/church-precepts" });
};

export default apiRoutes;
