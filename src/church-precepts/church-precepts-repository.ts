import type { Conn } from "../db/types.ts";
import type { GetChurchPreceptByNumberRepository } from "./get-church-precept-by-number.ts";
import type { ListChurchPreceptsRepository } from "./list-church-precepts.ts";

export function createChurchPreceptsRepository(
	db: Conn,
): ListChurchPreceptsRepository & GetChurchPreceptByNumberRepository {
	return {
		async findAll() {
			return db
				.selectFrom("churchPrecepts")
				.selectAll()
				.orderBy("number")
				.execute();
		},
		async findByChurchPreceptNumber(number: number) {
			return db
				.selectFrom("churchPrecepts")
				.selectAll()
				.where("number", "=", number)
				.executeTakeFirst();
		},
	};
}
