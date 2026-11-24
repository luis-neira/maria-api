import type { Commandment, Conn } from '../db/types.ts'

// The contract the service depends on. It says nothing about SQL.
export interface CommandmentsRepository {
  findAll (): Promise<Commandment[]>
  findByNumber (number: number): Promise<Commandment | undefined>
}

// Kysely lives only in repositories
export function createCommandmentsRepository (db: Conn): CommandmentsRepository {
  return {
    async findAll () {
      return db
        .selectFrom('commandments')
        .selectAll()
        .orderBy('number')
        .execute()
    },
    async findByNumber (number) {
      return db
        .selectFrom('commandments')
        .selectAll()
        .where('number', '=', number)
        .executeTakeFirst()
    }
  }
}
