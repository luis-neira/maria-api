import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { applyMigrations, connect } from '@databases/pg-migrations'
import { buildApp, type AppOptions } from '../src/app.ts'

// A real Postgres (compiled to WASM) in this process, reached over a socket by pg.
// Port 0: the OS picks a free port, so this never clashes with `npm run db:serve` on 54329.
const pglite = new PGlite()
const server = new PGLiteSocketServer({ db: pglite, port: 0, maxConnections: 20 })
let databaseUrl = ''
const apiKey = 'test-key'
const headers = { 'x-api-key': apiKey }

// The same options server.ts would build from the environment
function createApp (opts: Partial<AppOptions> = {}) {
  return buildApp({ databaseUrl, apiKey, ...opts })
}

before(async () => {
  await server.start()
  databaseUrl = `postgres://postgres@${server.getServerConn()}/postgres?sslmode=disable`

  // The same tool and files as `npm run db:migrate`
  const connection = connect({ connectionString: databaseUrl, bigIntMode: 'number' })
  await applyMigrations({ connection, migrationsDirectory: 'db/migrations' })
  await connection.dispose()
})

// Every test starts with empty tables and ids from 1. Tests insert their own rows; they don't load db/seed.sql.
beforeEach(async () => {
  await pglite.exec('TRUNCATE examination_questions, commandments RESTART IDENTITY')
})

after(async () => {
  await server.stop()
  await pglite.close()
})

async function insertCommandment (number: number, text: string) {
  await pglite.query('INSERT INTO commandments (number, text) VALUES ($1, $2)', [number, text])
}

async function insertQuestion (commandmentNumber: number, position: number, text: string) {
  await pglite.query(
    `INSERT INTO examination_questions (commandment_id, question_position, text)
     SELECT id, $2, $3 FROM commandments WHERE number = $1`,
    [commandmentNumber, position, text]
  )
}

test('/health is public', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/health' })
  assert.equal(res.statusCode, 200)
})

test('/api needs an API key, at every depth', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  for (const url of ['/api/commandments', '/api/commandments/1', '/api/commandments/1/questions']) {
    const res = await app.inject({ method: 'GET', url })
    assert.equal(res.statusCode, 401, url)
  }
})

test('the API key comes from the options, not the code', async (t) => {
  const app = createApp({ apiKey: 'another-key' })
  t.after(() => app.close())

  const wrong = await app.inject({ method: 'GET', url: '/api/commandments', headers })
  assert.equal(wrong.statusCode, 401)
  const right = await app.inject({ method: 'GET', url: '/api/commandments', headers: { 'x-api-key': 'another-key' } })
  assert.equal(right.statusCode, 200)
})

test('GET /api/commandments lists commandments in number order', async (t) => {
  await insertCommandment(2, 'Second')
  await insertCommandment(1, 'First')
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/api/commandments', headers })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), [
    { id: 2, number: 1, text: 'First' },
    { id: 1, number: 2, text: 'Second' }
  ])
})

test('GET /api/commandments/:number finds by number, not id', async (t) => {
  await insertCommandment(5, 'You shall not kill.')
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/api/commandments/5', headers })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), { id: 1, number: 5, text: 'You shall not kill.' })
})

test('a missing commandment is a 404, an out-of-range number is a 400', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  const missing = await app.inject({ method: 'GET', url: '/api/commandments/3', headers })
  assert.equal(missing.statusCode, 404)
  assert.equal(missing.json().message, 'Commandment 3 not found')

  const outOfRange = await app.inject({ method: 'GET', url: '/api/commandments/11', headers })
  assert.equal(outOfRange.statusCode, 400)
})

test('questions come back camelCased and in position order', async (t) => {
  await insertCommandment(4, 'Honor your father and your mother.')
  await insertQuestion(4, 2, 'Second question?')
  await insertQuestion(4, 1, 'First question?')
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/api/commandments/4/questions', headers })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), [
    { id: 2, commandmentId: 1, questionPosition: 1, text: 'First question?' },
    { id: 1, commandmentId: 1, questionPosition: 2, text: 'Second question?' }
  ])
})

test('questions for a missing commandment are a 404', async (t) => {
  const app = createApp()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/api/commandments/9/questions', headers })
  assert.equal(res.statusCode, 404)
  assert.equal(res.json().message, 'Commandment 9 not found')
})

test('boot fails fast when the database is unreachable', async () => {
  const app = createApp({ databaseUrl: 'postgres://postgres@127.0.0.1:1/nope' })
  await assert.rejects(async () => { await app.ready() }, /ECONNREFUSED/)
})

test('a 500 hides its message from the client and logs it', async (t) => {
  const lines: string[] = []
  const app = createApp({ logger: { level: 'error', stream: { write: (line: string) => { lines.push(line) } } } })
  app.get('/boom', async () => { throw new Error('password=hunter2') })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/boom' })
  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.json(), { statusCode: 500, error: 'Internal Server Error', message: 'Something went wrong' })
  assert.ok(lines.some((l) => l.includes('password=hunter2')), 'the real message is in the log')
})
