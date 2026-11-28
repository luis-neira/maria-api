import Fastify, {
	type FastifyInstance,
	type FastifyServerOptions,
} from "fastify";
import { errorHandler, notFoundHandler } from "./app-handlers.ts";
import { createChurchPreceptsRepository } from "./church-precepts/church-precepts-repository.ts";
import { createChurchPreceptsService } from "./church-precepts/church-precepts-service.ts";
import { createChurchPreceptQuestionsRepository } from "./church-precepts/questions/church-precept-questions-repository.ts";
import { createChurchPreceptQuestionsService } from "./church-precepts/questions/church-precept-questions-service.ts";
import { createCommandmentsRepository } from "./commandments/commandments-repository.ts";
import { createCommandmentsService } from "./commandments/commandments-service.ts";
import { createOffensesRepository } from "./commandments/offenses/offenses-repository.ts";
import { createOffensesService } from "./commandments/offenses/offenses-service.ts";
import { createCommandmentQuestionsRepository } from "./commandments/questions/commandment-questions-repository.ts";
import { createCommandmentQuestionsService } from "./commandments/questions/commandment-questions-service.ts";
import apiRoutes from "./plugins/api.ts";
import dbPlugin from "./plugins/db.ts";

// Everything the app needs from the outside. Only server.ts reads process.env.
export interface AppOptions extends FastifyServerOptions {
	databaseUrl: string;
	apiKey: string;
}

export function buildApp({ databaseUrl, apiKey, ...fastifyOpts }: AppOptions) {
	const app = Fastify(fastifyOpts);

	// Set at the root, so every plugin inherits them
	app.setErrorHandler(errorHandler);
	app.setNotFoundHandler(notFoundHandler);

	app.register(dbPlugin, { connectionString: databaseUrl });
	const apiOptions = ({ db }: FastifyInstance) => {
		return {
			apiKey,
			commandments: {
				commandments: createCommandmentsService(
					createCommandmentsRepository(db),
				),
				commandmentQuestions: createCommandmentQuestionsService(
					createCommandmentQuestionsRepository(db),
				),
				offenses: createOffensesService(createOffensesRepository(db)),
			},
			churchPrecepts: {
				churchPrecepts: createChurchPreceptsService(
					createChurchPreceptsRepository(db),
				),
				churchPreceptQuestions: createChurchPreceptQuestionsService(
					createChurchPreceptQuestionsRepository(db),
				),
			},
		};
	};

	// The prefix goes on a wrapper: Fastify documents `prefix` only for
	// object options, and `apiOptions` is a function.
	app.register(
		async (api) => {
			api.register(apiRoutes, apiOptions);
		},
		{ prefix: "/api" },
	);

	// Outside /api: for the load balancer, not part of the API
	app.get("/health", async () => ({ status: "ok" }));

	return app;
}
