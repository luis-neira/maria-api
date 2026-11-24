import { test } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import commandmentsRoutes from '../src/routes/commandments.ts'
import { CommandmentNotFoundError, type CommandmentsService } from '../src/services/commandments-service.ts'
import type { ExaminationQuestionsService } from '../src/services/examination-questions-service.ts'

// Fake services: the routes are tested without a database
const fakeService: CommandmentsService = {
  async listCommandments () { return [{ id: 1, number: 1, text: 'First' }] },
  async getCommandment (number) { throw new CommandmentNotFoundError(number) }
}

const fakeQuestions: ExaminationQuestionsService = {
  async listQuestions (number) { return [{ id: 1, commandmentId: number, questionPosition: 1, text: 'Have I?' }] }
}

function createApp () {
  const app = Fastify()
  app.register(commandmentsRoutes, { prefix: '/commandments', service: fakeService, questions: { service: fakeQuestions } })
  return app
}

test('GET / lists the commandments from the service', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/commandments' })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), [{ id: 1, number: 1, text: 'First' }])
})

test('domain errors become HTTP status codes', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  const missing = await app.inject({ method: 'GET', url: '/commandments/3' })
  assert.equal(missing.statusCode, 404)
  assert.deepEqual(missing.json(), { statusCode: 404, error: 'Not Found', message: 'Commandment 3 not found' })
})

test('the schema rejects a bad number before the service runs', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  for (const url of ['/commandments/0', '/commandments/11', '/commandments/abc', '/commandments/11/questions']) {
    const res = await app.inject({ method: 'GET', url })
    assert.equal(res.statusCode, 400, url)
  }
})

test('questions routes pass the number to the questions service', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/commandments/3/questions' })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), [{ id: 1, commandmentId: 3, questionPosition: 1, text: 'Have I?' }])
})

test('the services are private to the commandments scope', async (t) => {
  const app = createApp()
  t.after(() => app.close())
  await app.ready()

  assert.equal(app.hasDecorator('commandmentsService'), false)
  assert.equal(app.hasDecorator('examinationQuestionsService'), false)
})
