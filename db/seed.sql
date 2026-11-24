-- Seed data transcribed from docs/Examination-of-Conscience-Ten-Commandments.pdf
-- (USCCB, "A Brief Examination of Conscience Based on the Ten Commandments", 2013).
-- Idempotent: re-running updates text in place; rows removed here are NOT deleted from the database.
-- Run via `npm run db:seed` (psql, ON_ERROR_STOP=1, --single-transaction).

INSERT INTO commandments (number, text) VALUES
  (1,  'I am the LORD thy God: thou shalt not have strange Gods before me'),
  (2,  'Thou shalt not take the Name of the LORD thy God in vain'),
  (3,  'Remember thou keep holy the Sabbath-Day'),
  (4,  'Honor thy father and thy mother'),
  (5,  'Thou shalt not kill'),
  (6,  'Thou shalt not commit adultery'),
  (7,  'Thou shalt not steal'),
  (8,  'Thou shalt not bear false witness against thy neighbor'),
  (9,  'Thou shalt not covet thy neighbor''s wife'),
  (10, 'Thou shalt not covet thy neighbor''s goods')
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

-- Offense categories and offenses transcribed verbatim (including spelling) from
-- docs/examination-of-conscience-10.md. Only commandments 1-2 are transcribed so far.
-- Keyed on text: editing text inserts a new row; the old one remains until `npm run db:reset`.

INSERT INTO offense_categories (commandment_id, text)
SELECT c.id, oc.text
FROM (VALUES
  (1, 'Sins which detract from the honor and worpship due to God, such as:'),
  (1, 'Those against Faith, such as:'),
  (1, 'Those against Hope, such as:'),
  (1, 'Those against Charity, such as:'),
  (2, 'All irreverence towards God''s most Holy Name, such as:')
) AS oc (commandment_number, text)
JOIN commandments c ON c.number = oc.commandment_number
ON CONFLICT (commandment_id, text) DO NOTHING;

INSERT INTO offenses (offense_category_id, text)
SELECT oc.id, o.text
FROM (VALUES
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Neglect of Prayer'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Superstitious practices'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Divination'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Consulting fortune-tellers'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Attaching undue importance to dreams, omens'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Tempting God by exposing one''s self to danger of soul, life or health, without grave cause'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Sacrilege'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Profane or superstitious use of blessed objects'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Profanation of places or things consecrated to God'),
  (1, 'Sins which detract from the honor and worpship due to God, such as:', 'Receiving the Sacrements in a state of mortal sin'),
  (1, 'Those against Faith, such as:', 'Willful doubt of any article of Faith'),
  (1, 'Those against Faith, such as:', 'Reading or circulating books or writings against Catholic belief or practice'),
  (1, 'Those against Faith, such as:', 'Knowingly joining in schismatic or heretical worship'),
  (1, 'Those against Faith, such as:', 'Denying one''s religion'),
  (1, 'Those against Faith, such as:', 'Neglecting means of religious instruction'),
  (1, 'Those against Hope, such as:', 'Despair of God''s mercy, or want of confidence in power of His Grace to support us in trouble or temptation'),
  (1, 'Those against Hope, such as:', 'Murmuring against God''s providence'),
  (1, 'Those against Hope, such as:', 'Presuming on God''s mercy, or on the supposed efficacy of certain pious practices, in order to continue in sin'),
  (1, 'Those against Charity, such as:', 'Willfuly rebellious thoughts against God'),
  (1, 'Those against Charity, such as:', 'Boasting of sin'),
  (1, 'Those against Charity, such as:', 'Violating God''s law, or omitting good works, through human respect'),
  (2, 'All irreverence towards God''s most Holy Name, such as:', 'Cursing and profane swearing'),
  (2, 'All irreverence towards God''s most Holy Name, such as:', 'False, unlawful and unnecessary oaths'),
  (2, 'All irreverence towards God''s most Holy Name, such as:', 'Membership in societies condemned by the Church'),
  (2, 'All irreverence towards God''s most Holy Name, such as:', 'Breaking or deferring lawful vows'),
  (2, 'All irreverence towards God''s most Holy Name, such as:', 'Irreverence in Divine Service, and in churches and holy places even when service is not going on.')
) AS o (commandment_number, category_text, text)
JOIN commandments c ON c.number = o.commandment_number
JOIN offense_categories oc ON oc.commandment_id = c.id AND oc.text = o.category_text
ON CONFLICT (offense_category_id, text) DO NOTHING;
