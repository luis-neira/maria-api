import {
	commandmentNotFound,
	type GetCommandmentByNumberRepository,
} from "./get-commandment-by-number.ts";

export interface CommandmentQuestion {
	id: number;
	commandmentId: number;
	questionPosition: number;
	text: string;
}

export interface ListCommandmentQuestionsRepository {
	/** Returns the Commandment's Examination questions in position order. */
	findByCommandmentNumber(number: number): Promise<CommandmentQuestion[]>;
}

export type ListCommandmentQuestions = (
	number: number,
) => Promise<CommandmentQuestion[]>;

export function createListCommandmentQuestions(
	questions: ListCommandmentQuestionsRepository,
	commandments: GetCommandmentByNumberRepository,
): ListCommandmentQuestions {
	return async (number) => {
		if (!(await commandments.findByCommandmentNumber(number))) {
			throw commandmentNotFound(number);
		}
		return questions.findByCommandmentNumber(number);
	};
}
