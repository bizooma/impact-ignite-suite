-- Add CRM to Bizooma's purchased products
UPDATE organizations 
SET purchased_products = purchased_products || '["crm"]'::jsonb
WHERE name = 'Bizooma' AND NOT (purchased_products @> '["crm"]'::jsonb);