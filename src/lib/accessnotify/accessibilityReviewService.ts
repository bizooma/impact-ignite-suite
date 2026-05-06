export type CheckStatus = 'pass' | 'warning' | 'needs_review';

export interface AccessibilityCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface CampaignContent {
  subject?: string | null;
  email_body?: string | null;
  sms_body?: string | null;
  voice_script?: string | null;
  plain_language_body?: string | null;
}

const COLOR_ONLY_TERMS = /\b(red|green|blue|yellow|orange|purple)\b/i;
const VAGUE_LINKS = /\b(click here|read more|here|this link)\b/i;

function flesch(text: string): number {
  // very rough readability proxy: avg words/sentence
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!sentences.length || !words.length) return 0;
  return words.length / sentences.length;
}

export function runChecks(campaign: CampaignContent): AccessibilityCheck[] {
  const email = (campaign.email_body || '').trim();
  const sms = (campaign.sms_body || '').trim();
  const voice = (campaign.voice_script || '').trim();
  const plain = (campaign.plain_language_body || '').trim();

  const checks: AccessibilityCheck[] = [];

  // 1. Plain language
  const wps = email ? flesch(email) : 0;
  checks.push({
    key: 'plain_language',
    label: 'Uses plain language',
    status: !email ? 'needs_review' : wps > 25 ? 'warning' : 'pass',
    detail: !email
      ? 'No email body to evaluate.'
      : `Average sentence length: ~${wps.toFixed(0)} words.`,
  });

  // 2. Descriptive links
  checks.push({
    key: 'descriptive_links',
    label: 'Descriptive links instead of "click here"',
    status: VAGUE_LINKS.test(email) ? 'warning' : 'pass',
    detail: VAGUE_LINKS.test(email)
      ? 'Replace generic link text with a description of the destination.'
      : 'No vague link text detected.',
  });

  // 3. Screen-reader-friendly structure
  const hasStructure = /\n\s*\n/.test(email) || /^(#|\*|-)/m.test(email);
  checks.push({
    key: 'sr_structure',
    label: 'Screen-reader-friendly email structure',
    status: !email ? 'needs_review' : hasStructure ? 'pass' : 'warning',
    detail: hasStructure
      ? 'Paragraphs or lists detected.'
      : 'Add paragraph breaks or headings to support screen readers.',
  });

  // 4. No image-only text (heuristic: detect base64 / image markdown without alt)
  const imgNoAlt = /!\[\s*\]\(/.test(email);
  checks.push({
    key: 'no_image_only_text',
    label: 'No image-only text',
    status: imgNoAlt ? 'warning' : 'pass',
    detail: imgNoAlt ? 'An image has no alt text.' : 'No image-only text detected.',
  });

  // 5. Alt text provided
  const hasImg = /!\[/.test(email);
  checks.push({
    key: 'alt_text',
    label: 'Alt text provided for images',
    status: !hasImg ? 'pass' : imgNoAlt ? 'warning' : 'pass',
    detail: !hasImg ? 'No images in message.' : imgNoAlt ? 'Add alt text to all images.' : 'All images appear to have alt text.',
  });

  // 6. Color contrast (we can't truly check without rendered HTML — flag as needs_review if inline style colors used)
  const inlineColor = /style=\"[^\"]*color:/i.test(email);
  checks.push({
    key: 'color_contrast',
    label: 'Color contrast passes',
    status: inlineColor ? 'needs_review' : 'pass',
    detail: inlineColor ? 'Custom colors detected — verify contrast ratio ≥ 4.5:1.' : 'Using default theme colors (high contrast).',
  });

  // 7. SMS clear and concise
  checks.push({
    key: 'sms_concise',
    label: 'SMS is clear and concise',
    status: !sms ? 'needs_review' : sms.length > 160 ? 'warning' : 'pass',
    detail: !sms ? 'No SMS version provided.' : `${sms.length} characters.`,
  });

  // 8. Voice script easy to understand
  const voiceWps = voice ? flesch(voice) : 0;
  checks.push({
    key: 'voice_clear',
    label: 'Voice script is easy to understand',
    status: !voice ? 'needs_review' : voiceWps > 22 ? 'warning' : 'pass',
    detail: !voice ? 'No voice script provided.' : `Avg ${voiceWps.toFixed(0)} words/sentence.`,
  });

  // 9. No meaning by color alone
  checks.push({
    key: 'no_color_meaning',
    label: 'No meaning is conveyed by color alone',
    status: COLOR_ONLY_TERMS.test(email) ? 'needs_review' : 'pass',
    detail: COLOR_ONLY_TERMS.test(email)
      ? 'Color words detected — confirm there is also a non-color cue.'
      : 'No color-only references detected.',
  });

  return checks;
}

export function scoreChecks(checks: AccessibilityCheck[]): number {
  if (!checks.length) return 0;
  const points = checks.reduce((sum, c) => sum + (c.status === 'pass' ? 1 : c.status === 'warning' ? 0.5 : 0), 0);
  return Math.round((points / checks.length) * 100);
}
