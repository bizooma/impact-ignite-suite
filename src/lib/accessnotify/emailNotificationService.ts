// TODO: Wire to Resend connector when ready (RESEND_API_KEY is available).
export interface EmailSendArgs {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendResult {
  status: 'sent' | 'failed' | 'skipped';
  providerId?: string;
  error?: string;
}

export async function sendEmail(args: EmailSendArgs): Promise<SendResult> {
  // Mocked send — returns success with a synthetic provider ID.
  if (!args.to) return { status: 'skipped', error: 'No recipient' };
  await new Promise((r) => setTimeout(r, 50));
  return { status: 'sent', providerId: `mock_email_${Date.now()}` };
}
