import type { Commandment } from "./commandment.ts";

export interface ListCommandmentsRepository {
	/** Returns all Commandments in number order. */
	findAll(): Promise<Commandment[]>;
}

export type ListCommandments = () => Promise<Commandment[]>;

export function createListCommandments(
	repository: ListCommandmentsRepository,
): ListCommandments {
	return () => repository.findAll();
}
