export const commandmentNumberParams = {
	type: "object",
	required: ["number"],
	properties: { number: { type: "integer", minimum: 1, maximum: 10 } },
} as const;
