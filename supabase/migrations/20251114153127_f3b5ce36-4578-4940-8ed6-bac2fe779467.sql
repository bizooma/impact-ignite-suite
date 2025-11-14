-- Add 'form' as a valid source type for CRM contacts
ALTER TABLE crm_contacts 
  DROP CONSTRAINT IF EXISTS crm_contacts_source_check;

ALTER TABLE crm_contacts 
  ADD CONSTRAINT crm_contacts_source_check 
  CHECK (source IN (
    'chatbot_volunteer',
    'chatbot_lead', 
    'qr_scan',
    'social_media',
    'mobile_app',
    'manual',
    'import',
    'form'
  ));