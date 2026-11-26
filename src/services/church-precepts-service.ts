import type { ChurchPrecept } from "../db/types.ts";
import { AppError } from "../errors.ts";
import type { ChurchPreceptsRepository } from "../repositories/church-precepts-repository.ts";

export function churchPreceptNotFound(number: number) {
  return new AppError("NOT_FOUND", `Church Precept ${number} not found.`);
}

// Plain TypeScript: no Fastify, no Kysely. Business rules live here.
export function createChurchPreceptsService(repo: ChurchPreceptsRepository) {
  return {
    async listChurchPrecepts(): Promise<ChurchPrecept[]> {
      return repo.findAll();
    },
    async getChurchPrecept(number: number): Promise<ChurchPrecept> {
      const churchPrecept = await repo.findByNumber(number);
      if (!churchPrecept) throw churchPreceptNotFound(number);
      return churchPrecept;
    },
  };
}

export type ChurchPreceptsService = ReturnType<typeof createChurchPreceptsService>;
