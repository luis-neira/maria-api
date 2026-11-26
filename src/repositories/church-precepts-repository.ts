import type { ChurchPrecept, Conn } from "../db/types.ts";

export interface ChurchPreceptsRepository {
  findAll(): Promise<ChurchPrecept[]>;
  findByPreceptNumber(number: number): Promise<ChurchPrecept | undefined>;
}

export function createChurchPreceptsRepository(db: Conn): ChurchPreceptsRepository {
  return {
    async findAll() {
      return db
        .selectFrom("churchPrecepts")
        .selectAll()
        .orderBy("number")
        .execute();
    },
    async findByPreceptNumber(number: number) {
      return db
        .selectFrom("churchPrecepts")
        .selectAll()
        .where("number", "=", number)
        .executeTakeFirst();
    },
  };
}
