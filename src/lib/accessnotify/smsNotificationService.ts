// TODO: Wire to Twilio connector when ready.
import type { SendResult } from './emailNotificationService';

export interface SmsSendArgs {
  to: string;
  body: string;
  from?: string;
}

export async function sendSms(args: SmsSendArgs): Promise<SendResult> {
  if (!args.to) return { status: 'skipped', error: 'No phone number' };
  await new Promise((r) => setTimeout(r, 50));
  return { status: 'sent', providerId: `mock_sms_${Date.now()}` };
}
