// Giving Tuesday campaign template — content, milestones, tasks, FAQs

export type Phase = 'awareness' | 'engagement' | 'push' | 'day_of' | 'stewardship';

export interface MilestoneSeed {
  phase: Phase;
  title: string;
  description: string;
  weeksOffset: number; // weeks before event_date (negative = after)
  order_index: number;
}

export interface AssetSeed {
  asset_type: 'social_post' | 'email_draft' | 'sms_draft' | 'chatbot_faq' | 'gbp_post';
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface TaskSeed {
  title: string;
  description: string;
  weeksOffset: number;
  priority: number;
}

// Calculate Giving Tuesday date for a given year (Tuesday after US Thanksgiving = 4th Thursday of November)
export function getGivingTuesdayDate(year: number = new Date().getFullYear()): Date {
  // Find first Thursday of November
  const nov1 = new Date(year, 10, 1);
  const firstThursday = 1 + ((4 - nov1.getDay() + 7) % 7);
  // 4th Thursday = Thanksgiving
  const thanksgiving = new Date(year, 10, firstThursday + 21);
  // Following Tuesday
  const givingTuesday = new Date(thanksgiving);
  givingTuesday.setDate(thanksgiving.getDate() + 5);
  return givingTuesday;
}

// If GT this year has passed, use next year
export function getNextGivingTuesday(): Date {
  const today = new Date();
  let gt = getGivingTuesdayDate(today.getFullYear());
  if (gt < today) gt = getGivingTuesdayDate(today.getFullYear() + 1);
  return gt;
}

export const MILESTONES: MilestoneSeed[] = [
  // Awareness — 8 weeks out
  { phase: 'awareness', title: 'Announce Giving Tuesday participation', description: 'Post on website + social channels that you\'re joining the global movement.', weeksOffset: 8, order_index: 1 },
  { phase: 'awareness', title: 'Build / clean email list', description: 'Segment list, remove bounces, identify LYBUNT and lapsed donors.', weeksOffset: 8, order_index: 2 },
  { phase: 'awareness', title: 'Soft-launch your campaign story', description: 'Write the headline narrative — who is impacted, what changes with $X.', weeksOffset: 7, order_index: 3 },
  // Engagement — 4 weeks out
  { phase: 'engagement', title: 'Publish first donor story', description: 'Profile a real beneficiary or volunteer. Use photo + quote.', weeksOffset: 4, order_index: 4 },
  { phase: 'engagement', title: 'Confirm matching gift sponsors', description: 'Lock in matching commitments and dollar amounts.', weeksOffset: 4, order_index: 5 },
  { phase: 'engagement', title: 'Schedule teaser social posts', description: 'Schedule 4 teaser posts across FB/IG/LinkedIn for the next two weeks.', weeksOffset: 3, order_index: 6 },
  // Final Push — 1 week out
  { phase: 'push', title: 'Launch countdown email sequence', description: '7-day, 3-day, 1-day, and morning-of emails ready to send.', weeksOffset: 1, order_index: 7 },
  { phase: 'push', title: 'Brief peer-to-peer fundraisers', description: 'Send board + ambassadors a one-pager with copy + graphics.', weeksOffset: 1, order_index: 8 },
  { phase: 'push', title: 'Test donation page on mobile', description: 'Confirm mobile checkout works, Apple/Google Pay enabled.', weeksOffset: 1, order_index: 9 },
  // Day Of
  { phase: 'day_of', title: 'Morning launch post (all channels)', description: 'Publish FB, IG, LinkedIn, GBP post + send morning email.', weeksOffset: 0, order_index: 10 },
  { phase: 'day_of', title: 'Hourly social pushes', description: 'Live thermometer updates every 2 hours, story shares, donor shoutouts.', weeksOffset: 0, order_index: 11 },
  { phase: 'day_of', title: 'Final-hour email blast', description: '4-hours-left and 1-hour-left emails to push final donations.', weeksOffset: 0, order_index: 12 },
  // Stewardship — week after
  { phase: 'stewardship', title: 'Send thank-you emails to all donors', description: 'Personalized thank-yous via the Acknowledgments tool.', weeksOffset: -1, order_index: 13 },
  { phase: 'stewardship', title: 'Publish total raised + impact post', description: 'Celebrate the total, share what it funds, thank the community.', weeksOffset: -1, order_index: 14 },
  { phase: 'stewardship', title: 'Recurring-gift upgrade ask', description: 'Email one-time donors with an invitation to become monthly sustainers.', weeksOffset: -2, order_index: 15 },
];

export const TASKS: TaskSeed[] = [
  { title: 'Recruit 3 matching gift sponsors', description: 'Lock in matching commitments to amplify Giving Tuesday gifts.', weeksOffset: 8, priority: 3 },
  { title: 'Design hero graphic + social tiles', description: 'Branded campaign artwork in multiple sizes (FB, IG square, IG story, LinkedIn).', weeksOffset: 6, priority: 2 },
  { title: 'Brief board on peer-to-peer asks', description: 'Equip board members with sample copy and personal ask templates.', weeksOffset: 4, priority: 2 },
  { title: 'Test donation page on mobile', description: 'Verify mobile checkout, Apple/Google Pay, and confirmation emails.', weeksOffset: 1, priority: 3 },
  { title: 'Schedule day-of staff coverage', description: 'Assign team members to monitor social, respond to donors, post updates.', weeksOffset: 1, priority: 2 },
];

export const SOCIAL_POSTS: AssetSeed[] = [
  { asset_type: 'social_post', title: 'Announcement (Facebook)', body: '🎉 We\'re joining the global Giving Tuesday movement on [DATE]! Mark your calendars — your support on this one day can change lives all year long. #GivingTuesday #[YourMission]', metadata: { platform: 'facebook', phase: 'awareness' } },
  { asset_type: 'social_post', title: 'Announcement (Instagram)', body: '✨ #GivingTuesday is coming. One day. One movement. Endless impact. Join us [DATE] to make a difference. Link in bio.', metadata: { platform: 'instagram', phase: 'awareness' } },
  { asset_type: 'social_post', title: 'Announcement (LinkedIn)', body: 'On [DATE], we\'re joining millions worldwide for Giving Tuesday — a global day of generosity. We\'d love your support in advancing our mission. Learn more: [LINK]', metadata: { platform: 'linkedin', phase: 'awareness' } },
  { asset_type: 'social_post', title: 'Donor Story (Facebook)', body: 'Meet [NAME]. Because of supporters like you, [STORY]. This Giving Tuesday, your gift makes more stories like [NAME]\'s possible. 💙', metadata: { platform: 'facebook', phase: 'engagement' } },
  { asset_type: 'social_post', title: 'Matching Gift Reveal (Instagram)', body: '🚨 BIG NEWS: Every gift on Giving Tuesday will be MATCHED up to $[AMOUNT] thanks to [SPONSOR]. Your $25 becomes $50. Your $100 becomes $200. Save the date: [DATE].', metadata: { platform: 'instagram', phase: 'engagement' } },
  { asset_type: 'social_post', title: 'Teaser Countdown (LinkedIn)', body: '[X] days until Giving Tuesday. Last year, our community raised $[AMOUNT] in 24 hours. Help us beat that this year.', metadata: { platform: 'linkedin', phase: 'engagement' } },
  { asset_type: 'social_post', title: '7-Day Countdown (Facebook)', body: 'One week from today is #GivingTuesday. Set a reminder. Tell a friend. Be ready to give. Every dollar matched up to $[AMOUNT].', metadata: { platform: 'facebook', phase: 'push' } },
  { asset_type: 'social_post', title: '24-Hour Countdown (Instagram Story)', body: 'TOMORROW. #GivingTuesday. Your gift = double the impact. 🔗 Link in bio.', metadata: { platform: 'instagram', phase: 'push' } },
  { asset_type: 'social_post', title: 'Morning Launch (All channels)', body: '🎉 IT\'S #GIVINGTUESDAY! Today only — every gift matched up to $[AMOUNT]. Donate now → [LINK]. Let\'s do this together. 💪', metadata: { platform: 'all', phase: 'day_of' } },
  { asset_type: 'social_post', title: 'Midday Push (Facebook)', body: '🔥 We\'re at $[AMOUNT] raised — [%]% of our goal! Help us cross the finish line. Every gift matters: [LINK]', metadata: { platform: 'facebook', phase: 'day_of' } },
  { asset_type: 'social_post', title: 'Final Hours (Instagram)', body: '⏰ Less than [X] hours left. Don\'t miss your chance to double your impact. Donate before midnight: [LINK]', metadata: { platform: 'instagram', phase: 'day_of' } },
  { asset_type: 'social_post', title: 'Thank You Post (All channels)', body: '🙏 WE DID IT! Thanks to YOU, we raised $[TOTAL] for [MISSION]. Every donor, every share, every dollar — thank you. This is just the beginning.', metadata: { platform: 'all', phase: 'stewardship' } },
];

export const EMAIL_DRAFTS: AssetSeed[] = [
  { asset_type: 'email_draft', title: 'Announce: Save the Date', body: 'Subject: Save the date — Giving Tuesday is coming\n\nHi [FIRST_NAME],\n\nOn [DATE], we\'re joining the global Giving Tuesday movement — a 24-hour worldwide push for generosity.\n\nYour support has always made our work possible. This year, we have an exciting matching gift challenge that will DOUBLE every dollar raised.\n\nMark your calendar for [DATE]. We\'ll be in touch soon with more details.\n\nWith gratitude,\n[YOUR NAME]', metadata: { sequence: 1 } },
  { asset_type: 'email_draft', title: 'Story: Why your gift matters', body: 'Subject: A story I want to share with you\n\nHi [FIRST_NAME],\n\nI want to tell you about [BENEFICIARY NAME].\n\n[2–3 paragraph story of impact — be specific, be human, include a quote if possible.]\n\nThis is what your generosity makes possible. And on Giving Tuesday, [DATE], every gift will be matched up to $[AMOUNT].\n\nWill you be ready?\n\nThank you,\n[YOUR NAME]', metadata: { sequence: 2 } },
  { asset_type: 'email_draft', title: 'Matching Gift Announcement', body: 'Subject: 🚨 Your gift will be DOUBLED on Giving Tuesday\n\nHi [FIRST_NAME],\n\nThanks to [SPONSOR NAME], every gift made on Giving Tuesday — [DATE] — will be matched dollar-for-dollar up to $[AMOUNT].\n\nThat means:\n• $25 becomes $50\n• $100 becomes $200\n• $500 becomes $1,000\n\nSet a reminder for [DATE]. We can\'t do this without you.\n\n[YOUR NAME]', metadata: { sequence: 3 } },
  { asset_type: 'email_draft', title: 'Day-Of: It\'s Giving Tuesday!', body: 'Subject: 🎉 It\'s here — Giving Tuesday is TODAY\n\nHi [FIRST_NAME],\n\nToday is the day. For the next 24 hours, every gift to [ORG] will be MATCHED up to $[AMOUNT].\n\nYour gift today goes twice as far for [MISSION].\n\n👉 Donate now: [LINK]\n\nThank you for being part of this community.\n\n[YOUR NAME]', metadata: { sequence: 4 } },
  { asset_type: 'email_draft', title: 'Thank You', body: 'Subject: 🙏 Thank you — we did it together\n\nHi [FIRST_NAME],\n\nBecause of you, we raised $[TOTAL] on Giving Tuesday.\n\nThat means [SPECIFIC IMPACT — e.g., "200 more meals served," "50 students supported"].\n\nI cannot express how grateful we are. You didn\'t just give money — you gave hope.\n\nWith deep gratitude,\n[YOUR NAME]', metadata: { sequence: 5 } },
];

export const SMS_DRAFTS: AssetSeed[] = [
  { asset_type: 'sms_draft', title: 'Day-before reminder', body: 'Hi [FIRST_NAME] — tomorrow is Giving Tuesday! Every gift will be DOUBLED up to $[AMOUNT]. Be ready: [LINK]', metadata: {} },
  { asset_type: 'sms_draft', title: 'Morning-of launch', body: '🎉 Giving Tuesday is HERE! Donate now and your gift is matched: [LINK] — [ORG]', metadata: {} },
  { asset_type: 'sms_draft', title: 'Final hours push', body: '⏰ A few hours left! Help us hit our $[GOAL] goal — every gift matched: [LINK]', metadata: {} },
];

export const CHATBOT_FAQS: AssetSeed[] = [
  { asset_type: 'chatbot_faq', title: 'When is Giving Tuesday?', body: 'Giving Tuesday is [DATE]. It\'s a 24-hour global day of generosity following Thanksgiving in the US.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'How can I donate?', body: 'You can donate online at [DONATION_LINK]. We accept all major credit cards, Apple Pay, Google Pay, and bank transfers.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'Is my gift matched?', body: 'Yes! On Giving Tuesday, every gift up to $[AMOUNT] is matched dollar-for-dollar by [SPONSOR]. That doubles your impact.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'Is my donation tax-deductible?', body: 'Yes — we are a registered 501(c)(3) nonprofit. You\'ll receive a tax receipt by email immediately after donating.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'Can I give monthly instead?', body: 'Absolutely! Monthly giving is the most powerful way to support our mission. Choose "Make this monthly" at checkout.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'Where does my money go?', body: 'Every dollar you give goes directly to [PROGRAM AREAS]. We publish an annual impact report showing exactly how funds are used.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'Can my company match my gift?', body: 'Many employers match charitable donations! Check with your HR department or use a matching gift search tool. We\'re happy to provide the documentation needed.', metadata: {} },
  { asset_type: 'chatbot_faq', title: 'How can I help besides donating?', body: 'Share our campaign on social media, tell a friend, or volunteer. Every action amplifies our impact. Visit [VOLUNTEER_LINK] to get involved.', metadata: {} },
];

export const GBP_POST: AssetSeed = {
  asset_type: 'gbp_post',
  title: 'Giving Tuesday GBP Post',
  body: '🎉 Today is Giving Tuesday! For 24 hours only, every donation to [ORG] is MATCHED up to $[AMOUNT]. Help us [MISSION]. Donate now: [LINK]',
  metadata: { cta: 'Learn more', cta_url: '[LINK]' },
};

export const ALL_ASSETS: AssetSeed[] = [
  ...SOCIAL_POSTS,
  ...EMAIL_DRAFTS,
  ...SMS_DRAFTS,
  ...CHATBOT_FAQS,
  GBP_POST,
];

export const SUGGESTED_AUDIENCES = [
  { key: 'lybunt', label: 'LYBUNT', description: 'Gave last year, not yet this year' },
  { key: 'sustaining', label: 'Sustaining donors', description: 'Active recurring donors — upgrade ask' },
  { key: 'new_donors', label: 'New donors this year', description: 'First-time givers — first GT ask' },
  { key: 'major_donors', label: 'Major donors', description: 'Lifetime $1,000+ — matching-gift challenge' },
];
