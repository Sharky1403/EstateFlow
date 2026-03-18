import { differenceInDays, parseISO } from 'date-fns'

export function daysUntilLeaseExpiry(endDate: string): number {
  return differenceInDays(parseISO(endDate), new Date())
}

export function isInsuranceExpired(expiryDate: string): boolean {
  return differenceInDays(parseISO(expiryDate), new Date()) < 0
}
