import Fastify, { type FastifyServerOptions } from "fastify";
import { errorHandler, notFoundHandler } from "./app-handler.ts";
import dbPlugin from "./plugins/db.ts";
import apiRoutes from "./plugins/api.ts";

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
	app.register(apiRoutes, { prefix: "/api", apiKey });

	// Outside /api: for the load balancer, not part of the API
	app.get("/health", async () => ({ status: "ok" }));

	return app;
}
