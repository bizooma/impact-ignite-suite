-- Grant all products to Bizooma organization
UPDATE organizations 
SET purchased_products = '["mobile_app", "chatbots", "qr_codes", "social_media", "seo_audits", "google_business", "content_templates", "tasks", "analytics"]'::jsonb,
    updated_at = now()
WHERE slug = 'bizooma';