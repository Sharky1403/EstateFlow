export function calculateNOI(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses
}

export function isLateFeeApplicable(dueDayOfMonth: number, gracePeriodDays: number): boolean {
  const today = new Date().getDate()
  return today > dueDayOfMonth + gracePeriodDays
}
