export interface ContactPreference {
  preferred_method: 'email' | 'sms' | 'voice' | 'multiple';
  large_text: boolean;
  simplified_language: boolean;
  voice_first: boolean;
  preferred_language: string;
  do_not_call: boolean;
  do_not_text: boolean;
}

export type Channel = 'email' | 'sms' | 'voice';

export interface ResolvedDelivery {
  channels: Channel[];
  bodyVersion: 'full' | 'plain' | 'sms' | 'voice';
  appliedRules: string[];
}

const DEFAULT_PREF: ContactPreference = {
  preferred_method: 'email',
  large_text: false,
  simplified_language: false,
  voice_first: false,
  preferred_language: 'en',
  do_not_call: false,
  do_not_text: false,
};

export function resolveChannels(
  pref: Partial<ContactPreference> | null | undefined,
  requested: Channel[],
): ResolvedDelivery {
  const p = { ...DEFAULT_PREF, ...(pref || {}) };
  const applied: string[] = [];
  let channels = [...requested];

  if (p.do_not_text) {
    if (channels.includes('sms')) applied.push('Do-not-text: SMS removed');
    channels = channels.filter((c) => c !== 'sms');
  }
  if (p.do_not_call) {
    if (channels.includes('voice')) applied.push('Do-not-call: Voice removed');
    channels = channels.filter((c) => c !== 'voice');
  }
  if (p.voice_first && channels.includes('voice')) {
    channels = ['voice', ...channels.filter((c) => c !== 'voice')];
    applied.push('Voice-first: prioritized voice');
  }

  let bodyVersion: ResolvedDelivery['bodyVersion'] = 'full';
  if (p.simplified_language) {
    bodyVersion = 'plain';
    applied.push('Simplified language preference applied');
  }

  return { channels, bodyVersion, appliedRules: applied };
}
