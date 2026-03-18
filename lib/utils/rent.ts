import { getDaysInMonth } from 'date-fns'

export function calculateProratedRent(moveInDate: Date, monthlyRent: number): number {
  const daysInMonth = getDaysInMonth(moveInDate)
  const dayOfMonth = moveInDate.getDate()
  const remainingDays = daysInMonth - dayOfMonth + 1
  const dailyRate = monthlyRent / daysInMonth
  return Math.round(dailyRate * remainingDays * 100) / 100
}
