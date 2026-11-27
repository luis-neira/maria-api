import type { Conn } from "#db/types.ts";

export interface ChurchPrecept {
	id: number;
	number: number;
	text: string;
}

export interface ChurchPreceptsRepository {
	/** Returns all Church precepts in number order. */
	findAll(): Promise<ChurchPrecept[]>;
	findByChurchPreceptNumber(number: number): Promise<ChurchPrecept | undefined>;
}

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
