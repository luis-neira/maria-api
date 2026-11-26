export const churchPreceptNumberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 5 } },
} as const;
