import type { Commandment } from '../db/types.ts'
import type { CommandmentsRepository } from '../repositories/commandments-repository.ts'

// Domain error. The error handler uses statusCode for the reply.
export class CommandmentNotFoundError extends Error {
  statusCode = 404
  constructor (number: number) { super(`Commandment ${number} not found`) }
}

// Plain TypeScript: no Fastify, no Kysely. Business rules live here.
export function createCommandmentsService (repo: CommandmentsRepository) {
  return {
    async listCommandments (): Promise<Commandment[]> {
      return repo.findAll()
    },
    async getCommandment (number: number): Promise<Commandment> {
      const commandment = await repo.findByNumber(number)
      if (!commandment) throw new CommandmentNotFoundError(number)
      return commandment
    }
  }
}

export type CommandmentsService = ReturnType<typeof createCommandmentsService>
