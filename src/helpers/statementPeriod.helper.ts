/**
 * Calculates the 3 most recent completed calendar months required for underwriting.
 * If the application is filed at the end of the month (e.g. within the last 3 days of the month),
 * or rolling into the next month, it includes the closing month notice.
 */
export function getRequiredStatementMonths(referenceDate: Date = new Date()): {
  months: string[]
  formattedText: string
  rollOverNotice?: string
} {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = referenceDate.getFullYear()
  const currentMonthIdx = referenceDate.getMonth() // 0-indexed
  const currentDate = referenceDate.getDate()

  // The 3 most recent complete calendar months prior to currentMonth
  const recentMonths: string[] = []
  for (let i = 3; i >= 1; i--) {
    let mIdx = currentMonthIdx - i
    let y = currentYear
    if (mIdx < 0) {
      mIdx += 12
      y -= 1
    }
    recentMonths.push(`${monthNames[mIdx]} ${y}`)
  }

  // Format: "August, September, and October 2026"
  const formattedText = `${recentMonths[0]}, ${recentMonths[1]}, and ${recentMonths[2]}`

  // Check end-of-month rollover (last 4 days of month)
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate()
  let rollOverNotice: string | undefined

  if (daysInMonth - currentDate <= 4) {
    const nextMonthName = monthNames[(currentMonthIdx + 1) % 12]
    rollOverNotice = `Note: If your application review completes in ${nextMonthName}, ${monthNames[currentMonthIdx]} statements will also be requested.`
  }

  return {
    months: recentMonths,
    formattedText,
    rollOverNotice,
  }
}

