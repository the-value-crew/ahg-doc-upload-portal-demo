-- 0009_add_custom_document_fields.sql: Per-merchant custom document request metadata
ALTER TABLE documents ADD COLUMN custom_name TEXT NULL;
ALTER TABLE documents ADD COLUMN custom_description TEXT NULL;
ALTER TABLE documents ADD COLUMN custom_required INTEGER NULL;
ALTER TABLE documents ADD COLUMN custom_tag TEXT NULL;
