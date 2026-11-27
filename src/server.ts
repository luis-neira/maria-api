import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.ts";

// The web server: read the environment, build the app, listen on a port
function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

const app = buildApp({
	databaseUrl: required("DATABASE_URL"),
	apiKey: required("API_KEY"),
	logger: true,
});

closeWithGrace(async ({ signal, err }) => {
	if (err) {
		app.log.error({ err }, "server closing with error");
	} else {
		app.log.info(`${signal} received, server closing`);
	}
	await app.close();
	app.log.info("Server closed");
});

try {
	await app.listen({ port: Number(process.env.PORT ?? 3000) });
} catch (err) {
	app.log.error({ err }, "server startup failed");
	try {
		await app.close();
	} catch (closeErr) {
		app.log.error(
			{ err: closeErr },
			"failed to close server after startup error",
		);
	}
	process.exit(1);
}
