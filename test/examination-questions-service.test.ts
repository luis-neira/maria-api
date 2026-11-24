import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createExaminationQuestionsService } from '../src/services/examination-questions-service.ts'
import { AppError } from '../src/errors.ts'
import type { CommandmentsRepository } from '../src/repositories/commandments-repository.ts'
import type { ExaminationQuestionsRepository } from '../src/repositories/examination-questions-repository.ts'

const commandments: CommandmentsRepository = {
  async findAll () { return [{ id: 1, number: 1, text: 'First' }] },
  async findByNumber (number) { return number === 1 ? { id: 1, number: 1, text: 'First' } : undefined }
}

const questions: ExaminationQuestionsRepository = {
  async findByCommandmentNumber (number) {
    return number === 1 ? [{ id: 1, commandmentId: 1, questionPosition: 1, text: 'Have I?' }] : []
  }
}

test('lists the questions for a commandment', async () => {
  const service = createExaminationQuestionsService(questions, commandments)
  assert.deepEqual(await service.listQuestions(1), [{ id: 1, commandmentId: 1, questionPosition: 1, text: 'Have I?' }])
})

test('a missing commandment is a NOT_FOUND AppError, not an empty list', async () => {
  const service = createExaminationQuestionsService(questions, commandments)
  await assert.rejects(service.listQuestions(2), (err) => {
    assert.ok(err instanceof AppError)
    assert.equal(err.code, 'NOT_FOUND')
    assert.equal(err.message, 'Commandment 2 not found.')
    return true
  })
})
