-- Seed data transcribed from docs/Examination-of-Conscience-Ten-Commandments.pdf
-- (USCCB, "A Brief Examination of Conscience Based on the Ten Commandments", 2013).
-- Idempotent: re-running updates text in place; rows removed here are NOT deleted from the database.
-- Run via `npm run db:seed` (psql, ON_ERROR_STOP=1, --single-transaction).

INSERT INTO commandments (number, text) VALUES
  (1,  'I am the LORD your God: you shall not have strange Gods before me.'),
  (2,  'You shall not take the name of the LORD your God in vain.'),
  (3,  'Remember to keep holy the LORD''s Day.'),
  (4,  'Honor your father and your mother.'),
  (5,  'You shall not kill.'),
  (6,  'You shall not commit adultery.'),
  (7,  'You shall not steal.'),
  (8,  'You shall not bear false witness against your neighbor.'),
  (9,  'You shall not covet your neighbor''s spouse.'),
  (10, 'You shall not covet your neighbor''s goods.')
ON CONFLICT (number) DO UPDATE SET text = excluded.text;

INSERT INTO examination_questions (commandment_id, question_position, text)
SELECT c.id, q.question_position, q.text
FROM (VALUES
  (1,  1, 'Have I treated people, events, or things as more important than God?'),
  (2,  1, 'Have my words, actively or passively, put down God, the Church, or people?'),
  (3,  1, 'Do I go to Mass every Sunday (or Saturday Vigil) and on Holy Days of Obligation?'),
  (3,  2, 'Do I avoid, when possible, work that impedes worship to God, joy for the LORD''s Day, and proper relaxation of mind and body?'),
  (3,  3, 'Do I look for ways to spend time with family or in service on Sunday?'),
  (4,  1, 'Do I show my parents due respect?'),
  (4,  2, 'Do I seek to maintain good communication with my parents where possible?'),
  (4,  3, 'Do I criticize them for lacking skills I think they should have?'),
  (5,  1, 'Have I harmed another through physical, verbal, or emotional means, including gossip or manipulation of any kind?'),
  (6,  1, 'Have I respected the physical and sexual dignity of others and of myself?'),
  (7,  1, 'Have I taken or wasted time or resources that belonged to another?'),
  (8,  1, 'Have I gossiped, told lies, or embellished stories at the expense of another?'),
  (9,  1, 'Have I honored my spouse with my full affection and exclusive love?'),
  (10, 1, 'Am I content with my own means and needs, or do I compare myself to others unnecessarily?')
) AS q (commandment_number, question_position, text)
JOIN commandments c ON c.number = q.commandment_number
ON CONFLICT (commandment_id, question_position) DO UPDATE SET text = excluded.text;
