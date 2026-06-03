/** Returns YYYY-MM-DD for any Date using the browser's LOCAL timezone (not UTC) */
export function toLocalDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today's date as YYYY-MM-DD in local timezone */
export const localToday = () => toLocalDateStr(new Date())
