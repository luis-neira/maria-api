import type { FastifyPluginAsync } from "fastify";
import churchPreceptsRoutes, {
	type ChurchPreceptsOptions,
} from "../church-precepts/church-precepts-routes.ts";
import commandmentsRoutes, {
	type CommandmentsOptions,
} from "../commandments/commandments-routes.ts";

export interface ApiOptions {
	apiKey: string;
	commandments: CommandmentsOptions;
	churchPrecepts: ChurchPreceptsOptions;
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

	api.register(commandmentsRoutes, {
		prefix: "/commandments",
		...opts.commandments,
	});

	api.register(churchPreceptsRoutes, {
		prefix: "/church-precepts",
		...opts.churchPrecepts,
	});
};

export default apiRoutes;
