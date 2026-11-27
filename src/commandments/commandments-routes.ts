import type { FastifyPluginAsync } from "fastify";
import type { CommandmentsService } from "./commandments-service.ts";
import offensesRoutes from "./offenses/offenses-routes.ts";
import type { OffensesService } from "./offenses/offenses-service.ts";
import commandmentQuestionsRoutes from "./questions/commandment-questions-routes.ts";
import type { CommandmentQuestionsService } from "./questions/commandment-questions-service.ts";

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

const commandmentNumberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 10 } },
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
