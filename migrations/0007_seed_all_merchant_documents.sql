-- 0007_seed_all_merchant_documents.sql: Populate verified document entries for all existing merchants
INSERT INTO documents (
  merchant_id,
  document_type,
  status,
  note,
  uploaded_at,
  status_updated_at,
  filename,
  sharepoint_item_id
)
SELECT
  m.id,
  CAST(json_extract(doc.value, '$.type') AS INTEGER),
  2,
  NULL,
  datetime('now'),
  datetime('now'),
  lower(
    replace(
      replace(
        replace(
          replace(
            replace(trim(substr(m.name, 1, 25)), ' ', '_'),
            '''', ''
          ),
          '"', ''
        ),
        '/', '_'
      ),
      '-', '_'
    )
  ) || '_doc_' || json_extract(doc.value, '$.type') || '.pdf',
  'sp-' || substr(m.id, 1, 6) || '-' || json_extract(doc.value, '$.type')
FROM merchants m
JOIN app_config c ON c.key = 'industries'
JOIN json_each(json_extract(c.value, '$.' || m.industry || '.sections')) sec
JOIN json_each(json_extract(sec.value, '$.documents')) doc
WHERE json_extract(c.value, '$.' || m.industry || '.sections') IS NOT NULL
ON CONFLICT(merchant_id, document_type) DO UPDATE SET
  status = 2,
  note = NULL,
  status_updated_at = datetime('now'),
  filename = COALESCE(documents.filename, excluded.filename),
  sharepoint_item_id = COALESCE(documents.sharepoint_item_id, excluded.sharepoint_item_id)
WHERE documents.sharepoint_item_id IS NULL
   OR documents.sharepoint_item_id NOT LIKE 'r2:%';
