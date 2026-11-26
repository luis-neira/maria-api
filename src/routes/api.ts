import type { FastifyPluginAsync } from "fastify";
import commandmentsRoutes from "./commandments.ts";
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

	api.register(commandmentsRoutes, { prefix: "/commandments" });
	api.register(churchPreceptsRoutes, { prefix: "/church-precepts" });
};

export default apiRoutes;
