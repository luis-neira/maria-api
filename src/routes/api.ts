import type { FastifyPluginAsync } from 'fastify'
import commandmentsRoutes from './commandments.ts'

export interface ApiOptions {
  apiKey: string
}

const apiRoutes: FastifyPluginAsync<ApiOptions> = async (api, opts) => {
  // Every route under /api, at any depth, runs this first
  api.addHook('onRequest', async (request, reply) => {
    if (request.headers['x-api-key'] !== opts.apiKey) {
      return reply.code(401).send({ message: 'Missing or invalid API key' })
    }
  })

  api.register(commandmentsRoutes, { prefix: '/commandments' })
}

export default apiRoutes
