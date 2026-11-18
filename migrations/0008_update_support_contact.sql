-- 0008_update_support_contact.sql: Update support_contact in app_config
INSERT OR REPLACE INTO app_config (key, value) VALUES
  ('support_contact', '{"name":"Scott Kaapke","role":"Merchant Onboarding Specialist","email":"skaapke@ahgpay.com","phone":"+1-754-732-3744","helpText":"Need help? Contact AHG Underwriting Support at support@ahgpay.com or call +1-754-732-3744."}');
