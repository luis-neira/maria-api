import type { FastifyPluginAsync } from "fastify";
import { createChurchPreceptsRepository } from "../repositories/church-precepts-repository.ts";
import { type ChurchPreceptsService, createChurchPreceptsService } from "../services/church-precepts-service.ts";

declare module "fastify" {
  interface FastifyInstance {
    churchPreceptsService: ChurchPreceptsService;
  }
}

export interface ChurchPreceptsOptions {
  service?: ChurchPreceptsService; // tests can pass their own
}

const churchPreceptsRoutes: FastifyPluginAsync<ChurchPreceptsOptions> = async (app, opts) => {
  app.decorate(
    "churchPreceptsService",
    opts.service ?? createChurchPreceptsService(createChurchPreceptsRepository(app.db)),
  );

  app.get(
    "/",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "integer" },
                text: { type: "string" },
              },
            },
          },
        },
      },
    },
    async () => app.churchPreceptsService.listChurchPrecepts()
  );

  app.get<{ Params: { number: number } }>(
    "/:number",
    {
      schema: {
        params: {
          type: "object",
          required: ["number"],
          properties: { number: { type: "integer", minimum: 1, maximum: 5 } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              number: { type: "integer" },
              text: { type: "string" },
            },
          },
        },
      },
    },
    async (request) => app.churchPreceptsService.getChurchPrecept(request.params.number)
  );
}

export default churchPreceptsRoutes;
