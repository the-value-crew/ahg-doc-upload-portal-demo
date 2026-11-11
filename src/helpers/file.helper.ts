/**
 * Truncates long filenames while always keeping the file extension visible
 * e.g. "Equilibria_Certificate_Incorporation.pdf" -> "Equilibria_Certificate_...pdf"
 */
export function formatTruncatedFilename(filename: string, maxBaseLength = 28): string {
  if (!filename) return 'Document'
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) {
    return filename.length > maxBaseLength ? filename.slice(0, maxBaseLength) + '...' : filename
  }

  const ext = filename.slice(lastDot)
  const base = filename.slice(0, lastDot)

  if (base.length <= maxBaseLength) {
    return filename
  }

  return `${base.slice(0, maxBaseLength)}...${ext}`
}
