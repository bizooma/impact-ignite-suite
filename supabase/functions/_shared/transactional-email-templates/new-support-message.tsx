import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Causeio'
const APP_URL = 'https://impact-ignite-suite.lovable.app'

interface NewSupportMessageProps {
  orgName?: string
  senderName?: string
  senderEmail?: string
  messagePreview?: string
}

const NewSupportMessageEmail = ({
  orgName,
  senderName,
  senderEmail,
  messagePreview,
}: NewSupportMessageProps) => {
  const org = orgName || 'an organization'
  const subjectLine = `New support chat from ${org}`
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{subjectLine}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{subjectLine}</Heading>
          <Text style={text}>
            A user from <strong>{org}</strong> just sent a support message.
          </Text>

          {(senderName || senderEmail) && (
            <Section style={metaBox}>
              {senderName && (
                <Text style={metaLine}>
                  <strong>From:</strong> {senderName}
                </Text>
              )}
              {senderEmail && (
                <Text style={metaLine}>
                  <strong>Email:</strong> {senderEmail}
                </Text>
              )}
            </Section>
          )}

          {messagePreview && (
            <Section style={messageBox}>
              <Text style={messageText}>"{messagePreview}"</Text>
            </Section>
          )}

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={`${APP_URL}/dashboard/support`} style={button}>
              Open support inbox
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you're a {SITE_NAME} support admin.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NewSupportMessageEmail,
  subject: (data: Record<string, any>) =>
    `New support chat from ${data?.orgName || 'an organization'}`,
  displayName: 'New support message',
  previewData: {
    orgName: 'Acme Nonprofit',
    senderName: 'Jane Doe',
    senderEmail: 'jane@acme.org',
    messagePreview: 'Hi! I need help setting up our donation form.',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const metaBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
}
const metaLine = { fontSize: '13px', color: '#475569', margin: '4px 0' }
const messageBox = {
  borderLeft: '3px solid #16a34a',
  paddingLeft: '16px',
  margin: '20px 0',
}
const messageText = {
  fontSize: '14px',
  color: '#1e293b',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: 0,
}
const button = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: 0 }
