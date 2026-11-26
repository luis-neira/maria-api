import type { Conn } from "../../db/types.ts";
import type { CommandmentsRepository } from "../services/commandments-service.ts";

const commandmentColumns = ["id", "number", "text"] as const;

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
