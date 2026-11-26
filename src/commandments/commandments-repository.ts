import type { Conn } from "../db/types.ts";
import type { GetCommandmentByNumberRepository } from "./get-commandment-by-number.ts";
import type { ListCommandmentsRepository } from "./list-commandments.ts";

const commandmentColumns = ["id", "number", "text"] as const;

export function createCommandmentsRepository(
	db: Conn,
): ListCommandmentsRepository & GetCommandmentByNumberRepository {
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
