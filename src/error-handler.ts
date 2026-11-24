import { STATUS_CODES } from 'node:http'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

// Fastify sets statusCode to 500 before calling this if the error had none, or one below 400.
export function errorHandler (error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const statusCode = error.statusCode ?? 500

  if (statusCode >= 500) {
    // The real message goes to the log, never to the client
    request.log.error({ err: error }, 'unhandled error')
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Something went wrong'
    })
  }

  // Our domain errors (404, 409, 422) and Fastify's own (400 validation): same shape as the default handler
  return reply.code(statusCode).send({
    statusCode,
    error: STATUS_CODES[statusCode],
    message: error.message
  })
}
