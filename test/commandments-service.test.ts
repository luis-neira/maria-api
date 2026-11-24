import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCommandmentsService, CommandmentNotFoundError } from '../src/services/commandments-service.ts'
import type { CommandmentsRepository } from '../src/repositories/commandments-repository.ts'
import type { Commandment } from '../src/db/types.ts'

// A fake repository: an array behind the same interface. No database, no Fastify.
function fakeRepo (rows: Commandment[]): CommandmentsRepository {
  return {
    async list () { return [...rows].sort((a, b) => a.number - b.number) },
    async findByNumber (number) { return rows.find((r) => r.number === number) }
  }
}

const rows: Commandment[] = [
  { id: 1, number: 2, text: 'Second' },
  { id: 2, number: 1, text: 'First' }
]

test('listCommandments returns every commandment', async () => {
  const service = createCommandmentsService(fakeRepo(rows))
  assert.deepEqual((await service.listCommandments()).map((c) => c.number), [1, 2])
})

test('getCommandment finds by number', async () => {
  const service = createCommandmentsService(fakeRepo(rows))
  assert.deepEqual(await service.getCommandment(1), { id: 2, number: 1, text: 'First' })
})

test('getCommandment throws CommandmentNotFoundError for a missing number', async () => {
  const service = createCommandmentsService(fakeRepo(rows))
  await assert.rejects(service.getCommandment(7), CommandmentNotFoundError)
})
