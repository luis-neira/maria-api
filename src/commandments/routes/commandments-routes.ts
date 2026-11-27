import type { FastifyPluginAsync } from "fastify";
import type { CommandmentQuestionsService } from "../services/commandment-questions-service.ts";
import type { CommandmentsService } from "../services/commandments-service.ts";
import type { OffensesService } from "../offenses/services/offenses-service.ts";
import commandmentQuestionsRoutes from "./commandment-questions-routes.ts";
import offensesRoutes from "../offenses/routes/offenses-routes.ts";
import { commandmentNumberParams } from "./schemas/commandment-params.ts";

export interface CommandmentsOptions {
	commandments: CommandmentsService;
	commandmentQuestions: CommandmentQuestionsService;
	offenses: OffensesService;
}

const commandmentSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		number: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const commandmentsRoutes: FastifyPluginAsync<CommandmentsOptions> = async (
	app,
	opts,
) => {
	app.get(
		"/",
		{
			schema: {
				response: { 200: { type: "array", items: commandmentSchema } },
			},
		},
		async () => opts.commandments.list(),
	);

	app.get<{ Params: { number: number } }>(
		"/:number",
		{
			schema: {
				params: commandmentNumberParams,
				response: { 200: commandmentSchema },
			},
		},
		async (request) => opts.commandments.getByNumber(request.params.number),
	);

	app.register(commandmentQuestionsRoutes, {
		prefix: "/:number/questions",
		commandmentQuestions: opts.commandmentQuestions,
	});

	app.register(offensesRoutes, {
		prefix: "/:number/offenses",
		offenses: opts.offenses,
	});
};

export default commandmentsRoutes;
