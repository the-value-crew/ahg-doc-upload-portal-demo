import { ChecklistItem, ChecklistStats, FileStatus, IndustryConfig } from './types'

/**
 * Builds the merged checklist by comparing the industry template with the merchant's uploaded rows.
 * Template serves as the single source of truth for document requirements, descriptions, tags, and sections.
 */
export function buildChecklist(industryConfig: IndustryConfig, docRows: any[]): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (!industryConfig || !Array.isArray(industryConfig.sections)) {
    return items
  }

  for (const section of industryConfig.sections) {
    if (!Array.isArray(section.documents)) continue
    for (const doc of section.documents) {
      const match = docRows.find((r) => {
        const typeNum = Number(r.document_type !== undefined ? r.document_type : r.documentType)
        return typeNum === doc.type
      })

      const status: FileStatus | 'not-uploaded' = match ? (Number(match.status) as FileStatus) : 'not-uploaded'
      const filename = match ? (match.filename || undefined) : undefined
      const uploadedAt = match ? (match.uploaded_at || match.uploadedAt || undefined) : undefined
      const note = match ? (match.note || null) : null
      const sharepointItemId = match ? (match.sharepoint_item_id || match.sharepointItemId || undefined) : undefined
      const hasFile = Boolean(filename || sharepointItemId)

      items.push({
        type: doc.type,
        name: doc.name,
        description: doc.description,
        tag: doc.tag || null,
        required: doc.required !== false,
        formUrl: doc.formUrl,
        sectionId: section.id,
        sectionTitle: section.title,
        status,
        filename,
        uploadedAt,
        note,
        sharepointItemId,
        isCustom: false,
        hasFile,
      })
    }
  }

  // Append per-merchant custom requested documents (type >= 1001 or custom_name present)
  const standardTypes = new Set(items.map((it) => it.type))
  const customRows = docRows
    .filter((r) => {
      const typeNum = Number(r.document_type !== undefined ? r.document_type : r.documentType)
      return !standardTypes.has(typeNum) && (Boolean(r.custom_name) || typeNum >= 1001)
    })
    .sort((a, b) => {
      const aType = Number(a.document_type !== undefined ? a.document_type : a.documentType)
      const bType = Number(b.document_type !== undefined ? b.document_type : b.documentType)
      return aType - bType
    })

  for (const r of customRows) {
    const typeNum = Number(r.document_type !== undefined ? r.document_type : r.documentType)
    const filename = r.filename || undefined
    const sharepointItemId = r.sharepoint_item_id || r.sharepointItemId || undefined
    const hasFile = Boolean(filename || sharepointItemId)
    const status: FileStatus | 'not-uploaded' = hasFile
      ? (Number(r.status) as FileStatus)
      : FileStatus.NOT_UPLOADED

    items.push({
      type: typeNum,
      name: r.custom_name || `Requested Document #${typeNum}`,
      description: r.custom_description || '',
      tag: r.custom_tag || null,
      required: r.custom_required !== 0,
      sectionId: 'requested_documents',
      sectionTitle: 'Requested Documents',
      status,
      filename,
      uploadedAt: r.uploaded_at || r.uploadedAt || undefined,
      note: r.note || null,
      sharepointItemId,
      isCustom: true,
      hasFile,
    })
  }

  return items
}

/**
 * Computes underwriting stats across all checklist items.
 * totalItems = notUploaded + pending + confirmed + rejected
 */
export function computeStats(items: ChecklistItem[]): ChecklistStats {
  let notUploaded = 0
  let pending = 0
  let confirmed = 0
  let rejected = 0

  for (const it of items) {
    const s = it.status
    if (s === 'not-uploaded' || (s as any) === FileStatus.NOT_UPLOADED || (s as any) === 0) {
      notUploaded++
    } else if (s === 1 || (s as any) === FileStatus.PENDING) {
      pending++
    } else if (s === 2 || (s as any) === FileStatus.VERIFIED || (s as any) === FileStatus.CONFIRMED) {
      confirmed++
    } else if (s === 3 || (s as any) === FileStatus.REJECTED) {
      rejected++
    } else {
      notUploaded++
    }
  }

  return {
    totalItems: items.length,
    notUploaded,
    pending,
    confirmed,
    rejected,
  }
}

