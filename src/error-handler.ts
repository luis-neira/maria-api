import { STATUS_CODES } from 'node:http'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError, type ErrorCode } from './errors.ts'

const statusByCode: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409
}

// RFC 9457 problem details. No type member: RFC 9457 then treats it as "about:blank", so the title is the HTTP status phrase.
function sendProblem (reply: FastifyReply, status: number, detail: string) {
  return reply
    .code(status)
    .type('application/problem+json; charset=utf-8')
    .send({ title: STATUS_CODES[status] ?? (status < 500 ? 'Client Error' : 'Server Error'), status, detail })
}

export function errorHandler (error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return sendProblem(reply, statusByCode[error.code], error.message)
  }

  // Fastify's default handler reads statusCode, then status (http-errors and some libraries set only status)
  const { statusCode = (error as { status?: number }).status ?? 500 } = error

  // Only a 4xx is a recognized client error. Anything else (5xx, a stray 302, none) is unexpected.
  if (statusCode < 400 || statusCode >= 500) {
    // The real message goes to the log, never to the client
    request.log.error({ err: error }, 'unhandled error')
    return sendProblem(reply, 500, 'Something went wrong.')
  }

  // Fastify's own 4xx errors (validation, bad JSON, body too large...) and plugin errors:
  // keep their status, message and headers, as Fastify's default handler does
  const { headers } = error as FastifyError & { headers?: Record<string, string> }
  if (headers) reply.headers(headers)
  return sendProblem(reply, statusCode, error.message)
}

// Same shape as Fastify's default 404 message, as a problem response
export function notFoundHandler (request: FastifyRequest, reply: FastifyReply) {
  return sendProblem(reply, 404, `Route ${request.method}:${request.url} not found`)
}
