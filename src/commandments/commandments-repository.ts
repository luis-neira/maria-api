import type { Conn } from "#db/types.ts";

const commandmentColumns = ["id", "number", "text"] as const;

export interface Commandment {
	id: number;
	number: number;
	text: string;
}

export interface CommandmentsRepository {
	/** Returns all Commandments in number order. */
	findAll(): Promise<Commandment[]>;
	findByCommandmentNumber(number: number): Promise<Commandment | undefined>;
}

export function createCommandmentsRepository(db: Conn): CommandmentsRepository {
	return {
		async findAll() {
			return db
				.selectFrom("commandments")
				.select(commandmentColumns)
				.orderBy("number")
				.execute();
		},
		async findByCommandmentNumber(number: number) {
			return db
				.selectFrom("commandments")
				.select(commandmentColumns)
				.where("number", "=", number)
				.executeTakeFirst();
		},
	};
}
