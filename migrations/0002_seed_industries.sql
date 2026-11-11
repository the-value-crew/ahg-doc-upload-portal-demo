-- 0002_seed_industries.sql: Lookup table for supported industries
INSERT OR REPLACE INTO industries (key, label) VALUES
  ('peptide', 'Peptides & Research Chemicals'),
  ('hemp', 'Hemp & CBD Industry'),
  ('general', 'General High-Risk Industry'),
  ('kratom', 'Kratom Products'),
  ('mushroom', 'Metocin & Functional Mushroom'),
  ('medical_telehealth', 'Medical & Telehealth'),
  ('nonprofit', 'Nonprofit Organizations');
