import { AppError } from "../errors.ts";
import type { ChurchPrecept } from "./church-precept.ts";

export interface GetChurchPreceptByNumberRepository {
	findByChurchPreceptNumber(number: number): Promise<ChurchPrecept | undefined>;
}

export type GetChurchPreceptByNumber = (
	number: number,
) => Promise<ChurchPrecept>;

export function churchPreceptNotFound(number: number) {
	return new AppError("NOT_FOUND", `Church Precept ${number} not found.`);
}

export function createGetChurchPreceptByNumber(
	repository: GetChurchPreceptByNumberRepository,
): GetChurchPreceptByNumber {
	return async (number) => {
		const churchPrecept = await repository.findByChurchPreceptNumber(number);
		if (!churchPrecept) throw churchPreceptNotFound(number);
		return churchPrecept;
	};
}
