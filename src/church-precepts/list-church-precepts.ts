import type { ChurchPrecept } from "./church-precept.ts";

export interface ListChurchPreceptsRepository {
	/** Returns all Church precepts in number order. */
	findAll(): Promise<ChurchPrecept[]>;
}

export type ListChurchPrecepts = () => Promise<ChurchPrecept[]>;

export function createListChurchPrecepts(
	repository: ListChurchPreceptsRepository,
): ListChurchPrecepts {
	return () => repository.findAll();
}
