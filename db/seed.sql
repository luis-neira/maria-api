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


-- Offense categories and Offenses transcribed from docs/examination-of-conscience-10.md,
-- with the trailing "such as:" removed and typos corrected.
-- Commandments 6 and 9 have no Offenses in the source. Where the source has no sub-headings
-- (the Fifth, the Seventh and Tenth, the Eighth), Offenses are in no category. The Third's
-- heading names an act, so it is an Offense, not a category (see GLOSSARY.md).
-- Editing text inserts a new row; the old one remains until `npm run db:reset`.

INSERT INTO offense_categories (commandment_id, text)
SELECT c.id, oc.text
FROM (VALUES
  (1, 'Sins which detract from the honor and worship due to God'),
  (1, 'Those against Faith'),
  (1, 'Those against Hope'),
  (1, 'Those against Charity'),
  (2, 'All irreverence towards God''s most Holy Name'),
  (4, 'For Parents'),
  (4, 'For Husbands and Wives'),
  (4, 'For the Employed'),
  (4, 'For all')
) AS oc (commandment_number, text)
JOIN commandments c ON c.number = oc.commandment_number
ON CONFLICT (commandment_id, text) DO NOTHING;

-- Offenses in a category.
INSERT INTO offenses (commandment_id, offense_category_id, text)
SELECT c.id, oc.id, o.text
FROM (VALUES
  (1, 'Sins which detract from the honor and worship due to God', 'Neglect of Prayer'),
  (1, 'Sins which detract from the honor and worship due to God', 'Superstitious practices'),
  (1, 'Sins which detract from the honor and worship due to God', 'Divination'),
  (1, 'Sins which detract from the honor and worship due to God', 'Consulting fortune-tellers'),
  (1, 'Sins which detract from the honor and worship due to God', 'Attaching undue importance to dreams, omens'),
  (1, 'Sins which detract from the honor and worship due to God', 'Tempting God by exposing one''s self to danger of soul, life or health, without grave cause'),
  (1, 'Sins which detract from the honor and worship due to God', 'Sacrilege'),
  (1, 'Sins which detract from the honor and worship due to God', 'Profane or superstitious use of blessed objects'),
  (1, 'Sins which detract from the honor and worship due to God', 'Profanation of places or things consecrated to God'),
  (1, 'Sins which detract from the honor and worship due to God', 'Receiving the Sacraments in a state of mortal sin'),
  (1, 'Those against Faith', 'Willful doubt of any article of Faith'),
  (1, 'Those against Faith', 'Reading or circulating books or writings against Catholic belief or practice'),
  (1, 'Those against Faith', 'Knowingly joining in schismatic or heretical worship'),
  (1, 'Those against Faith', 'Denying one''s religion'),
  (1, 'Those against Faith', 'Neglecting means of religious instruction'),
  (1, 'Those against Hope', 'Despair of God''s mercy, or want of confidence in power of His Grace to support us in trouble or temptation'),
  (1, 'Those against Hope', 'Murmuring against God''s providence'),
  (1, 'Those against Hope', 'Presuming on God''s mercy, or on the supposed efficacy of certain pious practices, in order to continue in sin'),
  (1, 'Those against Charity', 'Willfully rebellious thoughts against God'),
  (1, 'Those against Charity', 'Boasting of sin'),
  (1, 'Those against Charity', 'Violating God''s law, or omitting good works, through human respect'),
  (2, 'All irreverence towards God''s most Holy Name', 'Cursing and profane swearing'),
  (2, 'All irreverence towards God''s most Holy Name', 'False, unlawful and unnecessary oaths'),
  (2, 'All irreverence towards God''s most Holy Name', 'Membership in societies condemned by the Church'),
  (2, 'All irreverence towards God''s most Holy Name', 'Breaking or deferring lawful vows'),
  (2, 'All irreverence towards God''s most Holy Name', 'Irreverence in Divine Service, and in churches and holy places even when service is not going on.'),
  (4, 'For Parents', 'Hating their children'),
  (4, 'For Parents', 'Cursing them'),
  (4, 'For Parents', 'Giving scandal to them by cursing, drinking, etc.'),
  (4, 'For Parents', 'Allowing them to grow up in ignorance, idleness, or sin'),
  (4, 'For Parents', 'Showing habitual partiality without cause'),
  (4, 'For Parents', 'Deferring their children''s Baptism'),
  (4, 'For Parents', 'Neglecting to watch over their bodily health, their religious instruction, the company they keep, the books they read, etc.'),
  (4, 'For Parents', 'Failing to correct them when needful'),
  (4, 'For Parents', 'Being harsh or cruel in correction'),
  (4, 'For Parents', 'Sending children to Protestant and other dangerous schools.'),
  (4, 'For Husbands and Wives', 'Ill-usage'),
  (4, 'For Husbands and Wives', 'Putting obstacles to the fulfillment of religious duties'),
  (4, 'For Husbands and Wives', 'Want of gentleness and consideration in regard to each other''s faults'),
  (4, 'For Husbands and Wives', 'Unreasonable jealousy'),
  (4, 'For Husbands and Wives', 'Neglect of household duties'),
  (4, 'For Husbands and Wives', 'Sulkiness'),
  (4, 'For Husbands and Wives', 'Injurious words'),
  (4, 'For the Employed', 'Disrespect to employers'),
  (4, 'For the Employed', 'Want of obedience in matters wherein one has bound one''s self to obey'),
  (4, 'For the Employed', 'Waste of time'),
  (4, 'For the Employed', 'Neglect of work'),
  (4, 'For the Employed', 'Waste of employer''s property, by dishonesty, carelessness, or neglect'),
  (4, 'For all', 'Contempt for the laws of our State and Country, as well as the Church'),
  (4, 'For all', 'Disobedience to lawful authority')
) AS o (commandment_number, category_text, text)
JOIN commandments c ON c.number = o.commandment_number
JOIN offense_categories oc ON oc.commandment_id = c.id AND oc.text = o.category_text
ON CONFLICT (commandment_id, text) DO NOTHING;

-- Offenses in no category.
INSERT INTO offenses (commandment_id, text)
SELECT c.id, o.text
FROM (VALUES
  (3, 'Neglect to hear Mass on Sundays and Holy days of Obligation'),
  (3, 'Working or making others work without necessity on such days.'),
  (5, 'Unjust taking of human life (and hence, indirectly and implicitly, violence in thought, word, or act which may lead thereto)'),
  (5, 'Exposing life or limb to danger without reasonable cause'),
  (5, 'Carelessness in leaving about poisons, dangerous drugs, weapons, etc.'),
  (5, 'Desires of revenge'),
  (5, 'Quarrels'),
  (5, 'Fights'),
  (5, 'Showing aversion or contempt for others'),
  (5, 'Refusing to speak to them when addressed'),
  (5, 'Ignoring offers of reconciliation, especially between relatives'),
  (5, 'Cherishing an unforgiving spirit'),
  (5, 'Raillery and ridicule'),
  (5, 'Insults'),
  (5, 'Irritating words and actions'),
  (5, 'Sadness at another''s prosperity'),
  (5, 'Rejoicing over another''s misfortune'),
  (5, 'Jealousy at attentions shown to others'),
  (5, 'Tyrannical behavior'),
  (5, 'Inducing others to sin by word or example'),
  (5, 'Gluttony'),
  (5, 'Drunkenness'),
  (5, 'Rash use of opiates'),
  (5, 'Injury to health by over-indulgence'),
  (5, 'Giving drink to others knowing that they will abuse it'),
  (8, 'Lying'),
  (8, 'Perjury'),
  (8, 'Frauds, public and private, such as at elections, etc.'),
  (8, 'Malicious falsehoods'),
  (8, 'Lies for unjust or bad ends'),
  (8, 'Lies against character, especially if told publicly'),
  (8, 'Revealing secrets'),
  (8, 'Publishing discreditable secrets about others'),
  (8, 'Refusing or delaying to restore the good name we have blackened'),
  (8, 'Slander or detraction, and encouraging these in others'),
  (8, 'Baseless accusations, groundless suspicions, rash judgements of others, in our own mind')
) AS o (commandment_number, text)
JOIN commandments c ON c.number = o.commandment_number
ON CONFLICT (commandment_id, text) DO NOTHING;

-- The source gives one list for the Seventh and Tenth. Each Commandment gets its own Offenses
-- with this wording (see docs/adr/0002-offenses-belong-to-one-commandment.md). Rows match on
-- text, so fix a wording with an UPDATE migration, not by editing it here alone.
INSERT INTO offenses (commandment_id, text)
SELECT c.id, o.text
FROM (VALUES
  ('Stealing (What value? What damage done to property or interest?)'),
  ('Possession of ill-gotten goods'),
  ('Exorbitant prices'),
  ('False weights and measures'),
  ('Cheating'),
  ('Adulteration of wares'),
  ('Careless or malicious injury to the property of others'),
  ('Cheating at play'),
  ('Appropriation of what is lent or found without reasonable pains to return it or to find its owner'),
  ('Concealment of fraud, theft, or damage when in duty bound to give information'),
  ('Petty thefts'),
  ('Culpable delay in paying lawful debts, of restitution, when able to make it'),
  ('Neglect to make reasonable efforts and sacrifices in this matter, e.g., by gradually laying up the amount required')
) AS o (text)
JOIN commandments c ON c.number IN (7, 10)
ON CONFLICT (commandment_id, text) DO NOTHING;

INSERT INTO church_precepts (number, text) VALUES
  (1,  'To hear Mass on Sundays, and Holy Days of Obligation'),
  (2,  'To confess one''s sins at least once a year'),
  (3,  'To receive the Holy Eucharist during the Easter time'),
  (4,  'To fast and abstain on the days appointed'),
  (5,  'To provide for the needs of the Church')
ON CONFLICT (number) DO UPDATE SET text = excluded.text;

INSERT INTO church_precept_questions (church_precept_id, question_position, text)
SELECT c.id, q.question_position, q.text
FROM (VALUES
  (1,  1, 'Have I neglected, without good reason, to hear Mass on Sundays and Holy Days of Obligation and to keep those days holy by avoiding all servile work?'),
  (2,  1, 'Have I omitted to confess my mortal sins at least once this year?'),
  (3,  1, 'Have I ommitted to make my Easter-duty? (That is, to receive Holy Communion worthily during Easteride - that is, on either Easter Sunday, Ascension Thursday, or some day between those two feasts)'),
  (4,  1, 'Have I failed to fast or abstain, without sufficient reason, on those days commanded to be so observed by the Church?'),
  (5,  1, 'Have I refused to contribute to the support of my Pastor, according to my means?'),
  (5,  2, 'Have I gone to Mass Sunday after Sunday, without giving anything to the collections?')
) AS q (church_precept_number, question_position, text)
JOIN church_precepts c ON c.number = q.church_precept_number
ON CONFLICT (church_precept_id, question_position) DO UPDATE SET text = excluded.text;
