import type { Conn } from "#db/types.ts";
import type { ChurchPreceptsRepository } from "./church-precepts-service.ts";

export function createChurchPreceptsRepository(
	db: Conn,
): ChurchPreceptsRepository {
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
