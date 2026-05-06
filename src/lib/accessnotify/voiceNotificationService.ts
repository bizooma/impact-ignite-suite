// TODO: Wire to Twilio Voice when ready.
import type { SendResult } from './emailNotificationService';

export interface VoiceCallArgs {
  to: string;
  script: string;
  callerId?: string;
}

export async function placeVoiceCall(args: VoiceCallArgs): Promise<SendResult> {
  if (!args.to) return { status: 'skipped', error: 'No phone number' };
  await new Promise((r) => setTimeout(r, 50));
  return { status: 'sent', providerId: `mock_voice_${Date.now()}` };
}
