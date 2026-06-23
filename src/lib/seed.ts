import type { Location, Lead, Call, Chat, TeamMember } from "./types";

export const locations: Location[] = [
  {
    id: "loc-1",
    name: "Downtown Physical Therapy",
    address: "425 Market St, Suite 200, San Francisco, CA 94105",
    phone: "(415) 555-0192",
    businessHours: "Mon–Fri 8am–6pm, Sat 9am–2pm",
    status: "Active",
    calendarId: "downtown-pt@group.calendar.google.com",
    mondayBoardId: "1234567890",
  },
  {
    id: "loc-2",
    name: "Westside PT & Wellness",
    address: "1820 Divisadero St, San Francisco, CA 94115",
    phone: "(415) 555-0347",
    businessHours: "Mon–Fri 7am–7pm, Sat 8am–3pm",
    status: "Active",
    calendarId: "westside-pt@group.calendar.google.com",
    mondayBoardId: "2345678901",
  },
  {
    id: "loc-3",
    name: "North Shore Rehabilitation",
    address: "2100 Marina Blvd, San Francisco, CA 94123",
    phone: "(415) 555-0519",
    businessHours: "Mon–Fri 9am–5pm",
    status: "Pilot",
    calendarId: "northshore-pt@group.calendar.google.com",
    mondayBoardId: "3456789012",
  },
];

export const teamMembers: TeamMember[] = [
  { id: "tm-1", name: "Dr. Sarah Chen", role: "Clinical Director", email: "sarah.chen@recoverygroup.com", locationIds: ["loc-1", "loc-2", "loc-3"] },
  { id: "tm-2", name: "Marcus Johnson", role: "Front Desk Manager", email: "marcus.j@recoverygroup.com", locationIds: ["loc-1"] },
  { id: "tm-3", name: "Emily Rodriguez", role: "Care Coordinator", email: "emily.r@recoverygroup.com", locationIds: ["loc-1", "loc-2"] },
  { id: "tm-4", name: "David Kim", role: "Physical Therapist", email: "david.kim@recoverygroup.com", locationIds: ["loc-2"] },
  { id: "tm-5", name: "Lisa Thompson", role: "Receptionist", email: "lisa.t@recoverygroup.com", locationIds: ["loc-3"] },
];

export const leads: Lead[] = [
  {
    id: "lead-1",
    locationId: "loc-1",
    fullName: "Robert Martinez",
    phone: "(415) 555-2847",
    email: "r.martinez@email.com",
    source: "Phone",
    status: "New",
    reason: "Lower back pain after lifting injury",
    preferredTime: "Mon–Wed mornings after 9am",
    assignedTo: "tm-3",
    createdAt: "2026-06-22T08:14:00Z",
    updatedAt: "2026-06-22T08:14:00Z",
    notes: "",
  },
  {
    id: "lead-2",
    locationId: "loc-2",
    fullName: "Jennifer Walsh",
    phone: "(415) 555-6103",
    email: "jen.walsh@gmail.com",
    source: "Website Chat",
    status: "New",
    reason: "Post ACL surgery rehabilitation",
    preferredTime: "Afternoons, any day",
    assignedTo: "tm-4",
    createdAt: "2026-06-22T09:47:00Z",
    updatedAt: "2026-06-22T09:47:00Z",
    notes: "Surgery was 6 weeks ago. Has PT notes from surgeon.",
  },
  {
    id: "lead-3",
    locationId: "loc-3",
    fullName: "Thomas Nguyen",
    phone: "(415) 555-8821",
    email: "tnguyen@work.com",
    source: "Phone",
    status: "New",
    reason: "Chronic neck pain and headaches",
    preferredTime: "Late afternoons after 4pm",
    assignedTo: "tm-5",
    createdAt: "2026-06-22T11:02:00Z",
    updatedAt: "2026-06-22T11:02:00Z",
    notes: "",
  },
  {
    id: "lead-4",
    locationId: "loc-1",
    fullName: "Amanda Foster",
    phone: "(415) 555-4429",
    email: "afoster@email.com",
    source: "Phone",
    status: "Contacted",
    reason: "Rotator cuff injury, referred by Dr. Patel",
    preferredTime: "Tue or Thu mornings before 11am",
    assignedTo: "tm-2",
    createdAt: "2026-06-20T14:30:00Z",
    updatedAt: "2026-06-21T10:15:00Z",
    notes: "Called back. Waiting for insurance verification. MRI next week.",
  },
  {
    id: "lead-5",
    locationId: "loc-2",
    fullName: "Derek Okafor",
    phone: "(415) 555-7734",
    email: "dokafor@gmail.com",
    source: "Website Chat",
    status: "Contacted",
    reason: "Hip pain affecting gait, gradual onset",
    preferredTime: "Flexible, prefers mornings",
    assignedTo: "tm-4",
    createdAt: "2026-06-19T16:22:00Z",
    updatedAt: "2026-06-20T09:00:00Z",
    notes: "Chatted online. Intake form sent.",
  },
  {
    id: "lead-6",
    locationId: "loc-1",
    fullName: "Patricia Simmons",
    phone: "(415) 555-1156",
    email: "p.simmons@outlook.com",
    source: "Phone",
    status: "Booked",
    reason: "Knee osteoarthritis management",
    preferredTime: "Wednesdays at 10am",
    appointmentDateTime: "2026-06-25T10:00:00Z",
    assignedTo: "tm-3",
    createdAt: "2026-06-18T09:45:00Z",
    updatedAt: "2026-06-18T11:30:00Z",
    notes: "Initial eval booked. New patient paperwork sent.",
  },
  {
    id: "lead-7",
    locationId: "loc-2",
    fullName: "Michael Brandt",
    phone: "(415) 555-9922",
    email: "mbrandt@email.com",
    source: "Phone",
    status: "Booked",
    reason: "Ankle sprain from soccer, 1 week post-injury",
    preferredTime: "Any weekday morning",
    appointmentDateTime: "2026-06-24T09:00:00Z",
    assignedTo: "tm-4",
    createdAt: "2026-06-17T13:20:00Z",
    updatedAt: "2026-06-17T15:00:00Z",
    notes: "",
  },
  {
    id: "lead-8",
    locationId: "loc-3",
    fullName: "Nancy Kim",
    phone: "(415) 555-3387",
    email: "nancy.kim@email.com",
    source: "Website Chat",
    status: "Booked",
    reason: "Post-op shoulder rehab (labrum repair, 8 weeks post-op)",
    preferredTime: "Monday or Friday mornings",
    appointmentDateTime: "2026-06-23T09:30:00Z",
    assignedTo: "tm-5",
    createdAt: "2026-06-15T10:10:00Z",
    updatedAt: "2026-06-15T14:20:00Z",
    notes: "Has surgical report and surgeon rehab protocol.",
  },
  {
    id: "lead-9",
    locationId: "loc-1",
    fullName: "Carlos Reyes",
    phone: "(415) 555-6644",
    email: "creyes@work.com",
    source: "Phone",
    status: "Booked",
    reason: "Sciatica and lumbar disc herniation (L4-L5)",
    preferredTime: "Thursdays after 2pm",
    appointmentDateTime: "2026-06-26T14:00:00Z",
    assignedTo: "tm-2",
    createdAt: "2026-06-14T11:00:00Z",
    updatedAt: "2026-06-14T13:45:00Z",
    notes: "MRI shows L4-L5 herniation. Referred by PCP.",
  },
  {
    id: "lead-10",
    locationId: "loc-1",
    fullName: "Helen Park",
    phone: "(415) 555-2210",
    email: "helenpark@gmail.com",
    source: "Phone",
    status: "Completed",
    reason: "Balance and fall prevention",
    preferredTime: "Weekday mornings",
    appointmentDateTime: "2026-06-10T09:00:00Z",
    assignedTo: "tm-3",
    createdAt: "2026-06-05T08:30:00Z",
    updatedAt: "2026-06-10T11:00:00Z",
    notes: "Initial evaluation completed. 12-session treatment plan approved.",
  },
  {
    id: "lead-11",
    locationId: "loc-2",
    fullName: "James Whitfield",
    phone: "(415) 555-8890",
    email: "jwhitfield@email.com",
    source: "Website Chat",
    status: "Completed",
    reason: "Tennis elbow (lateral epicondylitis)",
    preferredTime: "Mon–Thu afternoons",
    appointmentDateTime: "2026-06-08T14:00:00Z",
    assignedTo: "tm-4",
    createdAt: "2026-06-03T15:20:00Z",
    updatedAt: "2026-06-08T16:30:00Z",
    notes: "Eval completed. 8-session plan approved by insurance.",
  },
  {
    id: "lead-12",
    locationId: "loc-1",
    fullName: "Sandra Webb",
    phone: "(415) 555-5571",
    email: "swebb@email.com",
    source: "Phone",
    status: "Lost",
    reason: "Lower back pain",
    preferredTime: "Not stated",
    assignedTo: "tm-2",
    createdAt: "2026-06-10T16:00:00Z",
    updatedAt: "2026-06-13T09:00:00Z",
    notes: "Could not reach after 3 attempts. Insurance coverage issue.",
  },
  {
    id: "lead-13",
    locationId: "loc-2",
    fullName: "Aaron Mitchell",
    phone: "(415) 555-4432",
    email: "amitchell@gmail.com",
    source: "Phone",
    status: "Lost",
    reason: "Post-marathon knee pain",
    preferredTime: "Weekends only",
    assignedTo: "tm-4",
    createdAt: "2026-06-08T10:00:00Z",
    updatedAt: "2026-06-09T11:00:00Z",
    notes: "Needed weekend appointments only — unable to accommodate.",
  },
  {
    id: "lead-14",
    locationId: "loc-3",
    fullName: "Grace Liu",
    phone: "(415) 555-7721",
    email: "grace.liu@email.com",
    source: "Website Chat",
    status: "Contacted",
    reason: "Vertigo and balance issues, suspected BPPV",
    preferredTime: "Tuesdays or Thursdays",
    assignedTo: "tm-5",
    createdAt: "2026-06-21T13:00:00Z",
    updatedAt: "2026-06-21T16:30:00Z",
    notes: "Needs vestibular-trained therapist. Lisa confirmed availability.",
  },
  {
    id: "lead-15",
    locationId: "loc-1",
    fullName: "Frank Donovan",
    phone: "(415) 555-6683",
    email: "fdonovan@work.com",
    source: "Phone",
    status: "New",
    reason: "Wrist pain from repetitive strain (desk job)",
    preferredTime: "Lunch hours 12–2pm",
    createdAt: "2026-06-22T10:30:00Z",
    updatedAt: "2026-06-22T10:30:00Z",
    notes: "",
  },
  {
    id: "lead-16",
    locationId: "loc-2",
    fullName: "Diana Patel",
    phone: "(415) 555-3341",
    email: "diana.patel@email.com",
    source: "Phone",
    status: "Booked",
    reason: "Plantar fasciitis, runner",
    preferredTime: "Early morning before 8:30am",
    appointmentDateTime: "2026-06-24T08:00:00Z",
    assignedTo: "tm-4",
    createdAt: "2026-06-16T14:00:00Z",
    updatedAt: "2026-06-16T15:30:00Z",
    notes: "Active runner, motivated. Wants to return to training.",
  },
  {
    id: "lead-17",
    locationId: "loc-1",
    fullName: "Kevin Lawson",
    phone: "(415) 555-9987",
    email: "kevin.l@gmail.com",
    source: "Website Chat",
    status: "New",
    reason: "Post-stroke rehab, arm weakness (3 weeks post-stroke)",
    preferredTime: "Morning, any day",
    createdAt: "2026-06-22T07:55:00Z",
    updatedAt: "2026-06-22T07:55:00Z",
    notes: "URGENT. Referred by neurologist Dr. Osei. High priority intake.",
  },
  {
    id: "lead-18",
    locationId: "loc-3",
    fullName: "Maria Santos",
    phone: "(415) 555-2298",
    email: "msantos@email.com",
    source: "Phone",
    status: "Completed",
    reason: "Post-partum pelvic floor therapy",
    preferredTime: "Weekday mornings",
    appointmentDateTime: "2026-06-12T10:00:00Z",
    assignedTo: "tm-5",
    createdAt: "2026-06-07T09:00:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
    notes: "Initial evaluation done. Ongoing treatment plan started.",
  },
  {
    id: "lead-19",
    locationId: "loc-1",
    fullName: "Brian Torres",
    phone: "(415) 555-4419",
    email: "btorres@outlook.com",
    source: "Phone",
    status: "Contacted",
    reason: "Shoulder impingement syndrome",
    preferredTime: "Afternoons after 3pm",
    assignedTo: "tm-2",
    createdAt: "2026-06-20T11:30:00Z",
    updatedAt: "2026-06-21T14:00:00Z",
    notes: "Brief call made. Insurance auth pending with Blue Shield.",
  },
  {
    id: "lead-20",
    locationId: "loc-2",
    fullName: "Rachel Huang",
    phone: "(415) 555-8876",
    email: "rhuang@email.com",
    source: "Website Chat",
    status: "Booked",
    reason: "Cervical radiculopathy, C5-C6 (MRI confirmed)",
    preferredTime: "Wed or Fri afternoons",
    appointmentDateTime: "2026-06-25T14:00:00Z",
    assignedTo: "tm-4",
    createdAt: "2026-06-13T16:00:00Z",
    updatedAt: "2026-06-13T17:30:00Z",
    notes: "MRI and neurologist referral in hand. Right arm tingling.",
  },
];

export const calls: Call[] = [
  {
    id: "call-1",
    leadId: "lead-1",
    locationId: "loc-1",
    dateTime: "2026-06-22T08:14:00Z",
    duration: 4,
    outcome: "Not Booked",
    transcript: `AI: Thank you for calling Downtown Physical Therapy. This is the virtual receptionist. How can I help you today?
Patient: Hi, yeah, I'm having really bad lower back pain after I was moving furniture last weekend. I can barely sit at my desk.
AI: I'm sorry to hear that. Can I get your name and a good phone number?
Patient: Sure, Robert Martinez, (415) 555-2847.
AI: Thank you Robert. How would you rate the pain 1–10, and does it radiate anywhere?
Patient: About a 7. Sometimes it shoots down my leg a bit.
AI: That shooting pain is important — our therapists will want to evaluate that. What times work best for you?
Patient: Monday through Wednesday mornings, after 9am.
AI: Perfect. I've noted your preference and the radicular symptoms. Someone will follow up shortly to get you booked. Anything else?
Patient: No that's everything, thanks.
AI: Great. Have a good day, Robert.`,
    summary: "Robert Martinez called about lower back pain (7/10) after a furniture-moving injury 4 days ago. Reports occasional radicular symptoms down one leg. Prefers Mon–Wed mornings after 9am. Care coordinator to follow up and book.",
  },
  {
    id: "call-2",
    leadId: "lead-4",
    locationId: "loc-1",
    dateTime: "2026-06-20T14:30:00Z",
    duration: 6,
    outcome: "Not Booked",
    transcript: `AI: Thank you for calling Downtown Physical Therapy. How can I assist you today?
Patient: Hi, I'm Amanda Foster. I was referred by Dr. Patel for a rotator cuff issue.
AI: Hi Amanda, Dr. Patel's patients are always a priority. Can you tell me about your shoulder?
Patient: I've had pain and limited range of motion for about three months. Hurts most reaching overhead or behind my back.
AI: That pattern is classic for a rotator cuff injury. Have you had any imaging?
Patient: I have an MRI scheduled for next week.
AI: We can begin an initial eval even before imaging results. What times work best?
Patient: Only Tuesdays or Thursday mornings, before 11am.
AI: Noted. We'll have someone call to finalize booking once your insurance is verified.
Patient: Great, (415) 555-4429.
AI: Perfect. You'll hear from us soon.`,
    summary: "Amanda Foster called after referral from Dr. Patel for a rotator cuff injury. 3 months of pain with limited overhead reach. MRI next week. Available Tue/Thu mornings before 11am. Insurance verification pending before booking.",
  },
  {
    id: "call-3",
    leadId: "lead-6",
    locationId: "loc-1",
    dateTime: "2026-06-18T09:45:00Z",
    duration: 5,
    outcome: "Booked",
    transcript: `AI: Thank you for calling Downtown Physical Therapy. How can I help?
Patient: Hi there. I'm looking to make an appointment for knee pain. I have osteoarthritis and it's flaring up.
AI: I'm sorry to hear that. Can I get your name and contact info?
Patient: Patricia Simmons, (415) 555-1156.
AI: How long has it been flaring up?
Patient: About three weeks. My orthopedist said PT is the next step.
AI: We work with a lot of orthopedic referrals. What times work best?
Patient: Wednesdays at 10am would be ideal.
AI: We have Wednesday June 25th at 10am available with Emily Rodriguez. Shall I book that?
Patient: That would be perfect, yes.
AI: Wonderful. You're booked for June 25 at 10am. I'll send new patient forms to p.simmons@outlook.com. Is that right?
Patient: Yes, that's correct. Thank you.`,
    summary: "Patricia Simmons booked for June 25 at 10am with Emily Rodriguez for knee osteoarthritis management. Referred by orthopedist. New patient forms sent.",
  },
  {
    id: "call-4",
    leadId: "lead-7",
    locationId: "loc-2",
    dateTime: "2026-06-17T13:20:00Z",
    duration: 4,
    outcome: "Booked",
    transcript: `AI: Thanks for calling Westside PT and Wellness. What can I help you with?
Patient: Hey, I rolled my ankle pretty badly at a soccer game last week. My doctor said to come in for PT.
AI: Sorry to hear that. Can I get your name and contact?
Patient: Michael Brandt, (415) 555-9922, mbrandt@email.com.
AI: Pain level currently, and are you walking on it?
Patient: About a 5 now. Down from an 8 right after. Walking but stiff and a bit swollen.
AI: We have a 9am slot on Tuesday June 24 with David Kim who works with a lot of athletes. Does that work?
Patient: Perfect, yeah.
AI: Booked. Confirmation going to mbrandt@email.com.`,
    summary: "Michael Brandt booked June 24 at 9am with David Kim for an ankle sprain from soccer. Pain improving (5/10, down from 8/10). Still swollen. Confirmation sent.",
  },
  {
    id: "call-5",
    leadId: "lead-9",
    locationId: "loc-1",
    dateTime: "2026-06-14T11:00:00Z",
    duration: 7,
    outcome: "Booked",
    transcript: `AI: Good morning, Downtown Physical Therapy. How can I help?
Patient: Good morning. I have sciatica and a lumbar disc issue — my PCP just referred me to PT.
AI: Can I get your name and contact?
Patient: Carlos Reyes, (415) 555-6644.
AI: Do you have MRI results?
Patient: Yes, I have a digital copy I can send.
AI: What times work best?
Patient: Thursday afternoons after 2pm.
AI: Thursday June 26 at 2pm is available. Does that work?
Patient: That's great, yes.
AI: Booked. Please bring your MRI report. Address is 425 Market St, Suite 200.`,
    summary: "Carlos Reyes booked June 26 at 2pm for sciatica and L4-L5 disc herniation, referred by PCP. Has MRI report to bring. Prefers Thursday afternoons.",
  },
  {
    id: "call-6",
    leadId: "lead-12",
    locationId: "loc-1",
    dateTime: "2026-06-10T18:02:00Z",
    duration: 1,
    outcome: "Voicemail",
    transcript: `[After-hours voicemail — transcribed]
Patient: Hi this is Sandra Webb calling about lower back pain. I was looking to make an appointment. My number is (415) 555-5571. I'm available most mornings. Thanks.`,
    summary: "Sandra Webb left a voicemail after hours about lower back pain. Requested an appointment, available mornings. Three subsequent call-back attempts unsuccessful.",
  },
  {
    id: "call-7",
    leadId: "lead-13",
    locationId: "loc-2",
    dateTime: "2026-06-08T10:00:00Z",
    duration: 3,
    outcome: "Not Booked",
    transcript: `AI: Thanks for calling Westside PT and Wellness. How can I help?
Patient: Hi, I'm a runner and I hurt my knee after a marathon. Looking for PT.
AI: Do you have a preference on appointment times?
Patient: I can only do weekends, honestly. I work really long hours during the week.
AI: Unfortunately we're only open Monday through Friday at this location.
Patient: Oh, that's a problem. I really can't do weekdays.
AI: I understand. I can have someone call you, but weekend slots are very limited.
Patient: No that's alright, I'll try elsewhere. Thanks.`,
    summary: "Aaron Mitchell called about post-marathon knee pain but requires weekend appointments only. Unable to accommodate. Marked Lost.",
  },
  {
    id: "call-8",
    leadId: "lead-3",
    locationId: "loc-3",
    dateTime: "2026-06-22T11:02:00Z",
    duration: 5,
    outcome: "Not Booked",
    transcript: `AI: Thank you for calling North Shore Rehabilitation. How can I assist you?
Patient: Hi, Thomas Nguyen. I've been having chronic neck pain and headaches for a few months. Someone suggested PT might help.
AI: Cervicogenic headaches respond very well to physical therapy. Can I get your contact info?
Patient: (415) 555-8821. Email tnguyen@work.com.
AI: What times generally work for you?
Patient: Late afternoons, after 4pm ideally.
AI: Noted. Our coordinator will follow up — late afternoon slots fill quickly so please respond promptly.
Patient: Sounds good. Thanks.`,
    summary: "Thomas Nguyen called about chronic neck pain and headaches (possibly cervicogenic). Available late afternoons after 4pm only. Care coordinator to follow up. Not yet booked.",
  },
  {
    id: "call-9",
    leadId: "lead-15",
    locationId: "loc-1",
    dateTime: "2026-06-22T10:30:00Z",
    duration: 4,
    outcome: "Not Booked",
    transcript: `AI: Thank you for calling Downtown Physical Therapy. How can I help?
Patient: Hi, Frank Donovan. I've been having wrist pain from typing all day — it's gotten really bad lately.
AI: Repetitive strain injuries are very common and treatable. How long has this been going on?
Patient: About two months. Getting worse.
AI: Any numbness or tingling, or is it more of an ache?
Patient: A bit of both actually, especially at night.
AI: That nighttime component is worth flagging — could be carpal tunnel related. What times work for you?
Patient: Lunch hours, around noon to 2pm.
AI: I've noted that. Our coordinator will reach out shortly.`,
    summary: "Frank Donovan called about wrist pain from repetitive strain (2 months). Reports ache and tingling, worse at night — possible carpal tunnel component. Available lunch hours 12–2pm. Follow-up required.",
  },
  {
    id: "call-10",
    leadId: "lead-19",
    locationId: "loc-1",
    dateTime: "2026-06-20T11:30:00Z",
    duration: 5,
    outcome: "Not Booked",
    transcript: `AI: Good morning, Downtown Physical Therapy. How can I help?
Patient: Hi, Brian Torres. I've been having shoulder pain for a while. My doctor mentioned shoulder impingement.
AI: Shoulder impingement is very common and responds well to PT. Can I get your contact info?
Patient: (415) 555-4419, btorres@outlook.com.
AI: Any imaging done?
Patient: Not yet. Doctor said to try PT first.
AI: What times work best?
Patient: Afternoons after 3pm.
AI: Got it. We'll get your insurance details and have someone call you to schedule.
Patient: Okay, sounds good.`,
    summary: "Brian Torres called about shoulder impingement (no imaging — physician directed PT first). Available afternoons after 3pm. Insurance authorization pending.",
  },
];

export const chats: Chat[] = [
  {
    id: "chat-1",
    leadId: "lead-2",
    locationId: "loc-2",
    dateTime: "2026-06-22T09:47:00Z",
    transcript: `Visitor: Hi, I'm looking for PT help after ACL surgery. Had surgery about 6 weeks ago.
Assistant: Hi! Post-ACL rehab is something our team specializes in. 6 weeks is a great time to start. Can I get your name and contact info?
Visitor: Jennifer Walsh, jen.walsh@gmail.com, (415) 555-6103.
Assistant: Has your surgeon cleared you for PT?
Visitor: Yes, cleared. I have a booklet from the hospital. Afternoons work best.
Assistant: Perfect. A coordinator will reach out today. What are your main goals?
Visitor: Getting range of motion back. Eventually want to return to running.
Assistant: Both are very achievable post-ACL. Expect a call within a few hours!`,
    summary: "Jennifer Walsh chatted about post-ACL rehab (6 weeks post-op, surgeon-cleared). Goals: restore ROM and return to running. Prefers afternoons. Coordinator to call and schedule.",
  },
  {
    id: "chat-2",
    leadId: "lead-5",
    locationId: "loc-2",
    dateTime: "2026-06-19T16:22:00Z",
    transcript: `Visitor: Hello, I've been having hip pain affecting how I walk. Can PT help?
Assistant: Hip pain affecting gait is absolutely something we address. What's your name?
Visitor: Derek Okafor. Phone (415) 555-7734. Email dokafor@gmail.com.
Assistant: How long, and did something trigger it?
Visitor: About 4 months. Gradual — no specific injury.
Assistant: Mornings or afternoons better?
Visitor: Mornings, flexible on days.
Assistant: Sending a short intake form to dokafor@gmail.com now. A coordinator will call to schedule.
Visitor: Thank you.`,
    summary: "Derek Okafor chatted about gradual hip pain affecting gait (4 months, no specific injury). Prefers mornings. Intake form sent. Coordinator to call.",
  },
  {
    id: "chat-3",
    leadId: "lead-8",
    locationId: "loc-3",
    dateTime: "2026-06-15T10:10:00Z",
    transcript: `Visitor: Hi, I need post-surgical PT for a shoulder labrum repair. 8 weeks post-op.
Assistant: Shoulder labrum rehab is a great fit — 8 weeks is when structured therapy typically begins. Can I get your contact?
Visitor: Nancy Kim, (415) 555-3387, nancy.kim@email.com.
Assistant: Do you have a surgeon's PT protocol?
Visitor: Yes, I have a surgical report and a rehab protocol.
Assistant: Best days and times?
Visitor: Monday or Friday mornings.
Assistant: I have Monday June 23 at 9:30am at our North Shore location. Does that work?
Visitor: Yes, that works perfectly.
Assistant: Booked! Confirmation going to nancy.kim@email.com. Please bring your surgical report.`,
    summary: "Nancy Kim booked June 23 at 9:30am at North Shore for post-labrum repair rehab (8 weeks post-op). Has surgical report and surgeon's rehab protocol.",
  },
  {
    id: "chat-4",
    leadId: "lead-11",
    locationId: "loc-2",
    dateTime: "2026-06-03T15:20:00Z",
    transcript: `Visitor: I've been dealing with tennis elbow for about 3 months. Can PT help?
Assistant: Absolutely — lateral epicondylitis responds really well to PT. What's your name?
Visitor: James Whitfield, (415) 555-8890, jwhitfield@email.com.
Assistant: Dominant arm? Still playing?
Visitor: Dominant arm. Haven't played in two months. Pain even with typing.
Assistant: Mon–Thu afternoons work?
Visitor: Yes, afternoons.
Assistant: Setting you up with one of our upper extremity specialists. Expect a call to schedule.`,
    summary: "James Whitfield chatted about tennis elbow (3 months, dominant arm). Stopped playing, pain with daily activities. Set up with upper extremity specialist. Mon–Thu afternoons preferred.",
  },
  {
    id: "chat-5",
    leadId: "lead-14",
    locationId: "loc-3",
    dateTime: "2026-06-21T13:00:00Z",
    transcript: `Visitor: I've been having vertigo and feeling off-balance. My doctor mentioned vestibular therapy. Do you offer that?
Assistant: Yes — vestibular rehab is very effective for vertigo. Has your doctor given you a diagnosis?
Visitor: BPPV, they think, pending specialist confirmation.
Assistant: BPPV responds excellently to repositioning maneuvers. Name and contact?
Visitor: Grace Liu, (415) 555-7721, grace.liu@email.com.
Assistant: Best days?
Visitor: Tuesdays or Thursdays.
Assistant: Someone from our North Shore location will reach out — they have a vestibular-trained therapist.`,
    summary: "Grace Liu chatted about suspected BPPV. Seeking vestibular rehab. Prefers Tue/Thu. Referred to North Shore which has a vestibular-trained therapist.",
  },
  {
    id: "chat-6",
    leadId: "lead-20",
    locationId: "loc-2",
    dateTime: "2026-06-13T16:00:00Z",
    transcript: `Visitor: I have neck and arm pain — my neurologist said it might be cervical radiculopathy and I should try PT before any procedures.
Assistant: Cervical radiculopathy is very common and PT is a very effective first step. What's your name?
Visitor: Rachel Huang, (415) 555-8876, rhuang@email.com.
Assistant: Tingling or aching? One arm or both?
Visitor: Tingling and some weakness in my right arm. MRI shows C5-C6 involvement.
Assistant: Wed or Fri afternoons work?
Visitor: Yes, afternoons.
Assistant: I have Friday June 25 at 2pm with David Kim who specializes in cervical conditions. Shall I book that?
Visitor: Yes please.
Assistant: Booked! Confirmation to rhuang@email.com. Please bring your MRI and neurologist's referral.`,
    summary: "Rachel Huang booked June 25 at 2pm with David Kim for cervical radiculopathy (C5-C6, MRI confirmed). Right arm tingling and weakness. Referred by neurologist.",
  },
];
