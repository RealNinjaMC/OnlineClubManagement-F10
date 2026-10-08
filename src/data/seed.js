export const CATEGORIES = ['Academic', 'Arts', 'Culture', 'Games', 'Outdoors', 'Service', 'Sports', 'Tech']

export const CLUB_COLORS = ['#3E5C9A', '#8E4B32', '#6B4E9B', '#3F7D4E', '#A3416B', '#2F6F8F', '#9A6B1F', '#57534E']

export function toDateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function dateFromToday(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return toDateString(date)
}
