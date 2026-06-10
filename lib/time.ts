export function format12h(time24?: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${minutes} ${ampm}`
}

export function to24h(hour12: number, minute: string, period: 'AM' | 'PM'): string {
  let h24 = period === 'PM' ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12)
  return `${String(h24).padStart(2, '0')}:${minute}`
}

export function parseScheduledTime(time24: string): { hour12: number; minute: string; period: 'AM' | 'PM' } {
  if (!time24) return { hour12: 12, minute: '00', period: 'AM' }
  const [hours, minutes] = time24.split(':')
  const h = parseInt(hours, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { hour12, minute: minutes, period }
}
