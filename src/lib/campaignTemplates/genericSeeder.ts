// Generic seeder: turns a Creative Brief into milestones, content drafts, and tasks.
import { supabase } from '@/integrations/supabase/client';
import type { CampaignBrief, CampaignObjective, CampaignTone } from '@/hooks/useCampaignBrief';
import { formatLocalDate, parseLocalDate } from './givingTuesday';

interface SeedInput {
  campaignId: string;
  organizationId: string;
  campaignName: string;
  brief: Partial<CampaignBrief>;
  createdBy: string | null;
}

const TONE_OPENERS: Record<CampaignTone, string> = {
  warm: 'We have something special to share with you',
  urgent: 'Time is running out',
  celebratory: 'Big news worth celebrating',
  professional: 'An update on our work',
  playful: "Hey friend — guess what?",
};

const OBJECTIVE_LABEL: Record<CampaignObjective, string> = {
  fundraise: 'support our mission with a gift',
  awareness: 'help spread the word',
  recruit_volunteers: 'volunteer your time',
  event_attendance: 'join us at the event',
  advocacy: 'take action with us',
  stewardship: 'see the impact you made',
};

function buildMilestones(eventDate: Date, objective: CampaignObjective) {
  const phases: Array<{
    phase: 'awareness' | 'engagement' | 'push' | 'day_of' | 'stewardship';
    weeksBefore: number;
    items: Array<{ title: string; description: string }>;
  }> = [
    {
      phase: 'awareness',
      weeksBefore: 8,
      items: [
        { title: 'Announce the campaign', description: 'Post on website and social channels.' },
        { title: 'Prepare audience list', description: 'Segment and clean your CRM list for outreach.' },
        { title: 'Draft the campaign story', description: 'Write the headline narrative — who is impacted and why now.' },
      ],
    },
    {
      phase: 'engagement',
      weeksBefore: 4,
      items: [
        { title: 'Publish a personal story', description: 'Share a real beneficiary or volunteer profile with photo + quote.' },
        { title: 'Schedule teaser content', description: 'Schedule 4 teaser posts across enabled channels.' },
        { title: 'Brief board / ambassadors', description: 'Equip champions with copy and assets to share personally.' },
      ],
    },
    {
      phase: 'push',
      weeksBefore: 1,
      items: [
        { title: 'Launch countdown emails', description: '7-day, 3-day, 1-day, and morning-of emails ready.' },
        { title: 'Final asset QA', description: 'Test the donation/signup page on mobile end-to-end.' },
      ],
    },
    {
      phase: 'day_of',
      weeksBefore: 0,
      items: [
        { title: 'Morning launch (all channels)', description: 'Publish to social, send the morning email, post to GBP.' },
        { title: 'Mid-day push', description: 'Live progress update + donor / participant shoutouts.' },
        { title: 'Final-hour reminder', description: 'Last-call email and social story before the deadline.' },
      ],
    },
    {
      phase: 'stewardship',
      weeksBefore: -1,
      items:
        objective === 'fundraise' || objective === 'stewardship'
          ? [
              { title: 'Send thank-you to every donor', description: 'Personalized acknowledgments via the CRM.' },
              { title: 'Publish impact recap', description: 'Share the total raised and what it funds.' },
            ]
          : [
              { title: 'Recap and thank participants', description: 'Public recap post + personal thank-yous.' },
            ],
    },
  ];

  let order = 1;
  return phases.flatMap((p) => {
    const due = new Date(eventDate);
    due.setDate(eventDate.getDate() - p.weeksBefore * 7);
    return p.items.map((item) => ({
      phase: p.phase,
      title: item.title,
      description: item.description,
      due_date: formatLocalDate(due),
      order_index: order++,
    }));
  });
}

function buildAssets(brief: Partial<CampaignBrief>, campaignName: string) {
  const tone = brief.tone || 'warm';
  const cta = brief.call_to_action || OBJECTIVE_LABEL[brief.objective || 'fundraise'];
  const message = brief.key_message || `Help us advance our mission through ${campaignName}.`;
  const url = brief.landing_url || '[LINK]';
  const channels = (brief.channels || {}) as Record<string, boolean>;

  const assets: Array<{
    asset_type: 'social_post' | 'email_draft' | 'sms_draft' | 'chatbot_faq' | 'gbp_post';
    title: string;
    body: string;
    metadata?: Record<string, any>;
  }> = [];

  const opener = TONE_OPENERS[tone];

  if (channels.social !== false) {
    const platforms = ['facebook', 'instagram', 'linkedin'];
    const phases = ['awareness', 'engagement', 'push', 'day_of', 'stewardship'] as const;
    phases.forEach((phase) => {
      platforms.forEach((platform) => {
        const phaseLine =
          phase === 'awareness'
            ? `${opener}: ${campaignName} is coming.`
            : phase === 'engagement'
            ? `Here's why ${campaignName} matters:`
            : phase === 'push'
            ? `Only days left in ${campaignName}.`
            : phase === 'day_of'
            ? `Today is the day. ${campaignName} is live.`
            : `Thank you for being part of ${campaignName}.`;
        assets.push({
          asset_type: 'social_post',
          title: `${phase.replace('_', ' ')} — ${platform}`,
          body: `${phaseLine}\n\n${message}\n\n👉 ${cta}: ${url}`,
          metadata: { platform, phase },
        });
      });
    });
  }

  if (channels.email !== false) {
    assets.push({
      asset_type: 'email_draft',
      title: 'Announce the campaign',
      body: `Subject: ${campaignName} — save the date\n\nHi [FIRST_NAME],\n\n${message}\n\nWe're inviting you to ${cta}.\n\nMore details soon.\n\nWith gratitude,\n[YOUR NAME]`,
      metadata: { sequence: 1 },
    });
    assets.push({
      asset_type: 'email_draft',
      title: 'Day-of: it begins',
      body: `Subject: ${campaignName} starts today\n\nHi [FIRST_NAME],\n\nToday is the day. ${message}\n\n👉 ${cta}: ${url}\n\nThank you for being part of this.\n\n[YOUR NAME]`,
      metadata: { sequence: 2 },
    });
    assets.push({
      asset_type: 'email_draft',
      title: 'Thank you & impact',
      body: `Subject: Thank you — here's what we did together\n\nHi [FIRST_NAME],\n\nBecause of you, ${campaignName} reached [RESULT].\n\nThat means [SPECIFIC IMPACT].\n\nWith deep gratitude,\n[YOUR NAME]`,
      metadata: { sequence: 3 },
    });
  }

  if (channels.sms) {
    assets.push({
      asset_type: 'sms_draft',
      title: 'Day-of reminder',
      body: `${campaignName} is happening today. ${cta}: ${url}`,
    });
  }

  if (channels.chatbot !== false) {
    assets.push({
      asset_type: 'chatbot_faq',
      title: `What is ${campaignName}?`,
      body: message,
    });
    assets.push({
      asset_type: 'chatbot_faq',
      title: `How can I take part?`,
      body: `You can ${cta}. Visit ${url} to get started.`,
    });
    assets.push({
      asset_type: 'chatbot_faq',
      title: `When does ${campaignName} happen?`,
      body: brief.event_date
        ? `${campaignName} happens on ${parseLocalDate(brief.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`
        : `Visit our website for the latest dates and details.`,
    });
  }

  if (channels.gbp !== false) {
    assets.push({
      asset_type: 'gbp_post',
      title: `${campaignName} — Google Business post`,
      body: `${message}\n\n${cta}: ${url}`,
      metadata: { cta: 'Learn more', cta_url: url },
    });
  }

  return assets;
}

function buildTasks(eventDate: Date, objective: CampaignObjective) {
  const tasks: Array<{ title: string; description: string; weeksBefore: number; priority: number }> = [
    { title: 'Design hero graphic + social tiles', description: 'Branded campaign artwork in multiple sizes.', weeksBefore: 6, priority: 2 },
    { title: 'Confirm landing page is ready', description: 'Verify the destination URL works and mobile is optimized.', weeksBefore: 4, priority: 3 },
    { title: 'Brief team on the campaign', description: 'Walk staff through goals, channels, and the brief.', weeksBefore: 4, priority: 2 },
    { title: 'Schedule social posts', description: 'Queue the prepared social drafts in the Social module.', weeksBefore: 3, priority: 2 },
    { title: 'Final QA & dry-run', description: 'Test all channels end-to-end the day before launch.', weeksBefore: 1, priority: 3 },
    { title: 'Day-of monitoring', description: 'Assign team to watch responses, donations, and metrics.', weeksBefore: 0, priority: 3 },
  ];
  if (objective === 'fundraise' || objective === 'stewardship') {
    tasks.push({ title: 'Send thank-you acknowledgments', description: 'Use the Acknowledgments tool in CRM.', weeksBefore: -1, priority: 2 });
  }
  return tasks.map((t) => {
    const due = new Date(eventDate);
    due.setDate(eventDate.getDate() - t.weeksBefore * 7);
    return { ...t, due_date: formatLocalDate(due) };
  });
}

export async function seedCampaignFromBrief({
  campaignId,
  organizationId,
  campaignName,
  brief,
}: SeedInput) {
  // Wipe any prior seeded content so re-seeding is idempotent
  await supabase.from('campaign_milestones').delete().eq('campaign_id', campaignId);
  await supabase.from('campaign_assets').delete().eq('campaign_id', campaignId);
  // Tasks: only delete tasks created by previous seeds (we tag with marketing_campaign_id; safe to remove all linked)
  await supabase.from('tasks').delete().eq('marketing_campaign_id', campaignId);

  const eventDateStr = brief.event_date || brief.end_date || brief.start_date;
  if (!eventDateStr) return;
  const eventDate = parseLocalDate(eventDateStr);
  const objective = (brief.objective || 'fundraise') as CampaignObjective;

  const milestones = buildMilestones(eventDate, objective).map((m) => ({
    campaign_id: campaignId,
    ...m,
  }));
  const assets = buildAssets(brief, campaignName).map((a) => ({
    campaign_id: campaignId,
    asset_type: a.asset_type,
    title: a.title,
    body: a.body,
    status: 'draft',
    metadata: a.metadata || {},
  }));
  const tasks = buildTasks(eventDate, objective).map((t) => ({
    organization_id: organizationId,
    title: t.title,
    description: t.description,
    due_date: t.due_date,
    priority: t.priority,
    source_module: 'campaigns',
    source_id: campaignId,
    marketing_campaign_id: campaignId,
  }));

  if (milestones.length) await supabase.from('campaign_milestones').insert(milestones as any);
  if (assets.length) await supabase.from('campaign_assets').insert(assets as any);
  if (tasks.length) await supabase.from('tasks').insert(tasks as any);
}
