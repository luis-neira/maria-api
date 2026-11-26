import type { FastifyPluginAsync } from "fastify";
import offensesRoutes, { type OffensesOptions } from "../routes/offenses.ts";
import commandmentQuestionsRoutes from "./commandment-questions-routes.ts";
import type { GetCommandmentByNumber } from "./get-commandment-by-number.ts";
import type { ListCommandmentQuestions } from "./list-commandment-questions.ts";
import type { ListCommandments } from "./list-commandments.ts";

export interface CommandmentsOptions {
	listCommandments: ListCommandments;
	getCommandmentByNumber: GetCommandmentByNumber;
	listCommandmentQuestions: ListCommandmentQuestions;
	offenses?: OffensesOptions;
}

const commandmentSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		number: { type: "integer" },
		text: { type: "string" },
	},
} as const;

const numberParams = {
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
		async () => opts.listCommandments(),
	);

	app.get<{ Params: { number: number } }>(
		"/:number",
		{
			schema: { params: numberParams, response: { 200: commandmentSchema } },
		},
		async (request) => opts.getCommandmentByNumber(request.params.number),
	);

	app.register(commandmentQuestionsRoutes, {
		prefix: "/:number/questions",
		listCommandmentQuestions: opts.listCommandmentQuestions,
	});

	app.register(offensesRoutes, {
		prefix: "/:number/offenses",
		...opts.offenses,
	});
};

export default commandmentsRoutes;
