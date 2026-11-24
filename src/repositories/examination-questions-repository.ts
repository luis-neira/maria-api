import type { Conn, ExaminationQuestion } from '../db/types.ts'

export interface ExaminationQuestionsRepository {
  findByCommandmentNumber (number: number): Promise<ExaminationQuestion[]>
}

export function createExaminationQuestionsRepository (db: Conn): ExaminationQuestionsRepository {
  return {
    async findByCommandmentNumber (number) {
      return db.selectFrom('examinationQuestions as q')
        .innerJoin('commandments as c', 'c.id', 'q.commandmentId')
        .selectAll('q')
        .where('c.number', '=', number)
        .orderBy('q.questionPosition')
        .execute()
    }
  }
}
