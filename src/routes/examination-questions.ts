import type { FastifyPluginAsync } from 'fastify'
import { createCommandmentsRepository } from '../repositories/commandments-repository.ts'
import { createExaminationQuestionsRepository } from '../repositories/examination-questions-repository.ts'
import {
  createExaminationQuestionsService,
  type ExaminationQuestionsService
} from '../services/examination-questions-service.ts'

declare module 'fastify' {
  interface FastifyInstance {
    examinationQuestionsService: ExaminationQuestionsService
  }
}

export interface ExaminationQuestionsOptions {
  service?: ExaminationQuestionsService   // tests can pass their own
}

// number comes from the prefix '/:number/questions'
const params = {
  type: 'object',
  required: ['number'],
  properties: { number: { type: 'integer', minimum: 1, maximum: 10 } }
} as const

const questionSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    commandmentId: { type: 'integer' },
    questionPosition: { type: 'integer' },
    text: { type: 'string' }
  }
} as const

const examinationQuestionsRoutes: FastifyPluginAsync<ExaminationQuestionsOptions> = async (app, opts) => {
  app.decorate('examinationQuestionsService', opts.service ??
    createExaminationQuestionsService(createExaminationQuestionsRepository(app.db), createCommandmentsRepository(app.db)))

  app.get<{ Params: { number: number } }>('/', {
    schema: { params, response: { 200: { type: 'array', items: questionSchema } } }
  }, async (request) => app.examinationQuestionsService.listQuestions(request.params.number))
}

export default examinationQuestionsRoutes
