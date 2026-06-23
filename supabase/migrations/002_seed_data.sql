-- ============================================================
-- Recovery Group — Demo Seed Data
-- Run AFTER 001_initial_schema.sql
-- Run in: Supabase SQL Editor → New Query → Run
-- ============================================================

-- Clear existing seed data (safe to re-run)
DELETE FROM chats;
DELETE FROM calls;
DELETE FROM leads;
DELETE FROM locations;

-- ─── Locations ────────────────────────────────────────────────────────────────

INSERT INTO locations (id, name, address, phone, business_hours, status, calendar_id, monday_board_id) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Downtown Physical Therapy',  '425 Market St, Suite 200, San Francisco, CA 94105', '(415) 555-0192', 'Mon–Fri 8am–6pm, Sat 9am–2pm', 'Active', 'downtown-pt@group.calendar.google.com',  '1234567890'),
  ('11111111-0000-0000-0000-000000000002', 'Westside PT & Wellness',     '1820 Divisadero St, San Francisco, CA 94115',         '(415) 555-0347', 'Mon–Fri 7am–7pm, Sat 8am–3pm',  'Active', 'westside-pt@group.calendar.google.com',  '2345678901'),
  ('11111111-0000-0000-0000-000000000003', 'North Shore Rehabilitation', '2100 Marina Blvd, San Francisco, CA 94123',           '(415) 555-0519', 'Mon–Fri 9am–5pm',               'Pilot',  'northshore-pt@group.calendar.google.com','3456789012');

-- ─── Leads ────────────────────────────────────────────────────────────────────

INSERT INTO leads (id, location_id, full_name, phone, email, source, status, reason, preferred_time, appointment_datetime, notes, created_at, updated_at) VALUES

-- New leads (today)
('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Robert Martinez',  '(415) 555-2847', 'r.martinez@email.com',    'Phone',        'New',       'Lower back pain after lifting injury',                 'Mon–Wed mornings after 9am',  NULL,                          '',                                                              NOW() - INTERVAL '2 hours',  NOW() - INTERVAL '2 hours'),
('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Jennifer Walsh',   '(415) 555-6103', 'jen.walsh@gmail.com',     'Website Chat', 'New',       'Post ACL surgery rehabilitation',                     'Afternoons, any day',         NULL,                          'Surgery was 6 weeks ago. Has PT notes from surgeon.',       NOW() - INTERVAL '1 hour',   NOW() - INTERVAL '1 hour'),
('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'Thomas Nguyen',    '(415) 555-8821', 'tnguyen@work.com',        'Phone',        'New',       'Chronic neck pain and headaches',                     'Late afternoons after 4pm',   NULL,                          '',                                                              NOW() - INTERVAL '30 minutes',NOW() - INTERVAL '30 minutes'),
('22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', 'Frank Donovan',    '(415) 555-6683', 'fdonovan@work.com',       'Phone',        'New',       'Wrist pain from repetitive strain (desk job)',        'Lunch hours 12–2pm',         NULL,                          '',                                                              NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '3 hours'),
('22222222-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000001', 'Kevin Lawson',     '(415) 555-9987', 'kevin.l@gmail.com',       'Website Chat', 'New',       'Post-stroke rehab, arm weakness (3 weeks post-stroke)','Morning, any day',           NULL,                          'URGENT. Referred by neurologist Dr. Osei. High priority.', NOW() - INTERVAL '4 hours',  NOW() - INTERVAL '4 hours'),

-- Contacted leads
('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Amanda Foster',    '(415) 555-4429', 'afoster@email.com',       'Phone',        'Contacted', 'Rotator cuff injury, referred by Dr. Patel',          'Tue or Thu mornings before 11am',NULL,                       'Called back. Waiting for insurance verification. MRI next week.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'Derek Okafor',     '(415) 555-7734', 'dokafor@gmail.com',       'Website Chat', 'Contacted', 'Hip pain affecting gait, gradual onset',              'Flexible, prefers mornings',  NULL,                          'Chatted online. Intake form sent.',                         NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000003', 'Grace Liu',        '(415) 555-7721', 'grace.liu@email.com',     'Website Chat', 'Contacted', 'Vertigo and balance issues, suspected BPPV',          'Tuesdays or Thursdays',       NULL,                          'Needs vestibular-trained therapist. Lisa confirmed availability.', NOW() - INTERVAL '1 day',NOW() - INTERVAL '1 day'),
('22222222-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000001', 'Brian Torres',     '(415) 555-4419', 'btorres@outlook.com',     'Phone',        'Contacted', 'Shoulder impingement syndrome',                       'Afternoons after 3pm',        NULL,                          'Brief call made. Insurance auth pending with Blue Shield.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

-- Booked leads
('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 'Patricia Simmons', '(415) 555-1156', 'p.simmons@outlook.com',   'Phone',        'Booked',    'Knee osteoarthritis management',                      'Wednesdays at 10am',          NOW() + INTERVAL '3 days',    'Initial eval booked. New patient paperwork sent.',         NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002', 'Michael Brandt',   '(415) 555-9922', 'mbrandt@email.com',       'Phone',        'Booked',    'Ankle sprain from soccer, 1 week post-injury',       'Any weekday morning',         NOW() + INTERVAL '2 days',    '',                                                          NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000003', 'Nancy Kim',        '(415) 555-3387', 'nancy.kim@email.com',     'Website Chat', 'Booked',    'Post-op shoulder rehab (labrum repair, 8 weeks post-op)','Monday or Friday mornings', NOW() + INTERVAL '1 day',     'Has surgical report and surgeon rehab protocol.',           NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001', 'Carlos Reyes',     '(415) 555-6644', 'creyes@work.com',         'Phone',        'Booked',    'Sciatica and lumbar disc herniation (L4-L5)',         'Thursdays after 2pm',         NOW() + INTERVAL '4 days',    'MRI shows L4-L5 herniation. Referred by PCP.',             NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('22222222-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000002', 'Diana Patel',      '(415) 555-3341', 'diana.patel@email.com',   'Phone',        'Booked',    'Plantar fasciitis, runner',                           'Early morning before 8:30am', NOW() + INTERVAL '2 days',    'Active runner, motivated. Wants to return to training.',    NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('22222222-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000002', 'Rachel Huang',     '(415) 555-8876', 'rhuang@email.com',        'Website Chat', 'Booked',    'Cervical radiculopathy, C5-C6 (MRI confirmed)',      'Wed or Fri afternoons',       NOW() + INTERVAL '3 days',    'MRI and neurologist referral in hand. Right arm tingling.', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

-- Completed leads
('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'Helen Park',       '(415) 555-2210', 'helenpark@gmail.com',     'Phone',        'Completed', 'Balance and fall prevention',                         'Weekday mornings',            NOW() - INTERVAL '12 days',   'Initial evaluation completed. 12-session treatment plan approved.', NOW() - INTERVAL '17 days',NOW() - INTERVAL '12 days'),
('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000002', 'James Whitfield',  '(415) 555-8890', 'jwhitfield@email.com',    'Website Chat', 'Completed', 'Tennis elbow (lateral epicondylitis)',                'Mon–Thu afternoons',          NOW() - INTERVAL '14 days',   'Eval completed. 8-session plan approved by insurance.',     NOW() - INTERVAL '19 days',NOW() - INTERVAL '14 days'),
('22222222-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000003', 'Maria Santos',     '(415) 555-2298', 'msantos@email.com',       'Phone',        'Completed', 'Post-partum pelvic floor therapy',                   'Weekday mornings',            NOW() - INTERVAL '10 days',   'Initial evaluation done. Ongoing treatment plan started.',  NOW() - INTERVAL '15 days',NOW() - INTERVAL '10 days'),

-- Lost leads
('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', 'Sandra Webb',      '(415) 555-5571', 'swebb@email.com',         'Phone',        'Lost',      'Lower back pain',                                     'Not stated',                  NULL,                          'Could not reach after 3 attempts. Insurance coverage issue.',NOW() - INTERVAL '12 days',NOW() - INTERVAL '9 days'),
('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000002', 'Aaron Mitchell',   '(415) 555-4432', 'amitchell@gmail.com',     'Phone',        'Lost',      'Post-marathon knee pain',                             'Weekends only',               NULL,                          'Needed weekend appointments only — unable to accommodate.', NOW() - INTERVAL '14 days',NOW() - INTERVAL '13 days');

-- ─── Calls ────────────────────────────────────────────────────────────────────

INSERT INTO calls (id, lead_id, location_id, date_time, duration_minutes, outcome, transcript, summary) VALUES

('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '2 hours', 4, 'Not Booked',
 'AI: Thank you for calling Downtown Physical Therapy. How can I help you today?
Patient: Hi, I''m having really bad lower back pain after I was moving furniture last weekend. I can barely sit at my desk.
AI: I''m sorry to hear that. Can I get your name and a good phone number?
Patient: Sure, Robert Martinez, (415) 555-2847.
AI: Thank you Robert. How would you rate the pain 1–10, and does it radiate anywhere?
Patient: About a 7. Sometimes it shoots down my leg a bit.
AI: That shooting pain is important — our therapists will want to evaluate that. What times work best for you?
Patient: Monday through Wednesday mornings, after 9am.
AI: Perfect. Someone will follow up shortly to get you booked. Anything else?
Patient: No that''s everything, thanks.',
 'Robert Martinez called about lower back pain (7/10) after a furniture-moving injury. Reports radicular symptoms down one leg. Prefers Mon–Wed mornings after 9am. Care coordinator to follow up and book.'),

('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '2 days', 6, 'Not Booked',
 'AI: Thank you for calling Downtown Physical Therapy. How can I assist you today?
Patient: Hi, I''m Amanda Foster. I was referred by Dr. Patel for a rotator cuff issue.
AI: Hi Amanda, Dr. Patel''s patients are always a priority. Can you tell me about your shoulder?
Patient: I''ve had pain and limited range of motion for about three months. Hurts most reaching overhead or behind my back.
AI: That pattern is classic for a rotator cuff injury. Have you had any imaging?
Patient: I have an MRI scheduled for next week.
AI: We can begin an initial eval even before imaging results. What times work best?
Patient: Only Tuesdays or Thursday mornings, before 11am.
AI: Noted. We''ll have someone call to finalize booking once your insurance is verified.',
 'Amanda Foster called after referral from Dr. Patel for a rotator cuff injury. 3 months of pain with limited overhead reach. MRI next week. Available Tue/Thu mornings before 11am. Insurance verification pending.'),

('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '4 days', 5, 'Booked',
 'AI: Thank you for calling Downtown Physical Therapy. How can I help?
Patient: Hi there. I''m looking to make an appointment for knee pain. I have osteoarthritis and it''s flaring up.
AI: I''m sorry to hear that. Can I get your name?
Patient: Patricia Simmons, (415) 555-1156.
AI: How long has it been flaring up?
Patient: About three weeks. My orthopedist said PT is the next step.
AI: We have Wednesday at 10am available with Emily Rodriguez. Shall I book that?
Patient: That would be perfect, yes.
AI: Wonderful. You''re booked. I''ll send new patient forms to p.simmons@outlook.com.',
 'Patricia Simmons booked for Wednesday at 10am with Emily Rodriguez for knee osteoarthritis management. Referred by orthopedist. New patient forms sent.'),

('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002',
 NOW() - INTERVAL '5 days', 4, 'Booked',
 'AI: Thanks for calling Westside PT and Wellness. What can I help you with?
Patient: Hey, I rolled my ankle badly at a soccer game last week. My doctor said to come in for PT.
AI: Sorry to hear that. Can I get your name?
Patient: Michael Brandt, (415) 555-9922.
AI: Pain level currently, and are you walking on it?
Patient: About a 5 now. Down from an 8 right after. Walking but stiff and swollen.
AI: We have a 9am slot on Tuesday with David Kim who works with athletes. Does that work?
Patient: Perfect, yeah.
AI: Booked. Confirmation going to mbrandt@email.com.',
 'Michael Brandt booked for Tuesday at 9am with David Kim for an ankle sprain from soccer. Pain improving (5/10, down from 8/10). Still swollen. Confirmation sent.'),

('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '8 days', 7, 'Booked',
 'AI: Good morning, Downtown Physical Therapy. How can I help?
Patient: Good morning. I have sciatica and a lumbar disc issue — my PCP just referred me to PT.
AI: Can I get your name?
Patient: Carlos Reyes, (415) 555-6644.
AI: Do you have MRI results?
Patient: Yes, I have a digital copy I can send.
AI: What times work best?
Patient: Thursday afternoons after 2pm.
AI: Thursday at 2pm is available. Does that work?
Patient: That''s great, yes.
AI: Booked. Please bring your MRI report.',
 'Carlos Reyes booked for Thursday at 2pm for sciatica and L4-L5 disc herniation, referred by PCP. Has MRI report to bring. Prefers Thursday afternoons.'),

('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '12 days', 1, 'Voicemail',
 '[After-hours voicemail — transcribed]
Patient: Hi this is Sandra Webb calling about lower back pain. I was looking to make an appointment. My number is (415) 555-5571. I''m available most mornings. Thanks.',
 'Sandra Webb left a voicemail after hours about lower back pain. Available mornings. Three subsequent call-back attempts unsuccessful. Marked Lost.'),

('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000002',
 NOW() - INTERVAL '14 days', 3, 'Not Booked',
 'AI: Thanks for calling Westside PT and Wellness. How can I help?
Patient: Hi, I''m a runner and I hurt my knee after a marathon. Looking for PT.
AI: Do you have a preference on appointment times?
Patient: I can only do weekends, honestly.
AI: Unfortunately we''re only open Monday through Friday at this location.
Patient: Oh, that''s a problem. I really can''t do weekdays.
AI: I understand. I can have someone call you, but weekend slots are very limited.
Patient: No that''s alright, I''ll try elsewhere. Thanks.',
 'Aaron Mitchell called about post-marathon knee pain but requires weekend appointments only. Unable to accommodate. Marked Lost.'),

('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
 NOW() - INTERVAL '30 minutes', 5, 'Not Booked',
 'AI: Thank you for calling North Shore Rehabilitation. How can I assist you?
Patient: Hi, Thomas Nguyen. I''ve been having chronic neck pain and headaches for a few months.
AI: Cervicogenic headaches respond very well to physical therapy. Can I get your contact info?
Patient: (415) 555-8821. Email tnguyen@work.com.
AI: What times generally work for you?
Patient: Late afternoons, after 4pm ideally.
AI: Noted. Our coordinator will follow up — late afternoon slots fill quickly.',
 'Thomas Nguyen called about chronic neck pain and headaches (possibly cervicogenic). Available late afternoons after 4pm only. Care coordinator to follow up. Not yet booked.'),

('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '3 hours', 4, 'Not Booked',
 'AI: Thank you for calling Downtown Physical Therapy. How can I help?
Patient: Hi, Frank Donovan. I''ve been having wrist pain from typing all day for about two months.
AI: Repetitive strain injuries are very common and treatable. Any numbness or tingling?
Patient: A bit of both, especially at night.
AI: That nighttime component is worth flagging — could be carpal tunnel related. What times work?
Patient: Lunch hours, around noon to 2pm.
AI: I''ve noted that. Our coordinator will reach out shortly.',
 'Frank Donovan called about wrist pain from repetitive strain (2 months). Reports ache and tingling, worse at night — possible carpal tunnel component. Available lunch hours 12–2pm.'),

('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000001',
 NOW() - INTERVAL '2 days', 5, 'Not Booked',
 'AI: Good morning, Downtown Physical Therapy. How can I help?
Patient: Hi, Brian Torres. I''ve been having shoulder pain. My doctor mentioned shoulder impingement.
AI: Shoulder impingement responds well to PT. Can I get your contact info?
Patient: (415) 555-4419, btorres@outlook.com.
AI: Any imaging done?
Patient: Not yet. Doctor said to try PT first.
AI: What times work best?
Patient: Afternoons after 3pm.
AI: Got it. We''ll get your insurance details and have someone call you to schedule.',
 'Brian Torres called about shoulder impingement (no imaging — physician directed PT first). Available afternoons after 3pm. Insurance authorization pending.');

-- ─── Chats ────────────────────────────────────────────────────────────────────

INSERT INTO chats (id, lead_id, location_id, date_time, transcript, summary) VALUES

('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
 NOW() - INTERVAL '1 hour',
 'Visitor: Hi, I''m looking for PT help after ACL surgery. Had surgery about 6 weeks ago.
Assistant: Hi! Post-ACL rehab is something our team specializes in. 6 weeks is a great time to start. Can I get your name?
Visitor: Jennifer Walsh, jen.walsh@gmail.com, (415) 555-6103.
Assistant: Has your surgeon cleared you for PT?
Visitor: Yes, cleared. I have a booklet from the hospital. Afternoons work best.
Assistant: A coordinator will reach out today. What are your main goals?
Visitor: Getting range of motion back. Eventually want to return to running.
Assistant: Both very achievable post-ACL. Expect a call within a few hours!',
 'Jennifer Walsh chatted about post-ACL rehab (6 weeks post-op, surgeon-cleared). Goals: restore ROM and return to running. Prefers afternoons. Coordinator to call and schedule.'),

('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002',
 NOW() - INTERVAL '3 days',
 'Visitor: Hello, I''ve been having hip pain affecting how I walk. Can PT help?
Assistant: Hip pain affecting gait is absolutely something we address. What''s your name?
Visitor: Derek Okafor. Phone (415) 555-7734. Email dokafor@gmail.com.
Assistant: How long, and did something trigger it?
Visitor: About 4 months. Gradual — no specific injury.
Assistant: Mornings or afternoons better?
Visitor: Mornings, flexible on days.
Assistant: Sending a short intake form now. A coordinator will call to schedule.',
 'Derek Okafor chatted about gradual hip pain affecting gait (4 months, no specific injury). Prefers mornings. Intake form sent. Coordinator to call.'),

('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000003',
 NOW() - INTERVAL '7 days',
 'Visitor: Hi, I need post-surgical PT for a shoulder labrum repair. 8 weeks post-op.
Assistant: Shoulder labrum rehab is a great fit — 8 weeks is when structured therapy typically begins. Can I get your contact?
Visitor: Nancy Kim, (415) 555-3387, nancy.kim@email.com.
Assistant: Do you have a surgeon''s PT protocol?
Visitor: Yes, surgical report and a rehab protocol.
Assistant: Best days and times?
Visitor: Monday or Friday mornings.
Assistant: I have Monday morning available at North Shore. Does that work?
Visitor: Yes, that works perfectly.
Assistant: Booked! Confirmation going to nancy.kim@email.com.',
 'Nancy Kim booked Monday morning at North Shore for post-labrum repair rehab (8 weeks post-op). Has surgical report and surgeon''s rehab protocol.'),

('44444444-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000002',
 NOW() - INTERVAL '19 days',
 'Visitor: I''ve been dealing with tennis elbow for about 3 months. Can PT help?
Assistant: Absolutely — lateral epicondylitis responds really well to PT. What''s your name?
Visitor: James Whitfield, (415) 555-8890, jwhitfield@email.com.
Assistant: Dominant arm? Still playing?
Visitor: Dominant arm. Haven''t played in two months. Pain even with typing.
Assistant: Mon–Thu afternoons work?
Visitor: Yes, afternoons.
Assistant: Setting you up with one of our upper extremity specialists. Expect a call to schedule.',
 'James Whitfield chatted about tennis elbow (3 months, dominant arm). Stopped playing, pain with daily activities. Set up with upper extremity specialist. Mon–Thu afternoons preferred.'),

('44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000003',
 NOW() - INTERVAL '1 day',
 'Visitor: I''ve been having vertigo and feeling off-balance. My doctor mentioned vestibular therapy. Do you offer that?
Assistant: Yes — vestibular rehab is very effective for vertigo. Has your doctor given you a diagnosis?
Visitor: BPPV, they think, pending specialist confirmation.
Assistant: BPPV responds excellently to repositioning maneuvers. Name and contact?
Visitor: Grace Liu, (415) 555-7721, grace.liu@email.com.
Assistant: Best days?
Visitor: Tuesdays or Thursdays.
Assistant: Someone from our North Shore location will reach out — they have a vestibular-trained therapist.',
 'Grace Liu chatted about suspected BPPV. Seeking vestibular rehab. Prefers Tue/Thu. Referred to North Shore which has a vestibular-trained therapist.'),

('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000002',
 NOW() - INTERVAL '9 days',
 'Visitor: I have neck and arm pain — my neurologist said it might be cervical radiculopathy and I should try PT before any procedures.
Assistant: Cervical radiculopathy is very common and PT is a very effective first step. What''s your name?
Visitor: Rachel Huang, (415) 555-8876, rhuang@email.com.
Assistant: Tingling or aching? One arm or both?
Visitor: Tingling and some weakness in my right arm. MRI shows C5-C6 involvement.
Assistant: Wed or Fri afternoons work?
Visitor: Yes, afternoons.
Assistant: I have Friday at 2pm with David Kim who specializes in cervical conditions. Shall I book that?
Visitor: Yes please.
Assistant: Booked! Confirmation to rhuang@email.com. Please bring your MRI and neurologist''s referral.',
 'Rachel Huang booked Friday at 2pm with David Kim for cervical radiculopathy (C5-C6, MRI confirmed). Right arm tingling and weakness. Referred by neurologist.');
